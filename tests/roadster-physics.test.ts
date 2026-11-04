import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import {restoreArrivalHospitality} from '../tools/maps/arrival-hospitality';

const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
describe('Tesla display footprint',()=>{
 it('blocks the full hover and flip bay while leaving the surrounding walkway open',()=>{
  const m=read('maps/overworld.tmj'),mask=m.layers.find((l:any)=>l.name==='physical-collisions').data;
  for(let y=53;y<58;y++)for(let x=83;x<88;x++)expect(Boolean(mask[y*128+x]),`${x},${y}`).toBe(true);
  for(let x=82;x<=88;x++)for(const y of [52,58])expect(Boolean(mask[y*128+x]),`${x},${y}`).toBe(false);
  for(let y=53;y<58;y++)for(const x of [82,88])expect(Boolean(mask[y*128+x]),`${x},${y}`).toBe(false);
 });
 it('rejects removing the collision footprint from the current release',()=>{
  const layout=read('world/layouts/overworld.json');layout.placements=layout.placements.filter((p:any)=>p.id!=='roadster-solid-pad');
  expect(()=>restoreArrivalHospitality(layout)).toThrow('unreviewed source layout');
  expect(()=>assertCurrentNativeMap('overworld',read('maps/overworld.tmj'),layout,read('maps/overworld.wam'),read('art/tile-catalog.json'))).toThrow();
 });
});
