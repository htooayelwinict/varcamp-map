"""Enable Aries's linked native chat, detaching only its two reviewed Matrix zones.

This changes map bindings only; it never calls Matrix or removes chat history.
"""
import copy
import json
from pathlib import Path
from auditorium_spacing import same


def aries_shared_chat_candidate(path, data):
    if path != 'maps/speaker-aries.wam':
        return None
    try:
        contract = json.loads((Path(__file__).resolve().parents[1] / 'world/aries-shared-chat.json').read_text())
        if contract['version'] != 1 or contract['mapId'] != 'speaker-aries' or [r['areaId'] for r in contract['areas']] != ['meeting-aries', 'aries-audience']:
            return None
        result = copy.deepcopy(data)
        areas = result['areas']
        area_ids, prop_ids = set(), set()
        for area in areas:
            if not isinstance(area['id'], str) or not area['id'] or area['id'] in area_ids:
                return None
            area_ids.add(area['id'])
            for prop in area['properties']:
                if not isinstance(prop['id'], str) or not prop['id'] or prop['id'] in prop_ids:
                    return None
                prop_ids.add(prop['id'])
        for row in contract['areas']:
            matches = [a for a in areas if a['id'] == row['areaId']]
            if len(matches) != 1:
                return None
            area = matches[0]
            if any(not same(area.get(k), v) for k, v in row['geometry'].items()):
                return None
            native = [p for p in area['properties'] if p['id'] == row['property']['id']]
            if len(native) != 1 or type(native[0].get('chatEnabled')) is not bool or not same({**native[0], 'chatEnabled': True}, row['property']):
                return None
            retained = []
            for prop in area['properties']:
                if prop['id'] == row['property']['id']:
                    retained.append({**prop, 'chatEnabled': True})
                elif prop['id'] == row['detachMatrixPropertyId']:
                    if prop.get('type') != 'matrixRoomPropertyData' or prop.get('displayName') != 'varcamp-aries-talk1' or prop.get('resourceUrl') != 'https://pusher.workadventu.re/roomArea' or prop.get('shouldOpenAutomatically') is not True or not isinstance(prop.get('serverData', {}).get('matrixRoomId'), str):
                        return None
                elif prop.get('type') in {'areaDescriptionProperties', 'lockableAreaPropertyData', 'highlight'}:
                    retained.append(prop)
                else:
                    return None  # New chat/audio controls need an explicit review.
            area['properties'] = retained
        return result
    except (OSError, ValueError, KeyError, TypeError, AttributeError):
        return None


def is_aries_shared_chat_wam_change(path, before, after):
    expected = aries_shared_chat_candidate(path, json.loads(before))
    actual = json.loads(after)
    if expected is None:
        return False
    expected['mapUrl'] = actual.get('mapUrl')
    return same(expected, actual)
