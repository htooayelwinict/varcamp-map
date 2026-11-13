import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import recipe from '../../world/leo-citadel.json';
import type {MapLayout,TiledMap,TiledTileset} from './types';
import type {TileCatalog} from '../art/catalog';
import {currentBuildingFrontSprite} from './building-front-edges';
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(v:unknown,s:string)=>{if(!v)throw Error('Leo citadel: '+s);};
const image='../assets/tilesets/original/leo-citadel.png';
export const isLeoCitadel=(l:MapLayout)=>l.id==='overworld'&&sha(l)===recipe.afterLayoutSha256;
export function applyLeoCitadel(input:MapLayout):MapLayout{
 if(input.id!=='overworld')return input;
 need(sha(input)===recipe.beforeLayoutSha256,'author predecessor');
 const l=structuredClone(input);
 l.placements[recipe.building.index]=structuredClone(recipe.building.after) as MapLayout['placements'][number];
 l.placements.splice(recipe.retiredOrnament.index,1);
 need(sha(l)===recipe.afterLayoutSha256,'author output');return l;
}

/** Replace one exterior and retire its separate crest. Every other source
 * field must reproduce the exact reviewed campus predecessor. */
export function restoreLeoCitadel(input:MapLayout,catalog?:TileCatalog):MapLayout{
 if(input.id!=='overworld')return input;
 need(recipe.version===1&&sha(input)===recipe.afterLayoutSha256,'unreviewed campus source');
 if(catalog){
  need(isDeepStrictEqual(catalog['leo-citadel'],currentBuildingFrontSprite('leo-citadel',recipe.sprite)),'new building footprint or depth changed');
  need(isDeepStrictEqual(catalog['leo-citadel'].blockingCells,catalog['grounded-zodiac-physical-leo'].blockingCells),'grounded walls changed');
 }
 const l=structuredClone(input),b=recipe.building,o=recipe.retiredOrnament;
 need(isDeepStrictEqual(l.placements[b.index],b.after)&&!l.placements.some(p=>p.id===o.value.id),'building or integrated crest changed');
 l.placements[b.index]=structuredClone(b.before) as MapLayout['placements'][number];
 l.placements.splice(o.index,0,structuredClone(o.value) as MapLayout['placements'][number]);
 need(sha(l)===recipe.beforeLayoutSha256,'unrelated campus source changed');
 return l;
}

/** Keep the unused old ornament reservation; its pixels are never painted. */
export function leoCitadelContextSource(source:TiledMap):TiledMap{
 if(!source.tilesets.some(t=>t.image===image))return source;
 need(source.properties?.find(p=>p.name==='worldMapId')?.value==='overworld','wrong map');
 need(!source.tilesets.some(t=>t.image==='../assets/tilesets/original/leo-lion-head.png'),'separate lion overlay must be retired');
 const result=structuredClone(source),n=Math.max(0,...source.tilesets.map(t=>/^art-\d+$/.test(t.name??'')?Number(t.name!.slice(4)):0))+1;
 result.tilesets.push({...structuredClone(recipe.retiredAtlas),name:`art-${n}`,firstgid:0});
 return result;
}

export function leoCitadelAtlases(source:TiledMap,start:number):TiledTileset[]{
 const sets=source.tilesets.filter(t=>t.image===image||t.name==='leo-citadel');
 if(!sets.length)return[];
 need(sets.length===1&&source.properties?.find(p=>p.name==='worldMapId')?.value==='overworld','new atlas identity');
 const t=sets[0];
 need(/^art-\d+$/.test(t.name??'')&&t.image===image&&t.tilewidth===32&&t.tileheight===32&&t.columns===12&&t.imagewidth===384&&t.imageheight===384&&t.tilecount===144&&!t.source&&!t.tiles&&!(t.margin??0)&&!(t.spacing??0),'new atlas geometry');
 return[{...structuredClone(t),name:'leo-citadel',firstgid:start}];
}
