import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import {isCurrentAircraft} from '../tools/maps/airborne';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex');
const before=read('tests/fixtures/coast-flight-full-before.json');
describe.each(['shipyard-beach','constellation-shore'])('%s complete sponsor flight',id=>{
 it('covers the full map with one synchronized aircraft crossing, without a central clip boundary',()=>{
  const l=read(`world/layouts/${id}.json`),m=read(`maps/${id}.tmj`);
  const flights=l.animatedOverlays.filter((o:any)=>o.name.startsWith('coastal-flight'));
  expect(flights).toHaveLength(2);
  expect(flights.map((o:any)=>[o.name,o.x,o.y,o.width,o.height])).toEqual([
   ['coastal-flight',0,id==='shipyard-beach'?5:23,48,3],['coastal-flight-east',48,id==='shipyard-beach'?5:23,48,3],
  ]);
  expect(flights.at(-1).x+flights.at(-1).width).toBe(m.width);
  for(const o of flights){
   expect(isCurrentAircraft(id,o.name)).toBe(true);
   expect(o.level).toBe('aboveScenery');
   expect(o.animations.every((a:any)=>a.frames.reduce((n:number,f:any)=>n+f.duration,0)===42800)).toBe(true);
   const layer=m.layers.find((v:any)=>v.name===o.name),set=m.tilesets.find((v:any)=>v.name===o.name);
   expect(layer.data.filter(Boolean)).toHaveLength(144);
   for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++)expect(layer.data[y*m.width+x]).toBe(x>=o.x&&x<o.x+48&&y>=o.y&&y<o.y+3?set.firstgid+o.carrierTileIds[(y-o.y)*48+x-o.x]:0);
  }
  expect(m.layers.slice(-2).map((v:any)=>v.name)).toEqual(['coastal-flight','coastal-flight-east']);
 });
 it('preserves every walking cell, source WAM, non-aircraft placement and existing activity',()=>{
  const l=read(`world/layouts/${id}.json`),m=read(`maps/${id}.tmj`),old=before[id];
  const mask=m.layers.find((v:any)=>v.name==='physical-collisions').data;
  expect(hash(JSON.stringify(mask.map(Boolean)))).toBe(old.collision);
  const {animatedOverlays,...rest}=l;expect(rest).toEqual(old.layoutWithoutFlights);
  expect(animatedOverlays.filter((o:any)=>!o.name.startsWith('coastal-flight'))).toEqual(old.overlaysWithoutFlights);
  expect(hash(readFileSync(`maps/${id}.wam`))).toBe(old.sourceWam);
 });
 it('passes native validation and rejects an incomplete flight or a broken east-half clock',()=>{
  const l=read(`world/layouts/${id}.json`),m=read(`maps/${id}.tmj`),w=read(`maps/${id}.wam`),c=loadTileCatalog();
  expect(()=>assertCurrentNativeMap(id,m,l,w,c)).not.toThrow();
  const missing=structuredClone(l);missing.animatedOverlays=missing.animatedOverlays.filter((o:any)=>o.name!=='coastal-flight-east');
  expect(()=>assertCurrentNativeMap(id,m,missing,w,c)).toThrow();
  const drift=structuredClone(l),east=drift.animatedOverlays.find((o:any)=>o.name==='coastal-flight-east');
  expect(east).toBeDefined();east.animations[0].frames[0].duration+=100;
  expect(()=>assertCurrentNativeMap(id,m,drift,w,c)).toThrow();
 });
});
