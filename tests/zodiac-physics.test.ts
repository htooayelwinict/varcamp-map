import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import sharp from 'sharp';
import {SIGN_IDS} from '../src/world/catalog';
import {loadTileCatalog} from '../tools/art/catalog';
import type {TiledMap,MapLayout,TileLayer} from '../tools/maps/types';
import {assertNativePlaza} from '../tools/maps/plaza-native';
import {buildMap} from '../tools/maps/builder';
import {beforeZodiacPhysics,beforePhysicsJson,beforePhysicsRaw} from './helpers/zodiac-physics-history';
import {droneDepthSuccessorSha} from './helpers/drone-depth-epoch';
const read=<T=any>(p:string):T=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const cell=(x:number,y:number)=>{const m=read<TiledMap>('maps/overworld.tmj'),l=m.layers.find(l=>l.name==='physical-collisions')as TileLayer;return l.data[y*m.width+x];};
describe('zodiac building physical silhouettes',()=>{
 it('lets Libra visitors walk through the truly empty north gap shown in the report',()=>{
  expect(cell(28,59),'Libra local8,1 has zero painted pixels and must not block').toBe(0);
 });
 it('stops visitors at Libra\'s visible right wall instead of allowing a walk across the nameplate',()=>{
  expect(cell(31,64),'Libra local11,6 is a solid visible wall').not.toBe(0);
 });
 for(const sign of SIGN_IDS)it(sign+': renders the complete facade and nameplate above the player with its own physical sprite',()=>{
  const l=read<MapLayout>('world/layouts/overworld.json'),m=read<TiledMap>('maps/overworld.tmj'),c=loadTileCatalog(),floor=m.layers.findIndex(l=>l.name==='floorLayer');
  for(const id of[sign+'-building',sign+'-bold-nameplate']){
   const p=l.placements.find(p=>p.id===id)!,s=c[p.sprite],set=m.tilesets.find(t=>t.image==='../'+s.sheet)!;
   expect(p.renderRole,id+' cannot force architecture below the player').toBeUndefined();
   if(id===sign+'-building')expect(p.sprite).toBe('zodiac-physical-'+sign);
   for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++){
    const n=(p.y+y)*m.width+p.x+x,gid=set.firstgid+(s.rect.y+y)*set.columns!+s.rect.x+x;
    expect(m.layers.some((layer,i)=>i>floor&&layer.type==='tilelayer'&&layer.data[n]===gid),id+' raised tile '+x+','+y).toBe(true);
    expect(m.layers.some((layer,i)=>i<floor&&layer.type==='tilelayer'&&layer.data[n]===gid),id+' lowered tile '+x+','+y).toBe(false);
   }
  }
 });
 it('matches all twelve native painted silhouettes without invisible empty-cell blockers or open side walls',async()=>{
  const c=loadTileCatalog(),l=read<MapLayout>('world/layouts/overworld.json'),m=read<TiledMap>('maps/overworld.tmj'),mask=(m.layers.find(l=>l.name==='physical-collisions')as TileLayer).data;
  const other=structuredClone(l);other.placements=other.placements.filter(p=>!SIGN_IDS.some(s=>p.id===s+'-building'));
  const context=(buildMap(other,c).tmj.layers.find(l=>l.name==='physical-collisions')as TileLayer).data;
  const atlas=await sharp('assets/tilesets/original/zodiac-exteriors.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(const sign of SIGN_IDS){const p=l.placements.find(p=>p.id===sign+'-building')!,s=c[p.sprite],blocked=new Set(s.blockingCells.map(p=>p.join(',')));
   for(let y=0;y<12;y++)for(let x=0;x<12;x++){
    let opaque=0;for(let py=0;py<32;py++)for(let px=0;px<32;px++)if(atlas.data[((s.rect.y*32+y*32+py)*atlas.info.width+s.rect.x*32+x*32+px)*4+3]>=192)opaque++;
    const doorway=(x===5||x===6)&&y>=9,expected=opaque>=256&&!doorway;
    expect(blocked.has([x,y].join(',')),`${sign} local${x},${y}, opaque${opaque}`).toBe(expected);
    const n=(p.y+y)*128+p.x+x;
    expect(Boolean(mask[n]),`${sign} published physical cell${x},${y}`).toBe(expected||Boolean(context[n]));
   }
  }
 });
 it('preserves the twelve entrances, returns, every old media byte and all other maps/layouts/WAMs',()=>{
  // Later epochs advance a pinned byte only through their closed receipt (drone depth: tests/fixtures/drone-depth).
  const b=beforeZodiacPhysics();for(const[path,pin]of Object.entries({...b.assets,...b.protected}))expect(sha(readFileSync(path)),path).toBe(droneDepthSuccessorSha(path,pin));
  const sources=JSON.parse(readFileSync('art/sources.json','utf8')),priorSources=JSON.parse(beforePhysicsRaw('art/sources.json').toString());
  for(const s of Object.values(priorSources)as{files:{path:string;sha256:string}[]}[])for(const f of s.files)f.sha256=droneDepthSuccessorSha(f.path,f.sha256);
  expect(sources).toEqual(priorSources);expect(sha(readFileSync('art/sources.json'))).toBe(droneDepthSuccessorSha('art/sources.json',sha(beforePhysicsRaw('art/sources.json'))));
  const l=read<MapLayout>('world/layouts/overworld.json'),old=beforePhysicsJson<MapLayout>('world/layouts/overworld.json');
  for(const key of['entries','exits','areas','signs','inspectionZones','images','animatedOverlays','standingSigns']as const)expect(l[key],key).toEqual(old[key]);
  for(const sign of SIGN_IDS){const p=l.placements.find(p=>p.id===sign+'-building')!;for(const x of[5,6])for(const y of[9,10,11])expect(cell(p.x+x,p.y+y),sign+' clear entrance').toBe(0);}
 });
 it('keeps all85atlas reservations and protected controls, confining physics/paint changes to the twelve envelopes',()=>{
  const m=read<TiledMap>('maps/overworld.tmj'),old=beforePhysicsJson<TiledMap>('maps/overworld.tmj'),l=read<MapLayout>('world/layouts/overworld.json');
  expect(m.tilesets).toEqual(old.tilesets);expect(m.tilesets).toHaveLength(85);expect(m.layers.filter(l=>l.type!=='tilelayer')).toEqual(old.layers.filter(l=>l.type!=='tilelayer'));
  expect(m.layers.filter(l=>!old.layers.some(p=>p.name===l.name)).map(l=>l.name)).toEqual(['scenery-aboveAvatar-1']);
  const allowed=new Set<number>();for(const p of l.placements.filter(p=>SIGN_IDS.some(sign=>p.id===sign+'-building')))for(let y=0;y<12;y++)for(let x=0;x<12;x++)allowed.add((p.y+y)*128+p.x+x);
  for(const layer of m.layers){const prior=old.layers.find(l=>l.name===layer.name);if(layer.type!=='tilelayer')continue;
   const before=prior?.type==='tilelayer'?prior.data:Array(m.width*m.height).fill(0);
   for(let i=0;i<layer.data.length;i++)if(layer.data[i]!==before[i])expect(allowed.has(i)&&(/^(scenery-(belowAvatar|aboveAvatar)-\d+|physical-collisions)$/.test(layer.name)),layer.name+' changed unrelated cell'+i).toBe(true);
  }
 });
 it('reproduces exactly24placement updates and an idempotent native transaction, leaving history immutable',async()=>{
  const {applyZodiacPhysics,reconcileZodiacPhysics}=await import('../tools/maps/zodiac-physics');
  const old=beforePhysicsJson<MapLayout>('world/layouts/overworld.json'),saved=structuredClone(old),expected=structuredClone(old);
  for(const sign of SIGN_IDS){const p=expected.placements.find(p=>p.id===sign+'-building')!;p.sprite='zodiac-physical-'+sign;delete p.renderRole;delete expected.placements.find(p=>p.id===sign+'-bold-nameplate')!.renderRole;}
  const current=read<MapLayout>('world/layouts/overworld.json'),native=read<TiledMap>('maps/overworld.tmj');expect(applyZodiacPhysics(old)).toEqual(expected);expect(current).toEqual(expected);expect(old).toEqual(saved);expect(applyZodiacPhysics(current)).toEqual(current);
  const before=beforePhysicsJson<TiledMap>('maps/overworld.tmj'),savedNative=structuredClone(before),c=loadTileCatalog();expect(reconcileZodiacPhysics(before,current,c)).toEqual(native);expect(before).toEqual(savedNative);expect(reconcileZodiacPhysics(native,current,c)).toEqual(native);
 });
 it('requires current geometry even if every new source and catalog marker is removed',()=>{
  expect(()=>assertNativePlaza(beforePhysicsJson('maps/overworld.tmj'),beforePhysicsJson('world/layouts/overworld.json'),beforePhysicsJson('art/tile-catalog.json'))).toThrow(/Zodiac physics/);
 });
 it('keeps the native art gate mandatory when the complete new physical catalog family is absent',async()=>{
  const {checkZodiacPhysicsArt}=await import('../tools/maps/zodiac-physics'),c=loadTileCatalog();
  expect(await checkZodiacPhysicsArt(c)).toEqual([]);
  for(const id of Object.keys(c))if(id.startsWith('zodiac-physical-'))delete c[id];
  expect((await checkZodiacPhysicsArt(c)).join('\n')).toMatch(/exact twelve physical sprites required/);
 });
 it.each(['missing','duplicate','old-mask','raised-facade','raised-nameplate','moved','closed-door','catalog-missing','catalog-extra'])('rejects coherent %s geometry/depth tampering at the normal current gate',kind=>{
  const l=read<MapLayout>('world/layouts/overworld.json'),c=loadTileCatalog(),p=l.placements.find(p=>p.id==='libra-building')!;
  if(kind==='missing')l.placements=l.placements.filter(p=>p.id!=='libra-building');if(kind==='duplicate')l.placements.push(structuredClone(p));
  if(kind==='old-mask')p.sprite='zodiac-building-libra';if(kind==='raised-facade')p.renderRole='grounded';if(kind==='raised-nameplate')l.placements.find(p=>p.id==='libra-bold-nameplate')!.renderRole='grounded';
  if(kind==='moved')p.x++;if(kind==='closed-door')c[p.sprite].blockingCells.push([5,11]);if(kind==='catalog-missing')delete c[p.sprite];if(kind==='catalog-extra')c['zodiac-physical-extra']=structuredClone(c[p.sprite]);
  expect(()=>assertNativePlaza(read('maps/overworld.tmj'),l,c)).toThrow(/Zodiac physics/);
 });
 it('refuses to repair an unrelated collision while authoring the building fix',async()=>{
  const {reconcileZodiacPhysics}=await import('../tools/maps/zodiac-physics');const m=beforePhysicsJson<TiledMap>('maps/overworld.tmj'),mask=m.layers.find(l=>l.name==='physical-collisions')as TileLayer;
  mask.data[70*128+70]=m.tilesets.find(t=>t.name==='navigation-mask')!.firstgid+1;
  expect(()=>reconcileZodiacPhysics(m,read('world/layouts/overworld.json'),loadTileCatalog())).toThrow(/Native projection/);
 });
});
