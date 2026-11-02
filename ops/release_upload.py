"""Replacement ZIP planning and Basic-over-HTTPS transport; credentials never in argv."""
import base64
import hashlib
import io
import json
import re
import pathlib
import secrets
import urllib.error
import urllib.parse
import urllib.request
import zipfile

from verified_transport import create_opener
from map_roster import MAP_IDS
from auditorium_spacing import is_auditorium_spacing_wam_change


def wam_reference(path, data):
    """Validate a root reference and locate its literal hash without reserializing."""
    def unique_object(pairs):
        obj = {}
        for key, value in pairs:
            if key in obj:
                raise ValueError(f'{path}: duplicate JSON key {key}')
            obj[key] = value
        return obj

    def invalid_constant(value):
        raise ValueError(f'non-JSON constant {value}')

    try:
        text = data.decode('utf-8')
        obj = json.loads(text, object_pairs_hook=unique_object, parse_constant=invalid_constant)
    except (UnicodeError, ValueError) as error:
        raise ValueError(f'{path}: malformed WAM: {error}') from error
    basename = pathlib.PurePosixPath(path).with_suffix('.tmj').name
    pattern = re.escape(basename) + r'\?v=([0-9a-f]{64})'
    if not isinstance(obj, dict) or not isinstance(obj.get('mapUrl'), str):
        raise ValueError(f'{path}: root mapUrl string required')
    match = re.fullmatch(pattern, obj['mapUrl'])
    if not match:
        raise ValueError(f'{path}: mapUrl must be {basename}?v=<64 lowercase hex>')
    # Scan root members with the JSON decoder so nested mapUrl fields cannot
    # accidentally become the migration target. Full JSON was validated above.
    decoder = json.JSONDecoder()
    position = text.index('{') + 1
    while True:
        position = re.match(r'\s*', text[position:]).end() + position
        key, position = decoder.raw_decode(text, position)
        position = text.index(':', position) + 1
        position = re.match(r'\s*', text[position:]).end() + position
        start = position
        _, position = decoder.raw_decode(text, position)
        if key == 'mapUrl':
            literal = text[start:position]
            if literal != '"' + obj['mapUrl'] + '"':
                raise ValueError(f'{path}: mapUrl must use a literal version token')
            token_start = position - 65
            return match.group(1), (text[:token_start] + '<VERSION>' + text[token_start + 64:]).encode('utf-8')
        position = re.match(r'\s*', text[position:]).end() + position
        position += 1  # comma; a root mapUrl is known to exist


def _presentation_wam_candidate(data, map_id, revision_path):
    """Named native-area successors retain all independent editor data.

    Ordinary reviewed WAMs remain token-only. Missing revision files and already
    changed/customized owned areas fail closed rather than granting a general
    metadata-write escape hatch to a copied standalone publisher.
    """
    import copy
    root = pathlib.Path(__file__).resolve().parent.parent
    try:
        spec = json.loads((root / revision_path).read_text())
        if revision_path == 'world/speaker-presentation.json':
            if spec.get('version') != 1 or set(spec.get('rooms', {})) != set(SPEAKER_PRESENTATION_IDS):
                return None
            spec = {'version': 1, 'mapId': map_id, **spec['rooms'][map_id]}
        contract = json.loads((root / 'world/interior-reference-contract.json').read_text())
    except (OSError, ValueError):
        return None
    if spec.get('version') != 1 or spec.get('mapId') != map_id or contract.get('version') != 1:
        return None
    expected_old = next((a for a in contract['maps'][map_id]['functional']['areas'] if a.get('id') == 'meeting-' + map_id[8:]), None)
    rows = spec.get('areas', [])
    if len(rows) != 2 or rows[0].get('id') != 'meeting-' + map_id[8:] or rows[1].get('id') != map_id[8:] + '-audience' or not expected_old:
        return None
    def native(area):
        return {'id': area['id'], 'name': area['name'], 'visible': True,
                **{k: area[k] * 32 for k in ('x', 'y', 'width', 'height')},
                'properties': copy.deepcopy(area['properties'])}
    if not isinstance(data, dict) or not isinstance(data.get('areas'), list) or any(not isinstance(a, dict) for a in data['areas']):
        return None
    same_json = lambda a, b: json.dumps(a, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False) == json.dumps(b, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)
    matching = [a for a in data['areas'] if a.get('id') == 'meeting-' + map_id[8:]]
    if len(matching) != 1 or any(not same_json(matching[0].get(k), v) for k, v in native(expected_old).items()):
        return None
    audience = native(rows[1])
    if any(a.get('id') == audience['id'] or a.get('name') == audience['name'] for a in data['areas']):
        return None
    result = copy.deepcopy(data)
    result['areas'] = [{**a, **native(rows[0])} if a.get('id') == 'meeting-' + map_id[8:] else a for a in result['areas']]
    result['areas'].append(audience)
    area_ids, area_names, property_ids, owners = set(), set(), set(), set()
    for area in result['areas']:
        for key, seen in [('id', area_ids), ('name', area_names)]:
            value = area.get(key)
            if not isinstance(value, str) or not value or value in seen:
                return None
            seen.add(value)
        properties = area.get('properties')
        if not isinstance(properties, list) or any(not isinstance(p, dict) for p in properties):
            return None
        for prop in properties:
            identity = prop.get('id')
            if not isinstance(identity, str) or not identity or identity in property_ids:
                return None
            property_ids.add(identity)
            owner_key = 'name' if prop.get('type') == 'speakerMegaphone' else 'roomName' if prop.get('type') == 'livekitRoomProperty' else None
            if owner_key:
                value = prop.get(owner_key)
                if not isinstance(value, str) or not value:
                    return None
                owner = (prop['type'], value)
                if owner in owners:
                    return None
                owners.add(owner)
    return result


