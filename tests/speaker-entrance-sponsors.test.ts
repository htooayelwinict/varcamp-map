import {readFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {describe,it,expect} from 'vitest';
import {SIGN_IDS} from '../src/world/catalog';
import {loadTileCatalog} from '../tools/art/catalog';
import {renderReferenceInterior} from '../tools/maps/reference-interiors';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import {applyEventPresentation,restoreEventPresentation} from '../tools/maps/event-presentation';
import type {MapLayout,TiledMap} from '../tools/maps/types';

const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const before=JSON.parse(gunzipSync(readFileSync('tests/fixtures/speaker-entrance-sponsors-before.json.gz')).toString());
const catalog=loadTileCatalog();
const name='Entrance / DigiSec Lab',caption='entrance-digital-safety-partner';
describe('approved DigiSec Lab branding inside every zodiac entrance',()=>{
 it('enlarges the complete official mark while preserving the frame and role lettering',async()=>{
  const approved=readFileSync('art/source/sponsors/tier-logos/DigSecLab_Secondary.png');
  expect(createHash('sha256').update(approved).digest('hex')).toBe('855d08daa0c09a0205e142d48ef9c32ed0a53043b204929fd8484c62e1451c4d');
  const actual=await sharp('assets/sponsors/sponsor-digisec-entrance.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  expect(actual.info).toMatchObject({width:192,height:64,channels:4});
  const pixel=(x:number,y:number)=>[...actual.data.subarray((y*192+x)*4,(y*192+x)*4+4)];
  // The old full-bleed block is gone: six-pixel margins let the foyer show through.
  for(let y=0;y<64;y++)for(let x=0;x<192;x++)if(x<6||x>=186||y<6||y>=60)expect(pixel(x,y)[3]).toBe(0);
  expect(pixel(6,6)).toEqual([164,139,92,255]);
  expect(pixel(70,22)).toEqual([19,37,54,255]);
  const original=await sharp(approved).extract({left:577,top:1085,width:7161,height:6369}).resize(56,50,{fit:'inside',kernel:'lanczos3'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let opaqueMarkPixels=0;
  for(let y=0;y<original.info.height;y++)for(let x=0;x<original.info.width;x++){
   const i=(y*original.info.width+x)*4;
   if(original.data[i+3]===255){expect(pixel(x+14,y+7).slice(0,3)).toEqual([...original.data.subarray(i,i+3)]);opaqueMarkPixels++;}
  }
  expect(opaqueMarkPixels).toBeGreaterThan(200);
  const prior=await sharp('tests/fixtures/sponsor-digisec-entrance-plaque-before.png').ensureAlpha().raw().toBuffer();
  let enlargedPixels=0;
  for(let y=0;y<64;y++)for(let x=0;x<192;x++){
   const i=(y*192+x)*4,changed=!actual.data.subarray(i,i+4).equals(prior.subarray(i,i+4));
   if(x<14||x>=70||y<7||y>=57)expect(changed,`unchanged frame/title at ${x},${y}`).toBe(false);
   else if(changed)enlargedPixels++;
  }
  expect(enlargedPixels).toBeGreaterThan(600);
  const recipe=read('art/source/sponsors/tier-logos/exports.json').logos.find((l:any)=>l.panels.some((p:any)=>p.file==='sponsor-digisec-entrance.png'));
  expect(recipe.presentation.lines).toEqual(['DIGITAL SAFETY','PARTNER']);
  // Role text must actually be rendered on both lines, inside the frame.
  for(const [top,bottom] of [[22,29],[35,42]]){
   let ink=0;for(let y=top;y<bottom;y++)for(let x=82;x<174;x++)if(pixel(x,y).join(',')==='225,203,157,255')ink++;
   expect(ink).toBeGreaterThan(80);
  }
 });
 for(const sign of SIGN_IDS)it(sign+' displays the full mark and official title with its entrance and meeting controls intact',()=>{
  const id='speaker-'+sign,l=read(`world/layouts/${id}.json`) as MapLayout,m=read(`maps/${id}.tmj`) as TiledMap;
  const old=before[id],door=l.placements.find(p=>p.id==='south-door')!;
  expect(l.images?.filter(i=>i.name===name)).toEqual([{name,image:'assets/sponsors/sponsor-digisec-entrance.png',x:door.x-1,y:35,width:6,height:2,standing:false}]);
  expect(l.signs?.find(s=>s.name===caption)).toBeUndefined();
  expect({...l,images:l.images!.filter(i=>i.name!==name)}).toEqual(old.layout);
  expect(readFileSync(`maps/${id}.wam`,'utf8')).toBe(old.wam);
  const mask=m.layers.find(l=>l.name==='physical-collisions')!;
  expect({...mask,id:0}).toEqual({...old.collision,id:0});
  expect(m.layers.find(l=>l.name===name)?.type).toBe('tilelayer');
  expect(m.tilesets.find(t=>t.name===name)?.image).toBe('../assets/sponsors/sponsor-digisec-entrance.png');
  expect(m).toEqual(renderReferenceInterior(l,catalog).tmj);
  expect(()=>assertCurrentNativeMap(id,m,l,read(`maps/${id}.wam`),catalog)).not.toThrow();
  expect(applyEventPresentation(restoreEventPresentation(l))).toEqual(l);
  const bad=structuredClone(l);bad.images!.find(i=>i.name===name)!.x++;
  expect(()=>restoreEventPresentation(bad)).toThrow();
 });
 it('uses the organizer-provided full logo and keeps the existing hall branding',()=>{
  expect(existsSync('assets/sponsors/sponsor-digisec-entrance.png')).toBe(true);
  const art=read('art/sponsors.json').assets.find((s:any)=>s.image==='assets/sponsors/sponsor-digisec-entrance.png');
  expect(art).toMatchObject({name:'DigiSec Lab',source:'art/source/sponsors/tier-logos/DigSecLab_Secondary.png',title:'Digital Safety Partner',size:{width:192,height:64,tileWidth:6,tileHeight:2}});
  for(const id of ['solar-hall','lunar-hall'])expect(read(`world/layouts/${id}.json`).images.some((i:any)=>i.name===name)).toBe(false);
 });
});
