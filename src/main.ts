import {registerExpedition} from './adventure/interactions';
import { initializeWorld } from './runtime';
import { registerCheckInCounter } from './check-in/counter';
import { registerArcadeCabinets } from './arcade/cabinets';
import { registerOrbitCourse } from './playground/course';
import { registerNewnessCareers } from './expo/newness-careers';
import { registerProgrammeBoards } from './programme/boards';
void initializeWorld(WA).catch(() => { console.warn('VarCamp scripting unavailable. Physical venue exits remain available.'); });
void WA.onInit().then(()=>{const dispose=registerProgrammeBoards(WA);window.addEventListener('pagehide',dispose,{once:true});}).catch(()=>console.warn('VarCamp programme boards unavailable; use the Programme toolbar.'));
void WA.onInit().then(() => {
 const dispose=registerCheckInCounter(WA);
 window.addEventListener('pagehide',dispose,{once:true});
}).catch(() => { console.warn('VarCamp check-in counter unavailable.'); });
void WA.onInit().then(() => {
 const dispose=registerArcadeCabinets(WA);
 window.addEventListener('pagehide',dispose,{once:true});
}).catch(() => { console.warn('VarCamp arcade cabinets unavailable.'); });
void WA.onInit().then(() => {
 const dispose=registerOrbitCourse(WA);
 window.addEventListener('pagehide',dispose,{once:true});
}).catch(() => { console.warn('VarCamp playground course unavailable.'); });

void WA.onInit().then(()=>{const dispose=registerExpedition(WA);window.addEventListener("pagehide",dispose,{once:true});}).catch(()=>console.warn("VarCamp expedition unavailable; physical trails remain open."));
void WA.onInit().then(()=>{
 const dispose=registerNewnessCareers(WA);
 window.addEventListener('pagehide',dispose,{once:true});
}).catch(()=>console.warn('VarCamp Newness careers link unavailable.'));
