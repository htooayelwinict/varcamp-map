import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/plaza-shoreline.json';
import type {MapLayout,Placement,TiledMap,TiledTileset} from './types';
import type {TileCatalog} from '../art/catalog';

const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(v:unknown,message:string)=>{if(!v)throw Error('Plaza shoreline: '+message);};
export const isPlazaShoreline=(l:MapLayout)=>l.id===data.mapId&&sha(l)===data.afterLayoutSha256;

/** Add the bank and four gate aprons without moving any existing object or control. */
function transform(input:MapLayout,forward:boolean,catalog?:TileCatalog):MapLayout{
 if(input.id!==data.mapId)return input;
 need(data.version===1&&sha(input)===(forward?data.beforeLayoutSha256:data.afterLayoutSha256),'unreviewed source layout');
 if(catalog)for(const[id,s]of Object.entries(data.sprites))need(isDeepStrictEqual(catalog[id],s),'bank artwork/footprint changed: '+id);
 const l=structuredClone(input);
 if(forward)l.placements.push(...structuredClone(data.added) as Placement[]);
 else{
  need(isDeepStrictEqual(l.placements.slice(-data.added.length),data.added),'bank or landing changed');
  l.placements.splice(-data.added.length);
 }
 need(sha(l)===(forward?data.afterLayoutSha256:data.beforeLayoutSha256),'unexpected source delta');return l;
}
export const applyPlazaShoreline=(l:MapLayout)=>transform(l,true);
export const restorePlazaShoreline=(l:MapLayout,catalog?:TileCatalog)=>transform(l,false,catalog);

/** One unchanged licensed source sheet, appended after all 161 prior reservations. */
export function shorelineAtlases(source:TiledMap,start:number):TiledTileset[]{
 if(source.properties?.find(p=>p.name==='worldMapId')?.value!=='overworld')return[];
 const image='../assets/tilesets/lpc-garden/terrain.png',sets=source.tilesets.filter(t=>t.image===image||t.name==='plaza-shoreline-terrain');
 if(!sets.length)return[];
 need(sets.length===1,'ambiguous bank atlas');const t=sets[0];
 need(/^art-\d+$/.test(t.name??'')&&t.image===image&&t.tilewidth===32&&t.tileheight===32&&t.columns===21&&t.imagewidth===672&&t.imageheight===736&&t.tilecount===483&&!t.source&&!t.tiles&&!(t.margin??0)&&!(t.spacing??0),'bank atlas geometry');
 return[{...structuredClone(t),name:'plaza-shoreline-terrain',firstgid:start}];
}
