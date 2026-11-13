import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {SIGN_IDS} from '../../src/world/catalog';
import recipe from '../../world/speaker-entrance-sponsors.json';
import type {LayoutImage,LayoutSign,MapLayout} from './types';

type Row={beforeSha256:string;afterSha256:string;image:LayoutImage;caption:LayoutSign};
const rows=recipe.maps as Record<string,Row>;
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Speaker entrance sponsor: '+message);};
export const isSpeakerEntranceSponsor=(layout:MapLayout)=>rows[layout.id]?.afterSha256===sha(layout);

/** One complete organizer-supplied logo and title; no furniture or controls move. */
function transform(layout:MapLayout,forward:boolean):MapLayout{
 const row=rows[layout.id];if(!row)return layout;
 need(recipe.version===1&&isDeepStrictEqual(Object.keys(rows).sort(),SIGN_IDS.map(s=>'speaker-'+s).sort()),'closed twelve-room roster changed');
 need(sha(layout)===(forward?row.beforeSha256:row.afterSha256),'unreviewed source '+layout.id);
 const result=structuredClone(layout);
 if(forward){
  result.images!.push(structuredClone(row.image));
  result.signs!.push(structuredClone(row.caption));
 }else{
  need(isDeepStrictEqual(result.images!.at(-1),row.image)&&isDeepStrictEqual(result.signs!.at(-1),row.caption),'entrance mark or title changed');
  result.images!.pop();result.signs!.pop();
 }
 need(sha(result)===(forward?row.afterSha256:row.beforeSha256),'unrelated layout changes');
 return result;
}
export const applySpeakerEntranceSponsor=(layout:MapLayout)=>transform(layout,true);
export const restoreSpeakerEntranceSponsor=(layout:MapLayout)=>rows[layout.id]?.beforeSha256===sha(layout)?layout:transform(layout,false);
