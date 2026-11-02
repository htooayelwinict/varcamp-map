import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {isDeepStrictEqual} from 'node:util';
import {renderCoast} from './coast-raster';
import data from '../../world/natural-coast.json';
import type {Placement} from '../maps/types';
import type {TileCatalog} from './catalog';

export const NATURAL_COAST_IDS=['shipyard-beach','constellation-shore'] as const;
export type NaturalCoastId=typeof NATURAL_COAST_IDS[number];
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
export const coastImage=(id:string)=>`assets/tilesets/original/natural-${id}.png`;
export const duneImage=(id:string)=>`assets/tilesets/original/natural-${id}-dunes.png`;
export const coastMetadata=(id:string)=>`art/source/natural-${id}.json`;
/** Compile a continuous coastline on the native grid. Existing licensed source
 * tiles are sampled without changing their files; no reference-repository art is copied. */
export async function renderNaturalCoast(id:NaturalCoastId){
 const row=data.maps[id],{width,height}=row.functional;
 const art=await renderCoast(row.coast,{width,height,prefix:`natural-${id}`,groundPrefix:'natural-ground',image:coastImage(id)});
 const grass=await sharp('assets/tilesets/workadventure/WA_Exterior.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const sand=await sharp('assets/tilesets/original/beach-lounge.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const ground=art.ground as Placement[],catalog=art.catalog as TileCatalog,tiles:Buffer[]=[],dunes:Placement[]=[];
 const edge=(x:number)=>9.4+1.2*Math.sin(x/4.7)+.55*Math.sin(x/1.9);
 for(let y=0;y<14;y++)for(let x=0;x<width;x++){
  if(y>edge(x)+1)continue;
  if(y+1<edge(x)-.5){dunes.push({id:`dune-${x}-${y}`,sprite:'ground-grass',x,y,width:1,height:1,layer:'terrain'});continue;}
  const pixels=Buffer.alloc(32*32*4),variant=(x*7+y*11)%16;
  for(let py=0;py<32;py++)for(let px=0;px<32;px++){
   const gx=x+px/32,gy=y+py/32,jitter=((x*31+y*17+px*3+py*7)%13)/90;
   const useGrass=gy<edge(gx)+jitter;
   const source=useGrass?grass:sand;
   const at=useGrass?((800+py)*grass.info.width+px)*4:((128+Math.floor(variant/8)*32+py)*sand.info.width+(variant%8)*32+px)*4;
   source.data.copy(pixels,(py*32+px)*4,at,at+4);
  }
  const index=tiles.length,sprite=`natural-dune-${id}-${index}`;tiles.push(pixels);
  catalog[sprite]={sheet:duneImage(id),sourceId:'natural-coast',rect:{x:index%16,y:Math.floor(index/16),width:1,height:1},blockingCells:[],level:'belowAvatar'};
  dunes.push({id:`dune-${x}-${y}`,sprite,x,y,width:1,height:1,layer:'terrain'});
 }
 const duneHeight=Math.ceil(tiles.length/16)*32,buffer=Buffer.alloc(512*duneHeight*4);
 tiles.forEach((t,i)=>{for(let y=0;y<32;y++)t.copy(buffer,((Math.floor(i/16)*32+y)*512+i%16*32)*4,y*128,(y+1)*128);});
 const dunePng=await sharp(buffer,{raw:{width:512,height:duneHeight,channels:4}}).png().toBuffer();
 const inputs=['world/natural-coast.json','tools/art/natural-coast.ts','tools/art/coast-raster.ts','assets/tilesets/original/beach-lounge.png','assets/tilesets/lpc-water/water.png','assets/tilesets/workadventure/WA_Exterior.png'].map(path=>({path,sha256:sha(readFileSync(path))}));
 const metadata={version:1,id,image:coastImage(id),width:art.width,height:art.height,atlasSha256:sha(art.png),duneImage:duneImage(id),duneHeight,duneSha256:sha(dunePng),frameMs:row.coast.frameMs,inputs,ground:[...ground,...dunes],cells:art.edges,catalog};
 return{png:art.png,dunePng,metadata};
}
export async function writeNaturalCoastArt(id:NaturalCoastId){
 const art=await renderNaturalCoast(id);
 writeFileSync(coastImage(id),art.png);writeFileSync(duneImage(id),art.dunePng);
 writeFileSync(coastMetadata(id),JSON.stringify(art.metadata,null,2)+'\n');return art.metadata;
}
export async function checkNaturalCoastArt():Promise<void>{
 for(const id of NATURAL_COAST_IDS){const art=await renderNaturalCoast(id);
  if(!art.png.equals(readFileSync(coastImage(id)))||!art.dunePng.equals(readFileSync(duneImage(id)))||!isDeepStrictEqual(art.metadata,JSON.parse(readFileSync(coastMetadata(id),'utf8'))))throw Error('Natural coast producer mismatch: '+id);
 }
}
