import {restorePlazaShoreline} from '../tools/maps/plaza-shoreline';
import {readFileSync} from 'node:fs';
import {describe,it,expect,vi} from 'vitest';
import stations from '../world/check-in-stations.json';
import counter from '../world/check-in-counter.json';
import {registerCheckInCounter,type CheckInApi} from '../src/check-in/counter';
import {applyArrivalHospitality,restoreArrivalHospitality,isArrivalHospitality} from '../tools/maps/arrival-hospitality';
import type {MapLayout} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
function fixture(){
 let move=(_p:{x:number;y:number})=>{};
 const create=vi.fn(),del=vi.fn(async()=>{}),openTab=vi.fn(),unsubscribe=vi.fn();
 const actions:{callback:()=>void;remove:ReturnType<typeof vi.fn>}[]=[];
 const api={room:{id:'https://play.example/~/varcamp/maps/overworld.wam',website:{create,delete:del}},player:{onPlayerMove:(f:typeof move)=>{move=f;return {unsubscribe};},getPosition:async()=>({x:0,y:0})},nav:{openTab},ui:{displayActionMessage:({callback}:{callback:()=>void})=>{const a={callback,remove:vi.fn(async()=>{})};actions.push(a);return a;}}} as unknown as CheckInApi;
 return {api,create,del,openTab,unsubscribe,actions,move:(x:number,y:number)=>move({x:x*32+16,y:y*32+16})};
}
describe('Check-in beside every zodiac entrance',()=>{
 it('recognizes the reviewed layout, restores its predecessor and rejects a moved desk',()=>{
  const layout=restorePlazaShoreline(read('world/layouts/overworld.json') as MapLayout);
  expect(isArrivalHospitality(layout)).toBe(true);
  const prior=restoreArrivalHospitality(layout);
  expect(prior.exits).toEqual(layout.exits);expect(prior.entries).toEqual(layout.entries);expect(prior.animatedOverlays).toEqual(layout.animatedOverlays);
  expect(applyArrivalHospitality(prior)).toEqual(layout);
  const desk=layout.placements.find(p=>p.id==='arrival-hospitality-speaker-aries-desk')!;desk.x++;
  expect(()=>restoreArrivalHospitality(layout)).toThrow('unreviewed source layout');
 });
 it('offers one deliberate check-in at every station without opening the site on approach',()=>{
  expect(stations.stations).toHaveLength(13);
  const f=fixture(),dispose=registerCheckInCounter(f.api);
  for(const [count,s] of stations.stations.entries()){
   f.move(s.desk.x+1,s.desk.y+3);expect(f.openTab).toHaveBeenCalledTimes(count);
   expect(f.actions.length,s.id).toBeGreaterThan(0);const a=f.actions.at(-1)!;
   a.callback();expect(f.openTab.mock.calls.length,s.id).toBe(count+1);expect(f.openTab).toHaveBeenLastCalledWith(counter.url);
   a.callback();expect(f.openTab.mock.calls.length,s.id).toBe(count+1);
  }
  dispose();expect(f.unsubscribe).toHaveBeenCalledOnce();
 });
 it('switches desks safely, retires offscreen links and rejects stale prompts',()=>{
  const f=fixture(),dispose=registerCheckInCounter(f.api),[a,b]=stations.stations;
  f.move(a.desk.x+1,a.desk.y+3);const old=f.actions.at(-1)!;
  f.move(b.desk.x+1,b.desk.y+3);old.callback();expect(f.openTab).not.toHaveBeenCalled();
  expect(old.remove).toHaveBeenCalledOnce();expect(f.del).toHaveBeenCalled();expect(f.create.mock.calls.length).toBeLessThan(stations.stations.length);
  const current=f.actions.at(-1)!;current.callback();expect(f.openTab).toHaveBeenCalledExactlyOnceWith(counter.url);dispose();current.callback();expect(f.openTab).toHaveBeenCalledTimes(1);
 });
 it('has twelve solid desks beside doors, with clear approaches and all guide paths open',()=>{
  const m=read('maps/overworld.tmj'),l=read('world/layouts/overworld.json'),mask=m.layers.find((a:any)=>a.name==='physical-collisions').data;
  for(const s of stations.stations){
   for(let y=s.desk.y;y<s.desk.y+2;y++)for(let x=s.desk.x;x<s.desk.x+3;x++)expect(Boolean(mask[y*128+x]),s.id+':desk').toBe(true);
   const r=s.interaction;for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++)expect(Boolean(mask[y*128+x]),s.id+':approach').toBe(false);
   if(s.id==='arrival')continue;
   const e=l.exits.find((e:any)=>e.name===s.id);expect(e).toBeDefined();expect(s.desk.y).toBe(e.y+2);expect(Math.abs(s.desk.x-e.x)).toBeLessThanOrEqual(5);
   for(let y=e.y;y<e.y+4;y++)for(let x=e.x;x<e.x+e.width;x++)expect(Boolean(mask[y*128+x]),s.id+':door').toBe(false);
  }
  for(const [x,y]of read('src/bots/lyra-routes.json').allowedCells)expect(Boolean(mask[y*128+x]),'guide').toBe(false);
 });
});
