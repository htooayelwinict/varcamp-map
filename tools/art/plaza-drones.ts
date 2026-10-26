import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {renderNativeMotion} from './native-motion';
import type {NativeMotionPose,NativeMotionTrack} from './native-motion';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const source='art/source/plaza-original/drone-approved-master.png';
const stepMs=200,periodMs=80000,phaseCount=periodMs/stepMs;
/** Two full-campus flight circuits; 24px actors, independent of avatar/network motion.
 * Every resource flies aboveScenery (closed PLAZA_DRONES class in tools/maps/airborne.ts). */
export async function renderPlazaDrones(){
 const master=readFileSync(source),{data,info}=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==1448||info.height!==1086)throw Error('Approved 4×3 drone master dimensions changed');
 const poses:NativeMotionPose[]=[],crops=[],poseAtlas=Buffer.alloc(128*96*4);
 for(let i=0;i<12;i++){
  const cell={left:i%4*362,top:Math.floor(i/4)*362,width:362,height:362};let left:number=cell.left+362,right:number=cell.left,top:number=cell.top+362,bottom:number=cell.top;
  for(let y=cell.top;y<cell.top+362;y++)for(let x=cell.left;x<cell.left+362;x++)if(data[(y*1448+x)*4+3]>=192){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const crop={left,top,width:right-left+1,height:bottom-top+1},scale=Math.min(24/crop.width,24/crop.height),width=Math.max(1,Math.round(crop.width*scale)),height=Math.max(1,Math.round(crop.height*scale));
  const rgba=await sharp(master).extract(crop).resize(width,height,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();
  poses.push({width,height,rgba});crops.push({cell,crop,target:{width,height}});
  for(let y=0;y<height;y++)rgba.copy(poseAtlas,((Math.floor(i/4)*32+y+Math.floor((32-height)/2))*128+i%4*32+Math.floor((32-width)/2))*4,y*width*4,(y+1)*width*4);
 }
 const tracks:NativeMotionTrack[]=[51,25].map((radius,actor)=>({id:`drone-${actor+1}`,samples:Array.from({length:phaseCount},(_,phase)=>{
  const angle=(actor?-1:1)*phase*2*Math.PI/phaseCount+(actor?Math.PI/2:0),x=Math.round((64+radius*Math.cos(angle))*32-12),y=Math.round((64+radius*Math.sin(angle))*32-12);
  const dx=(actor?-1:1)*-Math.sin(angle),dy=(actor?-1:1)*Math.cos(angle),direction=Math.abs(dx)>Math.abs(dy)?dx>0?1:3:dy>0?0:2;
  return{x,y,pose:(Math.floor(phase/2)%3)*4+direction};
 })}));
 const rosters=new Map<string,{gx:number;gy:number;xs:number[];ys:number[]}>();
 for(const track of tracks)for(const s of track.samples){const pose=poses[s.pose!];for(let y=Math.floor(s.y/32);y<=Math.floor((s.y+pose.height-1)/32);y++)for(let x=Math.floor(s.x/32);x<=Math.floor((s.x+pose.width-1)/32);x++){
  const gx=Math.floor(x/15),gy=Math.floor(y/15),key=`${gx},${gy}`;let r=rosters.get(key);if(!r){r={gx,gy,xs:[],ys:[]};rosters.set(key,r);}r.xs.push(x);r.ys.push(y);
 }}
 const resources=[];
 for(const [i,r] of [...rosters.values()].sort((a,b)=>a.gy-b.gy||a.gx-b.gx).entries()){
  const x=Math.min(...r.xs),y=Math.min(...r.ys),width=Math.max(...r.xs)-x+1,height=Math.max(...r.ys)-y+1,name=`plaza-drone-${String(i).padStart(2,'0')}`;
  const result=await renderNativeMotion({name,image:`assets/tilesets/original/${name}.png`,sourceId:'plaza-original-drones',level:'aboveScenery',rect:{x,y,width,height},stepMs,periodMs,poses,tracks:tracks.map(t=>({...t,samples:t.samples.map(s=>({...s,x:s.x-x*32,y:s.y-y*32}))}))});
  const metadataPath=`art/source/${name}.json`;
  result.overlay.provenance={metadataPath,atlasSha256:sha(result.png),inputs:['tools/art/plaza-drones.ts','tools/art/native-motion.ts','tools/maps/builder.ts','tools/maps/types.ts'].map(path=>({path,sha256:sha(readFileSync(path))}))};
  resources.push({...result,metadataPath});
 }
 const posePng=await sharp(poseAtlas,{raw:{width:128,height:96,channels:4}}).png().toBuffer();
 return{resources,posePng,metadata:{version:1,source:{path:source,sha256:sha(master)},stepMs,periodMs,phaseCount,crops,tracks,resources:resources.map(r=>({metadataPath:r.metadataPath,overlay:r.overlay,diagnostics:r.diagnostics}))}};
}
export async function writePlazaDrones(){
 const r=await renderPlazaDrones();writeFileSync('art/source/plaza-drone-poses.png',r.posePng);
 for(const resource of r.resources){writeFileSync(resource.overlay.image,resource.png);writeFileSync(resource.metadataPath,JSON.stringify({version:1,source:r.metadata.source,overlay:resource.overlay,diagnostics:resource.diagnostics},null,2)+'\n');}
 writeFileSync('art/source/plaza-drones.json',JSON.stringify(r.metadata,null,2)+'\n');return r;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await writePlazaDrones();
