"""Guarded first publication to the sponsored VarCamp WA world.

Existing event directories are deliberately refused. Subsequent releases must
reconcile the cloud's current editor data, not replay this migration snapshot.
"""
import argparse
import hashlib
import json
import pathlib
import posixpath
import secrets
import time
import urllib.parse
import urllib.request

from map_roster import MAP_IDS
from release_upload import inventory, read_zip, validate_release_maps, wam_reference, zip_bytes
from verified_transport import create_opener

HOST = 'https://world-43813.map-storage.workadventu.re'
TARGET = 'varcamp-2026'
UPLOAD_URL = 'https://map-storage-upload.workadventu.re/upload'
OLD_ORIGIN = 'https://varcamp.3-1-133-135.sslip.io'
COLLECTION_URLS = {
    OLD_ORIGIN + '/collections/' + name: 'https://play.workadventu.re/collections/' + name
    for name in ('FurnitureCollection.json', 'OfficeCollection.json')
}


def safe_initial_target(target, baseline):
    if target != TARGET:
        raise ValueError('Only the approved production directory varcamp-2026 is allowed')
    if any(p == target or p.startswith(target + '/') for p in baseline):
        raise ValueError('Production directory already exists; reconcile live editor state before updating')


def cloud_package(release, saved_wams):
    validate_release_maps(release, MAP_IDS)
    if set(saved_wams) != {f'maps/{name}.wam' for name in MAP_IDS}:
        raise ValueError('Saved WAM roster must contain all 34 rooms')
    package = dict(release)
    for path, raw in saved_wams.items():
        wam_reference(path, raw)
        wam = json.loads(raw)
        tmj = path[:-4] + '.tmj'
        wam['mapUrl'] = pathlib.PurePosixPath(tmj).name + '?v=' + hashlib.sha256(release[tmj]).hexdigest()
        for collection in wam.get('entityCollections', []):
            collection['url'] = COLLECTION_URLS.get(collection['url'], collection['url'])
        package[path] = json.dumps(wam, ensure_ascii=False, separators=(',', ':')).encode()

    def dependency(owner, reference):
        url = urllib.parse.urlsplit(reference)
        if url.scheme or url.netloc or url.path.startswith('/'):
            raise ValueError(f'{owner}: map dependency must remain relative: {reference}')
        path = posixpath.normpath(posixpath.join(posixpath.dirname(owner), url.path))
        if path not in package:
            raise ValueError(f'{owner}: missing map dependency {path}')

    def map_dependencies(owner, value):
        if isinstance(value, dict):
            for key in ('image', 'source'):
                if isinstance(value.get(key), str):
                    dependency(owner, value[key])
            if value.get('name') in ('script', 'playAudio', 'exitUrl', 'exitSceneUrl'):
                dependency(owner, value['value'])
            for child in value.values():
                map_dependencies(owner, child)
        elif isinstance(value, list):
            for child in value:
                map_dependencies(owner, child)

    for path, data in package.items():
        if path.startswith(('bots/', 'src/npc/', 'src/guides/')):
            raise ValueError('Retired NPC or guide executable in cloud package')
        if not path.startswith('credits/') and path.endswith(('.js', '.html', '.json', '.wam', '.tmj')):
            if b'3-1-133-135.sslip.io' in data or b'varcamp-npc/chat' in data:
                raise ValueError(f'{path}: runtime still depends on the old devbox')
        if path.endswith('.tmj'):
            map_dependencies(path, json.loads(data))
    zip_bytes(package)  # Apply the shared safe archive-path contract.
    return package


