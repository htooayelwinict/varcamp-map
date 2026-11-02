import {readFileSync,writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {loadTileCatalog} from '../art/catalog';
import {EVENT_MAP_IDS,applyEventPresentation,isEventPresentation,restoreEventPresentation} from './event-presentation';
import {buildMap} from './builder';
import {renderReferenceInterior} from './reference-interiors';
import {reconcileNativeProjection} from './native-projection';
import {assertCurrentNativeMap} from './current-native';
import data from '../../world/event-presentation.json';
import type {MapLayout,TiledMap} from './types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const catalog=loadTileCatalog(),writes=new Map<string,string>();
for(const id of EVENT_MAP_IDS){
 const lp=`world/layouts/${id}.json`,mp=`maps/${id}.tmj`,old=read(lp)as MapLayout;
 const layout=isEventPresentation(old)?applyEventPresentation(restoreEventPresentation(old)):applyEventPresentation(old);
 let map:TiledMap;
 if(id==='overworld'){
  const native=read(mp)as TiledMap,source=buildMap(layout,catalog).tmj,staged=structuredClone(native);
  const sourceNames=new Set(source.layers.map(l=>l.name));
  const retire=staged.layers.filter(l=>!sourceNames.has(l.name));
  const retiredMarks=new Set(data.maps.overworld.changes.images.before.filter(i=>!layout.images!.some(a=>a.name===i.name)).map(i=>i.name));
  if(retire.some(l=>l.type!=='tilelayer'||(!l.name.startsWith('standing-caption-expo-')&&!l.name.startsWith('scenery-')&&!retiredMarks.has(l.name))))throw Error('Unexpected native layer retirement');
  staged.layers=staged.layers.filter(l=>sourceNames.has(l.name));
  const next=source.tilesets.find(t=>t.name==='standing-captions')!,previous=staged.tilesets.find(t=>t.name==='standing-captions')!;
  if(next.tilecount!==previous.tilecount)throw Error('Caption reservation size changed');
  staged.tilesets[staged.tilesets.indexOf(previous)]={...structuredClone(next),firstgid:previous.firstgid};
  // The compact desk occupies the same three desk-front cells as the predecessor.
  const collision=(m:TiledMap)=>{const l=m.layers.find(l=>l.name==='physical-collisions');if(l?.type!=='tilelayer')throw Error('Missing collision');return l.data.map(Boolean);};
  if(!isDeepStrictEqual(collision(native),collision(source)))throw Error('Plaza collision changed');
  map=reconcileNativeProjection(staged,source);
 }else map=renderReferenceInterior(layout,catalog).tmj;
 assertCurrentNativeMap(id,map,layout,read(`maps/${id}.wam`),catalog);
 writes.set(lp,JSON.stringify(layout,null,2)+'\n');writes.set(mp,JSON.stringify(map)+'\n');
}
for(const[p,v]of writes)writeFileSync(p,v);
console.log('Authored 15 maps. Saved WAMs, controls and plaza collision unchanged.');
