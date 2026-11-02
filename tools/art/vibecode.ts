import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import sharp from 'sharp';
import data from '../../world/vibecode-branding.json';
import {renderCaptionMaster,type CaptionSpec,type CaptionRow} from './standing-captions';
import type {MapLayout,LayoutSign} from '../maps/types';
import {isEventPresentation,restoreEventPresentation} from '../maps/event-presentation';
import {eventCaptionResource,checkEventCaptions} from './event-captions';
export const VIBECODE_IMAGE=data.image;
export const VIBECODE_CAPTION_IMAGE='assets/tilesets/original/vibecode-expo-captions.png';
const original='art/source/sponsors/vibecode-tours-original.svg',panel='art/source/sponsors/vibecode-tours.svg',metaPath='art/source/vibecode-branding.json';
const sha=(v:Buffer|string)=>createHash('sha256').update(v).digest('hex');
const need=(ok:unknown,message:string)=>{if(!ok)throw Error('Vibe Code art: '+message);};
function branded(l:MapLayout){return l.id==='overworld'&&(l.images?.some(i=>i.image===VIBECODE_IMAGE)||l.signs?.some(s=>s.name===data.maps.overworld.afterSign.name&&s.text===data.maps.overworld.afterSign.text));}
/** Read the unchanged historical caption reservation before replacing its single approved label. */
export function beforeVibeCodeCaption(l:MapLayout):MapLayout{
 if(l.id==='overworld'&&isEventPresentation(l))l=restoreEventPresentation(l);
 if(!branded(l))return l;
 const r=data.maps.overworld,next=structuredClone(l),i=next.signs!.findIndex(s=>s.name===r.afterSign.name);
 need(isDeepStrictEqual(next.signs![i],r.afterSign),'caption semantic source changed');next.signs![i]=structuredClone(r.beforeSign) as LayoutSign;return next;
}
type Resource={rows:CaptionRow[];width:number;height:number;image:string;pngSha256:string};
export function vibeCodeCaptionResource(l:MapLayout,r:Resource):Resource{
 if(l.id==='overworld'&&isEventPresentation(l))return eventCaptionResource(l);
 if(!branded(l))return r;
 const meta=JSON.parse(readFileSync(metaPath,'utf8')),png=readFileSync(VIBECODE_CAPTION_IMAGE);
 need(meta.captionSha256===sha(png)&&png.readUInt32BE(16)===r.width&&png.readUInt32BE(20)===r.height,'caption artwork changed');
 const rows=r.rows.map(row=>row.sign.name===data.maps.overworld.beforeSign.name?{...row,sign:structuredClone(data.maps.overworld.afterSign) as LayoutSign}:row);
 return{...r,rows,image:VIBECODE_CAPTION_IMAGE,pngSha256:meta.captionSha256};
}
/** Package the supplied vector unchanged; original pixel glyphs provide a small companion name. */
export async function renderVibeCodeArt(){
 const raw=readFileSync(original);need(sha(raw)===data.originalSha256,'supplied SVG changed');
 const glyphs=JSON.parse(readFileSync('art/source/hub-nameplates.json','utf8')).glyphs as Record<string,string[]>;
 let text='';for(const[word,y,scale,color]of [['VIBE',10,2,'#fff1cd'],['CODE',28,2,'#fff1cd'],['TOURS',49,1,'#fbbf24']] as const){let x=65;for(const char of word){for(const[dy,bits]of glyphs[char].entries())for(let dx=0;dx<5;dx++)if(bits[dx]==='1')text+=`<rect x="${x+dx*scale}" y="${y+dy*scale}" width="${scale}" height="${scale}" fill="${color}"/>`;x+=5*scale+1;}}
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="128" height="64"><image x="8" y="8" width="48" height="48" xlink:href="data:image/svg+xml;base64,${raw.toString('base64')}"/><g shape-rendering="crispEdges">${text}</g></svg>\n`;
 const specs=structuredClone(JSON.parse(readFileSync('art/source/expo-captions.json','utf8')).specs) as CaptionSpec[];
 const label=specs.find(s=>s.map==='overworld'&&s.sign.name===data.maps.overworld.beforeSign.name)!;need(label.sign.text==='YOUR LOGO HERE','prior booth label changed');label.sign.text=data.maps.overworld.afterSign.text;
 const captions=renderCaptionMaster(specs);
 return{svg,png:await sharp(Buffer.from(svg)).png().toBuffer(),captionSvg:captions.svg,caption:await sharp(Buffer.from(captions.svg)).png().toBuffer()};
}
export async function checkVibeCodeArt():Promise<void>{
 await checkEventCaptions();
 const r=await renderVibeCodeArt(),meta=JSON.parse(readFileSync(metaPath,'utf8'));
 need(readFileSync(panel,'utf8')===r.svg&&readFileSync(VIBECODE_IMAGE).equals(r.png),'logo differs from supplied SVG composition');
 need(readFileSync('art/source/vibecode-expo-captions.svg','utf8')===r.captionSvg&&readFileSync(VIBECODE_CAPTION_IMAGE).equals(r.caption),'single booth caption differs from pixel glyph producer');
 need(meta.sourceUrl===data.sourceUrl&&meta.originalSha256===data.originalSha256&&meta.imageSha256===sha(r.png)&&meta.captionSha256===sha(r.caption)&&meta.producerSha256===sha(readFileSync('tools/art/vibecode.ts')),'provenance changed');
}
async function write(){const r=await renderVibeCodeArt();writeFileSync(panel,r.svg);writeFileSync(VIBECODE_IMAGE,r.png);writeFileSync('art/source/vibecode-expo-captions.svg',r.captionSvg);writeFileSync(VIBECODE_CAPTION_IMAGE,r.caption);writeFileSync(metaPath,JSON.stringify({version:1,sourceUrl:data.sourceUrl,originalSha256:data.originalSha256,imageSha256:sha(r.png),captionSha256:sha(r.caption),producerSha256:sha(readFileSync('tools/art/vibecode.ts'))},null,2)+'\n');}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)void write().catch(e=>{console.error(e);process.exitCode=1;});
