import { approvedEditorCollections, editorCatalogHistoryMaps, historicalEditorWamBytes, editorMetadataHistoryPaths, historicalEditorMetadataBytes } from './helpers/editor-catalog-history';
import { readFileSync } from 'node:fs';
import { PATROL_IDS } from '../tools/maps/patrol-roles';
import { describe, expect, it } from 'vitest';
import type { TiledMap, TileLayer } from '../tools/maps/types';
function frozenOverworld(kind:'tmj'):TiledMap;
function frozenOverworld(kind:'json'):MapLayout;
function frozenOverworld(kind:'tmj'|'json'):TiledMap|MapLayout{
 const raw=readFileSync(`tests/fixtures/overworld-history/17d4-${kind==='tmj'?'native.tmj':'layout.json'}`);
 expect(createHash('sha256').update(raw).digest('hex')).toBe(kind==='tmj'?'87e88dd082910b789578188147e9b91b1f060c9d62309c158b785c2bf4cbbaad':'6e1ba3eaec7223e9b64bbd7aff48863bbfe2992a84ff199c7574857c781e533e');
 return JSON.parse(raw.toString());
}
const native = (): TiledMap => JSON.parse(readFileSync('maps/overworld.tmj', 'utf8'));
describe('stationary native Roadster display', () => {
 it('renders a complete fixed 5×5 native animation, not a decorative still or moving map actor', () => {
  const map = native(), layer = map.layers.find(l => l.name === 'roadster') as TileLayer | undefined;
  expect(layer, 'The plaza must contain the requested native Roadster animation').toBeDefined();
  const set = map.tilesets.find(s => s.name === 'roadster')!;
  expect(layer!.data.filter(Boolean)).toHaveLength(25);
  expect(set.tiles).toHaveLength(25);
  expect(set.tiles!.every(t => t.animation && t.animation.length >= 2)).toBe(true);
  expect(new Set(set.tiles!.map(t => t.animation!.reduce((n,f) => n+f.duration,0)))).toEqual(new Set([12800]));
  // The v2 epoch: the role atlas is the compiled motion atlas, appended after the brand family.
  expect(set).toMatchObject({ image: '../assets/tilesets/original/roadster-v2.png', firstgid: 11783, columns: 16, imagewidth: 512 });
  expect(map.tilesets[82]).toBe(set); // every prior reservation stays fixed; the two named exterior families append afterward
  expect(map.tilesets.slice(83).map(t=>t.name)).toEqual(['zodiac-exteriors','hall-exteriors','Arrival / VarCamp NW','Arrival / VarCamp NE','Arrival / VarCamp SW','Arrival / VarCamp SE',...PATROL_IDS,'plaza-fountain-water','plaza-fountain-water-upper','leo-lion-head','zodiac-ground-names','hall-buildings','Expo / Vibe Code Tours']);
  expect(map.tilesets.filter(s => s.name === 'roadster')).toHaveLength(1);
 });
});

import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { renderRoadster, renderRoadsterV1, ROADSTER_V2_ATLAS_PATH, ROADSTER_V2_METADATA_PATH, type RoadsterFrameReceipt } from '../tools/art/roadster';
import { buildMap } from '../tools/maps/builder';
import { loadTileCatalog } from '../tools/art/catalog';
import { guardMap } from '../src/bots/map-guard';
import { ROUTES } from '../src/bots/venue';
import type { MapLayout } from '../tools/maps/types';
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const fixtureRoot = 'docs/qa/coastal-flight-2026-10-16/prototype';
const parse = createRequire(import.meta.url)(resolve(fixtureRoot, 'upstream/phaser/src/tilemaps/parsers/tiled/ParseTilesets.js'));
const GROUNDED = ['landed', 'rest'];
/** Opaque pixel positions of a 160×160 RGBA frame. */
const opaque = (frame: Buffer): Set<number> => { const s = new Set<number>(); for (let i = 0; i < 160 * 160; i++) if (frame[i * 4 + 3]) s.add(i); return s; };
function expectFrameEnvelope(frame: Buffer, label: string): void {
 const alpha = new Set<number>(); let clipped = false, outsideView = false;
 for (let pixel = 0; pixel < 160 * 160; pixel++) {
  const a = frame[pixel * 4 + 3], x = pixel % 160, y = Math.floor(pixel / 160); alpha.add(a);
  if (a) { clipped ||= x === 0 || x === 159 || y === 0 || y === 159; outsideView ||= x >= 144; }
 }
 expect(alpha, label).toEqual(new Set([0, 255]));
 expect({ clipped, outsideView }, label + ': all visible pixels fit the frame and left-column arrival band').toEqual({ clipped: false, outsideView: false });
}

