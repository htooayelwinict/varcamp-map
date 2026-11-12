import {createHash} from 'node:crypto';
import data from '../../world/expo-roster.json';
import type {MapLayout,Placement} from './types';

const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const isExpoRoster=(l:MapLayout)=>l.id===data.mapId&&sha(l)===data.afterLayoutSha256;
/** One exact roster revision; unrelated source and controls cannot enter it. */
function transform(input:MapLayout,forward:boolean):MapLayout{
 if(input.id!==data.mapId)return input;
 if(data.version!==1||sha(input)!==(forward?data.beforeLayoutSha256:data.afterLayoutSha256))throw Error('Expo roster: unreviewed source layout');
 const l=structuredClone(input);
 if(forward){
  for(const c of data.changes)l.placements[c.index]=structuredClone(c.after) as Placement;
  const removed=new Set(data.removed.map(r=>r.index));l.placements=l.placements.filter((_,i)=>!removed.has(i));
  l.placements.push(...structuredClone(data.added) as Placement[]);
 }else{
  l.placements.splice(-data.added.length);
  for(const r of data.removed)l.placements.splice(r.index,0,structuredClone(r.value) as Placement);
  for(const c of data.changes)l.placements[c.index]=structuredClone(c.before) as Placement;
 }
 for(const[field,pair]of Object.entries(data.fields))Object.assign(l,{[field]:structuredClone(forward?pair.after:pair.before)});
 if(sha(l)!==(forward?data.afterLayoutSha256:data.beforeLayoutSha256))throw Error('Expo roster: unexpected source delta');
 return l;
}
export const applyExpoRoster=(l:MapLayout)=>transform(l,true);
export const restoreExpoRoster=(l:MapLayout)=>transform(l,false);
