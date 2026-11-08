import {isDeepStrictEqual} from 'node:util';
import contract from '../../world/organizer-meetings.json';
import offices from '../../world/speaker-office-wings.json';
import {SIGN_IDS} from '../../src/world/catalog';
import type {LayoutArea,WamFile,WamAreaProperty} from './types';

const rows=contract.maps as Record<string,{areaId:string;property:WamAreaProperty}>;
const officeRows=offices.maps as Record<string,{afterFunctional:{areas:LayoutArea[]}}>;
const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Organizer meeting: '+message);};

/** WAM control successor only. The frozen furniture/layout and its art receipts
 * remain the source for geometry; this contract adds the native meeting action. */
export function withOrganizerMeetings(id:string,wam:WamFile):WamFile{
 const row=rows[id];if(!row)return wam;
 need(contract.version===1&&isDeepStrictEqual(Object.keys(rows).sort(),SIGN_IDS.map(s=>'speaker-'+s).sort()),'closed room roster');
 const area=officeRows[id].afterFunctional.areas.find(a=>a.id===row.areaId);
 need(area&&area.properties.length===0,'known office predecessor');
 const result=structuredClone(wam),matches=result.areas.filter(a=>a.id===row.areaId);
 need(matches.length===1,'exactly one organizer area in '+id);
 const expected={id:area!.id,name:area!.name,visible:true,x:area!.x*32,y:area!.y*32,width:area!.width*32,height:area!.height*32};
 for(const[key,value]of Object.entries(expected))need(isDeepStrictEqual(matches[0][key as keyof typeof matches[0]],value),'office boundary changed: '+id);
 need(isDeepStrictEqual(matches[0].properties,[])||isDeepStrictEqual(matches[0].properties,[row.property]),'unreviewed office controls: '+id);
 need(!result.areas.some(a=>a.id!==row.areaId&&a.properties.some(p=>p.id===row.property.id||(p.type==='livekitRoomProperty'&&p.roomName===row.property.roomName))),'duplicate meeting owner: '+id);
 matches[0].properties=[structuredClone(row.property)];
 return result;
}
