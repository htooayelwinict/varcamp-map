import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import {parkArcadeAtlases,parkArcadeOwners} from '../tools/maps/park-arcade-context';
import {assertOwnedUpperAnimation,currentDecorationRoles} from '../tools/maps/animated-decoration';
import roster from '../world/arcade-games.json';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';

const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const c=loadTileCatalog();
function scene(id:string){
 const l=read(`world/layouts/${id}.json`) as MapLayout,m=read(`maps/${id}.tmj`) as TiledMap;
 const mask=m.layers.find(l=>l.name==='physical-collisions') as TileLayer;
 const start=l.entries.find(e=>e.isDefault)!;
 const seen=new Uint8Array(l.width*l.height),q=[start.y*l.width+start.x];seen[q[0]]=1;
 for(let at=0;at<q.length;at++){
  const i=q[at],x=i%l.width,y=Math.floor(i/l.width);
  for(const j of [...(x?[i-1]:[]),...(x<l.width-1?[i+1]:[]),...(y?[i-l.width]:[]),...(y<l.height-1?[i+l.width]:[])]){
   if(seen[j]||mask.data[j])continue;seen[j]=1;q.push(j);
  }
 }
 return{l,m,mask,seen};
}
describe('park and arcade physical publication',()=>{
 it.each(['zodiac-festival-park','nebula-arcade'])('%s satisfies the complete native contract and retains saved areas',id=>{
  const{l,m}=scene(id),wam=read(`maps/${id}.wam`);
  expect(()=>assertCurrentNativeMap(id,m,l,wam,c)).not.toThrow();
  const objectIds=m.layers.flatMap(l=>l.type==='objectgroup'?l.objects.map(o=>o.id):[]);
  expect(new Set(objectIds).size).toBe(objectIds.length);
  expect(m.nextobjectid).toBeGreaterThan(Math.max(...objectIds));
  for(const a of l.areas){const w=wam.areas.find((w:any)=>w.name===a.name);expect(!!w).toBe(true);expect([w.x,w.y,w.width,w.height]).toEqual([a.x*32,a.y*32,a.width*32,a.height*32]);expect(w.properties).toEqual(a.properties);}
 });
 it.each(['zodiac-festival-park','nebula-arcade'])('%s has clear connected entry and exit footprints',id=>{
  const{l,mask,seen}=scene(id);
  for(const r of [...l.entries,...l.exits])for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){
   expect(mask.data[y*l.width+x]===0,`${id}/${r.name}/${x},${y} clear`).toBe(true);
   expect(seen[y*l.width+x]===1,`${id}/${r.name}/${x},${y} reachable`).toBe(true);
  }
  for(const e of l.exits){const target=read(`world/layouts/${e.destination}.json`);expect(target.entries.some((r:any)=>r.name===e.entry)).toBe(true);}
 });
 it('six labelled cabinets launch three official games from clear, separate approach mats',()=>{
  const{l,mask,seen}=scene(roster.mapId),occupied=new Set<number>();
  expect(roster.games.filter(g=>g.kind.includes('FPS'))).toHaveLength(2);expect(roster.cabinets).toHaveLength(6);
  expect(roster.games.map(g=>g.url)).toEqual(['https://warbrokers.io/','https://deadshot.io/','https://www.haxball.com/play']);
  for(const a of roster.cabinets){
   const p=l.placements.find(p=>p.id===a.placementId)!,r=a.interaction,g=roster.games.find(g=>g.id===a.gameId)!;
   expect(p.y+p.height).toBe(r.y);expect(l.signs!.some(s=>s.text===g.label)).toBe(true);
   for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){const i=y*l.width+x;expect(occupied.has(i)).toBe(false);occupied.add(i);expect(mask.data[i]===0&&seen[i]===1,`${a.placementId}/${x},${y}`).toBe(true);}
   expect(c[p.sprite].blockingCells).toEqual([[0,2],[1,2]]);expect(c[p.sprite].upperCells).toHaveLength(4);
   for(let x=p.x;x<p.x+p.width;x++)expect(mask.data[(p.y+2)*l.width+x]>0).toBe(true);
  }
 });
 it('park canopies and lamp shafts stay clear while roots, bases and water remain solid',()=>{
  const{l,mask}=scene('zodiac-festival-park'),trees=l.placements.filter(p=>p.id.startsWith('grove-')),lamps=l.placements.filter(p=>p.id.startsWith('garden-lamp-'));
  expect(trees.length).toBeGreaterThanOrEqual(20);expect(l.placements.filter(p=>p.id.startsWith('flower-')).length).toBeGreaterThan(50);
  for(const p of trees){const s=c[p.sprite];expect(s.upperCells?.length).toBe(s.rect.width*(s.rect.height-1));expect(s.blockingCells.every(([,y])=>y===s.rect.height-1)).toBe(true);for(const[x,y]of s.blockingCells)expect(mask.data[(p.y+y)*l.width+p.x+x]>0).toBe(true);}
  for(const p of lamps){expect(c[p.sprite].blockingCells).toEqual([[0,2]]);expect(c[p.sprite].upperCells).toEqual([[0,0],[0,1]]);}
  expect(mask.data[4*l.width+15]).toBe(0);expect(mask.data[5*l.width+15]>0).toBe(true);
  expect(mask.data[30*l.width+19]).toBe(0);expect(mask.data[31*l.width+19]>0).toBe(true);
  expect(mask.data[20*l.width+24]>0).toBe(true);
  expect(l.placements.some(p=>p.id.startsWith('wayfinding-wallboard-'))).toBe(false);
 });
 it('new downloaded art has retained credits, exact source hashes and a bounded decoded footprint',()=>{
  const sources=read('art/sources.json');let decoded=0;
  for(const id of ['lpc-garden-trees','lpc-garden-plants','lpc-garden-terrain']){
   const s=sources[id];expect(s.license).toBe('CC-BY-SA 3.0');expect(readFileSync(s.licenseFile).length).toBeGreaterThan(1000);
   for(const f of s.files){const b=readFileSync(f.path);expect(createHash('sha256').update(b).digest('hex')).toBe(f.sha256);decoded+=b.readUInt32BE(16)*b.readUInt32BE(20)*4;}
  }
  expect(decoded).toBeLessThan(8*1024*1024);
  for(const file of ['CREDITS-trees.txt','CREDITS-plants.txt','CREDITS-terrain.txt'])expect(readFileSync('assets/tilesets/lpc-garden/'+file).length).toBeGreaterThan(1000);
 });
 it('the new reservation never extends other maps and rejects a missing predecessor',()=>{
  expect(parkArcadeAtlases('orbit-playground')).toEqual([]);expect(()=>parkArcadeOwners('zodiac-festival-park',[{name:'physical-collisions',bodySha256:'unknown'}])).toThrow();
 });
 it('arcade effects stay inside the opaque upper artwork of their registered fixtures',()=>{
  const{l,m}=scene('nebula-arcade'),roles=currentDecorationRoles()['nebula-arcade'];
  expect(roles.filter(r=>r.role==='opaqueOwnerUpper')).toHaveLength(3);
  for(const role of roles){
   const overlay=l.animatedOverlays!.find(o=>o.name===role.name)!;
   expect(()=>assertOwnedUpperAnimation(m,l,overlay,c,role)).not.toThrow();
   for(const mutation of ['opacity','transform','outside','owner']){
    const broken=structuredClone(m),layer=broken.layers.find(v=>v.name===role.name) as TileLayer,cell=layer.data.findIndex(Boolean);
    const changedRole=structuredClone(role);
    if(mutation==='opacity')layer.opacity=0.5;
    if(mutation==='transform')layer.data[cell]=(layer.data[cell]|0x80000000)>>>0;
    if(mutation==='outside')layer.data[(overlay.y+overlay.height)*m.width+overlay.x]=layer.data[cell];
    if(mutation==='owner')changedRole.owner!.placement.x++;
    expect(()=>assertOwnedUpperAnimation(broken,l,overlay,c,changedRole)).toThrow();
   }
  }
 });
 it.each(['zodiac-festival-park','nebula-arcade'])('%s rejects modified collision DATA',id=>{
  const{l,m,mask}=scene(id);mask.data[20*l.width+20]=mask.data[20*l.width+20]?0:m.tilesets.find(t=>t.name==='navigation-mask')!.firstgid;
  expect(()=>assertCurrentNativeMap(id,m,l,read(`maps/${id}.wam`),c)).toThrow();
 });
});
