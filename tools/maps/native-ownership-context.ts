import {VIBECODE_IMAGE,VIBECODE_CAPTION_IMAGE} from '../art/vibecode';
import{isDeepStrictEqual}from'node:util';
import registered from'../../art/source/native-ownership-context.json';
import{WORLD_CATALOG}from'../../src/world/catalog';
import contract from'./animated-decoration-contract.json';
import type{TiledMap,TiledLayer,TiledTileset}from'./types';
import {PATROL_IDS} from './patrol-roles';
import {FOUNTAIN_MOTION_IDS} from './fountain-motion-roles';
import {LEO_LION_IMAGE} from './leo-lion-head-definition';
import {HALL_BUILDING_ATLASES} from './hall-buildings-definition';
import {cafeArrivalProtectedLayers,cafeArrivalAtlases} from './cafe-arrival-context';
import {mazeGateProtectedLayers,mazeGateAtlases} from './maze-gate-context';
import {eventCounterAtlases,eventAtlasContextSource} from './event-native-context';
import {EVENT_CAPTION_IMAGE} from '../art/event-captions';

interface ContextRow{
 atlases:TiledTileset[];
 nextAtlasGid:number;
 retired:{firstgid:number;tilecount:number;name:string;image:string;ownedReferences:{layer:string;indices:number[]}[];protectedReferences:unknown[]}[];
 protectedLayers:TiledLayer[];
 protectedNonfloorOrder:string[];
}
const rows=registered.maps as unknown as Record<string,ContextRow>;
const need=(ok:unknown,message:string):void=>{if(!ok)throw Error('Native context '+message);};
// The first new production reservation family. Names/images are independent
// authority; candidate-native bodies and allocation maxima are never inputs.
const fleetNames=['plaza-fleet-camera','plaza-fleet-delivery','plaza-fleet-survey'];
/** The second reviewed reservation family: the expo epoch. Exactly these atlases may
 * join the overworld after the fleet, each at most once, in current source order, with
 * the identity/geometry registered here: twelve booth marks (two 6×2 panels, ten 4×2
 * compact marks) as embedded sponsor tilesets named below, the booth sticker sheet and
 * the overworld's own `standing-captions` atlas rendered into the expo caption image.
 * Registered DATA stays closed; nothing else may be appended on any current map. */
export const EXPO_MARKS=Object.freeze({
 'demo-01':{name:'Expo / Demo Orbit',columns:6},
 'demo-03':{name:'Expo / Demo Atlas',columns:6},
 'demo-01-compact':{name:'Expo / Demo Orbit Compact',columns:4},
 'demo-02-compact':{name:'Expo / Demo Nova Compact',columns:4},
 'demo-03-compact':{name:'Expo / Demo Atlas Compact',columns:4},
 'demo-04':{name:'Expo / Demo Vector',columns:4},
 'demo-05':{name:'Expo / Demo Lumen',columns:4},
 'hub-01':{name:'Expo / Code Circle',columns:4},
 'hub-02':{name:'Expo / Design Guild',columns:4},
 'hub-03':{name:'Expo / Data Club',columns:4},
 'hub-04':{name:'Expo / Game Jam',columns:4},
 'hub-05':{name:'Expo / Open Source',columns:4},
 // Owner-provided 2026 marks (art/sponsors.json, kind community-partner / event identity): the
 // three community partner hubs and the VarCamp lockup of the INFO DESK stall.
 'partner-aws-ug-mm':{name:'Expo / AWS User Group Myanmar',columns:4},
 'partner-bsides-mm':{name:'Expo / BSides Myanmar',columns:4},
 'partner-openinfra-mm':{name:'Expo / OpenInfra User Group Myanmar',columns:4},
 'varcamp-horizontal':{name:'Expo / VarCamp',columns:4},
}as Record<string,{name:string;columns:6|4}>);
/** The third reviewed reservation family: the owner-provided brand assets of the welcome
 * court and the expo hall road (tools/maps/brand-assets.ts). Exactly these two ordinary art
 * atlases may join the overworld after the expo family, each at most once, in current source
 * order, under the native names below with the registered image and geometry: the 4x3 plaza
 * fountain sprite sheet and the 1x3 lamp post sheet. Nothing else may be appended. */
export const BRAND_ATLASES=Object.freeze({
 'plaza-fountain':{image:'../assets/tilesets/original/plaza-fountain.png',imagewidth:128,imageheight:96,columns:4,tilecount:12},
 'plaza-lamp':{image:'../assets/tilesets/original/plaza-lamp.png',imagewidth:32,imageheight:96,columns:1,tilecount:3},
}as Record<string,{image:string;imagewidth:number;imageheight:number;columns:number;tilecount:number}>);
const brandAtlasByImage=new Map(Object.entries(BRAND_ATLASES).map(([name,atlas])=>[atlas.image,{...atlas,name}]));
/** Brand family membership is decided by the registered PNG identity only (an ordinary `art-N`
 * source atlas, or the native atlas carrying the registered name); no other atlas may use it. */
