import {restoreSponsorTiers} from '../tools/maps/sponsor-tiers';
import {restoreArrivalSponsorSpace} from '../tools/maps/arrival-sponsor-space';
import {restorePlazaShoreline} from '../tools/maps/plaza-shoreline';
import {restoreArrivalHospitality} from '../tools/maps/arrival-hospitality';
import {restoreRoadsterPhysics} from '../tools/maps/roadster-physics';
import {restoreOuterSecurity} from '../tools/maps/outer-security';
import {restoreHornedCitadels} from '../tools/maps/horned-citadels';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {describe,it,expect,vi} from 'vitest';
import {registerCheckInCounter,CHECK_IN_MESSAGE,type CheckInApi} from '../src/check-in/counter';
import counter from '../world/check-in-counter.json';
import {applyCheckInCounter,restoreCheckInCounter} from '../tools/maps/check-in-definition';
import {applyEventPresentation,restoreEventPresentation} from '../tools/maps/event-presentation';
import {restoreAudienceFootprints} from '../tools/maps/audience-footprints';
import {restoreLeoCitadel} from '../tools/maps/leo-citadel';
import {restoreCancerCitadel} from '../tools/maps/cancer-citadel';
import {buildMap} from '../tools/maps/builder';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import type {MapLayout,TiledMap} from '../tools/maps/types';

