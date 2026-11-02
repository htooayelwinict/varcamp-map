import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {describe,it,expect} from 'vitest';
import sharp from 'sharp';
import data from '../world/room-refinement.json';
import {restoreAuditoriumSpacing} from '../tools/maps/auditorium-spacing';
import {restoreRoomRefinement,applyRoomRefinement} from '../tools/maps/room-refinement';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import type {MapLayout} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const catalog=loadTileCatalog();
describe('Reference-inspired auditorium interiors',()=>{
 it.each(Object.keys(data.maps))('%s preserves functional zones, seat counts and native routes',id=>{
  const current=read(`world/layouts/${id}.json`) as MapLayout,l=restoreAuditoriumSpacing(current),before=restoreRoomRefinement(l);
  expect(isDeepStrictEqual(applyRoomRefinement(before),l)).toBe(true);
  for(const field of ['entries','exits','areas','inspectionZones','animatedOverlays','images'] as const)expect(isDeepStrictEqual(l[field],before[field])).toBe(true);
  expect(l.placements.filter(p=>p.id.startsWith(id.startsWith('speaker-')?'audience-chair-':'seat-')).length).toBe(id.startsWith('speaker-')?36:60);
  expect(l.images!.length).toBe(id.startsWith('speaker-')?1:3);
  expect(()=>assertCurrentNativeMap(id,read(`maps/${id}.tmj`),current,read(`maps/${id}.wam`),catalog)).not.toThrow();
 });
 it('new floor tiles are fully opaque at the actual native atlas coordinates',async()=>{
  for(const s of Object.values(data.aliases)){
   const{data:rgba}=await sharp(s.sheet).extract({left:s.rect.x*32,top:s.rect.y*32,width:32,height:32}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   expect(Array.from({length:1024},(_,i)=>rgba[i*4+3]).every(a=>a===255)).toBe(true);
  }
 });
 it('rejects a furniture drift before trying to print an entire native map',()=>{const l=read('world/layouts/speaker-aries.json');l.placements.find((p:{id:string})=>p.id==='speaker-lectern').x++;expect(()=>restoreRoomRefinement(l)).toThrow(/unreviewed source/);});
});
