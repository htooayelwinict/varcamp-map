import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import sharp from 'sharp';
import flight from '../../art/source/outer-security-flight.json';
import {renderNativeMotion,type NativeMotionPose} from './native-motion';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const need=(v:unknown,m:string)=>{if(!v)throw Error('Outer security: '+m);};
const INPUTS=['art/source/outer-security-flight.json','tools/art/outer-security.ts','tools/art/native-motion.ts','tools/maps/outer-security-roles.ts',...flight.sources.map(s=>s.path)];
export async function renderOuterSecurity(){
 need(flight.version===1&&flight.tracks.length===7&&flight.stepMs===200&&flight.periodMs===120000,'closed seven-aircraft clock');
 for(const s of flight.sources)need(sha(readFileSync(s.path))===s.sha256,'retained source: '+s.path);
 const poses:NativeMotionPose[]=[];
 for(let i=0;i<12;i++)poses.push({width:24,height:24,rgba:await sharp(flight.sources[1].path).extract({left:i%4*32+4,top:Math.floor(i/4)*32+4,width:24,height:24}).ensureAlpha().raw().toBuffer()});
 const master=readFileSync(flight.sources[0].path),info=await sharp(master).metadata();
 const helicopterSize=flight.tracks.find(t=>t.kind==='helicopter')!.size;
 need(Number.isSafeInteger(helicopterSize)&&helicopterSize>=80&&helicopterSize<=128,'bounded helicopter rendering size');
 need(info.width&&info.height&&info.width>1000&&info.height>1000,'four-by-four helicopter poses');
 for(let i=0;i<16;i++){
  const rgba=await sharp(master).extract({left:Math.floor(i%4*info.width!/4),top:Math.floor(Math.floor(i/4)*info.height!/4),width:Math.floor(info.width!/4),height:Math.floor(info.height!/4)}).resize(helicopterSize,helicopterSize,{fit:'contain',kernel:'nearest',background:{r:0,g:0,b:0,alpha:0}}).ensureAlpha().raw().toBuffer();
  for(let p=0;p<rgba.length;p+=4)if(rgba[p+3]<128)rgba.fill(0,p,p+4);
  poses.push({width:helicopterSize,height:helicopterSize,rgba});
 }
 const resources=[];let decoded=0;
 for(const clip of flight.clips){
  const {x,y,width,height}=clip.rect;need(x>=0&&y>=0&&x+width<=128&&y+height<=128,'route outside map');
  const r=await renderNativeMotion({name:clip.id,image:`assets/tilesets/original/${clip.id}.png`,sourceId:'outer-security',level:'aboveScenery',rect:clip.rect,stepMs:flight.stepMs,periodMs:flight.periodMs,poses,tracks:flight.tracks.map(t=>({id:t.id,samples:t.samples.map(s=>({...s,x:s.x-x*32,y:s.y-y*32}))}))});
  const metadataPath=`art/source/${clip.id}.json`;
  r.overlay.provenance={metadataPath,atlasSha256:sha(r.png),inputs:INPUTS.map(path=>({path,sha256:sha(readFileSync(path))}))};
  decoded+=r.diagnostics.decodedRgbaBytes;resources.push({...r,metadataPath});
 }
 need(decoded<=flight.maxDecodedBytes,'texture budget');
 return{resources,metadata:{version:1,flightSha256:sha(readFileSync('art/source/outer-security-flight.json')),aircraft:7,additionalDrones:6,helicopters:1,decodedRgbaBytes:decoded,resources:resources.map(r=>({metadataPath:r.metadataPath,overlay:r.overlay,diagnostics:r.diagnostics}))}};
}
export async function checkOuterSecurityArt(){
 const r=await renderOuterSecurity();need(isDeepStrictEqual(JSON.parse(readFileSync('art/source/outer-security.json','utf8')),r.metadata),'summary differs from producer');
 for(const a of r.resources){need(readFileSync(a.overlay.image).equals(a.png),'native pixels: '+a.overlay.name);need(isDeepStrictEqual(JSON.parse(readFileSync(a.metadataPath,'utf8')),{version:1,overlay:a.overlay,diagnostics:a.diagnostics}),'native metadata: '+a.overlay.name);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const r=await renderOuterSecurity();for(const a of r.resources){writeFileSync(a.overlay.image,a.png);writeFileSync(a.metadataPath,JSON.stringify({version:1,overlay:a.overlay,diagnostics:a.diagnostics},null,2)+'\n');}writeFileSync('art/source/outer-security.json',JSON.stringify(r.metadata,null,2)+'\n');console.log(JSON.stringify({clips:r.resources.length,decoded:r.metadata.decodedRgbaBytes}));}
