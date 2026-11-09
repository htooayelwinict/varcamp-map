import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import sharp from 'sharp';
import {SIGN_IDS} from '../../src/world/catalog';
import {HALL_BUILDINGS_IMAGE,ZODIAC_GROUND_NAMES_IMAGE,hallBuildingSprites,zodiacGroundNameSprites} from '../maps/hall-buildings-definition';
import type {TileCatalog} from './catalog';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const need=(ok:unknown,m:string)=>{if(!ok)throw Error('Hall buildings: '+m);};
export const HALL_BUILDINGS_METADATA='art/source/hall-buildings.json';
export const HALL_BUILDINGS_SOURCE_PATHS=['world/hall-buildings.json','tools/art/hall-buildings.ts','tools/maps/hall-buildings-definition.ts','art/source/hall-buildings/prompts.json','art/source/hall-buildings/solar-generated-master.png','art/source/hall-buildings/lunar-generated-master.png',HALL_BUILDINGS_METADATA,HALL_BUILDINGS_IMAGE,ZODIAC_GROUND_NAMES_IMAGE];
export async function renderHallBuildings(){
 const r=read('world/hall-buildings.json'),glyphRaw=readFileSync('art/source/hub-nameplates.json');need(sha(glyphRaw)===r.glyphsSha256,'native font source changed');
 const glyphs=JSON.parse(glyphRaw.toString()).glyphs,atlas=Buffer.alloc(768*384*4),labels=Buffer.alloc(384*768*4),subjects=[];
 const text=(data:Buffer,str:string,canvasWidth:number,center:number,y:number,scale:number,color:number[])=>{
  const start=Math.round(center-(str.length*6-1)*scale/2);
  for(const[n,c]of [...str].entries()){if(c===' ')continue;need(glyphs[c],'missing native glyph '+c);for(const[gy,line]of glyphs[c].entries())for(let gx=0;gx<5;gx++)if(line[gx]==='1')for(let sy=0;sy<scale;sy++)for(let sx=0;sx<scale;sx++){const p=((y+gy*scale+sy)*canvasWidth+start+n*6*scale+gx*scale+sx)*4;for(let k=0;k<4;k++)data[p+k]=color[k];}}
 };
 for(const[i,id]of ['solar','lunar'].entries()){
  const master=r.masters[id],raw=readFileSync(master.path);need(sha(raw)===master.sha256,'retained master changed: '+id);
  const {data,info}=await sharp(raw).ensureAlpha().raw().toBuffer({resolveWithObject:true});let left=info.width,right=-1,top=info.height,bottom=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=192){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  need(right>left&&bottom>top&&top>0&&bottom<info.height-1,'complete transparent building required');
  const crop={left,top,width:right-left+1,height:bottom-top+1},scale=Math.min(384/crop.width,382/crop.height),width=Math.round(crop.width*scale),height=Math.round(crop.height*scale),x=i*384+Math.floor((384-width)/2),y=384-height;
  const pixels=await sharp(raw).extract(crop).resize(width,height,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();
  for(let p=0;p<pixels.length;p+=4)if(pixels[p+3]<192)pixels.fill(0,p,p+4);
  for(let py=0;py<height;py++)pixels.copy(atlas,((y+py)*768+x)*4,py*width*4,(py+1)*width*4);
  // Clear just the four-tile threshold row; the full roof and lobby remain visible.
  for(let py=352;py<384;py++)atlas.fill(0,(py*768+i*384+128)*4,(py*768+i*384+256)*4);
  // The label sits on the generated architectural cornice, not on a freestanding board.
  text(atlas,id.toUpperCase()+' HALL',768,i*384+192,id==='solar'?239:253,2,id==='solar'?[64,38,17,255]:[14,29,63,255]);
  subjects.push({id,master,crop,target:{x,y,width,height},threshold:{x:i*384+128,y:352,width:128,height:32}});
 }
 for(const[i,id]of SIGN_IDS.entries()){
  text(labels,'R'+(i+1)+' '+id.toUpperCase(),384,192,i*64+7,3,[235,224,189,155]);
  text(labels,'SPEAKER ROOM',384,192,i*64+37,2,[205,228,231,145]);
 }
 const png=await sharp(atlas,{raw:{width:768,height:384,channels:4}}).png().toBuffer(),names=await sharp(labels,{raw:{width:384,height:768,channels:4}}).png().toBuffer();
 return{png,names,metadata:{version:2,recipeSha256:sha(readFileSync('world/hall-buildings.json')),operation:'Uniform nearest-neighbor native compilation; complete enclosed halls; only bottom four-wide threshold cleared; R1-R12 zodiac names rendered as translucent glyphs with no board or border below avatars',labels:SIGN_IDS.map((id,i)=>({room:'R'+(i+1),zodiac:id.toUpperCase(),subtitle:'SPEAKER ROOM',row:i*64})),subjects,images:[{path:HALL_BUILDINGS_IMAGE,sha256:sha(png)},{path:ZODIAC_GROUND_NAMES_IMAGE,sha256:sha(names)}]}};
}
export async function writeHallBuildings(){const r=await renderHallBuildings();writeFileSync(HALL_BUILDINGS_IMAGE,r.png);writeFileSync(ZODIAC_GROUND_NAMES_IMAGE,r.names);writeFileSync(HALL_BUILDINGS_METADATA,JSON.stringify(r.metadata,null,2)+'\n');return r;}
export async function checkHallBuildingsArt(catalog:TileCatalog){
 const r=await renderHallBuildings();need(readFileSync(HALL_BUILDINGS_IMAGE).equals(r.png)&&readFileSync(ZODIAC_GROUND_NAMES_IMAGE).equals(r.names)&&isDeepStrictEqual(read(HALL_BUILDINGS_METADATA),r.metadata),'native artwork differs from retained masters/compiler');
 for(const[id,s]of Object.entries({...hallBuildingSprites(),...zodiacGroundNameSprites()}))need(isDeepStrictEqual(catalog[id],s),'sprite definition changed: '+id);
 const files=read('art/sources.json').original.files;for(const path of HALL_BUILDINGS_SOURCE_PATHS)need(files.filter((f:any)=>f.path===path&&f.sha256===sha(readFileSync(path))).length===1,'registration changed: '+path);
}
