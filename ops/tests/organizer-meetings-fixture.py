import copy, hashlib, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from auditorium_spacing import ROOMS
from organizer_meetings import organizer_meetings_candidate, is_organizer_meetings_wam_change
from release_upload import wam_dependencies
root = Path(__file__).resolve().parents[2]
raw = lambda value: (json.dumps(value, ensure_ascii=False) + '\n').encode()
for room in ROOMS:
    path = 'maps/' + room + '.wam'
    old = json.loads((root / path).read_text())
    office_id = room[8:] + '-office-organizers'
    office = next(a for a in old['areas'] if a['id'] == office_id)
    office['properties'] = []
    if room == 'speaker-sagittarius':
        office['properties'] = [
            {'id': 'saved-description', 'type': 'areaDescriptionProperties', 'description': '', 'searchable': False},
            {'id': 'saved-lock', 'type': 'lockableAreaPropertyData', 'allowedTags': []},
            {'id': 'saved-highlight', 'type': 'highlight', 'opacity': 0.6, 'gradientWidth': 10, 'duration': 250, 'color': '#000000'},
        ]
        office['modifyProperties'] = True
    office['editorNote'] = 'keep this'
    old['metadata'] = {'independent': 'keep'}
    old['settings'] = {'recording': {'enabled': False}}
    old['entities'] = {'saved-chair': {'x': 64, 'y': 96, 'prefabRef': {'collectionName': 'furniture', 'id': 'chair'}}}
    old['areas'].append({'id': 'custom', 'name': 'Custom area', 'visible': True, 'x': 32, 'y': 32, 'width': 32, 'height': 32, 'properties': [], 'editorNote': 'keep'})
    original = copy.deepcopy(old)
    new = organizer_meetings_candidate(path, old)
    assert new is not None and old == original
    control = [p for p in next(a for a in new['areas'] if a['id'] == office_id)['properties'] if p['type'] == 'livekitRoomProperty']
    reverted = copy.deepcopy(new)
    next(a for a in reverted['areas'] if a['id'] == office_id)['properties'] = copy.deepcopy(office['properties'])
    assert reverted == old, 'Only the owned properties may change'
    assert organizer_meetings_candidate(path, new) == new
    assert is_organizer_meetings_wam_change(path, raw(old), raw(new))
    tmj = path[:-4] + '.tmj'
    body = b'organizer fixture'
    old['mapUrl'] = room + '.tmj?v=' + '0' * 64
    new['mapUrl'] = room + '.tmj?v=' + hashlib.sha256(body).hexdigest()
    deps = wam_dependencies({tmj: body, path: raw(new)}, {tmj: b'previous', path: raw(old)}, {path: raw(new)})
    assert deps[path]['migration'] == 'organizer-meetings-v1'
    damaged = copy.deepcopy(new); damaged['entities'] = {}
    assert not is_organizer_meetings_wam_change(path, raw(old), raw(damaged))
    for change in ['geometry', 'controls', 'duplicate', 'overlap', 'meeting-owner', 'missing']:
        bad = copy.deepcopy(old)
        target = next(a for a in bad['areas'] if a['id'] == office_id)
        if change == 'geometry': target['width'] += 32
        if change == 'controls': target['properties'] = [{'id': 'editor-quiet', 'type': 'silent'}]
        if change == 'duplicate': bad['areas'].append(copy.deepcopy(target))
        if change == 'overlap': bad['areas'][-1].update(x=target['x'], y=target['y'])
        if change == 'meeting-owner': bad['areas'][-1]['properties'] = [{**control[0], 'id': 'another-meeting'}]
        if change == 'missing': bad['areas'].remove(target)
        assert organizer_meetings_candidate(path, bad) is None, change
assert organizer_meetings_candidate('maps/solar-hall.wam', old) is None
print('12 organizer meetings preserve editor data; drift, duplicates, missing offices and overlaps rejected')
