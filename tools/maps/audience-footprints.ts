import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/audience-footprints.json';
import type {MapLayout,Placement,LayoutSign} from './types';
import type {TileCatalog} from '../art/catalog';
type Item=Placement|LayoutSign;
type Delta={replacements:{index:number;before:Item;after:Item}[];insertions:{index:number;value:Item}[]};
type Row={beforeLayoutSha256:string;afterLayoutSha256:string;fields:Partial<Record<'placements'|'signs',Delta>>};
const rows=data.maps as unknown as Record<string,Row>;
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Audience and footprints: '+message);};
export const isAudienceFootprints=(l:MapLayout)=>rows[l.id]?.afterLayoutSha256===sha(l);
function transform(l:MapLayout,forward:boolean):MapLayout{
 const row=rows[l.id];if(!row)return structuredClone(l);
 need(data.version===1&&sha(l)===(forward?row.beforeLayoutSha256:row.afterLayoutSha256),'unreviewed source: '+l.id);
 const result=structuredClone(l);
 for(const[field,d]of Object.entries(row.fields)){
  const list=result[field as 'placements'|'signs'] as Item[];
  if(!forward)for(const r of [...d.insertions].reverse()){need(isDeepStrictEqual(list[r.index],r.value),'inserted furnishing changed');list.splice(r.index,1);}
  for(const r of d.replacements){need(isDeepStrictEqual(list[r.index],forward?r.before:r.after),'previous furnishing changed');list[r.index]=structuredClone(forward?r.after:r.before);}
  if(forward)for(const r of d.insertions)list.splice(r.index,0,structuredClone(r.value));
 }
 need(sha(result)===(forward?row.afterLayoutSha256:row.beforeLayoutSha256),'unexpected source delta');return result;
}
export const applyAudienceFootprints=(l:MapLayout)=>transform(l,true);
export const restoreAudienceFootprints=(l:MapLayout)=>transform(l,false);
/** Alias art is byte-identical; only reviewed collision and depth cells differ. */
export function assertAudienceFootprintCatalog(catalog:TileCatalog):void{
 const expected=Object.keys(data.aliases).sort();
 need(isDeepStrictEqual(Object.keys(catalog).filter(k=>k.startsWith('grounded-')).sort(),expected),'closed grounded alias family changed');
 for(const[id,row]of Object.entries(data.aliases)){
  need(isDeepStrictEqual(catalog[id],row.sprite),'footprint/depth changed: '+id);
  for(const key of ['sheet','rect','sourceId']as const)need(isDeepStrictEqual(catalog[id][key],catalog[row.original][key]),'native artwork changed: '+id);
 }
}