const brandMember=(set:TiledTileset)=>brandAtlasByImage.get(set.image??'');
function brandAtlases(source:TiledMap,start:number):TiledTileset[]{
 const seen=new Set<string>(),result:TiledTileset[]=[];let next=start;
 for(const set of source.tilesets){
  const atlas=brandMember(set);if(!atlas)continue;
  need(!seen.has(atlas.name),'brand asset source atlas duplicated: '+atlas.name);seen.add(atlas.name);
  need(/^art-\d+$/.test(set.name??'')&&set.tilewidth===32&&set.tileheight===32&&!set.source&&(set.spacing??0)===0&&(set.margin??0)===0&&set.columns===atlas.columns&&set.tilecount===atlas.tilecount&&set.imagewidth===atlas.imagewidth&&set.imageheight===atlas.imageheight&&!set.tiles,'brand asset atlas identity/geometry leaves its registered reservation: '+atlas.name);
  result.push({...structuredClone(set),firstgid:next,name:atlas.name});next+=set.tilecount!;
 }
 return result;
}
export const EXPO_STICKER_ATLAS=Object.freeze({name:'booth-stickers',image:'../assets/tilesets/original/booth-stickers.png',imagewidth:192,imageheight:32,columns:6,tilecount:6});
export const EXPO_CAPTION_ATLAS=Object.freeze({name:'standing-captions',image:'../assets/tilesets/original/expo-captions.png',imagewidth:512,columns:16,maxImageHeight:192});
/** The fourth reviewed reservation family: the roadster-v2 epoch, admitted after BRAND_ATLASES. The
 * plaza's `roadster` role outgrew its registered 240-tile reservation (GID 4330, v1 image) when the
 * display gained compiler-synthesised motion. The v2 body is identified by its own image; when the
 * current overworld source carries it, the registered v1 interval is vacated (never reused, like a
 * retired plant epoch) and the v2 body is appended after the brand family as one 16-column atlas of
 * at most 64 rows (the 4 MiB native bound) with its 25 synchronized carriers. */
export const ROADSTER_V2_ATLAS=Object.freeze({name:'roadster',image:'../assets/tilesets/original/roadster-v2.png',imagewidth:512,columns:16,maxImageHeight:2048,carriers:25,vacates:Object.freeze({name:'roadster',image:'../assets/tilesets/original/roadster.png',firstgid:4330,tilecount:240})});
export const isRoadsterV2=(set:TiledTileset):boolean=>set.name===ROADSTER_V2_ATLAS.name&&set.image===ROADSTER_V2_ATLAS.image;
/** One additive zodiac exterior reservation after all83 prior overworld bodies.
 * The current plaza gate requires the twelve-member source family unconditionally. */
export const ZODIAC_EXTERIOR_ATLAS=Object.freeze({name:'zodiac-exteriors',image:'../assets/tilesets/original/zodiac-exteriors.png',columns:48,imagewidth:1536,imageheight:1152,tilecount:1728});
function zodiacExteriorAtlas(source:TiledMap,start:number):TiledTileset|undefined{
 const r=ZODIAC_EXTERIOR_ATLAS,sets=source.tilesets.filter(t=>t.image===r.image||t.name===r.name);
 need(sets.length<=1,'zodiac exterior atlas duplicated');if(!sets.length)return;
 need(identities(source)[0]==='overworld','zodiac exterior atlas requires overworld identity');
 const set=sets[0];need(/^art-\d+$/.test(set.name??'')&&set.image===r.image&&set.tilewidth===32&&set.tileheight===32&&!set.source&&(set.spacing??0)===0&&(set.margin??0)===0&&set.columns===r.columns&&set.imagewidth===r.imagewidth&&set.imageheight===r.imageheight&&set.tilecount===r.tilecount&&!set.tiles,'zodiac exterior source atlas identity/geometry changed');
 return{...structuredClone(set),firstgid:start,name:r.name};
}
/** Two assembly-hall facades, one exact reservation after the84 prior bodies.
 * Current art and plaza gates require this family independently of source markers. */
export const HALL_EXTERIOR_ATLAS=Object.freeze({name:'hall-exteriors',image:'../assets/tilesets/original/hall-exteriors.png',columns:16,imagewidth:512,imageheight:192,tilecount:96});
/** Current arrival floor identity: four standard6x2panels, appended only after
 * all85prior bodies. The unused historical white-logo reservation is retained. */
