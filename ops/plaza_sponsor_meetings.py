"""Repair only the three reviewed owner-drawn sponsor meeting chat bindings.

No Matrix API is called. Area geometry and all independent editor data survive.
"""
import copy
import json
from pathlib import Path
from auditorium_spacing import same


def plaza_sponsor_meetings_candidate(path, data):
    if path != 'maps/overworld.wam':
        return None
    try:
        contract = json.loads((Path(__file__).resolve().parents[1] / 'world/plaza-sponsor-meetings.json').read_text())
        if contract['version'] != 1 or contract['mapId'] != 'overworld' or len(contract['areas']) != 3:
            return None
        result = copy.deepcopy(data)
        areas = result['areas']
        area_ids, property_ids, room_names = set(), set(), set()
        for area in areas:
            identity = area['id']
            if not isinstance(identity, str) or not identity or identity in area_ids:
                return None
            area_ids.add(identity)
            if not isinstance(area['properties'], list):
                return None
            for prop in area['properties']:
                identity = prop['id']
                if not isinstance(identity, str) or not identity or identity in property_ids:
                    return None
                property_ids.add(identity)
                if prop.get('type') == 'livekitRoomProperty':
                    name = prop.get('roomName', '')
                    if not isinstance(name, str) or name and name in room_names:
                        return None
                    if name:
                        room_names.add(name)
        target_ids = {row['areaId'] for row in contract['areas']}
        if len(target_ids) != 3:
            return None
        for row in contract['areas']:
            target = next(a for a in areas if a['id'] == row['areaId'])
            if any(not same(target.get(k), v) for k, v in row['geometry'].items()):
                return None
            wanted = copy.deepcopy(row['meeting'])
            wanted['livekitRoomConfig']['disableChat'] = False
            native = [p for p in target['properties'] if p['id'] == wanted['id']]
            matrix = [p for p in target['properties'] if p['id'] == row['matrix']['id']]
            original = same(native, [row['meeting']]) and same(matrix, [row['matrix']])
            current = same(native, [wanted]) and not matrix
            if not (original or current):
                return None
            independent = [p for p in target['properties'] if p['id'] not in {wanted['id'], row['matrix']['id']}]
            if any(p.get('type') not in {'areaDescriptionProperties', 'highlight', 'lockableAreaPropertyData'} for p in independent):
                return None
            # Empty directory/presentation areas do not alter a conversation.
            # A second audio/chat or access area over this booth needs review.
            for other in areas:
                if other['id'] == target['id']:
                    continue
                if not any(p.get('type') not in {'areaDescriptionProperties', 'highlight'} for p in other['properties']):
                    continue
                if other['x'] < target['x'] + target['width'] and other['x'] + other['width'] > target['x'] and other['y'] < target['y'] + target['height'] and other['y'] + other['height'] > target['y']:
                    return None
            target['properties'] = [wanted if p['id'] == wanted['id'] else p for p in target['properties'] if p['id'] != row['matrix']['id']]
        return result
    except (OSError, ValueError, KeyError, TypeError, AttributeError, StopIteration):
        return None


def is_plaza_sponsor_meetings_wam_change(path, before, after):
    expected = plaza_sponsor_meetings_candidate(path, json.loads(before))
    actual = json.loads(after)
    if expected is None:
        return False
    expected['mapUrl'] = actual.get('mapUrl')
    return same(expected, actual)
