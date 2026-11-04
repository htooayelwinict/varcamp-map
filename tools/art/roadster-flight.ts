import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import type {LayoutAnimatedOverlay} from '../maps/types';

export const FLIGHT_ATLAS='assets/tilesets/original/roadster-flight.png';
export const FLIGHT_METADATA='art/source/roadster-flight.json';
export const FLIGHT_AUTHORING='art/source/roadster-flight-authoring.json';
const SIZE=160,PIXELS=SIZE*SIZE,sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const spec=JSON.parse(readFileSync(FLIGHT_AUTHORING,'utf8'));
const PAD='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" shape-rendering="crispEdges"><path d="M18 139H142V150H18Z" fill="#0d1721"/><path d="M20 137H140V146H20Z" fill="#263c4c"/><path d="M24 139H136V141H24Z" fill="#587481"/><path d="M22 139H32V142H22ZM128 139H138V142H128Z" fill="#8fd5df"/><path d="M40 135H120V139H40Z" fill="#102331"/></svg>';
/** Register real roof/side/underbody poses to a common projected longitudinal axis.
 * Principal-axis alignment is a small sheet-registration correction, not the roll animation.
 * Each source cell supplies its own visible surfaces. No painted geometry or interpolated roof. */
async function compilePoses(){
 const {data,info}=await sharp(readFileSync(spec.source)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==info.height||info.width<1024)throw Error('Flight master must be a square 4 by 4 sheet');
 const poses:Buffer[]=[],registration:any[]=[];
 for(let k=0;k<16;k++){
  const left=Math.floor(k%4*info.width/4),top=Math.floor(Math.floor(k/4)*info.height/4),cw=Math.floor((k%4+1)*info.width/4)-left,ch=Math.floor((Math.floor(k/4)+1)*info.height/4)-top,points:{x:number;y:number}[]=[];
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(data[((top+y)*info.width+left+x)*4+3]>=spec.alphaThreshold)points.push({x,y});
  if(points.length<500)throw Error('Empty flight pose '+k);
  const mx=points.reduce((n,p)=>n+p.x,0)/points.length,my=points.reduce((n,p)=>n+p.y,0)/points.length;
  let xx=0,xy=0,yy=0;for(const p of points){xx+=(p.x-mx)**2;xy+=(p.x-mx)*(p.y-my);yy+=(p.y-my)**2;}
  const axis=.5*Math.atan2(2*xy,xx-yy),a=spec.headingDeg*Math.PI/180-axis,ca=Math.cos(a),sa=Math.sin(a),ux=Math.cos(axis),uy=Math.sin(axis);
  let lo=Infinity,hi=-Infinity;for(const p of points){const d=(p.x-mx)*ux+(p.y-my)*uy;lo=Math.min(lo,d);hi=Math.max(hi,d);}
  const scale=spec.bodyLengthPx/(hi-lo),out=Buffer.alloc(PIXELS*4);
  // Inverse nearest-neighbour sampling preserves source pixels and binary alpha.
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const dx=(x-80)/scale,dy=(y-80)/scale,sx=Math.round(mx+ca*dx+sa*dy),sy=Math.round(my-sa*dx+ca*dy);
   if(sx<0||sx>=cw||sy<0||sy>=ch)continue;const si=((top+sy)*info.width+left+sx)*4,di=(y*SIZE+x)*4;
   if(data[si+3]<spec.alphaThreshold)continue;data.copy(out,di,si,si+3);out[di+3]=255;
  }
  poses.push(out);registration.push({cell:k,center:[mx,my],sourceAxisDeg:axis*180/Math.PI,registrationDeg:a*180/Math.PI,scale,sha256:sha(out)});
 }
 return{poses,registration};
}
export interface FlightStep{timeMs:number;durationMs:number;phase:string;pose:number;rollDeg:number;altitudePx:number;bodyY:number;jets:'off'|'lift'|'attitude'|'brake';}
/** C1-continuous altitude, with exactly one apex and a zero-speed touchdown. */
export function flightAltitude(t:number):number{
 const keys=spec.altitudeKeys as number[][];if(t<=0||t>=spec.flightDurationMs)return 0;
 const i=keys.findIndex((k,j)=>j<keys.length-1&&t>=k[0]&&t<=keys[j+1][0]),[t0,h0,v0]=keys[i],[t1,h1,v1]=keys[i+1],d=t1-t0,u=(t-t0)/d;
 return(2*u**3-3*u**2+1)*h0+(u**3-2*u**2+u)*d*v0+(-2*u**3+3*u**2)*h1+(u**3-u**2)*d*v1;
}
export function flightTimeline():FlightStep[]{
 const steps:FlightStep[]=[];
 for(let t=0;t<spec.cycleMs;t+=spec.stepMs){
  const u=t-spec.flightStartMs,air=u>=0&&u<spec.flightDurationMs,rolling=air&&u>=spec.rollStartMs&&u<spec.rollStartMs+spec.rollDurationMs;
  const roll=air?Math.max(0,Math.min(360,(u-spec.rollStartMs)/spec.rollDurationMs*360)):u>=spec.flightDurationMs?360:0;
  const settle=u>=3000&&u<3300?[2,2,1,1,0,0][Math.floor((u-3000)/50)]:0;
  steps.push({timeMs:t,durationMs:spec.stepMs,phase:air?(rolling?'roll':u<spec.rollStartMs?'rise':'descent'):t>=3000&&t<3400?'ignition':settle?'touchdown':'rest',pose:rolling?Math.floor(roll/22.5)%16:0,rollDeg:roll,altitudePx:Number(flightAltitude(u).toFixed(4)),bodyY:Math.round(-flightAltitude(u))+settle,jets:air?(u<400?'lift':u>=2200&&u<2950?'brake':(u>=400&&u<600)||(u>=1800&&u<2000)?'attitude':'off'):t>=3200&&t<3400?'lift':'off'});
 }
 return steps;
}
async function pack(frames:Buffer[],durations:number[]){
 const tiles:Buffer[]=[],known=new Map<string,number>(),sequences:number[][]=Array.from({length:25},()=>[]);
 for(const f of frames)for(let y=0;y<5;y++)for(let x=0;x<5;x++){
  const tile=Buffer.alloc(4096);for(let r=0;r<32;r++)f.copy(tile,r*128,((y*32+r)*160+x*32)*4,((y*32+r)*160+x*32+32)*4);
  const key=sha(tile);let id=known.get(key);if(id===undefined){id=tiles.length;known.set(key,id);tiles.push(tile);}sequences[y*5+x].push(id);
 }
 const uniqueTiles=tiles.length,carrierTileIds:number[]=[],animations:LayoutAnimatedOverlay['animations']=[];
 for(const seq of sequences){const id=tiles.length;carrierTileIds.push(id);tiles.push(Buffer.from(tiles[seq[0]]));animations.push({id,frames:seq.map((tileid,i)=>({tileid,duration:durations[i]}))});}
 const width=512,height=Math.ceil(tiles.length/16)*32;if(height>2048)throw Error('Flight atlas exceeds 4 MiB native bound: '+tiles.length);
 const raw=Buffer.alloc(width*height*4);tiles.forEach((b,i)=>{for(let r=0;r<32;r++)b.copy(raw,((Math.floor(i/16)*32+r)*512+i%16*32)*4,r*128,(r+1)*128);});
 return{png:await sharp(raw,{raw:{width,height,channels:4}}).png().toBuffer(),width,height,tilecount:width*height/1024,uniqueTiles,carrierTileIds,animations};
}
export async function renderRoadsterFlight(){
 const {poses,registration}=await compilePoses(),pad=await sharp(Buffer.from(PAD)).ensureAlpha().raw().toBuffer(),steps=flightTimeline();
 const groundBottom=Math.max(...Array.from({length:PIXELS},(_,i)=>poses[0][i*4+3]?Math.floor(i/SIZE):-1)),anchor=137-groundBottom;
 const frames:Buffer[]=[],receipts:FlightStep[]=[],durations:number[]=[];
 const dot=(f:Buffer,x:number,y:number,color:number[])=>{x=Math.round(x);y=Math.round(y);if(x<1||y<1||x>158||y>153)throw Error('Flight leaves its solid display bay');const o=(y*160+x)*4;f[o]=color[0];f[o+1]=color[1];f[o+2]=color[2];f[o+3]=255;};
 for(const s of steps){
  const f=Buffer.from(pad),body=poses[s.pose],dy=anchor+s.bodyY,cy=80+dy,h=s.altitudePx;
  // The grounded pad never moves. Its shrinking, softer shadow cues height.
  const rx=48-18*h/54;for(let y=136;y<=144;y++)for(let x=24;x<136;x++){const d=((x-80)/rx)**2+((y-140)/4)**2;if(d<1){const o=(y*160+x)*4;for(let c=0;c<3;c++)f[o+c]=Math.round(f[o+c]*(1-(.45-.2*h/54)*(1-d)));}}
  if(s.jets!=='off'){
   const pulse=(s.timeMs/50)%2,attitude=s.jets==='attitude',angle=s.rollDeg*Math.PI/180;
   for(const side of [-1,1]){
    const x0=side<0?53:112,y0=cy+(side<0?25:8),dx=attitude?side*Math.cos(angle)*.7:side*.08,dyJet=attitude?Math.sin(angle)*side:1,len=(s.jets==='brake'?20:15)+pulse*3;
    for(let j=1;j<len;j++)for(let w=-1;w<=1;w++){if(y0+dyJet*j>139)continue;if(j>len*.65&&(j+w+pulse)%3===0)continue;dot(f,x0+dx*j+w,y0+dyJet*j,[202-j*2,235-j,243]);}
   }
  }
  for(let y=0;y<160;y++)for(let x=0;x<160;x++){const o=(y*160+x)*4;if(!body[o+3])continue;dot(f,x,y+dy,[body[o],body[o+1],body[o+2]]);}
  // A short outward cold-gas puff at contact, separate from the car pixels.
  if(s.phase==='touchdown')for(let k=0;k<14;k++){const a=k*Math.PI*2/14,r=26+(s.timeMs-6400)/12;dot(f,80+r*Math.cos(a),139+3*Math.sin(a),[151,176,186]);}
  if(frames.length&&f.equals(frames.at(-1)!)){durations[durations.length-1]+=s.durationMs;receipts.at(-1)!.durationMs+=s.durationMs;}else{frames.push(f);durations.push(s.durationMs);receipts.push({...s});}
 }
 const packed=await pack(frames,durations),inputs=[spec.source,FLIGHT_AUTHORING,'tools/art/roadster-flight.ts','tools/maps/builder.ts','tools/maps/types.ts'];
 const overlay:LayoutAnimatedOverlay={name:'roadster',image:FLIGHT_ATLAS,sourceId:'original',level:'belowAvatar',x:83,y:53,width:5,height:5,carrierTileIds:packed.carrierTileIds,animations:packed.animations,provenance:{metadataPath:FLIGHT_METADATA,atlasSha256:sha(packed.png),inputs:inputs.map(path=>({path,sha256:sha(readFileSync(path))}))}};
 const metadata={version:3,source:{path:spec.source,sha256:sha(readFileSync(spec.source))},authoring:FLIGHT_AUTHORING,framePixels:160,cycleMs:spec.cycleMs,registration,frames:receipts,diagnostics:{uniqueTiles:packed.uniqueTiles,decodedRgbaBytes:packed.width*packed.height*4,rolls:1,axis:'longitudinal',maxAltitudePx:54},atlas:{width:packed.width,height:packed.height,tilecount:packed.tilecount,sha256:sha(packed.png)},overlay};
 return{png:packed.png,metadata,frames,poses,steps};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const r=await renderRoadsterFlight();writeFileSync(FLIGHT_ATLAS,r.png);writeFileSync(FLIGHT_METADATA,JSON.stringify(r.metadata,null,2)+'\n');console.log(JSON.stringify({frames:r.frames.length,...r.metadata.diagnostics}));}
