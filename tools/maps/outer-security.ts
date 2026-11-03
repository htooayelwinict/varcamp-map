import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import recipe from '../../world/outer-security.json';
import {SECURITY_IDS} from './outer-security-roles';
import type {MapLayout,TiledMap,TiledTileset,LayoutAnimatedOverlay} from './types';
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(v:unknown,m:string)=>{if(!v)throw Error('Outer security: '+m);};
function overlays():LayoutAnimatedOverlay[]{const bytes=readFileSync('art/source/outer-security.json');need(createHash('sha256').update(bytes).digest('hex')===recipe.summarySha256,'flight summary changed');return JSON.parse(bytes.toString()).resources.map((r:any)=>r.overlay);}
export const isOuterSecurity=(l:MapLayout)=>l.id==='overworld'&&sha(l)===recipe.afterLayoutSha256;
export function applyOuterSecurity(input:MapLayout):MapLayout{
 if(input.id!=='overworld')return input;need(sha(input)===recipe.beforeLayoutSha256,'author predecessor');
 const l=structuredClone(input);l.animatedOverlays!.push(...overlays());need(sha(l)===recipe.afterLayoutSha256,'author output');return l;
}
export function restoreOuterSecurity(input:MapLayout):MapLayout{
 if(input.id!=='overworld')return input;need(isOuterSecurity(input),'unreviewed source');
 const l=structuredClone(input),n=SECURITY_IDS.length;need(isDeepStrictEqual(l.animatedOverlays!.slice(-n),overlays()),'patrol source/order changed');
 l.animatedOverlays=l.animatedOverlays!.slice(0,-n);need(sha(l)===recipe.beforeLayoutSha256,'unrelated map change');return l;
}
export function securityAtlases(source:TiledMap,start:number):TiledTileset[]{
 const sets=source.tilesets.filter(t=>SECURITY_IDS.includes(t.name??'')||t.image?.includes('/outer-security-'));
 if(!sets.length)return[];
 need(source.properties?.find(p=>p.name==='worldMapId')?.value==='overworld'&&isDeepStrictEqual(sets.map(s=>s.name),SECURITY_IDS),'closed atlas family');
 let next=start;return sets.map(t=>{
  need(t.image===`../assets/tilesets/original/${t.name}.png`&&t.tilewidth===32&&t.tileheight===32&&t.columns===16&&t.imagewidth===512&&t.imageheight!>0&&t.imageheight!<=2048&&t.imageheight!%32===0&&t.tilecount===t.imageheight!/32*16&&!t.source&&!(t.margin??0)&&!(t.spacing??0)&&t.tiles?.length&&t.tiles.length<256,'native atlas geometry');
  const out={...structuredClone(t),firstgid:next};next+=t.tilecount!;return out;
 });
}
