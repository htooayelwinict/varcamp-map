import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import sharp from 'sharp';
import {renderNativeMotion} from './native-motion';

export const HARBOUR_PLANE_META='art/source/harbour-plane.json';
const image='assets/tilesets/original/harbour-plane.png';
const posePath='art/source/coastal-flight-plane.png';
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
/** Restore the existing aircraft at native scale, without the retired demo banner. */
export async function renderHarbourPlane(){
 const {data,info}=await sharp(posePath).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==192||info.height!==96)throw Error('Original 192 x 96 plane required');
 const stepMs=100,phaseCount=(1536+192)/8;
 const motion=await renderNativeMotion({name:'coastal-flight',image,sourceId:'original',level:'aboveScenery',rect:{x:0,y:5,width:48,height:3},stepMs,periodMs:phaseCount*stepMs,poses:[{width:192,height:96,rgba:data}],tracks:[{id:'harbour-plane',samples:Array.from({length:phaseCount},(_,i)=>({x:((512+i*8)%(1536+192))-192,y:0,pose:0}))}]});
 const inputs=[posePath,'tools/art/harbour-plane.ts','tools/art/native-motion.ts'].map(path=>({path,sha256:hash(readFileSync(path))}));
 motion.overlay.provenance={metadataPath:HARBOUR_PLANE_META,atlasSha256:hash(motion.png),inputs};
 return {...motion,metadata:{version:1,description:'Original native aircraft only; no advertising banner.',inputs,overlay:motion.overlay,diagnostics:motion.diagnostics}};
}
export async function writeHarbourPlane(){const r=await renderHarbourPlane();writeFileSync(image,r.png);writeFileSync(HARBOUR_PLANE_META,JSON.stringify(r.metadata,null,2)+'\n');return r.overlay;}
export async function checkHarbourPlane(){const r=await renderHarbourPlane();if(!readFileSync(image).equals(r.png)||!isDeepStrictEqual(JSON.parse(readFileSync(HARBOUR_PLANE_META,'utf8')),r.metadata))throw Error('Harbour aircraft pixels/clock/provenance changed');}
