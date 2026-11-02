import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {auditGuideRoutes} from '../tools/bots/route-audit';
import {historicalFloorPlaza,WELCOME_PLAZA_RETIREMENT,WELCOME_SIGN_RETIREMENT} from './helpers/plaza-successor';
import {EXPO_PLAZA} from '../tools/maps/expo-plaza';
import {loadTileCatalog} from '../tools/art/catalog';
import {planRoute,startupRoute} from '../src/bots/venue';
import historicalRoutes from '../world/plaza-guide-before-spacing.json';
import {PERSONAS} from '../src/bots/personas';
import type {TileLayer,MapLayout} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const data=()=>({map:read('maps/overworld.tmj'),layout:read('world/layouts/overworld.json'),catalog:loadTileCatalog(),wam:read('maps/overworld.wam'),routes:read('src/bots/lyra-routes.json')});
const key=([x,y]:number[])=>`${x},${y}`;
const check=(d:ReturnType<typeof data>)=>auditGuideRoutes(d);
const layer=(d:ReturnType<typeof data>,name:string)=>d.map.layers.find((l:any)=>l.name===name) as TileLayer;
const maskGid=(d:ReturnType<typeof data>,collides:boolean)=>{const s=d.map.tilesets.find((t:any)=>t.name==='navigation-mask');return s.firstgid+s.tiles.find((t:any)=>t.properties.some((p:any)=>p.name==='collides'&&p.value===collides)).id;};

