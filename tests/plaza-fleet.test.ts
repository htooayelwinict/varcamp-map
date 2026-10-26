import{existsSync,readFileSync}from'node:fs';
import{expect,it}from'vitest';
import{createRequire}from'node:module';
import{resolve}from'node:path';
import{createHash}from'node:crypto';
import sharp from'sharp';
import{assertFleetSafety,renderPlazaFleet}from'../tools/art/plaza-fleet';
import{buildMap}from'../tools/maps/builder';
import{loadTileCatalog}from'../tools/art/catalog';
import type{MapLayout,TiledMap}from'../tools/maps/types';
const parse=createRequire(import.meta.url)(resolve('docs/qa/coastal-flight-2026-10-16/prototype/upstream/phaser/src/tilemaps/parsers/tiled/ParseTilesets.js'));
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
it('adds three original readable drone types to the preserved two-aircraft plaza baseline',()=>{
 const baseline=JSON.parse(readFileSync('art/source/plaza-drones.json','utf8'));
 expect(baseline.tracks).toHaveLength(2);
 const extra=existsSync('art/source/plaza-fleet.json')?JSON.parse(readFileSync('art/source/plaza-fleet.json','utf8')):{aircraft:[]};
 expect(extra.aircraft.map((a:{id:string})=>a.id)).toEqual(['plaza-fleet-camera','plaza-fleet-delivery','plaza-fleet-survey']);
 expect(baseline.tracks.length+extra.aircraft.length).toBe(5);
});
it('reproduces original native pose PNGs, metadata and three resource atlases without writing',async()=>{
 const result=await renderPlazaFleet();expect(result.aircraft).toHaveLength(3);
 expect(result.aircraft.reduce((n,a)=>n+a.diagnostics.decodedRgbaBytes,0)).toBeLessThan(6*1024*1024);
 expect(read('art/source/plaza-fleet.json')).toEqual(result.metadata);
 for(const a of result.aircraft){expect(a.png.equals(readFileSync(a.overlay.image))).toBe(true);expect(a.posePng.equals(readFileSync(a.posePath))).toBe(true);expect(a.metadata).toEqual(read(a.metadataPath));}
});
it('has three distinctly readable silhouettes, twelve actual native poses and real position changes',async()=>{
 const result=await renderPlazaFleet(),hashes=[];
 for(const a of result.aircraft){
  hashes.push(sha(a.poses[0].rgba));expect(a.poses).toHaveLength(12);expect(new Set(a.poses.map(p=>sha(p.rgba))).size).toBe(12);
  for(const p of a.poses){expect([p.width,p.height]).toEqual([24,24]);const alpha=Array.from({length:576},(_,i)=>p.rgba[i*4+3]);expect(alpha.filter(v=>v>=192).length).toBeGreaterThan(80);expect(alpha.filter(v=>v===0).length).toBeGreaterThan(80);}
  const t=a.metadata.track;expect(new Set(t.samples.map(s=>`${s.x},${s.y}`)).size).toBe(t.samples.length);expect(a.diagnostics.tracks[0].poseCount).toBe(12);expect(a.diagnostics.tracks[0].visiblePhases).toBe(t.samples.length);
  for(let n=0;n<t.samples.length;n++){const x=t.samples[n],y=t.samples[(n+1)%t.samples.length];expect(Math.hypot(x.x-y.x,x.y-y.y)).toBeLessThan(12);}
 }
 expect(new Set(hashes).size).toBe(3);
});
it('uses whole-box clear lanes without props, logos, entrances, exits or activity overlap',()=>{
 const layout=read('world/layouts/overworld.json')as MapLayout,recipe=read('art/source/plaza-fleet-recipe.json');expect(()=>assertFleetSafety(layout,recipe)).not.toThrow();
 for(const[name,mutate]of[
  ['sponsor',(r:typeof recipe)=>{r.aircraft[0].rect={x:61,y:67,width:6,height:2};}],
  ['welcome',(r:typeof recipe)=>{r.aircraft[0].rect={x:62,y:65,width:4,height:2};}],
  ['room door',(r:typeof recipe)=>{r.aircraft[0].rect={x:101,y:69,width:2,height:2};}],
  ['board',(r:typeof recipe)=>{r.aircraft[0].rect={x:66,y:61,width:6,height:3};}],
  ['above avatar',(r:typeof recipe)=>{r.aircraft[0].level='aboveAvatar';}],
  ['below avatar',(r:typeof recipe)=>{r.aircraft[0].level='belowAvatar';}],
  ['duplicate',(r:typeof recipe)=>{r.aircraft[1].id=r.aircraft[0].id;}],
  ['aircraft overlap',(r:typeof recipe)=>{r.aircraft[1].rect=r.aircraft[0].rect;}],
 ]as const){const bad=structuredClone(recipe);mutate(bad);expect(()=>assertFleetSafety(layout,bad),name).toThrow();}
});
it('emits exact native Phaser RGBA in every moving phase and loop with no collision, flying above scenery and avatars',async()=>{
 const result=await renderPlazaFleet(),layout:MapLayout={id:'overworld',width:128,height:128,placements:[],entries:[],exits:[],areas:[],inspectionZones:[],animatedOverlays:result.aircraft.map(a=>a.overlay)},map=buildMap(layout,loadTileCatalog()).tmj as TiledMap,engines=parse(map).tilesets,floor=map.layers.findIndex(l=>l.name==='floorLayer');
 let tested=0;
 for(const a of result.aircraft){
  const o=a.overlay,set=map.tilesets.find(s=>s.name===o.name)!,engine=engines.find((s:{name:string})=>s.name===o.name),{data,info}=await sharp(a.png).ensureAlpha().raw().toBuffer({resolveWithObject:true}),width=o.width*32,height=o.height*32;
  expect(o.level).toBe('aboveScenery');expect(map.layers.findIndex(l=>l.name===o.name)).toBeGreaterThan(floor);expect(map.layers.slice(-result.aircraft.length).map(l=>l.name)).toEqual(result.aircraft.map(a=>a.overlay.name));expect(set.tiles!.every(t=>t.properties?.some(p=>p.name==='collides'&&p.value===false))).toBe(true);expect(o.width*o.height).toBeLessThan(256);expect(data.length).toBeLessThan(4*1024*1024);
  for(let phase=0;phase<=a.metadata.track.samples.length;phase++){
   const actual=Buffer.alloc(width*height*4),s=a.metadata.track.samples[phase%a.metadata.track.samples.length],pose=a.poses[s.pose!],expected=Buffer.alloc(width*height*4);
   for(let y=0;y<24;y++)pose.rgba.copy(expected,((s.y+y)*width+s.x)*4,y*96,(y+1)*96);
   for(let cell=0;cell<o.carrierTileIds.length;cell++){const local=engine.getAnimatedTileId(set.firstgid+o.carrierTileIds[cell],phase*200)-set.firstgid,sx=local%set.columns!*32,sy=Math.floor(local/set.columns!)*32;for(let y=0;y<32;y++)data.copy(actual,((Math.floor(cell/o.width)*32+y)*width+cell%o.width*32)*4,((sy+y)*info.width+sx)*4,((sy+y)*info.width+sx+32)*4);}
   expect(actual.equals(expected),o.name+' phase'+phase).toBe(true);tested++;
  }
 }
 expect(tested).toBe(243);
});
