import {authorNavigationContext,navigationAtlases} from './harbour-navigation-context';
import {authorParkArcadeContext,parkArcadeAtlases} from './park-arcade-context';
import {authorPlaygroundContext} from './playground-context';
import {isDeepStrictEqual} from 'node:util';
import{assertNativeOwnershipContext,assertNativeAuthoringContext,isRoadsterV2}from'./native-ownership-context';
import contract from'./animated-decoration-contract.json';
import ocean from '../../world/beach-ship-native.json';
import type {TiledMap,TiledTileset,TiledLayer,TileLayer,TiledProperty} from './types';
import{authorCafeArrivalContext,cafeArrivalAtlases}from'./cafe-arrival-context';
import{authorMazeGateContext,mazeGateAtlases}from'./maze-gate-context';

const need=(ok:unknown,message:string):void=>{if(!ok)throw Error('Native projection '+message);};
const ordinary=(set:TiledTileset)=>/^art-\d+$/.test(set.name??'');
const plain=(gid:number)=>(gid&0x0fffffff)>>>0;
const body=(set:TiledTileset,art:boolean)=>({...set,firstgid:0,...(art?{name:''}:{})});
/** Existing ocean behavior is independently declared DATA, never copied from a
 * native map being validated. No other historic visual exception is admitted. */
export function expectedNativeProjection(source:TiledMap):TiledMap{
 const result=structuredClone(source),id=result.properties?.find(p=>p.name==='worldMapId')?.value;
 if(['shipyard-beach','constellation-shore','fa-ship'].includes(String(id))){
  const water=result.tilesets.filter(t=>t.image==='../assets/tilesets/lpc-water/water.png');need(water.length===1,'registered ocean atlas missing');
  const ids=ocean.waterTileIds;water[0].tiles=[...(water[0].tiles??[]).filter(t=>!ids.includes(t.id)),...ids.map((local,phase)=>({id:local,animation:ids.map((_,i)=>({tileid:ids[(phase+i)%ids.length],duration:ocean.waterFrameMs}))}))];
  const terrain=result.layers.filter(l=>l.name==='terrain');need(terrain.length===1,'registered ocean terrain missing');
  const properties:TiledProperty[]=Object.entries(ocean.audio).map(([name,value])=>({name,type:typeof value==='boolean'?'bool':typeof value==='number'?'float':'string',value}));
  need(!terrain[0].properties?.length,'source ocean terrain has undeclared property DATA');terrain[0].properties=properties;
 }
 return result;
}
function checkStructure(map:TiledMap):void{
 const names=new Set<string>(),ids=new Set<number>();
 for(const layer of map.layers){need(!names.has(layer.name)&&!ids.has(layer.id)&&Number.isSafeInteger(layer.id),'duplicate layer ownership');names.add(layer.name);ids.add(layer.id);need(layer.type!=='group','flattened projection required');}
 need(map.layers.filter(l=>l.name==='floorLayer'&&l.type==='objectgroup').length===1,'avatar boundary missing/ambiguous');
 const atlasNames=new Set<string>(),ranges:{from:number;to:number}[]=[];
 for(const set of map.tilesets){need(!!set.name&&!atlasNames.has(set.name!)&&!set.source&&!!set.image&&Number.isSafeInteger(set.firstgid)&&set.firstgid>0&&Number.isSafeInteger(set.tilecount)&&set.tilecount!>0&&set.firstgid+set.tilecount!<=0x10000000,'finite unique embedded atlas required');atlasNames.add(set.name!);ranges.push({from:set.firstgid,to:set.firstgid+set.tilecount!});}
 ranges.sort((a,b)=>a.from-b.from);for(let i=1;i<ranges.length;i++)need(ranges[i-1].to<=ranges[i].from,'atlas GID reservations overlap');
}
function bindAtlases(actual:TiledMap,intended:TiledMap):Map<TiledTileset,TiledTileset>{
 checkStructure(actual);checkStructure(intended);
 const named=new Set(intended.tilesets.filter(t=>!ordinary(t)).map(t=>t.name)),bound=new Map<TiledTileset,TiledTileset>(),claimed=new Set<TiledTileset>();
 for(const set of intended.tilesets){
  const matches=actual.tilesets.filter(t=>ordinary(set)?!named.has(t.name)&&t.image===set.image:t.name===set.name&&t.image===set.image);
  need(matches.length===1&&!claimed.has(matches[0]),'atlas role missing/ambiguous: '+set.name);
  const target=matches[0];need(isDeepStrictEqual(body(target,ordinary(set)),body(set,ordinary(set))),'atlas semantic shape changed: '+set.image);bound.set(set,target);claimed.add(target);
 }
 return bound;
}
function sourceSet(map:TiledMap,gid:number):TiledTileset{
 const n=plain(gid),sets=map.tilesets.filter(t=>n>=t.firstgid&&n<t.firstgid+t.tilecount!);need(sets.length===1,'GID has no unique atlas');return sets[0];
}
function paintSequence(map:TiledMap,source:TiledMap):string[]{
 const painted=new Set(source.layers.filter(l=>l.type==='tilelayer'&&l.visible!==false&&l.opacity!==0).map(l=>l.name));
 return map.layers.filter(l=>l.name==='floorLayer'||painted.has(l.name)).map(l=>l.name);
}
/** Pure source/native projection gate. Only genuine global IDs and renamed
 * ordinary-art labels are representation differences; all rendering semantics
 * and the complete painted order are compared. */
