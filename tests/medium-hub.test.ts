import {restoreProgrammeBoards} from '../tools/maps/programme-boards';
import {arrivalPlaques,arrivalFaces,arrivalFloorPanels,assertVisual,assertSponsorFootprints} from './helpers/physical-prop-contracts';
import {preArrivalLayout} from './helpers/pre-arrival-epoch';
import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { SIGN_IDS, WORLD_CATALOG } from '../src/world/catalog';
import { buildMap } from '../tools/maps/builder';
import { loadTileCatalog } from '../tools/art/catalog';
import { retireHistoricalHosts } from './helpers/retired-host-layout';
import type { MapLayout, TileLayer, TileRect } from '../tools/maps/types';
const source=()=>JSON.parse(readFileSync('world/layouts/overworld.json','utf8')) as MapLayout;
const cells=(r:TileRect,w:number)=>Array.from({length:r.width*r.height},(_,i)=>(r.y+Math.floor(i/r.width))*w+r.x+i%r.width);
const overlap=(a:TileRect,b:TileRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
function built(){const l=retireHistoricalHosts([source()])[0],{tmj,wam}=buildMap(l,loadTileCatalog()),mask=(tmj.layers.find(a=>a.name==='physical-collisions') as TileLayer).data;return{l,tmj,wam,mask};}
function distances(l:MapLayout,mask:number[],start:number){const q=[start],d=new Map([[start,0]]);for(let h=0;h<q.length;h++){const n=q[h],x=n%l.width,y=Math.floor(n/l.width);for(const[nx,ny]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const c=ny*l.width+nx;if(nx>=0&&ny>=0&&nx<l.width&&ny<l.height&&!mask[c]&&!d.has(c)){d.set(c,d.get(n)!+1);q.push(c);}}}return d;}
describe('medium authored arrival',()=>{
 it('exports the approved128² hub and matching catalog',()=>{const{tmj}=built();expect([tmj.width,tmj.height]).toEqual([128,128]);expect([WORLD_CATALOG.overworld.width,WORLD_CATALOG.overworld.height]).toEqual([128,128]);});
 it('keeps every speaker and primary choice within the approved collision walks',()=>{const{l,mask}=built();for(const start of cells(l.entries.find(e=>e.isDefault)!,l.width)){const d=distances(l,mask,start);for(const e of l.exits){const max=e.destination.startsWith('speaker-')?65:120;expect(Math.min(...cells(e,l.width).map(n=>d.get(n)??Infinity)),`${e.name} from ${start}`).toBeLessThanOrEqual(max);}}});
 it.each(SIGN_IDS)('%s has a native roofed building and legible raster nameplate',sign=>{const l=source(),tiles=loadTileCatalog(),building=l.placements.find(p=>p.id===`${sign}-building`),label=l.placements.find(p=>p.id===`${sign}-bold-nameplate`);expect(building,'a floor texture is not a roofed building').toBeDefined();expect(building!.sprite).toBe('zodiac-physical-'+sign);expect(building!.renderRole).toBeUndefined();expect([building!.width,building!.height]).toEqual([12,12]);expect(label).toBeDefined();expect(label!.sprite).toBe(`hub-label-${sign}`);expect(label!.renderRole).toBeUndefined();expect(tiles[label!.sprite].blockingCells).toEqual([]);expect([label!.width,label!.height]).toEqual([12,2]);for(const e of [...l.entries,...l.exits])expect(overlap(label!,e),`${sign} label covers ${e.name}`).toBe(false);});
 it('renders bold exact English names from original pixels without an installed font',async()=>{const path='art/source/hub-nameplates.json';expect(existsSync(path),'deterministic pixel-letter source is missing').toBe(true);const master=JSON.parse(readFileSync(path,'utf8'));expect(master.glyphScale).toBe(3);expect(master.strokePixels).toBeGreaterThanOrEqual(3);expect(master.labels).toEqual(SIGN_IDS.map((s,i)=>({id:s,text:`${String(i+1).padStart(2,'0')} ${s.toUpperCase()} SPEAKER ROOM`})));const svg=readFileSync('art/source/hub-labels.svg','utf8');expect(svg).not.toMatch(/<text\b|font-family|font-weight/);expect(await sharp('assets/tilesets/original/hub-labels.png').metadata()).toMatchObject({width:384,height:1632,hasAlpha:true});});


 it('encodes every room phrase as actual three-pixel block glyphs in the PNG',async()=>{
  const master=JSON.parse(readFileSync('art/source/hub-nameplates.json','utf8'));
  const {data}=await sharp('assets/tilesets/original/hub-labels.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const expected=Buffer.alloc(384*768),actual=Buffer.alloc(expected.length);
  for(const[i,label]of master.labels.entries())for(const[lineIndex,line]of [label.text.replace(' SPEAKER ROOM',''),'SPEAKER ROOM'].entries()){
   const left=Math.floor((384-(line.length*18-3))/2),top=i*64+(lineIndex===0?9:36);
   for(const[c,char]of[...line].entries())for(const[y,row]of(master.glyphs[char] as string[]).entries())for(let x=0;x<5;x++)if(row[x]==='1')for(let py=0;py<3;py++)for(let px=0;px<3;px++)expected[(top+y*3+py)*384+left+c*18+x*3+px]=lineIndex+1;
  }
  for(let n=0;n<actual.length;n++){const r=data[n*4],g=data[n*4+1],b=data[n*4+2];if(r===255&&g===228&&b===160)actual[n]=1;else if(r===201&&g===237&&b===242)actual[n]=2;}
  expect(actual.equals(expected),'native PNG glyph positions/weight differ from exact original room copy').toBe(true);
 });
 it('uses four pointer boards instead of a welcome paragraph',()=>{
  const l=source();expect(l.signs?.some(s=>s.name==='arrival-instructions'&&s.text.split('\n').length>3)).toBe(false);
  expect(arrivalPlaques(l,loadTileCatalog()).map(p=>p.id).sort()).toEqual(Object.keys(arrivalFaces).sort());
 });

 it('shows the enlarged colourful floor lockup above the welcome spawn and clears the road crosspost',()=>{
  const l=restoreProgrammeBoards(source()),spawn=l.entries.find(e=>e.isDefault)!,panels=arrivalFloorPanels.map(p=>({...p,y:p.y-6}));
  expect(l.images!.filter(i=>i.name.startsWith('Arrival /'))).toEqual(panels);
  expect(l.placements.some(p=>['arrival-direction-crosspost','arrival-crosspost-pole'].includes(p.id))).toBe(false);
  for(const p of panels){expect(p.y+p.height).toBeLessThan(spawn.y);for(const other of l.placements.filter(p=>!['terrain','atmosphere'].includes(p.layer)))expect(overlap(p,other),p.name+' covers '+other.id).toBe(false);}
 });
 it('gives every arrow glyph four clear dark pixels of vertical inset',async()=>{
  const svg=readFileSync('art/source/hub-labels.svg','utf8');
  const background=svg.replace(/<rect [^>]*fill="#(?:ffe4a0|c9edf2)"\/>/g,'');
  const {data:ink,info}=await sharp('assets/tilesets/original/hub-labels.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const backdrop=await sharp(Buffer.from(background)).ensureAlpha().raw().toBuffer();
  const failures:string[]=[];let glyphPixels=0;
  for(let y=1440;y<info.height;y++)for(let x=0;x<info.width;x++){
   const n=(y*info.width+x)*4,isInk=(ink[n]===255&&ink[n+1]===228&&ink[n+2]===160)||(ink[n]===201&&ink[n+1]===237&&ink[n+2]===242);
   if(!isInk)continue;glyphPixels++;
   for(let offset=-4;offset<=4;offset++){
    const p=((y+offset)*info.width+x)*4;
    if(backdrop[p]!==18||backdrop[p+1]!==41||backdrop[p+2]!==58||backdrop[p+3]!==255){if(failures.length<12)failures.push(`glyph ${x},${y} lacks dark backing at vertical offset ${offset}`);break;}
   }
  }
  expect(glyphPixels).toBeGreaterThan(0);expect(failures).toEqual([]);
 });
 it('keeps the upper event lockup visible from the sponsor floor and reachable from the unchanged spawn',()=>{
  const {l,mask}=built(),spawn=l.entries.find(e=>e.isDefault)!,required=l.images!.filter(i=>i.name.startsWith('Arrival /'));
  expect(required).toHaveLength(4);
  // Moving the logo north intentionally retires the old first-frame guarantee.
  // From the reserved sponsor floor (64,60), retain the conservative 30x16-tile
  // viewport with one tile of top/side HUD clearance and two tiles below.
  const safe={x:64.5-14,y:60.5-7,width:28,height:13};
  for(const r of required) expect(r.x>=safe.x&&r.y>=safe.y&&r.x+r.width<=safe.x+safe.width&&r.y+r.height<=safe.y+safe.height,r.name+' misses approach view').toBe(true);
  for(const start of cells(spawn,l.width)){
   const reachable=distances(l,mask,start);
   for(const r of [...required,{x:58,y:60,width:12,height:4}]) for(const c of cells(r,l.width)){
    expect(mask[c],'blocked arrival floor').toBe(0);expect(reachable.has(c),'unreachable arrival floor').toBe(true);
   }
  }
 });
 it('retains the compact crosspost only in the independently checked pre-arrival history',()=>{
  const l=preArrivalLayout(source());for(const[id,size]of Object.entries({'arrival-direction-crosspost':[6,3]})){
   const p=l.placements.find(p=>p.id===id)!;expect([p.width,p.height],id).toEqual(size);
  }
 });
 it('keeps compact plaque glyph boxes clear of ornamental strokes',async()=>{
  const svg=readFileSync('art/source/hub-labels.svg','utf8'),background=svg.replace(/<rect [^>]*fill="#(?:ffe4a0|c9edf2)"\/>/g,''),master=JSON.parse(readFileSync('art/source/hub-nameplates.json','utf8')),tiles=loadTileCatalog();
  const {data,info}=await sharp(Buffer.from(background)).ensureAlpha().raw().toBuffer({resolveWithObject:true});const failures:string[]=[];
  for(const id of ['welcome','brand','directory','you-are-here']){
   const nav=master.navigation.find((n:{id:string})=>n.id===id),rect=tiles[`hub-nav-${id}`].rect,w=rect.width*32;
   for(const[i,line]of (nav.lines as string[]).entries()){
    const ink=line.length*6-1,left=rect.x*32+Math.floor((w-ink)/2),top=rect.y*32+(id==='welcome'?(i===0?7:18):12);
    for(let y=top-2;y<top+9;y++)for(let x=left-2;x<left+ink+2;x++){
     const n=(y*info.width+x)*4;if((data[n]!==12||data[n+1]!==29||data[n+2]!==48||data[n+3]!==255)&&failures.length<8)failures.push(`${id} decorative stroke in text backing at ${x},${y}`);
    }
   }
  }expect(failures).toEqual([]);
 });
 it('keeps every raster nameplate and pointer apart from controls and other plaques',()=>{
  const l=source(),plaques=[...SIGN_IDS.map(sign=>{const p=l.placements.find(p=>p.id===`${sign}-bold-nameplate`)!;expect(p).toBeDefined();assertVisual(loadTileCatalog()[p.sprite],loadTileCatalog()[`hub-label-${sign}`]);return p;}),...arrivalPlaques(l,loadTileCatalog())];
  expect(new Set(plaques.map(p=>p.id)).size).toBe(16);
  for(const[i,p]of plaques.entries()){
   for(const r of [...l.entries,...l.exits,...l.areas])expect(overlap(p,r),`${p.id} covers ${r.name}`).toBe(false);
   for(const other of plaques.slice(i+1))expect(overlap(p,other),`${p.id} overlaps ${other.id}`).toBe(false);
  }
 });
 it('leaves reception, every return and sponsor artwork clear and connected',()=>{const{l,mask}=built(),spawn=l.entries.find(e=>e.isDefault)!,d=distances(l,mask,spawn.y*l.width+spawn.x);for(const r of [...l.entries,...l.exits,...l.areas])for(const n of cells(r,l.width)){expect(mask[n],`${r.name} collision`).toBe(0);expect(d.has(n),`${r.name} unreachable`).toBe(true);}assertSponsorFootprints(l,loadTileCatalog(),built().tmj);for(const entry of l.entries)for(const exit of l.exits)expect(overlap(entry,exit)).toBe(false);});
});
