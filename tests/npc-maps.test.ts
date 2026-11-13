import { historicalEditorWam } from './helpers/editor-catalog-history';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { historicalNative } from './helpers/visibility-history';
import { retireHistoricalHosts } from './helpers/retired-host-layout';
import type { MapLayout, TiledMap } from '../tools/maps/types';

function frozenOverworld(kind:'tmj'):TiledMap;
function frozenOverworld(kind:'json'):MapLayout;
function frozenOverworld(kind:'tmj'|'json'):TiledMap|MapLayout{
 const raw=readFileSync(`tests/fixtures/overworld-history/17d4-${kind==='tmj'?'native.tmj':'layout.json'}`);
 expect(createHash('sha256').update(raw).digest('hex')).toBe(kind==='tmj'?'87e88dd082910b789578188147e9b91b1f060c9d62309c158b785c2bf4cbbaad':'6e1ba3eaec7223e9b64bbd7aff48863bbfe2992a84ff199c7574857c781e533e');
 return JSON.parse(raw.toString());
}
const load = (id: string): MapLayout => JSON.parse(readFileSync(`world/layouts/${id}.json`, 'utf8'));
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const hosts = [['overworld','guide'],['orbit-maze','maze-keeper'],['comet-maze','maze-keeper'],['shipyard-beach','dockmaster']] as const;

it.each(hosts)('retires %s robots and conversation areas even when older authored layouts contain them', (map, npc) => {
 const input=load(map),area=`npc-${npc}`;
 input.areas.push({id:area,name:area,x:1,y:1,width:3,height:3,properties:[]});
 input.placements.push({id:`npc-character-${npc}`,sprite:area,x:2,y:0,width:1,height:2,layer:'props'});
 input.signs ??= [];input.signs.push({name:`npc-name-${npc}`,text:'Retired robot',x:1,y:4,width:9,height:1});
 const before=structuredClone(input),once=retireHistoricalHosts([input])[0],twice=retireHistoricalHosts([once])[0];
 expect(input).toEqual(before);expect(twice).toEqual(once);
 expect(once.placements).toEqual(before.placements.filter(p=>p.id!==`npc-character-${npc}`));
 expect(once.signs).toEqual(before.signs!.filter(s=>s.name!==`npc-name-${npc}`));
 expect(once.areas).toEqual(before.areas.filter(a=>a.name!==area));
});

it('never recreates the retired robots from any of the 33 authored layouts', () => {
 const layouts=readdirSync('world/layouts').filter(f=>f.endsWith('.json')).map(f=>load(f.slice(0,-5)));
 const output=retireHistoricalHosts(layouts);
 for(const l of output){
  expect(l.placements.filter(p=>p.id.startsWith('npc-character-'))).toEqual([]);
  expect(l.signs?.filter(s=>s.name.startsWith('npc-name-'))??[]).toEqual([]);
  expect(l.areas.filter(a=>a.name.startsWith('npc-'))).toEqual([]);
 }
 for(const l of layouts.filter(l=>!hosts.some(([id])=>id===l.id)))expect(output.find(o=>o.id===l.id)).toEqual(l);
});

