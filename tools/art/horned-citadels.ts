import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import sharp from 'sharp';
import recipe from '../../world/horned-citadels.json';
import type {TileCatalog} from './catalog';
import {currentBuildingFrontSprite} from '../maps/building-front-edges';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const need=(v:unknown,s:string)=>{if(!v)throw Error('Horned citadel art: '+s);};
export const HORNED_CITADELS_METADATA='art/source/horned-citadels.json';
export const HORNED_CITADELS_SOURCES=['world/horned-citadels.json','tools/art/horned-citadels.ts','tools/maps/horned-citadels.ts','tools/maps/building-front-edges.ts','art/source/horned-citadels/prompts.json',...recipe.buildings.map(b=>b.master.path),HORNED_CITADELS_METADATA,...recipe.buildings.map(b=>b.image)];

/** Fit each complete transparent subject uniformly to its native footprint. */
export async function renderHornedCitadels(){
 const rendered=[];
 for(const b of recipe.buildings){
  const master=readFileSync(b.master.path);need(sha(master)===b.master.sha256,'retained master changed: '+b.sign);
  const{data,info}=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let left=info.width,right=-1,top=info.height,bottom=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=recipe.alphaThreshold){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  need(right>=left&&bottom>=top,'empty building: '+b.sign);
  const crop={left,top,width:right-left+1,height:bottom-top+1},scale=Math.min(384/crop.width,384/crop.height),width=Math.round(crop.width*scale),height=Math.round(crop.height*scale),x=Math.floor((384-width)/2),y=384-height;
  const pixels=await sharp(master).extract(crop).resize(width,height,{kernel:'nearest'}).ensureAlpha().raw().toBuffer(),rgba=Buffer.alloc(384*384*4);
  for(let p=0;p<pixels.length;p+=4)if(pixels[p+3]<recipe.alphaThreshold)pixels.fill(0,p,p+4);
  for(let row=0;row<height;row++)pixels.copy(rgba,((y+row)*384+x)*4,row*width*4,(row+1)*width*4);
  const png=await sharp(rgba,{raw:{width:384,height:384,channels:4}}).png().toBuffer();
  rendered.push({sign:b.sign,png,metadata:{master:b.master,crop,target:{x,y,width,height},image:{path:b.image,sha256:sha(png)},sprite:b.sprite}});
 }
 return{rendered,metadata:{version:1,operation:'Uniform nearest fit, centered at south edge, preserve complete silhouette, alpha below192 cleared',buildings:rendered.map(({sign,metadata})=>({sign,...metadata}))}};
}
export async function checkHornedCitadelArt(catalog:TileCatalog,sources:Record<string,any>):Promise<void>{
 const r=await renderHornedCitadels(),s=sources['horned-citadels'];
 need(s&&isDeepStrictEqual(s.files.map((f:any)=>f.path),HORNED_CITADELS_SOURCES),'source family missing');
 need(HORNED_CITADELS_SOURCES.every(p=>s.files.find((f:any)=>f.path===p)?.sha256===sha(readFileSync(p))),'source hash changed');
 for(const b of r.rendered){need(readFileSync(b.metadata.image.path).equals(b.png),'PNG differs from master compiler: '+b.sign);need(isDeepStrictEqual(catalog[b.sign+'-citadel'],currentBuildingFrontSprite(b.sign+'-citadel',b.metadata.sprite)),'catalog changed: '+b.sign);}
 need(isDeepStrictEqual(JSON.parse(readFileSync(HORNED_CITADELS_METADATA,'utf8')),r.metadata),'metadata changed');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const r=await renderHornedCitadels();for(const b of r.rendered)writeFileSync(b.metadata.image.path,b.png);writeFileSync(HORNED_CITADELS_METADATA,JSON.stringify(r.metadata,null,2)+'\n');}
