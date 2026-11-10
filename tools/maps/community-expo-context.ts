import type {TiledMap,TiledTileset} from './types';

const panels=[
 {name:'Expo / OSRFM',image:'../assets/sponsors/partner-osrfm.png'},
 {name:'Expo / Ten Ten',image:'../assets/sponsors/partner-ten-ten.png'},
] as const;
const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Community expo: '+message);};

/** Approved PR #9 additions append after the complete historical atlas roster. */
export function communityExpoAtlases(source:TiledMap,start:number):TiledTileset[]{
 const sets=source.tilesets.filter(t=>panels.some(p=>t.name===p.name||t.image===p.image));
 if(!sets.length)return[];
 need(source.properties?.find(p=>p.name==='worldMapId')?.value==='overworld'&&sets.length===2,'requires both overworld panels');
 return panels.map((p,i)=>{
  const matches=sets.filter(t=>t.name===p.name||t.image===p.image);
  need(matches.length===1,'missing or duplicate panel: '+p.name);
  const t=matches[0];
  need(t.name===p.name&&t.image===p.image&&!t.source&&!t.tiles&&t.tilewidth===32&&t.tileheight===32&&t.columns===4&&t.tilecount===8&&t.imagewidth===128&&t.imageheight===64&&(t.margin??0)===0&&(t.spacing??0)===0&&t.properties?.some(v=>v.name==='sponsorPanel'&&v.value===true),'invalid panel identity or geometry: '+p.name);
  return{...structuredClone(t),firstgid:start+i*8};
 });
}