SPEAKER_PRESENTATION_IDS = tuple('speaker-' + sign for sign in (
    'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio',
    'sagittarius', 'capricorn', 'aquarius', 'pisces'))


def aries_presentation_wam_candidate(data):
    return _presentation_wam_candidate(data, 'speaker-aries', 'world/aries-presentation.json')


def speaker_presentation_wam_candidate(path, data):
    map_id = pathlib.PurePosixPath(path).stem
    if map_id not in SPEAKER_PRESENTATION_IDS or path != 'maps/' + map_id + '.wam':
        return None
    return _presentation_wam_candidate(data, map_id, 'world/speaker-presentation.json')


def is_speaker_presentation_wam_change(path, before, after):
    expected = speaker_presentation_wam_candidate(path, json.loads(before))
    actual = json.loads(after)
    if expected is None:
        return False
    expected['mapUrl'] = actual.get('mapUrl')
    return json.dumps(expected, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False) == json.dumps(actual, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def is_aries_presentation_wam_change(path, before, after):
    if path != 'maps/speaker-aries.wam':
        return False
    expected = aries_presentation_wam_candidate(json.loads(before))
    actual = json.loads(after)
    if expected is None:
        return False
    expected['mapUrl'] = actual.get('mapUrl')
    return json.dumps(expected, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False) == json.dumps(actual, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def wam_dependencies(release, baseline, reviewed_wams=None):
    """Own generated references while preserving all live organizer bytes."""
    reviewed_wams = reviewed_wams or {}
    if any(p not in release or not p.endswith('.wam') or p not in baseline
           or p[:-4] + '.tmj' not in release for p in reviewed_wams):
        raise ValueError('Reviewed WAM must be an explicit paired release and baseline WAM path')
    final = dict(baseline)
    final.update(release)
    dependencies = {}
    for path in sorted(p for p in final if p.endswith('.wam') and p[:-4] + '.tmj' in final):
        source = baseline.get(path, release.get(path))
        candidate = reviewed_wams.get(path, source)
        pin, protected = wam_reference(path, candidate)
        tmj = path[:-4] + '.tmj'
        expected_pin = hashlib.sha256(final[tmj]).hexdigest()
        if pin != expected_pin:
            raise ValueError(f'{path}: stale mapUrl pin {pin}; final {tmj} requires {expected_pin}; supply an explicit reviewed token-only migration')
        named_migration = None
        if path in reviewed_wams:
            _, original_protected = wam_reference(path, baseline[path])
            if protected != original_protected:
                if is_aries_presentation_wam_change(path, baseline[path], candidate):
                    named_migration = 'aries-presentation-v1'
                elif is_speaker_presentation_wam_change(path, baseline[path], candidate):
                    named_migration = 'speaker-presentation-v1'
                elif is_auditorium_spacing_wam_change(path, baseline[path], candidate):
                    named_migration = 'auditorium-spacing-v1'
            if protected != original_protected and not named_migration:
                raise ValueError(f'{path}: reviewed migration must preserve every byte outside the mapUrl version token')
        dependencies[path] = {
            'tmj': tmj, 'tmjSha256': expected_pin,
            'fromWamSha256': hashlib.sha256(source).hexdigest(),
            'toWamSha256': hashlib.sha256(candidate).hexdigest(),
            'reviewed': path in reviewed_wams,
        }
        if named_migration:
            dependencies[path]['migration'] = named_migration
    return dependencies


def replacement_files(release, baseline, reviewed_wams=None):
    """Preserve saved WAMs only when their final TMJ dependency is exact.

    Explicit reviewed migrations replace version-token bytes or the named Aries
    presentation areas while retaining all independent organizer data. Callers
    must still establish a quiet window to protect concurrent editor writes.
    """
    reviewed_wams = reviewed_wams or {}
    wam_dependencies(release, baseline, reviewed_wams)
    files = dict(baseline)
    files.update(release)
    for path in baseline:
        if path.endswith('.wam') and path[:-4] + '.tmj' in files:
            files.pop(path, None)
    files.update(reviewed_wams)
    return files


def zip_bytes(files):
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, data in sorted(files.items()):
            path = pathlib.PurePosixPath(name)
            if path.is_absolute() or any(p.startswith('.') for p in path.parts) or '\\' in name:
                raise ValueError('Unsafe or filtered archive path')
            archive.writestr(name, data)
    return output.getvalue()


def read_zip(data):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = [n for n in archive.namelist() if not n.endswith('/')]
        if len(names) != len(set(names)):
            raise ValueError('Duplicate archive paths')
        files = {name: archive.read(name) for name in names}
    zip_bytes(files)  # Validate paths before any extraction/replacement.
    return files


def inventory(files):
    return {p: hashlib.sha256(data).hexdigest() for p, data in sorted(files.items())}


def validate_release_maps(release, expected_map_ids):
    maps = {p[:-4] for p in release if p.endswith('.tmj')}
    wams = {p[:-4] for p in release if p.endswith('.wam')}
    expected = {f'maps/{map_id}' for map_id in expected_map_ids}
    if len(maps) != len(expected) or maps != wams or maps != expected:
        raise ValueError('Build and verify exactly the catalog map pairs first')



class Storage:
    def __init__(self, environment):
        env = dict(line.split('=', 1) for line in pathlib.Path(environment).read_text().splitlines())
        self.host = 'https://' + env['MAPS_HOST']
        parsed = urllib.parse.urlsplit(self.host)
        if parsed.scheme != 'https' or parsed.username or parsed.path or parsed.query or parsed.fragment:
            raise ValueError('A trusted HTTPS host is required')
        self.headers = {'Authorization': 'Basic ' + base64.b64encode((env['UPLOAD_USER'] + ':' + env['UPLOAD_PASSWORD']).encode()).decode(), 'X-Map-Storage-Host': env['MAPS_HOST']}
        self.opener = create_opener()

    def request(self, path, method='GET', data=None, headers=None):
        request = urllib.request.Request(self.host + path, method=method, data=data, headers=self.headers | (headers or {}))
        with self.opener.open(request, timeout=60) as response:
            return response.status, response.read()

    def download(self, target):
        return self.request('/download?' + urllib.parse.urlencode({'directory': target}))[1]

    def upload(self, target, files):
        if not target or any(p.startswith('.') or not p for p in target.split('/')):
            raise ValueError('Explicit safe target directory required')
        boundary = '----VarCamp' + secrets.token_hex(16)
        body = (f'--{boundary}\r\nContent-Disposition: form-data; name="directory"\r\n\r\n{target}\r\n--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="release.zip"\r\nContent-Type: application/zip\r\n\r\n').encode() + zip_bytes(files) + f'\r\n--{boundary}--\r\n'.encode()
        return self.request('/upload', 'POST', body, {'Content-Type': 'multipart/form-data; boundary=' + boundary})[0]


def apply_plan(storage, target, baseline, package, expected, wait=None):
    import time
    wait = wait or time.sleep
    for attempt in range(2):
        if inventory(read_zip(storage.download(target))) != baseline:
            raise ValueError('Live baseline changed; abort and reconcile fresh editor state')
        if attempt == 0:
            wait(16)
    if storage.upload(target, package) != 200:
        raise ValueError('Upload failed; inspect live state before recovery')
    receipts = []
    for attempt in range(2):
        current = storage.download(target)
        if inventory(read_zip(current)) != expected:
            raise ValueError('Complete readback differs; preserve evidence, do not replay stale WAMs')
        receipts.append(current)
        if attempt == 0:
            wait(16)
    return receipts


def main():
    import argparse
    import json
    parser = argparse.ArgumentParser(description='Prepare/review then apply a complete live-preserving release')
    parser.add_argument('action', choices=['prepare', 'apply'])
    parser.add_argument('--plan', required=True, type=pathlib.Path)
    parser.add_argument('--target')
    parser.add_argument('--reviewed-wams', type=pathlib.Path)
    parser.add_argument('--quiet-editor-window', action='store_true')
    parser.add_argument('--environment', type=pathlib.Path, default=pathlib.Path(__file__).parent / 'private/environment')
    args = parser.parse_args()
    storage = Storage(args.environment)
    plan = args.plan
    if args.action == 'prepare':
        if not args.target:
            parser.error('--target is required to prepare')
        if plan.exists():
            parser.error('Use a new plan directory; retained recovery must not be overwritten')
        release = {str(p.relative_to('dist')): p.read_bytes() for p in pathlib.Path('dist').rglob('*') if p.is_file()}
        validate_release_maps(release, MAP_IDS)
        baseline_bytes = storage.download(args.target)
        baseline = read_zip(baseline_bytes)
        reviewed = read_zip(args.reviewed_wams.read_bytes()) if args.reviewed_wams else {}
        package = replacement_files(release, baseline, reviewed)
        expected = dict(baseline)
        expected.update(package)
        plan.mkdir(parents=True)
        (plan / 'baseline.zip').write_bytes(baseline_bytes)
        (plan / 'release.zip').write_bytes(zip_bytes(release))
        (plan / 'package.zip').write_bytes(zip_bytes(package))
        manifest = {'planVersion': 2, 'target': args.target, 'baseline': inventory(baseline), 'package': inventory(package), 'expected': inventory(expected), 'reviewedWams': inventory(reviewed), 'wamDependencies': wam_dependencies(release, baseline, reviewed), 'preservedWams': [p for p in baseline if p.endswith('.wam') and p not in package]}
        (plan / 'plan.json').write_text(json.dumps(manifest, indent=2) + '\n')
        print(json.dumps({'prepared': str(plan), 'target': args.target, 'releaseFiles': len(release), 'uploadFiles': len(package), 'expectedLiveFiles': len(expected), 'preservedWams': len(manifest['preservedWams'])}))
    else:
        if not args.quiet_editor_window:
            parser.error('Coordinate and confirm a quiet editor window before --quiet-editor-window')
        manifest = json.loads((plan / 'plan.json').read_text())
        package = read_zip((plan / 'package.zip').read_bytes())
        if manifest.get('planVersion') != 2 or not isinstance(manifest.get('wamDependencies'), dict):
            raise ValueError('Legacy or missing release dependency contract; prepare a new reviewed plan')
        baseline = read_zip((plan / 'baseline.zip').read_bytes())
        release = read_zip((plan / 'release.zip').read_bytes())
        if inventory(package) != manifest['package'] or inventory(baseline) != manifest['baseline']:
            raise ValueError('Prepared artifact changed; prepare a new reviewed plan')
        reviewed_records = manifest.get('reviewedWams')
        if not isinstance(reviewed_records, dict) or any(path not in package for path in reviewed_records):
            raise ValueError('Invalid reviewed WAM identities; prepare a new reviewed plan')
        reviewed = {path: package[path] for path in reviewed_records}
        if inventory(reviewed) != reviewed_records:
            raise ValueError('Reviewed WAM bytes changed; prepare a new reviewed plan')
        # Rebuild from retained inputs. This validates the exact effective graph,
        # migration ownership, and from/to identities before any live upload.
        dependencies = wam_dependencies(release, baseline, reviewed)
        rebuilt_package = replacement_files(release, baseline, reviewed)
        expected = dict(baseline)
        expected.update(package)
        preserved = [path for path in baseline if path.endswith('.wam') and path not in package]
        if (dependencies != manifest['wamDependencies'] or package != rebuilt_package
                or inventory(expected) != manifest['expected']
                or preserved != manifest.get('preservedWams')):
            raise ValueError('Prepared release graph or dependency identities changed; prepare a new reviewed plan')
        receipts = apply_plan(storage, manifest['target'], manifest['baseline'], package, manifest['expected'])
        for i, data in enumerate(receipts):
            (plan / ('readback-' + str(i + 1) + '.zip')).write_bytes(data)
        print(json.dumps({'upload': 200, 'target': manifest['target'], 'completeReadbacks': 2, 'expectedLiveFiles': len(manifest['expected'])}))


if __name__ == '__main__':
    main()
