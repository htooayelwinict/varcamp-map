import {isDeepStrictEqual} from 'node:util';
import contract from '../../world/aries-shared-chat.json';
import type {WamFile} from './types';

/** A WAM-only successor: keep the established native geometry and audio controls. */
export function withAriesSharedChat(id:string,wam:WamFile):WamFile{
 if(id!=='speaker-aries')return wam;
 const result=structuredClone(wam);
 for(const row of contract.areas){
  const matches=result.areas.filter(a=>a.id===row.areaId);
  if(matches.length!==1)throw Error('Aries shared chat: missing or duplicate area '+row.areaId);
  const area=matches[0],owned=area.properties.filter(p=>p.id===row.property.id);
  if(Object.entries(row.geometry).some(([k,v])=>area[k as keyof typeof area]!==v)||owned.length!==1||typeof owned[0].chatEnabled!=='boolean'||!isDeepStrictEqual({...owned[0],chatEnabled:true},row.property))throw Error('Aries shared chat: unreviewed native controls or geometry');
  owned[0].chatEnabled=true;
 }
 return result;
}