class CloudStorage:
    def __init__(self, environment):
        env = dict(line.split('=', 1) for line in pathlib.Path(environment).read_text().splitlines() if line and not line.startswith('#'))
        if env['MAP_STORAGE_URL'].rstrip('/') != HOST or env['UPLOAD_DIRECTORY'] != TARGET:
            raise ValueError('Cloud credentials do not select the approved event production target')
        self.api_key = env['MAP_STORAGE_API_KEY']
        self.headers = {'Authorization': 'Bearer ' + self.api_key,
                        'X-Map-Storage-Host': urllib.parse.urlsplit(HOST).netloc,
                        'User-Agent': 'VarCamp-Release/1.0'}
        self.opener = create_opener()

    def request(self, url, method='GET', data=None, headers=None):
        if not (url.startswith(HOST + '/') or url == UPLOAD_URL):
            raise ValueError('Untrusted cloud endpoint')
        request = urllib.request.Request(url, data=data, method=method, headers=self.headers | (headers or {}))
        with self.opener.open(request, timeout=120) as response:
            return response.status, response.read()

    def download(self):
        return self.request(HOST + '/download?directory=')[1]

    def upload(self, target, files):
        safe_initial_target(target, {})
        endpoint = json.loads(self.request(HOST + '/upload-endpoint')[1])['url']
        if endpoint not in (UPLOAD_URL, HOST + '/upload'):
            raise ValueError('Untrusted discovered upload endpoint')
        boundary = '----VarCamp' + secrets.token_hex(16)
        body = (f'--{boundary}\r\nContent-Disposition: form-data; name="apiKey"\r\n\r\n{self.api_key}\r\n'
                f'--{boundary}\r\nContent-Disposition: form-data; name="directory"\r\n\r\n{target}\r\n'
                f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="release.zip"\r\nContent-Type: application/zip\r\n\r\n').encode()
        body += zip_bytes(files) + f'\r\n--{boundary}--\r\n'.encode()
        return self.request(endpoint, 'POST', body, {'Content-Type': 'multipart/form-data; boundary=' + boundary})[0]


def publish_initial(storage, target, baseline, package, wait=time.sleep, retain=None):
    safe_initial_target(target, baseline)
    before = inventory(baseline)
    expected = inventory({**baseline, **{target + '/' + p: b for p, b in package.items()}})
    for i in range(2):
        if inventory(read_zip(storage.download())) != before:
            raise ValueError('Live baseline changed; stop and reconcile')
        if i == 0:
            wait(16)
    if storage.upload(target, package) != 200:
        raise ValueError('Upload not confirmed; inspect live state without retrying')
    receipts = []
    for i in range(2):
        data = storage.download()
        if retain:
            retain(i, data)
        if inventory(read_zip(data)) != expected:
            raise ValueError('Cloud readback differs; preserve evidence and do not retry')
        receipts.append(data)
        if i == 0:
            wait(16)
    return receipts


def files_under(directory):
    root = pathlib.Path(directory)
    return {p.relative_to(root).as_posix(): p.read_bytes() for p in root.rglob('*') if p.is_file()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'apply'])
    parser.add_argument('--plan', required=True, type=pathlib.Path)
    parser.add_argument('--environment', default='ops/private/wa-cloud.env')
    parser.add_argument('--saved-wams', type=pathlib.Path)
    args = parser.parse_args()
    storage = CloudStorage(args.environment)
    plan = args.plan
    if args.action == 'prepare':
        if plan.exists() or not args.saved_wams:
            parser.error('Use a new plan directory and provide --saved-wams')
        release = files_under('dist')
        saved = {'maps/' + p: b for p, b in files_under(args.saved_wams).items()}
        package = cloud_package(release, saved)
        baseline_bytes = storage.download()
        baseline = read_zip(baseline_bytes)
        safe_initial_target(TARGET, baseline)
        plan.mkdir(parents=True)
        (plan / 'baseline.zip').write_bytes(baseline_bytes)
        for name, files in [('release', release), ('saved-wams', saved), ('package', package)]:
            (plan / (name + '.zip')).write_bytes(zip_bytes(files))
        manifest = {'version': 1, 'host': HOST, 'target': TARGET, 'baseline': inventory(baseline),
                    'release': inventory(release), 'savedWams': inventory(saved), 'package': inventory(package)}
        (plan / 'plan.json').write_text(json.dumps(manifest, indent=2) + '\n')
        print(json.dumps({'prepared': str(plan), 'target': TARGET, 'maps': len(saved), 'files': len(package), 'preservedExistingFiles': len(baseline)}))
        return
    manifest = json.loads((plan / 'plan.json').read_text())
    if (manifest.get('version'), manifest.get('host'), manifest.get('target')) != (1, HOST, TARGET):
        raise ValueError('Unexpected publication plan target')
    baseline = read_zip((plan / 'baseline.zip').read_bytes())
    release = read_zip((plan / 'release.zip').read_bytes())
    saved = read_zip((plan / 'saved-wams.zip').read_bytes())
    package = read_zip((plan / 'package.zip').read_bytes())
    for key, files in [('baseline', baseline), ('release', release), ('savedWams', saved), ('package', package)]:
        if inventory(files) != manifest[key]:
            raise ValueError('Prepared artifact changed: ' + key)
    if cloud_package(release, saved) != package:
        raise ValueError('Prepared migration differs from the exact retained inputs')
    receipts = publish_initial(storage, TARGET, baseline, package,
                               retain=lambda i, data: (plan / f'readback-{i + 1}.zip').write_bytes(data))
    receipt = {'target': TARGET, 'host': HOST, 'completeReadbacks': len(receipts), 'maps': len(saved), 'files': len(package), 'preservedExistingFiles': len(baseline)}
    (plan / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
