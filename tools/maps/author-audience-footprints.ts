import {readFileSync,writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/audience-footprints.json';
import {applyAudienceFootprints,assertAudienceFootprintCatalog} from './audience-footprints';
import {loadTileCatalog} from '../art/catalog';
import {buildMap} from './builder';
import {renderReferenceInterior} from './reference-interiors';
import {assertNativeSourceProjection,reconcileNativeProjection} from './native-projection';
import {assertCurrentNativeMap} from './current-native';
import type {MapLayout,TiledMap} from './types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const catalog=loadTileCatalog(),writes=new Map<string,string>();assertAudienceFootprintCatalog(catalog);
for(const id of Object.keys(data.maps)){
 const lp=`world/layouts/${id}.json`,mp=`maps/${id}.tmj`,old=read(lp) as MapLayout,layout=applyAudienceFootprints(old),native=read(mp) as TiledMap;
 let map:TiledMap;
 if(id==='overworld'){
  assertNativeSourceProjection(native,buildMap(old,catalog).tmj);
  const source=buildMap(layout,catalog).tmj,staged=structuredClone(native);
  const target=staged.layers.find(l=>l.name==='physical-collisions'),wanted=source.layers.find(l=>l.name==='physical-collisions');
  if(target?.type!=='tilelayer'||wanted?.type!=='tilelayer')throw Error('Missing collision masks');
  const marker=[...new Set(target.data.filter(Boolean))];if(marker.length!==1)throw Error('Ambiguous native collision marker');
  const allowed=new Set<number>();
  for(const p of old.placements){const next=layout.placements.find(q=>q.id===p.id)!;if(p.sprite===next.sprite)continue;
   const after=new Set(catalog[next.sprite].blockingCells.map(c=>c.join(',')));
   for(const[x,y]of catalog[p.sprite].blockingCells)if(!after.has(`${x},${y}`))allowed.add((p.y+y)*old.width+p.x+x);
  }
  target.data.forEach((gid,i)=>{if(Boolean(gid)!==Boolean(wanted.data[i])&&(!allowed.has(i)||!gid||wanted.data[i]))throw Error('Unreviewed physical delta at '+i);});
  target.data=wanted.data.map(g=>g?marker[0]:0);
  map=reconcileNativeProjection(staged,source);
  if(!isDeepStrictEqual(map.tilesets,native.tilesets)||!isDeepStrictEqual(map.properties,native.properties))throw Error('Native bindings/properties changed');
 }else map=renderReferenceInterior(layout,catalog).tmj;
 assertCurrentNativeMap(id,map,layout,read(`maps/${id}.wam`),catalog);
 writes.set(lp,JSON.stringify(layout,null,2)+'\n');writes.set(mp,JSON.stringify(map)+'\n');
}
for(const[p,v]of writes)writeFileSync(p,v);
console.log('Authored 12 seating layouts and 20 overworld footprints; saved WAMs and native bindings retained.');