export const ARRIVAL_FLOOR_ATLASES=Object.freeze(['nw','ne','sw','se'].map(key=>({name:'Arrival / VarCamp '+key.toUpperCase(),image:'../assets/sponsors/varcamp-arrival-'+key+'.png',columns:6,imagewidth:192,imageheight:64,tilecount:12})));
function arrivalFloorAtlases(source:TiledMap,start:number):TiledTileset[]{
 const member=(t:TiledTileset)=>ARRIVAL_FLOOR_ATLASES.some(r=>t.name===r.name||t.image===r.image),sets=source.tilesets.filter(member);if(!sets.length)return[];
 need(identities(source)[0]==='overworld'&&sets.length===4,'arrival floor requires exactly four overworld panels');
 return ARRIVAL_FLOOR_ATLASES.map((r,i)=>{const matches=sets.filter(t=>t.name===r.name||t.image===r.image);need(matches.length===1,'arrival floor atlas missing/duplicated: '+r.name);const t=matches[0];
  need(t.name===r.name&&t.image===r.image&&t.tilewidth===32&&t.tileheight===32&&!t.source&&(t.spacing??0)===0&&(t.margin??0)===0&&t.columns===6&&t.imagewidth===192&&t.imageheight===64&&t.tilecount===12&&!t.tiles&&t.properties?.some(p=>p.name==='sponsorPanel'&&p.value===true),'arrival floor atlas identity/geometry changed: '+r.name);
  return{...structuredClone(t),firstgid:start+i*12};
 });
}
/** Six new patrol atlases append after every retained arrival reservation. */
function patrolAtlases(source:TiledMap,start:number):TiledTileset[]{
 const sets=source.tilesets.filter(t=>PATROL_IDS.some(id=>t.name===id||t.image===`../assets/tilesets/original/${id}.png`));
 if(!sets.length)return[];
 need(identities(source)[0]==='overworld'&&isDeepStrictEqual(sets.map(t=>t.name),PATROL_IDS),'closed six-patrol atlas roster/order changed');
 let next=start;return sets.map(t=>{
  need(t.image===`../assets/tilesets/original/${t.name}.png`&&t.tilewidth===32&&t.tileheight===32&&!t.source&&(t.spacing??0)===0&&(t.margin??0)===0&&t.columns===16&&t.imagewidth===512&&Number.isSafeInteger(t.imageheight)&&t.imageheight!>0&&t.imageheight!<=2048&&t.imageheight!%32===0&&t.tilecount===t.imageheight!/32*16&&Array.isArray(t.tiles)&&t.tiles.length>0&&t.tiles.length<256,'patrol atlas geometry changed');
  const result={...structuredClone(t),firstgid:next};next+=t.tilecount!;return result;
 });
}
function hallExteriorAtlas(source:TiledMap,start:number):TiledTileset|undefined{
 const r=HALL_EXTERIOR_ATLAS,sets=source.tilesets.filter(t=>t.image===r.image||t.name===r.name);
 // The former gate is retired from paint, but its exact reservation is never reused.
 if(!sets.length&&source.tilesets.some(t=>t.image==='../assets/tilesets/original/hall-buildings.png'))return{...r,firstgid:start,tilewidth:32,tileheight:32,properties:[{name:'tilesetCopyright',type:'string',value:'Original Solar and Lunar pavilion artwork generated for VarCamp using OpenAI image generation, 2026-10-25; native sprite compilation by the VarCamp map team; Original project artwork; permitted project distribution'}]};
 need(sets.length<=1,'hall exterior atlas duplicated');if(!sets.length)return;
 need(identities(source)[0]==='overworld','hall exterior atlas requires overworld identity');
 const set=sets[0];need(/^art-\d+$/.test(set.name??'')&&set.image===r.image&&set.tilewidth===32&&set.tileheight===32&&!set.source&&(set.spacing??0)===0&&(set.margin??0)===0&&set.columns===r.columns&&set.imagewidth===r.imagewidth&&set.imageheight===r.imageheight&&set.tilecount===r.tilecount&&!set.tiles,'hall exterior source atlas identity/geometry changed');
 return{...structuredClone(set),firstgid:start,name:r.name};
}
/** Water-only fountain components append after all95 retained atlas bodies. */
function fountainAtlases(source:TiledMap,start:number):TiledTileset[]{
 const sets=source.tilesets.filter(t=>FOUNTAIN_MOTION_IDS.some(id=>t.name===id||t.image===`../assets/tilesets/original/${id}.png`));
 if(!sets.length)return[];
 need(identities(source)[0]==='overworld'&&isDeepStrictEqual(sets.map(t=>t.name),FOUNTAIN_MOTION_IDS),'closed fountain atlas roster/order changed');
 let next=start;return sets.map(t=>{
  need(t.image===`../assets/tilesets/original/${t.name}.png`&&t.tilewidth===32&&t.tileheight===32&&!t.source&&(t.spacing??0)===0&&(t.margin??0)===0&&t.columns===16&&t.imagewidth===512&&Number.isSafeInteger(t.imageheight)&&t.imageheight!>0&&t.imageheight!<=320&&t.imageheight!%32===0&&t.tilecount===t.imageheight!/32*16&&t.tiles?.length===12&&t.tiles.every(tile=>tile.animation?.length&&tile.animation.every(f=>f.duration%120===0)&&tile.animation.reduce((s,f)=>s+f.duration,0)===1440),'fountain atlas geometry/clock changed');
  const result={...structuredClone(t),firstgid:next};next+=t.tilecount!;return result;
 });
}
/** Beach-only cove successor. The former coast reservation remains untouched;
 * one bounded native32px atlas is appended after the frozen beach context. */
