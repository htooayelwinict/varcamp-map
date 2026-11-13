import type {MapLayout,TiledMap} from './types';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/programme-boards.json';
import {refineSolidProps} from './solid-props';
const owned=(id:string)=>id.startsWith('programme-');
const placements=data.boards.flatMap(({id,face})=>[
 {id:`programme-face-${id}`,sprite:'programme-board-face',layer:'scenery',...face},
 ...[face.x,face.x+face.width-1].map((x,i)=>({id:`programme-support-${id}-${i}`,sprite:'solid-sign-post',layer:'scenery',x,y:face.y+face.height,width:1,height:1})),
]);
const signs=data.boards.map(({id})=>({face:`programme-face-${id}`,supports:[`programme-support-${id}-0`,`programme-support-${id}-1`]}));
function moveSpawn(layout:MapLayout,forward:boolean):void{
 const {names,before,after}=data.arrivalSpawn,expected=forward?before:after,target=forward?after:before;
 for(const name of names){
  const e=layout.entries.filter(e=>e.name===name);
  if(e.length!==1||Object.entries(expected).some(([k,v])=>e[0][k as keyof typeof expected]!==v))throw Error('Programme arrival: unexpected spawn');
  Object.assign(e[0],target);
 }
}
export function applyProgrammeBoards(input:MapLayout):MapLayout{
 if(input.id!==data.mapId||input.placements.some(p=>owned(p.id))||input.standingSigns?.some(s=>owned(s.face)))throw Error('Programme boards: invalid predecessor');
 const result=structuredClone(input);moveSpawn(result,true);result.placements.push(...placements);result.standingSigns=[...(result.standingSigns??[]),...signs];return result;
}
export function restoreProgrammeBoards(input:MapLayout):MapLayout{
 if(input.id!==data.mapId||!isDeepStrictEqual(input.placements.filter(p=>owned(p.id)),placements)||!isDeepStrictEqual(input.standingSigns?.filter(s=>owned(s.face)),signs))throw Error('Programme boards: missing or altered geometry');
 const result=structuredClone(input);moveSpawn(result,false);result.placements=result.placements.filter(p=>!owned(p.id));result.standingSigns=result.standingSigns?.filter(s=>!owned(s.face));return result;
}
/** Own only programme paint/supports and the two approved arrival marker masks. */
export function refineNativeProgramme(native:TiledMap,intended:TiledMap):TiledMap{
 const result=refineSolidProps(native,intended);
 for(const name of data.arrivalSpawn.names){
  const layer=result.layers.find(l=>l.name===name),source=intended.layers.find(l=>l.name===name);
  if(layer?.type!=='tilelayer'||source?.type!=='tilelayer')throw Error('Programme arrival: missing marker layer');
  const gids=[...new Set(layer.data.filter(Boolean))];
  if(gids.length!==1)throw Error('Programme arrival: ambiguous marker identity');
  const before=data.arrivalSpawn.before;
  const expected=Array.from({length:before.width*before.height},(_,i)=>(before.y+Math.floor(i/before.width))*native.width+before.x+i%before.width);
  if(!isDeepStrictEqual(layer.data.flatMap((v,i)=>v?[i]:[]),expected))throw Error('Programme arrival: native predecessor changed');
  layer.data=source.data.map(gid=>gid?gids[0]:0);
 }
 return result;
}
