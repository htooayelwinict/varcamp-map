import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import type {TiledMap} from '../../tools/maps/types';

const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const bytes=readFileSync('tests/fixtures/expo-roster/provenance.json');
assert.equal(sha(bytes),'c12df57680d0e61cf71fd556b5167c90802b4790443a3b0ce384f2f985eb9b18');
const receipt=JSON.parse(bytes.toString());
export function beforeExpoRosterNative(map:TiledMap):TiledMap{
 if(sha(JSON.stringify(map))!=='2b8ab04a965ca2d1dbb1b08e3da45430bd59f3f671563179e5ca856bae86a027')return map;
 const b=readFileSync('tests/fixtures/expo-roster/before.json.gz');
 assert.equal(sha(b),'648a20b52344403b583c4c2f7d95367234891fce947990bc48c176d810446ba2');
 return JSON.parse(gunzipSync(b).toString())['maps/overworld.tmj'];
}
/** Historical checks may undo only the recorded checker-fingerprint successor. */
export function expoRosterPreviousSourceHash(path:string):string{
 const actual=sha(readFileSync(path)),pair=receipt.inputs[path];
 if(!pair)return actual;
 assert.equal(actual,pair[1]);return pair[0];
}
export function expoRosterPreviousJson(path:string):any{
 const value=JSON.parse(readFileSync(path,'utf8'));
 if(receipt.files[path]){
  for(const o of path.startsWith('world/')?value.animatedOverlays:[value.overlay])for(const i of o.provenance?.inputs??[]){
   const pair=receipt.inputs[i.path];if(pair){assert.equal(i.sha256,pair[1]);i.sha256=pair[0];}
  }
  assert.equal(sha(JSON.stringify(value)),receipt.files[path]);
 }
 if(path==='art/sources.json'){
  for(const r of value.original.files)if(receipt.registry.records[r.path]){assert.equal(r.sha256,sha(readFileSync(r.path)));r.sha256=receipt.registry.records[r.path];}
  assert.equal(sha(JSON.stringify(value)),receipt.registry.beforeSha256);
 }
 return value;
}
