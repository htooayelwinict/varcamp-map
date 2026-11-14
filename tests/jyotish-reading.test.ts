import {readFileSync} from 'node:fs';
import {expect,it,vi} from 'vitest';
import * as interactions from '../src/adventure/interactions';
import type {JyotishApi} from '../src/adventure/interactions';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import {loadTileCatalog} from '../tools/art/catalog';

const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
function harness(room='https://play.workadventu.re/@/varcamp/world/varcamp-2026/maps/moon-grotto'){
 const register=Reflect.get(interactions,'registerJyotish') as ((api:JyotishApi)=>()=>void)|undefined;
 expect(register,'Jyotish reading action is registered').toBeTypeOf('function');
 let move:(p:{x:number;y:number})=>void=()=>{};
 let resolve!:(p:{x:number;y:number})=>void;
 const unsubscribe=vi.fn(),openTab=vi.fn();
 const prompts:{message:string;callback:()=>void;remove:ReturnType<typeof vi.fn>}[]=[];
 const api={room:{id:room},nav:{openTab},player:{
  getPosition:vi.fn(()=>new Promise<{x:number;y:number}>(r=>{resolve=r;})),
  onPlayerMove:vi.fn((cb:typeof move)=>{move=cb;return{unsubscribe};}),
 },ui:{displayActionMessage:vi.fn(({message,callback}:{message:string;callback:()=>void})=>{
  const p={message,callback,remove:vi.fn(async()=>{})};prompts.push(p);return p;
 })}} as unknown as JyotishApi;
 const dispose=register!(api);
 return{api,dispose,prompts,unsubscribe,openTab,move:(x:number,y:number)=>move({x:x*32,y:y*32}),resolve:(x:number,y:number)=>resolve({x:x*32,y:y*32})};
}
it.each(['https://play.workadventu.re/@/varcamp/world/varcamp-2026/maps/moon-grotto','https://example.org/maps/moon-grotto.wam','https://example.org/maps/moon-grotto.tmj'])('offers the correct reading once after deliberate activation in %s',room=>{
 const h=harness(room);h.move(30.5,48.5);expect(h.prompts).toHaveLength(1);
 expect(h.prompts[0].message).toContain('Jyotish Astrology');expect(h.prompts[0].message).toContain('new tab');expect(h.openTab).not.toHaveBeenCalled();
 h.move(30.6,48.5);expect(h.prompts).toHaveLength(1);h.prompts[0].callback();h.prompts[0].callback();
 expect(h.openTab).toHaveBeenCalledExactlyOnceWith('https://suriyamudra.tech/baydin');h.dispose();
});
it('does not advertise from the crystal artwork, existing Moon Echoes game or outside the front row',()=>{
 const h=harness();for(const[x,y]of[[28.99,48.5],[33,48.5],[30,47.99],[30,49],[34,29],[30,46]])h.move(x,y);
 expect(h.prompts).toHaveLength(0);h.move(29,48);const old=h.prompts[0];h.move(37,48);expect(old.remove).toHaveBeenCalledOnce();old.callback();expect(h.openTab).not.toHaveBeenCalled();
 h.move(32.99,48.99);expect(h.prompts).toHaveLength(2);old.callback();expect(h.openTab).not.toHaveBeenCalled();h.dispose();
});
it('supports an initial approach spawn but rejects a stale initial position',async()=>{
 const h=harness();h.resolve(30.5,48.5);await Promise.resolve();expect(h.prompts).toHaveLength(1);expect(h.openTab).not.toHaveBeenCalled();h.dispose();
 const moved=harness();moved.move(20,30);moved.resolve(30.5,48.5);await Promise.resolve();expect(moved.prompts).toHaveLength(0);moved.dispose();
});
it('cleans up once and ignores movement and old actions after leaving the map',async()=>{
 const h=harness();h.move(30.5,48.5);const old=h.prompts[0];h.dispose();h.dispose();old.callback();h.move(30.5,48.5);h.resolve(30.5,48.5);await Promise.resolve();
 expect(h.unsubscribe).toHaveBeenCalledOnce();expect(old.remove).toHaveBeenCalledOnce();expect(h.prompts).toHaveLength(1);expect(h.openTab).not.toHaveBeenCalled();
});
it.each(['https://example.org/maps/stargazer-terrace','https://example.org/maps/moon-grotto.wam-evil','invalid'])('stays dormant outside the exact moon grotto: %s',room=>{
 const h=harness(room);expect(h.api.player.getPosition).not.toHaveBeenCalled();expect(h.api.player.onPlayerMove).not.toHaveBeenCalled();h.dispose();
});
it('labels the public entrance crystal and preserves clear access and existing activities',()=>{
 const l=read('world/layouts/moon-grotto.json'),m=read('maps/moon-grotto.tmj');
 expect(l.placements.find((p:any)=>p.id==='woodland-1152')).toMatchObject({sprite:'exp-crystal-tall',x:30,y:46,width:1,height:2});
 const sign={name:'jyotish-reading',text:'JYOTISH ASTROLOGY',x:27,y:48,width:8,height:1,fontSize:13};
 expect(l.signs.find((s:any)=>s.name==='jyotish-reading')).toMatchObject(sign);
 expect(m.layers.find((l:any)=>l.name==='wayfinding-text').objects.find((o:any)=>o.name==='jyotish-reading')).toMatchObject({x:864,y:1536,width:256,height:32,text:{text:'JYOTISH ASTROLOGY'}});
 const mask=m.layers.find((l:any)=>l.name==='physical-collisions').data;
 for(let x=29;x<33;x++)expect(mask[48*m.width+x],`clear crystal approach ${x},48`).toBe(0);
 expect(l.areas.find((a:any)=>a.id==='exp-grotto-game')).toMatchObject({x:34,y:29,width:2,height:2});
 expect(l.entries.find((e:any)=>e.isDefault)).toMatchObject({x:31,y:49,width:2,height:2});
 expect(()=>assertCurrentNativeMap('moon-grotto',m,l,read('maps/moon-grotto.wam'),loadTileCatalog())).not.toThrow();
 const damaged=structuredClone(m);damaged.layers.find((l:any)=>l.name==='wayfinding-text').objects.find((o:any)=>o.name==='jyotish-reading').x+=32;
 expect(()=>assertCurrentNativeMap('moon-grotto',damaged,l,read('maps/moon-grotto.wam'),loadTileCatalog())).toThrow();
});
