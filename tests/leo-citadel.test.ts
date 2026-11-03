import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {loadTileCatalog} from '../tools/art/catalog';
import {buildMap} from '../tools/maps/builder';
import type {MapLayout,TiledMap} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
describe('Leo citadel exterior',()=>{
 it('uses a new whole building, with the lion integrated into its architecture',()=>{
  const l=read('world/layouts/overworld.json') as MapLayout,c=loadTileCatalog(),p=l.placements.find(p=>p.id==='leo-building')!;
  expect(p.sprite).toBe('leo-citadel');
  expect(c[p.sprite].sheet).toBe('assets/tilesets/original/leo-citadel.png');
  expect(l.placements.some(p=>p.id==='leo-lion-head')).toBe(false);
  expect([p.x,p.y,p.width,p.height]).toEqual([36,96,12,12]);
 });
 it('keeps the roof walk-behind, solid lower walls and the open two-tile doorway',()=>{
  const l=read('world/layouts/overworld.json') as MapLayout,c=loadTileCatalog(),p=l.placements.find(p=>p.id==='leo-building')!,s=c[p.sprite];
  expect(s.level).toBe('aboveAvatar');
  expect(s.blockingCells).toEqual(c['grounded-zodiac-physical-leo'].blockingCells);
  const m=buildMap(l,c).tmj,layer=m.layers.find(l=>l.name==='physical-collisions');
  if(layer?.type!=='tilelayer')throw Error('missing physics');
  for(let x=0;x<12;x++)expect(layer.data[(p.y+7)*m.width+p.x+x]).toBe(0);
  for(const y of [9,10,11]){
   for(const x of [5,6])expect(layer.data[(p.y+y)*m.width+p.x+x]).toBe(0);
   for(const x of [1,2,3,8,9,10])expect(layer.data[(p.y+y)*m.width+p.x+x]).not.toBe(0);
  }
 });
 it('preserves all campus controls and old atlas reservations',()=>{
  const m=read('maps/overworld.tmj') as TiledMap,r=read('world/leo-citadel.json');
  for(const[name,digest]of Object.entries(r.protectedLayers))expect(sha(m.layers.find(l=>l.name===name)),name).toBe(digest);
  const index=m.tilesets.findIndex(t=>t.image==='../assets/tilesets/original/leo-citadel.png');
  expect(index).toBe(104);
  expect(sha(m.tilesets.slice(0,index))).toBe(r.priorAtlasesSha256);
 });
});