export const TROPICAL_COVE_ATLAS=Object.freeze({name:'tropical-cove-coast',image:'../assets/tilesets/original/tropical-cove-coast.png',columns:64,imagewidth:2048,maxImageHeight:1024});
function tropicalCoveAtlas(source:TiledMap,start:number):TiledTileset|undefined{
 const r=TROPICAL_COVE_ATLAS,sets=source.tilesets.filter(t=>t.image===r.image||t.name===r.name),beach=identities(source)[0]==='shipyard-beach';
 need(beach?sets.length===1:sets.length===0,'cove source atlas missing, duplicated or on another map');if(!beach)return;
 const set=sets[0];
 need(/^art-\d+$/.test(set.name??'')&&set.tilewidth===32&&set.tileheight===32&&!set.source&&(set.spacing??0)===0&&(set.margin??0)===0&&set.columns===r.columns&&set.imagewidth===r.imagewidth&&Number.isSafeInteger(set.imageheight)&&set.imageheight!>0&&set.imageheight!%32===0&&set.imageheight!<=r.maxImageHeight&&set.tilecount===set.imageheight!/32*r.columns&&Array.isArray(set.tiles)&&set.tiles.length>80&&set.tiles.every(t=>t.id%4===0&&t.animation?.length===4&&t.animation.every((f,i)=>f.tileid===t.id+i&&f.duration===520)),'cove source atlas identity/geometry leaves its registered reservation');
 return{...structuredClone(set),firstgid:start,name:r.name};
}
function roadsterV2Atlas(source:TiledMap,expected:TiledTileset[],start:number):TiledTileset|undefined{
 const sets=source.tilesets.filter(isRoadsterV2);need(sets.length<=1,'roadster-v2 source atlas duplicated');if(!sets.length)return undefined;
 const set=sets[0],r=ROADSTER_V2_ATLAS;
 need(set.tilewidth===32&&set.tileheight===32&&!set.source&&(set.spacing??0)===0&&(set.margin??0)===0&&set.columns===r.columns&&set.imagewidth===r.imagewidth&&Number.isSafeInteger(set.imageheight)&&set.imageheight!>0&&set.imageheight!%32===0&&set.imageheight!<=r.maxImageHeight&&set.tilecount===set.imageheight!/32*r.columns&&Array.isArray(set.tiles)&&set.tiles.length===r.carriers&&set.tiles.every(t=>Array.isArray(t.animation)&&t.animation.length>=2),'roadster-v2 atlas identity/geometry leaves its registered reservation');
 const index=expected.findIndex(t=>t.name===r.vacates.name&&t.image===r.vacates.image&&t.firstgid===r.vacates.firstgid&&t.tilecount===r.vacates.tilecount);
 need(index>=0,'roadster-v2 requires the registered roadster reservation to vacate');
 expected.splice(index,1);return{...structuredClone(set),firstgid:start};
}
const expoMarkByName=new Map(Object.entries(EXPO_MARKS).map(([file,mark])=>[mark.name,{...mark,image:`../assets/sponsors/${file}.png`}]));
const expoMarkImages=new Set([...expoMarkByName.values()].map(mark=>mark.image));
/** Expo family membership is decided by registered name/image identity only: a mark by its
 * registered name, or by its PNG when that PNG is not a registered pre-epoch atlas (the
 * arrival inlays), the sticker sheet by its PNG, and any overworld `standing-captions` role. */
