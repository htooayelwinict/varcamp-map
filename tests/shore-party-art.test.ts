import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import sharp from 'sharp';
import {loadTileCatalog} from '../tools/art/catalog';
import {buildMap} from '../tools/maps/builder';
import type {LayoutAnimatedOverlay} from '../tools/maps/types';

const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
async function render(){
 expect(existsSync('tools/art/shore-party.ts'),'The isolated Shore party art exporter must exist').toBe(true);
 return (await import('../tools/art/shore-party')).renderShoreParty();
}
async function frame(png:Buffer,overlay:LayoutAnimatedOverlay,time:number){
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const out=Buffer.alloc(overlay.width*32*overlay.height*32*4);
 for(const [cell,id] of overlay.carrierTileIds.entries()){
  const animation=overlay.animations.find(a=>a.id===id)!;
  let t=time%animation.frames.reduce((n,f)=>n+f.duration,0),tile=animation.frames[0].tileid;
  for(const f of animation.frames){tile=f.tileid;if(t<f.duration)break;t-=f.duration;}
  const sx=tile%(info.width/32)*32,sy=Math.floor(tile/(info.width/32))*32;
  for(let y=0;y<32;y++)data.copy(out,((Math.floor(cell/overlay.width)*32+y)*overlay.width*32+cell%overlay.width*32)*4,((sy+y)*info.width+sx)*4,((sy+y)*info.width+sx+32)*4);
 }
 return out;
}

describe('isolated Constellation Shore party artwork',()=>{
 it('exports a visible transparent stage, walkable floor and low boundary props without changing source art',async()=>{
  const masterBefore=hash(readFileSync('art/source/shore-dj-stage-master.png'));
  const r=await render(),atlas=await sharp(r.atlasPng).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  expect(hash(readFileSync('art/source/shore-dj-stage-master.png'))).toBe(masterBefore);
  expect(atlas.info.width%32).toBe(0);expect(atlas.info.height%32).toBe(0);
  const expected={
   'shore-dj-stage':[6,5,'aboveAvatar'], 'shore-dj-floor':[6,3,'belowAvatar'],
   'shore-party-bunting':[4,1,'belowAvatar'], 'shore-party-bunting-short':[2,1,'belowAvatar'],
   'shore-party-sign':[5,1,'belowAvatar'],
  } as const;
  for(const [name,[width,height,level]] of Object.entries(expected)){
   const sprite=r.catalog[name];expect(sprite).toMatchObject({sheet:'assets/tilesets/original/shore-party.png',rect:{width,height},level,sourceId:'original'});
   const pixels=await sharp(r.atlasPng).extract({left:sprite.rect.x*32,top:sprite.rect.y*32,width:width*32,height:height*32}).ensureAlpha().raw().toBuffer();
   const alphas=pixels.filter((_n:number,i:number)=>i%4===3);
   expect(alphas.some((a:number)=>a>128),name+' must be visible').toBe(true);
   expect(alphas.some((a:number)=>a===0),name+' must retain transparent edges').toBe(true);
   if(name!=='shore-dj-stage')expect(sprite.blockingCells).toEqual([]);
  }
  expect(r.catalog['shore-dj-stage'].blockingCells).toEqual([[0,3],[0,4],[1,3],[1,4],[2,3],[2,4],[3,3],[3,4],[4,3],[4,4],[5,3],[5,4]]);
 });

 it('renders continuously visible synchronized six-second light cycles at safe native depths',async()=>{
  const r=await render();
  for(const [fx,expected] of [[r.floorFx,{x:27,y:14,width:8,height:6,level:'belowAvatar'}],[r.stageFx,{x:28,y:9,width:6,height:5,level:'aboveAvatar'}]] as const){
   expect(fx.overlay).toMatchObject(expected);
   expect(fx.diagnostics).toMatchObject({phaseCount:12,stepMs:500,periodMs:6000});
   expect(fx.diagnostics.decodedRgbaBytes).toBeLessThanOrEqual(4*1024*1024);
   expect(fx.overlay.animations.every(a=>a.frames.reduce((n,f)=>n+f.duration,0)===6000&&a.frames.every(f=>f.duration>=500))).toBe(true);
   const frames=await Promise.all(Array.from({length:12},(_,phase)=>frame(fx.png,fx.overlay,phase*500)));
   expect(new Set(frames.map(hash)).size).toBe(12);
   const energy=frames.map(p=>p.reduce((sum:number,n:number,i:number)=>sum+(i%4===3?n:0),0));
   expect(Math.min(...energy)).toBeGreaterThan(1000);
   expect(Math.max(...energy)/Math.min(...energy)).toBeLessThan(1.6);
   expect(await frame(fx.png,fx.overlay,6000)).toEqual(frames[0]);
  }
 });

 it('records exact input and atlas hashes and produces identical artifacts on a second render',async()=>{
  const a=await render(),b=await render();
  expect(a.atlasPng).toEqual(b.atlasPng);expect(a.floorFx.png).toEqual(b.floorFx.png);expect(a.stageFx.png).toEqual(b.stageFx.png);expect(a.metadata).toEqual(b.metadata);
  expect(a.metadata.inputs.map(i=>i.path)).toEqual(expect.arrayContaining(['art/source/shore-dj-stage-master.png','tools/art/shore-party.ts','tools/art/native-motion.ts']));
  for(const input of a.metadata.inputs)expect(input.sha256).toBe(hash(readFileSync(input.path)));
  expect(a.metadata.atlas.sha256).toBe(hash(a.atlasPng));
  for(const fx of [a.floorFx,a.stageFx])expect(fx.overlay.provenance).toEqual({metadataPath:`art/source/${fx.overlay.name}.json`,atlasSha256:hash(fx.png),inputs:a.metadata.inputs});
  expect(a.metadata.overlays).toEqual([a.floorFx.overlay,a.stageFx.overlay]);
 });

 it('supplies singular provenance receipts accepted by the real map builder',async()=>{
  const r=await render();
  expect(()=>buildMap({id:'overworld',width:96,height:48,placements:[],entries:[],exits:[],areas:[],inspectionZones:[],animatedOverlays:[r.floorFx.overlay,r.stageFx.overlay]},loadTileCatalog())).not.toThrow();
  for(const fx of [r.floorFx,r.stageFx]){
   const receipt=JSON.parse(readFileSync(fx.overlay.provenance!.metadataPath,'utf8'));
   expect(receipt).toEqual({version:1,overlay:fx.overlay,diagnostics:fx.diagnostics});
  }
 });
});
