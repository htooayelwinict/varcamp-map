import { initializeWorld } from './runtime';
import { registerGuideMenu } from './guides/menu';
import { registerCheckInCounter } from './check-in/counter';
void initializeWorld(WA).then(() => registerGuideMenu(WA)).catch(() => { console.warn('VarCamp scripting unavailable. Physical venue exits remain available.'); });
void WA.onInit().then(() => {
 const dispose=registerCheckInCounter(WA);
 window.addEventListener('pagehide',dispose,{once:true});
}).catch(() => { console.warn('VarCamp check-in counter unavailable.'); });
