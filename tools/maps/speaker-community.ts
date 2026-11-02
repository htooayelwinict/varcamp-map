import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/speaker-community-banners.json';
import type {MapLayout,LayoutImage,Placement,LayoutSign} from './types';

type Row={beforeLayoutSha256:string;afterLayoutSha256:string;beforeImages:LayoutImage[];afterImages:LayoutImage[];removedPlacements:{index:number;value:Placement}[];removedSigns:{index:number;value:LayoutSign}[]};
const rows=data.maps as Record<string,Row>;
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Speaker community banners: '+message);};
export const SPEAKER_COMMUNITY_MAP_IDS=Object.keys(rows);
export const isSpeakerCommunity=(layout:MapLayout)=>rows[layout.id]?.afterLayoutSha256===sha(layout);

/** Remove community artwork only from zodiac rooms; retain their VarCamp mark. */
function transform(layout:MapLayout,forward:boolean):MapLayout{
 const row=rows[layout.id];need(data.version===1&&row,'unknown speaker room');
 need(sha(layout)===(forward?row.beforeLayoutSha256:row.afterLayoutSha256),'unreviewed source layout');
 need(isDeepStrictEqual(layout.images,forward?row.beforeImages:row.afterImages),'wall artwork changed');
 const result=structuredClone(layout);
 result.images=structuredClone(forward?row.afterImages:row.beforeImages);
 if(forward){
  for(const r of row.removedPlacements)need(isDeepStrictEqual(result.placements[r.index],r.value),'community panel changed');
  for(const r of row.removedSigns)need(isDeepStrictEqual(result.signs![r.index],r.value),'community heading changed');
  result.placements=result.placements.filter((_,i)=>!row.removedPlacements.some(r=>r.index===i));
  result.signs=result.signs!.filter((_,i)=>!row.removedSigns.some(r=>r.index===i));
 }else{
  for(const r of row.removedPlacements)result.placements.splice(r.index,0,structuredClone(r.value));
  for(const r of row.removedSigns)result.signs!.splice(r.index,0,structuredClone(r.value));
 }
 need(sha(result)===(forward?row.afterLayoutSha256:row.beforeLayoutSha256),'unexpected source delta');
 return result;
}
export const applySpeakerCommunity=(layout:MapLayout)=>transform(layout,true);
export const restoreSpeakerCommunity=(layout:MapLayout)=>transform(layout,false);
