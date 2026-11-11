import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {describe,it,expect} from 'vitest';
import sharp from 'sharp';
import {renderEventIdentity,checkEventIdentityArt} from '../tools/art/event-identity';
import {eventIdentitySuccessorSha,eventIdentityRegistration,eventIdentityRegistrySuccessor} from './helpers/event-identity-history';

const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const fixture=readFileSync('tests/fixtures/pixel-wordmark/before.json.gz');
if(sha(fixture)!=='7ce4a3cea33287b214bb1809f8eb41dc40e5a343b4f3f2044bdfe4e4c0fb4882')throw Error('Frozen wordmark predecessor changed');
const before=JSON.parse(gunzipSync(fixture).toString()) as {assets:Record<string,string>;unchanged:Record<string,string>};
const old=(path:string)=>Buffer.from(before.assets[path],'base64');
async function joinPanels(rows:{path:string;png:Buffer}[]){
 const joined=Buffer.alloc(384*128*4);
 for(const[i,row]of rows.entries()){
  const data=await sharp(row.png).ensureAlpha().raw().toBuffer();
  for(let y=0;y<64;y++)data.copy(joined,((Math.floor(i/2)*64+y)*384+i%2*192)*4,y*192*4,(y+1)*192*4);
 }
 return joined;
}

describe('Readable VarCamp pixel wordmark',()=>{
 it('exports titlecase pixel typography without a runtime font dependency',async()=>{
  const r=await renderEventIdentity();
  expect(r.metadata).toMatchObject({version:2,typography:{text:'VarCamp',style:'pixel',source:'art/source/event-identity/pixel-wordmark.json'}});
  expect(r.svg).toContain('data-wordmark="VarCamp"');
  expect(r.svg).not.toMatch(/<text\b|@font-face|font-family/);
 });
 it('changes only white lettering pixels; keeps flame, subtitle, alpha, size and panel seams exact',async()=>{
  const r=await renderEventIdentity();
  const originals=Object.keys(before.assets).filter(p=>p.includes('/varcamp-arrival-')).map(path=>({path,png:old(path)}));
  const cases=[{now:await joinPanels(r.logos),prior:await joinPanels(originals),width:384,height:128,x:80,y:21,w:304,h:85,scale:6,gx:88,gy:40},
   {now:await sharp(r.brand).ensureAlpha().raw().toBuffer(),prior:await sharp(old('assets/sponsors/varcamp-2026.png')).ensureAlpha().raw().toBuffer(),width:192,height:64,x:40,y:10,w:152,h:44,scale:3,gx:44,gy:20},
   {now:await sharp(r.booth).ensureAlpha().raw().toBuffer(),prior:await sharp(old('assets/sponsors/varcamp-horizontal.png')).ensureAlpha().raw().toBuffer(),width:128,height:64,x:27,y:17,w:101,h:29,scale:2,gx:30,gy:22}];
  for(const c of cases){
   let changed=0,ink=0,partial=0,badOutside=0;
   expect(c.now.length).toBe(c.width*c.height*4);
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const i=(y*c.width+x)*4,inside=x>=c.x&&x<c.x+c.w&&y>=c.y&&y<c.y+c.h;
    if(!inside){if(!c.now.subarray(i,i+4).equals(c.prior.subarray(i,i+4)))badOutside++;continue;}
    if(!c.now.subarray(i,i+4).equals(c.prior.subarray(i,i+4)))changed++;
    const glyphBox=x>=c.gx&&x<c.gx+47*c.scale&&y>=c.gy&&y<c.gy+9*c.scale;
    if(glyphBox&&c.now[i+3]>0){ink++;if(c.now[i+3]!==255||c.now[i]!==255||c.now[i+1]!==255||c.now[i+2]!==255)partial++;}
   }
   expect(badOutside,`${c.width}px preserved flame/subtitle`).toBe(0);
   expect(changed,`${c.width}px changed lettering`).toBeGreaterThan(100);
   expect(ink,`${c.width}px visible white letters`).toBeGreaterThan(250);
   expect(partial,`${c.width}px crisp opaque pixel lettering`).toBe(0);
   // Each occupied glyph cell must be a solid integer-sized square at native resolution.
   for(let y=c.gy;y<c.gy+9*c.scale;y+=c.scale)for(let x=c.gx;x<c.gx+47*c.scale;x+=c.scale){
    const alpha=c.now[(y*c.width+x)*4+3];
    for(let yy=0;yy<c.scale;yy++)for(let xx=0;xx<c.scale;xx++)expect(c.now[((y+yy)*c.width+x+xx)*4+3]).toBe(alpha);
   }
  }
  expect(await joinPanels(r.logos)).toEqual(await sharp(r.panel).ensureAlpha().raw().toBuffer());
 });
 it('keeps every protected map, saved control, placement and original source byte-identical',()=>{
  expect(Object.keys(before.unchanged)).toHaveLength(141);
  for(const[path,pin]of Object.entries(before.unchanged))expect(sha(readFileSync(path)),path).toBe(pin);
 });
 it('reproduces all current native files and complete owner-provenance receipts',async()=>{
  const r=await renderEventIdentity();
  for(const row of r.outputs)expect(readFileSync(row.path).equals(row.png),row.path).toBe(true);
  expect(await checkEventIdentityArt()).toEqual([]);
 });
 it('admits only the reviewed artwork successor in historical provenance checks',()=>{
  for(const path of Object.keys(before.assets))expect(eventIdentitySuccessorSha(path,sha(old(path))),path).toBe(sha(readFileSync(path)));
  const sources=JSON.parse(readFileSync('art/sources.json','utf8'));
  expect(eventIdentityRegistrySuccessor('varcamp-event-identity',eventIdentityRegistration)).toEqual(sources['varcamp-event-identity']);
  expect(eventIdentitySuccessorSha('unrelated.png','unreviewed-pin')).toBe('unreviewed-pin');
 });
});
