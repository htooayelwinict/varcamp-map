import {readFileSync,writeFileSync} from 'node:fs';
import {buildMap} from './builder';
import {loadTileCatalog} from '../art/catalog';
import {EXPLORATION_IDS,explorationLayout,renderExplorationMap,assertExplorationMap} from './exploration';
const catalog=loadTileCatalog(),pending=new Map<string,string>(),actions:unknown[]=[];
for(const id of EXPLORATION_IDS){
 const l=explorationLayout(id,catalog),m=renderExplorationMap(l,catalog),wam=JSON.parse(readFileSync(`maps/${id}.wam`,'utf8'));
 const old=JSON.parse(readFileSync('world/exploration-predecessors.json','utf8')).maps[id].areas;
 const ids=new Set([...old.map((a:{id:string})=>a.id),...l.areas.map(a=>a.id)]);
 wam.areas=[...wam.areas.filter((a:{id:string})=>!ids.has(a.id)),...buildMap(l,catalog).wam.areas];
 assertExplorationMap(m,l,wam,catalog);
 pending.set(`world/layouts/${id}.json`,JSON.stringify(l,null,2)+'\n');pending.set(`maps/${id}.tmj`,JSON.stringify(m)+'\n');pending.set(`maps/${id}.wam`,JSON.stringify(wam,null,2)+'\n');
 actions.push(...l.areas.filter(a=>a.id?.startsWith('exp-')).map(a=>({map:id,id:a.id,name:a.name,site:a.id!.slice(4).replace(/-game$/,''),x:a.x,y:a.y,width:a.width,height:a.height})));
 console.log(id,l.placements.length,'placements',l.areas.length,'areas');
}
pending.set('world/exploration-actions.json',JSON.stringify(actions,null,2)+'\n');
for(const[p,v]of pending)writeFileSync(p,v);
