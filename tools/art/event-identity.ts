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
export const EVENT_FONT = 'art/source/event-identity/RussoOne-Regular.ttf';
export const EVENT_FONT_LICENSE = 'art/source/event-identity/OFL.txt';
const WORDMARK = 'art/source/varcamp-horizontal.svg';
const sha = (bytes:Buffer|string) => createHash('sha256').update(bytes).digest('hex');
const read = (path:string) => JSON.parse(readFileSync(path, 'utf8'));
const need = (ok:unknown, message:string) => { if (!ok) throw Error('Event identity: ' + message); };

/** Rasterize the bundled face at build time; browsers only receive PNGs. */
async function boldLetters():Promise<Buffer[]> {
  // Sharp can silently fall back when fontfile is missing. Verify the exact
  // unmodified font before invoking its renderer.
  need(sha(readFileSync(EVENT_FONT))==='bc0abcc660bd8b7ad3000ecb2898a27c58a29a50f7ec81652fa12e75148d09df','bundled Russo One font changed');
  need(sha(readFileSync(EVENT_FONT_LICENSE))==='3ac1301549523d9861fedca12871f24e575fbd26d520632fc00ba849b471d275','font license changed');
  const master=await sharp({text:{text:'<span foreground="white">VARCAMP</span>',font:'Russo One 160',fontfile:EVENT_FONT,rgba:true}}).png().toBuffer();
  return Promise.all([266,133,88].map(async width=>{
    const {data,info}=await sharp(master).resize({width}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    // Keep the requested white ink exact after premultiplied-alpha resampling.
    for(let i=0;i<data.length;i+=4)if(data[i+3])data.fill(255,i,i+3);
    return sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
  }));
}
async function stampWordmark(png:Buffer,width:number,height:number,left:number,top:number,letters:Buffer):Promise<Buffer> {
  const base=await sharp(png).ensureAlpha().raw().toBuffer();
  const {data:ink,info}=await sharp(letters).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  need(base.length===width*height*4 && left+info.width<=width && top+info.height<=height,'wordmark canvas dimensions changed');
  // Only copy glyph pixels: re-compositing the complete image would round
  // existing translucent flame edges. The lettering occupies transparent space.
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++) {
    const from=(y*info.width+x)*4,to=((top+y)*width+left+x)*4;
    if(ink[from+3]){need(base[to+3]===0,'wordmark overlaps retained artwork');ink.copy(base,to,from,from+4);}
  }
  return sharp(base,{raw:{width,height,channels:4}}).png().toBuffer();
}

/** Balance the approved flame and lettering within the existing native footprints.
 * The subtitle keeps its original glyphs, centered beneath the wordmark. */
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
  const flame = await sharp(mark).resize({height:74}).png().toBuffer();
  const [arrivalLetters,roomLetters,boothLetters]=await boldLetters();
  const glyphs = read('art/source/hub-nameplates.json').glyphs as Record<string,string[]>;
  const text='MYANMAR 2026', scale=2, advance=16, x0=138;
  let letters='';
  for (const [i,c] of [...text].entries()) for (const [y,row] of glyphs[c].entries()) for(let x=0;x<5;x++) {
    if(row[x]==='1') letters+=`<rect x="${x0+i*advance+x*scale}" y="${80+y*scale}" width="2" height="2" fill="#ffffff"/>`;
  }
  const subtitle=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="384" height="128" shape-rendering="crispEdges">${letters}</svg>`);
  const flamePanel=await sharp({create:{width:384,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([{input:flame,left:20,top:26},{input:subtitle,left:0,top:0}]).png().toBuffer();
  const panel=await stampWordmark(flamePanel,384,128,98,32,arrivalLetters);
  const brandBase=await sharp(flamePanel).resize(192,64).png().toBuffer();
  const brand=await stampWordmark(brandBase,192,64,49,16,roomLetters);
  const boothFlame=await sharp(mark).resize({height:28}).png().toBuffer();
  const boothBase=await sharp({create:{width:128,height:64,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([{input:boothFlame,left:5,top:18}]).png().toBuffer();
  const booth=await stampWordmark(boothBase,128,64,35,26,boothLetters);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="128" height="64" viewBox="0 0 128 64"><image data-wordmark="VARCAMP" width="128" height="64" xlink:href="data:image/png;base64,${booth.toString('base64')}"/></svg>`;
  const logos=[];
  for(const [i,key] of ['nw','ne','sw','se'].entries()) logos.push({path:`assets/sponsors/varcamp-arrival-${key}.png`,png:await sharp(panel).extract({left:i%2*192,top:Math.floor(i/2)*64,width:192,height:64}).png().toBuffer()});
  const outputs=[{path:'assets/sponsors/varcamp-2026.png',png:brand},{path:'assets/sponsors/varcamp-horizontal.png',png:booth},...logos];
  const metadata={version:4,operation:'Approved pink flame and Russo One lettering balanced within the existing native footprints; original MYANMAR 2026 glyphs centered beneath VARCAMP with tighter spacing',
    typography:{text:'VARCAMP',style:'bold-squared',family:'Russo One',source:EVENT_FONT,license:EVENT_FONT_LICENSE,widths:{arrival:266,room:133,booth:88}},
    inputs:[EVENT_MARK,WORDMARK,EVENT_FONT,EVENT_FONT_LICENSE,'art/source/hub-nameplates.json','tools/art/event-identity.ts'].map(path=>({path,sha256:sha(readFileSync(path))})),crop,
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
    const required=[EVENT_MARK,EVENT_WORDMARK,EVENT_FONT,EVENT_FONT_LICENSE,EVENT_IDENTITY_SVG,EVENT_IDENTITY_METADATA,'tools/art/event-identity.ts',...result.outputs.map(r=>r.path)];
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
