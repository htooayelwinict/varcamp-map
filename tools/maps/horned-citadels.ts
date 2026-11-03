import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import recipe from '../../world/horned-citadels.json';
import type {MapLayout,TiledMap,TiledTileset} from './types';
import type {TileCatalog} from '../art/catalog';
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(v:unknown,s:string)=>{if(!v)throw Error('Horned citadels: '+s);};
export const isHornedCitadels=(l:MapLayout)=>l.id==='overworld'&&sha(l)===recipe.afterLayoutSha256;

export function applyHornedCitadels(input:MapLayout):MapLayout{
 if(input.id!=='overworld')return input;
 need(sha(input)===recipe.beforeLayoutSha256,'author predecessor');
 const l=structuredClone(input);
 for(const b of recipe.buildings)l.placements[b.index]=structuredClone(b.after) as MapLayout['placements'][number];
 need(sha(l)===recipe.afterLayoutSha256,'author output');return l;
}

/** Restore the exact Cancer-era layout before applying historical contracts. */
export function restoreHornedCitadels(input:MapLayout,catalog?:TileCatalog):MapLayout{
 if(input.id!=='overworld')return input;
 need(recipe.version===1&&sha(input)===recipe.afterLayoutSha256,'unreviewed campus source');
 const l=structuredClone(input);
 for(const b of recipe.buildings){
  if(catalog){
   need(isDeepStrictEqual(catalog[b.after.sprite],b.sprite),'new footprint or depth changed: '+b.sign);
   need(isDeepStrictEqual(catalog[b.after.sprite].blockingCells,catalog[b.before.sprite].blockingCells),'grounded walls changed: '+b.sign);
  }
  need(isDeepStrictEqual(l.placements[b.index],b.after),'building changed: '+b.sign);
  l.placements[b.index]=structuredClone(b.before) as MapLayout['placements'][number];
 }
 need(sha(l)===recipe.beforeLayoutSha256,'unrelated campus source changed');return l;
}

/** Append two complete atlases, leaving all 106 preceding ranges intact. */
export function hornedCitadelAtlases(source:TiledMap,start:number):TiledTileset[]{
 const sets=source.tilesets.filter(t=>recipe.buildings.some(b=>t.image==='../'+b.image||t.name===b.after.sprite));
 if(!sets.length)return[];
 need(sets.length===2&&source.properties?.find(p=>p.name==='worldMapId')?.value==='overworld','new atlas identity');
 return recipe.buildings.map(b=>{
  const matches=sets.filter(t=>t.image==='../'+b.image||t.name===b.after.sprite);need(matches.length===1,'missing or duplicate atlas: '+b.sign);
  const t=matches[0];
  need(/^art-\d+$/.test(t.name??'')&&t.image==='../'+b.image&&t.tilewidth===32&&t.tileheight===32&&t.columns===12&&t.imagewidth===384&&t.imageheight===384&&t.tilecount===144&&!t.source&&!t.tiles&&!(t.margin??0)&&!(t.spacing??0),'atlas geometry: '+b.sign);
  const result={...structuredClone(t),name:b.after.sprite,firstgid:start};start+=144;return result;
 });
}
