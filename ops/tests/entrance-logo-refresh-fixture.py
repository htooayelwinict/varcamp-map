"""Exercise the hosted cache refresh without regenerating organizer data."""
import copy
import hashlib
import json
from pathlib import Path
import struct
import sys
import zlib

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'ops'))
from map_roster import MAP_IDS
from release_upload import wam_reference

ROOMS = tuple(x for x in MAP_IDS if x.startswith('speaker-'))
OLD_HASH = 'dcd17f1e33d49192d2ef1eaae7df3bf4bc1c50b89a5e6455c4ed474fc1c89eaa'
OLD_PATH = f'assets/sponsors/sponsor-digisec-entrance.{OLD_HASH}.png'
OLD_URL = '../' + OLD_PATH
PNG = (ROOT / 'assets/sponsors/sponsor-digisec-entrance.png').read_bytes()
NEW_HASH = hashlib.sha256(PNG).hexdigest()
NEW_PATH = f'assets/sponsors/sponsor-digisec-entrance.{NEW_HASH}.png'
NEW_URL = '../' + NEW_PATH
assert OLD_HASH != NEW_HASH, 'The accepted enlargement must differ from the previous plaque'


def refresh(live, png=PNG):
    try:
        from entrance_logo_refresh import entrance_logo_refresh
    except ModuleNotFoundError as error:
        if error.name != 'entrance_logo_refresh':
            raise
        raise AssertionError('Hosted logo refresh is absent; the 12 rooms retain the old cached image URL') from None
    return entrance_logo_refresh(live, png)