function expoMember(set:TiledTileset,row:ContextRow,overworld:boolean):'mark'|'stickers'|'captions'|undefined{
 if(expoMarkByName.has(set.name??''))return'mark';
 if(expoMarkImages.has(set.image??'')&&!row.atlases.some(a=>a.name===set.name&&a.image===set.image))return'mark';
 if(set.image===EXPO_STICKER_ATLAS.image)return'stickers';
 if(set.name===EXPO_CAPTION_ATLAS.name&&(overworld||set.image===EXPO_CAPTION_ATLAS.image))return'captions';
 return undefined;
}
function expoAtlases(source:TiledMap,row:ContextRow,start:number):TiledTileset[]{
 const members=source.tilesets.filter(set=>expoMember(set,row,true)),seen=new Set<string>(),result:TiledTileset[]=[];let next=start;
 for(const set of members){
  const kind=expoMember(set,row,true)!,key=kind==='mark'?set.name!:kind;need(!seen.has(key),'expo source atlas duplicated: '+key);seen.add(key);
  need(set.tilewidth===32&&set.tileheight===32&&!set.source&&(set.spacing??0)===0&&(set.margin??0)===0,'expo source atlas grid changed: '+key);
  if(kind==='mark'){
   const mark=expoMarkByName.get(set.name!);
   need(mark&&set.image===mark.image&&set.columns===mark.columns&&set.tilecount===mark.columns*2&&set.imagewidth===mark.columns*32&&set.imageheight===64&&set.properties?.some(p=>p.name==='sponsorPanel'&&p.value===true)===true&&!set.tiles,'expo mark identity/geometry leaves its registered reservation: '+key);
   result.push({...structuredClone(set),firstgid:next});
  }else if(kind==='stickers'){
   need(/^art-\d+$/.test(set.name??'')&&set.columns===EXPO_STICKER_ATLAS.columns&&set.tilecount===EXPO_STICKER_ATLAS.tilecount&&set.imagewidth===EXPO_STICKER_ATLAS.imagewidth&&set.imageheight===EXPO_STICKER_ATLAS.imageheight&&!set.tiles,'expo sticker sheet identity/geometry changed');
   result.push({...structuredClone(set),firstgid:next,name:EXPO_STICKER_ATLAS.name});
  }else{
   need([source.tilesets.some(t=>t.image==='../'+VIBECODE_IMAGE)?'../'+VIBECODE_CAPTION_IMAGE:EXPO_CAPTION_ATLAS.image,'../'+EVENT_CAPTION_IMAGE].includes(set.image!)&&set.columns===EXPO_CAPTION_ATLAS.columns&&set.imagewidth===EXPO_CAPTION_ATLAS.imagewidth&&Number.isSafeInteger(set.imageheight)&&set.imageheight!>0&&set.imageheight!%32===0&&set.imageheight!<=EXPO_CAPTION_ATLAS.maxImageHeight&&set.tilecount===set.imageheight!/32*16&&!set.tiles&&set.properties?.some(p=>p.name==='captionAtlasSha256'&&/^[0-9a-f]{64}$/.test(String(p.value)))===true,'expo caption atlas identity/geometry leaves its registered reservation');
   result.push({...structuredClone(set),firstgid:next});
  }
  next+=set.tilecount!;
 }
 return result;
}
// Closed current decoration roster: a registered role atlas body is owned by its
// source producer (verified by the domain guards), never by the native candidate.
const roleNames=(id:string):string[]=>((contract.maps as Record<string,{name:string}[]>)[id]??[]).map(r=>r.name);
const identities=(map:TiledMap)=>map.properties?.filter(p=>p.name==='worldMapId').map(p=>String(p.value))??[];
// Domain identity comes from the independently declared current34 roster, not
// presence of a context DATA row or an art/animation marker on the input map.
const domain=Object.keys(WORLD_CATALOG).filter(id=>!id.startsWith('speaker-')&&id!=='solar-hall'&&id!=='lunar-hall').sort();

/** Exact independent pre-epoch reservations and protected native bodies. The
 * current source projection separately owns every tile layer and floorLayer.
 * WAM organizer entities/areas are outside this native ownership boundary. */
function context(actual:TiledMap,source:TiledMap):ContextRow|undefined{
 const actualIds=identities(actual),sourceIds=identities(source);
 if(![...actualIds,...sourceIds].some(id=>domain.includes(id)))return;
 need(registered.schema==='varcamp-native-ownership-context-v1','schema changed');
 need(domain.length===20&&isDeepStrictEqual(Object.keys(rows).sort(),domain),'closed twenty-map roster changed');
 need(actualIds.length===1&&sourceIds.length===1&&actualIds[0]===sourceIds[0]&&Object.hasOwn(rows,actualIds[0]),'current identity missing or contradictory');
 return rows[actualIds[0]];
}
function protectedContext(actual:TiledMap,row:ContextRow,author=false):void{
 const layers=actual.layers.filter(l=>l.type!=='tilelayer'&&l.name!=='floorLayer');
 const preceding=cafeArrivalProtectedLayers(identities(actual)[0],row.protectedLayers);
 const current=mazeGateProtectedLayers(identities(actual)[0],preceding);
 need(isDeepStrictEqual(layers,current)||(author&&[preceding,row.protectedLayers].some(prior=>isDeepStrictEqual(layers,prior))),'protected nonfloor layer bodies/roster changed');
 need(isDeepStrictEqual(actual.layers.filter(l=>l.type!=='tilelayer').map(l=>l.name),row.protectedNonfloorOrder),'protected nonfloor order changed');
}
/** Reviewed epochs on the overworld, each admitted only after every earlier one: the fleet is
 * mandatory, the expo family may be absent only together with the brand family. */
