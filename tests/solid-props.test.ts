import {publishedEpochRaw} from './helpers/published-map-epoch';
import {historicalBeach} from './helpers/organic-coast-history';
import {historicalPlaza,groveBaseCells} from './helpers/plaza-groves';
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {buildMap} from '../tools/maps/builder';
import {validateStandingSigns} from '../tools/maps/solid-props';
import * as solid from '../tools/maps/solid-props';
import {retireHistoricalHosts} from './helpers/retired-host-layout';
import {loadTileCatalog} from '../tools/art/catalog';
import type {MapLayout} from '../tools/maps/types';
const base=loadTileCatalog();
const layout=():MapLayout=>({id:'constellation-shore',width:40,height:40,placements:[],entries:[],exits:[],areas:[],inspectionZones:[]});
const cell=(m:any,x:number,y:number,upper:boolean)=>{const floor=m.layers.findIndex((l:any)=>l.name==='floorLayer');return m.layers.some((l:any,i:number)=>l.data?.[y*m.width+x]&&(upper?i>floor:i<floor)&&l.name.startsWith('scenery-'));};
describe('independent solid support and visual depth',()=>{
 it('partitions original native tiles without turning the canopy into collision',()=>{
  const catalog={...base,split:{...base['coast-parasol'],upperCells:[[0,0],[1,0],[2,0]] as [number,number][]}};
  const l=layout();l.placements=[{id:'shade',sprite:'split',x:3,y:3,width:3,height:4,layer:'props'}];
  const m=buildMap(l,catalog).tmj;
  expect(cell(m,3,3,true)).toBe(true);expect(cell(m,3,4,false)).toBe(true);
  const collision=m.layers.find(l=>l.name==='physical-collisions') as any;
  expect(collision.data[6*m.width+4]).toBeGreaterThan(0);expect(collision.data[3*m.width+3]).toBe(0);
 });
 it('rejects declared standing faces without their linked solid supports',()=>{
  const catalog={...base,face:{...base['hub-nav-welcome'],standingRole:'face' as const}};
  const l=layout();l.placements=[{id:'face',sprite:'face',x:3,y:3,width:5,height:1,layer:'props'}];
  expect(()=>buildMap(l,catalog)).toThrow(/standing/i);
 });
 it('refuses duplicate or out-of-bounds upper cells and role flattening',()=>{
  const l=layout();l.placements=[{id:'shade',sprite:'split',x:3,y:3,width:3,height:4,layer:'props'}];
  for(const upperCells of [[[0,0],[0,0]],[[3,0]]])expect(()=>buildMap(l,{...base,split:{...base['coast-parasol'],upperCells} as any})).toThrow(/upper/i);
  l.placements[0].renderRole='grounded';expect(()=>buildMap(l,{...base,split:{...base['coast-parasol'],upperCells:[[0,0]]}as any})).toThrow(/upper|partition/i);
 });
 it('uses effective upper partition for standing faces rather than their fallback level',()=>{
  const l=layout();l.placements=[{id:'face',sprite:'face',x:3,y:3,width:5,height:1,layer:'props'},{id:'post',sprite:'post',x:4,y:4,width:1,height:1,layer:'props'}];l.standingSigns=[{face:'face',supports:['post']}];
  const catalog={...base,face:{...base['hub-nav-welcome'],standingRole:'face' as const},post:{...base['sign-post'],standingRole:'support' as const,blockingCells:[[0,0]] as [number,number][]}};
  expect(()=>buildMap(l,catalog)).not.toThrow();
  for(const upperCells of [[],[[0,0]]])expect(()=>buildMap(l,{...catalog,face:{...catalog.face,upperCells} as any})).toThrow(/standing face/);
 });
 it('binds a declared standing sponsor image to solid supports behind its existing bottom row',()=>{
  const l=layout();l.images=[{name:'team-display',image:'assets/sponsors/demo-01.png',x:3,y:3,width:6,height:2,standing:true} as any];
  l.placements=[{id:'support',sprite:'support',x:3,y:4,width:1,height:1,layer:'props'}];l.standingSigns=[{faceKind:'image',face:'team-display',supports:['support']} as any];
  const catalog={...base,support:{...base['sign-post'],standingRole:'support' as const,blockingCells:[[0,0]] as [number,number][]}};
  expect(()=>validateStandingSigns(l,catalog)).not.toThrow();
  l.placements[0].y=5;expect(()=>validateStandingSigns(l,catalog)).toThrow(/support/);
 });
 it('rejects malformed assemblies deliberately before reading their fields',()=>{
  const l=layout();l.standingSigns=[null] as any;expect(()=>buildMap(l,base)).toThrow(/Invalid.*standing/);
 });
 it('requires visible standing support art rather than a cutaway substitute',()=>{
  const l=layout();l.images=[{name:'display',image:'assets/sponsors/demo-01.png',x:3,y:3,width:6,height:2,standing:true}];l.placements=[{id:'post',sprite:'post',x:3,y:4,width:1,height:1,layer:'props',renderRole:'cutaway'}];l.standingSigns=[{faceKind:'image',face:'display',supports:['post']}];
  const catalog={...base,post:{...base['sign-post'],standingRole:'support' as const,blockingCells:[[0,0]] as [number,number][]}};
  expect(()=>validateStandingSigns(l,catalog)).toThrow(/support/);
 });
 it('requires all current physical sign families to declare standing assemblies',()=>{
  // The removed arrival crosspost leaves ten directory assemblies plus twelve expo nameplates.
  for(const [id,count]of [['overworld',22],['constellation-shore',6],['shipyard-beach',3]]as const){const l=JSON.parse(readFileSync(`world/layouts/${id}.json`,'utf8'));expect(l.standingSigns,id).toHaveLength(count);}
 });
});

