import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import sharp from 'sharp';
import {loadTileCatalog} from '../tools/art/catalog';
import {EXPLORATION_IDS,explorationLayout,renderExplorationMap,explorationReachability} from '../tools/maps/exploration';
import type {MapLayout,TileLayer} from '../tools/maps/types';
import baseline from './fixtures/exploration-wayfinding-baseline.json';

const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const labelName=(id:string,name:string)=>name==='branch-return'?'branch-return-label':name==='plaza-return'?(id==='campus-exploration'?'plaza-label':'plaza-return-label'):name==='trail-west'?'west-trail-label':name==='trail-east'?'east-trail-label':name+'-label';
const destination=(id:string)=>id==='overworld'?'ZODIAC PLAZA':id==='campus-exploration'?'EXPLORATION':id.replace(/-district$/,'').replaceAll('-',' ').toUpperCase();
it('fits every exit destination on one native line, including the long Stargazer caption',async()=>{
 for(const id of EXPLORATION_IDS){
  const layout=explorationLayout(id,loadTileCatalog());
  for(const exit of layout.exits){
   const sign=layout.signs!.find(s=>s.name===labelName(id,exit.name))!;
   const ink=await sharp({text:{text:sign.text,font:`Arial ${sign.fontSize}`,rgba:true}}).metadata();
   expect(ink.width,`${id}: ${sign.text}`).toBeLessThanOrEqual(sign.width*32-2*(sign.padding??0));
  }
 }
});
for(const id of EXPLORATION_IDS){
 it(`${id}: every exit is named, backed for contrast and marked on its actual trigger`,()=>{
  const c=loadTileCatalog(),l=explorationLayout(id,c),m=renderExplorationMap(l,c);
  const reached=explorationReachability(m,l);
  for(const exit of l.exits){
   const sign=l.signs!.find(s=>s.name===labelName(id,exit.name))!;
   expect(sign.text,exit.name).toBe('EXIT: '+destination(exit.destination));
   expect(sign.fontSize).toBeGreaterThanOrEqual(17);expect(sign.fontSize).toBeLessThanOrEqual(18);expect(sign.height).toBe(1);expect(sign.padding).toBe(6);expect(sign.color).toBe('#fff1c4');
   const backing=l.placements.find(p=>p.id===`exit-guide-${exit.name}-face`)!;
   expect(backing,exit.name+' contrast').toMatchObject({sprite:'sign-board-face',x:sign.x,y:sign.y,width:sign.width,height:1});
   const direction=exit.name==='trail-west'?'west':exit.name==='trail-east'?'east':exit.name.endsWith('return')?'south':'north';
   const marker=l.placements.find(p=>p.id===`exit-guide-${exit.name}-trigger`)!;
   expect(marker,exit.name+' marker').toMatchObject({sprite:'arrow-'+direction,width:1,height:1});
   expect(marker.x>=exit.x&&marker.x<exit.x+exit.width&&marker.y>=exit.y&&marker.y<exit.y+exit.height).toBe(true);
   expect(c[marker.sprite].blockingCells).toEqual([]);expect(reached.has(marker.y*m.width+marker.x)).toBe(true);
   const approach=l.placements.find(p=>p.id===`exit-guide-${exit.name}-approach`)!;
   expect(approach).toMatchObject({sprite:'arrow-'+direction,width:1,height:1});
   expect(Math.abs(approach.x-marker.x)+Math.abs(approach.y-marker.y)).toBe(1);
   expect(reached.has(approach.y*m.width+approach.x)).toBe(true);
   const texts=m.layers.find(layer=>layer.name==='wayfinding-text');
   if(texts?.type!=='objectgroup')throw Error('missing rendered text');
   expect(texts.objects.find(o=>o.name===sign.name)?.text).toMatchObject({text:sign.text,pixelsize:sign.fontSize});
  }
 });
 it(`${id}: keeps all existing paths, collision, areas, exits and scenery unchanged`,()=>{
  const l=explorationLayout(id,loadTileCatalog()),m=renderExplorationMap(l,loadTileCatalog());
  const unchanged={...l};delete unchanged.signs;
  unchanged.placements=unchanged.placements.filter(p=>!p.id.startsWith('exit-guide-'));
  expect(sha(unchanged)).toBe(baseline[id].layoutWithoutSignsSha256);
  const mask=m.layers.find(l=>l.name==='physical-collisions') as TileLayer;
  expect(sha(mask.data.map(Boolean))).toBe(baseline[id].collisionSha256);
 });
 it(`${id}: checked-in map and layout match the wayfinding authoring source`,()=>{
  const l=explorationLayout(id,loadTileCatalog());
  expect(JSON.parse(readFileSync(`world/layouts/${id}.json`,'utf8')) as MapLayout).toEqual(l);
  expect(JSON.parse(readFileSync(`maps/${id}.tmj`,'utf8'))).toEqual(renderExplorationMap(l,loadTileCatalog()));
 });
}
