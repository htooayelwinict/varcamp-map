import {expect,it,vi} from 'vitest';
import {expeditionState,fishingResult,seedSequence} from '../src/adventure/state';
import {FLAG_IDS,flagKey,trailComplete} from '../src/adventure/content';
it('keeps old completion and saves new letter progress across a fresh journal',async()=>{
 const data:Record<string,boolean>={[flagKey('story-finished')]:true,[flagKey('discovery-taurus')]:true};
 const driver={read:(k:string)=>data[k],save:async(k:string,v:boolean)=>{data[k]=v;}};
 await expeditionState(driver).save('letter-orchard');
 const restored=expeditionState(driver).flags();
 expect(restored.has('story-finished')).toBe(true);expect(restored.has('discovery-taurus')).toBe(true);expect(restored.has('letter-orchard')).toBe(true);
 expect(restored.has('letter-grotto')).toBe(false);
});
it('repairs an optimistic rejected save and persists a later retry',async()=>{
 const raw:Record<string,boolean>={},durable:Record<string,boolean>={};let offline=true;
 const driver={read:(k:string)=>raw[k],save:async(k:string,v:boolean)=>{if(raw[k]===v)return;raw[k]=v;if(offline)throw Error('offline');durable[k]=v;}};
 const s=expeditionState(driver);
 await expect(s.save('discovery-taurus')).rejects.toThrow('offline');
 expect(s.flags().size).toBe(0);expect(expeditionState(driver).flags().size).toBe(0);
 offline=false;await s.save('discovery-taurus');expect(durable[flagKey('discovery-taurus')]).toBe(true);
 expect(expeditionState(driver).flags().has('discovery-taurus')).toBe(true);
});
it('coalesces repeated clicks and keeps flags independent',async()=>{
 let release!:()=>void;const save=vi.fn(async(k:string)=>{if(k===flagKey('discovery-taurus'))await new Promise<void>(r=>release=r);});
 const s=expeditionState({read:()=>undefined,save});const a=s.save('discovery-taurus'),b=s.save('discovery-taurus');expect(a).toBe(b);
 await s.save('activity-cafe');expect(s.flags().has('discovery-taurus')).toBe(false);
 release();await a;await s.save('discovery-taurus');expect(save).toHaveBeenCalledTimes(2);
 const copy=s.flags();copy.clear();expect(s.flags().size).toBe(2);
});
it('requires all twelve clues and four activities, but no fish, for the ending',()=>{
 const required=FLAG_IDS.filter(k=>k.startsWith('discovery-')||k.startsWith('activity-'));
 expect(required).toHaveLength(16);expect(trailComplete(new Set(required))).toBe(true);
 for(const missing of required)expect(trailComplete(new Set(required.filter(k=>k!==missing)))).toBe(false);
 expect(()=>flagKey('admin')).toThrow();
});
it('keeps memory sequences bounded and fishing reaction outcomes explicit',()=>{
 expect(seedSequence(()=>0)).toEqual([0,0,0,0,0]);expect(seedSequence(()=>.999)).toEqual([3,3,3,3,3]);
 expect(fishingResult(Infinity,100)).toBe('early');expect(fishingResult(100,1500)).toBe('caught');expect(fishingResult(100,1501)).toBe('late');
});
