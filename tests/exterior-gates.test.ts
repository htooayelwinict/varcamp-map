import {restoreProgrammeBoards} from '../tools/maps/programme-boards';
import {preVibeCodeLayout} from './helpers/vibecode-history';
import {assertSponsorFootprints} from './helpers/physical-prop-contracts';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {buildMap} from '../tools/maps/builder';
import {retireHistoricalHosts} from './helpers/retired-host-layout';
import {loadTileCatalog} from '../tools/art/catalog';
import {WORLD_CATALOG} from '../src/world/catalog';
import type {MapLayout,TileRect,TileLayer,TiledMap} from '../tools/maps/types';
function frozenOverworld(kind:'tmj'):TiledMap;
function frozenOverworld(kind:'json'):MapLayout;
function frozenOverworld(kind:'tmj'|'json'):TiledMap|MapLayout{
 const raw=readFileSync(`tests/fixtures/overworld-history/17d4-${kind==='tmj'?'native.tmj':'layout.json'}`);
 expect(createHash('sha256').update(raw).digest('hex')).toBe(kind==='tmj'?'87e88dd082910b789578188147e9b91b1f060c9d62309c158b785c2bf4cbbaad':'6e1ba3eaec7223e9b64bbd7aff48863bbfe2992a84ff199c7574857c781e533e');
 return JSON.parse(raw.toString());
}
const before=JSON.parse(readFileSync('docs/qa/exterior-gates-2026-10-16/overworld-before.json','utf8')) as MapLayout;
const source=()=>JSON.parse(readFileSync('world/layouts/overworld.json','utf8')) as MapLayout;
const cells=(r:TileRect,w:number)=>Array.from({length:r.width*r.height},(_,i)=>(r.y+Math.floor(i/r.width))*w+r.x+i%r.width);
const overlap=(a:TileRect,b:TileRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const translated=<T extends TileRect>(r:T):T=>({...r,x:r.x+16,y:r.y+16});
function built(){const l=retireHistoricalHosts([source()])[0],{tmj}=buildMap(l,loadTileCatalog());return{l,tmj,mask:(tmj.layers.find(t=>t.name==='physical-collisions') as TileLayer).data};}
function walk(w:number,mask:number[],start:number,forbidden=new Set<number>()){const q=[start],d=new Map([[start,0]]);for(let h=0;h<q.length;h++){const n=q[h],x=n%w,y=Math.floor(n/w);for(const[nx,ny]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const c=ny*w+nx;if(nx>=0&&ny>=0&&nx<w&&ny<w&&!mask[c]&&!forbidden.has(c)&&!d.has(c)){d.set(c,d.get(n)!+1);q.push(c);}}}return d;}
const radius=(n:number,w:number)=>Math.hypot(n%w-63.5,Math.floor(n/w)-63.5);
describe('exterior circle road keeps public destinations out of the speaker plaza',()=>{
 it('preserves the complete speaker and compact arrival composition at native scale on128²',()=>{
  const l=frozenOverworld('json');expect([l.width,l.height]).toEqual([128,128]);expect([WORLD_CATALOG.overworld.width,WORLD_CATALOG.overworld.height]).toEqual([128,128]);
  for(const p of before.placements.filter(p=>/-building$|-bold-nameplate$|-zodiac-emblem$/.test(p.id)||['varcamp-nameplate','welcome-control-sign','directory-prompt','arrival-position-label','arrival-direction-crosspost','arrival-compass','welcome-seat','welcome-table','reception-desk','reception-screen','reception-screen-content'].includes(p.id)||p.id.startsWith('reception-post-')||p.id.startsWith('sponsor-')))expect(l.placements.find(q=>q.id===p.id),p.id).toEqual(translated(p));
  expect(l.images).toEqual(before.images!.map(translated));expect(l.areas).toEqual(before.areas.filter(a=>a.name!=='npc-guide').map(translated));
  for(const e of before.exits.filter(e=>e.destination.startsWith('speaker-')))expect(l.exits.find(q=>q.name===e.name)).toEqual(translated(e));
  for(const e of before.entries.filter(e=>e.name.startsWith('from-speaker-')||e.isDefault))expect(l.entries.find(q=>q.name===e.name)).toEqual(translated(e));
 });
 it('moves all six real portals off the through road and retires the six central trigger sites',()=>{
  const{l}=built(),gates=l.exits.filter(e=>!e.destination.startsWith('speaker-'));expect(gates).toHaveLength(6);
  for(const e of gates){for(const n of cells(e,l.width))expect(radius(n,l.width),e.name).toBeGreaterThanOrEqual(58);const old=before.exits.find(q=>q.name===e.name)!;expect([e.destination,e.entry]).toEqual([old.destination,old.entry]);}
  for(const old of before.exits.filter(e=>!e.destination.startsWith('speaker-')))expect(l.exits.some(e=>overlap(e,translated(old))),old.name+' old central exit').toBe(false);
 });
 it('allows a complete outer-road lap without crossing any destination trigger',()=>{
  const{l,mask}=built(),ring=new Set<number>();for(let n=0;n<128*128;n++){const r=radius(n,128);if(r>=52&&r<=56)ring.add(n);}
  const portals=new Set(l.exits.filter(e=>!e.destination.startsWith('speaker-')).flatMap(e=>cells(e,l.width)));
  for(const n of ring){expect(mask[n],`outer road blocked at${n%128},${Math.floor(n/128)}`).toBe(0);expect(portals.has(n),'automatic teleport during lap').toBe(false);}
  const forbidden=new Set(Array.from({length:128*128},(_,n)=>n).filter(n=>!ring.has(n))),d=walk(128,mask,[...ring][0],forbidden);expect(d.size).toBe(ring.size);
 });
 it('keeps retired trigger cells, the side alleys and the new north approach walkable',()=>{
  const{l,mask}=built(),spawn=l.entries.find(e=>e.isDefault)!,d=walk(l.width,mask,spawn.y*l.width+spawn.x);
  for(const old of before.exits.filter(e=>!e.destination.startsWith('speaker-')))for(const n of cells(translated(old),l.width)){expect(mask[n],old.name+' retired trigger blocks north/speaker circulation').toBe(0);expect(d.has(n),old.name+' retired trigger is detached').toBe(true);}
  for(const[name,x,y,width,height]of [['north',52,12,5,26],['south',52,89,5,29],['west',12,52,28,5],['east',88,52,30,5]] as const){
   const r={x,y,width,height},p=l.placements.find(p=>p.id==='outer-alley-'+name)!;expect(p).toMatchObject({...r,sprite:'path-stone',layer:'terrain'});
   const ns=cells(r,l.width);for(const n of ns){expect(mask[n],name+' five-wide alley blocked at'+n%l.width+','+Math.floor(n/l.width)).toBe(0);expect(d.has(n),name+' alley detached').toBe(true);}
   expect(ns.some(n=>radius(n,l.width)>=52&&radius(n,l.width)<=56),name+' does not join the outer road').toBe(true);expect(ns.some(n=>radius(n,l.width)<36.5),name+' does not reach the original plaza').toBe(true);
  }
  for(const r of [{x:52,y:34,width:16,height:4},{x:60,y:34,width:8,height:20}])for(const n of cells(r,l.width)){expect(mask[n],'north connector blocked').toBe(0);expect(d.has(n),'north connector detached').toBe(true);}
 });
 it('keeps the new verge bounded by water outside deliberate native gate decks',()=>{
  const{l,mask}=built();const decks=l.placements.filter(p=>p.layer==='terrain'&&/^(exterior-court-|exterior-court-inlay-|exterior-spur-|gate-plaza-pad-|maze-return-|festival-return-)/.test(p.id));
  const deckCells=new Set(decks.flatMap(r=>cells(r,l.width)));
  for(let n=0;n<l.width*l.height;n++)if(radius(n,l.width)>60&&!deckCells.has(n))expect(mask[n],`unbounded walkable exterior at${n%l.width},${Math.floor(n/l.width)}`).not.toBe(0);
 });
 // Expanding the circle adds at most eight Manhattan tiles to each former doorway approach.
 it('reaches all twelve speaker doors while every non-speaker exit is forbidden',()=>{
  const{l,mask}=built(),portals=new Set(l.exits.filter(e=>!e.destination.startsWith('speaker-')).flatMap(e=>cells(e,l.width)));
  for(const start of cells(restoreProgrammeBoards(l).entries.find(e=>e.isDefault)!,l.width)){const d=walk(l.width,mask,start,portals);for(const e of l.exits.filter(e=>e.destination.startsWith('speaker-')))expect(Math.min(...cells(e,l.width).map(n=>d.get(n)??Infinity)),e.name).toBeLessThanOrEqual(73);}
 });
 it('keeps every spawn and portal cell clear, reachable, separated and within the exterior walking budget',()=>{
  const{l,mask}=built(),gates=l.exits.filter(e=>!e.destination.startsWith('speaker-'));
  for(const start of cells(l.entries.find(e=>e.isDefault)!,l.width)){const d=walk(l.width,mask,start);for(const r of [...l.entries,...l.exits,...l.areas])for(const n of cells(r,l.width)){expect(mask[n],`${r.name} blocked`).toBe(0);expect(d.has(n),`${r.name} detached`).toBe(true);}for(const e of gates)expect(Math.min(...cells(e,l.width).map(n=>d.get(n)??Infinity)),e.name).toBeLessThanOrEqual(120);}
  assertSponsorFootprints(preVibeCodeLayout(l),loadTileCatalog(),built().tmj);
  for(const a of l.entries)for(const e of l.exits)expect(overlap(a,e),a.name+' bounces into '+e.name).toBe(false);
  for(const e of gates){const r=l.entries.find(r=>r.name==='from-'+e.name)!;const gap=Math.max(0,r.x-e.x-e.width,e.x-r.x-r.width,r.y-e.y-e.height,e.y-r.y-r.height);expect(gap,e.name+' return gap').toBeGreaterThanOrEqual(2);}
 });
});
