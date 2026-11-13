export interface NewnessApi {
 room: Pick<typeof WA.room,'id'>;
 player: Pick<typeof WA.player,'getPosition'|'onPlayerMove'>;
 nav: Pick<typeof WA.nav,'openTab'>;
 ui: Pick<typeof WA.ui,'displayActionMessage'>;
}

/** Offer the sponsor's careers site at the front of its existing laptop.
 * Opening it requires an attendee action; no embedded forms or auto-open. */
export function registerNewnessCareers(api:NewnessApi):()=>void {
 let id:string|undefined;
 try {id=new URL(api.room.id).pathname.split('/').at(-1)?.replace(/\.(wam|tmj)$/,'');}
 catch {return()=>{};}
 if(id!=='overworld')return()=>{};
 let alive=true,moved=false,inside=false,consumed=false;
 let action:ReturnType<typeof api.ui.displayActionMessage>|undefined;
 const remove=()=>{const old=action;action=undefined;if(old)void old.remove().catch(()=>{});};
 const update=({x,y}:{x:number;y:number})=>{
  if(!alive)return;
  const next=x>=41*32&&x<44*32&&y>=79*32&&y<80*32;
  if(next!==inside){remove();inside=next;consumed=false;}
  if(!inside||action||consumed)return;
  const offered=api.ui.displayActionMessage({message:'Newness careers · explore opportunities in a new tab',callback:()=>{
   if(!alive||!inside||action!==offered)return;
   consumed=true;remove();api.nav.openTab('https://career.newness.com.mm/');
  }});
  action=offered;
 };
 const movement=api.player.onPlayerMove(position=>{moved=true;update(position);});
 void api.player.getPosition().then(position=>{if(!moved)update(position);}).catch(()=>{});
 return()=>{if(!alive)return;alive=false;movement.unsubscribe();remove();};
}