interface Epoch{expo:boolean;brand:boolean;roadsterV2:boolean}
const CURRENT:Epoch={expo:true,brand:true,roadsterV2:true},PRE_ROADSTER_V2:Epoch={expo:true,brand:true,roadsterV2:false},PRE_BRAND:Epoch={expo:true,brand:false,roadsterV2:false},PRE_EXPO:Epoch={expo:false,brand:false,roadsterV2:false};
function currentAtlases(row:ContextRow,source:TiledMap,epoch:Epoch=CURRENT,includeCove=true,includeZodiac=true,includeHall=true,includeArrival=true,includePatrol=true,includeFountain=true,includeLeo=true,includeBuildings=true):TiledTileset[]{
 source=eventAtlasContextSource(source);
 const retired=new Set(row.retired.map(t=>t.firstgid));
 const expected=structuredClone(row.atlases.filter(t=>!retired.has(t.firstgid)));
 let next=row.nextAtlasGid;
 // A registered role atlas keeps its exact historical GID reservation while its
 // body comes from the current source producer; it may never grow past it.
 for(const name of roleNames(identities(source)[0])){
  const index=expected.findIndex(t=>t.name===name);if(index<0)continue;
  const sets=source.tilesets.filter(t=>t.name===name);need(sets.length<=1,'source role atlas ambiguous: '+name);if(!sets.length)continue;// an omitted role keeps its registered body; the roster guards report it
  const set=sets[0],old=expected[index];
  if(isRoadsterV2(set))continue;// the roadster-v2 epoch below owns this role's placement
  need(set.image===old.image&&set.image!.startsWith('../assets/tilesets/original/')&&set.tilewidth===32&&set.tileheight===32&&set.imagewidth===512&&set.columns===16&&Number.isSafeInteger(set.imageheight)&&set.imageheight!>0&&set.imageheight!%32===0&&Number.isSafeInteger(set.tilecount)&&set.tilecount===set.imageheight!/32*16&&set.tilecount!<=old.tilecount!,'role source atlas identity/geometry leaves its registered reservation: '+name);
  expected[index]={...structuredClone(set),firstgid:old.firstgid};
 }
 for(const old of row.retired){
  // This exact historical interval is unavailable forever. The replacement's
  // semantic body comes from the current PNG/source builder, never a mutable
  // native atlas or its observed allocation maximum.
  need(old.protectedReferences.length===0&&old.ownedReferences.length>0,'retired historical ownership proof missing');
  const sets=source.tilesets.filter(t=>t.image===old.image);need(sets.length===1,'source replacement atlas missing/ambiguous');
  const set=sets[0];need(set.imagewidth===96&&set.imageheight===96&&set.columns===3&&set.tilecount===9&&set.tilewidth===32&&set.tileheight===32,'retired plant epoch cannot be a current replacement');
  expected.push({...structuredClone(set),name:old.name,firstgid:next});next+=set.tilecount!;
 }
 const fleet=source.tilesets.filter(set=>fleetNames.includes(set.name??''));
 if(identities(source)[0]==='overworld'){
  need(isDeepStrictEqual(fleet.map(set=>set.name),fleetNames),'closed plaza fleet source atlas roster/order changed');
  for(const set of fleet){
   need(set.image===`../assets/tilesets/original/${set.name}.png`&&set.tilewidth===32&&set.tileheight===32&&set.imagewidth===512&&set.columns===16&&Number.isSafeInteger(set.imageheight)&&set.imageheight!>0&&set.imageheight!%32===0&&Number.isSafeInteger(set.tilecount)&&set.tilecount===set.imageheight!/32*16&&set.tilecount!<=1024,'plaza fleet source atlas identity/geometry changed');
   expected.push({...structuredClone(set),firstgid:next});next+=set.tilecount!;
  }
  // Expo epoch: admitted only here, only after every fleet reservation; the brand assets only after it.
  const expo=expoAtlases(source,row,next);if(epoch.expo)expected.push(...expo);
  const brand=brandAtlases(source,next+expo.reduce((n,set)=>n+set.tilecount!,0));if(epoch.brand)expected.push(...brand);
  // Roadster-v2 epoch: admitted only here, only after every brand reservation; it vacates the v1 interval.
  const v2Start=next+[...expo,...brand].reduce((n,set)=>n+set.tilecount!,0),v2=roadsterV2Atlas(source,epoch.roadsterV2?expected:structuredClone(expected),v2Start);if(v2&&epoch.roadsterV2)expected.push(v2);
  const zodiac=zodiacExteriorAtlas(source,v2Start+(v2?.tilecount??0));if(zodiac&&includeZodiac&&epoch.roadsterV2)expected.push(zodiac);
  const hall=hallExteriorAtlas(source,v2Start+(v2?.tilecount??0)+(zodiac?.tilecount??0));if(hall){need(zodiac,'hall exteriors require the preceding zodiac reservation');if(includeHall&&includeZodiac&&epoch.roadsterV2)expected.push(hall);}
  const arrival=arrivalFloorAtlases(source,v2Start+(v2?.tilecount??0)+(zodiac?.tilecount??0)+(hall?.tilecount??0));if(arrival.length){need(hall,'arrival floor requires the preceding hall reservation');if(includeArrival&&includeHall&&includeZodiac&&epoch.roadsterV2)expected.push(...arrival);}
  const patrol=patrolAtlases(source,v2Start+(v2?.tilecount??0)+(zodiac?.tilecount??0)+(hall?.tilecount??0)+arrival.reduce((n,t)=>n+t.tilecount!,0));if(patrol.length){need(arrival.length===4,'patrols require the preceding arrival reservations');if(includePatrol&&includeArrival&&includeHall&&includeZodiac&&epoch.roadsterV2)expected.push(...patrol);}
  const fountain=fountainAtlases(source,v2Start+(v2?.tilecount??0)+(zodiac?.tilecount??0)+(hall?.tilecount??0)+[...arrival,...patrol].reduce((n,t)=>n+t.tilecount!,0));if(fountain.length){need(patrol.length===6,'fountain requires the preceding patrol reservations');if(includeFountain&&includePatrol&&includeArrival&&includeHall&&includeZodiac&&epoch.roadsterV2)expected.push(...fountain);}
  const lions=source.tilesets.filter(t=>t.image==='../'+LEO_LION_IMAGE||t.name==='leo-lion-head');need(lions.length<=1,'Leo ornament atlas duplicated');
  if(lions.length){const t=lions[0];need(fountain.length===2,'Leo ornament requires the preceding fountain reservations');need(/^art-\d+$/.test(t.name??'')&&t.image==='../'+LEO_LION_IMAGE&&t.tilewidth===32&&t.tileheight===32&&!t.source&&(t.spacing??0)===0&&(t.margin??0)===0&&t.columns===4&&t.imagewidth===128&&t.imageheight===96&&t.tilecount===12&&!t.tiles,'Leo ornament atlas identity/geometry changed');
   if(includeLeo&&includeFountain&&includePatrol&&includeArrival&&includeHall&&includeZodiac&&epoch.roadsterV2)expected.push({...structuredClone(t),name:'leo-lion-head',firstgid:v2Start+(v2?.tilecount??0)+(zodiac?.tilecount??0)+(hall?.tilecount??0)+[...arrival,...patrol,...fountain].reduce((n,s)=>n+s.tilecount!,0)});
  }
  const buildings=source.tilesets.filter(t=>HALL_BUILDING_ATLASES.some(r=>r.image===t.image||r.name===t.name));
  if(buildings.length){need(lions.length===1&&buildings.length===2,'two hall/ground-name atlases require the preceding Leo ornament');let at=v2Start+(v2?.tilecount??0)+(zodiac?.tilecount??0)+(hall?.tilecount??0)+[...arrival,...patrol,...fountain,...lions].reduce((n,t)=>n+t.tilecount!,0);
   for(const r of HALL_BUILDING_ATLASES){const matches=buildings.filter(t=>t.image===r.image||t.name===r.name);need(matches.length===1,'hall/ground-name atlas missing or duplicated');const t=matches[0];
    need(/^art-\d+$/.test(t.name??'')&&t.image===r.image&&t.tilewidth===32&&t.tileheight===32&&!t.source&&(t.spacing??0)===0&&(t.margin??0)===0&&t.columns===r.columns&&t.imagewidth===r.imagewidth&&t.imageheight===r.imageheight&&t.tilecount===r.tilecount&&!t.tiles,'hall/ground-name atlas geometry changed');
    if(includeBuildings&&includeLeo&&includeFountain&&includePatrol&&includeArrival&&includeHall&&includeZodiac&&epoch.roadsterV2)expected.push({...structuredClone(t),name:r.name,firstgid:at});at+=r.tilecount;
   }
  }
  const vibe=source.tilesets.filter(t=>t.image==='../'+VIBECODE_IMAGE||t.name==='Expo / Vibe Code Tours');
  need(vibe.length<=1,'Vibe Code sponsor atlas duplicated');
  if(vibe.length){const t=vibe[0];need(buildings.length===2&&t.name==='Expo / Vibe Code Tours'&&t.image==='../'+VIBECODE_IMAGE&&!t.source&&t.tilewidth===32&&t.tileheight===32&&t.columns===4&&t.tilecount===8&&t.imagewidth===128&&t.imageheight===64&&!t.tiles&&(t.margin??0)===0&&(t.spacing??0)===0&&t.properties?.some(p=>p.name==='sponsorPanel'&&p.value===true),'Vibe Code sponsor identity/geometry changed');
   if(includeBuildings&&includeLeo&&includeFountain&&includePatrol&&includeArrival&&includeHall&&includeZodiac&&epoch.roadsterV2)expected.push({...structuredClone(t),firstgid:Math.max(...expected.map(t=>t.firstgid+t.tilecount!))});
  }
 }else{need(fleet.length===0,'plaza fleet source atlas requires overworld identity');need(!source.tilesets.some(set=>expoMember(set,row,false)),'expo source atlas requires overworld identity');need(!source.tilesets.some(brandMember),'brand asset source atlas requires overworld identity');need(!source.tilesets.some(isRoadsterV2),'roadster-v2 source atlas requires overworld identity');}
 const cove=tropicalCoveAtlas(source,next);if(cove&&includeCove)expected.push(cove);
 expected.push(...cafeArrivalAtlases(identities(source)[0]),...mazeGateAtlases(identities(source)[0]));
 expected.push(...eventCounterAtlases(source,Math.max(...expected.map(t=>t.firstgid+t.tilecount!))));
 return expected;
}
/** Mandatory final current context: complete atlas roster/order/bodies/ranges,
 * including unused historical reservations and all protected native owners. */
