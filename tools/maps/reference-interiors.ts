import {restoreVibeCodeBranding} from './vibecode-branding';
import {restoreEventPresentation} from './event-presentation';
import {assertRoomMaterials} from './room-refinement';
import {auditoriumFunctional,assertAuditoriumSpacing} from './auditorium-spacing';
import {restoreStageSideAccess} from './stage-side-access';
import{isDeepStrictEqual}from'node:util';
import{SIGN_IDS}from'../../src/world/catalog';
import contractData from'../../world/interior-reference-contract.json';
import{buildMap}from'./builder';
import{validateWam}from'./validate';
import{ariesPresentationFunctional,assertAriesPresentation}from'./aries-presentation';
import{assertHallPresentation}from'./hall-presentation';
import type{MapLayout,TiledMap,WamFile,TileRect,WamArea}from'./types';
import type{TileCatalog,Sprite}from'../art/catalog';
const IDS:readonly string[]=[...SIGN_IDS.map(s=>`speaker-${s}`),'solar-hall','lunar-hall'];
type RequiredPlacement={id:string;sprite:string;width:number;height:number;x?:number;y?:number};
type Row={functional:Pick<MapLayout,'width'|'height'|'entries'|'exits'|'areas'|'inspectionZones'>;requiredPlacements:RequiredPlacement[];requiredSeats:RequiredPlacement[];title:string;water:boolean};
const contract=contractData as unknown as{version:number;catalog:Record<string,Sprite>;maps:Record<string,Row>};
const need=(value:unknown,message:string):void=>{if(!value)throw Error('Interior '+message);};
/** Existing author representation shared by explicit export and current acceptance. */
export function renderReferenceInterior(layout:MapLayout,catalog:TileCatalog){
 const result=buildMap(layout,catalog);
 for(const layer of result.tmj.layers)if(layer.type==='objectgroup')for(const object of layer.objects)if(object.name==='scene-title')object.text={...(object.text as object),bold:true};
 // Native TMJ is a JSON value: the author serializer omits undefined optional fields.
 return{tmj:JSON.parse(JSON.stringify(result.tmj))as TiledMap,wam:result.wam};
}
/** Complete-package callers must first bind filename/native/layout/WAM identity.
 * This guard never writes and does not erase independent organizer WAM content. */