describe('final plaza guide physical/depth audit',()=>{
 it('keeps the old conservative full-footprint rule on every immutable before-plaza prop that survives the approved retirements',()=>{
  // The expo hall aisle crosses the retired south-garden benches and the retired arrival label; every other historical footprint stays untouched by the graph.
  const retired=new Set([...WELCOME_PLAZA_RETIREMENT.placements,...WELCOME_SIGN_RETIREMENT.placements,...EXPO_PLAZA.retiredPlacements]);
  const l=historicalFloorPlaza('layout') as MapLayout,routes=historicalRoutes,overlaps=[],crossed=new Set<string>();
  for(const [x,y] of routes.allowedCells)for(const p of [...l.placements.filter((p:any)=>p.layer==='props'),...(l.images??[])])if(x>=p.x&&x<p.x+p.width&&y>=p.y&&y<p.y+p.height){if('id' in p&&retired.has(p.id))crossed.add(p.id);else overlaps.push(`${'id' in p?p.id:p.name}:${x},${y}`);}
  expect(overlaps).toEqual([]);
  expect([...crossed].sort()).toEqual(['arrival-position-label','inner-garden-southeast-bench','inner-garden-southeast-tea-table','inner-garden-southwest-bench','inner-garden-southwest-tea-table']);
 });
 it('accepts the final exact 864-cell graph and intentional below-avatar floor identity',()=>{
  const d=data(),result=check(d);
  expect(result).toMatchObject({allowedCells:864,startupReservedCells:4,nativeCollisionCells:6860,portalCells:48,walkablePropOverlapCells:102,walkableImageOverlapCells:8});
  expect(result.walkableProps.map((p:any)=>p.id).sort()).toEqual([...['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'].map(s=>`${s}-zodiac-threshold`),...['cancer','scorpio','sagittarius','capricorn','aquarius','pisces'].map(s=>`${s}-ground-name`),'approach-arrow-cancer','approach-arrow-capricorn','gate-return-arrow-maze','community-corner-floor','sponsor-expo-floor'].sort());
  const {provenance,...graph}=d.routes;
  expect(createHash('sha256').update(JSON.stringify(graph)).digest('hex')).toBe('3f0e753809114d3d54f4e56affe909cbdb46daf66b43ed7d5d801111376a5666');
 });
 it('explicitly retains only the inherited four-cell welcome escape, never ordinary area entry',()=>{
  const d=data();expect(check(d).startupInsideWelcomeArea).toEqual([[63,65],[64,65],[63,66],[64,66]]);
  const allowed=new Set(d.routes.allowedCells.map(key));for(const p of d.routes.startupReservedCells)expect(allowed.has(key(p))).toBe(false);
  d.routes.startupReservedCells.push([62,65]);expect(()=>check(d)).toThrow(/startup.*roster/);
 });
 it('keeps every persona patrol, eighteen destinations and four startup prefixes inside their audited graph',()=>{
  const d=data();check(d);const allowed=new Set(d.routes.allowedCells.map(key));
  const safe=(route:readonly (readonly number[])[])=>{
   expect(route.length).toBeGreaterThan(0);
   for(const p of route)expect(allowed.has(key([...p]))).toBe(true);
   for(let i=1;i<route.length;i++)expect(Math.abs(route[i][0]-route[i-1][0])+Math.abs(route[i][1]-route[i-1][1])).toBe(1);
  };
  for(const persona of Object.values(PERSONAS)){
   for(let i=1;i<persona.patrol.length;i++)safe(planRoute(persona.patrol[i-1],persona.patrol[i]));
   for(const destination of d.routes.destinations){const outward=planRoute(persona.home,destination.tile),back=planRoute(destination.tile,persona.home);safe(outward);safe(back);expect(outward.at(-1)).toEqual(destination.tile);expect(back.at(-1)).toEqual(persona.home);}
   for(const spawn of d.routes.startupReservedCells){
    const route=startupRoute(spawn,persona.home),prefix=spawn[1]-64;
    expect(route.slice(0,prefix)).toEqual(Array.from({length:prefix},(_,i)=>[spawn[0],spawn[1]-i]));
    safe(route.slice(prefix));expect(route.at(-1)).toEqual(persona.home);
   }
  }
 });
 it.each([
  ['native collision',(d:ReturnType<typeof data>)=>{layer(d,'physical-collisions').data[76*128+70]=maskGid(d,true);},/collision/],
  ['source solid base',(d:ReturnType<typeof data>)=>{d.layout.placements.push({id:'new-solid-route-obstacle',sprite:'plaza-tree-round',layer:'props',x:70,y:74,width:2,height:3});},/collision/],
  ['native raised face',(d:ReturnType<typeof data>)=>{layer(d,'scenery-aboveAvatar-0').data[76*128+70]=maskGid(d,false);},/raised/],
  ['source raised crest',(d:ReturnType<typeof data>)=>{d.catalog['zodiac-emblem-aries'].upperCells=[[1,1]];},/raised/],
  ['standing image',(d:ReturnType<typeof data>)=>{d.layout.images.find((p:any)=>p.name==='Arrival / VarCamp NW').standing=true;},/standing/],
  ['native image above floor',(d:ReturnType<typeof data>)=>{const l=layer(d,'Arrival / VarCamp NW');d.map.layers=d.map.layers.filter((x:any)=>x!==l);d.map.layers.push(l);},/raised|image.*depth/],
  ['native portal',(d:ReturnType<typeof data>)=>{layer(d,'exit-solar').data[76*128+70]=maskGid(d,false);},/portal/],
  ['WAM normal interaction',(d:ReturnType<typeof data>)=>{d.wam.areas.push({...d.wam.areas[0],id:'new',name:'new-interaction',x:70*32,y:76*32,width:32,height:32});},/interaction/],
  ['source normal interaction',(d:ReturnType<typeof data>)=>{d.layout.areas.push({...d.layout.areas[0],name:'new-interaction',x:70,y:76,width:1,height:1});},/interaction/],
  ['unaudited WAM entity',(d:ReturnType<typeof data>)=>{d.wam.entities.unreviewed={x:70*32,y:76*32,prefabRef:{collectionName:'unknown',id:'unknown'}};},/WAM entity/],
  ['unsupported route surface',(d:ReturnType<typeof data>)=>{d.layout.placements.push({id:'route-grass',sprite:'plaza-grass-01',layer:'terrain',x:70,y:76,width:1,height:1});},/surface/],
  ['duplicate route cell',(d:ReturnType<typeof data>)=>{d.routes.allowedCells[0]=d.routes.allowedCells[1];},/graph/],
  ['route widening',(d:ReturnType<typeof data>)=>{d.routes.allowedCells.push([1,1]);},/graph/],
  ['invalid GID',(d:ReturnType<typeof data>)=>{layer(d,'terrain').data[76*128+70]=0x0fffffff;},/GID/],
  ['missing source identity',(d:ReturnType<typeof data>)=>{d.layout.id='other';},/identity/],
  ['missing native identity',(d:ReturnType<typeof data>)=>{d.map.properties=d.map.properties.filter((p:any)=>p.name!=='worldMapId');},/identity/],
  ['nonorthogonal native geometry',(d:ReturnType<typeof data>)=>{d.map.orientation='hexagonal';},/identity/],
  ['ambiguous avatar boundary',(d:ReturnType<typeof data>)=>{d.map.layers.push(structuredClone(d.map.layers.find((l:any)=>l.name==='floorLayer')));},/avatar boundary/],
 ] as const)('rejects %s before a guide can use the graph',(_name,mutate,message)=>{const d=data();mutate(d);expect(()=>check(d)).toThrow(message);});
});
