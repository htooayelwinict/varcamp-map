import copy, hashlib, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from organizer_meetings import SAGITTARIUS_MANUAL_PROPERTIES, reset_sagittarius_organizer_candidate, is_sagittarius_organizer_reset_wam_change, organizer_meetings_candidate
from release_upload import wam_dependencies
root = Path(__file__).resolve().parents[2]
path = 'maps/speaker-sagittarius.wam'
current = json.loads((root / path).read_text())
old = copy.deepcopy(current)
office = next(a for a in old['areas'] if a['id'] == 'sagittarius-office-organizers')
office['properties'] = copy.deepcopy(SAGITTARIUS_MANUAL_PROPERTIES) + office['properties']
office['modifyProperties'] = True
old['metadata']['independent'] = 'retain'
old['entities']['saved'] = {'x': 64, 'y': 96, 'prefabRef': {'collectionName': 'furniture', 'id': 'chair'}}
office['editorNote'] = 'retain'
saved = copy.deepcopy(old)
new = reset_sagittarius_organizer_candidate(path, old)
assert new is not None and old == saved
expected = copy.deepcopy(old)
a = next(a for a in expected['areas'] if a['id'] == office['id'])
a['properties'] = [a['properties'][-1]]
del a['modifyProperties']
assert new == expected
assert reset_sagittarius_organizer_candidate(path, new) == new
assert organizer_meetings_candidate(path, old) == old, 'The ordinary deploy must still preserve editor settings'
for kind in ['changed-highlight', 'different-lock', 'extra-property', 'geometry', 'no-meeting']:
    bad = copy.deepcopy(old)
    a = next(a for a in bad['areas'] if a['id'] == office['id'])
    if kind == 'changed-highlight': a['properties'][2]['opacity'] = 0.9
    if kind == 'different-lock': a['properties'][1]['allowedTags'] = ['organizer']
    if kind == 'extra-property': a['properties'].append({'id': 'other', 'type': 'areaDescriptionProperties', 'description': 'keep'})
    if kind == 'geometry': a['width'] += 32
    if kind == 'no-meeting': a['properties'].pop()
    assert reset_sagittarius_organizer_candidate(path, bad) is None, kind
assert reset_sagittarius_organizer_candidate('maps/speaker-aries.wam', old) is None
raw = lambda v: (json.dumps(v, ensure_ascii=False) + '\n').encode()
assert is_sagittarius_organizer_reset_wam_change(path, raw(old), raw(new))
damaged = copy.deepcopy(new); damaged['entities'] = {}
assert not is_sagittarius_organizer_reset_wam_change(path, raw(old), raw(damaged))
tmj = path[:-4] + '.tmj'; body = b'reset fixture map'
old['mapUrl'] = 'speaker-sagittarius.tmj?v=' + '0' * 64
new['mapUrl'] = 'speaker-sagittarius.tmj?v=' + hashlib.sha256(body).hexdigest()
deps = wam_dependencies({tmj: body, path: raw(new)}, {tmj: b'before', path: raw(old)}, {path: raw(new)})
assert deps[path]['migration'] == 'sagittarius-organizer-reset-v1'
print('Sagittarius reset removes only the reviewed manual controls; meeting and editor data retained')
