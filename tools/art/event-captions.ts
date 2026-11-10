import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import sharp from 'sharp';
import data from '../../world/event-presentation.json';
import {renderCaptionMaster,type CaptionSpec} from './standing-captions';
import type {MapLayout} from '../maps/types';
import {checkEventFloorLabels} from './event-floor-labels';
import {isSponsorTiers,restoreSponsorTiers} from '../maps/sponsor-tiers';
export const EVENT_CAPTION_IMAGE='assets/tilesets/original/event-expo-captions.png';
const metaPath='art/source/event-expo-captions.json',svgPath='art/source/event-expo-captions.svg';
const sha=(v:Buffer|string)=>createHash('sha256').update(v).digest('hex');
function specs():CaptionSpec[]{
 const changes=data.maps.overworld.changes;
 return changes.standingSigns.after.filter(l=>'text'in l).map(l=>({map:'overworld',face:l.face,sign:changes.signs.after.find(s=>s.name===l.text)!})) as CaptionSpec[];
}
function artwork(){const r=renderCaptionMaster(specs());return{...r,height:128,svg:r.svg.replace(`height="${r.height}"`,`height="128"`)};}
export function eventCaptionResource(layout:MapLayout){
 const current=layout,tiers=isSponsorTiers(layout);
 if(tiers)layout=restoreSponsorTiers(layout);
 const r=artwork(),meta=JSON.parse(readFileSync(metaPath,'utf8')),png=readFileSync(EVENT_CAPTION_IMAGE);
 if(meta.producerSha256!==sha(readFileSync('tools/art/event-captions.ts'))||meta.sourceSha256!==sha(readFileSync('world/event-presentation.json'))||meta.pngSha256!==sha(png)||meta.svgSha256!==sha(r.svg)||readFileSync(svgPath,'utf8')!==r.svg||png.readUInt32BE(16)!==512||png.readUInt32BE(20)!==128)throw Error('Event caption provenance changed');
 const actual=(layout.standingSigns??[]).filter(l=>l.text!==undefined).map(l=>({map:layout.id,face:l.face,sign:layout.signs!.find(s=>s.name===l.text)!}));
 if(!isDeepStrictEqual(actual,specs()))throw Error('Event caption source changed');
 const rows=tiers?r.rows.map(row=>({...row,sign:structuredClone(current.signs!.find(s=>s.name===row.sign.name)!)})):r.rows;
 return{rows,width:512,height:128,image:EVENT_CAPTION_IMAGE,pngSha256:meta.pngSha256};
}
export async function checkEventCaptions(){const r=artwork(),png=await sharp(Buffer.from(r.svg)).png().toBuffer();if(!readFileSync(EVENT_CAPTION_IMAGE).equals(png))throw Error('Event caption pixels changed');await checkEventFloorLabels();}
async function write(){const r=artwork(),png=await sharp(Buffer.from(r.svg)).png().toBuffer();writeFileSync(EVENT_CAPTION_IMAGE,png);writeFileSync(svgPath,r.svg);writeFileSync(metaPath,JSON.stringify({version:1,producerSha256:sha(readFileSync('tools/art/event-captions.ts')),sourceSha256:sha(readFileSync('world/event-presentation.json')),svgSha256:sha(r.svg),pngSha256:sha(png)},null,2)+'\n');}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)void write();
