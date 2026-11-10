"""Widen the known saved arrival quiet/highlight area with the three-desk counter.

This opt-in successor owns one width value, not the surrounding editor data.
Changed controls, geometry, duplicate identities or a newly overlapping area
must be reviewed separately instead of silently being overwritten.
"""
import copy
import json
import math

from auditorium_spacing import same


BEFORE = {
    'x': 2212, 'y': 1890, 'width': 239, 'height': 156,
    'id': '5051b43b-7d12-4272-bcaa-f6284bb4f58c', 'visible': True, 'name': '',
    'properties': [
        {'id': '44735980-d8be-4e82-b8ed-52acc5cadd6e', 'type': 'areaDescriptionProperties', 'description': '', 'searchable': False},
        {'id': '2ce541c4-c4c1-430d-8284-2d1a16bf8292', 'hideButtonLabel': True, 'type': 'silent'},
        {'id': 'ddd4daf8-7295-4a21-9100-66b9ef18c440', 'hideButtonLabel': True, 'type': 'highlight', 'opacity': 0.6, 'gradientWidth': 10, 'duration': 250, 'color': '#000000'},
    ], 'modifyProperties': False,
}
AFTER_WIDTH = 335  # Three additional 32-pixel columns; same origin and height.


def arrival_check_in_candidate(path, data):
    if path != 'maps/overworld.wam':
        return None
    try:
        areas = data['areas']
        if not isinstance(areas, list) or any(not isinstance(a, dict) for a in areas):
            return None
        owned = [a for a in areas if a.get('id') == BEFORE['id']]
        if len(owned) != 1:
            return None
        after = {**BEFORE, 'width': AFTER_WIDTH}
        if not same(owned[0], BEFORE) and not same(owned[0], after):
            return None
        # The added strip must not acquire another saved area's controls.
        for area in areas:
            if area is owned[0]:
                continue
            if any(type(area.get(k)) not in (int, float) or not math.isfinite(area[k])
                   for k in ('x', 'y', 'width', 'height')):
                return None
            if area['width'] <= 0 or area['height'] <= 0:
                return None
            if (area['x'] < BEFORE['x'] + AFTER_WIDTH
                    and area['x'] + area['width'] > BEFORE['x'] + BEFORE['width']
                    and area['y'] < BEFORE['y'] + BEFORE['height']
                    and area['y'] + area['height'] > BEFORE['y']):
                return None
        result = copy.deepcopy(data)
        next(a for a in result['areas'] if a.get('id') == BEFORE['id'])['width'] = AFTER_WIDTH
        return result
    except (KeyError, TypeError, ValueError):
        return None


def is_arrival_check_in_wam_change(path, before, after):
    expected = arrival_check_in_candidate(path, json.loads(before))
    actual = json.loads(after)
    if expected is None:
        return False
    expected['mapUrl'] = actual.get('mapUrl')
    return same(expected, actual)
