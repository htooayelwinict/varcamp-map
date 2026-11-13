import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {loadTileCatalog} from '../tools/art/catalog';
import {buildMap} from '../tools/maps/builder';
import {assertNativePlaza} from '../tools/maps/plaza-native';
import type {MapLayout,TiledMap} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const expectedUpper=Array.from({length:132},(_,i)=>[i%12,Math.floor(i/12)]);
function checkDepth(map:TiledMap){
 const set=map.tilesets.find(t=>t.image?.endsWith('/capricorn-citadel.png'))!;
 expect(set).toBeDefined();
 const floor=map.layers.findIndex(l=>l.name==='floorLayer');
 for(let y=0;y<12;y++)for(let x=0;x<12;x++){
  const at=(14+y)*map.width+58+x,gid=set.firstgid+y*12+x;
  const owners=map.layers.flatMap((l,i)=>l.type==='tilelayer'&&l.data[at]===gid?[i]:[]);
  expect(owners,`Capricorn cell ${x},${y} must paint once`).toHaveLength(1);
  expect(owners[0]<floor,`Capricorn cell ${x},${y}: front edge behind avatar, upper building above`).toBe(y===11);
 }
}
describe('Capricorn front edge keeps approaching Wokas visible',()=>{
 it('places only the bottom sprite row below avatars in the native map',()=>checkDepth(read('maps/overworld.tmj')));
 it('preserves preview boards and every field outside the approved front row',()=>{
  const m=read('maps/preview/overworld.tmj') as TiledMap;checkDepth(m);
  for(const l of m.layers)if(l.type==='tilelayer'&&['scenery-belowAvatar-1','scenery-aboveAvatar-0'].includes(l.name))for(let x=58;x<70;x++)l.data[25*128+x]=0;
  expect(hash(m)).toBe('710e4f64a8e23b3f0d8722fb69ac2a7f6cf30f8c2026d04b9c7d843bc3dbaf15');
 });
 it('retains the same depth on regenerated maps',()=>{
  const c=loadTileCatalog();expect(c['capricorn-citadel'].upperCells).toEqual(expectedUpper);
  checkDepth(buildMap(read('world/layouts/overworld.json') as MapLayout,c).tmj);
 });
 it('preserves all wall collisions, portal controls, artwork and unrelated map layers',()=>{
  const m=read('maps/overworld.tmj') as TiledMap,c=loadTileCatalog();
  expect(hash(m.layers.find(l=>l.name==='physical-collisions'))).toBe('1d22f15655ca280751b8f625472c42a103704bbe1d186fba20cbf8d1b3bcd5ae');
  const {layers,...envelope}=m;expect(hash(envelope)).toBe('f93c9e5c6d33606c831390441f60ac9b78dc581dc95588d6c4cf8719677331e0');
  expect(hash(layers.filter(l=>!['scenery-belowAvatar-1','scenery-aboveAvatar-0'].includes(l.name)))).toBe('ed4dfaf681b5602f706cf1b00dddf18acaca65ebd500c4cff9146b842bbdaf6a');
  const original=structuredClone(c);delete original['capricorn-citadel'].upperCells;expect(hash(original)).toBe('e0d581ba768e5df6c4e52f9610dbc57be84517b8b8947a77dca6f9c123b47401');
 });
 it('validates the current native export and rejects restoring the occluding front row',()=>{
  const m=read('maps/overworld.tmj') as TiledMap,l=read('world/layouts/overworld.json'),c=loadTileCatalog();
  expect(()=>assertNativePlaza(m,l,c)).not.toThrow();
  const bad=structuredClone(c);delete bad['capricorn-citadel'].upperCells;
  expect(()=>assertNativePlaza(m,l,bad)).toThrow();
 },20000);
});
