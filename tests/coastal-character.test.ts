import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { loadTileCatalog } from '../tools/art/catalog';
import { buildMap } from '../tools/maps/builder';
import { retireHistoricalHosts } from './helpers/retired-host-layout';
import type { MapLayout, TileLayer, TileRect } from '../tools/maps/types';

const load=(id:string):MapLayout=>JSON.parse(readFileSync(`world/layouts/${id}.json`,'utf8'));
const cells=(r:TileRect,w:number)=>Array.from({length:r.width*r.height},(_,i)=>(r.y+Math.floor(i/r.width))*w+r.x+i%r.width);
function walk(l:MapLayout){const {tmj}=buildMap(retireHistoricalHosts([l])[0],loadTileCatalog()),mask=tmj.layers.find(a=>a.name==='physical-collisions') as TileLayer,start=l.entries.find(e=>e.isDefault)!,q=[start.y*l.width+start.x],seen=new Set(q);for(let h=0;h<q.length;h++){const n=q[h],x=n%l.width,y=Math.floor(n/l.width);for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const c=ny*l.width+nx;if(nx>=0&&ny>=0&&nx<l.width&&ny<l.height&&!mask.data[c]&&!seen.has(c)){seen.add(c);q.push(c);}}}return {tmj,mask,seen};}

