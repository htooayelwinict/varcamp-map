import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import type {MapLayout,TiledMap,TileLayer,Placement} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const layout=()=>read('world/layouts/overworld.json') as MapLayout;
const collision=()=>{const m=read('maps/overworld.tmj') as TiledMap;return (m.layers.find(l=>l.name==='physical-collisions') as TileLayer).data;};
const inside=(p:Placement,x:number,y:number,w:number,h:number)=>p.x>=x&&p.y>=y&&p.x+p.width<=x+w&&p.y+p.height<=y+h;
describe('decorated sponsor court',()=>{
 it('opens the main south frontage and both side sponsors toward the central court',()=>{
  const c=collision();
  for(let x=50;x<78;x++)expect(c[73*128+x],`main frontage ${x}`).toBe(0);
  for(let y=77;y<80;y++)for(let x=58;x<74;x++)expect(c[y*128+x],`court approach ${x},${y}`).toBe(0);
 });
 it('keeps tiered usable floor space after walls and furnishings are placed',()=>{
  const l=layout(),c=collision();
  const free=['main','spark','mini','aws','bsides','vibes','osrfm','ten-ten'].map(id=>{
   const p=l.placements.find(p=>p.id===`sponsor-tier-${id}-floor`)!;let n=0;
   for(let y=p.y;y<p.y+p.height;y++)for(let x=p.x;x<p.x+p.width;x++)if(c[y*128+x]===0)n++;
   return n;
  });
  expect(free[0]).toBeGreaterThanOrEqual(2*free[1]);expect(free[1]).toBeGreaterThan(free[2]);expect(free[2]).toBeGreaterThan(free[3]);expect(new Set(free.slice(3)).size).toBe(1);
 });
 it('leaves every existing guide route and reserved spawn cell unblocked',()=>{
  const c=collision(),routes=read('src/bots/lyra-routes.json');
  for(const [x,y]of [...routes.allowedCells,...routes.startupReservedCells])expect(c[y*128+x],`guide route ${x},${y}`).toBe(0);
 });
 it('leaves a clear walking row in front of every new south-facing sofa',()=>{
  const c=collision();
  for(const p of layout().placements.filter(p=>p.id.startsWith('sponsor-tier-')&&p.sprite.startsWith('sofa-'))){
   for(let x=p.x;x<p.x+p.width;x++)expect(c[(p.y+p.height)*128+x],p.id+' seating approach '+x).toBe(0);
  }
 });
 it('provides furnished seating and greenery without covering any floor logo',()=>{
  const l=layout();
  for(const [id,x,y,w,h]of [['main',50,65,28,9],['spark',40,76,18,6],['mini',74,76,14,6]] as const){
   const props=l.placements.filter(p=>p.layer==='props'&&inside(p,x,y,w,h));
   expect(props.some(p=>p.sprite.startsWith('sofa-')),id+' seating').toBe(true);
   expect(props.some(p=>p.sprite.startsWith('table-small-')),id+' table').toBe(true);
   expect(props.some(p=>p.sprite.startsWith('plaza-potted-')),id+' greenery').toBe(true);
  }
  for(const x of [39,47,55,69,81])expect(l.placements.some(p=>p.sprite.startsWith('plaza-potted-')&&inside(p,x,83,6,4)),'community greenery').toBe(true);
  const props=l.placements.filter(p=>p.layer==='props'&&p.id.startsWith('sponsor-tier-'));
  for(const i of l.images!.filter(i=>i.name.startsWith('Expo /'))){
   expect(props.filter(p=>p.x<i.x+i.width&&i.x<p.x+p.width&&p.y<i.y+i.height&&i.y<p.y+p.height).map(p=>p.id),i.name+' covered').toEqual([]);
  }
 });
 it('uses framed glass walls and a planted seating pocket instead of a blank west apron',()=>{
  const l=layout(),p=l.placements.filter(p=>p.id.startsWith('sponsor-tier-'));
  expect(p.filter(p=>p.sprite==='glass-partition').length).toBeGreaterThanOrEqual(8);
  expect(p.filter(p=>p.layer==='props'&&p.sprite==='wall-charcoal')).toEqual([]);
  expect(p.some(p=>p.sprite==='plaza-tree-flowering'&&inside(p,39,65,9,8))).toBe(true);
  expect(p.some(p=>p.sprite==='bench-park'&&inside(p,39,65,9,8))).toBe(true);
 });
});
