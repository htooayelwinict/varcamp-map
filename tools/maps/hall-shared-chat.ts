import {isDeepStrictEqual} from 'node:util';
import contract from '../../world/hall-shared-chat.json';
import type {WamFile} from './types';

/** Share each ceremony's native chat while retaining all access/audio controls. */
export function withHallSharedChat(id:string,wam:WamFile):WamFile{
 const rows=(contract.maps as Record<string,typeof contract.maps['solar-hall']>)[id];
 if(!rows)return wam;
 const result=structuredClone(wam);
 for(const row of rows){
  const matches=result.areas.filter(a=>a.id===row.areaId);
  if(matches.length!==1)throw Error('Hall shared chat: missing or duplicate area '+row.areaId);
  const area=matches[0],owned=area.properties.filter(p=>p.id===row.property.id);
  if(Object.entries(row.geometry).some(([k,v])=>area[k as keyof typeof area]!==v)||owned.length!==1||typeof owned[0].chatEnabled!=='boolean'||!isDeepStrictEqual({...owned[0],chatEnabled:true},row.property))throw Error('Hall shared chat: unreviewed native controls or geometry');
  owned[0].chatEnabled=true;
 }
 return result;
}