describe('coastal event character and preserved journeys',()=>{
  it.each(['shipyard-beach','constellation-shore'])('%s has a golden beach rather than a navy office forecourt',async id=>{
    const l=load(id),surface=Array(l.width*l.height).fill(''),catalog=loadTileCatalog();
    for(const p of l.placements.filter(p=>p.layer==='terrain'))for(const n of cells(p,l.width))surface[n]=p.sprite;
    const reviewedSand=Array.from({length:16},(_,i)=>`beach-sand-${i}`);
    const sandIds=['ground-sand','coast-sand','coast-wet-sand',...reviewedSand];
    expect(surface.filter(sprite=>sandIds.includes(sprite)).length).toBeGreaterThanOrEqual(id==='shipyard-beach'?500:450);
    expect(l.placements.some(p=>p.sprite==='night-wash')).toBe(false);
    if(id==='shipyard-beach'){
      // New native names must still be actual opaque golden sand, not arbitrary
      // sprites admitted by a prefix. Check the source pixels and catalog geometry.
      for(const sprite of reviewedSand){
        const tile=catalog[sprite];expect(tile).toMatchObject({sheet:'assets/tilesets/original/beach-lounge.png',sourceId:'original',blockingCells:[],level:'belowAvatar'});expect([tile.rect.width,tile.rect.height]).toEqual([1,1]);
        const pixels=await sharp(tile.sheet).extract({left:tile.rect.x*32,top:tile.rect.y*32,width:32,height:32}).ensureAlpha().raw().toBuffer();let golden=0;
        for(let i=0;i<pixels.length;i+=4){const[r,g,b,a]=pixels.subarray(i,i+4);if(a===255&&r>180&&g>150&&b<190&&r>g&&g>b)golden++;}
        expect(golden,`${sprite} must retain warm golden pixels`).toBeGreaterThanOrEqual(32*32*.95);
      }
      const surf=JSON.parse(readFileSync('art/source/organic-coast.json','utf8'));expect(surf.cells.length).toBeGreaterThan(80);expect(surf.frameMs).toBeGreaterThanOrEqual(200);expect(l.placements.some(p=>p.sprite.startsWith('organic-coast-land-'))).toBe(true);
      expect(l.placements.filter(p=>['coast-life-beach-parasol-coral','coast-life-beach-parasol-teal'].includes(p.sprite)).length).toBeGreaterThanOrEqual(3);
    }else{
      expect(l.placements.some(p=>p.sprite.startsWith('coast-foam-'))).toBe(false);expect(l.placements.some(p=>p.sprite.startsWith('constellation-coast-land-'))).toBe(true);
      const parasols=l.placements.filter(p=>p.id.includes('parasol'));expect(parasols.map(p=>p.id).sort()).toEqual(['shore-parasol-east','shore-parasol-lounge','shore-parasol-west']);for(const p of parasols){expect(p.sprite).toBe('coast-life-solid-coast-parasol');const art=JSON.parse(readFileSync('art/source/coast-life-assets.json','utf8'));expect(catalog[p.sprite]).toMatchObject({sheet:art.atlas.path,rect:art.atlas.rects[p.sprite],sourceId:'original'});expect([p.width,p.height]).toEqual([3,4]);}
    }
  });
  it('assembles the native licensed horizontal vessel with timber structure and canvas rigging',async()=>{
    const l=load('shipyard-beach'),catalog=loadTileCatalog(),ship=l.inspectionZones.find(z=>z.name==='fa-ship-exterior')!;
    expect(ship.width).toBeGreaterThanOrEqual(36);expect(ship.height).toBeGreaterThanOrEqual(10);
    const native=l.placements.filter(p=>catalog[p.sprite].sourceId==='lpc-ship');expect(native.length).toBeGreaterThan(100);
    expect(native.some(p=>catalog[p.sprite].sheet.endsWith('/rigging.png')&&catalog[p.sprite].level==='aboveAvatar')).toBe(true);
    const sheets=[...new Set(native.map(p=>catalog[p.sprite].sheet))];let timber=0,canvas=0,transparent=0;
    for(const file of sheets){const {data}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=0;i<data.length;i+=4){const[r,g,b,a]=data.subarray(i,i+4);if(!a){transparent++;continue;}if(r>190&&g>170&&b>110)canvas++;if(r>55&&r>g*1.15&&g>b*1.1)timber++;}}
    expect(timber).toBeGreaterThan(10000);expect(canvas).toBeGreaterThan(10000);expect(transparent).toBeGreaterThan(10000);
  });
  it('uses a moving whole sponsor aircraft and banner rather than a stationary oversized sky prop',()=>{
    const l=load('shipyard-beach'),{tmj}=walk(l),overlay=l.animatedOverlays?.find(o=>o.name==='coastal-flight')!;
    expect(overlay).toBeDefined();expect(l.placements.some(p=>p.sprite==='coast-sponsor-plane'||p.sprite==='coast-sponsor-balloon')).toBe(false);
    expect(l.placements.filter(p=>p.sprite==='coast-gull')).toEqual([]);const birds=JSON.parse(readFileSync('art/source/coast-life-tracks.json','utf8')).maps['shipyard-beach'].filter((p:any)=>p.kind==='gull');expect(birds).toHaveLength(2);expect(birds.reduce((n:number,b:any)=>n+b.tracks.length,0)).toBe(2);const maps=JSON.parse(readFileSync('art/source/coast-life-tracks.json','utf8')).maps;expect(Object.values(maps).flatMap((rows:any)=>rows.filter((b:any)=>b.kind==='gull').flatMap((b:any)=>b.tracks))).toHaveLength(4);for(const bird of birds)expect(l.animatedOverlays!.some(o=>o.name===bird.name)).toBe(true);
    expect(overlay.carrierTileIds.length).toBe(144);expect(tmj.layers.find(a=>a.name==='coastal-flight')?.type).toBe('tilelayer');
    const atlas=tmj.tilesets.find(s=>s.name==='coastal-flight')!;expect(atlas.tiles?.every(t=>(t.animation?.length??0)>1)).toBe(true);
    expect(tmj.layers.some(l=>l.type==='imagelayer')).toBe(false);
  });
  it('gives FA SHIP solid mast feet, overhead native rigging and a connected human-scale working deck',()=>{
    const l=load('fa-ship'),{mask,seen}=walk(l),c=loadTileCatalog();
    expect(l.placements.filter(p=>p.id.endsWith('mast-base')).length).toBeGreaterThanOrEqual(2);
    expect(l.placements.some(p=>c[p.sprite].sheet.endsWith('/rigging.png')&&c[p.sprite].level==='aboveAvatar')).toBe(true);
    expect(l.placements.some(p=>p.sprite==='coast-wheel')).toBe(true);
    expect(l.placements.some(p=>['copy-machine','desk-coding','screen-wide'].includes(p.sprite))).toBe(false);
    for(const area of l.areas)for(const n of cells(area,l.width)){expect(mask.data[n],area.name).toBe(0);expect(seen.has(n),area.name).toBe(true);}
  });
  it('retires the dockmaster label and keeps only the three cove direction signs',()=>{
    const l=retireHistoricalHosts([load('shipyard-beach')])[0];
    expect(l.signs!.some(s=>s.name==='npc-name-dockmaster')).toBe(false);
    expect(l.signs!.map(s=>s.name).sort()).toEqual(['boarding-label','plaza-return-label','shore-label']);
  });
  it.each(['shipyard-beach','constellation-shore','fa-ship'])('%s keeps every entry, exit and activity area clear and connected',id=>{
    const l=load(id),{mask,seen}=walk(l);
    for(const r of [...l.entries,...l.exits,...l.areas])for(const n of cells(r,l.width)){expect(mask.data[n],`${id}/${r.name} blocked`).toBe(0);expect(seen.has(n),`${id}/${r.name} disconnected`).toBe(true);}
  });
});
