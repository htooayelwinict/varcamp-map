"""Closed five-map area replacement, retaining unrelated live editor data."""
import copy
import json
from pathlib import Path
from auditorium_spacing import same, GEOMETRY

MAPS = ('campus-exploration', 'star-garden', 'moon-grotto', 'moon-cafe', 'stargazer-terrace')
ROOT = Path(__file__).resolve().parent.parent


def exploration_candidate(path, data):
    map_id = Path(path).stem
    if map_id not in MAPS or path != 'maps/' + map_id + '.wam':
        return None
    try:
        predecessor = json.loads((ROOT / 'world/exploration-predecessors.json').read_text())
        if predecessor['version'] != 1 or set(predecessor['maps']) != set(MAPS):
            return None
        old = predecessor['maps'][map_id]['areas']
        new = json.loads((ROOT / f'world/layouts/{map_id}.json').read_text())['areas']
        pixels = lambda a: {**a, 'visible': True, **{k: a[k] * 32 for k in GEOMETRY}}
        old = [pixels(a) for a in old]
        new = [pixels(a) for a in new]
        result = copy.deepcopy(data)
        areas = result['areas']
        for key in ('id', 'name'):
            values = [a[key] for a in areas]
            if any(not isinstance(v, str) or not v for v in values) or len(set(values)) != len(values):
                return None
        owned = {a['id'] for a in old + new}
        actual = [a for a in areas if a['id'] in owned]
        canonical = lambda rows: sorted(rows, key=lambda a: a['id'])
        if same(canonical(actual), canonical(new)):
            return result
        # Exact predecessor controls and fields: do not discard live edits.
        if not same(canonical(actual), canonical(old)):
            return None
        independent = [a for a in areas if a['id'] not in owned]
        if {a['name'] for a in independent} & {a['name'] for a in new}:
            return None
        if any(a['properties'] for a in old + new):
            return None
        result['areas'] = independent + new
        return result
    except (OSError, ValueError, KeyError, TypeError):
        return None


def is_exploration_wam_change(path, before, after):
    expected = exploration_candidate(path, json.loads(before))
    actual = json.loads(after)
    if expected is None:
        return False
    expected['mapUrl'] = actual.get('mapUrl')
    return same(expected, actual)
