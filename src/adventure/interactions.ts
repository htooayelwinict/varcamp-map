import locations from '../../world/exploration-actions.json';
import {ADVENTURE_MAPS,ACTIVITIES,DISCOVERIES,LETTERS} from './content';
export interface AdventureApi {
 room:Pick<typeof WA.room,'id'>;
 mapEditor:{area:Pick<typeof WA.mapEditor.area,'onEnter'|'onLeave'>};
 ui:Pick<typeof WA.ui,'displayActionMessage'|'registerMenuCommand'|'modal'>;
}
const path=import.meta.env.DEV?'./index.html':`../src/adventure/index.html?v=${import.meta.env.VARCAMP_UI_RELEASE}`;
const asset=new URL(/* @vite-ignore */path,import.meta.url).href;
export function registerExpedition(api:AdventureApi):()=>void{
 const id=new URL(api.room.id).pathname.split('/').at(-1)?.replace(/\.(wam|tmj)$/,'');
 if(!(ADVENTURE_MAPS as readonly string[]).includes(id??''))return()=>{};
 let alive=true;
 const subscriptions:{unsubscribe():void}[]=[],cleanups:(()=>void)[]=[];
 const open=(site:string)=>{if(alive)api.ui.modal.openModal({src:asset+'#'+site,title:'The Lantern Trail · Expedition Journal',allow:null,allowApi:true,position:'center',allowFullScreen:true,closable:true});};
 api.ui.registerMenuCommand('Expedition Journal',{key:'varcamp-expedition',callback:()=>open('journal')});
 const bind=(areaId:string,message:string,site:string)=>{
  const area=locations.find(a=>a.map===id&&a.id===areaId)?.name;if(!area)throw Error('Missing expedition station '+areaId);
  let prompt:ReturnType<typeof api.ui.displayActionMessage>|undefined;
  const remove=()=>{const old=prompt;prompt=undefined;if(old)void old.remove().catch(()=>{});};
  subscriptions.push(api.mapEditor.area.onEnter(area).subscribe(()=>{if(!alive)return;remove();const p=api.ui.displayActionMessage({message,callback:()=>{if(!alive||prompt!==p)return;remove();open(site);}});prompt=p;}),api.mapEditor.area.onLeave(area).subscribe(remove));cleanups.push(remove);
 };
 bind('exp-story','Speak with the woodland spirit','story');
 if(id==='campus-exploration')bind('exp-journal','Start the Lantern Trail · field guide','journal');
 if(id==='star-garden')bind('exp-fishing','Try moon-pond fishing','fishing');
 for(const d of DISCOVERIES)if(d.map===id)bind('exp-discovery-'+d.id,'Investigate · '+d.title,'discovery-'+d.id);
 for(const a of ACTIVITIES)if(a.map===id)bind('exp-'+a.id+'-game',a.name+' · play',a.id);
 for(const letter of LETTERS)if(letter.map===id)bind('exp-letter-'+letter.id,'Read the lost letter · '+letter.title,'letter-'+letter.id);
 return()=>{alive=false;subscriptions.forEach(s=>s.unsubscribe());cleanups.forEach(f=>f());};
}

export interface JyotishApi {
 room:Pick<typeof WA.room,'id'>;
 player:Pick<typeof WA.player,'getPosition'|'onPlayerMove'>;
 nav:Pick<typeof WA.nav,'openTab'>;
 ui:Pick<typeof WA.ui,'displayActionMessage'>;
}

/** Public crystal beside Moon Grotto's arrival; independent of quest progress. */
export function registerJyotish(api:JyotishApi):()=>void {
 let id:string|undefined;
 try {id=new URL(api.room.id).pathname.split('/').at(-1)?.replace(/\.(wam|tmj)$/,'');}
 catch {return()=>{};}
 if(id!=='moon-grotto')return()=>{};
 let alive=true,moved=false,inside=false,consumed=false;
 let action:ReturnType<typeof api.ui.displayActionMessage>|undefined;
 const remove=()=>{const old=action;action=undefined;if(old)void old.remove().catch(()=>{});};
 const update=({x,y}:{x:number;y:number})=>{
  if(!alive)return;
  const next=x>=29*32&&x<33*32&&y>=48*32&&y<49*32;
  if(next!==inside){remove();inside=next;consumed=false;}
  if(!inside||action||consumed)return;
  const offered=api.ui.displayActionMessage({message:'Jyotish Astrology · explore your reading in a new tab',callback:()=>{
   if(!alive||!inside||action!==offered)return;
   consumed=true;remove();api.nav.openTab('https://suriyamudra.tech/baydin');
  }});
  action=offered;
 };
 const movement=api.player.onPlayerMove(position=>{moved=true;update(position);});
 void api.player.getPosition().then(position=>{if(!moved)update(position);}).catch(()=>{});
 return()=>{if(!alive)return;alive=false;movement.unsubscribe();remove();};
}
