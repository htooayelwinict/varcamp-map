import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/sponsor-tiers.json';
import type {MapLayout,Placement} from './types';

const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(ok:unknown,why:string)=>{if(!ok)throw Error('Sponsor tiers: '+why);};
export const isSponsorTiers=(l:MapLayout)=>l.id===data.mapId&&sha(l)===data.afterLayoutSha256;

/** One reviewed source transition, reversible without touching arrival or meeting controls. */
function transform(input:MapLayout,forward:boolean):MapLayout{
 if(input.id!==data.mapId)return input;
 need(data.version===1&&sha(input)===(forward?data.beforeLayoutSha256:data.afterLayoutSha256),'unreviewed source layout');
 const l=structuredClone(input);
 if(forward){
  for(const r of data.removed)need(isDeepStrictEqual(l.placements[r.index],r.value),'retired furnishing changed');
  const indices=new Set(data.removed.map(r=>r.index));l.placements=l.placements.filter((_,i)=>!indices.has(i));
  l.placements.push(...structuredClone(data.added) as Placement[]);
 }else{
  need(isDeepStrictEqual(l.placements.slice(-data.added.length),data.added),'reviewed furnishings changed');
  l.placements.splice(-data.added.length);
  for(const r of data.removed)l.placements.splice(r.index,0,structuredClone(r.value) as Placement);
 }
 for(const [field,change]of Object.entries(data.fields))Object.assign(l,{[field]:structuredClone(forward?change.after:change.before)});
 need(sha(l)===(forward?data.afterLayoutSha256:data.beforeLayoutSha256),'unexpected source delta');return l;
}
export const applySponsorTiers=(l:MapLayout)=>transform(l,true);
export const restoreSponsorTiers=(l:MapLayout)=>transform(l,false);
