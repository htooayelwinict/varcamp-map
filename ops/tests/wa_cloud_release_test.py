"""First-publication contract: no overwrite, no editor-data loss, verified readback."""
import copy
import hashlib
import importlib.util
import io
import json
import pathlib
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from map_roster import MAP_IDS
from release_upload import inventory, read_zip, zip_bytes


class CloudReleaseTests(unittest.TestCase):
    def setUp(self):
        self.assertIsNotNone(importlib.util.find_spec('wa_cloud_release'), 'Guarded WA production publication is not implemented')
        import wa_cloud_release
        self.module = wa_cloud_release

    def fixture(self):
        release = {'assets/main.js': b'console.log("venue")'}
        saved = {}
        for name in MAP_IDS:
            release[f'maps/{name}.tmj'] = json.dumps({'properties': [{'name': 'script', 'value': '../assets/main.js'}], 'tilesets': [], 'layers': []}).encode()
            release[f'maps/{name}.wam'] = json.dumps({'mapUrl': name + '.tmj', 'areas': []}).encode()
            saved[f'maps/{name}.wam'] = json.dumps({
                'version': '2.1.0', 'mapUrl': name + '.tmj?v=' + '0' * 64,
                'entities': {'saved-chair': {'x': 80, 'y': 120}},
                'areas': [{'id': 'organizer', 'properties': [{'type': 'livekitRoomProperty', 'roomName': 'private-organizer'}]}],
                'metadata': {'name': name}, 'lastCommandId': 'keep-editor-history',
                'entityCollections': [{'url': 'https://varcamp.3-1-133-135.sslip.io/collections/OfficeCollection.json', 'type': 'file'}],
            }).encode()
        return release, saved

    def test_migration_keeps_saved_objects_meetings_and_metadata(self):
        release, saved = self.fixture()
        package = self.module.cloud_package(release, saved)
        before = json.loads(saved['maps/overworld.wam'])
        expected = copy.deepcopy(before)
        expected['mapUrl'] = 'overworld.tmj?v=' + hashlib.sha256(release['maps/overworld.tmj']).hexdigest()
        expected['entityCollections'][0]['url'] = 'https://play.workadventu.re/collections/OfficeCollection.json'
        self.assertEqual(json.loads(package['maps/overworld.wam']), expected)
        self.assertEqual(json.loads(saved['maps/overworld.wam']), before)
        self.assertEqual(package['assets/main.js'], release['assets/main.js'])

    def test_missing_saved_room_is_not_silently_replaced_by_blank_source(self):
        release, saved = self.fixture()
        del saved['maps/speaker-libra.wam']
        with self.assertRaisesRegex(ValueError, '34|roster'):
            self.module.cloud_package(release, saved)

    def test_hosted_doors_use_canonical_room_ids_and_pin_the_transformed_map(self):
        release, saved = self.fixture()
        tilemap = json.loads(release['maps/solar-hall.tmj'])
        tilemap['layers'] = [{'type': 'group', 'layers': [{
            'name': 'exit-plaza-return', 'type': 'tilelayer', 'data': [0, 1],
            'properties': [
                {'name': 'exitUrl', 'value': 'overworld.wam#from-solar'},
                {'name': 'exitSceneUrl', 'value': './overworld.wam#welcome'},
                {'name': 'description', 'value': 'overworld.wam is an asset filename'},
            ],
        }]}]
        release['maps/solar-hall.tmj'] = json.dumps(tilemap).encode()
        before = copy.deepcopy(release)
        package = self.module.cloud_package(release, saved)
        expected = copy.deepcopy(tilemap)
        props = expected['layers'][0]['layers'][0]['properties']
        props[0]['value'] = 'overworld#from-solar'
        props[1]['value'] = './overworld#welcome'
        self.assertEqual(json.loads(package['maps/solar-hall.tmj']), expected)
        self.assertEqual(release, before, 'Authored/devbox artifacts must remain unchanged')
        self.assertIn('maps/overworld.wam', package, 'Storage filenames keep their extension')
        self.assertEqual(json.loads(package['maps/solar-hall.wam'])['mapUrl'],
                         'solar-hall.tmj?v=' + hashlib.sha256(package['maps/solar-hall.tmj']).hexdigest())
        self.assertEqual(json.loads(package['maps/solar-hall.wam'])['areas'], json.loads(saved['maps/solar-hall.wam'])['areas'])
        self.assertEqual(self.module.cloud_room_routes(package), package, 'Canonicalization must be idempotent')

    def test_unknown_or_external_native_room_destinations_block_publication(self):
        for destination in ['missing.wam#entry', 'missing#entry', '../assets/main.js',
                            'https://other.example/room.wam', '/@/other/world/room', '../../escape.wam']:
            with self.subTest(destination=destination):
                release, saved = self.fixture()
                tilemap = json.loads(release['maps/solar-hall.tmj'])
                tilemap['layers'] = [{'properties': [{'name': 'exitUrl', 'value': destination}]}]
                release['maps/solar-hall.tmj'] = json.dumps(tilemap).encode()
                with self.assertRaises(ValueError):
                    self.module.cloud_package(release, saved)

    def test_old_host_and_missing_assets_block_upload(self):
        for mutation in ['missing-runtime', 'old-host', 'old-npc']:
            with self.subTest(mutation=mutation):
                release, saved = self.fixture()
                if mutation == 'missing-runtime':
                    del release['assets/main.js']
                elif mutation == 'old-host':
                    release['assets/main.js'] = b'fetch("https://varcamp.3-1-133-135.sslip.io/old-service")'
                else:
                    release['src/npc/index.html'] = b'old NPC'
                with self.assertRaises(ValueError):
                    self.module.cloud_package(release, saved)

    def test_initial_publish_checks_whole_world_and_preserves_existing_room(self):
        baseline = {'small-forest-office.wam': b'{"metadata":{"name":"Existing room"}}'}
        package = {'maps/overworld.wam': b'new'}
        events = []
        class Storage:
            def __init__(self): self.files = dict(baseline)
            def download(self): events.append('download'); return zip_bytes(self.files)
            def upload(self, target, files):
                events.append('upload:' + target)
                self.files.update({target + '/' + k: v for k, v in files.items()})
                return 200
        storage = Storage()
        result = self.module.publish_initial(storage, 'varcamp-2026', baseline, package, wait=lambda n: events.append(n))
        self.assertEqual(events, ['download', 16, 'download', 'upload:varcamp-2026', 'download', 16, 'download'])
        self.assertEqual(len(result), 2)
        self.assertEqual(read_zip(result[-1]), {**baseline, 'varcamp-2026/maps/overworld.wam': b'new'})

    def test_occupied_root_or_changed_baseline_prevents_writes(self):
        for target, baseline, current in [
            ('', {}, {}), ('/', {}, {}), ('../event', {}, {}),
            ('varcamp-2026', {'varcamp-2026/maps/overworld.wam': b'saved'}, {'varcamp-2026/maps/overworld.wam': b'saved'}),
            ('varcamp-2026', {'other.wam': b'old'}, {'other.wam': b'edited'}),
        ]:
            with self.subTest(target=target, current=current):
                class Storage:
                    def download(self): return zip_bytes(current)
                    def upload(self, *_): self.fail('Must not upload')
                with self.assertRaises(ValueError):
                    self.module.publish_initial(Storage(), target, baseline, {'maps/new.wam': b'new'}, wait=lambda _: None)

    def test_different_readback_stops_without_retry(self):
        class Storage:
            writes = 0
            def download(self): return zip_bytes({} if not self.writes else {'unexpected.wam': b'changed'})
            def upload(self, *_): self.writes += 1; return 200
        storage = Storage()
        with self.assertRaisesRegex(ValueError, 'readback'):
            self.module.publish_initial(storage, 'varcamp-2026', {}, {'maps/new.wam': b'new'}, wait=lambda _: None)
        self.assertEqual(storage.writes, 1)

    def test_transport_uses_bearer_auth_and_official_upload_host_only(self):
        requests = []
        endpoint = {'url': 'https://map-storage-upload.workadventu.re/upload'}
        class Response(io.BytesIO):
            status = 200
        class Opener:
            def open(self, request, **kwargs):
                requests.append(request)
                return Response(json.dumps(endpoint).encode() if request.full_url.endswith('/upload-endpoint') else b'ok')
        with tempfile.TemporaryDirectory() as directory:
            env = pathlib.Path(directory) / 'cloud.env'
            env.write_text('MAP_STORAGE_URL=https://world-43813.map-storage.workadventu.re\nMAP_STORAGE_API_KEY=dummy-private-key\nUPLOAD_DIRECTORY=varcamp-2026\n')
            with patch.object(self.module, 'create_opener', return_value=Opener()):
                storage = self.module.CloudStorage(env)
                storage.upload('varcamp-2026', {'maps/a.wam': b'{}'})
                post = requests[-1]
                self.assertEqual(post.full_url, 'https://map-storage-upload.workadventu.re/upload')
                self.assertEqual(post.get_header('Authorization'), 'Bearer dummy-private-key')
                self.assertEqual(post.get_header('X-map-storage-host'), 'world-43813.map-storage.workadventu.re')
                self.assertIn(b'name="directory"\r\n\r\nvarcamp-2026', post.data)
                self.assertIn(b'name="apiKey"\r\n\r\ndummy-private-key', post.data)
                endpoint['url'] = 'https://attacker.example/upload'
                count = len(requests)
                with self.assertRaises(ValueError): storage.upload('varcamp-2026', {})
                self.assertEqual(len(requests), count + 1)


if __name__ == '__main__':
    unittest.main()
