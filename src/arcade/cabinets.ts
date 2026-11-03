import roster from '../../world/arcade-games.json';

export interface ArcadeApi {
 room: Pick<typeof WA.room,'id'>;
 player: Pick<typeof WA.player,'getPosition'|'onPlayerMove'>;
 nav: Pick<typeof WA.nav,'openTab'>;
 ui: Pick<typeof WA.ui,'displayActionMessage'>;
}

/** Games load on their publishers' origins only after an attendee acts. This
 * keeps pointer lock, fullscreen and sign-in out of the map iframe, and costs
 * no game downloads or game-server connections while walking through the room. */
export function registerArcadeCabinets(api:ArcadeApi):()=>void {
 let id:string|undefined;
 try {id=new URL(api.room.id).pathname.split('/').at(-1)?.replace(/\.(wam|tmj)$/,'');}
 catch {return()=>{};}
 if(id!==roster.mapId)return()=>{};
 let alive=true,moved=false,consumed=false;
 let current:typeof roster.cabinets[number]|undefined;
 let action:ReturnType<typeof api.ui.displayActionMessage>|undefined;
 const remove=()=>{const old=action;action=undefined;if(old)void old.remove().catch(()=>{});};
 const update=({x,y}:{x:number;y:number})=>{
  if(!alive)return;
  const next=roster.cabinets.find(({interaction:r})=>x>=r.x*32&&x<(r.x+r.width)*32&&y>=r.y*32&&y<(r.y+r.height)*32);
  if(next!==current){remove();current=next;consumed=false;}
  if(!current||action||consumed)return;
  const cabinet=current,game=roster.games.find(g=>g.id===cabinet.gameId)!;
  const offered=api.ui.displayActionMessage({message:`Play ${game.name} · ${game.kind} · opens in a new tab`,callback:()=>{
   if(!alive||current!==cabinet||action!==offered)return;
   consumed=true;remove();api.nav.openTab(game.url);
  }});
  action=offered;
 };
 const movement=api.player.onPlayerMove(position=>{moved=true;update(position);});
 void api.player.getPosition().then(position=>{if(!moved)update(position);}).catch(()=>{});
 return()=>{if(!alive)return;alive=false;movement.unsubscribe();remove();current=undefined;};
}
