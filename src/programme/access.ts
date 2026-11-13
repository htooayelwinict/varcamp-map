const panelPath=import.meta.env.DEV?'./index.html':`../src/programme/index.html?v=${import.meta.env.VARCAMP_UI_RELEASE}`;
export const programmeUrl=new URL(/* @vite-ignore */ panelPath,import.meta.url).href;
type ProgrammeAccessApi={room:Pick<typeof WA.room,'id'>;ui:Pick<typeof WA.ui,'modal'|'actionBar'>};
const roomIds=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
export function openProgramme(api:Pick<ProgrammeAccessApi,'ui'>,room='all'):void{
 const url=new URL(programmeUrl);url.searchParams.set('room',roomIds.includes(room)?room:'all');
 api.ui.modal.openModal({src:url.href,title:'VarCamp Programme',position:'right',allow:null,allowApi:true,closable:true,allowFullScreen:false});
}
export function registerProgrammeAccess(api:ProgrammeAccessApi):void{
 const map=new URL(api.room.id).pathname.split('/').at(-1)?.replace(/\.(wam|tmj)$/,'');
 const room=map?.startsWith('speaker-')?map.slice(8):'all';
 api.ui.actionBar.addButton({id:'varcamp-programme',label:'Programme',toolTip:'Talks, speakers and rooms · Myanmar time',location:'top',bgColor:'#1b3043',textColor:'#f5d28b',callback:()=>openProgramme(api,room)});
}
