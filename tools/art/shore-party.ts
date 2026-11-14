import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import type {TileCatalog} from './catalog';
import {renderNativeMotion,type NativeMotionPose} from './native-motion';
import type {TileRect} from '../maps/types';

const MASTER='art/source/shore-dj-stage-master.png';
const ATLAS='assets/tilesets/original/shore-party.png';
const META='art/source/shore-party.json';
const GENERATION='art/source/shore-party-generation.json';
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const transparent={r:0,g:0,b:0,alpha:0};
const colors=['#76e5e5','#b897ee','#efbd7e','#ec8e88'];
const svg=(width:number,height:number,body:string)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`);
const png=(width:number,height:number,body:string)=>sharp(svg(width,height,body)).png().toBuffer();

/** Alpha-trim and proportionally fit the approved original; never repaint it. */
async function stage(){
 const input=readFileSync(MASTER),{data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=-1,bottom=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=8){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
 if(right<left)throw new Error('Shore DJ stage master has no visible pixels');
 const crop={left,top,width:right-left+1,height:bottom-top+1};
 return {crop,png:await sharp(input).extract(crop).resize(192,160,{fit:'contain',position:'centre',background:transparent,kernel:sharp.kernel.lanczos3}).png().toBuffer()};
}

function bunting(width:number){
 let body=`<g shape-rendering="crispEdges"><rect x="3" y="10" width="${width-6}" height="2" fill="#bba078"/>`;
 for(const x of [3,width-6])body+=`<rect x="${x}" y="7" width="3" height="18" fill="#77583c"/><rect x="${x}" y="7" width="1" height="16" fill="#c7a375"/><rect x="${x-2}" y="25" width="7" height="2" fill="#413b34" opacity=".35"/>`;
 for(let x=11,i=0;x<width-12;x+=18,i++)body+=`<path d="M${x} 12h12l-6 10z" fill="${colors[i%colors.length]}"/><path d="M${x} 12h12v2H${x}z" fill="#fff0cf" opacity=".45"/>`;
 return body+'</g>';
}

async function floor(){
 let body='<g shape-rendering="crispEdges"><rect x="2" y="2" width="188" height="92" rx="2" fill="#25494d"/><rect x="5" y="5" width="182" height="86" fill="#6e573e"/>';
 for(let y=7,row=0;y<90;y+=12,row++){
  body+=`<rect x="7" y="${y}" width="178" height="10" fill="${row%2?'#826349':'#8b6b4d'}"/><path d="M7 ${y+10}h178" stroke="#493e34"/>`;
  for(let x=30+(row%2)*38;x<183;x+=76)body+=`<path d="M${x} ${y}v10" stroke="#604d3d"/>`;
 }
 body+='<path d="M4 4h184M4 92h184" stroke="#65b8b4"/><path d="M8 8h176M8 88h176" stroke="#d4ad72" opacity=".55"/></g>';
 return png(192,96,body);
}

async function motion(name:string,rect:TileRect,level:'belowAvatar'|'aboveAvatar',body:(phase:number)=>string){
 const width=rect.width*32,height=rect.height*32,poses:NativeMotionPose[]=[];
 for(let phase=0;phase<12;phase++)poses.push({width,height,rgba:await sharp(svg(width,height,body(phase))).ensureAlpha().raw().toBuffer()});
 return renderNativeMotion({name,image:`assets/tilesets/original/${name}.png`,sourceId:'original',level,rect,stepMs:500,periodMs:6000,poses,tracks:[{id:name,samples:poses.map((_p,pose)=>({x:0,y:0,pose}))}]});
}

/** Deterministic original artwork export. Reads provenance inputs; writes nothing. */
export async function renderShoreParty(){
 const master=await stage();
 const catalog:TileCatalog={
  'shore-dj-stage':{sheet:ATLAS,rect:{x:0,y:0,width:6,height:5},level:'aboveAvatar',sourceId:'original',blockingCells:Array.from({length:6},(_,x)=>[[x,3],[x,4]] as [number,number][]).flat()},
  'shore-dj-floor':{sheet:ATLAS,rect:{x:6,y:0,width:6,height:3},level:'belowAvatar',sourceId:'original',blockingCells:[]},
  'shore-party-bunting':{sheet:ATLAS,rect:{x:6,y:3,width:4,height:1},level:'belowAvatar',sourceId:'original',blockingCells:[]},
  'shore-party-bunting-short':{sheet:ATLAS,rect:{x:10,y:3,width:2,height:1},level:'belowAvatar',sourceId:'original',blockingCells:[]},
  'shore-party-sign':{sheet:ATLAS,rect:{x:6,y:4,width:5,height:1},level:'belowAvatar',sourceId:'original',blockingCells:[]},
 };
 const parts=[master.png,await floor(),await png(128,32,bunting(128)),await png(64,32,bunting(64)),await png(160,32,'<g shape-rendering="crispEdges"><rect x="3" y="3" width="154" height="26" rx="3" fill="#173e49"/><path d="M7 4h146M7 28h146" stroke="#d9ad71"/><path d="M4 8v16M156 8v16" stroke="#73c9c5"/></g>')];
 const atlasPng=await sharp({create:{width:384,height:160,channels:4,background:transparent}}).composite(Object.values(catalog).map((s,i)=>({input:parts[i],left:s.rect.x*32,top:s.rect.y*32}))).png().toBuffer();
 const floorFx=await motion('shore-dj-lights',{x:27,y:14,width:8,height:6},'belowAvatar',phase=>{
  const t=phase*Math.PI/6;
  let body='<defs><radialGradient id="pool"><stop stop-color="white" stop-opacity=".22"/><stop offset=".4" stop-color="white" stop-opacity=".11"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient><linearGradient id="beam" x2="0" y2="1"><stop stop-color="white" stop-opacity=".04"/><stop offset="1" stop-color="white" stop-opacity=".1"/></linearGradient></defs>';
  for(let i=0;i<4;i++){
   const a=t+i*Math.PI/2,x=Math.round(128+Math.cos(a)*68),y=Math.round(108+Math.sin(a)*42),c=colors[i];
   body+=`<g fill="${c}"><path d="M${i<2?75:181} 0L${x-20} ${y}L${x+20} ${y}z" opacity=".045"/><ellipse cx="${x}" cy="${y}" rx="31" ry="16" opacity=".12"/><ellipse cx="${x}" cy="${y}" rx="19" ry="9" opacity=".1"/></g>`;
   body+=`<ellipse cx="${x}" cy="${y}" rx="35" ry="20" fill="url(#pool)" opacity=".38"/>`;
  }
  // Small slow-moving accents retain a quiet floor glow throughout the loop.
  for(let i=0;i<8;i++){const a=t+i*Math.PI/4,x=Math.round(128+Math.cos(a)*48),y=Math.round(104+Math.sin(a)*27);body+=`<rect x="${x}" y="${y}" width="3" height="2" fill="${colors[i%4]}" opacity=".24"/>`;}
  return body;
 });
 const stageFx=await motion('shore-dj-stage-lights',{x:28,y:9,width:6,height:5},'aboveAvatar',phase=>{
  const t=phase*Math.PI/6;
  let body='';
  // Coordinates follow the alpha-trimmed 192x160 stage export, not the master canvas.
  for(const [i,x]of [42,66,122,137,151].entries())body+=`<circle cx="${x}" cy="35" r="2.4" fill="${colors[i%4]}" opacity="${(.28+.08*Math.sin(t+i)).toFixed(3)}"/>`;
  const x=Math.round(96+Math.cos(t)*6),y=Math.round(40+Math.sin(t)*6);
  body+=`<path d="M${x-2} ${y}h5M${x} ${y-2}v5" stroke="#e9faff" stroke-width="1" opacity=".72"/><circle cx="${96-Math.round(Math.cos(t)*5)}" cy="${40-Math.round(Math.sin(t)*5)}" r="1" fill="#b7f9ff" opacity=".5"/>`;
  for(let i=0;i<4;i++){const h=2+Math.round(2+Math.sin(t+i)*2);body+=`<rect x="${91+i*3}" y="${105-h}" width="1" height="${h}" fill="${i%2?'#91e7d2':'#c8a0ee'}" opacity=".55"/>`;}
  return body;
 });
 const inputs=[MASTER,'tools/art/shore-party.ts','tools/art/native-motion.ts'].map(path=>({path,sha256:hash(readFileSync(path))}));
 for(const fx of [floorFx,stageFx])fx.overlay.provenance={metadataPath:`art/source/${fx.overlay.name}.json`,atlasSha256:hash(fx.png),inputs};
 const metadata={version:1,origin:'Original generated DJ stage with alpha-preserving technical export; original native floor, bunting and slow light overlays.',generation:GENERATION,inputs,stage:{source:MASTER,crop:master.crop,width:192,height:160,sha256:hash(master.png)},atlas:{path:ATLAS,width:384,height:160,sha256:hash(atlasPng)},catalog,overlays:[floorFx.overlay,stageFx.overlay],diagnostics:{floor:floorFx.diagnostics,stage:stageFx.diagnostics}};
 return {atlasPng,catalog,floorFx,stageFx,metadata};
}

/** Writes only this exporter's three atlases and four provenance records. */
export async function writeShoreParty(){
 const result=await renderShoreParty();
 const generation={version:1,source:MASTER,sourceSha256:result.metadata.inputs[0].sha256,method:'Original image-generation output for the requested tropical DJ stage. Transparent master retained unchanged; export uses alpha bounds and proportional resize only.',generatedFeatures:['DJ decks','speaker stacks','lighting truss','disco ball','tropical bunting'],nativeShapes:['walkable wood deck','low beach bunting','small sign panel','slow colored floor pools','disco glints and meter lights'],externalAssets:[],producer:'tools/art/shore-party.ts'};
 await writeFile(ATLAS,result.atlasPng);
 await writeFile(result.floorFx.overlay.image,result.floorFx.png);
 await writeFile(result.stageFx.overlay.image,result.stageFx.png);
 for(const fx of [result.floorFx,result.stageFx])await writeFile(fx.overlay.provenance!.metadataPath,JSON.stringify({version:1,overlay:fx.overlay,diagnostics:fx.diagnostics},null,2)+'\n');
 await writeFile(META,JSON.stringify(result.metadata,null,2)+'\n');
 await writeFile(GENERATION,JSON.stringify(generation,null,2)+'\n');
 return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await writeShoreParty();
