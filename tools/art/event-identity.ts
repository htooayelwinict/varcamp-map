import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {renderArrivalRefresh, ARRIVAL_ROADSTER_METADATA} from './arrival-refresh';

export const EVENT_MARK = 'art/source/event-identity/supplied-flame.png';
export const EVENT_IDENTITY_SVG = 'art/source/event-identity/horizontal.svg';
export const EVENT_IDENTITY_METADATA = 'art/source/event-identity/exports.json';
export const EVENT_WORDMARK = 'art/source/event-identity/pixel-wordmark.json';
const WORDMARK = 'art/source/varcamp-horizontal.svg';
const sha = (bytes:Buffer|string) => createHash('sha256').update(bytes).digest('hex');
const read = (path:string) => JSON.parse(readFileSync(path, 'utf8'));
const need = (ok:unknown, message:string) => { if (!ok) throw Error('Event identity: ' + message); };

/** Integer-grid wordmark; each export uses its own native scale so lettering
 * never passes through a smoothing resize. The supplied flame is separate. */
function pixelLetters(left:number, top:number, scale:number):string {
  const font=read(EVENT_WORDMARK);
  need(font.version===1 && font.text==='VarCamp' && font.width===5 && font.height===9 && font.gap===2, 'pixel wordmark format changed');
  let letters='';
  for(const [i,c] of [...font.text].entries()) {
    const rows=font.glyphs[c];
    need(Array.isArray(rows) && rows.length===9 && rows.every((row:unknown)=>typeof row==='string' && /^[01]{5}$/.test(row)), 'invalid pixel glyph '+c);
    for(const [y,row] of (rows as string[]).entries()) for(let x=0;x<5;x++) if(row[x]==='1') {
      letters+=`<rect x="${left+(i*7+x)*scale}" y="${top+y*scale}" width="${scale}" height="${scale}"/>`;
    }
  }
  return `<g data-wordmark="VarCamp" fill="#ffffff" shape-rendering="crispEdges">${letters}</g>`;
}
const pixelLayer=(width:number,height:number,left:number,top:number,scale:number)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${pixelLetters(left,top,scale)}</svg>`);
async function stampWordmark(png:Buffer,width:number,height:number,left:number,top:number,scale:number):Promise<Buffer> {
  const base=await sharp(png).ensureAlpha().raw().toBuffer();
  const ink=await sharp(pixelLayer(width,height,left,top,scale)).ensureAlpha().raw().toBuffer();
  need(base.length===ink.length && base.length===width*height*4,'wordmark canvas dimensions changed');
  // Copy opaque glyph pixels directly. Alpha compositing the whole image again
  // would round a few existing translucent flame-edge colours.
  for(let i=0;i<ink.length;i+=4) if(ink[i+3]===255) ink.copy(base,i,i,i+4);
  return sharp(base,{raw:{width,height,channels:4}}).png().toBuffer();
}

/** Preserve supplied flame pixels, native footprints and the existing subtitle;
 * replace only the organizer-selected VarCamp lettering. */
export async function renderEventIdentity() {
  const source = readFileSync(EVENT_MARK), original = readFileSync(WORDMARK, 'utf8');
  need(sha(source) === 'ffb579d7e977790707d29abaf7f86c0451703973a6f2ff1805f31aa4442a1aa2', 'owner-supplied master changed');
  need(sha(original) === '05f5ea29e8635156bf4ed74f9e39a6067bb2121ac266db514d7918703924250f', 'retained wordmark changed');
  const {data, info} = await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  need(info.width === 1023 && info.height === 1080, 'supplied master dimensions changed');
  let left=info.width, top=info.height, right=-1, bottom=-1;
  for (let y=0; y<info.height; y++) for (let x=0; x<info.width; x++) {
    if (data[(y*info.width+x)*4+3] === 0) continue;
    left=Math.min(left,x); top=Math.min(top,y); right=Math.max(right,x); bottom=Math.max(bottom,y);
  }
  need(right>left && bottom>top, 'empty supplied master');
  const crop = {left, top, width:right-left+1, height:bottom-top+1};
  // Alpha trim is only an export crop; the supplied source file stays byte-exact.
  const mark = await sharp(source).extract(crop).png().toBuffer();
  const paths = original.match(/<path class="cls-1"[^>]*\/>/g);
  need(paths?.length === 2, 'expected separate flame and wordmark vector paths');
  const flameSvg = original.replace(paths![0], `<image x="0" y="0" width="28" height="32" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,${mark.toString('base64')}"/>`).replace(paths![1],'');
  const flameLockup = await sharp(Buffer.from(flameSvg)).resize(376,85,{fit:'inside'}).png().toBuffer();
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="376" height="85" viewBox="0 0 376 85"><image width="376" height="85" xlink:href="data:image/png;base64,${flameLockup.toString('base64')}"/>${pixelLetters(84,19,6)}</svg>`;
  const glyphs = read('art/source/hub-nameplates.json').glyphs as Record<string,string[]>;
  const text='MYANMAR 2026', scale=2, advance=16, x0=99;
  let letters='';
  for (const [i,c] of [...text].entries()) for (const [y,row] of glyphs[c].entries()) for(let x=0;x<5;x++) {
    if(row[x]==='1') letters+=`<rect x="${x0+i*advance+x*scale}" y="${110+y*scale}" width="2" height="2" fill="#ffffff"/>`;
  }
  const subtitle=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="384" height="128" shape-rendering="crispEdges">${letters}</svg>`);
  const flamePanel=await sharp({create:{width:384,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([{input:flameLockup,left:4,top:21},{input:subtitle,left:0,top:0}]).png().toBuffer();
  const panel=await stampWordmark(flamePanel,384,128,88,40,6);
  const brandBase=await sharp(flamePanel).resize(192,64).png().toBuffer();
  const brand=await stampWordmark(brandBase,192,64,44,20,3);
  const boothLockup=await sharp(Buffer.from(flameSvg)).resize(128,29,{fit:'inside'}).png().toBuffer();
  const boothBase=await sharp({create:{width:128,height:64,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([{input:boothLockup,left:0,top:17}]).png().toBuffer();
  const booth=await stampWordmark(boothBase,128,64,30,22,2);
  const logos=[];
  for(const [i,key] of ['nw','ne','sw','se'].entries()) logos.push({path:`assets/sponsors/varcamp-arrival-${key}.png`,png:await sharp(panel).extract({left:i%2*192,top:Math.floor(i/2)*64,width:192,height:64}).png().toBuffer()});
  const outputs=[{path:'assets/sponsors/varcamp-2026.png',png:brand},{path:'assets/sponsors/varcamp-horizontal.png',png:booth},...logos];
  const metadata={version:2,operation:'Owner-supplied pink flame and MYANMAR 2026 subtitle retained; VarCamp wordmark exported as white integer-grid pixel lettering at each native size',
    typography:{text:'VarCamp',style:'pixel',source:EVENT_WORDMARK,scales:{arrival:6,room:3,booth:2}},
    inputs:[EVENT_MARK,WORDMARK,EVENT_WORDMARK,'art/source/hub-nameplates.json','tools/art/event-identity.ts'].map(path=>({path,sha256:sha(readFileSync(path))})),crop,
    outputs:outputs.map(({path,png})=>({path,width:png.readUInt32BE(16),height:png.readUInt32BE(20),sha256:sha(png)}))};
  return {svg,panel,brand,booth,logos,outputs,metadata};
}

/** Validate the current branding while retaining the original arrival producer
 * as the independent authority for car pixels, placement and animation clocks. */
export async function checkEventIdentityArt():Promise<string[]> {
  try {
    const result=await renderEventIdentity();
    need(readFileSync(EVENT_IDENTITY_SVG,'utf8')===result.svg, 'SVG export differs');
    need(isDeepStrictEqual(read(EVENT_IDENTITY_METADATA),result.metadata), 'export receipt differs');
    const sources=read('art/sources.json'), registration=sources['varcamp-event-identity'];
    need(registration?.licenseFile==='assets/tilesets/varcamp-event-identity/NOTICE.txt', 'owner attribution missing');
    const required=[EVENT_MARK,EVENT_WORDMARK,EVENT_IDENTITY_SVG,EVENT_IDENTITY_METADATA,'tools/art/event-identity.ts',...result.outputs.map(r=>r.path)];
    need(isDeepStrictEqual(registration.files.map((r:any)=>r.path).sort(),required.sort()), 'closed branding registration changed');
    for(const row of registration.files) need(sha(readFileSync(row.path))===row.sha256, 'registered bytes differ: '+row.path);
    for(const row of result.outputs) need(readFileSync(row.path).equals(row.png), 'native export differs: '+row.path);
    const sponsors=read('art/sponsors.json');
    for(const row of result.outputs) {
      const records=sponsors.assets.filter((a:any)=>a.image===row.path);
      need(records.length===1 && records[0].source===EVENT_IDENTITY_SVG && records[0].license==='Organizer-approved event use', 'sponsor provenance differs: '+row.path);
    }
    const arrival=await renderArrivalRefresh();
    need(isDeepStrictEqual(read(ARRIVAL_ROADSTER_METADATA),arrival.roadster.metadata), 'unrelated car placement receipt changed');
    return [];
  } catch(error) { return [String(error)]; }
}

export async function writeEventIdentity() {
  const r=await renderEventIdentity();
  writeFileSync(EVENT_IDENTITY_SVG,r.svg);
  for(const row of r.outputs) writeFileSync(row.path,row.png);
  writeFileSync(EVENT_IDENTITY_METADATA,JSON.stringify(r.metadata,null,2)+'\n');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) await writeEventIdentity();
