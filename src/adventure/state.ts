import {FLAG_IDS,flagKey} from './content';
export interface ExpeditionDriver {read(key:string):unknown;save(key:string,value:boolean):Promise<void>;}
/** One key per discovery avoids lost updates between maps. Confirmation is
 * separate from the host's optimistic cache; failed writes remain retryable. */
export function expeditionState(driver:ExpeditionDriver){
 const confirmed=new Set(FLAG_IDS.filter(id=>driver.read(flagKey(id))===true)),dirty=new Set<string>();
 const pending=new Map<string,Promise<void>>();
 const save=(id:string):Promise<void>=>{
  const key=flagKey(id),existing=pending.get(id);if(existing)return existing;
  if(confirmed.has(id)&&!dirty.has(id))return Promise.resolve();
  const operation=(async()=>{
   if(dirty.has(id)){await driver.save(key,confirmed.has(id));dirty.delete(id);}
   dirty.add(id);
   try{await driver.save(key,true);confirmed.add(id);dirty.delete(id);}
   catch(error){try{await driver.save(key,confirmed.has(id));dirty.delete(id);}catch{/* Explicit retry repairs the host cache before another save. */}throw error;}
  })().finally(()=>pending.delete(id));pending.set(id,operation);return operation;
 };
 return {flags:()=>new Set(confirmed),save};
}
export function seedSequence(random:()=>number=Math.random):number[]{return Array.from({length:5},()=>Math.min(3,Math.max(0,Math.floor(random()*4))));}
export const fishingResult=(biteAt:number,clickedAt:number)=>clickedAt<biteAt?'early':clickedAt-biteAt<=1400?'caught':'late';
