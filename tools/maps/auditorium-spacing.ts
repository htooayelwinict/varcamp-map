import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/auditorium-spacing.json';
import {SIGN_IDS} from '../../src/world/catalog';
import type {MapLayout,TileRect} from './types';
import type {TileCatalog} from '../art/catalog';

type Functional=Pick<MapLayout,'width'|'height'|'entries'|'exits'|'areas'|'inspectionZones'>;
type Row={beforeLayoutSha256:string;afterLayoutSha256:string;beforeFunctional:Functional;afterFunctional:Functional;fields:Record<string,{before:unknown;after:unknown}>};
const rows=data.maps as unknown as Record<string,Row>;
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(v:unknown,s:string)=>{if(!v)throw Error('Auditorium spacing: '+s);};
const ids=SIGN_IDS.map(s=>'speaker-'+s);
const rect=(a:TileRect)=>({x:a.x,y:a.y,width:a.width,height:a.height});

export const isAuditoriumSpacing=(l:MapLayout)=>rows[l.id]?.afterLayoutSha256===sha(l);
function transform(input:MapLayout,forward:boolean):MapLayout{
 const row=rows[input.id];if(!row)return structuredClone(input);
 need(data.version===1,'recipe version');
 need(isDeepStrictEqual(Object.keys(rows).sort(),[...ids,'solar-hall','lunar-hall'].sort()),'closed twelve-room and two provenance-only hall roster');
 need(sha(input)===(forward?row.beforeLayoutSha256:row.afterLayoutSha256),'unreviewed source '+input.id);
 const result=structuredClone(input);
 for(const[field,change]of Object.entries(row.fields)){
  const allowed=ids.includes(input.id)?['height','placements','entries','exits','areas','inspectionZones','signs','animatedOverlays']:['animatedOverlays'];
  need(allowed.includes(field),'unowned field '+field);
  need(isDeepStrictEqual(input[field as keyof MapLayout],forward?change.before:change.after),'field baseline '+field);
  Object.assign(result,{[field]:structuredClone(forward?change.after:change.before)});
 }
 need(sha(result)===(forward?row.afterLayoutSha256:row.beforeLayoutSha256),'transaction output');
 return result;
}
export const applyAuditoriumSpacing=(l:MapLayout)=>transform(l,true);
export const restoreAuditoriumSpacing=(l:MapLayout)=>transform(l,false);

/** Only coordinates/dimensions change. Existing controls, IDs and portal names
 * remain the same; the separate publisher migrates fresh saved WAM geometry. */
export function auditoriumFunctional(id:string,before:Functional):Functional{
 const row=rows[id];if(!row)return before;
 need(isDeepStrictEqual(before,row.beforeFunctional),'functional predecessor '+id);
 const after=structuredClone(row.afterFunctional);
 if(!ids.includes(id)){need(isDeepStrictEqual(after,before),'hall function changed');return after;}
 need(after.width===before.width&&after.height===before.height+10,'room expansion');
 need(after.areas.length===before.areas.length,'area roster');
 for(const old of before.areas){
  const next=after.areas.find(a=>a.id===old.id);need(next,'missing area');if(!next)continue;
  const clean=(a:unknown)=>Object.fromEntries(Object.entries(a as object).filter(([key])=>!['x','y','width','height'].includes(key)));
  need(isDeepStrictEqual(clean(next),clean(old)),'saved controls changed '+old.id);
 }
 const sign=id.slice(8),stage=after.areas.find(a=>a.id==='meeting-'+sign)!,audience=after.areas.find(a=>a.id===sign+'-audience')!,beacon=after.areas.find(a=>a.id==='beacon-'+sign)!;
 need(isDeepStrictEqual(rect(stage),{x:5,y:5,width:before.width-10,height:7}),'stage bounds');
 need(isDeepStrictEqual(rect(audience),{x:2,y:16,width:before.width-4,height:18}),'audience bounds');
 const oldBeacon=before.areas.find(a=>a.id===beacon.id)!;need(isDeepStrictEqual(rect(beacon),{...rect(oldBeacon),y:oldBeacon.y+10}),'beacon translation');
 for(const field of ['entries','exits'] as const)need(isDeepStrictEqual(after[field],before[field].map(e=>({...e,y:e.y+10}))),'portal translation '+field);
 return after;
}

export function assertAuditoriumSpacing(layout:MapLayout,catalog:TileCatalog):void{
 if(!ids.includes(layout.id))return;
 need(isAuditoriumSpacing(layout),'current source must carry the complete room revision');
 for(const[id,sprite]of Object.entries(data.aliases))need(isDeepStrictEqual(catalog[id],sprite),'stage tile declaration '+id);
 const audience=layout.areas.find(a=>a.id===layout.id.slice(8)+'-audience')!;
 const chairs=layout.placements.filter(p=>p.id.startsWith('audience-chair-'));
 need(chairs.length===48&&isDeepStrictEqual([...new Set(chairs.map(p=>p.y))].sort((a,b)=>a-b),[18,22,26,30]),'four spacious rows / 48 chairs');
 need(chairs.every(p=>p.x>audience.x&&p.x+p.width<audience.x+audience.width&&p.y>=audience.y+2&&p.y+p.height<audience.y+audience.height-1),'chairs must leave circulation space inside listeners');
 const byId=(id:string)=>layout.placements.find(p=>p.id===id)!;
 need(isDeepStrictEqual(rect(byId('audience-boundary-floor')),rect(audience)),'visible listening boundary');
 need(isDeepStrictEqual(rect(byId('front-crossing')),{x:2,y:14,width:layout.width-4,height:2}),'clear stage/audience separation');
 need(isDeepStrictEqual(rect(byId('auditorium-stage-steps')),{x:layout.width/2-2,y:12,width:4,height:2}),'central stage steps');
 const stage=layout.areas.find(a=>a.id==='meeting-'+layout.id.slice(8))!;
 need(stage.y+stage.height<=12&&audience.y===16,'speaker and audience overlap');
}
