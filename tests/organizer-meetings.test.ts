import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {describe,it,expect} from 'vitest';
import {SIGN_IDS} from '../src/world/catalog';
import {withOrganizerMeetings} from '../tools/maps/organizer-meetings';
import {validateWam} from '../tools/maps/validate';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));

describe('organizer offices share one native meeting across the entire room',()=>{
 for(const sign of SIGN_IDS)it(sign,()=>{
  const id='speaker-'+sign,w=read(`maps/${id}.wam`),l=read(`world/layouts/${id}.json`);
  const office=w.areas.find((a:any)=>a.id===sign+'-office-organizers');
  expect(office.properties).toEqual([{id:sign+'-organizer-meeting',type:'livekitRoomProperty',roomName:`varcamp-${sign}-organizer-team`,livekitRoomConfig:{startWithAudioMuted:false,startWithVideoMuted:false,disableChat:false,raiseHandEnabled:true}}]);
  const baseline=l.areas.find((a:any)=>a.id===office.id);
  for(const key of ['x','y','width','height'])expect(office[key]).toBe(baseline[key]*32);
  const old=structuredClone(w);old.areas.find((a:any)=>a.id===office.id).properties=[];
  expect(withOrganizerMeetings(id,old)).toEqual(w);expect(withOrganizerMeetings(id,w)).toEqual(w);
  expect(validateWam(w)).toEqual([]);
  const other=(areas:any[])=>areas.filter(a=>a.id!==office.id);
  expect(other(w.areas)).toEqual(other(old.areas));
  expect(w.areas.find((a:any)=>a.id===sign+'-office-silent').properties).toEqual([{id:sign+'-office-quiet',type:'silent'}]);
  expect(w.areas.find((a:any)=>a.id==='meeting-'+sign).properties[0].type).toBe('speakerMegaphone');
  expect(w.areas.find((a:any)=>a.id===sign+'-audience').properties[0].type).toBe('listenerMegaphone');
 });
 it('preserves independent live editor data and refuses unsafe drift',()=>{
  expect(execFileSync('python3',['ops/tests/organizer-meetings-fixture.py'],{encoding:'utf8'})).toContain('12 organizer meetings preserve editor data');
 });
 it('resets only the reviewed manual Sagittarius edit when explicitly requested',()=>{
  expect(execFileSync('python3',['ops/tests/sagittarius-organizer-reset-fixture.py'],{encoding:'utf8'})).toContain('Sagittarius reset removes only the reviewed manual controls');
 });
});
