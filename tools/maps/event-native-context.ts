import reservations from '../../world/event-native-reservations.json';
import type {TiledMap,TiledTileset} from './types';
const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Event native context: '+message);};
/** Removed logos retain exact atlas intervals without any painted layer. */
export function eventAtlasContextSource(source:TiledMap):TiledMap{
 if(source.properties?.find(p=>p.name==='worldMapId')?.value!=='overworld'||!source.tilesets.some(t=>t.image==='../assets/tilesets/original/event-expo-captions.png'))return source;
 const isSponsor=(t:TiledTileset)=>t.properties?.some(p=>p.name==='sponsorPanel'&&p.value===true);
 const active=source.tilesets.filter(isSponsor),prior=reservations.sponsorAtlases as TiledTileset[];
 need(active.every(t=>prior.some(p=>p.name===t.name)),'unknown sponsor reservation');
 const result=structuredClone(source),index=result.tilesets.findIndex(isSponsor);
 result.tilesets=result.tilesets.filter(t=>!isSponsor(t));
 result.tilesets.splice(index,0,...prior.map(old=>structuredClone(active.find(t=>t.name===old.name)??old)));
 return result;
}
/** Native office sheets and original floor glyphs append after the unchanged 101 reservations. */
export function eventCounterAtlases(source:TiledMap,start:number):TiledTileset[]{
 if(source.properties?.find(p=>p.name==='worldMapId')?.value!=='overworld')return[];
 const rows=[{image:'../assets/tilesets/lpc-office/Card Table.png',name:'Card Table',width:128,height:192},{image:'../assets/tilesets/lpc-office/Laptop.png',name:'Laptop',width:128,height:128},{image:'../assets/tilesets/original/event-floor-labels.png',name:'event-floor-labels',width:512,height:160}];
 const sets=rows.map(r=>source.tilesets.filter(t=>t.image===r.image));
 if(sets.every(s=>s.length===0))return[];
 need(sets.every(s=>s.length===1),'counter sheets missing or duplicated');let next=start;
 return rows.map((r,i)=>{const t=sets[i][0];need(/^art-\d+$/.test(t.name??'')&&t.tilewidth===32&&t.tileheight===32&&t.columns===r.width/32&&t.imagewidth===r.width&&t.imageheight===r.height&&t.tilecount===r.width*r.height/1024&&!t.tiles&&!t.source,'counter sheet geometry changed');const result={...structuredClone(t),name:r.name,firstgid:next};next+=t.tilecount!;return result;});
}
