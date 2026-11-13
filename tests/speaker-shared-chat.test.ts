import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {describe,it,expect} from 'vitest';
import {SIGN_IDS} from '../src/world/catalog';
import {renderReferenceInterior} from '../tools/maps/reference-interiors';
import {loadTileCatalog} from '../tools/art/catalog';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
function check(w:any,sign:string){
 const stage=w.areas.find((a:any)=>a.id==='meeting-'+sign);
 const audience=w.areas.find((a:any)=>a.id===sign+'-audience');
 expect(stage.properties.find((p:any)=>p.type==='speakerMegaphone')).toMatchObject({name:'varcamp-'+sign+'-talk',chatEnabled:true,seeAttendees:false});
 expect(audience.properties.find((p:any)=>p.type==='listenerMegaphone')).toMatchObject({speakerZoneName:stage.id,chatEnabled:true,allowTalking:false,raiseHandEnabled:true});
 expect([...stage.properties,...audience.properties].some((p:any)=>p.type==='matrixRoomPropertyData')).toBe(false);
}
describe('each zodiac presentation shares one native chat within its own room',()=>{
 for(const sign of SIGN_IDS){
  it(sign+' source enables linked stage and audience chat',()=>check(read(`maps/speaker-${sign}.wam`),sign));
  it(sign+' fresh author export retains shared chat',()=>check(renderReferenceInterior(read(`world/layouts/speaker-${sign}.json`),loadTileCatalog()).wam,sign));
 }
 it('keeps the twelve presentation channels distinct',()=>{
  const channels=SIGN_IDS.map(sign=>read(`maps/speaker-${sign}.wam`).areas.find((a:any)=>a.id==='meeting-'+sign).properties.find((p:any)=>p.type==='speakerMegaphone').name);
  expect(new Set(channels).size).toBe(12);
 });
 it('permits only the eleven approved two-flag migrations through the publisher',()=>{
  expect(execFileSync('python3',['ops/tests/speaker-shared-chat-fixture.py'],{encoding:'utf8',timeout:12000})).toContain('11 native shared chats preserve saved data');
 },15000);
});