it('preserves the original sole-addition Roadster receipt against its immutable historical fixture', () => {
 const map = frozenOverworld('tmj');
 expect(map.layers.filter(l => l.name === 'roadster')).toHaveLength(1);
 expect(map.tilesets.filter(s => s.name === 'roadster')).toHaveLength(1);
 expect(map.layers.at(-1)?.name).toBe('roadster');
 expect(map.layers.at(-1)?.id).toBe(map.nextlayerid! - 1);
 map.layers.pop(); map.tilesets.pop(); map.nextlayerid!--;
 expect(sha(JSON.stringify(map))).toBe('0e2d4fff09d8476eed187ae8a25bfdbd72182a35846ad02b1f89a62fcd8647d1');
 const layout = frozenOverworld('json'); delete layout.animatedOverlays;
 expect(sha(JSON.stringify(layout, null, 2)+'\n')).toBe('4f80ae57e635a8eb1efe1ba7e44eaca109a750ec455f7db169259c725a31a351');
});

// Current whole-world byte authority belongs to publication/verify-source.mjs,
// whose real CLI tests establish a positive baseline before artifact mutations.
// Roadster's sole-addition history above uses independent immutable 17d4 inputs.
it('fits the upper-right blue arrival floor without touching any of the 864 guide cells, spawn, entrance, scenery or sponsor panel', () => {
 const overlay = json('art/source/landscape-roadster.json').overlay;
 expect(overlay).toMatchObject({x:83,y:53,width:5,height:5,level:'belowAvatar',name:'roadster'});
 expect(json('art/source/roadster.json').overlay).toMatchObject({x:73,y:60,width:5,height:5});
 expect(json(ROADSTER_V2_METADATA_PATH).overlay).toMatchObject({x:73,y:60,width:5,height:5});
 const inside = (x:number,y:number) => x>=83&&x<88&&y>=53&&y<58;
 expect(ROUTES.allowedCells).toHaveLength(864);
 expect(sha(JSON.stringify(ROUTES.allowedCells))).toBe('a47715acb0c16ea90f90da48f7cfa9f9a2c51a00f077edeb8f2d36bf582788c2');
 expect(ROUTES.allowedCells.filter(([x,y])=>inside(x,y))).toEqual([]);
 const layout = json('world/layouts/overworld.json') as MapLayout;
 expect(layout.animatedOverlays!.find(o=>o.name==='roadster')).toEqual(overlay);
 for(const r of [...layout.entries,...layout.exits,...layout.areas,...layout.placements.filter(p=>p.layer==='props'),...(layout.images??[])]) expect(r.x<88&&r.x+r.width>83&&r.y<58&&r.y+r.height>53,'name' in r?r.name:r.id).toBe(false);
 expect(overlay.x).toBeGreaterThanOrEqual(82);expect(overlay.x+5).toBeLessThanOrEqual(90);expect(overlay.y).toBeGreaterThanOrEqual(51);expect(overlay.y+5).toBeLessThanOrEqual(65);
});
it('accepts the re-audited native map but still fails closed on moved animation or collision changes', async () => {
 await expect(guardMap(native())).resolves.toBeUndefined();
 const changed=native(), layer=changed.layers.find(l=>l.name==='roadster') as TileLayer;
 const i=layer.data.findIndex(Boolean);layer.data[i+1]=layer.data[i];layer.data[i]=0;
 await expect(guardMap(changed)).rejects.toThrow(/signature mismatch/);
 const collision=native(), mask=collision.layers.find(l=>l.name==='physical-collisions') as TileLayer;
 mask.data[65*128+63]=mask.data.find(Boolean)!;
 await expect(guardMap(collision)).rejects.toThrow(/signature mismatch/);
});
it('keeps compiling the frozen v1 epoch byte for byte from the original generated1254px sheet and rejects stale source receipts', async () => {
 const {png,metadata,frames}=await renderRoadsterV1();
 expect(metadata.source.sha256).toBe('08b8e46661d57bb4f44ea0e09bdee91debc3311440d1d2406a949e164bd86cd0');
 expect(png).toEqual(readFileSync('assets/tilesets/original/roadster.png'));
 expect(sha(png)).toBe('f0d01aa3c4f9835b1d35fa6ae3c8534ebdb8e4a647d3cdb30f43309b13a63fe1');
 expect(metadata).toEqual(json('art/source/roadster.json'));
 expect(metadata.atlas).toMatchObject({width:512,height:480,tilecount:240});
 expect(metadata.crops.map(p=>[p.cell.left,p.cell.top])).toEqual([0,313,627,940].flatMap(y=>[0,313,627,940].map(x=>[x,y])));
 expect(new Set(frames.map(sha)).size).toBe(16);
 for(const [i,frame] of frames.entries())expectFrameEnvelope(frame,'v1 pose '+i);
 const overlay=structuredClone(metadata.overlay);overlay.provenance!.inputs[0].sha256='0'.repeat(64);
 expect(()=>buildMap({id:'overworld',width:128,height:128,placements:[],entries:[],exits:[],areas:[],inspectionZones:[],animatedOverlays:[overlay]},loadTileCatalog())).toThrow(/input changed/);
});
describe('v2 compiled motion', () => {
 const render = (async () => ({ v2: await renderRoadster(), v1: await renderRoadsterV1() }))();
 it('makes exactly one continuous full flip from a single unchanged car viewpoint before recovering upright', async () => {
  const {v2}=await render;
  const turn=v2.metadata.frames.filter(r=>r.rotationDeg!==null) as (RoadsterFrameReceipt & {rotationDeg:number})[];
  expect(turn.length,'the flight needs explicit rotation frames, rather than swapping camera viewpoints').toBeGreaterThanOrEqual(17);
  expect(new Set(turn.map(r=>r.pose))).toEqual(new Set([5]));
  const degrees=turn.map(r=>r.rotationDeg);
  expect(degrees[0]).toBe(0);expect(degrees.at(-1)).toBe(360);
  expect(degrees).toEqual([...degrees].sort((a,b)=>a-b));
  const advances=degrees.slice(1).map((d,i)=>d-degrees[i]);
  expect(advances.reduce((sum,d)=>sum+d,0)).toBe(360);
  expect(Math.max(...advances)).toBeLessThanOrEqual(22.5);
  const startAt=(index:number)=>v2.metadata.frames.slice(0,index).reduce((ms,r)=>ms+r.durationMs,0);
  expect(startAt(turn.find(r=>r.rotationDeg===360)!.index)-startAt(turn[0].index)).toBe(1600);
  expect(turn.filter(r=>r.phase==='recover').every(r=>r.rotationDeg===360)).toBe(true);
  expect(turn.every(r=>r.blendFrom===null&&r.dy===0)).toBe(true);
 });
 it('rotates the actual jump sprite through a half-turn without changing its pixels, scale or fixed pivot', async () => {
  const {v1,v2}=await render;
  const half=v2.metadata.frames.find(r=>r.rotationDeg===180);
  expect(half,'the car must pass through an actual upside-down frame').toBeDefined();
  if(!half)return;
  const source=v1.frames[5],actual=v2.frames[half.index];let checked=0;
  // Independent 180-degree geometry around (80,74): (x,y) maps to (160-x,148-y).
  // The source pad begins at y=135 and is deliberately outside the rotating car.
  for(let y=0;y<135;y++)for(let x=0;x<160;x++){
   const from=(y*160+x)*4;if(!source[from+3])continue;
   const to=((148-y)*160+160-x)*4;
   expect(actual.subarray(to,to+4),`car pixel ${x},${y}`).toEqual(source.subarray(from,from+4));checked++;
  }
  expect(checked).toBeGreaterThan(3000);
 });
 it('compiles the committed v2 atlas and metadata from the same sixteen poses within the native bound', async () => {
  const {v2}=await render,{png,metadata,frames}=v2;
  expect(png).toEqual(readFileSync(ROADSTER_V2_ATLAS_PATH));
  expect(metadata).toEqual(json(ROADSTER_V2_METADATA_PATH));
  expect(metadata.version).toBe(2);expect(metadata.source.sha256).toBe('08b8e46661d57bb4f44ea0e09bdee91debc3311440d1d2406a949e164bd86cd0');
  expect(metadata.crops).toEqual(json('art/source/roadster.json').crops);
  expect(metadata.cycleMs).toBe(12800);expect(metadata.stepMs).toBe(100);expect(metadata.diagnostics.steps).toBe(128);
  expect(metadata.frames).toHaveLength(frames.length);expect(frames.length).toBeGreaterThanOrEqual(80);
  expect(metadata.frames.reduce((n:number,f:RoadsterFrameReceipt)=>n+f.durationMs,0)).toBe(12800);
  expect(metadata.frames.every((f:RoadsterFrameReceipt,i:number)=>f.index===i&&f.durationMs>=100&&f.durationMs%100===0)).toBe(true);
  // Consecutive identical 100 ms steps are merged; a recurring state (e.g. the idle front-light pulse) may
  // repeat non-consecutively and costs no atlas tiles, since the packer deduplicates identical tiles.
  const digests=frames.map(sha);expect(digests.every((d,i)=>i===0||d!==digests[i-1])).toBe(true);
  expect(new Set(digests).size).toBeGreaterThan(64);
  expect(metadata.diagnostics.uniqueTiles+25).toBeLessThanOrEqual(metadata.atlas.tilecount);expect(metadata.atlas.tilecount-metadata.diagnostics.uniqueTiles-25).toBeLessThan(16);// only row padding
  expect(metadata.diagnostics.uniqueTiles).toBeGreaterThan(240);expect(metadata.overlay.carrierTileIds).toEqual(Array.from({length:25},(_,i)=>metadata.diagnostics.uniqueTiles+i));
  expect(metadata.atlas.tilecount).toBeLessThanOrEqual(1024);expect(metadata.atlas.width*metadata.atlas.height*4).toBeLessThanOrEqual(4*1024*1024);
  expect(metadata.overlay).toMatchObject({name:'roadster',image:ROADSTER_V2_ATLAS_PATH,x:73,y:60,width:5,height:5,level:'belowAvatar'});
  expect(metadata.overlay.provenance!.inputs.map((i:{path:string})=>i.path)).toEqual(['art/source/roadster-poses.png','art/source/roadster-authoring.json','art/source/roadster-v2-authoring.json','tools/art/roadster.ts','tools/maps/builder.ts','tools/maps/types.ts']);
  for(const [i,frame] of frames.entries())expectFrameEnvelope(frame,'v2 frame '+i);
  for(const id of metadata.overlay.animations.map((a:{id:number})=>a.id))expect(id).toBeGreaterThanOrEqual(metadata.diagnostics.uniqueTiles);
 });
 it('anchors the first and last grounded frames exactly on the v1 poses and adds no effect pixels while idle', async () => {
  const {v1,v2}=await render,receipts=v2.metadata.frames as RoadsterFrameReceipt[];
  expect(receipts[0]).toMatchObject({phase:'landed',pose:0,dy:0,glow:0,glowPixels:0,dust:-1,blendFrom:null,pad:{mode:'static'}});
  expect(receipts.at(-1)).toMatchObject({phase:'rest',pose:15,dy:0,glow:0,glowPixels:0,dust:-1,blendFrom:null,pad:{mode:'static'}});
  for(const r of receipts.filter(r=>GROUNDED.includes(r.phase))){
   expect(r.glow).toBe(0);expect(r.glowPixels).toBe(0);expect(r.dy).toBe(0);expect(r.shadowLevel).toBe(0);
   expect(opaque(v2.frames[r.index])).toEqual(opaque(v1.frames[r.pose]));
  }
  // The grounded holds only pulse the thin white front strip: every other opaque pixel keeps its v1 colour.
  const landed=receipts.find(r=>r.phase==='landed'&&r.frontLight===0)!,frame=v2.frames[landed.index],reference=v1.frames[0];
  let changed=0;for(let i=0;i<160*160;i++)if(frame[i*4+3]&&(frame[i*4]!==reference[i*4]||frame[i*4+1]!==reference[i*4+1]||frame[i*4+2]!==reference[i*4+2]))changed++;
  expect(changed).toBeGreaterThan(0);expect(changed).toBeLessThan(1600);// pad shadow rows only
  expect(new Set(receipts.filter(r=>r.phase==='landed').map(r=>r.frontLight))).toEqual(new Set([0,1,2]));
 });
 it('tweens every motion phase at 100 ms with eased offsets, a ±2 px hover bob and a 1-2 px landing settle', async () => {
  const {v2}=await render,receipts=v2.metadata.frames as RoadsterFrameReceipt[],phase=(n:string)=>receipts.filter(r=>r.phase===n);
  for(const n of ['rise','low-hover','hover','jump','descend','touchdown'])expect(phase(n).every(r=>r.durationMs===100),n).toBe(true);
  expect(phase('recover').every(r=>r.pose===5&&r.rotationDeg===360&&r.dy===0)).toBe(true);
  const rise=phase('rise').map(r=>r.dy);expect(rise[0]).toBeGreaterThan(10);expect(rise.at(-1)).toBe(0);expect(rise).toEqual([...rise].sort((a,b)=>b-a));
  const eased=rise.slice(0,-1).map((d,i)=>d-rise[i+1]);expect(Math.max(...eased)).toBeGreaterThan(Math.min(...eased));// ease-in/out: unequal steps
  const hover=phase('hover');expect(hover[0].dy).toBeGreaterThan(10);const bob=hover.filter(r=>Math.abs(r.dy)<=2).map(r=>r.dy);
  expect(bob.length).toBeGreaterThanOrEqual(8);expect(Math.min(...bob)).toBe(-2);expect(Math.max(...bob)).toBe(2);expect(v2.metadata.diagnostics.hoverBob).toMatchObject({amplitudePx:2,minDy:-2});
  expect(phase('low-hover').at(-1)!.dy).not.toBe(0);// the bob carries into the hover tween without a snap
  const descend=phase('descend').map(r=>r.dy);expect(descend[0]).toBeLessThan(-10);expect(descend.at(-1)).toBe(8);expect(descend).toEqual([...descend].sort((a,b)=>a-b));
  const touchdown=phase('touchdown');expect(touchdown[0].dy).toBeLessThan(-10);
  const contact=touchdown.findIndex(r=>r.dy===0);expect(contact).toBeGreaterThan(0);expect(touchdown.slice(contact+1).map(r=>r.dy)).toEqual([2,1]);
  expect(touchdown.slice(0,contact).map(r=>r.dy)).toEqual(touchdown.slice(0,contact).map(r=>r.dy).sort((a,b)=>a-b));
 });
 it('blooms the thrusters only while airborne, flickering at 100 ms and brightest at ignition and touchdown', async () => {
  const {v2}=await render,receipts=v2.metadata.frames as RoadsterFrameReceipt[],airborne=receipts.filter(r=>!GROUNDED.includes(r.phase)&&r.rotationDeg===null);
  expect(airborne.filter(r=>r.glow>0).every(r=>r.glowPixels>0)).toBe(true);
  expect(airborne.filter(r=>r.phase!=='touchdown'||r.dy<=0).every(r=>r.glow>0)).toBe(true);
  for(const n of ['rise','low-hover','hover','jump','descend'])expect(new Set(receipts.filter(r=>r.phase===n).map(r=>r.flicker)).size,n).toBe(3);
  expect(receipts.filter(r=>r.rotationDeg!==null).every(r=>r.glow===0&&r.glowPixels===0)).toBe(true);
  const peak=(n:string)=>Math.max(...receipts.filter(r=>r.phase===n).map(r=>r.glow));
  expect(peak('ignition')).toBeGreaterThan(peak('hover'));expect(peak('touchdown')).toBeGreaterThan(peak('hover'));
  // Dithered bloom is binary alpha: its pixels are extra opaque cyan/white positions outside the v1 pose.
  const hover=receipts.find(r=>r.phase==='hover'&&r.dy===0)!,frame=v2.frames[hover.index];
  let cyan=0;for(let i=0;i<160*160;i++)if(frame[i*4+3]&&frame[i*4+2]>=200&&frame[i*4+1]>=200&&frame[i*4]<frame[i*4+1])cyan++;
  expect(cyan).toBeGreaterThan(hover.glowPixels);
 });
 it('shrinks and fades the pad shadow with altitude, chases the pad lights only while airborne and puffs dust at ignition and touchdown', async () => {
  const {v2}=await render,receipts=v2.metadata.frames as RoadsterFrameReceipt[];
  const byLevel=new Map<number,Set<number>>();for(const r of receipts)byLevel.set(r.shadowLevel,(byLevel.get(r.shadowLevel)??new Set()).add(r.shadowHalfWidth));
  const levels=[...byLevel.keys()].sort((a,b)=>a-b);expect(levels).toEqual([0,1,2,3]);
  const widths=levels.map(l=>{const w=[...byLevel.get(l)!];expect(w).toHaveLength(1);return w[0];});
  expect(widths[0]).toBe(54);expect(widths).toEqual([...widths].sort((a,b)=>b-a));expect(widths.at(-1)).toBeLessThan(widths[0]);
  for(const r of receipts)expect(r.shadowLevel===Math.max(...levels)?r.altitudePx>=40:true).toBe(true);
  expect(receipts.filter(r=>GROUNDED.includes(r.phase)).every(r=>r.pad.mode==='static')).toBe(true);
  for(const n of ['rise','low-hover','hover','jump','roll-1','inverted','recover','descend'])expect(receipts.filter(r=>r.phase===n).every(r=>r.pad.mode==='chase'),n).toBe(true);
  expect(receipts.filter(r=>r.phase==='ignition').map(r=>r.pad.mode)).toEqual(Array(6).fill('wake'));
  expect(receipts.filter(r=>r.phase==='touchdown').map(r=>r.pad.mode)).toEqual(['chase','chase','chase','flash','flash','static']);
  expect(receipts.filter(r=>r.phase==='ignition').map(r=>r.dust)).toEqual([0,1,2,-1,-1,-1]);
  expect(receipts.filter(r=>r.phase==='touchdown').map(r=>r.dust)).toEqual([-1,-1,-1,0,1,2]);
  expect(receipts.filter(r=>r.dust>=0).every(r=>r.dy>=0)).toBe(true);
 });
 it('pulses the front strip, flares the rear bar at ignition and brightens it on descent', async () => {
  const {v2}=await render,receipts=v2.metadata.frames as RoadsterFrameReceipt[],phase=(n:string)=>receipts.filter(r=>r.phase===n);
  expect(phase('ignition').map(r=>r.rearLight)).toEqual([2,2,2,1,1,1]);
  expect(phase('descend').every(r=>r.rearLight===1)).toBe(true);expect(phase('hover').every(r=>r.rearLight===0)).toBe(true);
  expect(phase('touchdown').map(r=>r.rearLight)).toEqual([2,2,2,1,1,1]);
  expect(receipts.filter(r=>r.frontLight>=0).every(r=>[0,1,2].includes(r.frontLight))).toBe(true);
  expect(new Set(phase('rest').map(r=>r.frontLight))).toEqual(new Set([0,1,2]));
 });
 it('resolves every v2 frame and the loop boundary through the pinned deployed Phaser parser without tile seams or world travel',async()=>{
  for(const entry of json(`${fixtureRoot}/source-manifest.json`))expect(sha(readFileSync(`${fixtureRoot}/${entry.path}`))).toBe(entry.sha256);
  const {v2}=await render,{png,frames,metadata}=v2, map=native(), set=map.tilesets.find(s=>s.name==='roadster')!;
  const engine=parse(structuredClone(map)).tilesets.find((s:{firstgid:number})=>s.firstgid===set.firstgid);
  const layer=map.layers.find(l=>l.name==='roadster') as TileLayer,atlas=await sharp(png).ensureAlpha().raw().toBuffer();
  const starts:number[]=[];let t=0;for(const f of metadata.frames as RoadsterFrameReceipt[]){starts.push(t);t+=f.durationMs;}starts.push(t);expect(t).toBe(12800);
  for(const [phase,time]of starts.entries()){
   const out=Buffer.alloc(160*160*4);
   for(let y=0;y<5;y++)for(let x=0;x<5;x++){
    const gid=engine.getAnimatedTileId(layer.data[(53+y)*128+83+x],time);
    expect(gid).not.toBeNull();const tile=gid-set.firstgid,sx=tile%set.columns!*32,sy=Math.floor(tile/set.columns!)*32;
    for(let row=0;row<32;row++)atlas.copy(out,((y*32+row)*160+x*32)*4,((sy+row)*metadata.atlas.width+sx)*4,((sy+row)*metadata.atlas.width+sx+32)*4);
   }
   expect(out.equals(frames[phase%frames.length]),`native frame ${phase} at${time}ms`).toBe(true);
  }
  expect(set.tiles!.every(t=>t.properties?.some(p=>p.name==='collides'&&p.value===false))).toBe(true);
 });
});

