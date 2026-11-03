import {restoreOuterSecurity} from './outer-security';
import {restoreHornedCitadels} from './horned-citadels';
import {applyVibeCodeBranding,restoreVibeCodeBranding} from './vibecode-branding';
import {applyCheckInCounter,restoreCheckInCounter} from './check-in-definition';
import {applyEventPresentation,restoreEventPresentation} from './event-presentation';
import {assertCheckInPhysicsCatalog} from './check-in-physics';
import {assertAudienceFootprintCatalog} from './audience-footprints';
import {restoreLeoCitadel} from './leo-citadel';
import {restoreCancerCitadel} from './cancer-citadel';
import {applyPlazaLandscape,restorePlazaLandscape} from './plaza-landscape';
import {applyPlazaPatrol,restorePlazaPatrol} from './plaza-patrol';
import {applyExpoSpacing,restoreExpoSpacing} from './expo-spacing';
import {applyFountainMotion,restoreFountainMotion} from './fountain-motion';
import {applyLeoLionHead,restoreLeoLionHead,assertLeoLionHead} from './leo-lion-head';
import {applyHallBuildings,restoreHallBuildings,assertHallBuildings} from './hall-buildings';
import {applyPlazaCrescent,restorePlazaCrescent} from './plaza-crescent';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {buildMap} from './builder';
import {assertNativeSourceProjection} from './native-projection';
import {plazaGardenSprites} from '../art/plaza-garden';
import {plazaBuildingSprites,plazaGrassSprites} from '../art/plaza-buildings';
import {zodiacEmblemSprites} from '../art/plaza-generated';
import {plazaPotSprites} from '../art/plaza-pots';
import {refinePlazaFloorGarden} from './plaza-floor-garden';
import {applyZodiacExteriors,assertZodiacExteriors} from './zodiac-exteriors';
import {applyHallExteriors,assertHallExteriors} from './hall-exteriors';
import {applyZodiacPhysics,restoreZodiacPhysics,assertZodiacPhysics} from './zodiac-physics';
import {applyArrivalRefresh,restoreArrivalRefresh,assertArrivalRefresh} from './arrival-refresh';
import type {TileCatalog} from '../art/catalog';
import type {MapLayout,TiledMap,TiledTileset,TileLayer} from './types';
import contract from '../../world/plaza-floor-garden-native.json';
/** Closed forward transaction. Existing semantic layers, atlas GIDs and WAM editing data are retained. */
export function refineNativePlaza(raw:string,layout:MapLayout,catalog:TileCatalog):TiledMap{
 if(createHash('sha256').update(raw).digest('hex')!==contract.beforeNativeSha256)throw Error('Plaza native baseline changed; reassess source delta');
 if(layout.id!=='overworld'||layout.width!==128||layout.height!==128)throw Error('Closed 128² plaza source required');
 const original=JSON.parse(raw) as TiledMap,output=structuredClone(original),intended=buildMap(layout,catalog).tmj;
 let nextGid=Math.max(...output.tilesets.map(t=>t.firstgid+(t.tilecount??0))),nextLayer=Math.max(output.nextlayerid??1,...output.layers.map(l=>l.id+1));
 const mapping=new Map<TiledTileset,TiledTileset>();
 for(const t of intended.tilesets){
  const matches=output.tilesets.filter(s=>t.name==='navigation-mask'?s.name===t.name:s.name!=='navigation-mask'&&s.image===t.image);
  if(matches.length>1)throw Error(`Ambiguous plaza native atlas ${t.image}`);
  let target=matches[0];
  if(target){for(const k of ['tilewidth','tileheight','columns','tilecount','imagewidth','imageheight'] as const)if(target[k]!==t[k])throw Error(`Plaza old atlas geometry changed: ${t.image}`);if(t.name==='navigation-mask'&&!isDeepStrictEqual(t.tiles,target.tiles))throw Error('Plaza collision atlas properties changed');}
  else {if(!t.image?.startsWith('../assets/tilesets/original/plaza-')&&!t.image?.endsWith('/zodiac-emblems.png')&&t.image!=='../assets/sponsors/varcamp-2026.png'&&!t.name?.startsWith('plaza-drone-'))throw Error(`Undeclared plaza atlas addition ${t.image}`);
   const name=t.name?.startsWith('art-')?'plaza-'+t.image!.split('/').at(-1)!.replace(/\.png$/,''):t.name;
   if(output.tilesets.some(s=>s.name===name))throw Error(`Plaza engine atlas name already reserved: ${name}`);
   target={...structuredClone(t),firstgid:nextGid,name};nextGid+=t.tilecount!;output.tilesets.push(target);}
  mapping.set(t,target);
 }
 const remap=(gid:number)=>{if(!gid)return 0;const plain=(gid&0x0fffffff)>>>0,t=intended.tilesets.find(t=>plain>=t.firstgid&&plain<t.firstgid+t.tilecount!);if(!t)throw Error('Unbound plaza source GID');return((mapping.get(t)!.firstgid+plain-t.firstgid)|(gid&0xf0000000))>>>0;};
 const images=new Set(layout.images?.map(p=>p.name)),owned=(name:string)=>/^scenery-(belowAvatar|aboveAvatar)-\d+$/.test(name)||images.has(name)||name.startsWith('plaza-drone-');
 const copy=(layer:TileLayer)=>{const prior=original.layers.find(l=>l.name===layer.name),result={...structuredClone(layer),id:prior?.id??nextLayer++,data:layer.data.map(remap)};return result;};
 for(const name of ['terrain','physical-collisions']){const native=output.layers.find(l=>l.name===name),wanted=intended.layers.find(l=>l.name===name);if(native?.type!=='tilelayer'||wanted?.type!=='tilelayer')throw Error(`Missing plaza ${name}`);native.data=wanted.data.map(remap);}
 output.layers=output.layers.filter(l=>!owned(l.name));
 const floor=output.layers.findIndex(l=>l.name==='floorLayer');if(floor<0)throw Error('Plaza avatar floor missing');
 const split=intended.layers.findIndex(l=>l.name==='floorLayer');
 const before=intended.layers.filter((l,i)=>i<split&&owned(l.name)),after=intended.layers.filter((l,i)=>i>split&&owned(l.name));
 if([...before,...after].some(l=>l.type!=='tilelayer'))throw Error('Plaza visual export must use native tile layers');
 output.layers.splice(floor,0,...(before as TileLayer[]).map(copy));output.layers.push(...(after as TileLayer[]).map(copy));output.nextlayerid=nextLayer;
 for(const prior of original.layers.filter(l=>!owned(l.name)&&!['terrain','physical-collisions'].includes(l.name)))if(!isDeepStrictEqual(output.layers.find(l=>l.id===prior.id),prior))throw Error(`Protected plaza native layer changed: ${prior.name}`);
 if(!isDeepStrictEqual(output.properties,original.properties))throw Error('Plaza properties changed');
 return output;
}
/** A source-presence-independent production gate for the current plaza, including native GID/depth semantics. */
export function assertNativePlaza(map:TiledMap,layout:MapLayout,catalog:TileCatalog):void{
 const identity=map.properties?.filter(p=>p.name==='worldMapId')??[];
 if(layout.id!=='overworld'&&!identity.some(p=>p.value==='overworld')&&!map.tilesets.some(t=>t.image?.endsWith('/plaza-buildings.png')||t.name?.startsWith('plaza-drone-')))return;
 const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Plaza '+message);};
 need(layout.id==='overworld'&&identity.length===1&&identity[0].type==='string'&&identity[0].value==='overworld'&&map.width===128&&map.height===128,'current map/layout identity changed');
 assertCheckInPhysicsCatalog(catalog);
 assertAudienceFootprintCatalog(catalog);
 restoreLeoCitadel(restoreCancerCitadel(restoreHornedCitadels(restoreOuterSecurity(layout),catalog),catalog),catalog);
 const beforeEvent=restoreEventPresentation(layout);
 const priorCrescent=restorePlazaCrescent(restorePlazaLandscape(restoreVibeCodeBranding(restoreCheckInCounter(beforeEvent))));
 assertHallBuildings(priorCrescent,catalog);
 const priorBuildings=restoreHallBuildings(priorCrescent);
 assertZodiacPhysics(priorBuildings,catalog);
 assertHallExteriors(priorBuildings,catalog);
 assertLeoLionHead(priorBuildings,catalog);
 const priorPatrol=restorePlazaPatrol(restoreExpoSpacing(restoreFountainMotion(restoreLeoLionHead(priorBuildings))));
 assertArrivalRefresh(priorPatrol);
 const priorArrival=restoreArrivalRefresh(priorPatrol);
 const priorPhysics=restoreZodiacPhysics(priorArrival);
 assertZodiacExteriors(priorPhysics,catalog);
 assertHallExteriors(priorBuildings,catalog);
 need(isDeepStrictEqual(applyEventPresentation(applyCheckInCounter(applyVibeCodeBranding(applyPlazaLandscape(applyPlazaCrescent(applyHallBuildings(applyLeoLionHead(applyFountainMotion(applyExpoSpacing(applyPlazaPatrol(applyArrivalRefresh(applyZodiacPhysics(applyHallExteriors(applyZodiacExteriors(refinePlazaFloorGarden(priorPhysics))))))))))))))),layout),'current source artwork/identity roster changed');
 for(const [id,s] of Object.entries({...plazaGardenSprites(),...plazaBuildingSprites(),...plazaGrassSprites(),...plazaPotSprites(),...zodiacEmblemSprites()}))need(isDeepStrictEqual(catalog[id],s),`original artwork depth/footprint definition changed: ${id}`);
 const intended=buildMap(layout,catalog).tmj;assertNativeSourceProjection(map,intended);
}
