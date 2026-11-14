import {describe, expect, it, vi} from 'vitest';
import {registerArcadeCabinets, type ArcadeApi} from '../src/arcade/cabinets';

function harness(room='https://example.org/~/demo/maps/nebula-arcade.wam') {
 let move:(position:{x:number;y:number})=>void=()=>{};
 let resolve!:(position:{x:number;y:number})=>void;
 const prompts:{message:string;callback:()=>void;remove:ReturnType<typeof vi.fn>}[]=[];
 const unsubscribe=vi.fn(),openTab=vi.fn();
 const api={room:{id:room},nav:{openTab},player:{
  getPosition:vi.fn(()=>new Promise<{x:number;y:number}>(r=>{resolve=r;})),
  onPlayerMove:vi.fn((cb:typeof move)=>{move=cb;return{unsubscribe};}),
 },ui:{displayActionMessage:vi.fn(({message,callback}:any)=>{
  const p={message,callback,remove:vi.fn(async()=>{})};prompts.push(p);return p;
 })}} as unknown as ArcadeApi;
 const dispose=registerArcadeCabinets(api);
 return {api,dispose,prompts,unsubscribe,openTab,move:(x:number,y:number)=>move({x:x*32,y:y*32}),resolve:(x:number,y:number)=>resolve({x:x*32,y:y*32})};
}

describe('arcade cabinet actions',()=>{
 it('stays dormant outside the arcade, including invalid room identifiers',()=>{
  for(const id of ['https://example.org/maps/overworld.wam','not-a-url','https://example.org/maps/nebula-arcade.wam-evil']){
   const h=harness(id);expect(h.api.player.getPosition).not.toHaveBeenCalled();expect(h.api.player.onPlayerMove).not.toHaveBeenCalled();h.dispose();
  }
 });
 it.each([
  {placementId:'cabinet-west0',x:4,y:13,name:'OpenTaxi',url:'https://myanmar.opentaxi.world/opentaxi/'},
  {placementId:'cabinet-east0',x:30,y:13,name:'War Brokers',url:'https://warbrokers.io/'},
  {placementId:'cabinet-west1',x:4,y:20,name:'DEADSHOT',url:'https://deadshot.io/'},
  {placementId:'cabinet-east1',x:30,y:20,name:'DEADSHOT',url:'https://deadshot.io/'},
  {placementId:'cabinet-west2',x:4,y:27,name:'HaxBall',url:'https://www.haxball.com/play'},
  {placementId:'cabinet-east2',x:30,y:27,name:'HaxBall',url:'https://www.haxball.com/play'},
 ])('offers $placementId only at its front and opens its assigned game once',game=>{
  const h=harness(),r=game;
  h.move(r.x+.5,r.y-.5);expect(h.prompts).toHaveLength(0);
  h.move(r.x+.5,r.y+.5);expect(h.prompts).toHaveLength(1);expect(h.prompts[0].message).toContain(game.name);expect(h.prompts[0].message).toContain('new tab');
  expect(h.openTab).not.toHaveBeenCalled();h.move(r.x+1,r.y+1);expect(h.prompts).toHaveLength(1);
  h.prompts[0].callback();h.prompts[0].callback();expect(h.openTab).toHaveBeenCalledExactlyOnceWith(game.url);
  h.move(r.x+2,r.y+1);expect(h.prompts).toHaveLength(1);
  h.move(20,31);h.move(r.x+.5,r.y+.5);expect(h.prompts).toHaveLength(2);h.dispose();
 });
 it('uses half-open rectangles and rejects stale prompts when moving between cabinets',()=>{
  const h=harness();h.move(8,13);expect(h.prompts).toHaveLength(0);h.move(4,15);expect(h.prompts).toHaveLength(0);
  h.move(4,13);const first=h.prompts[0];h.move(30,20);expect(first.remove).toHaveBeenCalledOnce();first.callback();expect(h.openTab).not.toHaveBeenCalled();
  h.prompts[1].callback();expect(h.openTab).toHaveBeenCalledExactlyOnceWith('https://deadshot.io/');h.dispose();
 });
 it('does not let a delayed initial position resurrect an old prompt',async()=>{
  const h=harness();h.move(20,31);h.resolve(5,14);await Promise.resolve();expect(h.prompts).toHaveLength(0);h.dispose();
 });
 it('offers a prompt for an initial spawn at a cabinet',async()=>{
  const h=harness();h.resolve(5,14);await Promise.resolve();expect(h.prompts).toHaveLength(1);expect(h.openTab).not.toHaveBeenCalled();h.dispose();
 });
 it('cleans up once and ignores movement, late position and old callbacks after disposal',async()=>{
  const h=harness();h.move(5,14);const old=h.prompts[0];h.dispose();h.dispose();old.callback();h.move(31,21);h.resolve(5,14);await Promise.resolve();
  expect(h.unsubscribe).toHaveBeenCalledOnce();expect(old.remove).toHaveBeenCalledOnce();expect(h.prompts).toHaveLength(1);expect(h.openTab).not.toHaveBeenCalled();
 });
});
