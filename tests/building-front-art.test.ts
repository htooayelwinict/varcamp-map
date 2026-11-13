import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {loadTileCatalog} from '../tools/art/catalog';
import {checkLeoCitadelArt} from '../tools/art/leo-citadel';
import {checkCancerCitadelArt} from '../tools/art/cancer-citadel';
import {checkHornedCitadelArt} from '../tools/art/horned-citadels';
const sources=()=>JSON.parse(readFileSync('art/sources.json','utf8'));
const families=[
 {id:'leo-citadel',sprites:['leo-citadel'],check:checkLeoCitadelArt},
 {id:'cancer-citadel',sprites:['cancer-citadel'],check:checkCancerCitadelArt},
 {id:'horned-citadels',sprites:['aries-citadel','capricorn-citadel'],check:checkHornedCitadelArt},
];
describe('art provenance accepts current front depth without changing image masters',()=>{
 for(const f of families){
  it(f.id+' accepts the current catalog with the retained exact PNG and metadata',async()=>{
   await expect(f.check(loadTileCatalog(),sources())).resolves.toBeUndefined();
  });
  it(f.id+' still rejects an incorrect front partition after verifying artwork',async()=>{
   for(const id of f.sprites){const c=loadTileCatalog();c[id].upperCells!.push([0,11]);await expect(f.check(c,sources())).rejects.toThrow('catalog changed');}
  });
  it(f.id+' requires provenance for the shared depth rule',async()=>{
   const s=sources();s[f.id].files=s[f.id].files.filter((r:{path:string})=>r.path!=='tools/maps/building-front-edges.ts');
   await expect(f.check(loadTileCatalog(),s)).rejects.toThrow('source family missing');
  });
 }
});