// Independently derived from d669f9b native sources by deleting only the eight
// reviewed tile values, four npc-name objects and four named WAM areas. These
// exact semantic receipts protect every unrelated GID/object/area/tileset/id.
const receipts = [
 ['overworld','0e2d4fff09d8476eed187ae8a25bfdbd72182a35846ad02b1f89a62fcd8647d1','d814b31d260514f738f6a84bc6da27ce9f16daf7e2076209a79e7b17b9e047d2','52144728bfac5871f254558ad6ab8219c6771f45192fccc5417d995807f7a202'],
 ['orbit-maze','83089e4f3bde8114a9d6af7a740b4d188507197045cbd7a1ce2040e5e755dc96','d68e937981c85baa78afcefe8c1307612cad57e6132846fa1751b0c3c8cd9251','7d5488c561aa1edc382d50a3bf300097f07b6c751613ee7bad50a5acd549673d'],
 ['comet-maze','eda31556f69606df4710529b3fb857860b11478ce0af7a886e6c07e7daf83844','f5a3e2ac2ceefd0dbaa580bf64c246321c4fdfeb863bc7a8e327076d77b059b3','a3ca03b872ca67d4f31e0137c9d839836f1058a92998a0552a077d74d5e722d4'],
 ['shipyard-beach','c656d02d3e7675dc3cbe54ac20649c1be6c93aec8969be5249c805bc918db11e','7cffc6dff554af782ae81458003778d0f35d2b9356145d4fb4c370386df62b4e','8e25036aa5030b792cb3661955b9508f84b9c207b166f75a49935b3a44510f3c'],
];
it.each(receipts)('removes only reviewed %s native robot data while preserving collisions and every unrelated field', (id, tmjHash, wamHash, maskHash) => {
 // Later reviewed beach artwork has a separate strict delta receipt. Keep this
 // historical retirement proof against its exact committed native snapshot, so
 // shallow CI needs no git history and none of the old receipts are repinned.
 const nativePath=id==='shipyard-beach'?'tests/fixtures/beach-retirement/retired-native.tmj':`maps/${id}.tmj`;
 const tmj=id==='shipyard-beach'?JSON.parse(readFileSync(nativePath,'utf8')):id==='overworld'?frozenOverworld('tmj'):historicalNative(id),wam=historicalEditorWam(id);
 // First prove the exact frozen17d4 fixture without consulting current navigation;
 // only then apply the independently verified historical Roadster inversion.
 if(id==='overworld'){tmj.layers=tmj.layers.filter((l:{name:string})=>l.name!=='roadster');tmj.tilesets=tmj.tilesets.filter((s:{name:string})=>s.name!=='roadster');tmj.nextlayerid--;}
 expect(digest(tmj)).toBe(tmjHash);expect(digest(wam)).toBe(wamHash);
 expect(digest(tmj.layers.find((l:{name:string})=>l.name==='physical-collisions').data)).toBe(maskHash);
});
it('applies the actual retirement function to the historical beach layout without unrelated drift',()=>{
 const input=JSON.parse(readFileSync('tests/fixtures/beach-retirement/before-layout.json','utf8')) as MapLayout;
 // Exact d669f9b source and independently extracted 888dd3c post-retirement
 // authored result; these protect the historical behavior, not current artwork.
 expect(digest(input)).toBe('4c7fb658839bec9b85f05ae6b8bc017c9b721d0d730fa83209f7603e6af8d7a5');
 const before=structuredClone(input),retired=retireHistoricalHosts([input])[0];
 expect(input).toEqual(before);expect(retireHistoricalHosts([retired])[0]).toEqual(retired);
 expect(digest(retired)).toBe('2be30eb4c14bc7e19b4513e48d8664ed5531471338f1c7d2c63716a9010e3af7');
 expect(retired.areas.some(a=>a.name==='npc-dockmaster')).toBe(false);
});
it('has no visible robot tile or name in any native map and keeps the compact cove direction signs', () => {
 for(const file of readdirSync('maps').filter(f=>f.endsWith('.tmj'))){
  const tmj=JSON.parse(readFileSync(`maps/${file}`,'utf8'));
  for(const s of tmj.tilesets.filter((s:{image:string})=>s.image.endsWith('/guides.png')))
   for(const l of tmj.layers)expect((l.data??[]).filter((g:number)=>g>=s.firstgid&&g<s.firstgid+s.tilecount)).toEqual([]);
  for(const l of tmj.layers)expect((l.objects??[]).filter((o:{name:string})=>o.name.startsWith('npc-name-'))).toEqual([]);
 }
 const beach=JSON.parse(readFileSync('maps/shipyard-beach.tmj','utf8'));
 expect(beach.layers.some((l:{name:string})=>l.name==='standing-caption-dockmaster-station')).toBe(false);const caption=beach.layers.find((l:{name:string})=>l.name==='standing-caption-boarding-label');expect(caption.properties).toContainEqual({name:'captionText',type:'string',value:'↓ FA SHIP'});expect(caption.data.filter(Boolean)).toHaveLength(3);
 expect(beach.layers.flatMap((l:{objects?:unknown[]})=>l.objects??[]).some((o:{name:string})=>o.name==='dockmaster-station')).toBe(false);
});
