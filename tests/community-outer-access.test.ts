import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';

const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const communities=['aws','bsides','vibes','osrfm','duwun','open-taxi'];

describe('community booths entered from the outer road',()=>{
 it('opens every southern frontage and puts solid backs toward the sponsor row',()=>{
  const layout=read('world/layouts/overworld.json') as MapLayout;
  const map=read('maps/overworld.tmj') as TiledMap;
  const collision=(map.layers.find(l=>l.name==='physical-collisions') as TileLayer).data;
  for(const id of communities){
   const floor=layout.placements.find(p=>p.id===`sponsor-tier-${id}-floor`)!;
   for(let x=floor.x;x<floor.x+floor.width;x++){
    for(const y of [84,85,86])expect(collision[y*map.width+x],`${id} outer entry ${x},${y}`).toBe(0);
    for(const y of [80,81])expect(collision[y*map.width+x],`${id} shared back ${x},${y}`).not.toBe(0);
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
   for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(x+dx>=38&&x+dx<90&&y+dy>=82&&y+dy<=90)queue.push(at+dy*map.width+dx);
  }
  for(const id of communities){
   const desk=layout.placements.find(p=>p.id===`sponsor-tier-${id}-desk`)!;
   expect(visited.has((desk.y+desk.height)*map.width+desk.x+1),id+' requires walking through inside').toBe(true);
  }
 });

 it('places the Community Corner label on the outer approach without obstructing it',()=>{
  const layout=read('world/layouts/overworld.json') as MapLayout;
  const sign=layout.signs!.find(s=>s.name==='sponsor-tier-communities')!;
  expect(sign.y).toBeGreaterThanOrEqual(86);
  expect(layout.placements.filter(p=>p.layer==='props'&&p.x<sign.x+sign.width&&sign.x<p.x+p.width&&p.y<sign.y+sign.height&&sign.y<p.y+p.height)).toEqual([]);
 });

 it('joins both room rows against one wall, without an alley or doubled wall',()=>{
  const layout=read('world/layouts/overworld.json') as MapLayout;
  const walls=layout.placements.filter(p=>p.layer==='props'&&['glass-partition','expo-wall-navy'].includes(p.sprite));
  for(const [sponsor,id]of [['spark','aws'],['spark','bsides'],['spark','vibes'],['mini','osrfm'],['mini','duwun'],['mini','open-taxi']]){
   const floor=layout.placements.find(p=>p.id===`sponsor-tier-${id}-floor`)!;
   const other=layout.placements.find(p=>p.id===`sponsor-tier-${sponsor}-floor`)!;
   // The existing wall art is two tiles high. Both floors must meet that
   // same band; another wall or a passage would increase this separation.
   expect(floor.y-(other.y+other.height),id+' gap between room floors').toBe(2);
   for(let x=floor.x;x<floor.x+floor.width;x++){
    // Count horizontal divider segments. Existing perpendicular sponsor
    // sidewalls join the same band at its corners, not as a second back wall.
    for(let y=80;y<82;y++)expect(walls.filter(p=>p.y===80&&x>=p.x&&x<p.x+p.width&&y<p.y+p.height),id+` shared wall at ${x},${y}`).toHaveLength(1);
    for(let y=82;y<86;y++)expect(walls.filter(p=>x>=p.x&&x<p.x+p.width&&y>=p.y&&y<p.y+p.height),id+` second wall inside ${x},${y}`).toHaveLength(0);
   }
  }
 });
});
