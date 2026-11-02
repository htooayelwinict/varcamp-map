"""Closed geometry-only successor for the twelve saved zodiac room areas."""
import copy
import json
from pathlib import Path

ROOMS = tuple('speaker-' + sign for sign in 'aries taurus gemini cancer leo virgo libra scorpio sagittarius capricorn aquarius pisces'.split())
GEOMETRY = ('x', 'y', 'width', 'height')


def same(a, b):
    return json.dumps(a, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False) == json.dumps(b, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def auditorium_candidate(path, data, *, already_current=False):
    """Preserve unknown fields and independent editor areas; reject owned drift."""
    map_id = Path(path).stem
    if map_id not in ROOMS or path != 'maps/' + map_id + '.wam':
        return None
    try:
        recipe = json.loads((Path(__file__).resolve().parent.parent / 'world/auditorium-spacing.json').read_text())
        if recipe['version'] != 1 or set(recipe['maps']) != set(ROOMS) | {'solar-hall', 'lunar-hall'}:
            return None
        row = recipe['maps'][map_id]
        source, target = row['beforeFunctional']['areas'], row['afterFunctional']['areas']
        sign = map_id[8:]
        if {a['id'] for a in source} != {'meeting-' + sign, 'beacon-' + sign, sign + '-audience'} or len(source) != 3:
            return None
        if {a['id'] for a in target} != {a['id'] for a in source} or len(target) != 3:
            return None
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
                owner_key = 'name' if prop.get('type') == 'speakerMegaphone' else 'roomName' if prop.get('type') == 'livekitRoomProperty' else None
                if owner_key:
                    value = prop[owner_key]
                    if not isinstance(value, str) or not value or (prop['type'], value) in owners:
                        return None
                    owners.add((prop['type'], value))
        for old in source:
            new = next(a for a in target if a['id'] == old['id'])
            if not same({k:v for k,v in old.items() if k not in GEOMETRY}, {k:v for k,v in new.items() if k not in GEOMETRY}):
                return None
            found = [a for a in areas if a['id'] == old['id']]
            if len(found) != 1:
                return None
            before = new if already_current else old
            required = {**before, 'visible': True, **{k: before[k] * 32 for k in GEOMETRY}}
            if any(not same(found[0].get(k), v) for k, v in required.items()):
                return None
            for key in GEOMETRY:
                found[0][key] = new[key] * 32
        return result
    except (OSError, ValueError, KeyError, TypeError, StopIteration):
        return None


def is_auditorium_spacing_wam_change(path, before, after):
    expected = auditorium_candidate(path, json.loads(before))
    actual = json.loads(after)
    if expected is None:
        return False
    expected['mapUrl'] = actual.get('mapUrl')
    return same(expected, actual)
