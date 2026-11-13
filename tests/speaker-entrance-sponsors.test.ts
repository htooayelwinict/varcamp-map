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
 it('keeps the original mark colors readable on a dark backing over the pale foyer floor',async()=>{
  const approved=readFileSync('tests/fixtures/sponsor-digisec-entrance-transparent.png');
  expect(createHash('sha256').update(approved).digest('hex')).toBe('adeadc8ae1c963c5d2d0eef702d67a92db6f477fc57d54ba412f0b101fe7a4fb');
  const original=await sharp(approved).ensureAlpha().raw().toBuffer();
  const actual=await sharp('assets/sponsors/sponsor-digisec-entrance.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  expect(actual.info).toMatchObject({width:128,height:64,channels:4});
  let opaqueMarkPixels=0;
  for(let i=0;i<original.length;i+=4){
   expect(actual.data[i+3],`pixel ${i/4} has a solid backing`).toBe(255);
   if(original[i+3]===0)expect([...actual.data.subarray(i,i+3)]).toEqual([27,44,64]);
   if(original[i+3]===255){expect([...actual.data.subarray(i,i+3)]).toEqual([...original.subarray(i,i+3)]);opaqueMarkPixels++;}
  }
  expect(opaqueMarkPixels).toBeGreaterThan(500);
 });
 for(const sign of SIGN_IDS)it(sign+' displays the full mark and official title with its entrance and meeting controls intact',()=>{
  const id='speaker-'+sign,l=read(`world/layouts/${id}.json`) as MapLayout,m=read(`maps/${id}.tmj`) as TiledMap;
  const old=before[id],door=l.placements.find(p=>p.id==='south-door')!;
  expect(l.images?.find(i=>i.name===name)).toEqual({name,image:'assets/sponsors/sponsor-digisec-entrance.png',x:door.x-3,y:35,width:4,height:2,standing:false});
  expect(l.signs?.find(s=>s.name===caption)).toMatchObject({text:'DigiSec Lab\nDigital Safety\nPartner',x:door.x+1,y:35,width:6,height:2});
  expect({...l,images:l.images!.filter(i=>i.name!==name),signs:l.signs!.filter(s=>s.name!==caption)}).toEqual(old.layout);
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
  expect(art).toMatchObject({name:'DigiSec Lab',source:'art/source/sponsors/tier-logos/DigSecLab_Secondary.png',title:'Digital Safety Partner'});
  for(const id of ['solar-hall','lunar-hall'])expect(read(`world/layouts/${id}.json`).images.some((i:any)=>i.name===name)).toBe(false);
 });
});