def encode(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def baseline():
    result = {OLD_PATH: (ROOT / 'tests/fixtures/sponsor-digisec-entrance-plaque-before.png').read_bytes(),
              'unrelated.bin': b'preserve every unrelated asset'}
    assert hashlib.sha256(result[OLD_PATH]).hexdigest() == OLD_HASH
    for index, room in enumerate(ROOMS):
        tmj = {'width': 66, 'height': 46, 'tilewidth': 32, 'tileheight': 32,
               'properties': [{'name': 'owner-note', 'type': 'string', 'value': 'unchanged'}],
               'layers': [{'name': 'owner-layer', 'type': 'objectgroup', 'objects': [{'id': 500, 'name': 'manual'}]},
                          {'name': 'Entrance / DigiSec Lab', 'type': 'tilelayer', 'data': list(range(1, 13))}],
               'tilesets': [{'firstgid': 1 + index, 'name': 'Entrance / DigiSec Lab',
                             'tilewidth': 32, 'tileheight': 32, 'columns': 6, 'tilecount': 12,
                             'image': OLD_URL, 'imagewidth': 192, 'imageheight': 64,
                             'properties': [{'name': 'sponsorPanel', 'type': 'bool', 'value': True}]}]}
        path = f'maps/{room}.tmj'
        result[path] = encode(tmj)
        result[f'maps/{room}.wam'] = encode({
            'version': '1.0.0', 'mapUrl': f'{room}.tmj?v=' + hashlib.sha256(result[path]).hexdigest(),
            'entities': {'owner-desk': {'x': 711, 'y': 512}},
            'areas': [{'id': 'owner-chat', 'x': 100, 'y': 100, 'width': 100, 'height': 100, 'properties': []}],
            'metadata': {'name': 'Owner wording — untouched'}, 'lastCommandId': 'owner-command'})
    return result


live = baseline()
saved = copy.deepcopy(live)
delta = refresh(live)
assert len(delta) == 25
assert set(delta) == {NEW_PATH} | {f'maps/{room}.{ext}' for room in ROOMS for ext in ['tmj', 'wam']}
assert delta[NEW_PATH] == PNG
assert live == saved, 'Refresh mutated its input'
for room in ROOMS:
    tmj, wam = f'maps/{room}.tmj', f'maps/{room}.wam'
    assert delta[tmj] == live[tmj].replace(OLD_URL.encode(), NEW_URL.encode())
    before, after = json.loads(live[tmj]), json.loads(delta[tmj])
    after['tilesets'][0]['image'] = OLD_URL
    assert before == after, 'A layer, object or map field changed'
    pin, protected = wam_reference(wam, delta[wam])
    assert pin == hashlib.sha256(delta[tmj]).hexdigest()
    assert protected == wam_reference(wam, live[wam])[1]
    assert len(live[wam]) == len(delta[wam])
assert refresh(live | delta) == {}, 'Second application must be a no-op'
assert OLD_PATH in live | delta, 'The old asset must not be deleted'

# A prior partial refresh is allowed only when both existing references and pins are valid.
partial = live | {key: value for key, value in delta.items() if key == NEW_PATH or ROOMS[0] in key}
remaining = refresh(partial)
assert set(remaining) == {f'maps/{room}.{ext}' for room in ROOMS[1:] for ext in ['tmj', 'wam']}


def changed_tmj(data, mutate):
    path = 'maps/speaker-aries.tmj'
    obj = json.loads(data[path]); mutate(obj); data[path] = encode(obj)
    wam = json.loads(data['maps/speaker-aries.wam'])
    wam['mapUrl'] = 'speaker-aries.tmj?v=' + hashlib.sha256(data[path]).hexdigest()
    data['maps/speaker-aries.wam'] = encode(wam)


cases = {
    'missing room': lambda d: d.pop('maps/speaker-aries.tmj'),
    'missing saved WAM': lambda d: d.pop('maps/speaker-aries.wam'),
    'unknown speaker room': lambda d: d.update({'maps/speaker-ophiuchus.tmj': b'{}'}),
    'missing prior asset': lambda d: d.pop(OLD_PATH),
    'wrong prior asset bytes': lambda d: d.update({OLD_PATH: PNG}),
    'conflicting destination asset': lambda d: d.update({NEW_PATH: b'not the approved bytes'}),
    'stale saved WAM': lambda d: d.update({'maps/speaker-aries.wam': d['maps/speaker-aries.wam'].replace(hashlib.sha256(d['maps/speaker-aries.tmj']).hexdigest().encode(), b'0' * 64)}),
    'missing named atlas': lambda d: changed_tmj(d, lambda m: m.update({'tilesets': []})),
    'duplicate named atlas': lambda d: changed_tmj(d, lambda m: m['tilesets'].append(copy.deepcopy(m['tilesets'][0]))),
    'wrong footprint': lambda d: changed_tmj(d, lambda m: m['tilesets'][0].update({'imagewidth': 193})),
    'numeric boolean footprint': lambda d: changed_tmj(d, lambda m: m['tilesets'][0].update({'tilecount': True})),
    'unknown logo': lambda d: changed_tmj(d, lambda m: m['tilesets'][0].update({'image': '../assets/sponsors/other-logo.png'})),
    'reused image URL': lambda d: changed_tmj(d, lambda m: m['properties'].append({'name': 'another-reference', 'value': OLD_URL})),
    'missing named layer': lambda d: changed_tmj(d, lambda m: m.update({'layers': m['layers'][:1]})),
    'duplicate named layer': lambda d: changed_tmj(d, lambda m: m['layers'].append(copy.deepcopy(m['layers'][1]))),
    'wrong layer kind': lambda d: changed_tmj(d, lambda m: m['layers'][1].update({'type': 'objectgroup'})),
    'malformed TMJ': lambda d: d.update({'maps/speaker-aries.tmj': b'{broken'}),
}
for label, mutate in cases.items():
    bad = copy.deepcopy(live); mutate(bad)
    try:
        refresh(bad)
    except ValueError:
        pass
    else:
        raise AssertionError('Unsafe input accepted: ' + label)


def chunk(kind, body):
    return struct.pack('>I', len(body)) + kind + body + struct.pack('>I', zlib.crc32(kind + body) & 0xffffffff)


def png(width=192, height=64, data=None):
    raw = data if data is not None else (b'\x00' + b'\x00\x00\x00\xff' * width) * height
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')


invalid_pngs = [b'garbage', PNG[:-12], PNG[:20] + bytes([PNG[20] ^ 1]) + PNG[21:],
                png(width=193), png(height=63), png(data=b''), png(data=b'\x00' * 50000),
                png(data=(b'\x05' + b'\x00' * 768) * 64), png() + b'extra']
for candidate in invalid_pngs:
    try:
        refresh(live, candidate)
    except ValueError:
        pass
    else:
        raise AssertionError('Invalid PNG accepted')

print('12 hosted logo references refreshed; saved WAM bytes preserved; idempotence and 26 invalid cases checked')