export function assertNativeOwnershipContext(actual:TiledMap,source:TiledMap):void{
 const row=context(actual,source);if(!row)return;
 protectedContext(actual,row);
 need(isDeepStrictEqual(actual.tilesets,currentAtlases(row,source)),'historical atlas bodies/roster/reservations changed');
}
/** Explicit finite author migration. Only the exact independently registered
 * pre-epoch context or already-valid current context can enter a transaction.
 * The final current release gate never admits the pre-epoch representation. */
export function assertNativeAuthoringContext(actual:TiledMap,source:TiledMap):void{
 const row=context(actual,source);if(!row)return;
 protectedContext(actual,row,true);
 // Required current source closure is validated even for a genuine historical
 // native input; old reservations do not opt the new source family out.
 const expected=currentAtlases(row,source);
 if(isDeepStrictEqual(actual.tilesets,row.atlases))return;
 if(isDeepStrictEqual(actual.tilesets,expected))return;
 // Exact predecessor to the two native check-in furniture sheets.
 const counterCount=eventCounterAtlases(source,0).length;
 if(counterCount===3&&isDeepStrictEqual(actual.tilesets,expected.slice(0,-counterCount)))return;
 // Exact preceding maze/Court context, before its reviewed entry atlases.
 const mazeCount=mazeGateAtlases(identities(source)[0]).length;
 if(mazeCount&&isDeepStrictEqual(actual.tilesets,expected.slice(0,-mazeCount)))return;
 // Exact preceding café context, before the two reviewed decorative atlases.
 if(identities(source)[0]==='moon-cafe'&&isDeepStrictEqual(actual.tilesets,expected.slice(0,-2)))return;
 // Exact previous Leo release, before the two building/ground-name reservations.
 if(identities(source)[0]==='overworld'&&isDeepStrictEqual(actual.tilesets,currentAtlases(row,source,CURRENT,true,true,true,true,true,true,true,false)))return;
 // Exact preceding fountain context, before the single Leo ornament reservation.
 if(identities(source)[0]==='overworld'&&isDeepStrictEqual(actual.tilesets,currentAtlases(row,source,CURRENT,true,true,true,true,true,true,false)))return;
 // Exact previous plaza context; final current validation requires the water components.
 if(identities(source)[0]==='overworld'&&isDeepStrictEqual(actual.tilesets,currentAtlases(row,source,CURRENT,true,true,true,true,true,false)))return;
 // Exact preceding arrival context; final current validation requires all six.
 if(identities(source)[0]==='overworld'&&isDeepStrictEqual(actual.tilesets,currentAtlases(row,source,CURRENT,true,true,true,true,false)))return;
 // Exact pre-arrival context only; this never weakens the final current gate.
 if(identities(source)[0]==='overworld'&&isDeepStrictEqual(actual.tilesets,currentAtlases(row,source,CURRENT,true,true,true,false)))return;
 // Exact immediately preceding hall context, then the genuine pre-zodiac context.
 if(identities(source)[0]==='overworld'&&isDeepStrictEqual(actual.tilesets,currentAtlases(row,source,CURRENT,true,true,false)))return;
 if(identities(source)[0]==='overworld'&&isDeepStrictEqual(actual.tilesets,currentAtlases(row,source,CURRENT,true,false,false)))return;
 // The exact immediately preceding beach context is a finite authoring input;
 // the final current gate above always requires the new cove reservation.
 if(identities(source)[0]==='shipyard-beach'&&isDeepStrictEqual(actual.tilesets,currentAtlases(row,source,CURRENT,false)))return;
 // Epoch entry: the exact pre-expo current context (every registered and fleet reservation,
 // no expo or brand member), the exact pre-brand context (the complete expo family, no
 // brand member) and the exact pre-roadster-v2 context (every brand reservation, the v1 roadster
 // interval still in place) are the only other admitted author inputs.
 need([PRE_ROADSTER_V2,PRE_BRAND,PRE_EXPO].some(epoch=>isDeepStrictEqual(actual.tilesets,currentAtlases(row,source,epoch))),'author input atlas ownership is neither exact registered nor current');
}