it('proves all33 editor registrations against independent raw and semantic8dc WAM receipts', () => {
 expect(editorCatalogHistoryMaps).toHaveLength(33);
 for (const id of editorCatalogHistoryMaps) expect(JSON.parse(historicalEditorWamBytes(id).toString()).entityCollections).toEqual([]);
});
it('refuses entity, area, vendor, mapUrl and collection drift outside catalog registration', () => {
 const raw=readFileSync('maps/overworld.wam','utf8');
 // This candidate changes only the root array, so negatives cannot pass merely
 // because JSON.stringify changed unrelated historical whitespace.
 const candidate=raw.replace(/"entityCollections": \[[\s\S]*?\]/, '"entityCollections": '+JSON.stringify(approvedEditorCollections));
 expect(()=>historicalEditorWamBytes('overworld',candidate)).not.toThrow();
 const changes=[
  candidate.replace('"entities": {}','"entities": {"unexpected": {"name": "existing entity drift"}}'),
  candidate.replace('welcome-directory','changed-directory'),
  candidate.replace('"version":','"vendor": {"keep": true},\n  "version":'),
  candidate.replace('overworld.tmj','changed.tmj'),
  candidate.replace('OfficeCollection.json','UnapprovedCollection.json'),
  candidate.replace(JSON.stringify(approvedEditorCollections),JSON.stringify([...approvedEditorCollections,{url:'https://example.invalid/extra.json',type:'file'}])),
 ];
 for(const changed of changes){expect(changed).not.toBe(candidate);expect(()=>historicalEditorWamBytes('overworld',changed)).toThrow();}
});

