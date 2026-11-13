"""Exact hosted-WAM migration for six booth meetings and nine muted arrivals."""
import copy
import json
import math
from pathlib import Path

from auditorium_spacing import same


def _valid_areas(areas):
    area_ids, property_ids, rooms = set(), set(), set()
    for area in areas:
        identity = area['id']
        if not isinstance(identity, str) or not identity or identity in area_ids:
            return False
        area_ids.add(identity)
        for field in ('x', 'y', 'width', 'height'):
            value = area[field]
            if type(value) not in (int, float) or not math.isfinite(value):
                return False
            if value < 0 or field in ('width', 'height') and value == 0:
                return False
        if not isinstance(area['properties'], list):
            return False
        for prop in area['properties']:
            identity = prop['id']
            if not isinstance(identity, str) or not identity or identity in property_ids:
                return False
            property_ids.add(identity)
            if prop.get('type') == 'livekitRoomProperty':
                name = prop.get('roomName')
                if not isinstance(name, str) or name and name in rooms:
                    return False
                if name:
                    rooms.add(name)
    return True


def _overlaps(a, b):
    return (a['x'] < b['x'] + b['width'] and b['x'] < a['x'] + a['width']
            and a['y'] < b['y'] + b['height'] and b['y'] < a['y'] + a['height'])


def expo_booth_meetings_candidate(path, data):
    """Preserve editor data; refuse changed/ambiguous owned areas instead of guessing."""
    if path != 'maps/overworld.wam':
        return None
    try:
        root = Path(__file__).resolve().parents[1]
        sponsors = json.loads((root / 'world/plaza-sponsor-meetings.json').read_text())
        booths = json.loads((root / 'world/expo-booth-meetings.json').read_text())
        if (sponsors['version'] != 1 or sponsors['mapId'] != 'overworld' or len(sponsors['areas']) != 3
                or booths['version'] != 1 or booths['mapId'] != 'overworld' or len(booths['areas']) != 6):
            return None
        result = copy.deepcopy(data)
        areas = result['areas']
        if not isinstance(areas, list) or not _valid_areas(areas):
            return None
        sponsor_ids = {row['areaId'] for row in sponsors['areas']}
        booth_ids = {area['id'] for area in booths['areas']}
        if len(sponsor_ids) != 3 or len(booth_ids) != 6 or sponsor_ids & booth_ids:
            return None
        present = [area for area in areas if area['id'] in booth_ids]
        if len(present) not in (0, 6):
            return None
        for wanted in booths['areas']:
            current = next((a for a in present if a['id'] == wanted['id']), None)
            if current is not None and not same(current, wanted):
                return None
        for row in sponsors['areas']:
            target = next(a for a in areas if a['id'] == row['areaId'])
            if any(not same(target.get(k), v) for k, v in row['geometry'].items()):
                return None
            expected = copy.deepcopy(row['meeting'])
            expected['livekitRoomConfig']['disableChat'] = False
            meeting = next(p for p in target['properties'] if p['id'] == expected['id'])
            # Both original and already-muted settings are accepted; other meeting
            # fields must still match the previously reviewed native-chat setup.
            for key in ('startWithAudioMuted', 'startWithVideoMuted'):
                value = meeting['livekitRoomConfig'][key]
                if type(value) is not bool:
                    return None
                expected['livekitRoomConfig'][key] = value
            if not same(meeting, expected):
                return None
            independent = [p for p in target['properties'] if p['id'] != expected['id']]
            if any(p.get('type') not in {'areaDescriptionProperties', 'highlight', 'lockableAreaPropertyData'} for p in independent):
                return None
            meeting['livekitRoomConfig'].update(startWithAudioMuted=True, startWithVideoMuted=True)
        if not present:
            areas.extend(copy.deepcopy(booths['areas']))
        if not _valid_areas(areas):
            return None
        for target in areas:
            if target['id'] not in sponsor_ids | booth_ids:
                continue
            for other in areas:
                if other['id'] == target['id']:
                    continue
                if any(p.get('type') not in {'areaDescriptionProperties', 'highlight'} for p in other['properties']) and _overlaps(target, other):
                    return None
        return result
    except (OSError, ValueError, KeyError, TypeError, AttributeError, StopIteration):
        return None


def is_expo_booth_meetings_wam_change(path, before, after):
    expected = expo_booth_meetings_candidate(path, json.loads(before))
    # This metadata-only migration does not own the TMJ or its version token.
    return expected is not None and same(expected, json.loads(after))
