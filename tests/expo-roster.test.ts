import {applyExpoRoster,restoreExpoRoster} from '../tools/maps/expo-roster';
import {beforeProgrammeNative} from './helpers/programme-history';
import {restoreProgrammeBoards} from '../tools/maps/programme-boards';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {isDeepStrictEqual} from 'node:util';
import {describe,it,expect} from 'vitest';
import {buildMap} from '../tools/maps/builder';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertNativeSourceProjection} from '../tools/maps/native-projection';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';

const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const current=()=>({layout:read('world/layouts/overworld.json') as MapLayout,map:read('maps/overworld.tmj') as TiledMap});
const before=()=>JSON.parse(gunzipSync(readFileSync('tests/fixtures/expo-roster/before.json.gz')).toString());
const booths=['aws','bsides','vibes','osrfm','duwun','open-taxi'];
const hit=(a:{x:number;y:number;width:number;height:number},b:typeof a)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;

describe('organizer-approved expo roster',()=>{
 it('replays only the approved roster change and rejects unrelated source edits',()=>{
  const {layout:l}=current(),b=before()['world/layouts/overworld.json'];
  expect(isDeepStrictEqual(applyExpoRoster(b),l)).toBe(true);expect(isDeepStrictEqual(restoreExpoRoster(l),b)).toBe(true);
  l.entries[0].x++;expect(()=>restoreExpoRoster(l)).toThrow('unreviewed source layout');
  b.placements[0].x++;expect(()=>applyExpoRoster(b)).toThrow('unreviewed source layout');
 });
 it('renders the supplied sponsor and media titles and removes Ten Ten from the map',()=>{
  const {layout:l,map:m}=current();
  expect(l.signs!.find(s=>s.name==='sponsor-tier-main-tier')?.text).toBe('Digital Safety Partner');
  expect(l.signs!.find(s=>s.name==='sponsor-tier-spark-tier')?.text).toBe('Spark Sponsor');
  for(const id of ['duwun','open-taxi'])expect(l.signs!.find(s=>s.name===`sponsor-tier-${id}-name`)?.text).toBe(id==='duwun'?'Duwun\nMedia Partner':'Open Taxi\nMedia Partner');
  expect(l.signs!.map(s=>s.text).join(' ')).not.toMatch(/TEN TEN/);
  expect(l.placements.some(p=>p.id.includes('ten-ten'))).toBe(false);
  expect(l.images!.some(i=>i.name==='Expo / Ten Ten')).toBe(false);
  expect(m.layers.some(layer=>layer.name==='Expo / Ten Ten')).toBe(false);
  const set=m.tilesets.find(t=>t.name==='Expo / Ten Ten')!;
  expect(set,'historical reservation retained').toBeDefined();
  for(const layer of m.layers)if(layer.type==='tilelayer')expect(layer.data.some(g=>g>=set.firstgid&&g<set.firstgid+set.tilecount!),'retired mark still painted').toBe(false);
 });

 it('provides six equal booths with unobstructed outside entrances and solid desks and shared walls',()=>{
  const {layout:l,map:m}=current(),solid=(m.layers.find(v=>v.name==='physical-collisions') as TileLayer).data;
  const seen=new Set<number>(),queue=[89*m.width+63];seen.add(queue[0]);
  for(let n=0;n<queue.length;n++){const i=queue[n],x=i%m.width,y=Math.floor(i/m.width);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,j=b*m.width+a;if(a<0||a>=m.width||b<0||b>=m.height||solid[j]||seen.has(j))continue;seen.add(j);queue.push(j);}}
  for(const id of booths){
   const floor=l.placements.find(p=>p.id===`sponsor-tier-${id}-floor`),desk=l.placements.find(p=>p.id===`sponsor-tier-${id}-desk`);
   expect(floor,id+' floor').toMatchObject({width:6,height:4,y:82});expect(desk,id+' desk').toBeDefined();
   for(let x=floor!.x;x<floor!.x+6;x++)expect(seen.has(86*m.width+x),id+' outside entrance').toBe(true);
   expect(seen.has((desk!.y+desk!.height)*m.width+desk!.x+1),id+' approach').toBe(true);
   for(let y=desk!.y;y<desk!.y+2;y++)for(let x=desk!.x;x<desk!.x+3;x++)expect(Boolean(solid[y*m.width+x]),id+' surface').toBe(true);
  }
  for(const x of [68,75,82,89])for(let y=82;y<86;y++)expect(Boolean(solid[y*m.width+x]),`divider ${x},${y}`).toBe(true);
  for(let y=65;y<90;y++)for(let x=62;x<66;x++)expect(solid[y*m.width+x],`central route ${x},${y}`).toBe(0);
 });

 it('renders both supplied media marks and the Myanmar caption below avatars without overlapping furnishings',()=>{
  const {layout:l,map:m}=current();
  for(const [name,x,y,width]of [['Expo / Duwun',76,84,6],['Expo / Open Taxi',83,84,6],['Expo / Lokal Name',78,76,6]] as const){
   const image=l.images!.find(i=>i.name===name);expect(image,name).toMatchObject({x,y,width,height:2});
   expect(l.placements.filter(p=>p.layer==='props'&&hit(p,image!)).map(p=>p.id)).toEqual([]);
   const set=m.tilesets.find(s=>s.name===name)!,layer=m.layers.find(v=>v.name===name) as TileLayer;
   expect(layer,name+' native rendering').toBeDefined();expect(m.layers.indexOf(layer)).toBeLessThan(m.layers.findIndex(v=>v.name==='floorLayer'));
   for(let dy=0;dy<2;dy++)for(let dx=0;dx<width;dx++)expect(layer.data[(y+dy)*m.width+x+dx]).toBe(set.firstgid+dy*width+dx);
  }
  expect(()=>assertNativeSourceProjection(m,buildMap(l,loadTileCatalog()).tmj)).not.toThrow();
 });

 it('preserves arrival, original sponsor artwork, saved controls and all collisions outside the eastern lower booths',()=>{
  const {layout:l,map:m}=current(),b=before(),old=b['maps/overworld.tmj'] as TiledMap,prior=b['world/layouts/overworld.json'] as MapLayout;
  expect(b.base).toBe('9d61659f49af11666a55478d048e27261534c65f');
  const rosterEpoch=restoreProgrammeBoards(l);
  for(const key of ['entries','exits','areas','inspectionZones'] as const)expect(isDeepStrictEqual(rosterEpoch[key],prior[key]),key).toBe(true);
  expect(read('maps/overworld.wam')).toEqual(b['maps/overworld.wam']);expect(m.properties).toEqual(old.properties);
  // The independently tested programme supports are a later additive epoch.
  const mask=(v:TiledMap)=>(v.layers.find(z=>z.name==='physical-collisions') as TileLayer).data,a=mask(beforeProgrammeNative(m)),c=mask(old);
  expect(a.flatMap((v,i)=>v!==c[i]?[i]:[]).every(i=>i%m.width>=75&&i%m.width<90&&Math.floor(i/m.width)>=80&&Math.floor(i/m.width)<86)).toBe(true);
  for(const layer of old.layers.filter(z=>z.type==='objectgroup'&&z.name!=='wayfinding-text'))expect(m.layers.find(z=>z.name===layer.name)).toEqual(layer);
  expect(m.tilesets.slice(0,old.tilesets.length)).toEqual(old.tilesets);
  for(const name of ['Expo / DigiSec Lab North','Expo / DigiSec Lab South','Expo / Newness','Expo / Lokal Zaytann','Expo / AWS User Group Myanmar','Expo / BSides Myanmar','Expo / Vibe Code Tours','Expo / OSRFM'])expect(l.images!.find(i=>i.name===name)).toEqual(prior.images!.find(i=>i.name===name));
 });
});
