"""Exercise the publisher boundary: six capped booths, three uncapped sponsors."""
import copy
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from release_upload import wam_dependencies, replacement_files

root = Path(__file__).resolve().parents[2]
path, tmj = 'maps/overworld.wam', 'maps/overworld.tmj'
body = b'preserved plaza tiles and doors'
raw = lambda value: (json.dumps(value, ensure_ascii=False) + '\n').encode()
before = json.loads((root / 'ops/tests/fixtures/plaza-sponsor-meetings-before.json').read_text())
before['mapUrl'] = 'overworld.tmj?v=' + hashlib.sha256(body).hexdigest()
before['lastCommandId'] = 'owner-save-kept'
before['entities'] = {'manual-desk': {'x': 64, 'y': 96, 'prefabRef': {'collectionName': 'Furniture', 'id': 'desk'}}}
before['metadata'] = {'name': 'Owner plaza', 'copyright': 'preserve me'}
for area in before['areas']:
    area['properties'] = [p for p in area['properties'] if p['type'] != 'matrixRoomPropertyData']
    next(p for p in area['properties'] if p['type'] == 'livekitRoomProperty')['livekitRoomConfig']['disableChat'] = False
before['areas'].append({'id': 'manual-quiet', 'name': 'Unrelated owner area', 'x': 64, 'y': 64,
                       'width': 64, 'height': 64, 'visible': True,
                       'properties': [{'id': 'manual-silent', 'type': 'silent'}]})

# Hand-checked floor positions, independent of the new production contract/helper.
booths = [
    ('aws', 'AWS USER GROUP MYANMAR', 1248),
    ('bsides', 'BSides Myanmar', 1504),
    ('vibes', 'Vibes Code Tours', 1760),
    ('osrfm', 'OSRFM', 2208),
    ('duwun', 'Duwun', 2432),
    ('open-taxi', 'Open Taxi', 2656),
]
expected = copy.deepcopy(before)
for area in expected['areas'][:3]:
    config = next(p for p in area['properties'] if p['type'] == 'livekitRoomProperty')['livekitRoomConfig']
    config.update(startWithAudioMuted=True, startWithVideoMuted=True)
for slug, name, x in booths:
    expected['areas'].append({
        'id': 'expo-booth-' + slug, 'name': name, 'x': x, 'y': 2624,
        'width': 192, 'height': 128, 'visible': True,
        'properties': [
            {'id': 'expo-booth-' + slug + '-meeting', 'type': 'livekitRoomProperty', 'roomName': name,
             'livekitRoomConfig': {'startWithAudioMuted': True, 'startWithVideoMuted': True,
                                   'disableChat': False, 'raiseHandEnabled': True}, 'livekitRoomAdminTag': ''},
            {'id': 'expo-booth-' + slug + '-capacity', 'type': 'maxUsersInAreaPropertyData', 'maxUsers': 8},
        ],
    })

baseline = {tmj: body, path: raw(before)}
release = {tmj: body, path: raw(expected)}
# RED must be a real publisher refusal, before any new helper import.
deps = wam_dependencies(release, baseline, {path: raw(expected)})
assert deps[path]['migration'] == 'expo-booth-meetings-v1'
assert replacement_files(release, baseline, {path: raw(expected)}) == release

from expo_booth_meetings import expo_booth_meetings_candidate
untouched = copy.deepcopy(before)
assert expo_booth_meetings_candidate(path, before) == expected
assert before == untouched
assert expo_booth_meetings_candidate(path, expected) == expected
assert expo_booth_meetings_candidate('maps/speaker-aries.wam', before) is None

layout = json.loads((root / 'world/layouts/overworld.json').read_text())
for slug, _, x in booths:
    floor = next(p for p in layout['placements'] if p['id'] == 'sponsor-tier-' + slug + '-floor')
    assert [floor[k] * 32 for k in ('x', 'y', 'width', 'height')] == [x, 2624, 192, 128]
walk = next(p for p in layout['placements'] if p['id'] == 'sponsor-tier-cross-walk-south')
assert walk['y'] * 32 == 2752  # Meeting boundaries end before this public path.

