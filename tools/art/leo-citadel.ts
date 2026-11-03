import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import sharp from 'sharp';
import recipe from '../../world/leo-citadel.json';
import type {TileCatalog} from './catalog';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const need=(v:unknown,s:string)=>{if(!v)throw Error('Leo citadel art: '+s);};
export const LEO_CITADEL_METADATA='art/source/leo-citadel.json';
export const LEO_CITADEL_SOURCES=['world/leo-citadel.json','tools/art/leo-citadel.ts','tools/maps/leo-citadel.ts','art/source/leo-citadel/prompt.json',recipe.master.path,LEO_CITADEL_METADATA,recipe.image];
/** Complete transparent subject, uniformly fitted to the existing 12x12 tile
 * footprint. Original atlas and ornament remain immutable recovery assets. */
export async function renderLeoCitadel(){
 const master=readFileSync(recipe.master.path);need(sha(master)===recipe.master.sha256,'retained master changed');
 const{data,info}=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,right=-1,top=info.height,bottom=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=recipe.alphaThreshold){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 need(right>=left&&bottom>=top,'empty building');
 const crop={left,top,width:right-left+1,height:bottom-top+1},scale=Math.min(384/crop.width,384/crop.height),width=Math.round(crop.width*scale),height=Math.round(crop.height*scale),x=Math.floor((384-width)/2),y=384-height;
 const pixels=await sharp(master).extract(crop).resize(width,height,{kernel:'nearest'}).ensureAlpha().raw().toBuffer(),rgba=Buffer.alloc(384*384*4);
 for(let p=0;p<pixels.length;p+=4)if(pixels[p+3]<recipe.alphaThreshold)pixels.fill(0,p,p+4);
 for(let row=0;row<height;row++)pixels.copy(rgba,((y+row)*384+x)*4,row*width*4,(row+1)*width*4);
 const png=await sharp(rgba,{raw:{width:384,height:384,channels:4}}).png().toBuffer();
 return{png,metadata:{version:1,master:recipe.master,crop,target:{x,y,width,height},operation:'Uniform nearest fit, centered at south edge, preserve complete silhouette, alpha below192 cleared',image:{path:recipe.image,sha256:sha(png)},sprite:recipe.sprite}};
}
export async function checkLeoCitadelArt(catalog:TileCatalog,sources:Record<string,any>):Promise<void>{
 const r=await renderLeoCitadel(),s=sources['leo-citadel'];
 need(s&&isDeepStrictEqual(s.files.map((f:any)=>f.path),LEO_CITADEL_SOURCES),'source family missing');
 need(LEO_CITADEL_SOURCES.every(p=>s.files.find((f:any)=>f.path===p)?.sha256===sha(readFileSync(p))),'source hash changed');
 need(readFileSync(recipe.image).equals(r.png),'PNG differs from retained master compiler');
 need(isDeepStrictEqual(JSON.parse(readFileSync(LEO_CITADEL_METADATA,'utf8')),r.metadata),'metadata changed');
 need(isDeepStrictEqual(catalog['leo-citadel'],recipe.sprite),'catalog changed');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const r=await renderLeoCitadel();writeFileSync(recipe.image,r.png);writeFileSync(LEO_CITADEL_METADATA,JSON.stringify(r.metadata,null,2)+'\n');}
