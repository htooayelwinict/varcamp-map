import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import {loadTileCatalog} from '../tools/art/catalog';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const ids=['shipyard-beach','constellation-shore','fa-ship','fa-ship-interior','orbit-maze','comet-maze'];
const c=loadTileCatalog();
describe.each(ids)('%s navigation',id=>{
 it('qualifies the complete native scene and controls',()=>expect(()=>assertCurrentNativeMap(id,read(`maps/${id}.tmj`),read(`world/layouts/${id}.json`),read(`maps/${id}.wam`),c)).not.toThrow());
 it('lands away from exits and connects every portal to a named destination entry',()=>{
  const l=read(`world/layouts/${id}.json`);
  const overlap=(a:any,b:any)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
  for(const e of l.entries)expect(l.exits.some((x:any)=>overlap(e,x))).toBe(false);
  for(const e of l.exits)expect(read(`world/layouts/${e.destination}.json`).entries.some((a:any)=>a.name===e.entry)).toBe(true);
 });
 it('rejects displaced native exit cells',()=>{
  const l=read(`world/layouts/${id}.json`),m=read(`maps/${id}.tmj`),exit=m.layers.find((x:any)=>x.name==='exit-'+l.exits[0].name),at=exit.data.findIndex(Boolean);exit.data[(at+m.width)%exit.data.length]=exit.data[at];exit.data[at]=0;
  expect(()=>assertCurrentNativeMap(id,m,l,read(`maps/${id}.wam`),c)).toThrow();
 });
});
it('restores the original sailing ship and a purely decorative flight without demo advertising',()=>{
 const l=read('world/layouts/shipyard-beach.json'),flight=l.animatedOverlays.find((o:any)=>o.name==='coastal-flight');
 expect(l.placements.filter((p:any)=>p.id.startsWith('lpc-')).length).toBe(1119);
 expect(flight.image).toBe('assets/tilesets/original/harbour-plane.png');expect(flight.level).toBe('aboveScenery');
 const m=read('art/source/harbour-plane.json');expect(m.diagnostics.tracks[0].positionCount).toBeGreaterThan(100);expect(m.inputs.some((p:any)=>p.path.includes('sponsor'))).toBe(false);
});
it('uses a narrow native ladder on both decks and a grounded timber helm',()=>{
 for(const id of ['fa-ship','fa-ship-interior']){
  const l=read('world/layouts/'+id+'.json'),ladder=l.placements.find((p:any)=>p.sprite==='harbour-native-ladder'),e=l.exits.find((e:any)=>e.name.startsWith('stairs-'));
  expect([ladder.width,ladder.height]).toEqual([1,2]);expect([e.x,e.y,e.width,e.height]).toEqual([ladder.x,ladder.y,1,1]);
 }
 expect(c['harbour-timber-helm'].blockingCells).toEqual([[0,1],[1,1]]);expect(c['harbour-timber-helm'].upperCells).toEqual([[0,0],[1,0]]);
});
