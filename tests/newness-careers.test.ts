import {readFileSync} from 'node:fs';
import {expect,it,vi} from 'vitest';
import {registerNewnessCareers,type NewnessApi} from '../src/expo/newness-careers';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';

function harness(room='https://play.workadventu.re/@/varcamp/world/varcamp-2026/maps/overworld'){
 let move:(p:{x:number;y:number})=>void=()=>{};
 let resolve!:(p:{x:number;y:number})=>void;
 const unsubscribe=vi.fn(),openTab=vi.fn();
 const prompts:{message:string;callback:()=>void;remove:ReturnType<typeof vi.fn>}[]=[];
 const api={room:{id:room},nav:{openTab},player:{
  getPosition:vi.fn(()=>new Promise<{x:number;y:number}>(r=>{resolve=r;})),
  onPlayerMove:vi.fn((cb:typeof move)=>{move=cb;return{unsubscribe};}),
 },ui:{displayActionMessage:vi.fn(({message,callback}:{message:string;callback:()=>void})=>{
  const p={message,callback,remove:vi.fn(async()=>{})};prompts.push(p);return p;
 })}} as unknown as NewnessApi;
 const dispose=registerNewnessCareers(api);
 return{api,dispose,prompts,unsubscribe,openTab,move:(x:number,y:number)=>move({x:x*32,y:y*32}),resolve:(x:number,y:number)=>resolve({x:x*32,y:y*32})};
}
it.each(['https://play.workadventu.re/@/varcamp/world/varcamp-2026/maps/overworld','https://example.org/~/demo/maps/overworld.wam','https://example.org/maps/overworld.tmj'])('offers Newness careers on explicit action at the laptop, including %s',room=>{
 const h=harness(room);h.move(42.5,79.5);
 expect(h.prompts).toHaveLength(1);expect(h.prompts[0].message).toContain('Newness');expect(h.prompts[0].message).toContain('careers');expect(h.prompts[0].message).toContain('new tab');
 expect(h.openTab).not.toHaveBeenCalled();h.move(42.6,79.6);expect(h.prompts).toHaveLength(1);
 h.prompts[0].callback();h.prompts[0].callback();expect(h.openTab).toHaveBeenCalledExactlyOnceWith('https://career.newness.com.mm/');h.dispose();
});
it('does not advertise from another booth, the aisle, or behind the desk',()=>{
 const h=harness();for(const [x,y]of [[40.9,79.5],[44,79.5],[42.5,78.9],[42.5,80],[70,79.5]])h.move(x,y);
 expect(h.prompts).toHaveLength(0);h.move(42.5,79.5);const old=h.prompts[0];h.move(60,79.5);expect(old.remove).toHaveBeenCalledOnce();old.callback();expect(h.openTab).not.toHaveBeenCalled();
 h.move(42.5,79.5);expect(h.prompts).toHaveLength(2);old.callback();expect(h.openTab).not.toHaveBeenCalled();h.dispose();
});
it('offers an initial desk spawn but never restores a prompt from a stale position',async()=>{
 const h=harness();h.resolve(42.5,79.5);await Promise.resolve();expect(h.prompts).toHaveLength(1);h.dispose();
 const moved=harness();moved.move(60,79);moved.resolve(42.5,79.5);await Promise.resolve();expect(moved.prompts).toHaveLength(0);moved.dispose();
});
it('cleans up once and ignores late movements and callbacks after leaving the map',async()=>{
 const h=harness();h.move(42.5,79.5);const old=h.prompts[0];h.dispose();h.dispose();old.callback();h.move(42.5,79.5);h.resolve(42.5,79.5);await Promise.resolve();
 expect(h.unsubscribe).toHaveBeenCalledOnce();expect(old.remove).toHaveBeenCalledOnce();expect(h.prompts).toHaveLength(1);expect(h.openTab).not.toHaveBeenCalled();
});
it.each(['https://example.org/maps/moon-grotto','https://example.org/maps/overworld.wam-other','invalid'])('remains inactive outside the exact plaza: %s',room=>{
 const h=harness(room);expect(h.api.player.onPlayerMove).not.toHaveBeenCalled();expect(h.api.player.getPosition).not.toHaveBeenCalled();h.dispose();
});
it('places the interaction on the walkable front of the existing Newness desk',()=>{
 const l=JSON.parse(readFileSync('world/layouts/overworld.json','utf8')) as MapLayout;
 const desk=l.placements.find(p=>p.id==='sponsor-tier-spark-desk')!;
 expect(desk).toMatchObject({x:41,y:77,width:3,height:2});
 expect(l.placements.find(p=>p.id==='sponsor-tier-spark-laptop')).toMatchObject({x:42,y:77});
 const m=JSON.parse(readFileSync('maps/overworld.tmj','utf8')) as TiledMap;
 const mask=m.layers.find(l=>l.name==='physical-collisions') as TileLayer;
 for(let x=41;x<44;x++)expect(mask.data[79*m.width+x],`desk approach ${x},79`).toBe(0);
});
