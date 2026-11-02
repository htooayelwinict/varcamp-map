import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/check-in-physics.json';
import type {TileCatalog} from '../art/catalog';
import type {MapLayout,Placement} from './types';

const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Check-in physics: '+message);};
export const isCheckInPhysics=(layout:MapLayout)=>layout.id===data.mapId&&sha(layout)===data.afterLayoutSha256;

/** The check-in desk alone uses the same artwork with a solid six-cell footprint. */
function transform(layout:MapLayout,forward:boolean):MapLayout{
 need(data.version===1&&layout.id===data.mapId,'unsupported map or recipe');
 need(sha(layout)===(forward?data.beforeLayoutSha256:data.afterLayoutSha256),'unreviewed source layout');
 const result=structuredClone(layout),before=forward?data.beforePlacement:data.afterPlacement;
 const index=result.placements.findIndex(p=>p.id===before.id);
 need(index>=0&&isDeepStrictEqual(result.placements[index],before),'desk placement changed');
 result.placements[index]=structuredClone(forward?data.afterPlacement:data.beforePlacement) as Placement;
 need(sha(result)===(forward?data.afterLayoutSha256:data.beforeLayoutSha256),'unexpected source delta');
 return result;
}
export const applyCheckInPhysics=(layout:MapLayout)=>transform(layout,true);
export const restoreCheckInPhysics=(layout:MapLayout)=>transform(layout,false);
export function assertCheckInPhysicsCatalog(catalog:TileCatalog):void{
 need(isDeepStrictEqual(catalog[data.spriteId],data.sprite),'desk must retain its exact art and six solid cells');
}
