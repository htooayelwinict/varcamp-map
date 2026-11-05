import {expect,it,vi} from 'vitest';
import {registerExpedition,type AdventureApi} from '../src/adventure/interactions';
function mock(map:string){
 const enter=new Map<string,()=>void>(),leave=new Map<string,()=>void>(),unsubscribe=vi.fn(),remove=vi.fn(async()=>{}),openModal=vi.fn(),callbacks:(()=>void)[]=[];
 const api={room:{id:`https://play.example/~/varcamp/maps/${map}.wam`},mapEditor:{area:{onEnter:(name:string)=>({subscribe:(fn:()=>void)=>{enter.set(name,fn);return{unsubscribe};}}),onLeave:(name:string)=>({subscribe:(fn:()=>void)=>{leave.set(name,fn);return{unsubscribe};}})}},ui:{registerMenuCommand:vi.fn(),displayActionMessage:vi.fn((o:{callback:()=>void})=>{callbacks.push(o.callback);return{remove};}),modal:{openModal}}};
 return {api:api as unknown as AdventureApi,enter,leave,unsubscribe,remove,openModal,callbacks,raw:api};
}
it('only registers on the five exploration maps',()=>{
 const m=mock('overworld');registerExpedition(m.api)();expect(m.enter.size).toBe(0);expect(m.raw.ui.registerMenuCommand).not.toHaveBeenCalled();
});
it('opens activities only on explicit action and removes stale prompts',()=>{
 const m=mock('star-garden'),dispose=registerExpedition(m.api);
 m.enter.get('Moon Pond')!();expect(m.openModal).not.toHaveBeenCalled();
 m.callbacks[0]();expect(m.openModal).toHaveBeenCalledOnce();expect(m.openModal.mock.calls[0][0].src).toMatch(/#fishing$/);
 m.callbacks[0]();expect(m.openModal).toHaveBeenCalledOnce();
 m.enter.get('TAURUS Memory')!();m.leave.get('TAURUS Memory')!();m.callbacks[1]();expect(m.openModal).toHaveBeenCalledOnce();
 dispose();expect(m.unsubscribe).toHaveBeenCalledTimes(12);
 m.enter.get('Moon Pond')!();expect(m.raw.ui.displayActionMessage).toHaveBeenCalledTimes(2);
});
