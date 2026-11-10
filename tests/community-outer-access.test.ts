import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';

const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const communities=['aws','bsides','vibes','osrfm','ten-ten'];

describe('community booths entered from the outer road',()=>{
 it('opens every southern frontage and puts solid backs toward the sponsor row',()=>{
  const layout=read('world/layouts/overworld.json') as MapLayout;
  const map=read('maps/overworld.tmj') as TiledMap;
  const collision=(map.layers.find(l=>l.name==='physical-collisions') as TileLayer).data;
  for(const id of communities){
   const floor=layout.placements.find(p=>p.id===`sponsor-tier-${id}-floor`)!;
   for(let x=floor.x;x<floor.x+floor.width;x++){
    for(const y of [87,88,89])expect(collision[y*map.width+x],`${id} outer entry ${x},${y}`).toBe(0);
    for(const y of [83,84])expect(collision[y*map.width+x],`${id} north back ${x},${y}`).not.toBe(0);
   }
  }
 });

 it('reaches every desk from the south without passing through the inside aisle or sponsors',()=>{
  const layout=read('world/layouts/overworld.json') as MapLayout;
  const map=read('maps/overworld.tmj') as TiledMap;
  const collision=(map.layers.find(l=>l.name==='physical-collisions') as TileLayer).data;
  // Restrict traversal to the community row and the outside road. A route via
  // the sponsors or inner crosswalk can never satisfy this visitor journey.
  const visited=new Set<number>(),queue=[89*map.width+63];
  for(let i=0;i<queue.length;i++){
   const at=queue[i];if(visited.has(at)||collision[at])continue;visited.add(at);
   const x=at%map.width,y=Math.floor(at/map.width);
   for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(x+dx>=38&&x+dx<90&&y+dy>=83&&y+dy<=90)queue.push(at+dy*map.width+dx);
  }
  for(const id of communities){
   const desk=layout.placements.find(p=>p.id===`sponsor-tier-${id}-desk`)!;
   expect(visited.has((desk.y+desk.height)*map.width+desk.x+1),id+' requires walking through inside').toBe(true);
  }
 });

 it('places the Community Corner label on the outer approach without obstructing it',()=>{
  const layout=read('world/layouts/overworld.json') as MapLayout;
  const sign=layout.signs!.find(s=>s.name==='sponsor-tier-communities')!;
  expect(sign.y).toBeGreaterThanOrEqual(89);
  expect(layout.placements.filter(p=>p.layer==='props'&&p.x<sign.x+sign.width&&sign.x<p.x+p.width&&p.y<sign.y+sign.height&&sign.y<p.y+p.height)).toEqual([]);
 });
});