import {historicalFloorPlaza} from './helpers/plaza-successor';
import {createHash} from 'node:crypto';
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const receipt=read('tests/fixtures/solid-props/delta.json');
function blocked(map:any){const gids=new Set(map.tilesets.flatMap((s:any)=>(s.tiles??[]).filter((t:any)=>t.properties?.some((p:any)=>p.name==='collides'&&p.value===true)).map((t:any)=>s.firstgid+t.id)));return new Set<string>(map.layers.flatMap((l:any)=>l.type==='tilelayer'?l.data.flatMap((g:number,i:number)=>gids.has(g)?[`${i%map.width},${Math.floor(i/map.width)}`]:[]):[]));}
function connected(map:any,mask:Set<string>,points:string[]){const first=points[0],seen=new Set([first]),queue=[first];for(const key of queue){const[x,y]=key.split(',').map(Number);for(const[nx,ny]of[[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const n=`${nx},${ny}`;if(nx>=0&&ny>=0&&nx<map.width&&ny<map.height&&!mask.has(n)&&!seen.has(n)){seen.add(n);queue.push(n);}}}return points.every(p=>seen.has(p));}
describe('published solid-prop receipts and direct current physical contracts',()=>{
 for(const id of ['overworld','constellation-shore','shipyard-beach'])it(`${id} retains the historical support receipt and its protected masks/routes`,()=>{
  const historical=(id==='overworld'?historicalPlaza('native'):read(`tests/fixtures/standing-captions/before-${id}.tmj`));
  const proof=receipt.maps[id],old=read(`tests/fixtures/solid-props/before-${id}.tmj`),now=id==='shipyard-beach'?historicalBeach('native'):id==='constellation-shore'?read('tests/fixtures/constellation-coast/before-native.tmj'):historicalFloorPlaza('native'),source=id==='overworld'?historicalFloorPlaza('layout'):read(`world/layouts/${id}.json`);
  for(const ext of ['json','tmj']){expect(sha(`tests/fixtures/solid-props/before-${id}.${ext}`)).toBe(proof.before[ext]);expect(sha(id==='overworld'&&ext==='tmj'?'tests/fixtures/plaza-groves/before-native.tmj':`tests/fixtures/standing-captions/before-${id}.${ext}`)).toBe(proof.after[ext]);}
  expect(historical.tilesets).toEqual(old.tilesets); // retained published props receipt; new caption atlas is checked separately
  const expectedMask=structuredClone(historical.layers.find((l:any)=>l.name==='physical-collisions'));if(id==='overworld'){const marker=expectedMask.data.find(Boolean);for(const key of groveBaseCells(base)){const[x,y]=key.split(',').map(Number);expectedMask.data[y*now.width+x]=marker;}}expect(now.layers.find((l:any)=>l.name==='physical-collisions')).toEqual(expectedMask); // exact historical supports plus the separately reviewed grove bases
  expect(now.layers.filter((l:any)=>l.name==='roadster'||l.name==='coastal-flight'||l.name.startsWith('beach-surf-'))).toEqual(old.layers.filter((l:any)=>l.name==='roadster'||l.name==='coastal-flight'||l.name.startsWith('beach-surf-')));
  const a=blocked(old),b=blocked(now);expect([...a].filter(c=>!b.has(c))).toEqual([]);expect([...b].filter(c=>!a.has(c)).sort()).toEqual([...proof.newBlockedCells.map((c:number[])=>c.join(',')),...(id==='overworld'?[...groveBaseCells(base)]:[])].sort());
  const startLayers=now.layers.filter((l:any)=>l.type==='tilelayer'&&l.properties?.some((p:any)=>p.name==='startLayer'&&p.value===true));
  const entryCells=startLayers.flatMap((l:any)=>l.data.flatMap((v:number,i:number)=>v?[`${i%now.width},${Math.floor(i/now.width)}`]:[]));
  const exits=source.exits.flatMap((e:any)=>Array.from({length:e.width*e.height},(_,i)=>`${e.x+i%e.width},${e.y+Math.floor(i/e.width)}`));
  // The historical support receipt is checked against the guide graph of its own epoch; the current graph is audited against the current native by guide-route-audit.
  const route=id==='overworld'?historicalPlaza('routes').allowedCells.map((c:number[])=>c.join(',')):[];
  expect(route.length).toBe(id==='overworld'?743:0);const protectedCells=[...new Set<string>([...entryCells,...exits,...route])];
  expect(protectedCells.every(c=>!b.has(c))).toBe(true);expect(connected(now,b,protectedCells)).toBe(true);
  for(const p of source.placements.filter((p:any)=>base[p.sprite]?.standingRole==='support')){expect(b.has(`${p.x},${p.y}`),p.id).toBe(true);expect(cell(now,p.x,p.y,false),p.id).toBe(true);}
 });
 it('keeps every PNG and editable sponsor image byte-exact',()=>{for(const[p,h]of Object.entries(receipt.unchangedPNGs))expect(['assets/tilesets/original/coastal-flight.png','art/source/coastal-flight-plane.png'].includes(p)?createHash('sha256').update(publishedEpochRaw(p)).digest('hex'):sha(p),p).toBe(h);});
 it('uses dedicated aliases with exact original sheet/rect identity',()=>{
  for(const[name,s]of Object.entries(base))if(name.startsWith('solid-')||name.startsWith('standing-')){
   const original=name.startsWith('standing-')?name.slice(9):name.slice(6);expect(s.sheet,name).toBe(base[original].sheet);expect(s.rect,name).toEqual(base[original].rect);
  }
 });
});

it('provides the bounded forward native refinement instead of replacing atlas reservations',()=>{expect((solid as any).refineSolidProps).toBeTypeOf('function');});

describe('forward native reservation refinement',()=>{
 const fixture=()=>{const l=layout();l.placements=[{id:'shade',sprite:'coast-parasol',x:3,y:3,width:3,height:4,layer:'props'}];const before=buildMap(l,base).tmj;const intended=buildMap(l,{...base,'coast-parasol':{...base['coast-parasol'],upperCells:[[0,0],[1,0],[2,0]]}}).tmj;return{before,intended};};
 it('retains all original non-scenery layers and atlas bytes while adding only fresh layer IDs',()=>{
  const{before,intended}=fixture(),after=solid.refineSolidProps(before,intended);
  expect(after.tilesets).toEqual(before.tilesets);
  for(const l of before.layers)if(!l.name.startsWith('scenery-')&&l.name!=='physical-collisions')expect(after.layers.find(x=>x.name===l.name)).toEqual(l);
  for(const l of before.layers)expect(after.layers.find(x=>x.name===l.name)?.id).toBe(l.id);
  expect(cell(after,3,3,true)).toBe(true);expect(cell(after,3,4,false)).toBe(true);
  expect(new Set(after.layers.map(l=>l.id)).size).toBe(after.layers.length);
 });
 it('refuses missing, ambiguous or changed atlas reservations without fallback',()=>{
  for(const kind of ['missing','ambiguous','geometry']){const{before,intended}=fixture();const atlas=before.tilesets.find(t=>t.image?.endsWith('/coastal.png'))!;
   if(kind==='missing')before.tilesets=before.tilesets.filter(t=>t!==atlas);
   if(kind==='ambiguous')before.tilesets.push({...structuredClone(atlas),name:'ambiguous',firstgid:99999});
   if(kind==='geometry')atlas.columns!++;
   expect(()=>solid.refineSolidProps(before,intended),kind).toThrow(/atlas/);
  }
 });
});

function sceneryTokens(map:any){const floor=map.layers.findIndex((l:any)=>l.name==='floorLayer');return map.layers.flatMap((l:any,index:number)=>l.type==='tilelayer'&&/^scenery-(belowAvatar|aboveAvatar)-\d+$/.test(l.name)?l.data.flatMap((g:number,i:number)=>{if(!g)return[];const gid=(g&0x0fffffff)>>>0;const matches=map.tilesets.filter((t:any)=>gid>=t.firstgid&&gid<t.firstgid+t.tilecount);expect(matches).toHaveLength(1);const t=matches[0];return[JSON.stringify([index>floor?'upper':'lower',i,t.image,gid-t.firstgid,(g&0xf0000000)>>>0])];}):[]).sort();}
for(const id of ['overworld','constellation-shore','shipyard-beach'])it(`${id} emits every intended native visual tile exactly once at its authored position and depth`,()=>{
 const source=read(`world/layouts/${id}.json`),intended=buildMap(retireHistoricalHosts([source])[0],base).tmj,native=read(`maps/${id}.tmj`),old=read(`tests/fixtures/solid-props/before-${id}.tmj`);
 expect(sceneryTokens(native)).toEqual(sceneryTokens(intended));
 const historical=(id==='overworld'?historicalPlaza('native'):read(`tests/fixtures/standing-captions/before-${id}.tmj`));
 for(const layer of old.layers)if(!layer.name.startsWith('scenery-')&&layer.name!=='physical-collisions')expect(historical.layers.find((l:any)=>l.name===layer.name),layer.name).toEqual(layer);
 const top=(m:any)=>Object.fromEntries(Object.entries(m).filter(([k])=>!['layers','nextlayerid'].includes(k)));expect(top(historical)).toEqual(top(old));
 const publishedEntries=id==='shipyard-beach'?read('tests/fixtures/beach-ship/before-world--layouts--shipyard-beach.json').entries:source.entries;expect(publishedEntries).toEqual(read(`tests/fixtures/solid-props/before-${id}.json`).entries);expect(source.exits).toEqual(read(`tests/fixtures/solid-props/before-${id}.json`).exits);
},30000);
