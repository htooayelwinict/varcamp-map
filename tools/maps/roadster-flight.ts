import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/roadster-flight.json';
import type {MapLayout,TiledMap,TiledTileset,LayoutAnimatedOverlay} from './types';
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(v:unknown,m:string)=>{if(!v)throw Error('Roadster flight: '+m);};
export const isRoadsterFlight=(l:MapLayout)=>l.id==='overworld'&&sha(l)===data.afterLayoutSha256;
function transform(l:MapLayout,forward:boolean):MapLayout{
 if(l.id!=='overworld')return l;
 need(sha(l)===(forward?data.beforeLayoutSha256:data.afterLayoutSha256),'unreviewed source layout');
 const out=structuredClone(l),i=out.animatedOverlays!.findIndex(o=>o.name==='roadster');
 need(i>=0&&isDeepStrictEqual(out.animatedOverlays![i],forward?data.before:data.after),'car descriptor changed');
 out.animatedOverlays![i]=structuredClone(forward?data.after:data.before) as LayoutAnimatedOverlay;
 need(sha(out)===(forward?data.afterLayoutSha256:data.beforeLayoutSha256),'unexpected source delta');return out;
}
export const applyRoadsterFlight=(l:MapLayout)=>transform(l,true);
export const restoreRoadsterFlight=(l:MapLayout)=>transform(l,false);
export const FLIGHT_IMAGE='../assets/tilesets/original/roadster-flight.png';
export function flightSourceAtlas(source:TiledMap):TiledTileset|undefined{
 const sets=source.tilesets.filter(t=>t.image===FLIGHT_IMAGE);if(!sets.length)return;
 need(source.properties?.some(p=>p.name==='worldMapId'&&p.value==='overworld')&&sets.length===1,'flight atlas requires one overworld role');
 const t=sets[0];need(t.name==='roadster'&&t.columns===16&&t.tilewidth===32&&t.tileheight===32&&t.imagewidth===512&&Number.isSafeInteger(t.imageheight)&&t.imageheight!>0&&t.imageheight!<=2048&&t.imageheight!%32===0&&t.tilecount===t.imageheight!/32*16&&!t.source&&!(t.margin??0)&&!(t.spacing??0)&&t.tiles?.length===25&&t.tiles.every(t=>t.animation?.length&&t.animation.every(f=>Number.isSafeInteger(f.tileid)&&f.tileid>=0&&f.tileid<sets[0].tilecount!&&f.duration>0)),'invalid flight atlas');return t;
}
/** Only for deriving the independently frozen predecessor roster. Never a native output. */
export function flightPredecessorSource(source:TiledMap):TiledMap{
 need(flightSourceAtlas(source),'missing flight role');const out=structuredClone(source);
 out.tilesets=out.tilesets.map(t=>t.image===FLIGHT_IMAGE?structuredClone(data.predecessorAtlas) as TiledTileset:t);return out;
}
export function retireRoadsterAtlas(sets:TiledTileset[]):TiledTileset[]{
 const out=structuredClone(sets),old=out.find(t=>t.name==='roadster');need(isDeepStrictEqual(old,data.predecessorAtlas),'predecessor reservation changed');old!.name='roadster-v2-history';return out;
}
