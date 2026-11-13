import data from '../../world/programme-boards.json';
import {openProgramme} from './access';
export interface ProgrammeBoardApi {
 room: Pick<typeof WA.room,'id'|'website'>;
 player: Pick<typeof WA.player,'getPosition'|'onPlayerMove'>;
 ui: Pick<typeof WA.ui,'displayActionMessage'|'modal'|'actionBar'>;
}
const path=import.meta.env.DEV?'./board.html':`../src/programme/board.html?v=${import.meta.env.VARCAMP_UI_RELEASE}`;
const boardUrl=new URL(/* @vite-ignore */ path,import.meta.url).href;
/** Each frame has a serialized lifecycle, including a create that finishes after departure. */
export function registerProgrammeBoards(api:ProgrammeBoardApi):()=>void {
 const map=new URL(api.room.id).pathname.split('/').at(-1)?.replace(/\.(wam|tmj)$/,'');
 if(map!==data.mapId)return()=>{};
 let alive=true,moved=false,current='',consumed=false;
 let action:ReturnType<typeof api.ui.displayActionMessage>|undefined;
 const states=data.boards.map(board=>({board,wanted:false,visible:false,busy:false}));
 const remove=()=>{const old=action;action=undefined;if(old)void old.remove().catch(()=>{});};
 async function sync(state:typeof states[number]):Promise<void>{
  if(state.busy)return;state.busy=true;
  try{
   while(state.visible!==(alive&&state.wanted)){
    const name='varcamp-programme-'+state.board.id;
    if(alive&&state.wanted){
     const f=state.board.face,url=new URL(boardUrl);url.searchParams.set('room',state.board.room);
     api.room.website.create({name,url:url.href,position:{x:f.x*32,y:f.y*32,width:f.width*32,height:f.height*32},allowApi:true,allow:'',visible:true,origin:'map'});
     await api.room.website.get(name); // create returns a proxy; get acknowledges the host object.
     state.visible=true;
    }else{await api.room.website.delete(name);state.visible=false;}
   }
  }catch{ /* Movement retries failed creates; the toolbar remains available. */ }
  finally{state.busy=false;}
 }
 const update=({x,y}:{x:number;y:number})=>{
  if(!alive)return;
  for(const state of states){const f=state.board.face;state.wanted=x>=(f.x-6)*32&&x<(f.x+f.width+6)*32&&y>=(f.y-6)*32&&y<(f.y+f.height+6)*32;void sync(state);}
  const board=data.boards.find(({face:f})=>x>=f.x*32&&x<(f.x+f.width)*32&&y>=(f.y+f.height+1)*32&&y<(f.y+f.height+2)*32);
  if((board?.id??'')!==current){remove();current=board?.id??'';consumed=false;}
  if(!board||action||consumed)return;
  const offered=api.ui.displayActionMessage({message:'Programme · view talks, speakers and rooms',callback:()=>{
   if(!alive||action!==offered||current!==board.id)return;
   consumed=true;remove();openProgramme(api,board.room);
  }});action=offered;
 };
 const movement=api.player.onPlayerMove(p=>{moved=true;update(p);});
 void api.player.getPosition().then(p=>{if(!moved)update(p);}).catch(()=>{});
 return()=>{if(!alive)return;alive=false;movement.unsubscribe();remove();for(const state of states)void sync(state);};
}
