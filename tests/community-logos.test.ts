import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {eventCaptionResource} from '../tools/art/event-captions';
import sharp from 'sharp';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';

const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const supplied=[
 ['AWS-Usergroup-MYANMAR','1d593f56ee958c0ad3f33f30bbcb729b8595148f0b501814987fa27718017823','partner-aws-ug-mm','Expo / AWS User Group Myanmar'],
 ['BSides-Myanmar','61ef1197c3f5ecb218a3acc490a7a52f5981ee31309a9c81ed079ba5904d72a5','partner-bsides-mm','Expo / BSides Myanmar'],
 ['Open-Source-Robotics-Foundation-For-Myanmar','af49f6db7d366abc79654be01f6f4ba455ead9705e58c6faf87b7da0d0b8fcd5','partner-osrfm','Expo / OSRFM'],
 ['Ten-Ten','29358b45a15021a3c9f7ba91913f2128115bd800167f133473075e78b38dff0e','partner-ten-ten','Expo / Ten Ten'],
] as const;
describe('approved community marks in the expo',()=>{
 it('retains the Info Desk caption while retiring the two old community fascias',()=>{
  const l=read('world/layouts/overworld.json') as MapLayout;
  const resource=eventCaptionResource(l);
  expect(resource.rows.map(r=>r.sign?.name)).toEqual(['expo-n6-nameplate']);
  expect(resource.width).toBe(512);expect(resource.height).toBe(128);
 });
 it('retains every supplied original and records its event permission and native rendition',async()=>{
  const credits=read('art/sponsors.json');
  for(const [file,hash,panel]of supplied){
   const source=`art/source/sponsors/${file}.png`,image=`assets/sponsors/${panel}.png`;
   expect(existsSync(source),source+' missing').toBe(true);
   expect(sha(readFileSync(source))).toBe(hash);
   expect(existsSync(image),image+' missing').toBe(true);
   expect(await sharp(image).metadata()).toMatchObject({format:'png',width:128,height:64,hasAlpha:true});
   const credit=credits.assets.find((a:{image:string})=>a.image===image);
   expect(credit).toMatchObject({source,sourceSha256:hash,kind:'community-partner'});
   expect(credit.permission).toContain('pull/9');expect(credit.license).not.toBe('CC0-1.0');
  }
 });
 it('draws the three current submitted community marks plus Vibe Code Tours with every native cell present',()=>{
  const l=read('world/layouts/overworld.json') as MapLayout,m=read('maps/overworld.tmj') as TiledMap;
  for(const [panel,name]of [...supplied.filter(r=>r[0]!=='Ten-Ten').map(r=>[r[2],r[3]]),['vibecode-tours','Expo / Vibe Code Tours']]){
   const image=l.images!.find(i=>i.name===name);expect(image,name+' absent').toBeDefined();
   expect(image).toMatchObject({image:`assets/sponsors/${panel}.png`,width:4,height:2});
   expect(image!.standing).not.toBe(true);
   const set=m.tilesets.find(t=>t.name===name)!,layer=m.layers.find(t=>t.name===name) as TileLayer;
   expect(set,name+' atlas').toMatchObject({image:`../assets/sponsors/${panel}.png`,tilecount:8,columns:4});
   expect(m.layers.indexOf(layer),name+' renders above avatars').toBeLessThan(m.layers.findIndex(l=>l.name==='floorLayer'));
   for(let y=0;y<2;y++)for(let x=0;x<4;x++)expect(layer.data[(image!.y+y)*m.width+image!.x+x]).toBe(set.firstgid+y*4+x);
  }
 });
 it('gives four equal communities reachable desks and unobscured logos',()=>{
  const l=read('world/layouts/overworld.json') as MapLayout,m=read('maps/overworld.tmj') as TiledMap,c=(m.layers.find(t=>t.name==='physical-collisions') as TileLayer).data;
  const ids=['aws','bsides','vibes','osrfm'];
  const floors=ids.map(id=>l.placements.find(p=>p.id===`sponsor-tier-${id}-floor`));
  expect(floors.every(Boolean),'missing community floor').toBe(true);
  expect(new Set(floors.map(p=>p!.width*p!.height)).size).toBe(1);
  const seen=new Set<number>(),queue=[82*m.width+63];
  for(let i=0;i<queue.length;i++){const n=queue[i];if(seen.has(n)||c[n])continue;seen.add(n);const x=n%m.width,y=Math.floor(n/m.width);for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])if(x+dx>=0&&x+dx<m.width&&y+dy>=0&&y+dy<m.height)queue.push(n+dy*m.width+dx);}
  for(const id of ids){const desk=l.placements.find(p=>p.id===`sponsor-tier-${id}-desk`)!;expect(seen.has((desk.y+desk.height)*m.width+desk.x+1),id+' visitor approach').toBe(true);}
  for(const image of l.images!.filter(i=>supplied.some(r=>r[3]===i.name)||i.name==='Expo / Vibe Code Tours')){
   expect(l.placements.filter(p=>p.layer==='props'&&p.x<image.x+image.width&&image.x<p.x+p.width&&p.y<image.y+image.height&&image.y<p.y+p.height).map(p=>p.id),image.name+' covered').toEqual([]);
  }
 });
});
