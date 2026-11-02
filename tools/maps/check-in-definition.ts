import {isDeepStrictEqual} from 'node:util';
import counter from '../../world/check-in-counter.json';
import type {MapLayout} from './types';

const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Check-in counter: '+message);};
const owned=(id:string)=>id.startsWith('check-in-counter-');

/** Four exact native furnishings; no entries, exits, images or WAM areas move. */
export function applyCheckInCounter(input:MapLayout):MapLayout{
 need(counter.version===1&&input.id===counter.mapId,'unsupported map or recipe');
 need(!input.placements.some(p=>owned(p.id)),'counter already exists');
 const result=structuredClone(input);
 result.placements.push(...structuredClone(counter.placements));
 return result;
}
export function restoreCheckInCounter(input:MapLayout):MapLayout{
 need(input.id===counter.mapId,'unsupported map');
 need(isDeepStrictEqual(input.placements.filter(p=>owned(p.id)),counter.placements),'missing or altered furnishings');
 const result=structuredClone(input);
 result.placements=result.placements.filter(p=>!owned(p.id));
 return result;
}
