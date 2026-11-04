import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import flight from '../art/source/outer-security-flight.json';
import {SECURITY_IDS} from '../tools/maps/outer-security-roles';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
describe('outer-ring aerial security',()=>{
 it('has six separated drone circuits and one larger helicopter at a separate altitude lane',()=>{
  expect(flight.tracks.filter(t=>t.kind==='drone')).toHaveLength(6);expect(flight.tracks.filter(t=>t.kind==='helicopter')).toHaveLength(1);
  for(const t of flight.tracks){expect(t.samples).toHaveLength(600);for(let i=0;i<600;i++){
   const a=t.samples[i],b=t.samples[(i+1)%600],cx=a.x+t.size/2,cy=a.y+t.size/2;
   expect(Math.hypot(cx-2048,cy-2048)/32).toBeCloseTo(t.radius,1);
   expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeLessThan(22);expect(a.x).toBeGreaterThanOrEqual(0);expect(a.y).toBeGreaterThanOrEqual(0);expect(a.x+t.size).toBeLessThanOrEqual(4096);expect(a.y+t.size).toBeLessThanOrEqual(4096);
  }}
  for(let i=0;i<600;i++)for(let a=0;a<7;a++)for(let b=a+1;b<7;b++){
   const x=flight.tracks[a],y=flight.tracks[b],p=x.samples[i],q=y.samples[i];expect(Math.hypot(p.x+x.size/2-q.x-y.size/2,p.y+x.size/2-q.y-y.size/2)).toBeGreaterThan((x.size+y.size)/2);
  }
 });
 it('covers each complete aircraft footprint exactly once throughout the patrol',()=>{
  const cells=new Set<string>();
  for(const {rect:r} of flight.clips)for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){
   const key=`${x},${y}`;expect(cells.has(key),'overlapping native clips: '+key).toBe(false);cells.add(key);
  }
  for(const t of flight.tracks)for(const s of t.samples)for(let y=Math.floor(s.y/32);y<=Math.floor((s.y+t.size-1)/32);y++)for(let x=Math.floor(s.x/32);x<=Math.floor((s.x+t.size-1)/32);x++){
   expect(cells.has(`${x},${y}`),'clipped aircraft: '+t.id).toBe(true);
  }
 });
 it('draws every new patrol clip after all other map layers with above-scenery depth',()=>{
  const m=read('maps/overworld.tmj'),l=read('world/layouts/overworld.json');expect(m.layers.slice(-SECURITY_IDS.length).map((a:any)=>a.name)).toEqual(SECURITY_IDS);
  expect(l.animatedOverlays.filter((o:any)=>SECURITY_IDS.includes(o.name)).map((o:any)=>o.level)).toEqual(SECURITY_IDS.map(()=>'aboveScenery'));
  for(const id of SECURITY_IDS){const layer=m.layers.find((a:any)=>a.name===id);expect(m.layers.indexOf(layer)).toBeGreaterThan(m.layers.findIndex((l:any)=>l.name==='floorLayer'));expect(layer.visible).toBe(true);}
 });
 it('keeps prior physics and paving outside the reviewed arrival changes, with all entries and zones exact',()=>{
  const m=read('maps/overworld.tmj'),protectedLayers=read('world/horned-citadels.json').protectedLayers;
  for(const [name,digest]of Object.entries(protectedLayers)){
   const layer=structuredClone(m.layers.find((l:any)=>l.name===name));
   if(name==='terrain')for(const cell of read('world/arrival-hospitality.json').terrainChanges){expect(layer.data[cell.index]).toBe(cell.after);layer.data[cell.index]=cell.before;}
   if(name==='physical-collisions'){
    for(const cell of read('world/arrival-hospitality.json').collisionChanges){expect(layer.data[cell.index]).toBe(cell.after);layer.data[cell.index]=cell.before;}
    for(let y=53;y<58;y++)for(let x=83;x<88;x++){expect(Boolean(layer.data[y*128+x])).toBe(true);layer.data[y*128+x]=0;}
   }
   expect(sha(layer)).toBe(digest);
  }
 });
 it('uses synchronized complete loops with no physical collision properties on aircraft',()=>{
  const m=read('maps/overworld.tmj');
  for(const id of SECURITY_IDS){const t=m.tilesets.find((a:any)=>a.name===id);expect(t,id).toBeDefined();for(const tile of t.tiles){expect(tile.animation.reduce((n:number,f:any)=>n+f.duration,0)).toBe(flight.periodMs);expect(tile.properties?.some((p:any)=>p.name==='collides'&&p.value)).not.toBe(true);}}
 });
});
