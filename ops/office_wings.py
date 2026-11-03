"""Append the four reviewed side-wing areas without replacing saved editor data."""
import copy
import json
from pathlib import Path
from auditorium_spacing import ROOMS, same, GEOMETRY


def office_wings_candidate(path, data):
    map_id = Path(path).stem
    if map_id not in ROOMS or path != 'maps/' + map_id + '.wam':
        return None
    try:
        recipe = json.loads((Path(__file__).resolve().parent.parent / 'world/speaker-office-wings.json').read_text())
        if recipe['version'] != 1 or set(recipe['maps']) != set(ROOMS):
            return None
        row = recipe['maps'][map_id]
        old = row['beforeFunctional']['areas']
        new = row['afterFunctional']['areas']
        if len(old) != 3 or len(new) != 7 or not same(new[:3], old):
            return None
        result = copy.deepcopy(data)
        areas = result['areas']
        identities, names, properties = set(), set(), set()
        for area in areas:
            for key, seen in [('id', identities), ('name', names)]:
                value = area[key]
                if not isinstance(value, str) or not value or value in seen:
                    return None
                seen.add(value)
            for prop in area['properties']:
                if not isinstance(prop['id'], str) or not prop['id'] or prop['id'] in properties:
                    return None
                properties.add(prop['id'])
        pixels = lambda a: {**a, 'visible': True, **{k: a[k] * 32 for k in GEOMETRY}}
        for a in old:
            found = [r for r in areas if r['id'] == a['id']]
            if len(found) != 1 or any(not same(found[0].get(k), v) for k, v in pixels(a).items()):
                return None
        additions = [pixels(a) for a in new[3:]]
        sign = map_id[8:]
        if {a['id'] for a in additions} != {f'{sign}-office-{k}' for k in ['organizers', 'silent', 'briefing', 'lounge']}:
            return None
        present = [a['id'] in identities for a in additions]
        if any(present):
            # Idempotent deployment, but partial migration or changed new areas fails closed.
            if not all(present):
                return None
            for a in additions:
                found = next(r for r in areas if r['id'] == a['id'])
                if any(not same(found.get(k), v) for k, v in a.items()):
                    return None
            return result
        for a in additions:
            if a['name'] in names or any(p['id'] in properties for p in a['properties']):
                return None
            # Existing independent areas may not silently acquire quiet controls.
            if a['properties'] and any(r['x'] < a['x'] + a['width'] and r['x'] + r['width'] > a['x'] and r['y'] < a['y'] + a['height'] and r['y'] + r['height'] > a['y'] for r in areas):
                return None
            areas.append(a)
        return result
    except (OSError, ValueError, KeyError, TypeError, StopIteration):
        return None


def is_office_wings_wam_change(path, before, after):
    expected = office_wings_candidate(path, json.loads(before))
    actual = json.loads(after)
    if expected is None:
        return False
    expected['mapUrl'] = actual.get('mapUrl')
    return same(expected, actual)