export function assertNativeReferenceInterior(map:TiledMap,layout:MapLayout,catalog:TileCatalog,sourceWam:WamFile):void{
 if(!IDS.includes(layout.id))return;
 assertRoomMaterials(catalog);
 assertAuditoriumSpacing(restoreStageSideAccess(layout),catalog);
 need(contract.version===1&&isDeepStrictEqual(Object.keys(contract.maps).sort(),IDS.slice().sort()),'contract must cover exactly the known fourteen rooms');
 const row=contract.maps[layout.id],functional=auditoriumFunctional(layout.id,ariesPresentationFunctional(layout.id,row.functional));
 const beforeEvent=restoreEventPresentation(layout);
 const beforeBrand=restoreVibeCodeBranding(beforeEvent);
 assertAriesPresentation(beforeBrand,catalog);
 for(const[key,value]of Object.entries(functional))need(isDeepStrictEqual(layout[key as keyof MapLayout],value),`${layout.id}: protected functional ${key} changed`);
 for(const[key,value]of Object.entries(contract.catalog))need(isDeepStrictEqual(catalog[key],value),`${layout.id}: required catalog/depth contract changed: ${key}`);
 for(const expected of [...row.requiredPlacements,...row.requiredSeats]){
  const found=beforeEvent.placements.filter(p=>p.id===expected.id);need(found.length===1&&Object.entries(expected).every(([key,value])=>isDeepStrictEqual(found[0][key as keyof typeof found[0]],value)),`${layout.id}: required furnishing/crest/seat ${expected.id} missing or changed`);
 }
 assertHallPresentation(beforeBrand,catalog);
 const titles=layout.signs?.filter(s=>s.name==='scene-title')??[];need(titles.length===1&&titles[0].text===row.title,`${layout.id}: bold English title source changed`);
 const configs=[{kind:'plant',placement:layout.placements.find(p=>p.sprite==='interior-ref-plant-motion-base'),width:3,height:2,step:750,phases:4},{kind:'steam',placement:layout.placements.find(p=>p.id==='interior-ref-tea-console'||p.id==='interior-ref-refreshments'),width:1,height:1,step:400,phases:6},{kind:'server',placement:layout.placements.find(p=>p.sprite==='interior-ref-server'),width:2,height:3,step:750,phases:4},...(row.water?[{kind:'water',placement:layout.placements.find(p=>p.sprite==='interior-ref-aquarium'),width:4,height:3,step:600,phases:4}]:[])];
 const overlays=layout.animatedOverlays??[];need(overlays.length===configs.length,`${layout.id}: required motion roster changed`);
 for(const config of configs){
  const found=overlays.filter(o=>o.name===`interior-ambient-${config.kind}`),p=config.placement;need(found.length===1&&p,`${layout.id}: motion source/family missing`);const o=found[0];
  need(o.level==='belowAvatar'&&o.sourceId==='interior-reference'&&o.image===`assets/tilesets/original/interior-motion-${config.kind}.png`&&o.x===p!.x&&o.y===p!.y&&o.width===config.width&&o.height===config.height&&o.provenance?.metadataPath===`art/source/interior-motion-${layout.id}-${config.kind}.json`,`${layout.id}: motion depth/footprint/source changed`);
  need(o.animations.length>0&&o.animations.every(a=>a.frames.length>0&&a.frames.every(f=>Number.isInteger(f.duration)&&f.duration>0&&f.duration%config.step===0)&&a.frames.reduce((n,f)=>n+f.duration,0)===config.step*config.phases)&&o.animations.some(a=>new Set(a.frames.map(f=>f.tileid)).size>=2),`${layout.id}: motion quiet clock or real painted phases changed`);
 }
 need(validateWam(sourceWam).length===0,`${layout.id}: saved WAM schema/control references changed`);
 const areas=new Set<string>(),names=new Set<string>(),properties=new Set<string>(),owners=new Set<string>();
 for(const area of sourceWam.areas){
  need(!areas.has(area.id)&&!names.has(area.name),`${layout.id}: duplicate saved WAM area identity/name`);areas.add(area.id);names.add(area.name);
  for(const property of area.properties){need(property.id.length>0&&!properties.has(property.id),`${layout.id}: duplicate saved WAM property ID`);properties.add(property.id);const owner=property.type==='livekitRoomProperty'?`meeting:${String(property.roomName)}`:property.type==='speakerMegaphone'?`speaker:${String(property.name)}`:undefined;if(owner){need(!owners.has(owner),`${layout.id}: duplicate saved WAM control owner`);owners.add(owner);}}
 }
 for(const area of functional.areas){
  const actual=sourceWam.areas.filter(a=>a.id===area.id);need(actual.length===1,`${layout.id}: required saved WAM area missing`);
  const expected={name:area.name,visible:true,x:area.x*32,y:area.y*32,width:area.width*32,height:area.height*32,properties:area.properties};
  for(const[key,value]of Object.entries(expected))need(isDeepStrictEqual(actual[0][key as keyof WamArea],value),`${layout.id}: required saved WAM area geometry/control changed`);
 }
 const expected=renderReferenceInterior(layout,catalog).tmj;need(isDeepStrictEqual(map,expected),`${layout.id}: saved native cells/depth/controls differ from authored source`);
 const masks=map.layers.filter(l=>l.name==='physical-collisions');need(masks.length===1&&masks[0].type==='tilelayer',`${layout.id}: native route mask missing`);if(masks[0].type!=='tilelayer')return;const blocked=masks[0].data;
 const cells=(r:TileRect)=>Array.from({length:r.width*r.height},(_,i)=>(r.y+Math.floor(i/r.width))*map.width+r.x+i%r.width);
 for(const entry of functional.entries){
  const start=entry.y*map.width+entry.x;need(!blocked[start],`${layout.id}: route entry blocked`);const seen=new Set<number>([start]),queue=[start];
  for(let head=0;head<queue.length;head++){const n=queue[head],x=n%map.width,y=Math.floor(n/map.width);for(const[nx,ny]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const next=ny*map.width+nx;if(nx<0||ny<0||nx>=map.width||ny>=map.height||blocked[next]||seen.has(next))continue;seen.add(next);queue.push(next);}}
  for(const target of [...functional.entries,...functional.exits,...functional.inspectionZones.filter(z=>/aisle|route/.test(z.name)),...functional.areas.filter(a=>a.id?.startsWith('beacon-'))])need(cells(target).every(c=>seen.has(c)&&!blocked[c]),`${layout.id}: protected route ${target.name} obstructed`);
  for(const area of functional.areas)need(cells(area).some(c=>seen.has(c)&&!blocked[c]),`${layout.id}: required area route inaccessible`);
  const doors=new Set(layout.placements.filter(p=>p.sprite==='door-open').flatMap(cells));for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)if(x===0||y===0||x===map.width-1||y===map.height-1)need(!seen.has(y*map.width+x)||doors.has(y*map.width+x),`${layout.id}: route leaks through a boundary wall`);
  if(layout.id==='solar-hall'||layout.id==='lunar-hall'){const wallX=layout.id==='solar-hall'?13:50,doorX=layout.id==='solar-hall'?7:55;for(let y=6;y<16;y++)need(blocked[y*map.width+wallX]>0,`${layout.id}: staff side-wall route opened`);for(let y=16;y<18;y++)for(let x=doorX;x<doorX+2;x++)need(seen.has(y*map.width+x)&&!blocked[y*map.width+x],`${layout.id}: staff doorway route blocked`);}
 }
}
