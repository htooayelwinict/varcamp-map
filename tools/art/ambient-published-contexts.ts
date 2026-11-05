// Validate retained artwork in its last published geometry after the five-map
// exploration replacement. Motion primitives and provenance inputs are unchanged.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ambientMotionSpec,partitionAmbientDepth} from './world-ambient';
import {renderNativeMotion,type NativeMotionPose} from './native-motion';
import {packAmbientPoses} from './world-ambient-assets';
import {migrateAmbientPlants,WORLD_AMBIENT_IDS} from '../maps/world-ambient';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const groups:Record<string,string>={heat:'lamp',bubbles:'cascade',instrument:'glint',crystal:'glint'};
const paintCount=(p:NativeMotionPose)=>{let n=0;for(let i=3;i<p.rgba.length;i+=4)if(p.rgba[i])n++;return n;};
function publishedLayout(id:string){
 const retired=read('world/retired-exploration-layouts.json');
 if(retired.maps[id]){
  const row=retired.maps[id];if(sha(Buffer.from(row.bytes))!==row.sha256)throw Error('Retired exploration context hash mismatch');
  return JSON.parse(row.bytes);
 }
 return read(`world/layouts/${id}.json`);
}
export async function renderAmbientInPublishedContexts(){
 const recipe=read('art/source/world-ambient.json');if(recipe.maps.length!==17||new Set(recipe.maps.map((m:any)=>m.id)).size!==17||WORLD_AMBIENT_IDS.some(id=>!recipe.maps.some((m:any)=>m.id===id)))throw Error('World ambient closed17map recipe changed');
 const catalog=read('art/tile-catalog.json'),results=[];
 for(const map of recipe.maps){const layout=migrateAmbientPlants(publishedLayout(map.id),catalog);let decoded=0,painted=0;
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
