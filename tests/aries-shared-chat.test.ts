import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {describe,it,expect} from 'vitest';
import {renderReferenceInterior} from '../tools/maps/reference-interiors';
import {loadTileCatalog} from '../tools/art/catalog';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
function assertSharedChat(w:any){
 const stage=w.areas.find((a:any)=>a.id==='meeting-aries');
 const audience=w.areas.find((a:any)=>a.id==='aries-audience');
 expect(stage.properties.find((p:any)=>p.type==='speakerMegaphone')).toMatchObject({name:'varcamp-aries-talk',chatEnabled:true,seeAttendees:false});
 expect(audience.properties.find((p:any)=>p.type==='listenerMegaphone')).toMatchObject({speakerZoneName:stage.id,chatEnabled:true,allowTalking:false,raiseHandEnabled:true});
 expect([...stage.properties,...audience.properties].filter((p:any)=>p.type==='matrixRoomPropertyData')).toEqual([]);
}
describe('Aries presentation shares its native session chat',()=>{
 it('ships the linked stage/audience chat without audience microphone access',()=>assertSharedChat(read('maps/speaker-aries.wam')));
 it('keeps the chat enabled on a fresh author export',()=>{
  const {wam}=renderReferenceInterior(read('world/layouts/speaker-aries.json'),loadTileCatalog());assertSharedChat(wam);
 });
 it('permits only the approved Aries chat migration through the real release guard',()=>{
  expect(execFileSync('python3',['ops/tests/aries-shared-chat-fixture.py'],{encoding:'utf8'})).toContain('Aries shared chat migration verified');
 });
});
