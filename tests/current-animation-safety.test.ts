import{mkdtempSync,readFileSync,rmSync,writeFileSync}from'node:fs';
import{tmpdir}from'node:os';
import{resolve}from'node:path';
import{createHash}from'node:crypto';
import sharp from'sharp';
import{expect,it}from'vitest';
import{assertCurrentNativeMap}from'../tools/maps/current-native';
import{stageCurrentWorldInputs}from'./helpers/current-interior-fixture';
import{WORLD_CATALOG}from'../src/world/catalog';
import registered from'../art/source/native-ownership-context.json';
import {assertNativeAnimationSafety} from '../tools/maps/animated-decoration';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
it('every current decoration is lower, an actual owned-upper projection, one of five safe airborne birds, the seaplane or one of the43 overworld drones',()=>{
 const invalid:string[]=[],upper:string[]=[],airborne:string[]=[],aircraft:string[]=[],lower:string[]=[];const birds=['shipyard-beach/coast-life-harbor-gull-north','shipyard-beach/coast-life-harbor-gull-south','constellation-shore/coast-life-shore-gull-north','constellation-shore/coast-life-shore-gull-south','fa-ship/world-ambient-fa-ship-gull-1'];const aircraftNames=[...Array.from({length:40},(_,i)=>'overworld/plaza-drone-'+String(i).padStart(2,'0')),'overworld/plaza-fleet-camera','overworld/plaza-fleet-delivery','overworld/plaza-fleet-survey','shipyard-beach/coastal-flight'];let count=0;
 for(const id of Object.keys(WORLD_CATALOG))for(const o of read(`world/layouts/${id}.json`).animatedOverlays??[]){count++;if(o.level==='belowAvatar'){lower.push(`${id}/${o.name}`);continue;}const meta=o.provenance?read(o.provenance.metadataPath):{};if(o.level==='aboveScenery'&&birds.includes(`${id}/${o.name}`))airborne.push(`${id}/${o.name}`);else if(o.level==='aboveScenery'&&aircraftNames.includes(`${id}/${o.name}`))aircraft.push(`${id}/${o.name}`);else if(o.level==='aboveAvatar'&&meta.partition==='opaqueOwnerUpper'&&meta.depthReceipt?.owner)upper.push(o.name);else invalid.push(`${id}/${o.name}/${o.level}`);}
 expect(count).toBe(140);expect(lower).toHaveLength(89);expect(aircraft.sort()).toEqual(aircraftNames.slice().sort());expect(lower.filter(name=>/^overworld\/plaza-(drone|fleet)-/.test(name))).toEqual([]);expect(upper).toHaveLength(2);expect(airborne.sort()).toEqual(birds.sort());expect(invalid).toEqual([]);
});
it('current plaza entry rejects coherent omission of the required Roadster',()=>{
 const id='overworld',map=read(`maps/${id}.tmj`),layout=read(`world/layouts/${id}.json`);map.layers=map.layers.filter((l:any)=>l.name!=='roadster');layout.animatedOverlays=layout.animatedOverlays.filter((o:any)=>o.name!=='roadster');
 // Roadster-v2 epoch: the v2 atlas is owned by the source descriptor, so a coherent omission also drops it,
 // leaving the registered v1 reservation unused in place. Only the roster guard can then report the role.
 const orphan=structuredClone(map),at=registered.maps.overworld.atlases.findIndex(t=>t.name==='roadster');
 expect(registered.maps.overworld.atlases[at]).toMatchObject({name:'roadster',firstgid:4330,tilecount:240});
 map.tilesets=map.tilesets.filter((s:any)=>s.image!=='../assets/tilesets/original/roadster-v2.png');map.tilesets.splice(at,0,structuredClone(registered.maps.overworld.atlases[at]));
 // The appended exterior reservation cannot move when the v2 role disappears,
 // so the complete current gate now refuses this omission at ownership first.
 // Independently retain the unconditional role-roster denial as well.
 expect(()=>assertNativeAnimationSafety(map,layout,read('art/tile-catalog.json'))).toThrow(/animation safety/i);
 expect(()=>assertCurrentNativeMap(id,map,layout,read(`maps/${id}.wam`),read('art/tile-catalog.json'))).toThrow(/native context/i);
 // Leaving the v2 atlas behind without its source owner is refused even earlier, by the native ownership context.
 expect(()=>assertCurrentNativeMap(id,orphan,layout,read(`maps/${id}.wam`),read('art/tile-catalog.json'))).toThrow(/native context/i);
});
it('current boundary rejects native upper pixels outside actual owning alpha255 art even when all output hashes are coherently rebound',async()=>{
 const project=process.cwd(),fixture=mkdtempSync(resolve(tmpdir(),'varcamp-upper-alpha-'));
 try{
  stageCurrentWorldInputs(project,fixture);const id='fa-ship-interior',name='world-ambient-fa-ship-interior-steam-1-upper',layout=read(resolve(fixture,`world/layouts/${id}.json`)),map=read(resolve(fixture,`maps/${id}.tmj`)),o=layout.animatedOverlays.find((o:any)=>o.name===name),set=map.tilesets.find((s:any)=>s.name===name),layer=map.layers.find((l:any)=>l.name===name),gid=layer.data[(o.y+1)*map.width+o.x],tile=set.tiles.find((t:any)=>t.id===gid-set.firstgid).animation[0].tileid;
  const pngPath=resolve(fixture,o.image),raw=await sharp(pngPath).ensureAlpha().raw().toBuffer({resolveWithObject:true}),offset=(Math.floor(tile/set.columns)*32*raw.info.width+tile%set.columns*32)*4;raw.data.set([255,0,0,255],offset);const png=await sharp(raw.data,{raw:{width:raw.info.width,height:raw.info.height,channels:4}}).png().toBuffer();writeFileSync(pngPath,png);o.provenance.atlasSha256=sha(png);const metaPath=resolve(fixture,o.provenance.metadataPath),meta=read(metaPath);meta.overlay=o;writeFileSync(metaPath,JSON.stringify(meta));writeFileSync(resolve(fixture,`world/layouts/${id}.json`),JSON.stringify(layout));
  // Async image work finishes before the temporary cwd; actual guard is sync.
  process.chdir(fixture);expect(()=>assertCurrentNativeMap(id,map,layout,read(`maps/${id}.wam`),read('art/tile-catalog.json'))).toThrow(/animation safety/i);
 }finally{process.chdir(project);rmSync(fixture,{recursive:true,force:true});}
},15000);
