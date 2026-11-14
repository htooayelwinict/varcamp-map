import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {assertAirborneSource,isCurrentAircraft} from '../tools/maps/airborne';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import {loadTileCatalog} from '../tools/art/catalog';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';

const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const layout=()=>read('world/layouts/constellation-shore.json') as MapLayout;
const map=()=>read('maps/constellation-shore.tmj') as TiledMap;

describe('DigiSec flag above the Constellation Shore beach bar',()=>{
 it('flies just above the attendee position south of the tiki bar using the approved existing artwork',()=>{
  const l=layout(),m=map();
  const flight=l.animatedOverlays!.find(o=>o.name==='coastal-flight');
  expect(flight,'shore must publish the requested plane').toBeDefined();
  expect([flight!.x,flight!.y,flight!.width,flight!.height]).toEqual([0,12,48,3]);
  expect(flight!.image).toBe('assets/tilesets/original/harbour-plane.png');
  expect(flight!.sourceId).toBe('harbour-sponsor');expect(flight!.level).toBe('aboveScenery');
  const layer=m.layers.find(x=>x.name==='coastal-flight') as TileLayer;
  expect(m.layers.at(-1)).toBe(layer);
  const set=m.tilesets.find(s=>s.name==='coastal-flight')!;
  const harbor=read('maps/shipyard-beach.tmj').tilesets.find((s:any)=>s.name==='coastal-flight');
  expect(set.image).toBe(harbor.image);expect(set.tiles).toEqual(harbor.tiles);
  expect(layer.data.filter(Boolean)).toHaveLength(144);
  for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){
   const expected=x<48&&y>=12&&y<15?set.firstgid+flight!.carrierTileIds[(y-12)*48+x]:0;
   expect(layer.data[y*m.width+x],`${x},${y}`).toBe(expected);
  }
 });

 it('admits the requested shore aircraft while still rejecting unregistered airborne overlays',()=>{
  const l=layout();
  if(!l.animatedOverlays!.some(o=>o.name==='coastal-flight')){
   const flight=read('art/source/harbour-plane.json').overlay;l.animatedOverlays!.push({...flight,y:12});
  }
  expect(()=>assertAirborneSource(l)).not.toThrow();
  expect(isCurrentAircraft('constellation-shore','coastal-flight')).toBe(true);
  const unknown=structuredClone(l);unknown.animatedOverlays!.find(o=>o.name==='coastal-flight')!.name='unregistered-flight';
  expect(()=>assertAirborneSource(unknown)).toThrow(/closed/);
 });

 it('keeps the real shore terrain, portal and saved-area safety checks active',()=>{
  const l=layout(),m=map(),wam=read('maps/constellation-shore.wam');
  expect(()=>assertCurrentNativeMap(l.id,m,l,wam,loadTileCatalog())).not.toThrow();
  const changed=structuredClone(l),flight=changed.animatedOverlays!.find(o=>o.name==='coastal-flight');
  expect(flight,'shore must publish the requested plane').toBeDefined();flight!.y--;
  expect(()=>assertCurrentNativeMap(l.id,m,changed,wam,loadTileCatalog())).toThrow();
 });
});
