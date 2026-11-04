import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/arrival-hospitality.json';
import type {MapLayout,Placement} from './types';

const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Arrival hospitality: '+message);};
export const isArrivalHospitality=(l:MapLayout)=>l.id===data.mapId&&sha(l)===data.afterLayoutSha256;
function transform(input:MapLayout,forward:boolean):MapLayout{
 if(input.id!==data.mapId)return input;
 need(data.version===1&&sha(input)===(forward?data.beforeLayoutSha256:data.afterLayoutSha256),'unreviewed source layout');
 const l=structuredClone(input);
 if(forward){
  for(const r of data.removed)need(isDeepStrictEqual(l.placements[r.index],r.value),'retired furnishing changed');
  const removed=new Set(data.removed.map(r=>r.index));l.placements=l.placements.filter((_,i)=>!removed.has(i));
  l.placements.push(...structuredClone(data.added) as Placement[]);
 }else{
  need(isDeepStrictEqual(l.placements.slice(-data.added.length),data.added),'reviewed furnishings changed');
  l.placements.splice(-data.added.length);
  for(const r of [...data.removed].sort((a,b)=>a.index-b.index))l.placements.splice(r.index,0,structuredClone(r.value) as Placement);
 }
 need(sha(l)===(forward?data.afterLayoutSha256:data.beforeLayoutSha256),'unexpected source delta');return l;
}
export const applyArrivalHospitality=(l:MapLayout)=>transform(l,true);
export const restoreArrivalHospitality=(l:MapLayout)=>transform(l,false);
