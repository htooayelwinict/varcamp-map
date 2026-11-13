import {it,expect,vi} from 'vitest';
import {registerProgrammeBoards,type ProgrammeBoardApi} from '../src/programme/boards';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function fixture(map='overworld'){
 let move=(_p:{x:number;y:number})=>{};
 let initial!:(p:{x:number;y:number})=>void;
 const actions:{callback:()=>void;remove:ReturnType<typeof vi.fn>}[]=[];
 const create=vi.fn((_options:unknown)=>({})),get=vi.fn(async()=>({})),del=vi.fn(async()=>{}),openModal=vi.fn(),unsubscribe=vi.fn();
 const api={room:{id:`https://play.example/@/varcamp/world/varcamp-2026/maps/${map}`,website:{create,get,delete:del}},player:{getPosition:()=>new Promise(r=>{initial=r;}),onPlayerMove:(cb:typeof move)=>{move=cb;return{unsubscribe};}},ui:{modal:{openModal},displayActionMessage:({callback}:{callback:()=>void})=>{const a={callback,remove:vi.fn(async()=>{})};actions.push(a);return a;}}}as unknown as ProgrammeBoardApi;
 return{api,actions,create,get,del,openModal,unsubscribe,move:(p:{x:number;y:number})=>move(p),initial:(p:{x:number;y:number})=>initial(p)};
}
const arrival={x:56*32,y:59*32+16};
it('loads a nearby clickable board and opens the panel only after deliberate activation',async()=>{
 const f=fixture(),dispose=registerProgrammeBoards(f.api);f.move(arrival);await tick();
 expect(f.create).toHaveBeenCalledOnce();expect(f.get).toHaveBeenCalledWith('varcamp-programme-arrival');expect(f.create.mock.calls[0][0]).toMatchObject({allowApi:true,position:{x:54*32,y:55*32,width:128,height:96}});
 expect(f.openModal).not.toHaveBeenCalled();expect(f.actions).toHaveLength(1);f.actions[0].callback();
 expect(f.openModal).toHaveBeenCalledOnce();expect(f.openModal.mock.calls[0][0].src).toContain('room=all');
 f.actions[0].callback();expect(f.openModal).toHaveBeenCalledOnce();dispose();
});
it('room boards filter to their room and stale actions cannot open after leaving',async()=>{
 const f=fixture(),dispose=registerProgrammeBoards(f.api);f.move({x:102*32,y:74*32+16});await tick();
 f.actions[0].callback();expect(f.openModal.mock.calls[0][0].src).toContain('room=aries');
 f.move({x:0,y:0});f.move(arrival);const action=f.actions.at(-1)!;f.move({x:0,y:0});action.callback();
 expect(f.openModal).toHaveBeenCalledOnce();dispose();
});
it('waits for creation acknowledgement before deleting a board after leaving or disposing',async()=>{
 for(const disposeEarly of [false,true]){
  const f=fixture();let resolve!:()=>void;f.get.mockImplementation(()=>new Promise(r=>{resolve=()=>r({});}));
  const dispose=registerProgrammeBoards(f.api);f.move(arrival);f.move(arrival);expect(f.create).toHaveBeenCalledOnce();
  if(disposeEarly)dispose();else f.move({x:0,y:0});expect(f.del).not.toHaveBeenCalled();
  resolve();await tick();expect(f.del).toHaveBeenCalledExactlyOnceWith('varcamp-programme-arrival');dispose();
 }
});
it('ignores late initial position and removes subscriptions once',async()=>{
 const f=fixture(),dispose=registerProgrammeBoards(f.api);f.move({x:0,y:0});f.initial(arrival);await tick();expect(f.create).not.toHaveBeenCalled();dispose();dispose();expect(f.unsubscribe).toHaveBeenCalledOnce();
 const elsewhere=fixture('speaker-aries');registerProgrammeBoards(elsewhere.api)();expect(elsewhere.create).not.toHaveBeenCalled();
});
