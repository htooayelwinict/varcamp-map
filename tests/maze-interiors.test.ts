import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,expect,it} from 'vitest';
import {loadTileCatalog} from '../tools/art/catalog';
import {buildMap} from '../tools/maps/builder';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import {decorateMazeInterior} from '../tools/maps/maze-interiors';
import {beforeMazeInteriorLayout,beforeMazeInteriorMap} from './helpers/maze-interiors-history';
import type {MapLayout,TiledMap} from '../tools/maps/types';

const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const baseline=read('tests/fixtures/maze-interiors/before.json');
const ids=['orbit-maze','comet-maze'];
const collision=(map:TiledMap)=>{
 const layer=map.layers.find(layer=>layer.name==='physical-collisions');
 if(layer?.type!=='tilelayer')throw Error('Missing physical collision layer');
 return layer.data.map(gid=>gid?'1':'0').join('');
};

describe('Maze interiors retain the playable puzzle',()=>{
 it.each(ids)('%s retains every walkable cell and every existing native atlas',id=>{
  const layout=read(`world/layouts/${id}.json`) as MapLayout,map=read(`maps/${id}.tmj`) as TiledMap,catalog=loadTileCatalog();
  expect(collision(buildMap(layout,catalog).tmj)).toBe(baseline.maps[id].collisionMask);
  expect(collision(map)).toBe(baseline.maps[id].collisionMask);
  expect(map.tilesets).toEqual(baseline.maps[id].tilesets);
  expect([map.tilewidth,map.tileheight]).toEqual([32,32]);
  expect(()=>assertCurrentNativeMap(id,map,layout,read(`maps/${id}.wam`),catalog)).not.toThrow();
 });
 it.each(ids)('%s preserves all checkpoint, entry, exit, label and saved WAM contracts',id=>{
  const layout=read(`world/layouts/${id}.json`);
  for(const key of ['entries','exits','areas','inspectionZones','signs','images'])expect(layout[key],key).toEqual(baseline.maps[id][key]);
  expect(createHash('sha256').update(readFileSync(`maps/${id}.wam`)).digest('hex')).toBe(baseline.maps[id].wamSha256);
 });
 it.each(ids)('%s keeps new solid decor inside existing walls and keeps controls visible',id=>{
  const layout=read(`world/layouts/${id}.json`) as MapLayout,catalog=loadTileCatalog();
  const additions=layout.placements.filter(p=>p.id.startsWith('maze-interior-'));
  expect(additions.length,'A furnished interior should replace the bare wall expanses').toBeGreaterThan(20);
  const masks=baseline.maps[id].collisionMask;
  for(const p of additions){
   const sprite=catalog[p.sprite];
   for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(sprite.blockingCells.some(([sx,sy])=>sx===x%sprite.rect.width&&sy===y%sprite.rect.height))expect(masks[(p.y+y)*layout.width+p.x+x],p.id).toBe('1');
   if(p.layer==='terrain')continue;
   const interactions=layout.areas.filter(area=>/^(maze-finish|comet-checkpoint-[123]|comet-finish)$/.test(area.name));
   for(const control of [...layout.entries,...layout.exits,...interactions,...(layout.signs??[])])expect(p.x<control.x+control.width&&p.x+p.width>control.x&&p.y<control.y+control.height&&p.y+p.height>control.y,p.id+' / '+control.name).toBe(false);
  }
 });
 it.each(ids)('%s can be regenerated without accumulating or moving scenery',id=>{
  const layout=read(`world/layouts/${id}.json`) as MapLayout;
  expect(decorateMazeInterior(layout,loadTileCatalog())).toEqual(layout);
 });
 it('keeps the three collectible crystals visually unique in Comet',()=>{
  const layout=read('world/layouts/comet-maze.json') as MapLayout;
  expect(layout.placements.filter(p=>p.sprite==='crystal-cyan').map(p=>p.id).sort()).toEqual(['checkpoint-crystal-1','checkpoint-crystal-2','checkpoint-crystal-3']);
 });
 it.each(ids)('%s rejects unreviewed scenery or collision changes in historical comparisons',id=>{
  const layout=read(`world/layouts/${id}.json`) as MapLayout,map=read(`maps/${id}.tmj`) as TiledMap;
  expect(()=>beforeMazeInteriorLayout(layout)).not.toThrow();
  expect(()=>beforeMazeInteriorMap(map)).not.toThrow();
  layout.placements.find(p=>p.id.startsWith('maze-interior-'))!.x++;
  expect(()=>beforeMazeInteriorLayout(layout)).toThrow(/Unexpected maze interior/);
  const collision=map.layers.find(l=>l.name==='physical-collisions');
  if(collision?.type!=='tilelayer')throw Error('Missing collision layer');
  collision.data[0]=collision.data[0]?0:1;
  expect(()=>beforeMazeInteriorMap(map)).toThrow(/Unexpected maze interior/);
 });
});
