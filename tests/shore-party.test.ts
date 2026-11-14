import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import sharp from 'sharp';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';

const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const hash=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const fingerprint=(v:unknown)=>hash(JSON.stringify(canonical(v)));
const before=read('tests/fixtures/shore-party-before.json');
const load=()=>({layout:read('world/layouts/constellation-shore.json') as MapLayout,map:read('maps/constellation-shore.tmj') as TiledMap,catalog:loadTileCatalog()});

describe('Constellation Shore DJ stage and beach-party boundary',()=>{
 it('replaces the liquor kiosk with an original DJ stage and a walkable host deck',()=>{
  const {layout,catalog}=load();
  expect(layout.placements.some(p=>p.id==='beach-kiosk'||p.sprite==='coast-life-beach-tiki-bar')).toBe(false);
  const stage=layout.placements.find(p=>p.id==='shore-dj-stage');
  expect(stage,'The DJ stage must replace the removed kiosk').toMatchObject({sprite:'shore-dj-stage',x:28,y:9,width:6,height:5});
  expect(catalog['shore-dj-stage'].sheet).not.toBe('assets/tilesets/original/coast-life-props.png');
  const floor=layout.placements.find(p=>p.id==='shore-dj-floor');
  expect(floor).toMatchObject({sprite:'shore-dj-floor',x:28,y:14,width:6,height:3});
  expect(catalog['shore-dj-floor']).toMatchObject({level:'belowAvatar',blockingCells:[]});
 });

 it('publishes a visible six-second native disco-light loop beneath the Woka',async()=>{
  const {layout,map}=load(),o=layout.animatedOverlays?.find(o=>o.name==='shore-dj-lights');
  expect(o,'The stage needs native animated lights').toBeDefined();
  expect(o).toMatchObject({x:27,y:14,width:8,height:6,level:'belowAvatar'});
  expect(o!.carrierTileIds).toHaveLength(48);
  expect(o!.animations.every(a=>a.frames.reduce((n,f)=>n+f.duration,0)===6000&&a.frames.every(f=>f.duration>=100))).toBe(true);
  expect(o!.animations.filter(a=>new Set(a.frames.map(f=>f.tileid)).size>=4).length).toBeGreaterThan(5);
  const pixels=await sharp(o!.image).metadata();
  expect(pixels.hasAlpha).toBe(true);
  expect(pixels.width!*pixels.height!*4).toBeLessThanOrEqual(4*1024*1024);
  const layer=map.layers.find(l=>l.name===o!.name) as TileLayer;
  expect(layer.data.filter(Boolean)).toHaveLength(48);
  expect(map.layers.indexOf(layer)).toBeLessThan(map.layers.findIndex(l=>l.name==='floorLayer'));
  const stageFx=layout.animatedOverlays?.find(o=>o.name==='shore-dj-stage-lights');
  expect(stageFx,'Disco ball and equipment need animated highlights').toMatchObject({x:28,y:9,width:6,height:5,level:'aboveAvatar'});
  expect(stageFx!.animations.some(a=>new Set(a.frames.map(f=>f.tileid)).size>=4)).toBe(true);
  expect(stageFx!.animations.every(a=>a.frames.reduce((n,f)=>n+f.duration,0)===6000)).toBe(true);
 });

 it('marks the party beach with low bunting and signs while keeping approach gaps open',()=>{
  const {layout,catalog}=load(),ribbons=layout.placements.filter(p=>p.id.startsWith('shore-party-bunting-'));
  expect(ribbons.length).toBeGreaterThan(20);
  expect(ribbons.every(p=>catalog[p.sprite].level==='belowAvatar'&&!catalog[p.sprite].blockingCells.length)).toBe(true);
  const north=ribbons.filter(p=>p.y===10);
  for(const [left,right] of [[3,7],[18,22],[28,34]])expect(north.some(p=>p.x<right&&p.x+p.width>left),`Clear entry ${left}..${right}`).toBe(false);
  expect(layout.signs?.filter(s=>s.name.startsWith('shore-party-')).map(s=>s.text)).toContain('BEACH PARTY');
  expect(layout.signs?.filter(s=>s.name.startsWith('shore-party-')).map(s=>s.text)).toContain('LISTEN HERE');
  expect(layout.signs?.every(s=>s.width<=5&&s.height===1&&s.fontSize!<=14)).toBe(true);
 });

 it('keeps collisions, saved controls, all other scenery and other rooms unchanged',()=>{
  const {layout,map}=load(),mask=(map.layers.find(l=>l.name==='physical-collisions') as TileLayer).data;
  expect(fingerprint(mask.map(Boolean))).toBe(before.collisionMaskSha256);
  for(let y=14;y<=16;y++)for(let x=28;x<=33;x++)expect(mask[y*map.width+x]).toBe(0);
  for(const key of ['entries','exits','areas'] as const)expect(layout[key]).toEqual(before.functional[key]);
  expect(fingerprint(layout.placements.filter(p=>!p.id.startsWith('shore-dj-')&&!p.id.startsWith('shore-party-')&&p.id!=='beach-kiosk'))).toBe(before.existingPropsSha256);
  expect(fingerprint(layout.animatedOverlays!.filter(o=>!o.name.startsWith('coastal-flight')&&!['shore-dj-lights','shore-dj-stage-lights'].includes(o.name)))).toBe(before.wildlifeOverlaysSha256);
  expect(hash(readFileSync('maps/constellation-shore.wam'))).toBe(before.sourceWamSha256);
  expect(hash(readFileSync('assets/tilesets/original/coast-life-props.png'))).toBe(before.sharedPropsSha256);
  // The shared aircraft also changes the harbour; its preserved scenery and controls
  // are checked independently in coast-flight-full.test.ts.
  for(const [p,digest]of Object.entries(before.otherMaps))if(p!=='maps/shipyard-beach.tmj')expect(hash(readFileSync(p)),p).toBe(digest);
 });

 it('validates the complete native map and rejects tampered stage art or lights',()=>{
  const {layout,map,catalog}=load(),wam=read('maps/constellation-shore.wam');
  expect(existsSync('art/source/shore-party.json'),'Stage provenance must be recorded').toBe(true);
  expect(()=>assertCurrentNativeMap(layout.id,map,layout,wam,catalog)).not.toThrow();
  const altered=structuredClone(layout);altered.animatedOverlays!.find(o=>o.name==='shore-dj-lights')!.y++;
  expect(()=>assertCurrentNativeMap(layout.id,map,altered,wam,catalog)).toThrow();
  const badCatalog=structuredClone(catalog);badCatalog['shore-dj-floor'].blockingCells=[[0,0]];
  expect(()=>assertCurrentNativeMap(layout.id,map,layout,wam,badCatalog)).toThrow();
 });
});
