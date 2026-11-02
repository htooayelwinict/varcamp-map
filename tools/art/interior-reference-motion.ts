/** Original generated PNGs → restrained native Tiled interior animation.
 * Uses the one shared compiler; no browser timer or runtime script is added.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { renderNativeMotion, type NativeMotionPose } from './native-motion';
import type { MapLayout } from '../maps/types';
import type {Sprite} from './catalog';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {ariesPresentationFunctional} from '../maps/aries-presentation';
import {auditoriumFunctional} from '../maps/auditorium-spacing';

export async function renderInteriorReferenceMotion(){
const artifacts=new Map<string,Buffer>(),layouts=new Map<string,MapLayout>();
const baseline=JSON.parse(readFileSync('tests/fixtures/interior-reference/before-functions.json','utf8'));
const hash=(body:Buffer)=>createHash('sha256').update(body).digest('hex');
const atlas='art/source/interior-reference-native.png';
if(!readFileSync(atlas).equals(readFileSync('assets/tilesets/original/interior-reference.png')))throw Error('Native generated pose source differs from actual static atlas');
const decode=async(left:number,top:number,width:number,height:number):Promise<NativeMotionPose>=>({width,height,rgba:await sharp(atlas).extract({left,top,width,height}).ensureAlpha().raw().toBuffer()});
const plant=await decode(0,128,96,96);
const canopy:NativeMotionPose={width:96,height:64,rgba:Buffer.from(plant.rgba.subarray(0,96*64*4))};
// The pot stays put. Only the PNG leaf canopy is translated by one pixel.
const plantBase=Buffer.from(plant.rgba);plantBase.fill(0,0,96*64*4);
const plantBasePath='assets/tilesets/original/interior-reference-plant-base.png';
artifacts.set(plantBasePath,await sharp(plantBase,{raw:{width:96,height:96,channels:4}}).png().toBuffer());
const catalogEntry:Sprite={sheet:plantBasePath,rect:{x:0,y:0,width:3,height:3},blockingCells:Array.from({length:9},(_,i)=>[i%3,Math.floor(i/3)]),level:'belowAvatar',sourceId:'interior-reference'};


const server=await decode(352,128,64,96);
const serverPoses=[1,.55,.8,1].map(scale=>{
 const rgba=Buffer.from(server.rgba);
 for(let i=0;i<rgba.length;i+=4)if(rgba[i+3]>200&&rgba[i+1]>rgba[i]*1.5&&rgba[i+2]>rgba[i]*1.5&&rgba[i+1]>70){for(let c=0;c<3;c++)rgba[i+c]=Math.round(rgba[i+c]*scale);}
 return{width:64,height:96,rgba};
});
const water=await decode(96,128,128,96);
const waterPoses=[0,1,2,1].map(dx=>{
 const rgba=Buffer.from(water.rgba);
 // Translate only the generated aquarium's contained glass-water pixels.
 for(let y=20;y<59;y++)for(let x=23;x<104;x++){
  const source=(y*128+x+dx)*4,target=(y*128+x)*4;
  water.rgba.copy(rgba,target,source,source+4);
 }
 return{width:128,height:96,rgba};
});
const steamImage=await sharp('art/source/interior-steam-pose.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
const steamPoses=[.6,.5,.35,.2].map(scale=>{
 const rgba=Buffer.from(steamImage.data);for(let i=3;i<rgba.length;i+=4)rgba[i]=Math.round(rgba[i]*scale);
 return{width:steamImage.info.width,height:steamImage.info.height,rgba};
});
const inputs=['art/source/interior-reference-original.png','art/source/interior-steam-original.png','art/source/interior-steam-pose.png',atlas,'tools/art/native-motion.ts','tools/art/interior-reference-motion.ts','tools/maps/builder.ts'].map(path=>({path,sha256:hash(readFileSync(path))}));
const records:any[]=[];
const generated=new Set<string>([plantBasePath]);
for(const name of Object.keys(baseline)){
 const path=`world/layouts/${name}.json`,layout:MapLayout=JSON.parse(readFileSync(path,'utf8'));
 layout.animatedOverlays=(layout.animatedOverlays??[]).filter(a=>!a.name.startsWith('interior-ambient-'));
 const plantPlacement=layout.placements.find(p=>p.id==='interior-ref-north-west'||p.id==='interior-ref-gallery-plant')!;
 if(!plantPlacement)throw Error(`${name}: expected authored plant cluster`);
 plantPlacement.sprite='interior-ref-plant-motion-base';
 const coffee=layout.placements.find(p=>p.id==='interior-ref-tea-console'||p.id==='interior-ref-refreshments')!;
 const serverPlacement=layout.placements.find(p=>p.sprite==='interior-ref-server');
 const waterPlacement=layout.placements.find(p=>p.sprite==='interior-ref-aquarium');
 const effects=[
  {kind:'plant',rect:{x:plantPlacement.x,y:plantPlacement.y,width:3,height:2},stepMs:750,poses:[canopy],samples:[0,1,0,-1].map(x=>({x,y:0,pose:0}))},
  {kind:'steam',rect:{x:coffee.x,y:coffee.y,width:1,height:1},stepMs:400,poses:steamPoses,samples:[{x:10,y:8,pose:0},{x:10,y:6,pose:1},{x:11,y:4,pose:2},{x:10,y:2,pose:3},{x:10,y:0,pose:null},{x:10,y:0,pose:null}]},
  ...(serverPlacement?[{kind:'server',rect:{x:serverPlacement.x,y:serverPlacement.y,width:2,height:3},stepMs:750,poses:serverPoses,samples:[0,1,2,3].map(pose=>({x:0,y:0,pose}))}]:[]),
  ...(waterPlacement?[{kind:'water',rect:{x:waterPlacement.x,y:waterPlacement.y,width:4,height:3},stepMs:600,poses:waterPoses,samples:[0,1,2,3].map(pose=>({x:0,y:0,pose}))}]:[]),
 ];
 for(const effect of effects){
  const image=`assets/tilesets/original/interior-motion-${effect.kind}.png`;
  const result=await renderNativeMotion({name:`interior-ambient-${effect.kind}`,image,sourceId:'interior-reference',level:'belowAvatar',rect:effect.rect,stepMs:effect.stepMs,periodMs:effect.stepMs*effect.samples.length,poses:effect.poses,tracks:[{id:effect.kind,samples:effect.samples}]});
  if(artifacts.has(image)&&!artifacts.get(image)!.equals(result.png))throw Error('Shared interior animation atlas has different bodies: '+image);
  artifacts.set(image,result.png);generated.add(image);
  const metadataPath=`art/source/interior-motion-${name}-${effect.kind}.json`;
  const overlay={...result.overlay,provenance:{metadataPath,atlasSha256:hash(result.png),inputs}};
  layout.animatedOverlays.push(overlay);
  artifacts.set(metadataPath,Buffer.from(JSON.stringify({scope:'ORIGINAL_PNG_INTERIOR_NATIVE_MOTION',overlay,diagnostics:result.diagnostics},null,2)+'\n'));generated.add(metadataPath);
  records.push({map:name,effect:effect.kind,diagnostics:result.diagnostics,atlasSha256:hash(result.png)});
 }
 const functional=auditoriumFunctional(name,ariesPresentationFunctional(name,baseline[name]));
 for(const key of ['width','height','entries','exits','areas','inspectionZones'])if(JSON.stringify(layout[key as keyof MapLayout])!==JSON.stringify(functional[key as keyof typeof functional]))throw Error(`${name}: functional baseline changed`);
 layouts.set(path,layout);
}
const metadata='art/source/interior-motion.json';artifacts.set(metadata,Buffer.from(JSON.stringify({scope:'ORIGINAL_PNG_INTERIOR_NATIVE_MOTION',inputs,records},null,2)+'\n'));generated.add(metadata);
return {artifacts,layouts,catalogEntry,inputs,records,generated,atlas};
}

/** The explicit author operation is the only writer; imports/checks remain pure. */
export async function writeInteriorReferenceMotion(){
const result=await renderInteriorReferenceMotion();
for(const[path,body]of result.artifacts)writeFileSync(path,body);
for(const[path,layout]of result.layouts)writeFileSync(path,JSON.stringify(layout,null,2)+'\n');
const catalog=JSON.parse(readFileSync('art/tile-catalog.json','utf8'));catalog['interior-ref-plant-motion-base']=result.catalogEntry;
writeFileSync('art/tile-catalog.json',JSON.stringify(catalog,null,2)+'\n');
const sources=JSON.parse(readFileSync('art/sources.json','utf8')),record=sources['interior-reference'];
const files=new Set<string>([...record.files.map((f:any)=>f.path),...result.generated,result.atlas,'art/source/interior-steam-original.png','art/source/interior-steam-pose.png']);
record.files=[...files].sort().map(path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}));
writeFileSync('art/sources.json',JSON.stringify(sources,null,2)+'\n');
return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const r=await writeInteriorReferenceMotion();console.log(`Compiled ${r.records.length} quiet native effects across fourteen interiors, all below avatars.`);}
