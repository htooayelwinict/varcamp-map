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
 it('draws every new patrol clip after all other map layers with above-scenery depth',()=>{
  const m=read('maps/overworld.tmj'),l=read('world/layouts/overworld.json');expect(m.layers.slice(-SECURITY_IDS.length).map((a:any)=>a.name)).toEqual(SECURITY_IDS);
  expect(l.animatedOverlays.filter((o:any)=>SECURITY_IDS.includes(o.name)).map((o:any)=>o.level)).toEqual(SECURITY_IDS.map(()=>'aboveScenery'));
  for(const id of SECURITY_IDS){const layer=m.layers.find((a:any)=>a.name===id);expect(m.layers.indexOf(layer)).toBeGreaterThan(m.layers.findIndex((l:any)=>l.name==='floorLayer'));expect(layer.visible).toBe(true);}
 });
 it('keeps the exact proven physical mask, entries, exits and functional zones',()=>{
  const m=read('maps/overworld.tmj'),protectedLayers=read('world/horned-citadels.json').protectedLayers;
  for(const name of ['physical-collisions','floorLayer','start','exitLayer'])if(protectedLayers[name])expect(sha(m.layers.find((l:any)=>l.name===name))).toBe(protectedLayers[name]);
  for(const [name,digest]of Object.entries(protectedLayers))expect(sha(m.layers.find((l:any)=>l.name===name))).toBe(digest);
 });
 it('uses synchronized complete loops with no physical collision properties on aircraft',()=>{
  const m=read('maps/overworld.tmj');
  for(const id of SECURITY_IDS){const t=m.tilesets.find((a:any)=>a.name===id);expect(t,id).toBeDefined();for(const tile of t.tiles){expect(tile.animation.reduce((n:number,f:any)=>n+f.duration,0)).toBe(flight.periodMs);expect(tile.properties?.some((p:any)=>p.name==='collides'&&p.value)).not.toBe(true);}}
 });
});
