import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import type {Sprite} from './catalog';
import {SIGN_IDS} from '../../src/world/catalog';
import {renderEventIdentity, EVENT_MARK} from './event-identity';

const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const inputs={
 zodiac:{path:'art/source/plaza-original/zodiac-approved-master.png',width:1448,height:1086},
 brand:{path:'art/source/plaza-original/varcamp-approved-master.png',width:2172,height:724},
};
export function zodiacEmblemSprites():Record<string,Sprite>{return Object.fromEntries(SIGN_IDS.map((sign,i)=>[`zodiac-emblem-${sign}`,{sheet:'assets/tilesets/original/zodiac-emblems.png',rect:{x:i%4*4,y:Math.floor(i/4)*4,width:4,height:4},blockingCells:[],level:'belowAvatar',sourceId:'zodiac-emblems'}]));}
/** Technical export only. The approved subjects, source alpha and aspect ratio are retained. */
export async function renderPlazaIdentity(){
 const source=Object.fromEntries(Object.entries(inputs).map(([id,s])=>[id,{...s,sha256:hash(readFileSync(s.path))}]));
 for(const s of Object.values(inputs)){
  const m=await sharp(s.path).metadata();
  if(m.width!==s.width||m.height!==s.height||!m.hasAlpha)throw Error(`Reviewed original master dimensions/alpha changed: ${s.path}`);
 }
 const zodiac=await sharp(inputs.zodiac.path).resize(512,384,{kernel:'nearest'}).png().toBuffer();
 const brand=(await renderEventIdentity()).brand;
 const metadata={version:2,operation:'Original zodiac nearest-neighbor export retained; event lockup uses the owner-supplied pink flame and reference-style bold uppercase wordmark',inputs:{...source,eventMark:{path:EVENT_MARK,sha256:hash(readFileSync(EVENT_MARK))}},
  exports:{zodiac:{path:'assets/tilesets/original/zodiac-emblems.png',width:512,height:384,cellWidth:128,cellHeight:128,sha256:hash(zodiac)},brand:{path:'assets/sponsors/varcamp-2026.png',width:192,height:64,sha256:hash(brand)}}};
 return {zodiac,brand,metadata};
}
export async function writePlazaIdentity(){
 const r=await renderPlazaIdentity();
 writeFileSync(r.metadata.exports.zodiac.path,r.zodiac);writeFileSync(r.metadata.exports.brand.path,r.brand);
 writeFileSync('art/source/plaza-generated.json',JSON.stringify(r.metadata,null,2)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await writePlazaIdentity();