export function assertNativeSourceProjection(actual:TiledMap,rawSource:TiledMap):void{
 const source=expectedNativeProjection(rawSource),bindings=bindAtlases(actual,source);
 assertNativeOwnershipContext(actual,source);
 // All native rendering context is bound as one body. Properties and allocator
 // counters are independently owned semantic/identity state, not scene format.
 const context=(map:TiledMap)=>{const{layers,tilesets,properties,nextlayerid,nextobjectid,...rendering}=map;void layers;void tilesets;void properties;void nextlayerid;void nextobjectid;return rendering;};
 need(isDeepStrictEqual(context(actual),context(source)),'global rendering context changed');
 const expected=source.layers.filter(l=>l.type==='tilelayer'),current=actual.layers.filter(l=>l.type==='tilelayer');
 need(isDeepStrictEqual(current.map(l=>l.name).sort(),expected.map(l=>l.name).sort()),'tile-layer roster changed');
 const floor=(map:TiledMap)=>map.layers.find(l=>l.name==='floorLayer')!;
 need(isDeepStrictEqual({...floor(actual),id:0},{...floor(source),id:0}),'avatar boundary body changed');
 const remap=(gid:number):number=>{if(!gid)return 0;const set=sourceSet(source,gid),target=bindings.get(set)!;return((target.firstgid+plain(gid)-set.firstgid)|(gid&0xf0000000))>>>0;};
 for(const expectedLayer of expected){
  const layer=current.find(l=>l.name===expectedLayer.name)!;need(layer.type==='tilelayer'&&expectedLayer.type==='tilelayer','tile-layer type changed');
  if(layer.type!=='tilelayer'||expectedLayer.type!=='tilelayer')continue;
  for(const gid of layer.data)if(gid)sourceSet(actual,gid);
  need(isDeepStrictEqual({...layer,id:0,data:[]},{...expectedLayer,id:0,data:[]}),'full layer envelope changed: '+layer.name);
  need(isDeepStrictEqual(layer.data,expectedLayer.data.map(remap)),'source GID/atlas cells changed: '+layer.name);
 }
 need(isDeepStrictEqual(paintSequence(actual,source),paintSequence(source,source)),'paint order/avatar depth changed');
}
/** Fresh owned-atlas transaction. A changed owned atlas may be removed only
 * when every existing global reference belongs to an explicitly rebuilt paint
 * layer. Unrelated reservations and all invisible controls stay untouched. */
