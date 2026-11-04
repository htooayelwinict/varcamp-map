import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import recipe from '../../world/roadster-physics.json';
import type {MapLayout,Placement} from './types';
import type {TileCatalog} from '../art/catalog';

const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(v:unknown,m:string)=>{if(!v)throw Error('Roadster physics: '+m);};
export const isRoadsterPhysics=(l:MapLayout)=>l.id==='overworld'&&sha(l)===recipe.afterLayoutSha256;
export function applyRoadsterPhysics(input:MapLayout):MapLayout{
 if(input.id!=='overworld')return input;
 need(sha(input)===recipe.beforeLayoutSha256,'unreviewed predecessor');
 const l=structuredClone(input);l.placements.push(structuredClone(recipe.placement) as Placement);
 need(sha(l)===recipe.afterLayoutSha256,'unexpected footprint delta');return l;
}
export function restoreRoadsterPhysics(input:MapLayout,catalog?:TileCatalog):MapLayout{
 if(input.id!=='overworld')return input;
 need(isRoadsterPhysics(input),'unreviewed source');
 if(catalog){
  need(isDeepStrictEqual(catalog[recipe.spriteId],recipe.sprite),'solid pad alias changed');
  need(isDeepStrictEqual(recipe.sprite,{...catalog['floor-blue'],blockingCells:[[0,0]]}),'pad must retain the existing blue floor artwork');
 }
 const l=structuredClone(input);
 need(isDeepStrictEqual(l.placements.pop(),recipe.placement),'solid pad placement changed');
 need(sha(l.animatedOverlays!.find(o=>o.name==='roadster'))===recipe.overlaySha256,'car artwork, motion or position changed');
 need(sha(l)===recipe.beforeLayoutSha256,'unrelated source changed');return l;
}
