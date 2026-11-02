import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import recipe from '../../world/room-refinement.json';
import type {MapLayout} from './types';
import type {TileCatalog} from '../art/catalog';

type Row={beforeLayoutSha256:string;afterLayoutSha256:string;fields:Record<string,{before:unknown;after:unknown}>};
const rows=recipe.maps as unknown as Record<string,Row>;
const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Room refinement: '+message);};
export const isRoomRefinement=(l:MapLayout)=>rows[l.id]?.afterLayoutSha256===digest(l);
function transform(input:MapLayout,forward:boolean):MapLayout{
 const row=rows[input.id];if(!row)return structuredClone(input);
 need(recipe.version===1&&digest(input)===(forward?row.beforeLayoutSha256:row.afterLayoutSha256),'unreviewed source '+input.id);
 const result=structuredClone(input);
 for(const[field,change]of Object.entries(row.fields)){
  need(['placements','signs'].includes(field),'functional field mutation');
  need(isDeepStrictEqual(input[field as keyof MapLayout],forward?change.before:change.after),'source field changed '+field);
  Object.assign(result,{[field]:structuredClone(forward?change.after:change.before)});
 }
 need(digest(result)===(forward?row.afterLayoutSha256:row.beforeLayoutSha256),'unexpected transaction output');
 return result;
}
export const applyRoomRefinement=(l:MapLayout)=>transform(l,true);
export const restoreRoomRefinement=(l:MapLayout)=>transform(l,false);
export function assertRoomMaterials(catalog:TileCatalog):void{
 for(const[id,value]of Object.entries(recipe.aliases))need(isDeepStrictEqual(catalog[id],value),'native material changed '+id);
}
