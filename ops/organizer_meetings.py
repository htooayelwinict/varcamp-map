"""Add one native meeting property to each existing organizer office, preserving
all live editor data. Only the closed, reviewed predecessor/current are accepted.
"""
import copy
import json
from pathlib import Path
from auditorium_spacing import ROOMS, GEOMETRY, same


def organizer_meetings_candidate(path, data):
    map_id = Path(path).stem
    if map_id not in ROOMS or path != 'maps/' + map_id + '.wam':
        return None
    try:
        root = Path(__file__).resolve().parent.parent
        contract = json.loads((root / 'world/organizer-meetings.json').read_text())
        offices = json.loads((root / 'world/speaker-office-wings.json').read_text())
        if contract['version'] != 1 or set(contract['maps']) != set(ROOMS):
            return None
        row = contract['maps'][map_id]
        source = next(a for a in offices['maps'][map_id]['afterFunctional']['areas'] if a['id'] == row['areaId'])
        if source['properties'] != [] or source['id'] != map_id[8:] + '-office-organizers':
            return None
        expected = {**source, 'visible': True, **{k: source[k] * 32 for k in GEOMETRY}}
        result = copy.deepcopy(data)
        areas = result['areas']
        identities, names, properties, owners = set(), set(), set(), set()
        for area in areas:
            for key, seen in [('id', identities), ('name', names)]:
                value = area[key]
                if not isinstance(value, str) or not value or value in seen:
                    return None
                seen.add(value)
            if not isinstance(area['properties'], list):
                return None
            for prop in area['properties']:
                identity = prop['id']
                if not isinstance(identity, str) or not identity or identity in properties:
                    return None
                properties.add(identity)
                if prop.get('type') == 'livekitRoomProperty':
                    name = prop['roomName']
                    if not isinstance(name, str) or not name or name in owners:
                        return None
                    owners.add(name)
        found = [a for a in areas if a['id'] == row['areaId']]
        if len(found) != 1:
            return None
        target = found[0]
        if any(not same(target.get(k), v) for k, v in expected.items() if k != 'properties'):
            return None
        wanted = row['property']
        owned = [p for p in target['properties'] if p['id'] == wanted['id']]
        independent = [p for p in target['properties'] if p['id'] != wanted['id']]
        # Retain existing editor presentation/access controls exactly. Audio
        # controls (silent, podium, other meetings, etc.) remain fail-closed.
        if any(p.get('type') not in {'areaDescriptionProperties', 'lockableAreaPropertyData', 'highlight'} for p in independent):
            return None
        # Do not silently bring an independently edited area into this meeting.
        for area in areas:
            if area['id'] != target['id'] and area['x'] < target['x'] + target['width'] and area['x'] + area['width'] > target['x'] and area['y'] < target['y'] + target['height'] and area['y'] + area['height'] > target['y']:
                return None
        if owned:
            if not same(owned, [wanted]):
                return None
            return result
        if wanted['id'] in properties or wanted['roomName'] in owners:
            return None
        target['properties'].append(copy.deepcopy(wanted))
        return result
    except (OSError, ValueError, KeyError, TypeError, StopIteration):
        return None


def is_organizer_meetings_wam_change(path, before, after):
    expected = organizer_meetings_candidate(path, json.loads(before))
    actual = json.loads(after)
    if expected is None:
        return False
    expected['mapUrl'] = actual.get('mapUrl')
    return same(expected, actual)


# Lewis requested removing this specific manual edit after confirming it made
# Sagittarius behave differently. Ordinary meeting migrations still retain it.
SAGITTARIUS_MANUAL_PROPERTIES = [
    {'id': 'bfee37ec-7d97-46cb-9b21-e4dd4ee8ad62', 'type': 'areaDescriptionProperties', 'description': '', 'searchable': False},
    {'id': 'c49abbf3-ed52-4171-9e7d-7bb04b988be3', 'type': 'lockableAreaPropertyData', 'allowedTags': []},
    {'id': '0d310e50-589b-444d-aa7b-16fbda4b766b', 'hideButtonLabel': True, 'type': 'highlight', 'opacity': 0.6, 'gradientWidth': 10, 'duration': 250, 'color': '#000000'},
]


def reset_sagittarius_organizer_candidate(path, data):
    if path != 'maps/speaker-sagittarius.wam':
        return None
    result = organizer_meetings_candidate(path, data)
    if result is None or not same(result, data):
        return None  # The existing meeting must already be present and exact.
    area = next(a for a in result['areas'] if a['id'] == 'sagittarius-office-organizers')
    meeting = [p for p in area['properties'] if p['type'] == 'livekitRoomProperty']
    if same(area['properties'], meeting) and 'modifyProperties' not in area:
        return result
    if area.get('modifyProperties') is not True or not same(area['properties'], SAGITTARIUS_MANUAL_PROPERTIES + meeting):
        return None  # Changed or additional manual edits require fresh review.
    area['properties'] = meeting
    del area['modifyProperties']
    return result


def is_sagittarius_organizer_reset_wam_change(path, before, after):
    expected = reset_sagittarius_organizer_candidate(path, json.loads(before))
    actual = json.loads(after)
    if expected is None:
        return False
    expected['mapUrl'] = actual.get('mapUrl')
    return same(expected, actual)
