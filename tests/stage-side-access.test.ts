import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {SIGN_IDS} from '../src/world/catalog';
import {restoreStageSideAccess} from '../tools/maps/stage-side-access';
import {restoreSpeakerOfficeWings} from '../tools/maps/speaker-office-wings';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
describe.each([...SIGN_IDS.map(s=>'speaker-'+s),'solar-hall','lunar-hall'])('%s side stage access',id=>{
 it('blocks the complete front and leaves only a right-hand stair route',()=>{
  const l=read(`world/layouts/${id}.json`),m=read(`maps/${id}.tmj`),mask=m.layers.find((v:any)=>v.name==='physical-collisions').data,solid=(x:number,y:number)=>!!mask[y*m.width+x];
  const face=l.placements.find((p:any)=>p.id==='side-stage-solid-front'),steps=l.placements.find((p:any)=>p.id==='side-stage-steps');
  expect(steps.x).toBe(face.x+face.width);
  for(let x=face.x;x<face.x+face.width;x++)expect(solid(x,face.y),`front ${x}`).toBe(true);
  for(let y=steps.y-2;y<steps.y+steps.height;y++)for(let x=steps.x;x<steps.x+2;x++)expect(solid(x,y),`side access ${x},${y}`).toBe(false);
  for(let y=steps.y-2;y<steps.y;y++)expect(solid(steps.x-1,y)).toBe(false);
 });
 it('preserves audience seats, saved zones and all unrelated room fields',()=>{
  const l=restoreSpeakerOfficeWings(read(`world/layouts/${id}.json`)),before=restoreStageSideAccess(l),strip=(v:any)=>{const {placements,signs,...rest}=v;return rest;};
  expect(JSON.stringify(strip(l))).toBe(JSON.stringify(strip(before)));
  expect(l.placements.filter((p:any)=>p.id.startsWith(id.startsWith('speaker-')?'audience-chair-':'seat-')).length).toBe(id.startsWith('speaker-')?48:60);
 });
});
