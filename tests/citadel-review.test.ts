import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {loadTileCatalog} from '../tools/art/catalog';
import {buildMap} from '../tools/maps/builder';
import type {MapLayout} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
describe('Reviewed zodiac citadels and halls',()=>{
 it('gives Cancer its own crab citadel while retaining the existing placement and physics',()=>{
  const l=read('world/layouts/overworld.json') as MapLayout,c=loadTileCatalog(),p=l.placements.find(p=>p.id==='cancer-building')!;
  expect(p).toEqual({id:'cancer-building',sprite:'cancer-citadel',x:58,y:102,width:12,height:12,layer:'props'});
  expect(c[p.sprite].sheet).toBe('assets/tilesets/original/cancer-citadel.png');
  expect(c[p.sprite].blockingCells).toEqual(c['grounded-zodiac-physical-cancer'].blockingCells);
  expect(c[p.sprite].level).toBe('aboveAvatar');
 });
 it('connects all fourteen building doors and return pads to the campus walkable floor',()=>{
  const l=read('world/layouts/overworld.json') as MapLayout,m=buildMap(l,loadTileCatalog()).tmj;
  const layer=m.layers.find(l=>l.name==='physical-collisions');if(layer?.type!=='tilelayer')throw Error('missing physics');
  const [sx,sy]=read('src/bots/lyra-routes.json').startupReservedCells[0];
  const visited=new Uint8Array(m.width*m.height),queue=new Int32Array(visited.length);let head=0,tail=0;
  const visit=(i:number)=>{if(i>=0&&i<visited.length&&!visited[i]&&!layer.data[i]){visited[i]=1;queue[tail++]=i;}};
  visit(sy*m.width+sx);
  while(head<tail){const i=queue[head++],x=i%m.width;visit(i-m.width);visit(i+m.width);if(x)visit(i-1);if(x+1<m.width)visit(i+1);}
  const doors=l.exits.filter(e=>e.destination.startsWith('speaker-')||['solar-hall','lunar-hall'].includes(e.destination));
  expect(doors).toHaveLength(14);
  for(const e of doors)for(let y=e.y;y<e.y+e.height;y++)for(let x=e.x;x<e.x+e.width;x++)expect(visited[y*m.width+x],e.name+' door').toBe(1);
  const returns=l.entries.filter(e=>e.name.startsWith('from-speaker-')||/solar|lunar/.test(e.name));expect(returns).toHaveLength(14);
  for(const e of returns)for(let y=e.y;y<e.y+e.height;y++)for(let x=e.x;x<e.x+e.width;x++)expect(visited[y*m.width+x],e.name+' return').toBe(1);
 });
});
