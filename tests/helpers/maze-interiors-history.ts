import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import type {MapLayout,TiledMap} from '../../tools/maps/types';

// Frozen, finite visual successor. Historical checks still compare their
// original bytes; changed controls or unexpected scenery fail closed here.
const raw=readFileSync('tests/fixtures/maze-interiors/successor.json.gz');
assert.equal(createHash('sha256').update(raw).digest('hex'),'5353d2ce39f6d517718f58833f2f556fe41f053c2ffc5319c543ac9cf5aa2b2e');
const receipt=JSON.parse(gunzipSync(raw).toString());
assert.equal(receipt.version,1);
assert.equal(receipt.base,'3486c0f93745d60c71fc5859108a2555d9e51ee3');
export function beforeMazeInteriorLayout(input:MapLayout):MapLayout{
 const row=receipt.components[`world/layouts/${input.id}.json`];
 if(!row)return input;
 assert.deepEqual(input,row.after,'Unexpected maze interior layout mutation');
 return structuredClone(row.before);
}
export function beforeMazeInteriorMap(input:TiledMap):TiledMap{
 const id=input.properties?.find(p=>p.name==='worldMapId')?.value;
 const row=receipt.components[`maps/${id}.tmj`];
 if(!row)return input;
 assert.deepEqual(input,row.after,'Unexpected maze interior native mutation');
 return structuredClone(row.before);
}
export function advanceMazeInteriorLayout(input:MapLayout):MapLayout{
 const row=receipt.components[`world/layouts/${input.id}.json`];
 if(!row)return input;
 assert.deepEqual(input,row.before,'Unexpected maze interior predecessor');
 return structuredClone(row.after);
}
export function mazeInteriorSuccessorSha(path:string,pin:string):string{
 const pair=receipt.transitions[path];
 return pair&&pair[0]===pin?pair[1]:pin;
}
