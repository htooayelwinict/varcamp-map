import original from '../../world/check-in-counter.json';
import style from '../../world/check-in-counter-style.json';
const counter={...original,...style};

export interface CheckInApi {
 room: Pick<typeof WA.room,'id'|'website'>;
 player: Pick<typeof WA.player,'getPosition'|'onPlayerMove'>;
 nav: Pick<typeof WA.nav,'openTab'>;
 ui: Pick<typeof WA.ui,'displayActionMessage'>;
}
const signName='varcamp-check-in-sign';
const signPath=import.meta.env.DEV?'./index.html':`../src/check-in/index.html?v=${import.meta.env.VARCAMP_UI_RELEASE}`;
const signUrl=new URL(/* @vite-ignore */ signPath,import.meta.url).href;
export const CHECK_IN_MESSAGE='Check In · open the ticket check-in page';

/** The registration site forbids cross-origin framing. A normal browser link
 * keeps QR scanning and ticket upload on that site's own origin. No tickets or
 * attendance data are read or stored by the map. */
export function registerCheckInCounter(api:CheckInApi):()=>void{
 const id=new URL(api.room.id).pathname.split('/').at(-1)?.replace(/\.(wam|tmj)$/,'');
 if(id!==counter.mapId)return()=>{};
 const r=counter.interaction;
 let alive=true,inside=false,consumed=false,moved=false;
 let action:ReturnType<typeof api.ui.displayActionMessage>|undefined;
 const remove=()=>{const previous=action;action=undefined;if(previous)void previous.remove().catch(()=>{});};
 const update=({x,y}:{x:number;y:number})=>{
  if(!alive)return;
  const next=x>=r.x*32&&x<(r.x+r.width)*32&&y>=r.y*32&&y<(r.y+r.height)*32;
  if(!next){inside=false;consumed=false;remove();return;}
  inside=true;
  if(action||consumed)return;
  const offered=api.ui.displayActionMessage({message:CHECK_IN_MESSAGE,callback:()=>{
   if(!alive||!inside||action!==offered)return;
   consumed=true;remove();api.nav.openTab(counter.url);
  }});
  action=offered;
 };
 api.room.website.create({name:signName,url:signUrl,position:{x:counter.sign.x*32,y:counter.sign.y*32,width:counter.sign.width*32,height:counter.sign.height*32},allowApi:false,allow:'',visible:true,origin:'map'});
 const movement=api.player.onPlayerMove(position=>{moved=true;update(position);});
 void api.player.getPosition().then(position=>{if(!moved)update(position);}).catch(()=>{});
 return()=>{if(!alive)return;alive=false;movement.unsubscribe();remove();void api.room.website.delete(signName).catch(()=>{});};
}
