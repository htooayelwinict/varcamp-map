import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {resolve} from 'node:path';
import {describe,it,expect} from 'vitest';import sharp from 'sharp';
import {renderRoadsterFlight,flightAltitude,flightTimeline,FLIGHT_ATLAS,FLIGHT_METADATA} from '../tools/art/roadster-flight';
import {applyRoadsterFlight,restoreRoadsterFlight} from '../tools/maps/roadster-flight';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import type {TileLayer,TiledMap} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8')),sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const render=renderRoadsterFlight();
describe('Roadster longitudinal flight',()=>{
 it('reproduces the committed poses and atlas within the existing native memory bound',async()=>{
  const r=await render;expect(r.png.equals(readFileSync(FLIGHT_ATLAS))).toBe(true);expect(sha(JSON.stringify(r.metadata))).toBe(sha(JSON.stringify(read(FLIGHT_METADATA))));
  expect(r.metadata.diagnostics.decodedRgbaBytes).toBeLessThanOrEqual(4*1024*1024);expect(r.metadata.overlay).toMatchObject({x:83,y:53,width:5,height:5});
  expect(r.metadata.frames.reduce((n,f)=>n+f.durationMs,0)).toBe(12800);expect(r.metadata.frames.every(f=>f.durationMs>=100)).toBe(true);
 });
 it('performs one monotonic longitudinal roll, showing distinct underbody and side surfaces',async()=>{
  const r=await render,steps=flightTimeline(),air=steps.filter(s=>s.timeMs>=3400&&s.timeMs<=6400);
  expect(air[0].rollDeg).toBe(0);expect(air.at(-1)!.rollDeg).toBe(360);expect(air.map(s=>s.rollDeg)).toEqual(air.map(s=>s.rollDeg).sort((a,b)=>a-b));
  expect(steps.filter(s=>s.phase==='roll').map(s=>s.pose)).toEqual(Array.from({length:16},(_,i)=>i));
  expect(new Set(r.poses.map(sha)).size).toBe(16);
  const a=r.poses[0],b=r.poses[8];let different=0;for(let y=1;y<159;y++)for(let x=1;x<159;x++){const i=(y*160+x)*4,j=((160-y)*160+160-x)*4;if(!a.subarray(j,j+4).equals(b.subarray(i,i+4)))different++;}
  expect(different).toBeGreaterThan(2000); // A half turn must not be the old roof bitmap rotated in the screen plane.
 });
 it('rises to one apex and descends with a bounded velocity, then brakes and settles upright',()=>{
  const h=Array.from({length:301},(_,i)=>flightAltitude(i*10)),peak=h.indexOf(Math.max(...h));expect(peak).toBe(115);expect(h[peak]).toBe(54);
  expect(h.slice(0,peak+1)).toEqual(h.slice(0,peak+1).sort((a,b)=>a-b));expect(h.slice(peak)).toEqual(h.slice(peak).sort((a,b)=>b-a));
  expect(Math.max(...h.slice(1).map((v,i)=>Math.abs(v-h[i])))).toBeLessThan(.9);expect(h[0]).toBe(0);expect(h.at(-1)).toBe(0);
  const steps=flightTimeline();expect(steps.filter(s=>s.jets==='brake').every(s=>s.pose===0&&s.altitudePx<25)).toBe(true);expect(steps.filter(s=>s.phase==='touchdown').map(s=>s.bodyY)).toEqual([2,1]);
 });
 it('keeps every pixel inside the solid bay and loops without a pose jump',async()=>{
  const r=await render;expect(r.frames[0].equals(r.frames.at(-1)!)).toBe(true);
  for(const f of r.frames){let bad=false;for(let i=0;i<160*160;i++){const a=f[i*4+3];if(a!==0&&a!==255)bad=true;if(a&&(i%160===0||i%160===159||i<160||i>=159*160))bad=true;}expect(bad).toBe(false);}
  const m=read('maps/overworld.tmj'),mask=m.layers.find((l:any)=>l.name==='physical-collisions').data;for(let y=53;y<58;y++)for(let x=83;x<88;x++)expect(Boolean(mask[y*128+x])).toBe(true);
 });
 it('resolves every carrier through the deployed Phaser parser, including two loop boundaries',async()=>{
  const r=await render,m=read('maps/overworld.tmj') as TiledMap,s=m.tilesets.find(s=>s.name==='roadster')!,l=m.layers.find(l=>l.name==='roadster') as TileLayer;
  const root='docs/qa/coastal-flight-2026-10-16/prototype';for(const e of read(root+'/source-manifest.json'))expect(sha(readFileSync(root+'/'+e.path))).toBe(e.sha256);
  const parse=createRequire(import.meta.url)(resolve(root,'upstream/phaser/src/tilemaps/parsers/tiled/ParseTilesets.js')),engine=parse(structuredClone(m)).tilesets.find((t:any)=>t.firstgid===s.firstgid),atlas=await sharp(r.png).ensureAlpha().raw().toBuffer();
  const times:number[]=[];let time=0;for(const f of r.metadata.frames){times.push(time);time+=f.durationMs;}times.push(12800,25600);
  for(let k=0;k<times.length;k++){
   const out=Buffer.alloc(160*160*4);for(let y=0;y<5;y++)for(let x=0;x<5;x++){
    const gid=engine.getAnimatedTileId(l.data[(53+y)*128+83+x],times[k]);expect(gid).not.toBeNull();const id=gid-s.firstgid,sx=id%16*32,sy=Math.floor(id/16)*32;
    for(let row=0;row<32;row++)atlas.copy(out,((y*32+row)*160+x*32)*4,((sy+row)*512+sx)*4,((sy+row)*512+sx+32)*4);
   }expect(out.equals(r.frames[k<r.frames.length?k:0]),'frame '+k).toBe(true);
  }
 });
 it('round-trips the exact previous layout and rejects a changed car or surrounding placement',()=>{
  const l=read('world/layouts/overworld.json'),old=restoreRoadsterFlight(l);expect(sha(JSON.stringify(applyRoadsterFlight(old)))).toBe(sha(JSON.stringify(l)));
  expect(old.placements).toEqual(l.placements);expect(old.entries).toEqual(l.entries);expect(old.exits).toEqual(l.exits);expect(old.areas).toEqual(l.areas);
  l.animatedOverlays.find((o:any)=>o.name==='roadster').x++;expect(()=>restoreRoadsterFlight(l)).toThrow('unreviewed source layout');
 });
 it('accepts current native ownership and rejects an atlas or collision substitution',()=>{
  const m=read('maps/overworld.tmj'),l=read('world/layouts/overworld.json'),w=read('maps/overworld.wam'),c=read('art/tile-catalog.json');
  expect(()=>assertCurrentNativeMap('overworld',m,l,w,c)).not.toThrow();m.tilesets.find((t:any)=>t.name==='roadster').tiles[0].animation[0].tileid++;
  expect(()=>assertCurrentNativeMap('overworld',m,l,w,c)).toThrow();
 });
});
