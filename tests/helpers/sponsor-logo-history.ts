import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const bytes=readFileSync('tests/fixtures/sponsor-logos/provenance.json');
assert.equal(sha(bytes),'735c92707f7f06a7280c3b824e8f352ee8a6c021f71e6664168feb28e47c11b2');
const receipt=JSON.parse(bytes.toString());
/** Reconstruct only the pinned predecessor fingerprints for historical assertions. */
export function sponsorLogoPreviousSourceHash(path:string):string{
 const actual=sha(readFileSync(path)),pair=receipt.inputs[path];
 if(!pair)return actual;
 assert.equal(actual,pair[1],'Changed sponsor dependency: '+path);return pair[0];
}
export function sponsorLogoPreviousJson(path:string):any{
 const value=JSON.parse(readFileSync(path,'utf8'));
 if(receipt.files[path]){
  for(const o of path.startsWith('world/')?value.animatedOverlays:[value.overlay])for(const input of o.provenance?.inputs??[]){
   const pair=receipt.inputs[input.path];if(!pair)continue;
   assert.equal(input.sha256,pair[1]);input.sha256=pair[0];
  }
  assert.equal(sha(JSON.stringify(value)),receipt.files[path]);
 }
 if(path==='art/sources.json'){
  for(const row of value.original.files)if(receipt.registry.records[row.path]){assert.equal(row.sha256,sha(readFileSync(row.path)));row.sha256=receipt.registry.records[row.path];}
  assert.equal(sha(JSON.stringify(value)),receipt.registry.beforeSha256);
 }
 return value;
}
