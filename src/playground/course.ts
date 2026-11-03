import course from '../../world/orbit-course.json';
export interface CourseApi {
 room: Pick<typeof WA.room,'id'>;
 player: Pick<typeof WA.player,'getPosition'|'onPlayerMove'|'state'>;
 ui: Pick<typeof WA.ui,'displayActionMessage'>;
}
type Position={x:number;y:number};
type Rect=Position&{width:number;height:number};
const inside=(p:Position,r:Rect)=>p.x>=r.x*32&&p.x<(r.x+r.width)*32&&p.y>=r.y*32&&p.y<(r.y+r.height)*32;
const key='varcamp-orbit-personal-best-v1';
/** A Woka walking game. No game server, media tracks or polling are started.
 * Personal scores use WorkAdventure's private, persisted player state. The
 * script iframe is sandboxed and cannot access browser localStorage directly. */
export function registerOrbitCourse(api:CourseApi,now=()=>performance.now()):()=>void {
 let id:string|undefined;
 try{id=new URL(api.room.id).pathname.split('/').at(-1)?.replace(/\.(wam|tmj)$/,'');}catch{return()=>{};}
 if(id!==course.mapId)return()=>{};
 let alive=true,moved=false,position:Position|undefined,started:number|undefined,next=0;
 let timer:ReturnType<typeof setTimeout>|undefined;
 let prompt:ReturnType<typeof api.ui.displayActionMessage>|undefined;
 let message='',best=Infinity,finished=false;
 const storedBest=()=>{try{const v=api.player.state[key];return typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=course.maxSeconds?v:Infinity;}catch{return Infinity;}};
 best=storedBest();
 const remove=()=>{const old=prompt;prompt=undefined;message='';if(old)void old.remove().catch(()=>{});};
 const stop=()=>{started=undefined;next=0;if(timer)clearTimeout(timer);timer=undefined;};
 const offer=(text:string,action:()=>void)=>{
  if(message===text)return;remove();message=text;
  const p=api.ui.displayActionMessage({message:text,callback:()=>{if(alive&&prompt===p)action();}});prompt=p;
 };
 const start=()=>{
  if(!position||!inside(position,course.start)||started!==undefined)return;
  finished=false;started=now();next=0;
  timer=setTimeout(()=>{if(!alive||started===undefined)return;stop();offer('Orbit run timed out. Return to START for another try.',()=>{remove();update();});},course.maxSeconds*1000);
  progress();
 };
 const progress=()=>offer(`ORBIT RUN · ${next}/8 · Walk to ${next===7?'FINISH':`pad ${next+1}`} · Press Space to cancel`,()=>{stop();remove();update();});
 const update=()=>{
  if(!alive||!position)return;
  if(started!==undefined){
   const elapsed=now()-started;
   if(elapsed<0||elapsed>course.maxSeconds*1000){stop();remove();update();return;}
   if(!inside(position,course.checkpoints[next]))return;
   next++;
   if(next<course.checkpoints.length){progress();return;}
   const seconds=elapsed/1000;stop();finished=true;
   best=Math.min(best,storedBest());
   if(seconds>0&&seconds<best){best=seconds;try{void api.player.state.saveVariable(key,seconds,{public:false,persist:true,scope:'room'}).catch(()=>{});}catch{/* Keep the result for this session if persistence is unavailable. */}}
   offer(`FINISHED · ${seconds.toFixed(1)}s · Your best: ${Number.isFinite(best)?best.toFixed(1)+'s':'—'} · Space: race again`,()=>{remove();start();});
   return;
  }
  if(inside(position,course.start)){
   if(!finished)offer('ORBIT RUN · Space to start · Follow pads 1–7, then return to FINISH',start);
  }else {finished=false;remove();}
 };
 const move=api.player.onPlayerMove(p=>{moved=true;position=p;update();});
 void api.player.getPosition().then(p=>{if(!moved){position=p;update();}}).catch(()=>{});
 return()=>{if(!alive)return;alive=false;move.unsubscribe();stop();remove();};
}
