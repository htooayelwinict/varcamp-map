import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {buildMap} from './builder';
import {loadTileCatalog,type TileCatalog} from '../art/catalog';
import type {MapLayout,TiledMap,WamFile,TileRect} from './types';
import sprites from '../../art/exploration-sprites.json';
import {woodlandLayout} from './woodland-layout';
export const EXPLORATION_IDS=['campus-exploration','star-garden','moon-grotto','moon-cafe','stargazer-terrace'] as const;
export type ExplorationId=typeof EXPLORATION_IDS[number];
export const isExplorationId=(id:string):id is ExplorationId=>(EXPLORATION_IDS as readonly string[]).includes(id);
const intersects=(a:TileRect,b:TileRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
/** Five independently authored landscapes. Public names remain stable; geometry
 * is deliberately replaced by this named successor rather than old epoch pins. */
export function explorationLayout(id:ExplorationId,catalog=loadTileCatalog()):MapLayout{
 return woodlandLayout(id,catalog);
}
export function renderExplorationMap(layout:MapLayout,catalog:TileCatalog):TiledMap{
 const map=buildMap(layout,catalog).tmj;
 if(layout.id!=='moon-grotto'){
  const texture=map.layers.find(l=>l.name==='scenery-belowAvatar-0');
  if(texture)texture.opacity=layout.id==='stargazer-terrace'?.16:.38;
 }
 const ghost=map.tilesets.find(t=>t.image==='../assets/tilesets/lpc-exploration/ghost.png');
 if(ghost)ghost.tiles=[{id:0,animation:Array.from({length:6},(_,tileid)=>({tileid,duration:200})),properties:[{name:'collides',type:'bool',value:false}]}];
 map.backgroundcolor=layout.id==='moon-grotto'?'#17242b':'#234329';
 return JSON.parse(JSON.stringify(map));
}
export function explorationReachability(map:TiledMap,layout:MapLayout):Set<number>{
 const mask=map.layers.find(l=>l.name==='physical-collisions');if(mask?.type!=='tilelayer')throw Error('Exploration physics missing');
 const start=layout.entries.find(e=>e.isDefault)!;const seen=new Set<number>(),queue=[start.y*map.width+start.x];seen.add(queue[0]);
 if(mask.data[queue[0]])throw Error('Exploration default spawn is blocked');
 for(let i=0;i<queue.length;i++){const n=queue[i],x=n%map.width,y=Math.floor(n/map.width);for(const[a,b]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const k=b*map.width+a;if(a<0||b<0||a>=map.width||b>=map.height||seen.has(k)||mask.data[k])continue;seen.add(k);queue.push(k);}}
 return seen;
}
export function assertExplorationMap(map:TiledMap,layout:MapLayout,wam:WamFile,catalog:TileCatalog):void{
 const need=(v:unknown,m:string)=>{if(!v)throw Error('Enchanted exploration: '+m);};
 need(isExplorationId(layout.id),'closed map identity');if(!isExplorationId(layout.id))return;
 need(isDeepStrictEqual(layout,explorationLayout(layout.id,catalog)),'source composition '+layout.id);
 for(const[name,s]of Object.entries(sprites))need(isDeepStrictEqual(catalog[name],s),'sprite physics '+name);
 need(isDeepStrictEqual(map,renderExplorationMap(layout,catalog)),'native projection '+layout.id);
 const sources=JSON.parse(readFileSync('art/sources.json','utf8'));for(const source of ['lpc-exploration','exploration-ghost'])for(const f of sources[source].files)need(createHash('sha256').update(readFileSync(f.path)).digest('hex')===f.sha256,'art provenance '+f.path);
 const seen=explorationReachability(map,layout);
 for(const target of [...layout.entries,...layout.exits,...layout.areas])for(let y=target.y;y<target.y+target.height;y++)for(let x=target.x;x<target.x+target.width;x++)need(seen.has(y*map.width+x),`${layout.id}: blocked ${target.name} at ${x},${y}`);
 for(const e of layout.entries)need(!layout.exits.some(x=>intersects(e,x)),'spawn overlaps exit '+e.name);
 for(const a of layout.areas){const saved=wam.areas.find(s=>s.id===a.id);need(saved&&saved.name===a.name&&saved.x===a.x*32&&saved.y===a.y*32&&saved.width===a.width*32&&saved.height===a.height*32&&isDeepStrictEqual(saved.properties,a.properties),'saved area '+a.id);}
 need(!layout.signs?.some(s=>s.height>1||s.fontSize!>14),'oversized signage');
}
