import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {it,expect} from 'vitest';
import sharp from 'sharp';
import {renderEventIdentity} from '../tools/art/event-identity';

const fixtureBytes=readFileSync('tests/fixtures/wordmark-alignment/before.json.gz');
if(createHash('sha256').update(fixtureBytes).digest('hex')!=='7f04d4898e9fb153eb991791e575c55f7bf8ca69ad54be96ff73a2c7109df652')throw Error('Frozen alignment predecessor changed');
const fixture=JSON.parse(gunzipSync(fixtureBytes).toString());
type Box={left:number;top:number;width:number;height:number;cx:number;cy:number};
async function measure(png:Buffer,subtitle:boolean){
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const box=(accept:(r:number,g:number,b:number,x:number,y:number)=>boolean):Box=>{
  let left=info.width,top=info.height,right=-1,bottom=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
   const i=(y*info.width+x)*4;
   if(data[i+3]>128&&accept(data[i],data[i+1],data[i+2],x,y)){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  }
  expect(right).toBeGreaterThanOrEqual(left);
  return {left,top,width:right-left+1,height:bottom-top+1,cx:(left+right)/2,cy:(top+bottom)/2};
 };
 const whiteRows:number[]=[];
 for(let y=0;y<info.height;y++)if(data.subarray(y*info.width*4,(y+1)*info.width*4).some((v,i,a)=>i%4===0&&v>240&&a[i+1]>240&&a[i+2]>240&&a[i+3]>128))whiteRows.push(y);
 let split=info.height;
 if(subtitle){const gap=whiteRows.findIndex((y,i)=>i>0&&y>whiteRows[i-1]+1);expect(gap).toBeGreaterThan(0);split=whiteRows[gap];}
 const title=box((r,g,b,_x,y)=>r>240&&g>240&&b>240&&y<split);
 return {info,title,flame:box((r,g)=>r>g*1.3),all:box(()=>true),subtitle:subtitle?box((r,g,b,_x,y)=>r>240&&g>240&&b>240&&y>=split):undefined};
}

it('centers the subtitle beneath the wordmark and balances both lines beside the flame',async()=>{
 const r=await renderEventIdentity();
 for(const png of [r.panel,r.brand]){
  const m=await measure(png,true),sub=m.subtitle!;
  expect(Math.abs(m.title.cx-sub.cx),'subtitle horizontal alignment').toBeLessThanOrEqual(1);
  expect(Math.abs((m.title.top+sub.top+sub.height-1)/2-m.flame.cy),'two-line block vertical alignment').toBeLessThanOrEqual(1);
  const gap=sub.top-(m.title.top+m.title.height);
  expect(gap/sub.height,'tight but legible line spacing').toBeGreaterThanOrEqual(0.5);
  expect(gap/sub.height,'tight but legible line spacing').toBeLessThanOrEqual(1);
  expect(m.title.width/m.info.width,'wordmark breathing room').toBeGreaterThanOrEqual(0.65);
  expect(m.title.width/m.info.width,'wordmark breathing room').toBeLessThanOrEqual(0.72);
  expect(Math.abs(m.all.cx-(m.info.width-1)/2),'balanced horizontal margins').toBeLessThanOrEqual(1);
  expect(Math.abs(m.all.cy-(m.info.height-1)/2),'balanced vertical margins').toBeLessThanOrEqual(1);
 }
});

it('centers the compact single-line booth lockup with clear icon-to-text spacing',async()=>{
 const m=await measure((await renderEventIdentity()).booth,false);
 expect(Math.abs(m.title.cy-m.flame.cy)).toBeLessThanOrEqual(1);
 expect(Math.abs(m.all.cx-(m.info.width-1)/2)).toBeLessThanOrEqual(1);
 expect(Math.abs(m.all.cy-(m.info.height-1)/2)).toBeLessThanOrEqual(1);
 expect(m.title.left-(m.flame.left+m.flame.width)).toBeGreaterThanOrEqual(5);
 expect(m.title.width/m.info.width).toBeLessThanOrEqual(0.71);
});

it('preserves the original subtitle glyphs at their newly aligned position and all native footprints',async()=>{
 const r=await renderEventIdentity(),m=await measure(r.panel,true),b=m.subtitle!;
 const oldPanel=await sharp({create:{width:384,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(['nw','ne','sw','se'].map((key,i)=>({input:Buffer.from(fixture.assets[`assets/sponsors/varcamp-arrival-${key}.png`],'base64'),left:i%2*192,top:Math.floor(i/2)*64}))).png().toBuffer();
 const oldSubtitle=await sharp(oldPanel).extract({left:99,top:110,width:186,height:14}).raw().toBuffer();
 const newSubtitle=await sharp(r.panel).extract({left:b.left,top:b.top,width:b.width,height:b.height}).raw().toBuffer();
 expect([b.width,b.height]).toEqual([186,14]);
 expect(newSubtitle).toEqual(oldSubtitle);
 for(const row of r.outputs){const old=await sharp(Buffer.from(fixture.assets[row.path],'base64')).metadata();const now=await sharp(row.png).metadata();expect([now.width,now.height,now.hasAlpha]).toEqual([old.width,old.height,true]);}
 for(const[path,pin]of Object.entries(fixture.unchanged))expect(createHash('sha256').update(readFileSync(path)).digest('hex'),path).toBe(pin);
});
