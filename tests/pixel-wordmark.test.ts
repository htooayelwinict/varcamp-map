import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {describe,it,expect} from 'vitest';
import sharp from 'sharp';
import {renderEventIdentity,checkEventIdentityArt} from '../tools/art/event-identity';
import {eventIdentitySuccessorSha,eventIdentityRegistration,eventIdentityRegistrySuccessor} from './helpers/event-identity-history';

const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const fixture=readFileSync('tests/fixtures/bold-wordmark/before.json.gz');
if(sha(fixture)!=='00b915f1aa9fe14f43819e4ab2072950609447902bd349016a4153ff73cb3f47')throw Error('Frozen wordmark predecessor changed');
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

describe('Reference-style bold VarCamp wordmark',()=>{
 it('exports uppercase Russo One lettering with a pinned local font and no runtime font dependency',async()=>{
  const r=await renderEventIdentity();
  expect(r.metadata).toMatchObject({version:4,typography:{text:'VARCAMP',style:'bold-squared',family:'Russo One',source:'art/source/event-identity/RussoOne-Regular.ttf'}});
  expect(sha(readFileSync('art/source/event-identity/RussoOne-Regular.ttf'))).toBe('bc0abcc660bd8b7ad3000ecb2898a27c58a29a50f7ec81652fa12e75148d09df');
  expect(readFileSync('art/source/event-identity/OFL.txt','utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1');
  const source=JSON.parse(readFileSync('art/sources.json','utf8'))['varcamp-event-identity'];
  expect(source.changes).toContain('Font by Jovanny Lemonad under SIL OFL 1.1');
  expect(readFileSync('assets/tilesets/varcamp-event-identity/OFL.txt')).toEqual(readFileSync('art/source/event-identity/OFL.txt'));
  expect(r.svg).toContain('data-wordmark="VARCAMP"');
  expect(r.svg).not.toMatch(/<text\b|@font-face|font-family/);
 });
 it('keeps seven bold white letters at all three native sizes and seamless arrival panels',async()=>{
  const r=await renderEventIdentity();
  const originals=['nw','ne','sw','se'].map(key=>`assets/sponsors/varcamp-arrival-${key}.png`).map(path=>({path,png:old(path)}));
  const cases=[{now:await joinPanels(r.logos),prior:await joinPanels(originals),width:384,height:128,x:90,y:25,w:294,h:50},
   {now:await sharp(r.brand).ensureAlpha().raw().toBuffer(),prior:await sharp(old('assets/sponsors/varcamp-2026.png')).ensureAlpha().raw().toBuffer(),width:192,height:64,x:45,y:12,w:147,h:25},
   {now:await sharp(r.booth).ensureAlpha().raw().toBuffer(),prior:await sharp(old('assets/sponsors/varcamp-horizontal.png')).ensureAlpha().raw().toBuffer(),width:128,height:64,x:31,y:18,w:97,h:29}];
  for(const c of cases){
   let changed=0,ink=0,oldInk=0;const inkPixels=new Set<number>();
   expect(c.now.length).toBe(c.width*c.height*4);
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const i=(y*c.width+x)*4,inside=x>=c.x&&x<c.x+c.w&&y>=c.y&&y<c.y+c.h;
    if(!inside)continue;
    if(!c.now.subarray(i,i+4).equals(c.prior.subarray(i,i+4)))changed++;
    if(c.now[i+3]>192){ink++;inkPixels.add(y*c.width+x);expect([...c.now.subarray(i,i+3)]).toEqual([255,255,255]);}
    if(c.prior[i+3]>192)oldInk++;
   }
   expect(changed,`${c.width}px changed lettering`).toBeGreaterThan(100);
   expect(ink,`${c.width}px heavier lettering than the prior thin pixel font`).toBeGreaterThan(oldInk*1.15);
   // Kerning may overlap glyph bounding columns (notably VA); count actual
   // connected ink shapes instead of requiring rectangular gaps between them.
   let components=0;
   while(inkPixels.size){
    const seed=inkPixels.values().next().value!;inkPixels.delete(seed);const queue=[seed];components++;
    for(let i=0;i<queue.length;i++)for(const offset of [-c.width,-1,1,c.width]){
     const next=queue[i]+offset;if(inkPixels.delete(next))queue.push(next);
    }
   }
   expect(components,`${c.width}px seven separate readable letters`).toBe(7);
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
