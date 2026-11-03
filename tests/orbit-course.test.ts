import {afterEach,describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {registerOrbitCourse,type CourseApi} from '../src/playground/course';
import course from '../world/orbit-course.json';
const rectMove=(r:{x:number;y:number})=>({x:(r.x+.5)*32,y:(r.y+.5)*32});
function harness(id='https://example.org/maps/orbit-playground.wam',store=new Map<string,unknown>(),rejectSave=false){
 let move:(p:{x:number;y:number})=>void=()=>{},resolve!:(p:{x:number;y:number})=>void,t=1000;
 const unsubscribe=vi.fn(),prompts:any[]=[];
 const saveVariable=vi.fn(async(k:string,v:unknown,_options:unknown)=>{if(rejectSave)throw Error('Unavailable');store.set(k,v);});
 const state=new Proxy({saveVariable},{get:(target,k:string)=>k==='saveVariable'?target.saveVariable:store.get(k)});
 const api={room:{id},player:{state,onPlayerMove:vi.fn((f:typeof move)=>{move=f;return{unsubscribe};}),getPosition:()=>new Promise(r=>{resolve=r;})},ui:{displayActionMessage:({message,callback}:any)=>{const p={message,callback,remove:vi.fn(async()=>{})};prompts.push(p);return p;}}} as unknown as CourseApi;
 const dispose=registerOrbitCourse(api,()=>t);
 return{api,dispose,prompts,unsubscribe,store,saveVariable,move:(r:{x:number;y:number})=>move(rectMove(r)),resolve:(r:{x:number;y:number})=>resolve(rectMove(r)),advance:(ms:number)=>{t+=ms;}};
}
afterEach(()=>vi.useRealTimers());
describe('playable Orbit walking course',()=>{
 it('runs only in the playground',()=>{for(const id of ['bad','https://example.org/maps/speaker-aries.wam']){const h=harness(id);expect(h.api.player.onPlayerMove).not.toHaveBeenCalled();h.dispose();}});
 it('starts on action, requires ordered checkpoints, finishes and remembers only a personal best',()=>{
  const h=harness();h.move(course.start);expect(h.prompts.at(-1).message).toContain('Space to start');h.prompts.at(-1).callback();
  h.move(course.checkpoints[4]);expect(h.prompts.at(-1).message).toContain('0/8');
  for(const p of course.checkpoints){h.advance(2000);h.move(p);}
  expect(h.prompts.at(-1).message).toContain('FINISHED · 16.0s');expect(h.store.get('varcamp-orbit-personal-best-v1')).toBe(16);
  expect(h.saveVariable).toHaveBeenCalledWith('varcamp-orbit-personal-best-v1',16,{public:false,persist:true,scope:'room'});
  h.prompts.at(-1).callback();for(const p of course.checkpoints){h.advance(3000);h.move(p);}
  expect(h.prompts.at(-1).message).toContain('Your best: 16.0s');h.dispose();
  const restored=harness(undefined,h.store);restored.move(course.start);restored.prompts.at(-1).callback();
  for(const p of course.checkpoints){restored.advance(3000);restored.move(p);}
  expect(restored.prompts.at(-1).message).toContain('Your best: 16.0s');expect(restored.saveVariable).not.toHaveBeenCalled();restored.dispose();
 });
 it('finishes and replays even when persisting a score fails',async()=>{
  const h=harness(undefined,new Map(),true);h.move(course.start);h.prompts.at(-1).callback();
  for(const p of course.checkpoints){h.advance(2000);h.move(p);}await Promise.resolve();
  expect(h.prompts.at(-1).message).toContain('Your best: 16.0s');expect(h.store.size).toBe(0);
  h.prompts.at(-1).callback();for(const p of course.checkpoints){h.advance(3000);h.move(p);}
  expect(h.prompts.at(-1).message).toContain('Your best: 16.0s');h.dispose();
 });
 it('does not restart from stale actions, duplicated moves, or a late initial position',async()=>{
  const h=harness();h.move(course.start);const first=h.prompts.at(-1);h.move({x:20,y:31});first.callback();expect(h.prompts).toHaveLength(1);
  h.resolve(course.start);await Promise.resolve();expect(h.prompts).toHaveLength(1);
  h.move(course.start);h.prompts.at(-1).callback();h.move(course.checkpoints[0]);h.move(course.checkpoints[0]);expect(h.prompts.at(-1).message).toContain('1/8');h.dispose();
 });
 it('cancels, times out and disposes without leaving timers or listeners',()=>{
  vi.useFakeTimers();const h=harness();h.move(course.start);h.prompts.at(-1).callback();expect(vi.getTimerCount()).toBe(1);
  h.prompts.at(-1).callback();expect(vi.getTimerCount()).toBe(0);h.prompts.at(-1).callback();
  vi.advanceTimersByTime(180000);expect(h.prompts.at(-1).message).toContain('timed out');expect(h.store.size).toBe(0);
  h.move(course.start);h.prompts.at(-1).callback();const old=h.prompts.at(-1);h.dispose();h.dispose();old.callback();h.move(course.checkpoints[0]);
  expect(h.unsubscribe).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);
 });
 it('has visible, reachable numbered pads matching the live walking contract',()=>{
  const l=JSON.parse(readFileSync('world/layouts/orbit-playground.json','utf8')),m=JSON.parse(readFileSync('maps/orbit-playground.tmj','utf8'));
  const mask=m.layers.find((l:any)=>l.name==='physical-collisions').data;
  expect(course.checkpoints).toHaveLength(8);expect(course.checkpoints.at(-1)).toEqual(course.start);
  course.checkpoints.forEach((r,i)=>{
   for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++)expect(mask[y*m.width+x]).toBe(0);
   if(i<7){expect(l.signs.find((s:any)=>s.name==='course-number-'+(i+1)).text).toBe(String(i+1));expect(l.placements.find((p:any)=>p.id==='course-pad-'+(i+1))).toMatchObject(r);}
  });
 });
});
