import {restoreExpoRoster} from '../tools/maps/expo-roster';
import {beforeExpoRosterNative} from './helpers/expo-roster-history';
import {existsSync,readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {isDeepStrictEqual} from 'node:util';
import sharp from 'sharp';
import {describe,it,expect} from 'vitest';
import {buildMap} from '../tools/maps/builder';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertNativeSourceProjection} from '../tools/maps/native-projection';
import {applySponsorLogos,restoreSponsorLogos} from '../tools/maps/sponsor-logos';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';

const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const current=()=>({layout:read('world/layouts/overworld.json') as MapLayout,native:read('maps/overworld.tmj') as TiledMap});
const before=()=>{
 const bytes=readFileSync('tests/fixtures/sponsor-logos/before.json.gz');
 expect(sha(bytes)).toBe('4cdbd8417abf8b5632022536180dfcbec1fe7408e9f5a1674a27c376d1d5bccc');
 return JSON.parse(gunzipSync(bytes).toString()) as {base:string;layout:MapLayout;native:TiledMap;wamSha256:string};
};
const panels=[
 ['Expo / DigiSec Lab North','sponsor-digisec-north',61,69,6],
 ['Expo / DigiSec Lab South','sponsor-digisec-south',61,71,6],
 ['Expo / Newness','sponsor-newness',46,78,6],
 ['Expo / Lokal Zaytann','sponsor-lokal-zaytann',79,78,4],
] as const;
const originals=[
 ['DigSecLab_Secondary.png','855d08daa0c09a0205e142d48ef9c32ed0a53043b204929fd8484c62e1451c4d'],
 ['newness-white.png','7bae96dd4356e95c8bd9ce720ef4f38ef5a13b5f860065e34f263fbd09a9a3a5'],
 ['LKZT-logo.pdf','923d86718bf4447edbfe7d288715eafb35d269722d6626ba397e9431c339e501'],
] as const;
const hit=(a:{x:number;y:number;width:number;height:number},b:typeof a)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;

