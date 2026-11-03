import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import recipe from '../../world/cancer-citadel.json';
import type {MapLayout,TiledMap,TiledTileset} from './types';
import type {TileCatalog} from '../art/catalog';
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(v:unknown,s:string)=>{if(!v)throw Error('Cancer citadel: '+s);};
const image='../assets/tilesets/original/cancer-citadel.png';
export const isCancerCitadel=(l:MapLayout)=>l.id==='overworld'&&sha(l)===recipe.afterLayoutSha256;

export function applyCancerCitadel(input:MapLayout):MapLayout{
 if(input.id!=='overworld')return input;
 need(sha(input)===recipe.beforeLayoutSha256,'author predecessor');
 const l=structuredClone(input);l.placements[recipe.building.index]=structuredClone(recipe.building.after) as MapLayout['placements'][number];
 need(sha(l)===recipe.afterLayoutSha256,'author output');return l;
}

/** One whole-building replacement. Restore the exact Leo-era source so all
 * older controls, art, collision and provenance contracts still apply. */
export function restoreCancerCitadel(input:MapLayout,catalog?:TileCatalog):MapLayout{
 if(input.id!=='overworld')return input;
 need(recipe.version===1&&sha(input)===recipe.afterLayoutSha256,'unreviewed campus source');
 if(catalog){
  need(isDeepStrictEqual(catalog['cancer-citadel'],recipe.sprite),'new building footprint or depth changed');
  need(isDeepStrictEqual(catalog['cancer-citadel'].blockingCells,catalog['grounded-zodiac-physical-cancer'].blockingCells),'grounded walls changed');
 }
 const l=structuredClone(input),b=recipe.building;
 need(isDeepStrictEqual(l.placements[b.index],b.after),'building changed');
 l.placements[b.index]=structuredClone(b.before) as MapLayout['placements'][number];
 need(sha(l)===recipe.beforeLayoutSha256,'unrelated campus source changed');return l;
}

/** Append one atlas after all 105 preceding reservations; never repack them. */
export function cancerCitadelAtlases(source:TiledMap,start:number):TiledTileset[]{
 const sets=source.tilesets.filter(t=>t.image===image||t.name==='cancer-citadel');if(!sets.length)return[];
 need(sets.length===1&&source.properties?.find(p=>p.name==='worldMapId')?.value==='overworld','new atlas identity');
 const t=sets[0];
 need(/^art-\d+$/.test(t.name??'')&&t.image===image&&t.tilewidth===32&&t.tileheight===32&&t.columns===12&&t.imagewidth===384&&t.imageheight===384&&t.tilecount===144&&!t.source&&!t.tiles&&!(t.margin??0)&&!(t.spacing??0),'new atlas geometry');
 return[{...structuredClone(t),name:'cancer-citadel',firstgid:start}];
}
