import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import recipe from '../../world/speaker-office-wings.json';
import {SIGN_IDS} from '../../src/world/catalog';
import type {MapLayout} from './types';
import type {TileCatalog} from '../art/catalog';

type Functional=Pick<MapLayout,'width'|'height'|'entries'|'exits'|'areas'|'inspectionZones'>;
type Row={beforeSha256:string;afterSha256:string;beforeFunctional:Functional;afterFunctional:Functional;fields:Record<string,{before:unknown;after:unknown}>};
const rows=recipe.maps as unknown as Record<string,Row>;
// Solar/Lunar share the animation producer. Their successor changes only its
// input receipts; both hall floor plans and all animation pixels stay exact.
const motionOnly=(recipe as unknown as {motionOnly?:Record<string,Row>}).motionOnly??{};
const rowFor=(id:string)=>rows[id]??motionOnly[id];
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(v:unknown,s:string)=>{if(!v)throw Error('Office wings: '+s);};
const ids=SIGN_IDS.map(s=>'speaker-'+s);
export const isSpeakerOfficeWings=(l:MapLayout)=>rowFor(l.id)?.afterSha256===sha(l);
export function applySpeakerOfficeWings(input:MapLayout):MapLayout{
 const r=rowFor(input.id);if(!r)return input;
 need(sha(input)===r.beforeSha256,'author predecessor '+input.id);
 const after=structuredClone(input);
 for(const[field,c]of Object.entries(r.fields))Object.assign(after,{[field]:structuredClone(c.after)});
 restoreSpeakerOfficeWings(after);
 return after;
}

/** Append-only floor-plan successor. The only original furniture edits are the
 * two east-wall layers, split around a three-tile doorway behind the audience. */
export function restoreSpeakerOfficeWings(input:MapLayout):MapLayout{
 const r=rowFor(input.id);if(!r)return input;
 need(recipe.version===1&&isDeepStrictEqual(Object.keys(rows).sort(),ids.slice().sort()),'closed twelve-room roster');
 need(isDeepStrictEqual(Object.keys(motionOnly).sort(),['lunar-hall','solar-hall']),'closed provenance-only hall roster');
 need(sha(input)===r.afterSha256,'unreviewed room '+input.id);
 const result=structuredClone(input);
 for(const[field,c]of Object.entries(r.fields)){
  need((rows[input.id]?['width','placements','signs','areas','inspectionZones','animatedOverlays']:['animatedOverlays']).includes(field),'unowned field '+field);
  need(isDeepStrictEqual(input[field as keyof MapLayout],c.after),'source field '+field);
  Object.assign(result,{[field]:structuredClone(c.before)});
 }
 need(sha(result)===r.beforeSha256,'predecessor changed');
 const motion=(l:MapLayout)=>(l.animatedOverlays??[]).map(o=>({...o,provenance:o.provenance?{...o.provenance,inputs:[]}:undefined}));
 need(isDeepStrictEqual(motion(input),motion(result)),'animation pixels, anchors, clocks or depth changed');
 const original=result.placements.filter(p=>!['east-wall','east-wall-core'].includes(p.id));
 for(const p of original)need(isDeepStrictEqual(input.placements.find(n=>n.id===p.id),p),'original furnishing moved '+p.id);
 for(const p of input.placements.filter(p=>!result.placements.some(o=>o.id===p.id)))need(p.x>=result.width||p.id.startsWith('office-link-'),'new furnishing enters original auditorium');
 return result;
}

export function officeWingFunctional(id:string,before:Functional):Functional{
 const r=rows[id];if(!r)return before;
 need(isDeepStrictEqual(before,r.beforeFunctional),'functional predecessor '+id);
 const after=r.afterFunctional;
 need(after.width===before.width+30&&[36,40].includes(before.width)&&after.height===before.height,'append beside at native scale');
 for(const key of ['entries','exits'] as const)need(isDeepStrictEqual(after[key],before[key]),'original portal moved');
 need(isDeepStrictEqual(after.areas.slice(0,before.areas.length),before.areas),'original controls moved');
 need(after.areas.length===before.areas.length+4,'four new spaces');
 for(const kind of ['organizers','silent','briefing','lounge']){
  const a=after.areas.find(a=>a.id===`${id.slice(8)}-office-${kind}`);
  need(a&&a.x>=before.width&&a.x+a.width<=after.width-1,'new space bounds '+kind);
  need(isDeepStrictEqual(a?.properties,kind==='silent'?[{id:`${id.slice(8)}-office-quiet`,type:'silent'}]:[]),'new space controls '+kind);
 }
 return structuredClone(after);
}

export function assertOfficeMaterials(catalog:TileCatalog):void{
 for(const[id,value]of Object.entries(recipe.aliases))need(isDeepStrictEqual(catalog[id],value),'native furnishing contract '+id);
}
