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