it('proves all four editor builder metadata changes before historical composition and refuses unrelated drift', () => {
 expect(editorMetadataHistoryPaths).toHaveLength(4);
 for(const path of editorMetadataHistoryPaths){
  const raw=readFileSync(path==='world/layouts/overworld.json'?'tests/fixtures/overworld-history/pre-return-layout.json':path==='world/layouts/shipyard-beach.json'?'tests/fixtures/beach-composition/before-shipyard-beach.json':path.startsWith('art/source/')?`tests/fixtures/solid-props/before-${path.endsWith('/roadster.json')?'roadster':'coastal-flight'}-metadata.json`:path,'utf8');
  if(path==='world/layouts/overworld.json')expect(sha(raw)).toBe('49d0f002a11c0966550eb9025c2c3ce0e7f023605960ea6c91341decce506093');
  if(path==='world/layouts/shipyard-beach.json')expect(sha(raw)).toBe('dc9b379a2955e015c684baf6720fd59d30d8e25533c0ee9bfcacae46be043ac4');
  expect(()=>historicalEditorMetadataBytes(path,raw)).not.toThrow();
  const changed=raw.replace('"sha256":','"unexpected":true,"sha256":');
  expect(changed).not.toBe(raw);
  expect(()=>historicalEditorMetadataBytes(path,changed)).toThrow(/Metadata changed outside/);
 }
});
