import {createHash} from 'node:crypto';
import data from '../../world/expo-roster.json';
import type {TiledMap,TiledTileset,ObjectLayer} from './types';

const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const hasExpoRoster=(m:TiledMap)=>m.properties?.some(p=>p.name==='worldMapId'&&p.value==='overworld')&&m.layers.some(l=>l.type==='objectgroup'&&l.name==='wayfinding-text'&&l.objects.some(o=>o.name==='sponsor-tier-main-tier'&&typeof o.text==='object'&&o.text!==null&&'text' in o.text&&o.text.text==='Digital Safety Partner'));
export function expoRosterLabels(source:TiledMap):ObjectLayer{
 const layer=source.layers.find(l=>l.name==='wayfinding-text') as ObjectLayer;
 if(sha(layer.objects.map(o=>({...o,id:0})))!==data.native.sourceLabelsSha256)throw Error('Expo roster: unreviewed source labels');
 return structuredClone(data.native.labels) as ObjectLayer;
}
export function authorExpoRosterLabels(actual:TiledMap,source:TiledMap):void{
 const layer=actual.layers.find(l=>l.name==='wayfinding-text');
 if(!layer||![data.native.beforeLabelsSha256,sha(data.native.labels)].includes(sha(layer)))throw Error('Expo roster: unreviewed native labels');
 actual.layers[actual.layers.indexOf(layer)]=expoRosterLabels(source);
 actual.nextobjectid=Math.max(actual.nextobjectid??1,...actual.layers.flatMap(l=>l.type==='objectgroup'?l.objects.map(o=>o.id+1):[]));
}
/** Ten Ten is unpainted; its historical interval remains unavailable for reuse. */
export function communityRosterSource(source:TiledMap):TiledMap{
 if(!hasExpoRoster(source))return source;
 if(source.tilesets.some(t=>t.name===data.retiredAtlas.name||t.image===data.retiredAtlas.image))throw Error('Expo roster: retired Ten Ten source mark');
 return {...source,tilesets:[...source.tilesets,structuredClone(data.retiredAtlas)]};
}
export function expoRosterAtlases(source:TiledMap,start:number):TiledTileset[]{
 const sets=source.tilesets.filter(t=>data.panels.some(p=>p.name===t.name||'../'+p.image===t.image));
 if(!hasExpoRoster(source)){if(sets.length)throw Error('Expo roster: panels require the reviewed roster');return[];}
 if(sets.length!==data.panels.length)throw Error('Expo roster: missing or duplicated panels');
 let next=start;
 return data.panels.map(p=>{
  const matches=sets.filter(t=>t.name===p.name||t.image==='../'+p.image),t=matches[0];
  if(matches.length!==1||t.name!==p.name||t.image!=='../'+p.image||t.source||t.tiles||t.tilewidth!==32||t.tileheight!==32||t.columns!==p.width||t.tilecount!==p.width*2||t.imagewidth!==p.width*32||t.imageheight!==64||(t.margin??0)!==0||(t.spacing??0)!==0||!t.properties?.some(v=>v.name==='sponsorPanel'&&v.value===true))throw Error('Expo roster: invalid panel '+p.name);
  const r={...structuredClone(t),firstgid:next};next+=t.tilecount!;return r;
 });
}
