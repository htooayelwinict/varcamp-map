import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {EXPLORATION_IDS,explorationReachability,assertExplorationMap} from '../tools/maps/exploration';
import {loadTileCatalog} from '../tools/art/catalog';
import {WORLD_CATALOG} from '../src/world/catalog';
import type {MapLayout,TiledMap,WamFile} from '../tools/maps/types';
import actions from '../world/exploration-actions.json';
import before from '../world/exploration-predecessors.json';
import {LETTERS} from '../src/adventure/content';
const read=<T>(path:string):T=>JSON.parse(readFileSync(path,'utf8'));
for(const id of EXPLORATION_IDS){
 it(`${id}: all entrances, exits and activity cells are walkable and connected`,()=>{
  const l=read<MapLayout>(`world/layouts/${id}.json`),m=read<TiledMap>(`maps/${id}.tmj`),w=read<WamFile>(`maps/${id}.wam`);
  assertExplorationMap(m,l,w,loadTileCatalog());
  const reached=explorationReachability(m,l);
  expect(reached.size).toBeGreaterThan(1500);expect(reached.size).toBeLessThanOrEqual(64*56);
  for(const exit of l.exits)expect(WORLD_CATALOG[exit.destination].entries).toContain(exit.entry);
  for(const exit of before.maps[id].exits)expect(l.exits).toEqual(expect.arrayContaining([expect.objectContaining({name:exit.name,destination:exit.destination,entry:exit.entry})]));
  for(const entry of before.maps[id].entries)expect(l.entries.map(e=>e.name)).toContain(entry.name);
  for(const action of actions.filter(a=>a.map===id))expect(l.areas).toContainEqual(expect.objectContaining({id:'exp-'+action.site+( ['garden','grotto','cafe','terrace'].includes(action.site)?'-game':''),x:action.x,y:action.y,width:action.width,height:action.height}));
  const mask=m.layers.find(l=>l.name==='physical-collisions');expect(mask?.type).toBe('tilelayer');
  if(mask?.type==='tilelayer'){
   const tree=l.placements.find(p=>p.sprite.startsWith('garden-'));if(tree){const sprite=loadTileCatalog()[tree.sprite];for(const [x,y]of sprite.blockingCells)expect(mask.data[(tree.y+y)*m.width+tree.x+x]).not.toBe(0);}
   const spawn=l.entries.find(e=>e.isDefault)!;mask.data[spawn.y*m.width+spawn.x]=1;
   expect(()=>explorationReachability(m,l)).toThrow('spawn is blocked');
  }
 });
}
it('keeps the telescope behind the original explicit sigil interaction, with no automatic shortcut',()=>{
 const l=read<MapLayout>('world/layouts/stargazer-terrace.json');
 expect(l.areas.some(a=>a.name==='observatory-telescope')).toBe(true);
 expect(l.exits.some(e=>e.destination==='hidden-observatory')).toBe(false);
});
it('provides one reachable in-world parcel for every page of the story',()=>{
 for(const letter of LETTERS){
  const l=read<MapLayout>(`world/layouts/${letter.map}.json`),m=read<TiledMap>(`maps/${letter.map}.tmj`);
  const matches=actions.filter(a=>a.map===letter.map&&a.site==='letter-'+letter.id);
  expect(matches).toHaveLength(1);const area=matches[0];
  const reached=explorationReachability(m,l);expect(reached.has(area.y*m.width+area.x)).toBe(true);
  const box=l.placements.find(p=>p.id==='letter-box-'+letter.id)!;expect(box).toBeDefined();
  const mask=m.layers.find(l=>l.name==='physical-collisions');
  if(mask?.type==='tilelayer')expect(mask.data[box.y*m.width+box.x]).not.toBe(0);
 }
});
