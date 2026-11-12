import {expoRosterPreviousJson,expoRosterPreviousSourceHash} from './helpers/expo-roster-history';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
const hash=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const bytes=readFileSync('tests/fixtures/sponsor-logos/provenance.json');
const receipt=JSON.parse(bytes.toString());
describe('sponsor atlas dependency provenance',()=>{
 it('refreshes only the changed checker fingerprint in animation descriptors',()=>{
  expect(hash(bytes)).toBe('735c92707f7f06a7280c3b824e8f352ee8a6c021f71e6664168feb28e47c11b2');
  for(const [path,pair]of Object.entries(receipt.inputs) as [string,string[]][])expect(expoRosterPreviousSourceHash(path)).toBe(pair[1]);
  for(const [path,prior]of Object.entries(receipt.files)){
   const v=expoRosterPreviousJson(path);
   for(const o of path.startsWith('world/')?v.animatedOverlays:[v.overlay])for(const input of o.provenance?.inputs??[]){
    const pair=receipt.inputs[input.path];if(!pair)continue;
    expect(input.sha256,path+' / '+input.path).toBe(pair[1]);input.sha256=pair[0];
   }
   expect(hash(JSON.stringify(v)),path+' changed beyond its dependency fingerprint').toBe(prior);
  }
 });
 it('preserves every affected native map and animation PNG',()=>{
  for(const [path,pin]of Object.entries({...receipt.native,...receipt.art}))expect(hash(readFileSync(path)),path).toBe(pin);
 });
 it('updates only the corresponding source-file registrations',()=>{
  const r=expoRosterPreviousJson('art/sources.json');
  for(const row of r.original.files){const prior=receipt.registry.records[row.path];if(!prior)continue;
   expect(row.sha256,row.path).toBe(hash(JSON.stringify(expoRosterPreviousJson(row.path),null,2)+'\n'));row.sha256=prior;
  }
  expect(hash(JSON.stringify(r))).toBe(receipt.registry.beforeSha256);
 });
});
