import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
const hash=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const bytes=readFileSync('tests/fixtures/expo-roster/provenance.json');
const receipt=JSON.parse(bytes.toString());
describe('expo roster dependency provenance',()=>{
 it('refreshes only the changed checker fingerprint in animation descriptors',()=>{
  expect(hash(bytes)).toBe('c12df57680d0e61cf71fd556b5167c90802b4790443a3b0ce384f2f985eb9b18');
  for(const [path,pair]of Object.entries(receipt.inputs) as [string,string[]][])expect(hash(readFileSync(path))).toBe(pair[1]);
  for(const [path,prior]of Object.entries(receipt.files)){
   const v=JSON.parse(readFileSync(path,'utf8'));
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
  const r=JSON.parse(readFileSync('art/sources.json','utf8'));
  for(const row of r.original.files){const prior=receipt.registry.records[row.path];if(!prior)continue;
   expect(row.sha256,row.path).toBe(hash(readFileSync(row.path)));row.sha256=prior;
  }
  expect(hash(JSON.stringify(r))).toBe(receipt.registry.beforeSha256);
 });
});
