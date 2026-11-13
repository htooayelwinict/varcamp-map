import{stageCurrentArtInputs}from'./helpers/current-interior-fixture';
import{readShipFloorLabels}from'../tools/maps/beach-ship';
import{assertNativeStandingCaptions}from'../tools/maps/standing-captions';
import{readStandingCaptions}from'../tools/art/standing-captions';
import {standingFace as declaredFace} from './helpers/physical-prop-contracts';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {EXTERIOR_GATE_COPY,EXTERIOR_ROAD_COPY} from '../tools/art/exterior-gates';
import { loadTileCatalog } from '../tools/art/catalog';
import { buildMap } from '../tools/maps/builder';
import { checkArt } from '../tools/art/check';
import { retireHistoricalHosts } from './helpers/retired-host-layout';
import type { MapLayout, TileRect, Placement, TiledMap } from '../tools/maps/types';

const layouts = retireHistoricalHosts(readdirSync('world/layouts').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync(`world/layouts/${f}`,'utf8')) as MapLayout));
// One predicate is used by both fixture cases and the complete production-layout audit.
const labelCatalog=loadTileCatalog();
const standingFace=(l:MapLayout,id:string)=>declaredFace(l,labelCatalog,id,id==='welcome-control-sign'?'hub-nav-welcome':`exterior-road-${id.replace('exterior-road-sign-','')}`);
const obstructsLabel=(p:Placement,catalog:ReturnType<typeof loadTileCatalog>)=>{
 // Terrain and atmospheric backdrops were already outside the scenery audit.
 if(['terrain','atmosphere'].includes(p.layer))return false;
 const sprite=catalog[p.sprite];if(!sprite)throw Error(`Unknown scenery: ${p.sprite}`);
 // Match the builder's existing render-role precedence. Background art may sit
 // beneath labels; solid physical objects and foreground decoration may not.
 const level=p.renderRole==='canopy'?'aboveAvatar':p.renderRole?'belowAvatar':sprite.level;
 return (sprite.upperCells===undefined?level==='aboveAvatar':sprite.upperCells.length>0)||sprite.blockingCells.length>0;
};
const gap=(a:TileRect,b:TileRect)=>Math.max(0,a.x-b.x-b.width,b.x-a.x-a.width)+Math.max(0,a.y-b.y-b.height,b.y-a.y-a.height);
const overlap=(a:TileRect,b:TileRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const names:Record<string,RegExp>={overworld:/PLAZA/, 'campus-exploration':/EXPLORATION/, 'shipyard-beach':/HARBOR/, 'zodiac-festival-park':/FESTIVAL|PARK/, 'orbit-maze':/ORBIT|MAZE/, 'comet-maze':/COMET/, 'solar-hall':/SOLAR/, 'lunar-hall':/LUNAR/, 'nebula-arcade':/ARCADE/, 'orbit-playground':/PLAYGROUND/, 'constellation-shore':/SHORE/, 'fa-ship':/FA SHIP/, 'fa-ship-interior':/LOWER DECK/, 'star-garden':/GARDEN/, 'moon-cafe':/CAF[ÉE]/, 'moon-grotto':/GROTTO/, 'stargazer-terrace':/STARGAZER/, 'fire-district':/FIRE/, 'earth-district':/EARTH/, 'air-district':/AIR/, 'water-district':/WATER/};
const arrow=/[↑↓←→↗↘↙↖]/;

function nativeLabels(tmj:TiledMap,layout:MapLayout){
 const ordinary=tmj.layers.flatMap(layer=>layer.type==='objectgroup'?layer.objects:[]).filter(o=>o.text).map(o=>({x:o.x/32,y:o.y/32,width:o.width/32,height:o.height/32,text:(o.text as {text:string}).text,size:(o.text as {pixelsize:number}).pixelsize}));
 // A semantic copy alone is not evidence that pixels were exported. Production
 // validation binds atlas bytes, exact local tiles, plane/order and source text.
 assertNativeStandingCaptions(tmj,layout);
 const captions=(readStandingCaptions(layout)?.rows??[]).map(row=>{
  const layer=tmj.layers.find(l=>l.name==='standing-caption-'+row.sign.name)!;
  if(layer.type!=='tilelayer')throw Error('Caption is not a native tile plane');
  const cells=layer.data.flatMap((gid,index)=>gid?[{x:index%tmj.width,y:Math.floor(index/tmj.width)}]:[]),x=Math.min(...cells.map(c=>c.x)),y=Math.min(...cells.map(c=>c.y));
  return{x,y,width:Math.max(...cells.map(c=>c.x))-x+1,height:Math.max(...cells.map(c=>c.y))-y+1,text:layer.properties!.find(p=>p.name==='captionText')!.value as string,size:7*Math.max(1,Math.floor((row.sign.fontSize??18)/7))};
 });
 return [...ordinary,...captions,...readShipFloorLabels(tmj,layout,labelCatalog)];
}
const captionLayouts=layouts.filter(l=>['constellation-shore','shipyard-beach'].includes(l.id));
describe('audience wayfinding in exported Tiled maps',()=>{
 it('observes all nine active native coastal pixel captions with their readable footprints',()=>{
  const actual=captionLayouts.flatMap(l=>nativeLabels(JSON.parse(readFileSync(`maps/${l.id}.tmj`,'utf8')),l));
  expect(actual).toHaveLength(9);
  for(const l of captionLayouts){const labels=nativeLabels(JSON.parse(readFileSync(`maps/${l.id}.tmj`,'utf8')),l);expect(labels.map(x=>x.text)).toEqual(readStandingCaptions(l)!.rows.map(r=>r.sign.text));for(const label of labels)expect(label.size).toBeGreaterThanOrEqual(14);}
 });
 it.each(['missing-plane','semantic-text','local-tile'])('refuses %s rather than observing unvalidated caption copy',kind=>{
  const l=captionLayouts.find(l=>l.id==='constellation-shore')!,map=JSON.parse(readFileSync(`maps/${l.id}.tmj`,'utf8'))as TiledMap;
  const index=map.layers.findIndex(x=>x.name.startsWith('standing-caption-')),layer=map.layers[index];
  if(kind==='missing-plane')map.layers.splice(index,1);
  if(kind==='semantic-text')layer.properties!.find(p=>p.name==='captionText')!.value='FAKE PLAZA';
  if(kind==='local-tile'&&layer.type==='tilelayer')layer.data[layer.data.findIndex(Boolean)]++;
  expect(()=>nativeLabels(map,l)).toThrow(/Caption|caption/);
 });
 it('exports production labels at their native top-left coordinates in both Tiled and the pinned Phaser client',()=>{
  const catalog=loadTileCatalog();
  for(const l of layouts){
   const {tmj}=buildMap(l,catalog);
   const labels=tmj.layers.flatMap(layer=>layer.type==='objectgroup'?layer.objects:[]).filter(o=>o.text);
   for(const label of labels)expect(label.text,`${l.id}/${label.name}: centering uses incompatible native and live text widths`).toMatchObject({fontfamily:'Arial',bold:false,halign:'left',valign:'top'});
  }
 });
 it('detects a stale wayfinding PNG after its editable master changes',async()=>{
  const root=process.cwd(),fixture=mkdtempSync(resolve(tmpdir(),'varcamp-wayfinding-art-'));
  try{
   stageCurrentArtInputs(root,fixture);
   const file=resolve(fixture,'art/source/wayfinding.svg');
   writeFileSync(file,readFileSync(file,'utf8').replace('#0c1d30','#ff0000'));
   process.chdir(fixture);
   expect(await checkArt(loadTileCatalog())).toContain('wayfinding: PNG differs from native SVG export');
  }finally{process.chdir(root);rmSync(fixture,{recursive:true,force:true});}
 });
 it('uses concise physical cardinal pointers and raster controls at first arrival',()=>{
  const l=layouts.find(l=>l.id==='overworld')!;
  for(const [id,copy]of [['north','HALLS / MAZES'],['west','PARK / ARCADE'],['east','BEACH / SHIP'],['south','GARDEN / CAFE']]){
   const p=standingFace(l,`exterior-road-sign-${id}`);expect(p).toBeDefined();
   expect(EXTERIOR_ROAD_COPY[id]).toBe(copy);
  }
  expect(l.placements.some(p=>p.id==='welcome-control-sign')).toBe(false);
  expect(l.signs?.some(s=>s.text.split('\n').length>3)).toBe(false);
 });
 it.each(layouts.map(l=>[l.id,l] as const))('%s labels every physical destination with a nearby readable direction',(_id,l)=>{
  const{tmj}=buildMap(l,loadTileCatalog());
  if(l.id==='overworld'){
   const master=JSON.parse(readFileSync('art/source/hub-nameplates.json','utf8'));
   for(const e of l.exits){
    const speaker=e.destination.startsWith('speaker-'),key=speaker?e.destination.replace('speaker-',''):e.name;
    const hall=!speaker&&(key==='solar'||key==='lunar');
    const label=l.placements.find(p=>p.sprite===(speaker?`hub-label-${key}`:hall?`hall-exterior-${key}`:`exterior-gate-${key}`))!;
    const copy=speaker?master.labels.find((r:{id:string})=>r.id===key).text:hall?JSON.parse(readFileSync('art/source/hall-exteriors.json','utf8')).subjects.find((r:{id:string})=>r.id===key).title:EXTERIOR_GATE_COPY[key];
    if(hall)expect(copy).toBe(EXTERIOR_GATE_COPY[key]);
    expect(label,`${e.name}: raster plaque missing`).toBeDefined();expect(gap(label,e)).toBeLessThanOrEqual(6);
    const name=speaker?new RegExp(key.toUpperCase()):names[e.destination]!;expect(copy).toMatch(name);
    const roadArrow=l.placements.find(p=>p.id===(speaker?`approach-arrow-${key}`:`gate-approach-arrow-${key}`))!;
    expect(roadArrow.sprite).toMatch(/^arrow-(north|south|east|west)$/);expect(gap(roadArrow,e)).toBeLessThanOrEqual(4);
   }
   return;
  }
  const labels=nativeLabels(tmj,l);
  for(const e of l.exits){const name=e.destination.startsWith('speaker-')?new RegExp(e.destination.replace('speaker-','').toUpperCase()):names[e.destination]!;
   expect(labels.some(s=>name.test(s.text)&&arrow.test(s.text)&&s.size>=14&&gap(s,e)<=6),`${l.id}/${e.name}: no readable arrow sign names its actual destination`).toBe(true);
  }
 });
 it.each(layouts.map(l=>[l.id,l] as const))('%s explains the route to new arrivals without covering the spawn',(_id,l)=>{
  const e=l.entries.find(e=>e.isDefault)!;
  if(l.id==='overworld')expect(l.placements.some(p=>p.id==='welcome-control-sign'||p.sprite==='sign-compass')).toBe(false);else expect(l.signs?.some(s=>gap(s,e)<=7&&arrow.test(s.text)&&(s.fontSize??18)>=14),`${l.id} has no arrival direction within seven tiles`).toBe(true);
 });
 it('points first-time visitors north toward the Festival and Exploration pavilion doors',()=>{
  for(const id of ['zodiac-festival-park','campus-exploration']){
   const l=layouts.find(l=>l.id===id)!,{tmj}=buildMap(l,loadTileCatalog());
   const objects=tmj.layers.flatMap(layer=>layer.type==='objectgroup'?layer.objects:[]);
   for(const exit of l.exits.filter(e=>e.destination!=='overworld')){
    const label=objects.find(o=>o.name===`${exit.name}-label`)!;
    expect((label.text as {text:string}).text.match(arrow)?.[0],`${id}/${exit.name} points visitors away from its northbound door`).toBe('↑');
   }
  }
 });
 it('keeps its new physical sign panels and road chevrons off spawns, exits, sponsor images and interactive areas',()=>{
  const c=loadTileCatalog();
  for(const l of layouts)for(const p of l.placements.filter(p=>p.sprite==='sign-board-face'||p.sprite.startsWith('arrow-'))){
   expect(c[p.sprite].blockingCells,`${l.id}/${p.id} blocks a route`).toEqual([]);
   const controls=[...l.entries,...l.exits,...(l.images??[]),...l.areas.filter(a=>!a.properties.some(p=>p.type==='silent'))];
   for(const r of controls)expect(overlap(p,r),`${l.id}/${p.id} covers ${'name' in r?r.name:'an interaction'}`).toBe(false);
  }
 });
 it('puts road arrows only on walkable ground so they do not direct visitors into solid door edges',()=>{
  const c=loadTileCatalog();
  for(const l of layouts){
   const {tmj}=buildMap(l,c),mask=tmj.layers.find(layer=>layer.name==='physical-collisions');
   if(mask?.type!=='tilelayer')throw new Error(`${l.id}: navigation mask missing`);
   const spawn=l.entries.find(e=>e.isDefault)!,q=[spawn.y*l.width+spawn.x],seen=new Set(q);
   for(let h=0;h<q.length;h++){const i=q[h],x=i%l.width,y=Math.floor(i/l.width);for(const[nx,ny]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const n=ny*l.width+nx;if(nx<0||ny<0||nx>=l.width||ny>=l.height||mask.data[n]||seen.has(n))continue;seen.add(n);q.push(n);}}
   for(const p of l.placements.filter(p=>p.sprite.startsWith('arrow-'))){const i=p.y*l.width+p.x;expect(mask.data[i],`${l.id}/${p.id}: arrow is drawn on a solid cell`).toBe(0);expect(seen.has(i),`${l.id}/${p.id}: arrow lies outside the accessible road network`).toBe(true);}
  }
 });
 it('classifies overlapping floor backgrounds separately from physical or foreground decoration',()=>{
  const catalog=loadTileCatalog(),base:Placement={id:'ordinary-fixture',sprite:'beach-sea-veil',layer:'architecture',x:7,y:20,width:1,height:1};
  const sign={x:7,y:20,width:1,height:1};
  const obscures=(p:Placement)=>overlap(sign,p)&&obstructsLabel(p,catalog);
  expect(obscures(base)).toBe(false);
  expect(obscures({...base,renderRole:'canopy'})).toBe(true);
  const blocking=Object.keys(catalog).find(k=>catalog[k].blockingCells.length>0)!;
  expect(blocking).toBeDefined();expect(obscures({...base,sprite:blocking,renderRole:'grounded'})).toBe(true);
  expect(obscures({...base,sprite:blocking,layer:'terrain'})).toBe(false);
  const foreground=Object.keys(catalog).find(k=>catalog[k].level==='aboveAvatar')!;
  expect(foreground).toBeDefined();expect(obscures({...base,sprite:foreground})).toBe(true);
 });
 it('keeps all production labels apart from controls, other labels and scenery except deliberate wall plaques and return-rune backplates',()=>{
  for(const l of layouts)for(const[i,s]of(l.signs??[]).entries()){
   for(const other of(l.signs??[]).slice(i+1))expect(overlap(s,other),`${l.id}/${s.name} obscures ${other.name}`).toBe(false);
   for(const r of [...l.entries,...l.exits,...(l.images??[])])expect(overlap(s,r),`${l.id}/${s.name} covers ${r.name}`).toBe(false);
   for(const p of l.placements.filter(p=>obstructsLabel(p,labelCatalog)&&!p.id.startsWith(`wayfinding-wallboard-${s.name}-`))){
    const facade=l.id==='overworld'&&s.name.startsWith('room-')&&p.id.startsWith(s.name.replace('room-','')+'-')&&['wall-charcoal','wall-navy'].includes(p.sprite);
    const returnRune=s.name==='plaza-wayfinding'&&p.id==='door-sigil'&&p.sprite==='rune-threshold';
    const staffWall=['solar-hall','lunar-hall'].includes(l.id)&&s.name==='staff-label'&&p.id==='staff-north-wall'&&p.sprite==='wall-navy';
    const coastalBoard=['shipyard-beach','constellation-shore','fa-ship'].includes(l.id)&&p.id===`wood-sign-${s.name}`;
    // Expo booth nameplates are standing captions whose text is rendered onto their own navy fascia (the back-wall cap row).
    const boothFascia=l.id==='overworld'&&/^expo-[ns]\d-nameplate$/.test(s.name)&&p.id===`${s.name}-fascia`&&p.sprite==='expo-fascia';
    if(!facade&&!returnRune&&!staffWall&&!coastalBoard&&!boothFascia)expect(overlap(s,p),`${l.id}/${s.name} obscures ${p.id}`).toBe(false);
   }
  }
 });
});
