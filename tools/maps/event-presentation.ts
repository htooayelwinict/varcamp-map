import {applyArrivalHospitality,isArrivalHospitality,restoreArrivalHospitality} from './arrival-hospitality';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/event-presentation.json';
import type {MapLayout,LayoutImage,Placement} from './types';
import {applyCheckInPhysics,restoreCheckInPhysics,isCheckInPhysics} from './check-in-physics';
import {applySpeakerCommunity,restoreSpeakerCommunity,isSpeakerCommunity} from './speaker-community';
import {applyAudienceFootprints,restoreAudienceFootprints,isAudienceFootprints} from './audience-footprints';
import {applyRoomRefinement,restoreRoomRefinement,isRoomRefinement} from './room-refinement';
import {applyAuditoriumSpacing,restoreAuditoriumSpacing,isAuditoriumSpacing} from './auditorium-spacing';
import {applyStageSideAccess,isStageSideAccess,restoreStageSideAccess} from './stage-side-access';
import {applySpeakerOfficeWings,isSpeakerOfficeWings,restoreSpeakerOfficeWings} from './speaker-office-wings';
import {applyLeoCitadel,isLeoCitadel,restoreLeoCitadel} from './leo-citadel';
import {applyCancerCitadel,isCancerCitadel,restoreCancerCitadel} from './cancer-citadel';
import {applyHornedCitadels,isHornedCitadels,restoreHornedCitadels} from './horned-citadels';
import {applyOuterSecurity,isOuterSecurity,restoreOuterSecurity} from './outer-security';
import {applyRoadsterPhysics,isRoadsterPhysics,restoreRoadsterPhysics} from './roadster-physics';
type Row={beforeLayoutSha256:string;afterLayoutSha256:string;changes:{placements:{removed:{index:number;value:Placement}[];added:Placement[]};images?:{before:LayoutImage[];after:LayoutImage[]};[field:string]:unknown}};
const rows=data.maps as unknown as Record<string,Row>;
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Event presentation: '+message);};
export const EVENT_MAP_IDS=Object.keys(rows);
export function isEventPresentation(l:MapLayout):boolean{return isArrivalHospitality(l)||isRoadsterPhysics(l)||isOuterSecurity(l)||isHornedCitadels(l)||isCancerCitadel(l)||isLeoCitadel(l)||isSpeakerOfficeWings(l)||isStageSideAccess(l)||isAuditoriumSpacing(l)||isRoomRefinement(l)||isAudienceFootprints(l)||(l.id.startsWith('speaker-')?isSpeakerCommunity(l):rows[l.id]?.afterLayoutSha256===sha(l)||isCheckInPhysics(l));}
export function transformEventPresentation(input:MapLayout,forward:boolean):MapLayout{
 if(!forward&&isArrivalHospitality(input))input=restoreArrivalHospitality(input);
 if(!forward&&isRoadsterPhysics(input))input=restoreRoadsterPhysics(input);
 if(!forward&&isOuterSecurity(input))input=restoreOuterSecurity(input);
 if(!forward&&isHornedCitadels(input))input=restoreHornedCitadels(input);
 if(!forward&&isCancerCitadel(input))input=restoreCancerCitadel(input);
 if(!forward&&isLeoCitadel(input))input=restoreLeoCitadel(input);
 if(!forward&&isSpeakerOfficeWings(input))input=restoreSpeakerOfficeWings(input);
 if(!forward&&isStageSideAccess(input))input=restoreStageSideAccess(input);
 if(!forward&&isAuditoriumSpacing(input))input=restoreAuditoriumSpacing(input);
 if(!forward&&isRoomRefinement(input))input=restoreRoomRefinement(input);
 if(!forward&&isAudienceFootprints(input))input=restoreAudienceFootprints(input);
 if(!forward&&isCheckInPhysics(input))input=restoreCheckInPhysics(input);
 if(!forward&&input.id.startsWith('speaker-')){
  need(isSpeakerCommunity(input),'unreviewed source layout: '+input.id);
  input=restoreSpeakerCommunity(input);
 }
 const row=rows[input.id];need(data.version===1&&row,'unknown map');
 need(sha(input)===(forward?row.beforeLayoutSha256:row.afterLayoutSha256),'unreviewed source layout: '+input.id);
 const l=structuredClone(input),p=row.changes.placements;
 if(forward){
  for(const r of p.removed)need(isDeepStrictEqual(l.placements[r.index],r.value),'retired furnishing changed');
  const ids=new Set(p.removed.map(r=>r.index));l.placements=l.placements.filter((_,i)=>!ids.has(i));l.placements.push(...structuredClone(p.added));
 }else{
  if(p.added.length){need(isDeepStrictEqual(l.placements.slice(-p.added.length),p.added),'new furnishings changed');l.placements=l.placements.slice(0,-p.added.length);}
  for(const r of p.removed)l.placements.splice(r.index,0,structuredClone(r.value));
 }
 for(const[field,raw]of Object.entries(row.changes))if(field!=='placements'){
  const c=raw as{before:unknown;after:unknown};need(isDeepStrictEqual(l[field as keyof MapLayout],forward?c.before:c.after),'source field changed: '+field);
  Object.assign(l,{[field]:structuredClone(forward?c.after:c.before)});
 }
 need(sha(l)===(forward?row.afterLayoutSha256:row.beforeLayoutSha256),'transaction output changed');
 const presentation=forward?applyLeoCitadel(applySpeakerOfficeWings(applyStageSideAccess(applyAuditoriumSpacing(applyRoomRefinement(applyAudienceFootprints(l.id==='overworld'?applyCheckInPhysics(l):l.id.startsWith('speaker-')?applySpeakerCommunity(l):l)))))):l;
 return forward?applyArrivalHospitality(applyRoadsterPhysics(applyOuterSecurity(applyHornedCitadels(applyCancerCitadel(presentation))))):presentation;
}
export const applyEventPresentation=(l:MapLayout)=>transformEventPresentation(l,true);
export const restoreEventPresentation=(l:MapLayout)=>transformEventPresentation(l,false);