const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const baseline=readFileSync('tests/fixtures/check-in-counter/before.json.gz');
if(createHash('sha256').update(baseline).digest('hex')!=='213423d1d94cdc8cca1344335a6fc381a5370acb4cd3f0fedf2a953c5fb781e6')throw Error('Check-in baseline changed');
const before=JSON.parse(gunzipSync(baseline).toString()).components;
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const at={x:73*32+16,y:63*32+16};
function fixture(map='overworld'){
 let move=(_position:{x:number;y:number})=>{};
 let resolvePosition!:(p:{x:number;y:number})=>void;
 const actions:{message:string;callback:()=>void;remove:ReturnType<typeof vi.fn>}[]=[];
 const unsubscribe=vi.fn(),create=vi.fn(),del=vi.fn(async()=>{}),openTab=vi.fn();
 const api={room:{id:`https://play.example/~/varcamp/maps/${map}.wam`,website:{create,delete:del}},player:{onPlayerMove:(callback:typeof move)=>{move=callback;return{unsubscribe};},getPosition:()=>new Promise<{x:number;y:number}>(resolve=>{resolvePosition=resolve;})},nav:{openTab},ui:{displayActionMessage:({message,callback}:{message:string;callback:()=>void})=>{const action={message,callback,remove:vi.fn(async()=>{})};actions.push(action);return action;}}} as unknown as CheckInApi;
 return{api,actions,create,del,openTab,unsubscribe,move:(p:{x:number;y:number})=>move(p),initial:(p:{x:number;y:number})=>resolvePosition(p)};
}
describe('Check-in counter',()=>{
 it('creates a clickable local sign only in the plaza and never opens the registration site automatically',async()=>{
  const f=fixture(),dispose=registerCheckInCounter(f.api);f.initial(at);await tick();
  expect(f.create).toHaveBeenCalledTimes(3);expect(f.create.mock.calls[0][0]).toMatchObject({allowApi:false,allow:'',origin:'map',position:{x:2240,y:1920,width:96,height:64}});
  expect(f.create.mock.calls[0][0].url).not.toContain('register.var.camp');expect(f.actions[0].message).toBe(CHECK_IN_MESSAGE);expect(f.openTab).not.toHaveBeenCalled();dispose();
  const elsewhere=fixture('orbit-maze');registerCheckInCounter(elsewhere.api)();expect(elsewhere.create).not.toHaveBeenCalled();expect(elsewhere.openTab).not.toHaveBeenCalled();
 });
 it('opens exactly the official URL on deliberate action, then rearms only after leaving and returning',()=>{
  const f=fixture(),dispose=registerCheckInCounter(f.api);f.move(at);f.move(at);expect(f.actions).toHaveLength(1);
  f.actions[0].callback();expect(f.openTab).toHaveBeenCalledExactlyOnceWith(counter.url);f.actions[0].callback();f.move(at);expect(f.openTab).toHaveBeenCalledTimes(1);expect(f.actions).toHaveLength(1);
  f.move({x:0,y:0});f.move(at);expect(f.actions).toHaveLength(2);f.actions[1].callback();expect(f.openTab).toHaveBeenCalledTimes(2);dispose();
 });
 it('removes prompts on exit and disposes the sign and listener without allowing stale callbacks',async()=>{
  const f=fixture(),dispose=registerCheckInCounter(f.api);f.move(at);f.move({x:0,y:0});expect(f.actions[0].remove).toHaveBeenCalledOnce();f.actions[0].callback();expect(f.openTab).not.toHaveBeenCalled();
  expect(f.del).toHaveBeenCalledTimes(3);expect(f.del).toHaveBeenCalledWith('varcamp-check-in-sign');
  f.move(at);dispose();dispose();expect(f.unsubscribe).toHaveBeenCalledOnce();expect(f.del).toHaveBeenCalledTimes(6);expect(f.del).toHaveBeenLastCalledWith('varcamp-check-in-arrival-east');f.actions[1].callback();f.initial(at);await tick();expect(f.actions).toHaveLength(2);expect(f.openTab).not.toHaveBeenCalled();
 });
 it('ignores a delayed initial position after the visitor has already moved away',async()=>{
  const f=fixture(),dispose=registerCheckInCounter(f.api);f.move({x:0,y:0});f.initial(at);await tick();expect(f.actions).toHaveLength(0);dispose();
 });
 it('does not offer check-in outside the approach or on the desk itself',()=>{
  const f=fixture(),dispose=registerCheckInCounter(f.api);
  for(const p of [{x:66*32,y:62*32},{x:81*32,y:62*32},{x:72*32,y:61*32},{x:72*32,y:64*32}])f.move(p);
  expect(f.actions).toHaveLength(0);dispose();
 });
 it('keeps the click link accessible, isolated from its opener and free from camera permissions',()=>{
  const html=readFileSync('src/check-in/index.html','utf8');
  expect(html).toContain('target="_blank"');expect(html).toContain('rel="noopener noreferrer"');expect(html).toContain('aria-label="Check In');expect(html).toContain('background: transparent');expect(html).not.toContain('iframe_api');
 });
 it('adds only the reviewed desk and monitor while keeping controls and saved WAM exact',()=>{
  const layout=read('world/layouts/overworld.json') as MapLayout;
  const prior=restoreEventPresentation(layout);
  expect(restoreCheckInCounter(prior)).toEqual(before['world/layouts/overworld.json']);
  expect(applyEventPresentation(applyCheckInCounter(restoreCheckInCounter(prior)))).toEqual(layout);
  expect(read('maps/overworld.wam')).toEqual(before['maps/overworld.wam']);
 });
 it('blocks all six desk tiles from every side, reuses native art and keeps the perimeter clear',()=>{
  const layout=read('world/layouts/overworld.json') as MapLayout,map=read('maps/overworld.tmj') as TiledMap,old=before['maps/overworld.tmj'] as TiledMap,catalog=loadTileCatalog();
  const mask=(m:TiledMap)=>{const l=m.layers.find(l=>l.name==='physical-collisions');if(l?.type!=='tilelayer')throw Error('No mask');return l.data.map(Boolean);};
  const a=mask(old),b=mask(map),deskOnly=mask(buildMap(restoreAudienceFootprints(restoreLeoCitadel(restoreCancerCitadel(restoreHornedCitadels(restoreOuterSecurity(restoreRoadsterPhysics(restoreArrivalHospitality(restorePlazaShoreline(restoreArrivalSponsorSpace(restoreSponsorTiers(layout)))),catalog)),catalog),catalog),catalog)),catalog).tmj);expect(deskOnly.flatMap((v,i)=>v!==a[i]?[i]:[])).toEqual([60*128+71,60*128+72,60*128+73,61*128+71,61*128+72,61*128+73]);
  expect(mask(buildMap(layout,catalog).tmj)).toEqual(b);
  const desk=layout.placements.find(p=>p.id==='check-in-counter-desk')!;expect(catalog[desk.sprite].blockingCells).toEqual([[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]);
  for(const [x,y]of [[71,59],[72,59],[73,59],[69,60],[69,61],[79,60],[79,61],[71,62],[72,62],[73,62]])expect(b[y*128+x]).toBe(false);
  for(const t of old.tilesets.filter(t=>t.name!=='standing-captions'))expect(map.tilesets.find(s=>s.name===t.name)).toEqual(t);
  for(let y=62;y<=64;y++)for(let x=71;x<79;x++)expect(b[y*128+x]).toBe(false);
  for(const [x,y]of read('tests/fixtures/plaza-pedestrian-cells.json').allowedCells)expect(b[y*128+x]).toBe(false);
  expect(()=>assertCurrentNativeMap('overworld',map,layout,read('maps/overworld.wam'),catalog)).not.toThrow();
 },30000);
});
