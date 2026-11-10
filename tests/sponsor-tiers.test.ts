import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {describe,it,expect} from 'vitest';
import {buildMap} from '../tools/maps/builder';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertNativeSourceProjection} from '../tools/maps/native-projection';
import {applySponsorTiers,restoreSponsorTiers} from '../tools/maps/sponsor-tiers';
import type {ObjectLayer} from '../tools/maps/types';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';

const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const baseline=()=>{
 const bytes=readFileSync('tests/fixtures/sponsor-tiers/before.json.gz');
 expect(createHash('sha256').update(bytes).digest('hex')).toBe('aace51d98ba5d1470220d7b265865145341bd9cbd46f999a1d6d8c769ff12037');
 return JSON.parse(gunzipSync(bytes).toString()) as {base:string;layout:MapLayout;native:TiledMap;wamSha256:string};
};
const current=()=>({layout:read('world/layouts/overworld.json') as MapLayout,native:read('maps/overworld.tmj') as TiledMap});
const mask=(m:TiledMap)=>(m.layers.find(l=>l.name==='physical-collisions') as TileLayer).data;
const floors=['main','spark','mini','aws','bsides','vibes','osrfm','ten-ten'];

describe('approved sponsor tier and community layout',()=>{
 it('provides one prominent main pavilion, two smaller sponsor tiers and five equal community booths',()=>{
  const {layout:l}=current();
  const areas=floors.map(id=>{const p=l.placements.find(p=>p.id===`sponsor-tier-${id}-floor`);expect(p,id+' usable floor').toBeDefined();return p!.width*p!.height;});
  expect(areas[0]).toBeGreaterThanOrEqual(areas[1]*2);
  expect(areas[1]).toBeGreaterThan(areas[2]);expect(areas[2]).toBeGreaterThan(areas[3]);
  expect(new Set(areas.slice(3)).size).toBe(1);
  const p=(id:string)=>l.placements.find(p=>p.id===`sponsor-tier-${id}-floor`)!;
  expect(p('main').y).toBeLessThan(p('spark').y);expect(p('spark').y).toBe(p('mini').y);
  expect(p('spark').x).toBeLessThan(p('main').x);expect(p('mini').x).toBeGreaterThan(p('main').x);
  expect(floors.slice(3).map(id=>p(id).y)).toEqual([82,82,82,82,82]);
  expect(floors.slice(3).map(id=>p(id).x)).toEqual([39,47,55,69,81]);
  const text=l.signs!.map(s=>s.text).join('\n');
  for(const name of ['DIGISEC LAB','NEWNESS','LOKAL ZAYTANN','AWS UG','MYANMAR','OSRFM','BSIDES','VIBE CODE','TOURS','TEN TEN','INFO DESK'])expect(text).toContain(name);
 });

 it('keeps a four-tile through route and reachable visitor space at every desk',()=>{
  const {layout:l,native:m}=current(),solid=mask(m),seen=new Set<number>(),queue=[65*128+63];
  for(let i=0;i<queue.length;i++){const n=queue[i];if(seen.has(n)||solid[n])continue;seen.add(n);const x=n%128,y=Math.floor(n/128);for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])if(x+dx>=0&&x+dx<128&&y+dy>=0&&y+dy<128)queue.push(n+dy*128+dx);}
  const clear=(x:number,y:number)=>{expect(solid[y*128+x],`blocked ${x},${y}`).toBe(0);expect(seen.has(y*128+x),`unreachable ${x},${y}`).toBe(true);};
  for(let y=65;y<90;y++)for(let x=62;x<66;x++)clear(x,y);
  for(const y of [74,75,86,89])for(let x=38;x<90;x++)clear(x,y);
  for(const id of floors){const p=l.placements.find(p=>p.id===`sponsor-tier-${id}-desk`);expect(p,id+' desk').toBeDefined();
   for(let y=p!.y;y<p!.y+p!.height;y++)for(let x=p!.x;x<p!.x+p!.width;x++)expect(solid[y*128+x],id+' desk surface').not.toBe(0);
   clear(p!.x+1,p!.y+p!.height);
  }
  for(const e of l.entries)for(let y=e.y;y<e.y+e.height;y++)for(let x=e.x;x<e.x+e.width;x++)clear(x,y);
 });

 it('preserves arrival, buildings, controls and every collision outside the expo',()=>{
  const {layout:l,native:m}=current(),b=baseline();
  expect(b.base.startsWith('428227f')).toBe(true);
  for(const key of ['entries','exits','areas','inspectionZones','animatedOverlays'] as const)expect(isDeepStrictEqual(l[key],b.layout[key]),key).toBe(true);
  const outside=(p:{x:number;y:number;width:number;height:number})=>p.x+p.width<=38||p.x>=90||p.y+p.height<=65||p.y>=90;
  expect(isDeepStrictEqual(l.placements.filter(outside),b.layout.placements.filter(outside)),'outside furnishings').toBe(true);
  expect(isDeepStrictEqual(l.images!.filter(outside),b.layout.images!.filter(outside)),'arrival artwork').toBe(true);
  const a=mask(m),old=mask(b.native);const changes=a.flatMap((gid,i)=>gid!==old[i]?[i]:[]);
  expect(changes.length).toBeGreaterThan(0);
  expect(changes.every(i=>i%128>=38&&i%128<90&&Math.floor(i/128)>=65&&Math.floor(i/128)<90)).toBe(true);
  expect(createHash('sha256').update(readFileSync('maps/overworld.wam')).digest('hex')).toBe(b.wamSha256);
  expect(isDeepStrictEqual(m.properties,b.native.properties)).toBe(true);
  expect(isDeepStrictEqual(m.tilesets.slice(0,-2),b.native.tilesets),'existing atlas reservations').toBe(true);
  for(const layer of b.native.layers.filter(l=>l.type==='objectgroup'&&l.name!=='wayfinding-text'))expect(isDeepStrictEqual(m.layers.find(l=>l.id===layer.id),layer),layer.name).toBe(true);
 });

 it('reuses approved logo identities in their new booths and matches source physics',()=>{
  const {layout:l,native:m}=current(),b=baseline();
  expect(l.images!.filter(i=>!['Expo / AWS User Group Myanmar','Expo / OSRFM','Expo / Ten Ten'].includes(i.name)).map(i=>i.name)).toEqual(b.layout.images!.map(i=>i.name));
  expect(l.images!.find(i=>i.name==='Expo / AWS User Group Myanmar')).toMatchObject({image:'assets/sponsors/partner-aws-ug-mm.png',x:40,y:84,width:4,height:2});
  expect(l.images!.find(i=>i.name==='Expo / BSides Myanmar')).toMatchObject({x:48,y:84,width:4,height:2});
  expect(l.images!.find(i=>i.name==='Expo / Vibe Code Tours')).toMatchObject({x:56,y:84,width:4,height:2});
  expect(()=>assertNativeSourceProjection(m,buildMap(l,loadTileCatalog()).tmj)).not.toThrow();
 });

 it('round-trips only the reviewed transition and rejects unrelated source changes',()=>{
  const {layout:l}=current(),b=baseline();
  expect(isDeepStrictEqual(applySponsorTiers(b.layout),l)).toBe(true);
  expect(isDeepStrictEqual(restoreSponsorTiers(l),b.layout)).toBe(true);
  l.entries[0].x++;expect(()=>restoreSponsorTiers(l)).toThrow('unreviewed source layout');
  b.layout.placements[0].id+='-unexpected';expect(()=>applySponsorTiers(b.layout)).toThrow('unreviewed source layout');
 });

 it('keeps new floor labels clear of furniture and walls that render over native text',()=>{
  const {layout:l}=current();
  const hit=(a:{x:number;y:number;width:number;height:number},b:typeof a)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
  for(const sign of l.signs!.filter(s=>s.name.startsWith('sponsor-tier-'))){
   const overlaps=l.placements.filter(p=>p.layer==='props'&&hit(sign,p));
   expect(overlaps.map(p=>p.id),sign.name+' obscured by scenery').toEqual([]);
  }
 });

 it('rejects changed or missing native labels and mismatched source label geometry',()=>{
  const {layout:l,native:m}=current(),source=buildMap(l,loadTileCatalog()).tmj;
  const labels=(map:TiledMap)=>map.layers.find(l=>l.name==='wayfinding-text') as ObjectLayer;
  const missing=structuredClone(m);labels(missing).objects=[];
  expect(()=>assertNativeSourceProjection(missing,source)).toThrow();
  labels(source).objects[0].x+=32;
  expect(()=>assertNativeSourceProjection(m,source)).toThrow();
 });
});
