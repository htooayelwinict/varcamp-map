import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {renderCaptionMaster} from './standing-captions';
const image='assets/tilesets/original/event-floor-labels.png',svgPath='art/source/event-floor-labels.svg',metaPath='art/source/event-floor-labels.json';
const sha=(v:Buffer|string)=>createHash('sha256').update(v).digest('hex');
const labels=[{text:'COMMUNITY CORNER',width:12,y:16,fontSize:21,color:'#a7c2ce'},{text:'SPONSOR EXPO',width:12,y:80,fontSize:21,color:'#d7b77a'},{text:'CHECK IN',width:3,y:128,fontSize:14,color:'#e1ba7a'}];
async function render(){
 const groups=labels.map((r,i)=>{const s={name:'event-floor-'+i,text:r.text,x:0,y:0,width:r.width,height:1,fontSize:r.fontSize,color:r.color,align:'center'as const,padding:0};const art=renderCaptionMaster([{map:'overworld',face:s.name,sign:s}]).svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');return`<g transform="translate(0 ${r.y})">${art}</g>`;});
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="160" shape-rendering="crispEdges">${groups.join('')}</svg>\n`;
 return{svg,png:await sharp(Buffer.from(svg)).png().toBuffer()};
}
export async function checkEventFloorLabels(){const r=await render(),m=JSON.parse(readFileSync(metaPath,'utf8'));if(readFileSync(svgPath,'utf8')!==r.svg||!readFileSync(image).equals(r.png)||m.producerSha256!==sha(readFileSync('tools/art/event-floor-labels.ts'))||m.pngSha256!==sha(r.png))throw Error('Event floor label pixels/provenance changed');}
async function write(){const r=await render();writeFileSync(svgPath,r.svg);writeFileSync(image,r.png);writeFileSync(metaPath,JSON.stringify({version:1,producerSha256:sha(readFileSync('tools/art/event-floor-labels.ts')),pngSha256:sha(r.png),labels},null,2)+'\n');}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)void write();
