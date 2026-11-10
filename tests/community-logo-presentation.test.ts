import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
import {describe,it,expect} from 'vitest';
import type {MapLayout,TiledMap,ObjectLayer} from '../tools/maps/types';

const panels=[
 ['partner-aws-ug-mm',4929/3533],
 ['partner-bsides-mm',292/154],
 ['partner-osrfm',1185/889],
 ['partner-ten-ten',530/612],
] as const;
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const ids=['aws','bsides','vibes','osrfm','ten-ten'];

describe('community logos and readable booth captions',()=>{
 it('preserves transparent backgrounds instead of flattening marks onto rectangular cards',async()=>{
  for(const [panel]of panels){
   const {data,info}=await sharp(`assets/sponsors/${panel}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   for(const [x,y]of [[0,0],[127,0],[0,63],[127,63]])expect(data[(y*info.width+x)*4+3],panel+' opaque backing').toBe(0);
   let clear=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)clear++;
   expect(clear/(info.width*info.height),panel+' rectangular fill').toBeGreaterThan(.15);
  }
 });

 it('gives the visible marks a balanced size and optical center without stretching their shape',async()=>{
  for(const [panel,ratio]of panels){
   const {data,info}=await sharp(`assets/sponsors/${panel}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   let left=info.width,top=info.height,right=-1,bottom=-1;
   for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   const w=right-left+1,h=bottom-top+1;
   expect(h,panel+' visible height').toBeGreaterThanOrEqual(52);expect(h,panel+' visible height').toBeLessThanOrEqual(56);
   expect(Math.abs((left+right)/2-63.5),panel+' horizontal center').toBeLessThanOrEqual(1);
   expect(Math.abs((top+bottom)/2-31.5),panel+' vertical center').toBeLessThanOrEqual(1);
   expect(Math.abs(w/h-ratio),panel+' stretched shape').toBeLessThan(.06);
  }
 });

 it('can reproduce every published rendition from the supplied PNG without editing the originals',()=>{
  const dir=mkdtempSync(join(tmpdir(),'varcamp-community-logos-'));
  try{
   const result=spawnSync(process.execPath,['tools/art/community-logo-export.mjs','--out',dir],{encoding:'utf8',timeout:30000});
   expect(result.status,result.stderr).toBe(0);
   for(const [panel]of panels)expect(readFileSync(join(dir,panel+'.png')).equals(readFileSync(`assets/sponsors/${panel}.png`)),panel+' unreproducible export').toBe(true);
  }finally{rmSync(dir,{recursive:true,force:true});}
 });

 it('uses one readable single-line caption style beneath each logo, away from desks',()=>{
  const l=read('world/layouts/overworld.json') as MapLayout,m=read('maps/overworld.tmj') as TiledMap;
  const labels=(m.layers.find(l=>l.name==='wayfinding-text') as ObjectLayer).objects;
  const hit=(a:{x:number;y:number;width:number;height:number},b:typeof a)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
  for(const id of ids){
   const floor=l.placements.find(p=>p.id===`sponsor-tier-${id}-floor`)!;
   const sign=l.signs!.find(s=>s.name===`sponsor-tier-${id}-name`)!;
   expect(sign).toMatchObject({x:floor.x,y:86,width:6,height:1,fontSize:16,align:'center',padding:4,color:'#f1d9a0'});
   expect(sign.text).not.toContain('\n');
   expect(l.placements.filter(p=>p.layer==='props'&&hit(p,sign)).map(p=>p.id)).toEqual([]);
   expect(l.images!.filter(i=>hit(i,sign)).map(i=>i.name)).toEqual([]);
   expect(labels.find(o=>o.name===sign.name)?.text).toMatchObject({fontfamily:'Arial',pixelsize:16,halign:'center',color:'#f1d9a0',text:sign.text});
  }
 });

 it('centers the actual single-line glyphs with the pinned WorkAdventure renderer',()=>{
  // TextUtils uses width for wrapping, not fixedWidth. halign alone cannot
  // center a single line. These are the native Chromium 16px Arial metrics.
  const widths=[149.3359375,143.7265625,147.2890625,57.7734375,68.4453125];
  const l=read('world/layouts/overworld.json') as MapLayout,m=read('maps/overworld.tmj') as TiledMap;
  const labels=(m.layers.find(l=>l.name==='wayfinding-text') as ObjectLayer).objects;
  for(const [index,id]of ids.entries()){
   const floor=l.placements.find(p=>p.id===`sponsor-tier-${id}-floor`)!;
   const label=labels.find(o=>o.name===`sponsor-tier-${id}-name`)!;
   expect(Math.abs(label.x+widths[index]/2-(floor.x+floor.width/2)*32),id+' rendered center').toBeLessThanOrEqual(1);
   expect(label.width,id+' wrap width').toBeGreaterThanOrEqual(widths[index]);
  }
 });
});
