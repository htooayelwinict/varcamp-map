import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import recipe from '../../world/natural-coast.json';
import ocean from '../../world/beach-ship-native.json';
import {buildMap} from './builder';
import {coastMetadata,NATURAL_COAST_IDS,type NaturalCoastId} from '../art/natural-coast';
import {assertCoastLifeHabitat} from './coast-life-habitat';
import {assertNativeAirborne} from './airborne';
import type {MapLayout,TiledMap,WamFile} from './types';
import type {TileCatalog} from '../art/catalog';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const need=(v:unknown,s:string)=>{if(!v)throw Error('Natural coast: '+s);};
export const isNaturalCoastId=(id:string):id is NaturalCoastId=>(NATURAL_COAST_IDS as readonly string[]).includes(id);
export function naturalCoastLayout(id:NaturalCoastId):MapLayout{
 const row=recipe.maps[id],art=read(coastMetadata(id));
 return {...structuredClone(row.functional),placements:[...art.ground,...structuredClone(row.props)],signs:structuredClone(row.signs),images:[],standingSigns:[],animatedOverlays:structuredClone(row.animatedOverlays)} as MapLayout;
}
export function renderNaturalCoastMap(layout:MapLayout,catalog:TileCatalog):TiledMap{
 need(isNaturalCoastId(layout.id),'unknown map');const art=read(coastMetadata(layout.id));
 const map=buildMap(layout,catalog).tmj,coast=map.tilesets.find(t=>t.image==='../'+art.image)!;
 coast.tiles=art.cells.map((c:{tile:number})=>({id:c.tile,animation:[0,1,2,3].map(f=>({tileid:c.tile+f,duration:art.frameMs})),properties:[{name:'collides',type:'bool',value:false}]}));
 const water=map.tilesets.find(t=>t.image==='../assets/tilesets/lpc-water/water.png')!;
 water.tiles=ocean.waterTileIds.map((id,phase)=>({id,animation:ocean.waterTileIds.map((_,i)=>({tileid:ocean.waterTileIds[(phase+i)%3],duration:ocean.waterFrameMs}))}));
 map.layers.find(l=>l.name==='terrain')!.properties=Object.entries(ocean.audio).map(([name,value])=>({name,type:typeof value==='boolean'?'bool':typeof value==='number'?'float':'string',value}));
 return JSON.parse(JSON.stringify(map));
}
/** A complete successor contract replaces the retired island composition only
 * for these two named maps. Water, habitats, controls and native pixels remain
 * independently checked; deleting a source marker cannot skip this boundary. */
export function assertNaturalCoast(map:TiledMap,layout:MapLayout,wam:WamFile,catalog:TileCatalog):void{
 need(isNaturalCoastId(layout.id),'unknown map');const id=layout.id as NaturalCoastId,art=read(coastMetadata(id));
 need(recipe.version===1&&isDeepStrictEqual(layout,naturalCoastLayout(id)),'unreviewed source composition '+id);
 for(const input of art.inputs)need(sha(input.path)===input.sha256,'terrain input changed: '+input.path);
 need(sha(art.image)===art.atlasSha256&&sha(art.duneImage)===art.duneSha256,'terrain pixels changed');
 for(const[name,sprite]of Object.entries(art.catalog))need(isDeepStrictEqual(catalog[name],sprite),'terrain collision/depth changed '+name);
 need(isDeepStrictEqual(map,renderNaturalCoastMap(layout,catalog)),'native source projection changed '+id);
 need(!layout.images?.length&&!layout.standingSigns?.length&&layout.signs!.every(s=>s.width<=5&&s.height===1&&s.fontSize!<=14),'oversized signs/ads returned');
 for(const a of layout.areas){const saved=wam.areas.find(v=>v.id===a.id);need(saved&&saved.name===a.name&&saved.x===a.x*32&&saved.y===a.y*32&&saved.width===a.width*32&&saved.height===a.height*32&&isDeepStrictEqual(saved.properties,a.properties),'saved area changed '+a.id);}
 const tracks=read('art/source/coast-life-tracks.json').maps[id];
 const families=id==='shipyard-beach'?['fish-west','fish-east','dolphin','gull-north','gull-south'].map(n=>'coast-life-harbor-'+n):['fish-west','dolphin','seal','gull-north','gull-south'].map(n=>'coast-life-shore-'+n);
 const roster=id==='shipyard-beach'?[...families,'coastal-flight']:families;
 need(isDeepStrictEqual(layout.animatedOverlays?.map(o=>o.name),roster),'closed wildlife and aircraft roster changed');
 for(const o of layout.animatedOverlays??[]) {
  if(o.name==='coastal-flight'){
   const meta=read('art/source/harbour-plane.json');
   need(id==='shipyard-beach'&&o.image==='assets/tilesets/original/harbour-plane.png'&&o.level==='aboveScenery'&&isDeepStrictEqual(o,meta.overlay),'restored aircraft source changed');
   for(const input of meta.inputs)need(sha(input.path)===input.sha256,'aircraft input changed');
   need(sha(o.image)===o.provenance?.atlasSha256,'aircraft pixels changed');
   continue;
  }
  const row=tracks.find((t:{name:string})=>t.name===o.name);need(row,'unknown wildlife');assertCoastLifeHabitat(layout,row);
  need(o.level===(o.name.includes('gull-')?'aboveScenery':'belowAvatar'),'wildlife depth changed');
  need(isDeepStrictEqual(read(o.provenance!.metadataPath).overlay,o),'wildlife descriptor changed');
 }
 assertNativeAirborne(map,layout);
 const mask=map.layers.find(l=>l.name==='physical-collisions');need(mask?.type==='tilelayer','missing physics');if(mask?.type!=='tilelayer')return;
 const cells=(r:{x:number;y:number;width:number;height:number})=>Array.from({length:r.width*r.height},(_,i)=>(r.y+Math.floor(i/r.width))*map.width+r.x+i%r.width);
 const start=layout.entries.find(e=>e.isDefault)!,queue=[start.y*map.width+start.x],seen=new Set<number>();
 for(let head=0;head<queue.length;head++){const n=queue[head];if(seen.has(n)||mask.data[n])continue;seen.add(n);const x=n%map.width,y=Math.floor(n/map.width);for(const[a,b]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(a>=0&&b>=0&&a<map.width&&b<map.height&&!seen.has(b*map.width+a))queue.push(b*map.width+a);}
 for(const target of [...layout.entries,...layout.exits])need(cells(target).every(c=>seen.has(c)),'blocked entry/exit '+target.name);
 for(const target of layout.areas)need(cells(target).some(c=>seen.has(c)),'unreachable area '+target.name);
 const finalGround=new Map<number,string>();for(const p of layout.placements.filter(p=>p.layer==='terrain'))for(const i of cells(p))finalGround.set(i,p.sprite);
 for(const[i,s]of finalGround)if(s.startsWith('naval-water-')||s.startsWith('natural-'+id+'-water-'))need(Boolean(mask.data[i]),'walkable sea cell '+i);
}
