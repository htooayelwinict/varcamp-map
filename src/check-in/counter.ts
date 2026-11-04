import counter from '../../world/check-in-counter.json';
import stationData from '../../world/check-in-stations.json';

export interface CheckInApi {
 room: Pick<typeof WA.room,'id'|'website'>;
 player: Pick<typeof WA.player,'getPosition'|'onPlayerMove'>;
 nav: Pick<typeof WA.nav,'openTab'>;
 ui: Pick<typeof WA.ui,'displayActionMessage'>;
}
const signPath=import.meta.env.DEV?'./index.html':`../src/check-in/index.html?v=${import.meta.env.VARCAMP_UI_RELEASE}`;
const signUrl=new URL(/* @vite-ignore */ signPath,import.meta.url).href;
export const CHECK_IN_MESSAGE='Check In · open the ticket check-in page';

/** The registration site forbids cross-origin framing. A normal browser link
 * keeps QR scanning and ticket upload on that site's own origin. No tickets or
 * attendance data are read or stored by the map. */
export function registerCheckInCounter(api:CheckInApi):()=>void{
 const id=new URL(api.room.id).pathname.split('/').at(-1)?.replace(/\.(wam|tmj)$/,'');
 if(id!==stationData.mapId)return()=>{};
 const stations=stationData.stations,signs=new Set<string>();
 const signName=(id:string)=>id==='arrival'?'varcamp-check-in-sign':`varcamp-check-in-${id}`;
 let alive=true,current:string|undefined,consumed=false,moved=false;
 let action:ReturnType<typeof api.ui.displayActionMessage>|undefined;
 const remove=()=>{const previous=action;action=undefined;if(previous)void previous.remove().catch(()=>{});};
 const update=({x,y}:{x:number;y:number})=>{
  if(!alive)return;
  // Only nearby desks need a clickable iframe. Offscreen stations cost no frames.
  for(const s of stations){
   const d=s.desk,name=signName(s.id),near=x>=(d.x-8)*32&&x<(d.x+d.width+8)*32&&y>=(d.y-8)*32&&y<(d.y+d.height+8)*32;
   if(near&&!signs.has(name)){
    signs.add(name);
    void Promise.resolve(api.room.website.create({name,url:signUrl,position:{x:d.x*32,y:d.y*32,width:d.width*32,height:d.height*32},allowApi:false,allow:'',visible:true,origin:'map'})).catch(()=>{});
   }else if(!near&&signs.delete(name))void api.room.website.delete(name).catch(()=>{});
  }
  const station=stations.find(s=>{const r=s.interaction;return x>=r.x*32&&x<(r.x+r.width)*32&&y>=r.y*32&&y<(r.y+r.height)*32;});
  if(station?.id!==current){current=station?.id;consumed=false;remove();}
  if(!station)return;
  if(action||consumed)return;
  const offered=api.ui.displayActionMessage({message:CHECK_IN_MESSAGE,callback:()=>{
   if(!alive||current!==station.id||action!==offered)return;
   consumed=true;remove();api.nav.openTab(counter.url);
  }});
  action=offered;
 };
 const movement=api.player.onPlayerMove(position=>{moved=true;update(position);});
 void api.player.getPosition().then(position=>{if(!moved)update(position);}).catch(()=>{});
 return()=>{if(!alive)return;alive=false;movement.unsubscribe();remove();for(const name of signs)void api.room.website.delete(name).catch(()=>{});signs.clear();};
}
