import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {describe,it,expect} from 'vitest';
import {renderReferenceInterior} from '../tools/maps/reference-interiors';
import {loadTileCatalog} from '../tools/art/catalog';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
function shared(wam:any,hall:string){
 const stage=wam.areas.find((a:any)=>a.id===hall+'-stage');
 const audience=wam.areas.find((a:any)=>a.id===hall+'-audience');
 expect(stage.properties.find((p:any)=>p.type==='speakerMegaphone')).toEqual({id:hall+'-broadcast',type:'speakerMegaphone',name:'varcamp-'+hall+'-main',chatEnabled:true,seeAttendees:false});
 expect(audience.properties.find((p:any)=>p.type==='listenerMegaphone')).toEqual({id:hall+'-listen',type:'listenerMegaphone',speakerZoneName:stage.id,chatEnabled:true,allowTalking:false,raiseHandEnabled:true});
 expect(stage.properties.find((p:any)=>p.type==='restrictedRightsPropertyData')).toMatchObject({readTags:['organizer','speaker'],writeTags:[]});
 const prep=wam.areas.find((a:any)=>a.id===hall+'-prep');
 expect(prep.properties.find((p:any)=>p.type==='livekitRoomProperty').livekitRoomConfig).toEqual({startWithAudioMuted:true,startWithVideoMuted:true,disableChat:true});
}
describe('separate native shared presentation chats for both ceremony halls',()=>{
 for(const hall of ['solar','lunar']){
  it(hall+' shipped stage and audience share native chat',()=>shared(read('maps/'+hall+'-hall.wam'),hall));
  it(hall+' fresh author export retains chat and identical native map',()=>{
   const result=renderReferenceInterior(read('world/layouts/'+hall+'-hall.json'),loadTileCatalog());
   shared(result.wam,hall);expect(result.tmj).toEqual(read('maps/'+hall+'-hall.tmj'));
  });
 }
 it('keeps Solar and Lunar in distinct native channels',()=>{
  const channels=['solar','lunar'].map(hall=>read('maps/'+hall+'-hall.wam').areas.find((a:any)=>a.id===hall+'-stage').properties.find((p:any)=>p.type==='speakerMegaphone').name);
  expect(channels).toEqual(['varcamp-solar-main','varcamp-lunar-main']);
 });
 it('allows only the two hall chat flags through the real deployment guard',()=>{
  expect(execFileSync('python3',['ops/tests/hall-shared-chat-fixture.py'],{encoding:'utf8',timeout:10000})).toContain('Two hall shared chats preserve saved data');
 });
});
