import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {loadTileCatalog} from '../tools/art/catalog';
import {buildMap} from '../tools/maps/builder';
import type {MapLayout} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const catalog=loadTileCatalog();
const ids=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
describe('Audience seating and grounded scenery',()=>{
 it.each(ids)('%s seats 48 within the actual listening boundary, with reachable row aisles',sign=>{
  const l=read(`world/layouts/speaker-${sign}.json`) as MapLayout;
  const area=l.areas!.find(a=>a.id===sign+'-audience')!,chairs=l.placements.filter(p=>p.id.startsWith('audience-chair-'));
  expect(chairs).toHaveLength(48);
  const fill=l.placements.find(p=>p.id==='audience-boundary-floor');
  expect(fill).toMatchObject({x:area.x,y:area.y,width:area.width,height:area.height});
  expect(l.placements.filter(p=>p.id.startsWith('audience-boundary-edge-'))).toHaveLength(4);
  const mask=buildMap(l,catalog).tmj.layers.find(l=>l.name==='physical-collisions');
  if(mask?.type!=='tilelayer')throw Error('Missing collision mask');
  const reachable=new Set<number>(),queue=[(area.y+area.height)*l.width+l.width/2];
  while(queue.length){const i=queue.pop()!;if(i<0||i>=mask.data.length||reachable.has(i)||mask.data[i])continue;reachable.add(i);for(const j of[i-l.width,i+l.width,...(i%l.width?[i-1]:[]),...(i%l.width<l.width-1?[i+1]:[])])queue.push(j);}
  for(const p of chairs){
   expect(p.x>=area.x&&p.x+p.width<=area.x+area.width&&p.y>=area.y&&p.y+p.height<=area.y+area.height).toBe(true);
   expect(reachable.has(p.y*l.width+p.x)).toBe(true);
   expect(reachable.has((p.y+2)*l.width+p.x)).toBe(true);
   expect(l.placements.filter(q=>q.id!==p.id&&q.layer==='props'&&catalog[q.sprite].blockingCells.length&&q.x<p.x+p.width&&q.x+q.width>p.x&&q.y<p.y+p.height&&q.y+q.height>p.y)).toEqual([]);
  }
  for(let y=area.y;y<area.y+area.height;y++)for(let x=l.width/2-2;x<l.width/2+2;x++)expect(mask.data[y*l.width+x]).toBe(0);
  for(const p of l.placements.filter(p=>p.id.startsWith('audience-boundary-')))expect(catalog[p.sprite].blockingCells).toEqual([]);
 });
 it('all six plaza lamps block only their base and draw the upper two cells over players',()=>{
  const l=read('world/layouts/overworld.json') as MapLayout,lamps=l.placements.filter(p=>p.id.startsWith('plaza-lamp-'));
  expect(lamps).toHaveLength(6);
  for(const p of lamps){const s=catalog[p.sprite];expect(s.blockingCells).toEqual([[0,2]]);expect(s.upperCells).toEqual([[0,0],[0,1]]);}
 });
 it('fourteen buildings have a solid wall footprint, walkable roof projection, and open doors',()=>{
  const l=read('world/layouts/overworld.json') as MapLayout,buildings=l.placements.filter(p=>ids.some(s=>p.id===s+'-building')||/^exterior-gate-(solar|lunar)$/.test(p.id));
  expect(buildings).toHaveLength(14);
  for(const p of buildings){const s=catalog[p.sprite],mask=new Set(s.blockingCells.map(c=>c.join(',')));
   expect(s.level).toBe('aboveAvatar');
   for(let y=0;y<8;y++)for(let x=0;x<12;x++)expect(mask.has(`${x},${y}`)).toBe(false);
   for(let y=8;y<12;y++)for(const x of[1,2,3,8,9,10])expect(mask.has(`${x},${y}`)).toBe(true);
   for(const x of[5,6])expect(mask.has(`${x},11`)).toBe(false);
  }
 });
});
