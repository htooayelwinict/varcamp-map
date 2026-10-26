import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {expect,it} from 'vitest';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';
import {PLAZA_DRONES,isCurrentAircraft} from '../tools/maps/airborne';
import {currentDecorationRoles} from '../tools/maps/animated-decoration';
const parse=createRequire(import.meta.url)(resolve('docs/qa/coastal-flight-2026-10-16/prototype/upstream/phaser/src/tilemaps/parsers/tiled/ParseTilesets.js'));
it('renders two genuinely travelling drones in all quadrants, native clocks and above-scenery planes',async()=>{
 const layout=JSON.parse(readFileSync('world/layouts/overworld.json','utf8')) as MapLayout;
 const motion=layout.animatedOverlays!.filter(o=>o.name.startsWith('plaza-drone-'));expect(motion.length).toBeGreaterThan(8);
 const metadata=JSON.parse(readFileSync('art/source/plaza-drones.json','utf8'));
 expect(metadata.tracks).toHaveLength(2);
 for(const t of metadata.tracks){expect(new Set(t.samples.map((p:{x:number;y:number})=>`${p.x},${p.y}`)).size).toBeGreaterThan(300);expect(new Set(t.samples.map((p:{x:number;y:number})=>`${p.x<64*32?'W':'E'}${p.y<64*32?'N':'S'}`)).size).toBe(4);}
 const map=JSON.parse(readFileSync('maps/overworld.tmj','utf8')) as TiledMap,floor=map.layers.findIndex(l=>l.name==='floorLayer');
 const parsed=parse(map).tilesets;
 let visiblePixels=0;
 for(const o of motion){
  expect(o.level).toBe('aboveScenery');expect(o.width*o.height).toBeLessThan(256);
  const set=map.tilesets.find(t=>t.name===o.name)!,engine=parsed.find((t:{name:string})=>t.name===o.name),layer=map.layers.find(l=>l.name===o.name) as TileLayer;
  expect(map.layers.indexOf(layer)).toBeGreaterThan(floor);expect(set.tiles!.every(t=>t.properties!.some(p=>p.name==='collides'&&p.value===false))).toBe(true);
  const png=await sharp(o.image).ensureAlpha().raw().toBuffer({resolveWithObject:true});expect(png.data.length).toBeLessThanOrEqual(4*1024*1024);
  expect(o.animations.every(a=>a.frames.reduce((n,f)=>n+f.duration,0)===metadata.periodMs)).toBe(true);
  for(const time of [0,metadata.periodMs/4,metadata.periodMs/2,metadata.periodMs*3/4])for(const id of o.carrierTileIds){const tile=engine.getAnimatedTileId(set.firstgid+id,time)-set.firstgid,sx=tile%set.columns!*32,sy=Math.floor(tile/set.columns!)*32;for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(png.data[((sy+y)*png.info.width+sx+x)*4+3]>=128)visiblePixels++;}
 }
 expect(visiblePixels).toBeGreaterThan(400);
});
it('flies every one of the43 overworld drones above every tile, object and attendee in the trailing airborne stack',()=>{
 const layout=JSON.parse(readFileSync('world/layouts/overworld.json','utf8')) as MapLayout,map=JSON.parse(readFileSync('maps/overworld.tmj','utf8')) as TiledMap;
 const names=[...Array.from({length:40},(_,i)=>'plaza-drone-'+String(i).padStart(2,'0')),'plaza-fleet-camera','plaza-fleet-delivery','plaza-fleet-survey'];
 expect(PLAZA_DRONES.map(r=>r.name)).toEqual(names);expect(PLAZA_DRONES.every(r=>r.map==='overworld'&&isCurrentAircraft('overworld',r.name))).toBe(true);
 expect(currentDecorationRoles().overworld.filter(r=>r.role==='aircraft').map(r=>r.name)).toEqual(names);
 const drones=layout.animatedOverlays!.filter(o=>/^plaza-(drone|fleet)-/.test(o.name));expect(drones.map(o=>o.name)).toEqual(names);
 for(const o of drones){expect(o.level,o.name).toBe('aboveScenery');expect(JSON.parse(readFileSync(o.provenance!.metadataPath,'utf8')).overlay.level,o.name).toBe('aboveScenery');}
 // Everything else on the overworld (roadster included) stays below the drones; the drones are the complete tail.
 expect(layout.animatedOverlays!.filter(o=>o.level==='aboveScenery').map(o=>o.name)).toEqual(names);
 const order=map.layers.map(l=>l.name);expect(order.slice(-names.length)).toEqual(names);
 const firstDrone=order.indexOf(names[0]);
 for(const name of ['floorLayer','physical-collisions','wayfinding-text','inspection-zones',...order.filter(n=>/^(scenery-|standing-caption-)/.test(n)),...(layout.images??[]).map(i=>i.name),'roadster']){expect(order.indexOf(name),name).toBeGreaterThanOrEqual(0);expect(order.indexOf(name),name).toBeLessThan(firstDrone);}
 for(const l of map.layers.slice(-names.length)){expect(l.type).toBe('tilelayer');expect(l.visible).toBe(true);expect(l.opacity).toBe(1);}
});
