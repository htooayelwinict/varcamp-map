import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {EVENT_MAP_IDS,applyEventPresentation,restoreEventPresentation} from '../tools/maps/event-presentation';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import type {MapLayout} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const current=(id:string):MapLayout=>read(`world/layouts/${id}.json`);
describe('Event branding and audience presentation',()=>{
 it('clears the plaza demo marks, keeps the info desk, and places Vibe Code beside BSides',()=>{
  const l=current('overworld');
  expect(l.images!.map(i=>i.name)).toEqual(['Expo / VarCamp','Expo / BSides Myanmar','Arrival / VarCamp NW','Arrival / VarCamp NE','Arrival / VarCamp SW','Arrival / VarCamp SE','Expo / Vibe Code Tours']);
  expect(l.images!.find(i=>i.name==='Expo / Vibe Code Tours')).toMatchObject({x:56,y:85});
  expect(l.placements.filter(p=>['community-corner-floor','sponsor-expo-floor'].includes(p.id)).map(p=>p.sprite)).toEqual(['event-community-floor-label','event-sponsor-floor-label']);
 });
 it('uses a small native desk and computer with a floor label, without an HTML banner',()=>{
  const l=current('overworld');expect(l.placements.filter(p=>p.id.startsWith('check-in-counter-')).map(p=>p.sprite)).toEqual(['desk-coding','laptop']);
  expect(l.placements.find(s=>s.id==='check-in-floor-label')).toMatchObject({sprite:'event-check-in-floor-label',width:3,height:1});
  const html=readFileSync('src/check-in/index.html','utf8');expect(html).not.toContain('<strong>');expect(html).toContain('background: transparent');expect(html).toContain('color-scheme: dark');expect(html).toContain('target="_blank"');
 });
 it.each(EVENT_MAP_IDS.filter(id=>id!=='overworld'))('%s retains only the approved brands and preserves controls',id=>{
  const l=current(id),before=restoreEventPresentation(l);
  expect(l.images!.map(i=>i.image.split('/').at(-1))).toEqual(['varcamp-2026.png','partner-bsides-mm.png','vibecode-tours.png']);
  expect(l.placements.some(p=>p.sprite==='speaker-style-logo-card')).toBe(false);
  for(const key of ['entries','exits','areas','inspectionZones','animatedOverlays']as const)expect(l[key]).toEqual(before[key]);
  if(id.startsWith('speaker-'))expect(l.placements.filter(p=>p.id.startsWith('audience-chair-'))).toHaveLength(18);
 });
 it.each(EVENT_MAP_IDS)('%s admits only the exact reviewed successor and validates its native map',id=>{
  const l=current(id);expect(applyEventPresentation(restoreEventPresentation(l))).toEqual(l);
  const bad=structuredClone(l);bad.placements.pop();expect(()=>restoreEventPresentation(bad)).toThrow();
  expect(()=>assertCurrentNativeMap(id,read(`maps/${id}.tmj`),l,read(`maps/${id}.wam`),loadTileCatalog())).not.toThrow();
 },30000);
});
