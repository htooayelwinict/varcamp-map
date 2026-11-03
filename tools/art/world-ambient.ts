import{readFileSync}from'node:fs';
import{writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{pathToFileURL}from'node:url';
import sharp from'sharp';
import{renderNativeMotion,type NativeMotionPose,type NativeMotionSample,type NativeMotionSpec}from'./native-motion';
import{migrateAmbientPlants,isVisibleAmbientWater,WORLD_AMBIENT_IDS}from'../maps/world-ambient';
import type{MapLayout}from'../maps/types';
import{packAmbientPoses}from'./world-ambient-assets';
import{ambientDepthOwner,opaqueAmbientOwnerSupport}from'../maps/world-ambient-depth';
import{assertAnimatedDecorationSource}from'../maps/animated-decoration';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const groups:Record<string,string>={heat:'lamp',bubbles:'cascade',instrument:'glint',crystal:'glint'};
async function loadPoses(kind:string):Promise<NativeMotionPose[]>{const group=groups[kind]??kind,meta=read('art/source/world-ambient-assets.json').groups[group],{data,info}=await sharp(meta.path).ensureAlpha().raw().toBuffer({resolveWithObject:true}),poses=[];for(let i=0;i<meta.frames;i++){const rgba=Buffer.alloc(meta.width*meta.height*4);for(let y=0;y<meta.height;y++)data.copy(rgba,y*meta.width*4,(y*info.width+i*meta.width)*4,(y*info.width+(i+1)*meta.width)*4);poses.push({width:meta.width,height:meta.height,rgba});}return poses;}
function paintCount(pose:NativeMotionPose):number{let n=0;for(let i=3;i<pose.rgba.length;i+=4)if(pose.rgba[i])n++;return n;}
function waterPoint(layout:MapLayout,e:any,width:number,height:number):{x:number;y:number}{const candidates=[];for(let y=0;y<e.clip.height;y++)for(let x=0;x<e.clip.width;x++)candidates.push({x:x*32,y:y*32+8,d:Math.abs(x-e.clip.width/2)+Math.abs(y-e.clip.height/2)});candidates.sort((a,b)=>a.d-b.d);const p=candidates.find(p=>[-2,0,2].every(dx=>isVisibleAmbientWater(layout,{x:e.clip.x*32+p.x+dx,y:e.clip.y*32+p.y,width,height})));if(!p)throw Error('World ambient lacks visibly open water: '+e.name);return{x:p.x,y:p.y};}
export async function ambientMotionSpec(layout:MapLayout,e:any):Promise<NativeMotionSpec>{
 const originals=await loadPoses(e.kind),phaseCount=e.clock.periodMs/e.clock.stepMs,w=e.clip.width*32,h=e.clip.height*32;let poses=originals;let samples:NativeMotionSample[]=[];
 // A gull crosses the whole clip edge to edge at a constant integer step so tile content repeats;
 // it bobs only when the clip is taller than its32px pose (a one-row lane flies level).
 if(e.kind==='gull'){const step=Math.ceil((w+32)/(phaseCount-1)),lift=Math.max(0,Math.round((h-32)/2)),swing=Math.min(6,lift);samples=Array.from({length:phaseCount},(_,i)=>({x:-32+step*i,y:lift+Math.round(swing*Math.sin(i/16*Math.PI*2)),pose:3+[0,1,2,1][Math.floor(i/2)%4]}));}
 else if(e.kind==='fish'){samples=Array.from({length:phaseCount},(_,i)=>{const a=i/phaseCount*Math.PI*2;return{x:Math.round(w/2-16+48*Math.cos(a)),y:Math.round(h/2-16+24*Math.sin(a)),pose:i%6+(i>0&&i<phaseCount/2?6:0)};});}
 else if(e.kind==='ripples'){const p=waterPoint(layout,e,originals[0].width,originals[0].height);samples=Array.from({length:phaseCount},(_,i)=>({x:p.x+Math.round(2*Math.sin(i/phaseCount*Math.PI*2)),y:p.y,pose:Math.floor(i/3)%4}));}
 else if(e.kind==='leaves'){samples=Array.from({length:phaseCount},(_,i)=>({x:8+Math.round((w-24)*i/(phaseCount-1)),y:8+Math.round((h-28)*i/(phaseCount-1)),pose:Math.floor(i/3)%4}));}
 else{
  const anchor=layout.placements.find(p=>p.id===e.anchor);if(!anchor||anchor.x!==e.clip.x||anchor.y!==e.clip.y||anchor.width!==e.clip.width||anchor.height!==e.clip.height)throw Error('World ambient fixture owner changed: '+e.name);
  const catalog=read('art/tile-catalog.json'),sprite=catalog[anchor.sprite],tile=await sharp(sprite.sheet).extract({left:sprite.rect.x*32,top:sprite.rect.y*32,width:sprite.rect.width*32,height:sprite.rect.height*32}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  poses=[];for(let phase=0;phase<phaseCount;phase++){const source=originals[Math.floor(phase/3)%originals.length],rgba=Buffer.alloc(w*h*4),dx=Math.round((w-source.width)/2)+(e.kind==='steam'?Math.round(Math.sin(phase/phaseCount*Math.PI*2)):0),dy=Math.max(0,Math.round(h*.35-source.height/2))-(e.kind==='steam'?Math.floor(phase%12/4):0);
   for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){const px=dx+x,py=dy+y;if(px<0||py<0||px>=w||py>=h)continue;const src=(y*source.width+x)*4,dst=(py*w+px)*4,mask=((py%tile.info.height)*tile.info.width+(px%tile.info.width))*4;if(e.kind!=='steam'&&tile.data[mask+3]<8)continue;source.rgba.copy(rgba,dst,src,src+4);}
   if(!rgba.some((v,i)=>i%4===3&&v>0))throw Error('World ambient effect has no visible original pixels: '+e.name);poses.push({width:w,height:h,rgba});samples.push({x:0,y:0,pose:phase});
  }
 }
 if(['fish','ripples'].includes(e.kind))for(const s of samples)if(s.pose!==null&&!isVisibleAmbientWater(layout,{x:e.clip.x*32+s.x,y:e.clip.y*32+s.y,width:poses[s.pose].width,height:poses[s.pose].height}))throw Error('World ambient animal/water pose leaves visible sea: '+e.name);
 if(Math.max(...poses.map(paintCount))>1024)throw Error('World ambient painted density exceeds1024pixels: '+e.name);
 return{name:e.name,image:`assets/tilesets/original/${e.name}.png`,sourceId:'original',level:e.level,rect:e.clip,stepMs:e.clock.stepMs,periodMs:e.clock.periodMs,poses,tracks:[{id:e.name+'-actor',samples}]};
}
/** Split only on already-opaque owning upper art. No pose, timing or alpha is
 * changed; disjoint components retain the complete raw RGBA union. */
export async function partitionAmbientDepth(layout:MapLayout,e:any,raw:NativeMotionSpec){
 const owner=ambientDepthOwner(layout,e,read('art/tile-catalog.json')),w=e.clip.width*32,h=e.clip.height*32;let opaqueOwnerUpper:Buffer=Buffer.alloc(w*h);let sheetSha256:string|null=null;
 if(owner){const bytes=readFileSync(owner.visual.sheet);sheetSha256=sha(bytes);const{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});opaqueOwnerUpper=opaqueAmbientOwnerSupport(owner,w,h,{width:info.width,height:info.height,rgba:data});}
 const depthReceipt={policy:'opaque-owner-upper-v1',owner,sheetSha256,opaqueUpperSupport:opaqueOwnerUpper.toString('base64')};
 if(!owner)return[{spec:raw,opaqueOwnerUpper,depthReceipt,partition:'whole'}];
 let lower=false,upper=false;const below=raw.poses.map(p=>({...p,rgba:Buffer.alloc(p.rgba.length)})),above=raw.poses.map(p=>({...p,rgba:Buffer.alloc(p.rgba.length)}));
 for(let pose=0;pose<raw.poses.length;pose++)for(let i=0;i<raw.poses[pose].rgba.length;i+=4)if(raw.poses[pose].rgba[i+3]){const isUpper=opaqueOwnerUpper[i/4]===1;(isUpper?above:below)[pose].rgba.set(raw.poses[pose].rgba.subarray(i,i+4),i);if(isUpper)upper=true;else lower=true;}
 if(!upper)return[{spec:{...raw,level:'belowAvatar' as const},opaqueOwnerUpper,depthReceipt,partition:'whole'}];
 if(!lower)return[{spec:{...raw,level:'aboveAvatar' as const},opaqueOwnerUpper,depthReceipt,partition:'opaqueOwnerUpper'}];
 return[{spec:{...raw,level:'belowAvatar' as const,poses:below},opaqueOwnerUpper,depthReceipt,partition:'belowOwnerUpper'},{spec:{...raw,name:e.name+'-upper',image:`assets/tilesets/original/${e.name}-upper.png`,level:'aboveAvatar' as const,poses:above},opaqueOwnerUpper,depthReceipt,partition:'opaqueOwnerUpper'}];
}
export async function renderWorldAmbient(){
 const recipe=read('art/source/world-ambient.json');if(recipe.maps.length!==17||new Set(recipe.maps.map((m:any)=>m.id)).size!==17||WORLD_AMBIENT_IDS.some(id=>!recipe.maps.some((m:any)=>m.id===id)))throw Error('World ambient closed17map recipe changed');
 const catalog=read('art/tile-catalog.json'),results=[];
 for(const map of recipe.maps){const layout=migrateAmbientPlants(read(`world/layouts/${map.id}.json`),catalog);let decoded=0,painted=0;
  for(const e of map.effects){const raw=await ambientMotionSpec(layout,e),parts=await partitionAmbientDepth(layout,e,raw),rawPoseStrip=await packAmbientPoses(raw.poses),rawPoseInfo={path:`art/source/${e.name}-poses.png`,width:raw.poses[0].width,height:raw.poses[0].height,frames:raw.poses.length,sha256:sha(rawPoseStrip)},componentNames=parts.map(p=>p.spec.name);
   painted+=Math.max(...raw.poses.map(paintCount));
   for(const part of parts){const spec=part.spec,r=await renderNativeMotion(spec),metadataPath=`art/source/${spec.name}.json`,poseStripPath=parts.length===1?rawPoseInfo.path:`art/source/${spec.name}${spec.name===e.name?'-lower':''}-poses.png`,poseStrip=await packAmbientPoses(spec.poses);
    const inputs=['art/source/world-ambient.json','art/source/world-ambient-assets.json','art/source/world-ambient-generation.json','art/source/world-ambient-plants.json','art/source/world-ambient-layer-ownership.json',`art/source/world-ambient-${groups[e.kind]??e.kind}-poses.png`,'tools/maps/animated-decoration-contract.json','tools/art/world-ambient.ts','tools/art/world-ambient-assets.ts','tools/maps/animated-decoration.ts','tools/maps/world-ambient.ts','tools/maps/world-ambient-depth.ts','tools/maps/world-ambient-ownership.ts','tools/maps/park-arcade-context.ts','art/source/park-arcade-refresh.json','tools/maps/playground-context.ts','art/source/orbit-course-refresh.json','tools/maps/cafe-arrival-context.ts','art/source/cafe-arrival-refresh.json','tools/maps/maze-gate-context.ts','art/source/maze-gate-refresh.json','tools/maps/native-projection.ts','tools/maps/native-ownership-context.ts','art/source/native-ownership-context.json','tools/art/native-motion.ts','tools/maps/builder.ts','tools/maps/types.ts'];r.overlay.provenance={metadataPath,atlasSha256:sha(r.png),inputs:inputs.map(path=>({path,sha256:sha(readFileSync(path))}))};decoded+=r.diagnostics.decodedRgbaBytes;
    results.push({map:map.id,...r,poseStrip,rawPoseStrip,metadata:{version:2,effect:e,componentNames,partition:part.partition,depthReceipt:part.depthReceipt,overlay:r.overlay,rawPoseStrip:rawPoseInfo,poseStrip:{path:poseStripPath,width:spec.poses[0].width,height:spec.poses[0].height,frames:spec.poses.length,sha256:sha(poseStrip)},tracks:spec.tracks,maxPaintedPixels:Math.max(...spec.poses.map(paintCount)),rawMaxPaintedPixels:Math.max(...raw.poses.map(paintCount)),diagnostics:r.diagnostics}});
   }
  }
  if(decoded>8*1024*1024||painted>layout.width*layout.height*1024*.005)throw Error('World ambient per-map decoded/density limit: '+map.id);
 }
 return results;
}
export async function writeWorldAmbient(){const results=await renderWorldAmbient(),layouts=[];for(const id of WORLD_AMBIENT_IDS){const path=`world/layouts/${id}.json`,layout=migrateAmbientPlants(read(path),read('art/tile-catalog.json'));layout.animatedOverlays=[...(layout.animatedOverlays??[]).filter((o:any)=>!o.name.startsWith('world-ambient-')),...results.filter(r=>r.map===id).map(r=>r.overlay)];assertAnimatedDecorationSource(layout);layouts.push({path,layout});}for(const r of results){await writeFile(r.overlay.image,r.png);await writeFile(r.metadata.rawPoseStrip.path,r.rawPoseStrip);await writeFile(r.metadata.poseStrip.path,r.poseStrip);await writeFile(r.overlay.provenance!.metadataPath,JSON.stringify(r.metadata,null,2)+'\n');}for(const{path,layout}of layouts)await writeFile(path,JSON.stringify(layout,null,2)+'\n');}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await writeWorldAmbient();
