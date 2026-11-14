import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import sharp from 'sharp';
import {renderNativeMotion} from './native-motion';

export const HARBOUR_PLANE_META='art/source/harbour-plane.json';
export const HARBOUR_PLANE_EAST_META='art/source/harbour-plane-east.json';
const image='assets/tilesets/original/harbour-plane.png';
const eastImage='assets/tilesets/original/harbour-plane-east.png';
const posePath='art/source/coastal-flight-plane.png';
const sponsorRecipe='art/source/harbour-sponsor.json';
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
/** Native aircraft towing the approved sponsor mark; no browser media or runtime actor. */
export async function renderHarbourPlane(){
 const {data,info}=await sharp(posePath).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==192||info.height!==96)throw Error('Original 192 x 96 plane required');
 const sponsor=JSON.parse(readFileSync(sponsorRecipe,'utf8'));
 const original=readFileSync(sponsor.source);
 if(hash(original)!==sponsor.sourceSha256)throw Error('Approved DigiSec Lab original changed');
 const mark=await sharp(original).extract(sponsor.crop)
  .resize(sponsor.contentWidth,sponsor.contentHeight,{fit:'inside',kernel:'lanczos3'}).png().toBuffer();
 const size=await sharp(mark).metadata();
 // The cloth and tow line fit one bounded pose; the untouched plane is a second track.
 const cloth=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="96"><path d="M144 48H195" stroke="#e2cf9f" stroke-width="2"/><path d="M0 4H144V92H0L8 48Z" fill="#142c40"/><path d="M1 5H143V91H1M143 5V91" fill="none" stroke="#bba373" stroke-width="2"/></svg>');
 const flag=await sharp(cloth).composite([{input:mark,left:Math.floor((144-size.width!)/2),top:Math.floor((96-size.height!)/2)}]).ensureAlpha().raw().toBuffer();
 const stepMs=100,wholeWidth=352,travel=3072+wholeWidth,phaseCount=travel/8;
 const positions=Array.from({length:phaseCount},(_,i)=>((512+i*8)%travel)-wholeWidth);
 // The direct recipe pins the nested official original; render/check verifies that hash.
 const inputs=[posePath,sponsorRecipe,'tools/art/harbour-plane.ts','tools/art/native-motion.ts'].map(path=>({path,sha256:hash(readFileSync(path))}));
 const chunks=await Promise.all([
  {name:'coastal-flight',image,metadataPath:HARBOUR_PLANE_META,x:0},
  {name:'coastal-flight-east',image:eastImage,metadataPath:HARBOUR_PLANE_EAST_META,x:48}
 ].map(async chunk=>{
  const offset=chunk.x*32;
  // Both bounded clips sample one world route; never wrap at their shared seam.
  const motion=await renderNativeMotion({
   name:chunk.name,image:chunk.image,sourceId:'harbour-sponsor',level:'aboveScenery',
   rect:{x:chunk.x,y:5,width:48,height:3},stepMs,periodMs:phaseCount*stepMs,
   poses:[{width:200,height:96,rgba:flag},{width:192,height:96,rgba:data}],
   tracks:[
    {id:'digisec-flag',samples:positions.map(x=>({x:x-offset,y:0,pose:0}))},
    {id:'harbour-plane',samples:positions.map(x=>({x:x+160-offset,y:0,pose:1}))}
   ]
  });
  motion.overlay.provenance={metadataPath:chunk.metadataPath,atlasSha256:hash(motion.png),inputs};
  return {...motion,metadata:{version:3,description:'Original native aircraft towing DigiSec Lab, Digital Safety Partner, across the full shore. Official logo aspect ratio and colors retained.',sponsor,inputs,overlay:motion.overlay,diagnostics:motion.diagnostics}};
 }));
 const west=chunks[0],overlays=chunks.map(chunk=>chunk.overlay);
 return {...west,overlays,chunks,metadata:{...west.metadata,overlays}};
}
export async function writeHarbourPlane(){const r=await renderHarbourPlane();for(const chunk of r.chunks){writeFileSync(chunk.overlay.image,chunk.png);writeFileSync(chunk.overlay.provenance!.metadataPath,JSON.stringify(chunk.metadata,null,2)+'\n');}return r.overlay;}
export async function checkHarbourPlane(){const r=await renderHarbourPlane();for(const chunk of r.chunks)if(!readFileSync(chunk.overlay.image).equals(chunk.png)||!isDeepStrictEqual(JSON.parse(readFileSync(chunk.overlay.provenance!.metadataPath,'utf8')),chunk.metadata))throw Error('Harbour aircraft pixels/clock/provenance changed: '+chunk.overlay.name);}
