import data from '../../world/sponsor-logos.json';
import type {TiledMap,TiledTileset} from './types';

/** Append four ordinary sponsor panels after all existing reservations, without reallocating them. */
export function sponsorLogoAtlases(source:TiledMap,start:number):TiledTileset[]{
 const member=(t:TiledTileset)=>data.added.some(p=>p.name===t.name||'../'+p.image===t.image);
 const sets=source.tilesets.filter(member);
 if(!sets.length)return[];
 if(source.properties?.find(p=>p.name==='worldMapId')?.value!==data.mapId||sets.length!==data.added.length)throw Error('Sponsor logos: incomplete overworld atlas family');
 let next=start;
 return data.added.map(p=>{
  const matches=sets.filter(t=>t.name===p.name||t.image==='../'+p.image),t=matches[0];
  if(matches.length!==1||t.name!==p.name||t.image!=='../'+p.image||t.source||t.tiles||t.tilewidth!==32||t.tileheight!==32||t.columns!==p.width||t.tilecount!==p.width*2||t.imagewidth!==p.width*32||t.imageheight!==64||(t.margin??0)!==0||(t.spacing??0)!==0||!t.properties?.some(v=>v.name==='sponsorPanel'&&v.value===true))throw Error('Sponsor logos: invalid atlas '+p.name);
  const result={...structuredClone(t),firstgid:next};next+=t.tilecount!;return result;
 });
}