rejected = 0
for change in ['sponsor-cap', 'booth-cap', 'booth-cap-type', 'cap-missing', 'geometry', 'walkway',
               'duplicate-room', 'unmuted-booth', 'unmuted-sponsor', 'chat-off', 'sponsor-name',
               'sponsor-geometry', 'sponsor-hands', 'description', 'entity', 'metadata',
               'unrelated', 'extra-area', 'missing-booth', 'map-url', 'numeric-boolean']:
    bad = copy.deepcopy(expected)
    a, sponsor = bad['areas'][4], bad['areas'][0]
    meeting, cap = a['properties']
    sponsor_meeting = next(p for p in sponsor['properties'] if p['type'] == 'livekitRoomProperty')
    if change == 'sponsor-cap': sponsor['properties'].append({'id': 'not-approved', 'type': 'maxUsersInAreaPropertyData', 'maxUsers': 8})
    if change == 'booth-cap': cap['maxUsers'] = 9
    if change == 'booth-cap-type': cap['maxUsers'] = '8'
    if change == 'cap-missing': a['properties'].pop()
    if change == 'geometry': a['x'] += 1
    if change == 'walkway': a['height'] += 32
    if change == 'duplicate-room': meeting['roomName'] = 'newness'
    if change == 'unmuted-booth': meeting['livekitRoomConfig']['startWithAudioMuted'] = False
    if change == 'unmuted-sponsor': sponsor_meeting['livekitRoomConfig']['startWithVideoMuted'] = False
    if change == 'chat-off': meeting['livekitRoomConfig']['disableChat'] = True
    if change == 'sponsor-name': sponsor['name'] = 'changed'
    if change == 'sponsor-geometry': sponsor['width'] += 1
    if change == 'sponsor-hands': sponsor_meeting['livekitRoomConfig']['raiseHandEnabled'] = False
    if change == 'description': sponsor['properties'][0]['description'] = 'changed'
    if change == 'entity': bad['entities'] = {}
    if change == 'metadata': bad['lastCommandId'] = 'changed'
    if change == 'unrelated': bad['areas'][3]['properties'] = []
    if change == 'extra-area': bad['areas'].append({'id': 'extra', 'name': 'new', 'properties': [], 'x': 0, 'y': 0, 'width': 32, 'height': 32})
    if change == 'missing-booth': bad['areas'].pop()
    if change == 'map-url': bad['mapUrl'] = 'overworld.tmj?v=' + '0' * 64
    if change == 'numeric-boolean': meeting['livekitRoomConfig']['startWithVideoMuted'] = 1
    try:
        wam_dependencies(release, baseline, {path: raw(bad)})
    except ValueError:
        rejected += 1
    else:
        raise AssertionError('Unsafe output accepted: ' + change)

for change in ['missing-sponsor', 'duplicate-area', 'duplicate-property', 'shared-room', 'sponsor-cap',
               'sponsor-geometry', 'sponsor-new-matrix', 'sponsor-number', 'overlap-new', 'overlap-old',
               'partial-booths', 'customized-booth', 'wrong-properties', 'nonfinite', 'bool-coordinate']:
    bad = copy.deepcopy(before)
    a = bad['areas'][0]
    meeting = next(p for p in a['properties'] if p['type'] == 'livekitRoomProperty')
    if change == 'missing-sponsor': bad['areas'].pop(0)
    if change == 'duplicate-area': bad['areas'].append(copy.deepcopy(a))
    if change == 'duplicate-property': a['properties'].append(copy.deepcopy(meeting))
    if change == 'shared-room': bad['areas'][-1]['properties'] = [{**copy.deepcopy(meeting), 'id': 'independent-shared'}]
    if change == 'sponsor-cap': a['properties'].append({'id': 'existing-cap', 'type': 'maxUsersInAreaPropertyData', 'maxUsers': 8})
    if change == 'sponsor-geometry': a['x'] += 1
    if change == 'sponsor-new-matrix': a['properties'].append({'id': 'owner-matrix', 'type': 'matrixRoomPropertyData'})
    if change == 'sponsor-number': meeting['livekitRoomConfig']['startWithAudioMuted'] = 0
    if change == 'overlap-new': bad['areas'][-1].update(x=1248, y=2624)
    if change == 'overlap-old': bad['areas'][-1].update(x=a['x'], y=a['y'])
    if change == 'partial-booths': bad['areas'].append(copy.deepcopy(expected['areas'][4]))
    if change == 'customized-booth':
        bad = copy.deepcopy(expected)
        bad['areas'][4]['width'] += 1
    if change == 'wrong-properties': a['properties'] = None
    if change == 'nonfinite': bad['areas'][-1]['x'] = float('nan')
    if change == 'bool-coordinate': bad['areas'][-1]['x'] = True
    assert expo_booth_meetings_candidate(path, bad) is None, change
    rejected += 1

# Independent owner descriptions and highlight areas survive, even when overlapping.
extra = copy.deepcopy(before)
extra['areas'].append({'id': 'owner-highlight', 'name': 'Owner annotation', 'x': 1248, 'y': 2624,
                      'width': 64, 'height': 64, 'visible': True,
                      'properties': [{'id': 'owner-highlight-property', 'type': 'highlight', 'opacity': 0.2}]})
result = expo_booth_meetings_candidate(path, extra)
assert result is not None and result['areas'][4] == extra['areas'][4]
assert all(p['type'] != 'maxUsersInAreaPropertyData' for a in result['areas'][:3] for p in a['properties'])
print(f'Six cap-8 booth meetings; three uncapped muted sponsors; {rejected} unsafe changes rejected')
