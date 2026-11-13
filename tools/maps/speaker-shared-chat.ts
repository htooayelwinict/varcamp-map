import {isDeepStrictEqual} from 'node:util';
import contract from '../../world/speaker-shared-chat.json';
import {withAriesSharedChat} from './aries-shared-chat';
import type {WamFile} from './types';

/** Extend the proven Aries chat to the other eleven native presentations. */
export function withSpeakerSharedChat(id:string,wam:WamFile):WamFile{
 const rows=(contract.maps as Record<string,typeof contract.maps['speaker-taurus']>)[id];
 if(!rows)return withAriesSharedChat(id,wam);
 const result=structuredClone(wam);
 for(const row of rows){
  const matches=result.areas.filter(a=>a.id===row.areaId);
  if(matches.length!==1)throw Error('Speaker shared chat: missing or duplicate area '+row.areaId);
  const area=matches[0],owned=area.properties.filter(p=>p.id===row.property.id);
  if(Object.entries(row.geometry).some(([k,v])=>area[k as keyof typeof area]!==v)||owned.length!==1||typeof owned[0].chatEnabled!=='boolean'||!isDeepStrictEqual({...owned[0],chatEnabled:true},row.property))throw Error('Speaker shared chat: unreviewed native controls or geometry');
  owned[0].chatEnabled=true;
 }
 return result;
}
