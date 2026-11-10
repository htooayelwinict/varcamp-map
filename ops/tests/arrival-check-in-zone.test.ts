import {execFileSync} from 'node:child_process';
import {expect, it} from 'vitest';

// Frozen saved-area evidence; all unrelated editor data below is synthetic.
const setup = String.raw`
import copy, hashlib, json, pathlib, sys, tempfile
sys.path.insert(0, 'ops')
from release_upload import wam_dependencies
from migrate_wam_tokens import migrate
path = 'maps/overworld.wam'
tmj = b'{"width":128,"height":128}'
pin = hashlib.sha256(tmj).hexdigest()
area = {
    'x': 2212, 'y': 1890, 'width': 239, 'height': 156,
    'id': '5051b43b-7d12-4272-bcaa-f6284bb4f58c', 'visible': True, 'name': '',
    'properties': [
        {'id': '44735980-d8be-4e82-b8ed-52acc5cadd6e', 'type': 'areaDescriptionProperties', 'description': '', 'searchable': False},
        {'id': '2ce541c4-c4c1-430d-8284-2d1a16bf8292', 'hideButtonLabel': True, 'type': 'silent'},
        {'id': 'ddd4daf8-7295-4a21-9100-66b9ef18c440', 'hideButtonLabel': True, 'type': 'highlight', 'opacity': 0.6, 'gradientWidth': 10, 'duration': 250, 'color': '#000000'},
    ], 'modifyProperties': False,
}
saved = {'version': '1.0.0', 'mapUrl': 'overworld.tmj?v=' + pin,
    'areas': [copy.deepcopy(area), {'id':'independent', 'name':'keep', 'x':0,'y':0,'width':32,'height':32,'properties':[]}],
    'entities': {'saved-desk': {'name': 'editor furniture'}}, 'entityCollections': [],
    'lastCommandId': 'preserve-editor-command', 'metadata': {'name': 'Editor title'}}
expected = copy.deepcopy(saved)
expected['areas'][0]['width'] = 335
encode = lambda data: (json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode()
def admitted(before, after, target=path):
    before, after = copy.deepcopy(before), copy.deepcopy(after)
    before['mapUrl'] = after['mapUrl'] = pathlib.Path(target).stem + '.tmj?v=' + pin
    baseline = {target: encode(before), target[:-4]+'.tmj': tmj}
    try:
        dep = wam_dependencies(baseline, baseline, {target: encode(after)})
        return dep[target].get('migration') == 'arrival-check-in-width-v1'
    except ValueError:
        return False
`;

function run(body: string) {
  return JSON.parse(execFileSync('python3', ['-c', setup + body], {encoding: 'utf8', timeout: 10000}));
}

it('admits only the reviewed three-tile width expansion while retaining every saved setting', () => {
  expect(run(`print(json.dumps({'accepted': admitted(saved, expected)}))`)).toEqual({accepted: true});
});

it('rejects extra changes, a different map, changed controls and duplicate saved-area identities', () => {
  expect(run(`
results = []
for field, value in [('x',2213),('width',336),('height',157),('visible',False),('modifyProperties',True)]:
    changed = copy.deepcopy(expected); changed['areas'][0][field] = value
    results.append(admitted(saved, changed))
for key, value in [('entities',{}),('lastCommandId','lost'),('metadata',{})]:
    changed = copy.deepcopy(expected); changed[key] = value
    results.append(admitted(saved, changed))
changed = copy.deepcopy(expected); changed['areas'][1]['name'] = 'lost'
results.append(admitted(saved, changed))
results.append(admitted(saved, expected, 'maps/speaker-aries.wam'))
for change in ['property','duplicate','missing','typed']:
    before = copy.deepcopy(saved); after = copy.deepcopy(expected)
    if change == 'property':
        before['areas'][0]['properties'][2]['opacity'] = 0.4
        after['areas'][0]['properties'][2]['opacity'] = 0.4
    elif change == 'duplicate':
        before['areas'].append(copy.deepcopy(area)); after['areas'].append(copy.deepcopy(area))
    elif change == 'missing':
        before['areas'] = before['areas'][1:]
    else:
        before['areas'][0]['visible'] = 1; after['areas'][0]['visible'] = 1
    results.append(admitted(before, after))
print(json.dumps(results))
`)).toEqual(Array(14).fill(false));
});

it('requires opt-in, is idempotent, preserves other WAM bytes and does not mutate its inputs', () => {
  expect(run(`
with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory); (root/'maps').mkdir()
    (root/'maps/overworld.tmj').write_bytes(tmj)
    (root/'maps/speaker-aries.tmj').write_bytes(tmj)
    other = b'{"mapUrl":"speaker-aries.tmj?v=' + pin.encode() + b'","areas":[], "entities":{}}'
    live = {path: encode(saved), 'maps/speaker-aries.wam':other}; untouched = copy.deepcopy(live)
    normal, _ = migrate(live, root)
    try:
        updated, summary = migrate(live, root, arrival_check_in=True)
        again, _ = migrate({**live, **updated}, root, arrival_check_in=True)
        result = {'optIn': normal == {}, 'expected': json.loads(updated[path]) == expected,
            'unchangedInput': live == untouched, 'idempotent': again == {},
            'onlyOverworld': list(updated) == [path], 'summary': summary['migrated'] == [path]}
    except TypeError:
        result = {'missingMigration': True}
    print(json.dumps(result))
`)).toEqual({optIn: true, expected: true, unchangedInput: true, idempotent: true, onlyOverworld: true, summary: true});
});

it('fails closed if another saved area intersects the newly added strip', () => {
  expect(run(`
before = copy.deepcopy(saved); after = copy.deepcopy(expected)
neighbor = {'id':'new-neighbor','name':'keep','x':2464,'y':1920,'width':32,'height':32,'properties':[]}
before['areas'].append(neighbor); after['areas'].append(neighbor)
print(json.dumps({'accepted': admitted(before, after)}))
`)).toEqual({accepted: false});
});
