import data from '../../world/programme.json';
import {openProgramme} from './access';
import './board.css';
const room=data.rooms.find(r=>r.room_id===new URLSearchParams(location.search).get('room'));
const board=document.querySelector<HTMLButtonElement>('#board')!;
board.setAttribute('aria-label',room?`${room.room_code} · ${room.room_name} programme`:'VarCamp full programme');
for(const [tag,text]of [['small',room?`${room.room_code} · ${room.room_name}`:'15 NOV · MYANMAR TIME'],['strong','PROGRAMME'],['span',room?'Talks & speakers ↗':'56 talks · 12 rooms ↗']]){
 const node=document.createElement(tag);node.textContent=text;board.append(node);
}
void WA.onInit().then(()=>{board.disabled=false;board.addEventListener('click',()=>openProgramme(WA,room?.room_id));}).catch(()=>{board.title='Use the Programme toolbar to view the schedule';});
