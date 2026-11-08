import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {SIGN_IDS} from '../src/world/catalog';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
describe('appended venue space',()=>{
 for(const id of ['shipyard-beach','constellation-shore'])it(`${id} has a long connected shore at native scale`,()=>{
  const l=read(`world/layouts/${id}.json`),m=read(`maps/${id}.tmj`);
  expect(l.width).toBe(96);expect(l.height).toBe(48);expect([m.width,m.height,m.tilewidth,m.tileheight]).toEqual([96,48,32,32]);
  expect(l.placements.filter((p:any)=>p.id.startsWith('extension-palm-')&&p.x>=40).length).toBeGreaterThan(20);
  expect(l.animatedOverlays.some((o:any)=>o.name==='coastal-flight')).toBe(id==='shipyard-beach');
 });
 for(const sign of SIGN_IDS)it(`${sign} adds four offices beside the intact auditorium`,()=>{
  const l=read(`world/layouts/speaker-${sign}.json`),m=read(`maps/speaker-${sign}.tmj`),w=read(`maps/speaker-${sign}.wam`);
  const originalWidth=sign==='sagittarius'?40:36,width=originalWidth+30;
  expect(l.width).toBe(width);expect(m.width).toBe(width);
  expect(l.placements.filter((p:any)=>p.id.startsWith('audience-chair-'))).toHaveLength(48);
  expect(l.placements.find((p:any)=>p.id==='side-stage-steps')).toMatchObject({x:originalWidth-4,y:12,width:2,height:2});
  const audience=w.areas.find((a:any)=>a.id===`${sign}-audience`);expect([audience.x,audience.y,audience.width,audience.height]).toEqual([64,512,(originalWidth-4)*32,576]);
  for(const kind of ['organizers','silent','briefing','lounge']){
   const a=w.areas.find((a:any)=>a.id===`${sign}-office-${kind}`);expect(a,kind).toBeDefined();expect(a.x).toBeGreaterThanOrEqual(36*32);
   if(kind==='organizers')expect(a.properties).toMatchObject([{type:'livekitRoomProperty',roomName:`varcamp-${sign}-organizer-team`,livekitRoomConfig:{disableChat:false}}]);
   else expect(a.properties).toEqual(kind==='silent'?[{id:`${sign}-office-quiet`,type:'silent'}]:[]);
  }
  const mask=m.layers.find((a:any)=>a.name==='physical-collisions').data;
  for(let y=35;y<38;y++)expect(mask[y*width+originalWidth-1]).toBe(0);
  for(const p of l.placements.filter((p:any)=>p.sprite==='check-in-desk-solid'&&p.id.startsWith('office-')))
   for(let y=p.y;y<p.y+p.height;y++)for(let x=p.x;x<p.x+p.width;x++)expect(mask[y*width+x]).toBeGreaterThan(0);
 });
});
