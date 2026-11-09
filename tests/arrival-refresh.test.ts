import {renderEventIdentity,checkEventIdentityArt} from '../tools/art/event-identity';
import {beforeExpoChairCatalog} from '../tools/maps/expo-chair-physics';
import {vibeCodeSuccessorSha} from './helpers/vibecode-history';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{isDeepStrictEqual}from'node:util';
import{describe,it,expect}from'vitest';
import sharp from'sharp';
import{BEFORE_PATROL_DRONES as PLAZA_DRONES,prePatrolLayout,prePatrolNative,patrolSuccessorSha}from'./helpers/plaza-patrol-history';
import{loadTileCatalog}from'../tools/art/catalog';
import{assertNativePlaza}from'../tools/maps/plaza-native';
import{beforeArrival,beforeArrivalJson}from'./helpers/arrival-refresh-history';
import type{MapLayout,TiledMap,TileLayer}from'../tools/maps/types';
const read=<T=any>(p:string):T=>{const v=JSON.parse(readFileSync(p,'utf8'));return(p==='world/layouts/overworld.json'?prePatrolLayout(v):p==='maps/overworld.tmj'?prePatrolNative(v):v) as T;},sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const panels=['nw','ne','sw','se'].map((key,i)=>({name:'Arrival / VarCamp '+key.toUpperCase(),image:'assets/sponsors/varcamp-arrival-'+key+'.png',x:58+i%2*6,y:60+Math.floor(i/2)*2,width:6,height:2,standing:false}));
describe('current colourful arrival and topmost drones',()=>{
 it('forms one crisp12x4floor lockup above the spawn from exactly four seamless6x2panels',()=>{
  const l=read<MapLayout>('world/layouts/overworld.json');expect(l.images!.filter(i=>i.name.startsWith('Arrival /'))).toEqual(panels);expect(l.images!.some(i=>i.name==='VarCamp 2026 Floor')).toBe(false);
  for(const p of panels)for(const e of[...l.entries,...l.exits,...l.areas])expect(p.x<e.x+e.width&&p.x+p.width>e.x&&p.y<e.y+e.height&&p.y+p.height>e.y).toBe(false);
 });
 it('removes the arrival road crosspost, its pole and their standing-sign relationship',()=>{
  const l=read<MapLayout>('world/layouts/overworld.json');expect(l.placements.filter(p=>['arrival-direction-crosspost','arrival-crosspost-pole'].includes(p.id))).toEqual([]);
  expect(l.standingSigns!.some(s=>s.face==='arrival-direction-crosspost'||s.supports.includes('arrival-crosspost-pole'))).toBe(false);
 });
 it('uses the supplied pink flame and retains the white wordmark',async()=>{
  let pink=0,white=0;for(const[i,p]of panels.entries()){const b=await sharp(p.image).ensureAlpha().raw().toBuffer();for(let n=0;n<b.length;n+=4)if(b[n+3]>=192){if(b[n]>110&&b[n+1]<80&&b[n+2]>50){pink++;expect(i%2*192+n/4%192).toBeLessThan(80);}if(b[n]===255&&b[n+1]===255&&b[n+2]===255)white++;}}
  expect(pink).toBeGreaterThan(500);expect(white).toBeGreaterThan(1500);
 });
 it('clears the actual former pole collision cell68,64 without inventing a replacement blocker',()=>{
  const m=read<TiledMap>('maps/overworld.tmj');expect((m.layers.find(l=>l.name==='physical-collisions')as TileLayer).data[64*128+68]).toBe(0);
 });
 it('moves the complete car/pad display to74,54 while retaining every animation carrier, frame clock and source pixel',()=>{
  const l=read<MapLayout>('world/layouts/overworld.json'),old=beforeArrivalJson<MapLayout>('world/layouts/overworld.json').animatedOverlays!.find(o=>o.name==='roadster')!,current=l.animatedOverlays!.find(o=>o.name==='roadster')!;
  expect(current).toMatchObject({x:74,y:54,width:5,height:5,level:'belowAvatar'});expect(current.image).toBe(old.image);expect(current.carrierTileIds).toEqual(old.carrierTileIds);expect(current.animations).toEqual(old.animations);expect(current.provenance!.metadataPath).toBe('art/source/arrival-roadster.json');
  for(const p of ['assets/tilesets/original/roadster.png','assets/tilesets/original/roadster-v2.png','art/source/roadster.json','art/source/roadster-v2.json','tools/art/roadster.ts','art/source/roadster-v2-authoring.json'])expect(sha(readFileSync(p)),p).toBe(beforeArrival().pins[p]);
 });
 it('retains all85old reservations and appends exactly the four current floor-panel atlases',()=>{
  const m=read<TiledMap>('maps/overworld.tmj'),old=beforeArrivalJson<TiledMap>('maps/overworld.tmj');expect(m.tilesets.slice(0,85)).toEqual(old.tilesets);expect(m.tilesets).toHaveLength(89);expect(m.tilesets.slice(85).map(t=>t.name)).toEqual(panels.map(p=>p.name));
  const floor=m.layers.findIndex(l=>l.name==='floorLayer');for(const p of panels)expect(m.layers.findIndex(l=>l.name===p.name)).toBeLessThan(floor);expect(m.layers.some(l=>l.name==='VarCamp 2026 Floor')).toBe(false);
 });
 it('keeps every registered drone above all tiles, objects and attendees with unchanged layer bodies',()=>{
  const l=read<MapLayout>('world/layouts/overworld.json'),m=read<TiledMap>('maps/overworld.tmj'),old=beforeArrivalJson<TiledMap>('maps/overworld.tmj');expect(m.layers.slice(-43).map(l=>l.name)).toEqual(PLAZA_DRONES.map(r=>r.name));
  for(const row of PLAZA_DRONES){expect(l.animatedOverlays!.find(o=>o.name===row.name)!.level).toBe('aboveScenery');expect(m.layers.find(l=>l.name===row.name)).toEqual(old.layers.find(l=>l.name===row.name));}
 });
 it('preserves all603old media files,101other map/WAM files and every native control/portal body',()=>{
  const b=beforeArrival();for(const[p,pin]of Object.entries({...b.assets,...b.protected}))expect(sha(readFileSync(p)),p).toBe(vibeCodeSuccessorSha(p,pin));
  const m=read<TiledMap>('maps/overworld.tmj'),old=beforeArrivalJson<TiledMap>('maps/overworld.tmj'),l=read<MapLayout>('world/layouts/overworld.json'),prior=beforeArrivalJson<MapLayout>('world/layouts/overworld.json');expect(m.layers.filter(l=>l.type!=='tilelayer')).toEqual(old.layers.filter(l=>l.type!=='tilelayer'));
  for(const key of['entries','exits','areas','inspectionZones','signs']as const)expect(l[key],key).toEqual(prior[key]);
  const a=(m.layers.find(l=>l.name==='physical-collisions')as TileLayer).data,c=(old.layers.find(l=>l.name==='physical-collisions')as TileLayer).data;expect(a.flatMap((v,i)=>v!==c[i]?[i]:[])).toEqual([64*128+68]);
 });
 it('requires the current arrival even when every new marker is absent',()=>{expect(()=>assertNativePlaza(beforeArrivalJson('maps/overworld.tmj'),beforeArrivalJson('world/layouts/overworld.json'),loadTileCatalog())).toThrow(/Arrival refresh|Plaza patrol|Expo spacing|Fountain motion|Leo lion head|Hall buildings|Plaza crescent|Plaza landscape|Vibe Code branding/);});
 it('reproduces the exact retained SVG quadrants and the same car pixels through a pure current placement producer',async()=>{
  const{renderArrivalRefresh}=await import('../tools/art/arrival-refresh');const r={...await renderEventIdentity(),roadster:(await renderArrivalRefresh()).roadster};expect(sha(readFileSync('art/source/varcamp-horizontal.svg'))).toBe('05f5ea29e8635156bf4ed74f9e39a6067bb2121ac266db514d7918703924250f');
  const rgba=Buffer.alloc(384*128*4);for(const[i,row]of r.logos.entries()){expect(row.png).toEqual(readFileSync(panels[i].image));const{data,info}=await sharp(row.png).ensureAlpha().raw().toBuffer({resolveWithObject:true});expect([info.width,info.height]).toEqual([192,64]);for(let y=0;y<64;y++)data.copy(rgba,((Math.floor(i/2)*64+y)*384+i%2*192)*4,y*192*4,(y+1)*192*4);}
  expect(rgba).toEqual(await sharp(r.panel).ensureAlpha().raw().toBuffer());expect(await checkEventIdentityArt()).toEqual([]);expect(read('art/source/arrival-roadster.json')).toEqual(r.roadster.metadata);
 });
 it('reproduces an exact idempotent source/native successor without changing either predecessor input',async()=>{
  const{applyArrivalRefresh,reconcileArrivalRefresh}=await import('../tools/maps/arrival-refresh');const old=beforeArrivalJson<MapLayout>('world/layouts/overworld.json'),native=beforeArrivalJson<TiledMap>('maps/overworld.tmj'),saved=structuredClone(old),savedNative=structuredClone(native),current=read<MapLayout>('world/layouts/overworld.json');
  expect(applyArrivalRefresh(old)).toEqual(current);expect(applyArrivalRefresh(current)).toEqual(current);expect(old).toEqual(saved);expect(reconcileArrivalRefresh(native,current,beforeExpoChairCatalog(loadTileCatalog()))).toEqual(read('maps/overworld.tmj'));expect(native).toEqual(savedNative);expect(reconcileArrivalRefresh(read('maps/overworld.tmj'),current,beforeExpoChairCatalog(loadTileCatalog()))).toEqual(read('maps/overworld.tmj'));
 });
 it.each(['missing-panel','duplicate-panel','standing-panel','moved-panel','wrong-png','old-sign','old-pole','moved-car','old-logo'])('rejects coherent %s mutations at the normal production gate',kind=>{
  const l=JSON.parse(readFileSync('world/layouts/overworld.json','utf8')) as MapLayout,panel=l.images!.find(i=>i.name===panels[0].name)!;
  if(kind==='missing-panel')l.images=l.images!.filter(i=>i!==panel);if(kind==='duplicate-panel')l.images!.push(structuredClone(panel));if(kind==='standing-panel')panel.standing=true;if(kind==='moved-panel')panel.x++;if(kind==='wrong-png')panel.image='assets/sponsors/varcamp-2026.png';
  if(kind==='old-sign'||kind==='old-pole')l.placements.push(beforeArrivalJson<MapLayout>('world/layouts/overworld.json').placements.find(p=>p.id===(kind==='old-sign'?'arrival-direction-crosspost':'arrival-crosspost-pole'))!);
  if(kind==='moved-car')l.animatedOverlays!.find(o=>o.name==='roadster')!.x--;if(kind==='old-logo')l.images!.push(beforeArrivalJson<MapLayout>('world/layouts/overworld.json').images!.find(i=>i.name==='VarCamp 2026 Floor')!);
  expect(()=>assertNativePlaza(JSON.parse(readFileSync('maps/overworld.tmj','utf8')),l,loadTileCatalog())).toThrow(/Arrival refresh|Plaza patrol|Expo spacing|Fountain motion|Leo lion head|Hall buildings|Plaza crescent|Plaza landscape|Vibe Code branding/);
 });
 it('refuses to repair unrelated native collisions or controls while applying the arrival transaction',async()=>{
  const{reconcileArrivalRefresh}=await import('../tools/maps/arrival-refresh'),m=beforeArrivalJson<TiledMap>('maps/overworld.tmj');(m.layers.find(l=>l.name==='physical-collisions')as TileLayer).data[70*128+70]=1;expect(()=>reconcileArrivalRefresh(m,read('world/layouts/overworld.json'),loadTileCatalog())).toThrow(/Native projection/);
 });
 it('retains every old placement except the two explicit sign objects',()=>{
  const l=read<MapLayout>('world/layouts/overworld.json'),old=beforeArrivalJson<MapLayout>('world/layouts/overworld.json');expect(isDeepStrictEqual(l.placements,old.placements.filter(p=>!['arrival-direction-crosspost','arrival-crosspost-pole'].includes(p.id)))).toBe(true);
 });
 it('binds every arrival byte transition to genuine before and current bytes without cyclic manifest authority',()=>{
  const table=read('tests/fixtures/arrival-refresh/transitions.json'),before=beforeArrival();expect(table.base).toBe(before.base);expect(table.transitions).not.toHaveProperty('publication/source-manifest.json');
  for(const[path,[from,to]]of Object.entries(table.transitions)as[string,[string,string]][]){expect(path).not.toMatch(/^tests\//);expect(from,path+' genuine predecessor').toBe(before.pins[path]);expect(patrolSuccessorSha(path,to),path+' current bytes').toBe(sha(readFileSync(path)));expect(from).not.toBe(to);}
 });
});
