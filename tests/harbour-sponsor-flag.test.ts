import {beforeAll, expect, it} from 'vitest';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {renderHarbourPlane} from '../tools/art/harbour-plane';
import {buildMap} from '../tools/maps/builder';
import {loadTileCatalog} from '../tools/art/catalog';
import {emitNativeMapAssets} from '../tools/release';

const original='art/source/sponsors/tier-logos/DigSecLab_Secondary.png';
let flight:Awaited<ReturnType<typeof renderHarbourPlane>>, atlas:Buffer, columns:number;
beforeAll(async()=>{
 flight=await renderHarbourPlane();
 const decoded=await sharp(flight.png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 atlas=decoded.data;columns=decoded.info.width/32;
});

// Decode the shipped native tile clocks, independently of the motion compiler.
function frame(time:number):Buffer{
 const output=Buffer.alloc(1536*96*4);
 for(const [cell,animation] of flight.overlay.animations.entries()){
  const period=animation.frames.reduce((sum,f)=>sum+f.duration,0);
  let t=time%period, id=-1;
  for(const f of animation.frames){if(t<f.duration){id=f.tileid;break;}t-=f.duration;}
  expect(id).toBeGreaterThanOrEqual(0);
  for(let y=0;y<32;y++){
   const source=((Math.floor(id/columns)*32+y)*columns*32+id%columns*32)*4;
   const target=((Math.floor(cell/48)*32+y)*1536+cell%48*32)*4;
   atlas.copy(output,target,source,source+128);
  }
 }
 return output;
}

it('flies the approved DigiSec artwork on a legible dark flag without repainting the logo',async()=>{
 const bytes=readFileSync(original);
 expect(createHash('sha256').update(bytes).digest('hex')).toBe('855d08daa0c09a0205e142d48ef9c32ed0a53043b204929fd8484c62e1451c4d');
 const mark=await sharp(bytes).extract({left:577,top:1085,width:7161,height:6369})
  .resize(100,80,{fit:'inside',kernel:'lanczos3'}).png().toBuffer();
 const expected=await sharp({create:{width:100,height:80,channels:4,background:'#142c40'}})
  .composite([{input:mark,gravity:'centre'}]).raw().toBuffer();
 const actual=await sharp(frame(0),{raw:{width:1536,height:96,channels:4}})
  .extract({left:182,top:8,width:100,height:80}).raw().toBuffer();
 expect(actual.equals(expected),'exact approved mark centered at its original aspect ratio').toBe(true);
});

it('retains every opaque aircraft pixel at native scale and attaches the tow line at its tail',async()=>{
 const source=await sharp('art/source/coastal-flight-plane.png').ensureAlpha().raw().toBuffer();
 const actual=frame(0);
 let checked=0;
 for(let y=0;y<96;y++)for(let x=0;x<192;x++){
  const i=(y*192+x)*4,j=(y*1536+320+x)*4;
  if(source[i+3]===255){expect(actual.subarray(j,j+4)).toEqual(source.subarray(i,i+4));checked++;}
 }
 expect(checked).toBeGreaterThan(300);
 for(let x=304;x<355;x++)expect(actual[(48*1536+x)*4+3],`tow line at ${x}`).toBe(255);
});

it('keeps the whole plane and flag together at 80px/s through every phase and the wrap',()=>{
 const first=frame(0),art=Buffer.alloc(352*96*4);
 for(let y=0;y<96;y++)first.copy(art,y*352*4,(y*1536+160)*4,(y*1536+512)*4);
 for(let phase=0;phase<=236;phase++){
  const x=phase<172?160+phase*8:160+phase*8-1888;
  const expected=Buffer.alloc(1536*96*4);
  const left=Math.max(0,x),right=Math.min(1536,x+352);
  if(right>left)for(let y=0;y<96;y++)art.copy(expected,(y*1536+left)*4,(y*352+left-x)*4,(y*352+right-x)*4);
  expect(frame(phase*100).equals(expected),`unbroken composite at ${phase*100}ms`).toBe(true);
 }
 expect(frame(23600)).toEqual(first);
});

it('uses the existing decorative corridor, bounded atlas, and one synchronized native clock',()=>{
 expect([flight.overlay.x,flight.overlay.y,flight.overlay.width,flight.overlay.height]).toEqual([0,5,48,3]);
 expect(flight.overlay.level).toBe('aboveScenery');
 expect(flight.overlay.carrierTileIds).toHaveLength(144);
 expect(flight.diagnostics.decodedRgbaBytes).toBeLessThanOrEqual(4*1024*1024);
 expect(new Set(flight.overlay.animations.map(a=>a.frames.reduce((n,f)=>n+f.duration,0)))).toEqual(new Set([23600]));
});

it('publishes the sponsor owner and event-use rights instead of assigning the logo CC0',()=>{
 const map=buildMap({id:'shipyard-beach',width:48,height:16,placements:[],entries:[],exits:[],areas:[],inspectionZones:[],animatedOverlays:[{...flight.overlay,provenance:undefined}]},loadTileCatalog()).tmj;
 const tiles=map.tilesets.find(t=>t.name==='coastal-flight')!;
 const credit=tiles.properties!.find(p=>p.name==='tilesetCopyright')!.value;
 expect(credit).toContain('DigiSec Lab');expect(credit).toContain('Organizer-approved event use');
 expect(tiles.tiles!.every(t=>t.properties!.some(p=>p.name==='collides'&&p.value===false))).toBe(true);
 const emitted=new Map<string,string|Buffer>();
 emitNativeMapAssets([], 'unused.js',[],asset=>emitted.set(asset.fileName,asset.source));
 expect(emitted.get('credits/index.html')).toContain('DigiSec Lab beach flight');
 expect(emitted.get('credits/harbour-sponsor/NOTICE.txt')?.toString()).toContain('DigiSec Lab');
});
