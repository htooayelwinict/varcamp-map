import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {describe,it,expect,vi} from 'vitest';
import {registerCheckInCounter,CHECK_IN_MESSAGE,type CheckInApi} from '../src/check-in/counter';
import counter from '../world/check-in-counter.json';
import {applyCheckInCounter,restoreCheckInCounter} from '../tools/maps/check-in-definition';
import {applyEventPresentation,restoreEventPresentation} from '../tools/maps/event-presentation';
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
  expect(f.create).toHaveBeenCalledOnce();expect(f.create.mock.calls[0][0]).toMatchObject({allowApi:false,allow:'',origin:'map',position:{x:2272,y:1920,width:96,height:64}});
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
  f.move(at);dispose();dispose();expect(f.unsubscribe).toHaveBeenCalledOnce();expect(f.del).toHaveBeenCalledExactlyOnceWith('varcamp-check-in-sign');f.actions[1].callback();f.initial(at);await tick();expect(f.actions).toHaveLength(2);expect(f.openTab).not.toHaveBeenCalled();
 });
 it('ignores a delayed initial position after the visitor has already moved away',async()=>{
  const f=fixture(),dispose=registerCheckInCounter(f.api);f.move({x:0,y:0});f.initial(at);await tick();expect(f.actions).toHaveLength(0);dispose();
 });
 it('does not offer check-in outside the approach or on the desk itself',()=>{
  const f=fixture(),dispose=registerCheckInCounter(f.api);
  for(const p of [{x:69*32,y:62*32},{x:75*32,y:62*32},{x:72*32,y:61*32},{x:72*32,y:64*32}])f.move(p);
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
 it('blocks exactly three desk-front tiles, reuses all native art and leaves the approach and guide paths clear',()=>{
  const layout=read('world/layouts/overworld.json') as MapLayout,map=read('maps/overworld.tmj') as TiledMap,old=before['maps/overworld.tmj'] as TiledMap,catalog=loadTileCatalog();
  const mask=(m:TiledMap)=>{const l=m.layers.find(l=>l.name==='physical-collisions');if(l?.type!=='tilelayer')throw Error('No mask');return l.data.map(Boolean);};
  const a=mask(old),b=mask(map);expect(b.flatMap((v,i)=>v!==a[i]?[i]:[])).toEqual([61*128+71,61*128+72,61*128+73]);
  expect(mask(buildMap(layout,catalog).tmj)).toEqual(b);
  for(const t of old.tilesets.filter(t=>t.name!=='standing-captions'))expect(map.tilesets.find(s=>s.name===t.name)).toEqual(t);
  for(let y=62;y<=64;y++)for(let x=71;x<79;x++)expect(b[y*128+x]).toBe(false);
  for(const [x,y]of read('src/bots/lyra-routes.json').allowedCells)expect(b[y*128+x]).toBe(false);
  expect(()=>assertCurrentNativeMap('overworld',map,layout,read('maps/overworld.wam'),catalog)).not.toThrow();
 },30000);
});
