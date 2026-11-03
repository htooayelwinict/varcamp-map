import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import type {MapLayout,TiledMap} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const catalog=loadTileCatalog();
describe.each(['shipyard-beach','constellation-shore'])('%s continuous natural coast',id=>{
 const load=()=>({l:read(`world/layouts/${id}.json`) as MapLayout,m:read(`maps/${id}.tmj`) as TiledMap,w:read(`maps/${id}.wam`)});
 it('qualifies terrain, all entrances, wildlife habitats and saved controls',()=>{const{l,m,w}=load();expect(()=>assertCurrentNativeMap(id,m,l,w,catalog)).not.toThrow();});
 it('rejects an invisible collision edit in the water',()=>{const{l,m,w}=load();const mask=m.layers.find(v=>v.name==='physical-collisions');if(mask?.type!=='tilelayer')throw Error('No mask');mask.data[(m.height-1)*m.width+2]=0;expect(()=>assertCurrentNativeMap(id,m,l,w,catalog)).toThrow(/native source projection/);});
 it('rejects a removed or shifted portal instead of accepting a cosmetic-only check',()=>{const{l,m,w}=load();l.exits[0].x++;expect(()=>assertCurrentNativeMap(id,m,l,w,catalog)).toThrow(/source composition/);});
 it('rejects changed saved area geometry',()=>{const{l,m,w}=load();w.areas[0].width+=32;expect(()=>assertCurrentNativeMap(id,m,l,w,catalog)).toThrow(/saved area/);});
 it('has small floor wayfinding, no demo advertising and no standing boards',()=>{const{l}=load();expect(l.standingSigns).toEqual([]);expect(l.images).toEqual([]);expect(l.signs!.every(s=>s.width<=5&&s.fontSize!<=14)).toBe(true);const flight=l.animatedOverlays!.find(o=>o.name==='coastal-flight');expect(Boolean(flight)).toBe(id==='shipyard-beach');if(flight)expect(flight.image).toBe('assets/tilesets/original/harbour-plane.png');});
 it('keeps native palm scale and trunk-only collisions',()=>{const{l}=load();const palms=l.placements.filter(p=>p.id.includes('palm-'));expect(palms.length).toBeGreaterThan(20);for(const p of palms){expect([p.width,p.height]).toEqual([3,4]);expect(catalog[p.sprite].blockingCells).toEqual([[1,3]]);expect(catalog[p.sprite].level).toBe('aboveAvatar');}});
});