export function reconcileNativeProjection(native:TiledMap,rawSource:TiledMap):TiledMap{
 const source=expectedNativeProjection(rawSource),result=structuredClone(native);checkStructure(result);checkStructure(source);
 assertNativeAuthoringContext(native,source);
 authorCafeArrivalContext(result);
 authorMazeGateContext(result);
 authorNavigationContext(result);
 authorParkArcadeContext(result);
 authorPlaygroundContext(result);
 const paint=source.layers.filter(l=>l.type==='tilelayer'&&l.visible!==false&&l.opacity!==0),owned=new Set(paint.map(l=>l.name)),sourceNames=new Set(source.layers.map(l=>l.name));
 need(result.layers.every(l=>l.type!=='tilelayer'||sourceNames.has(l.name)),'unknown native layer cannot be retired');
 const originalSets=structuredClone(result.tilesets),originalMax=Math.max(...originalSets.map(t=>t.firstgid+t.tilecount!));let next=originalMax;
 const named=new Set(source.tilesets.filter(t=>!ordinary(t)).map(t=>t.name));
 const references=(layers:TiledLayer[],from:number,to:number):string[]=>layers.flatMap(l=>l.type==='tilelayer'?l.data.some(g=>g&&plain(g)>=from&&plain(g)<to)?[l.name]:[]:l.type==='objectgroup'?l.objects.some(o=>o.gid&&plain(o.gid)>=from&&plain(o.gid)<to)?[l.name]:[]:l.type==='group'?references(l.layers,from,to):[]);
 const id=String(source.properties?.find(p=>p.name==='worldMapId')?.value);
 const cafe=[...cafeArrivalAtlases(id),...mazeGateAtlases(id),...navigationAtlases(id),...parkArcadeAtlases(id)];
 const ordered=cafe.length?[...source.tilesets.filter(s=>!cafe.some(t=>t.image===s.image)),...cafe.map(t=>source.tilesets.find(s=>s.image===t.image)!).filter(Boolean)]:source.tilesets;
 for(const set of ordered){
  // Roadster-v2 epoch: the registered v1 reservation (same role name, v1 image) is vacated before
  // the v2 body is appended; its only references belong to the rebuilt roadster paint layer.
  if(isRoadsterV2(set)){const v1=result.tilesets.filter(t=>t.name===set.name&&t.image!==set.image);need(v1.length<=1,'ambiguous roadster epoch');if(v1.length){need(references(result.layers,v1[0].firstgid,v1[0].firstgid+v1[0].tilecount!).every(name=>owned.has(name)),'retired owned atlas has protected references');result.tilesets=result.tilesets.filter(t=>t!==v1[0]);}}
  const matches=result.tilesets.filter(t=>ordinary(set)?!named.has(t.name)&&t.image===set.image:t.name===set.name&&t.image===set.image);need(matches.length<=1,'ambiguous author atlas role');
  const prior=matches[0];if(prior&&isDeepStrictEqual(body(prior,ordinary(set)),body(set,ordinary(set))))continue;
  if(prior){
   const role=((contract.maps as Record<string,{name:string}[]>)[String(native.properties?.find(p=>p.name==='worldMapId')?.value)]??[]).some(r=>r.name===prior.name);
   need(role||(prior.image==='../assets/tilesets/original/world-ambient-plants.png'&&set.image===prior.image),'unowned atlas epoch changed');
   need(references(result.layers,prior.firstgid,prior.firstgid+prior.tilecount!).every(name=>owned.has(name)),'retired owned atlas has protected references');
   // A registered role atlas is refreshed inside its exact reservation; only the plants epoch is retired and reallocated.
   if(role){need(set.tilecount!<=prior.tilecount!,'role atlas exceeds its registered reservation');result.tilesets[result.tilesets.indexOf(prior)]={...structuredClone(set),firstgid:prior.firstgid,name:prior.name};continue;}
   result.tilesets=result.tilesets.filter(t=>t!==prior);
  }
  const target={...structuredClone(set),firstgid:next,name:prior?.name??cafe.find(t=>t.image===set.image)?.name??(ordinary(set)?set.image!.split('/').at(-1)!.replace(/\.png$/,''):set.name)};need(!result.tilesets.some(t=>t.name===target.name),'new atlas name already reserved');result.tilesets.push(target);next+=set.tilecount!;
 }
 const bindings=bindAtlases(result,source),remap=(gid:number)=>{if(!gid)return 0;const set=sourceSet(source,gid);return((bindings.get(set)!.firstgid+plain(gid)-set.firstgid)|(gid&0xf0000000))>>>0;};
 let nextLayer=Math.max(result.nextlayerid??1,...result.layers.map(l=>l.id+1));
 const rebuilt=paint.map(l=>({...structuredClone(l),id:result.layers.find(a=>a.name===l.name)?.id??nextLayer++,...(l.type==='tilelayer'?{data:l.data.map(remap)}:{})}as TileLayer));
 const floor=source.layers.findIndex(l=>l.name==='floorLayer'),lastNonfloor=source.layers.findLastIndex(l=>l.type!=='tilelayer'),below=rebuilt.filter(l=>source.layers.findIndex(s=>s.name===l.name)<floor),deferred=rebuilt.filter(l=>source.layers.findIndex(s=>s.name===l.name)>lastNonfloor),above=rebuilt.filter(l=>!below.includes(l)&&!deferred.includes(l));
 result.layers=result.layers.filter(l=>!owned.has(l.name));const at=result.layers.findIndex(l=>l.name==='floorLayer');result.layers.splice(at,0,...below);result.layers.splice(result.layers.findIndex(l=>l.name==='floorLayer')+1,0,...above);result.layers.push(...deferred);result.nextlayerid=nextLayer;
 assertNativeSourceProjection(result,rawSource);
 return result;
}