describe('official sponsor logos',()=>{
 it('round-trips the finite sponsor-only change and rejects unrelated edits',()=>{
  const b=before(),l=current().layout;
  expect(b.base).toBe('afb7340a3f0b20313d1bec2fd34120761e637d08');
  expect(isDeepStrictEqual(applySponsorLogos(b.layout),l)).toBe(true);
  expect(isDeepStrictEqual(restoreSponsorLogos(l),b.layout)).toBe(true);
  l.entries[0].x++;expect(()=>restoreSponsorLogos(l)).toThrow('unreviewed source layout');
 });

 it('reproduces the native panels from original artwork without editing other assets',()=>{
  const dir=mkdtempSync(join(tmpdir(),'varcamp-tier-logos-'));
  try{
   execFileSync(process.execPath,['tools/art/sponsor-logo-export.mjs','--out',dir],{stdio:'pipe'});
   for(const file of [...panels.map(([,file])=>file),'sponsor-digisec-entrance'])expect(sha(readFileSync(join(dir,file+'.png')))).toBe(sha(readFileSync('assets/sponsors/'+file+'.png')));
  }finally{rmSync(dir,{recursive:true,force:true});}
 },20000);

 it('retains the supplied originals and transparent native panels with owner attribution',async()=>{
  for(const [name,hash]of originals){const p='art/source/sponsors/tier-logos/'+name;expect(existsSync(p),p).toBe(true);expect(sha(readFileSync(p))).toBe(hash);}
  const credits=read('art/sponsors.json');
  for(const [,file,,,width]of panels){
   const image='assets/sponsors/'+file+'.png';expect(existsSync(image),image).toBe(true);
   expect(await sharp(image).metadata()).toMatchObject({width:width*32,height:64,hasAlpha:true});
   const credit=credits.assets.find((a:{image:string})=>a.image===image);
   expect(credit,image+' credit').toBeDefined();expect(credit.license).not.toContain('CC0');expect(credit.sourceUrl).toContain('drive.google.com');
  }
 });

 it('renders each logo in its assigned booth below avatars, with no furniture or text over it',()=>{
  const {layout:l,native:m}=current();
  for(const [name,file,x,y,width]of panels){
   const image=l.images!.find(i=>i.name===name);expect(image,name).toMatchObject({image:'assets/sponsors/'+file+'.png',x,y,width,height:2,standing:false});
   expect(l.placements.filter(p=>p.layer==='props'&&hit(p,image!)).map(p=>p.id),name+' covered by furniture').toEqual([]);
   expect(l.signs!.filter(s=>hit(s,image!)).map(s=>s.name),name+' covered by text').toEqual([]);
   const layer=m.layers.find(l=>l.name===name) as TileLayer,set=m.tilesets.find(t=>t.name===name)!;
   expect(set,name+' native atlas').toMatchObject({image:'../assets/sponsors/'+file+'.png',columns:width,tilecount:width*2});
   expect(m.layers.indexOf(layer)).toBeLessThan(m.layers.findIndex(l=>l.name==='floorLayer'));
   for(let dy=0;dy<2;dy++)for(let dx=0;dx<width;dx++)expect(layer.data[(y+dy)*128+x+dx]).toBe(set.firstgid+dy*width+dx);
  }
  expect(()=>assertNativeSourceProjection(m,buildMap(l,loadTileCatalog()).tmj)).not.toThrow();
 });

 it('rejects missing panels, changed artwork identities and altered collision on a logo',()=>{
  const {layout:l,native:m}=current(),source=buildMap(l,loadTileCatalog()).tmj;
  for(const change of [
   (v:TiledMap)=>{v.layers=v.layers.filter(p=>p.name!==panels[0][0]);},
   (v:TiledMap)=>{v.tilesets.find(t=>t.name===panels[2][0])!.image='../assets/sponsors/partner-bsides-mm.png';},
   (v:TiledMap)=>{(v.layers.find(t=>t.name==='physical-collisions') as TileLayer).data[70*128+63]=v.tilesets.find(t=>t.name==='navigation-mask')!.firstgid+1;},
  ]){const bad=structuredClone(m);change(bad);expect(()=>assertNativeSourceProjection(bad,source)).toThrow();}
 });

 it('adds only the three sponsors and moves one small table clear of the Spark logo',()=>{
  const actual=current(),l=restoreExpoRoster(actual.layout),m=beforeExpoRosterNative(actual.native),b=before(),restored=structuredClone(l);
  expect(l.images!.slice(b.layout.images!.length).map(i=>i.name)).toEqual(panels.map(p=>p[0]));
  restored.images=restored.images!.slice(0,b.layout.images!.length);
  const table=restored.placements.find(p=>p.id==='sponsor-tier-spark-table')!;
  expect(table).toMatchObject({x:52,y:79,width:1,height:1});table.x=51;
  expect(isDeepStrictEqual(restored,b.layout),'unrelated layout changes or Duwun additions').toBe(true);
  expect(isDeepStrictEqual(m.tilesets.slice(0,-4),b.native.tilesets),'old atlas reservations').toBe(true);
  expect(isDeepStrictEqual(m.layers.filter(l=>l.type==='objectgroup'),b.native.layers.filter(l=>l.type==='objectgroup')),'saved controls').toBe(true);
  expect(isDeepStrictEqual(m.properties,b.native.properties)).toBe(true);
  expect(sha(readFileSync('maps/overworld.wam'))).toBe(b.wamSha256);
  const mask=(v:TiledMap)=>(v.layers.find(l=>l.name==='physical-collisions') as TileLayer).data;
  const changed=mask(m).flatMap((v,i)=>v!==mask(b.native)[i]?[i]:[]);
  expect(changed.every(i=>[79*128+51,79*128+52].includes(i)),'collision changed outside the moved table').toBe(true);
  for(let y=65;y<90;y++)for(let x=62;x<66;x++)expect(mask(m)[y*128+x],`central route ${x},${y}`).toBe(0);
 });
});
