import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {sponsorLogoPreviousJson,sponsorLogoPreviousSourceHash} from './helpers/sponsor-logo-history';

const hash=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const bytes=readFileSync('tests/fixtures/sponsor-tiers/provenance.json');
const receipt=JSON.parse(bytes.toString()) as {inputs:Record<string,[string,string]>;files:Record<string,string>;native:Record<string,string>;art:Record<string,string>;registry:{beforeSha256:string;records:Record<string,string>}};
describe('sponsor integration provenance refresh',()=>{
 it('updates only the two reviewed shared-code dependencies in existing animation descriptors',()=>{
  expect(hash(bytes)).toBe('6e902c287fc230968d62a2a568fe2a0efa18d279410462de56d222c049d5d87f');
  for(const [path,pair]of Object.entries(receipt.inputs))expect(sponsorLogoPreviousSourceHash(path),path).toBe(pair[1]);
  for(const [path,prior]of Object.entries(receipt.files)){
   const value=sponsorLogoPreviousJson(path);
   const overlays=path.startsWith('world/')?value.animatedOverlays:[value.overlay];
   for(const overlay of overlays??[])for(const input of overlay.provenance?.inputs??[]){
    const pair=receipt.inputs[input.path];if(!pair)continue;
    expect(input.sha256,path+' / '+input.path).toBe(pair[1]);input.sha256=pair[0];
   }
   expect(hash(JSON.stringify(value)),path+' has unrelated changes').toBe(prior);
  }
 });
 it('preserves every affected native map and animation PNG byte-for-byte',()=>{
  for(const [path,pin]of Object.entries({...receipt.native,...receipt.art}))expect(hash(readFileSync(path)),path).toBe(pin);
 });
 it('refreshes the exact metadata registrations without changing other source attribution',()=>{
  const registry=sponsorLogoPreviousJson('art/sources.json');
  for(const [path,prior]of Object.entries(receipt.registry.records)){
   const rows=registry.original.files.filter((row:{path:string})=>row.path===path);
   expect(rows,path).toHaveLength(1);
   expect(rows[0].sha256,path).toBe(hash(JSON.stringify(sponsorLogoPreviousJson(path),null,2)+'\n'));
   rows[0].sha256=prior;
  }
  expect(hash(JSON.stringify(registry))).toBe(receipt.registry.beforeSha256);
 });
});
