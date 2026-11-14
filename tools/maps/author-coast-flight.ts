/** Rebuild only the two authorized full-width sponsor flight scenes. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {writeHarbourPlane} from '../art/harbour-plane';
import {writeShorePlane,shorePlaneMetadata} from '../art/shore-plane';
import {loadTileCatalog} from '../art/catalog';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const write=(p:string,v:unknown)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const hash=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
await writeHarbourPlane();writeShorePlane();
const recipe=read('world/natural-coast.json');
const harbour=['','-east'].map(s=>read(`art/source/harbour-plane${s}.json`).overlay);
for(const id of ['shipyard-beach','constellation-shore']){
 const row=recipe.maps[id];
 row.animatedOverlays=[...row.animatedOverlays.filter((o:{name:string})=>!o.name.startsWith('coastal-flight')),...(id==='shipyard-beach'?harbour:shorePlaneMetadata().overlays)];
}
write('world/natural-coast.json',recipe);
for(const id of ['shipyard-beach','constellation-shore']){
 const p=`art/source/natural-${id}.json`,meta=read(p);
 meta.inputs.find((v:{path:string})=>v.path==='world/natural-coast.json').sha256=hash('world/natural-coast.json');write(p,meta);
}
const sources=read('art/sources.json');
function register(id:string,paths:string[]){for(const path of paths){const row={path,sha256:hash(path)},list=sources[id].files,i=list.findIndex((v:{path:string})=>v.path===path);if(i<0)list.push(row);else list[i]=row;}}
register('harbour-sponsor',['assets/tilesets/original/harbour-plane.png','assets/tilesets/original/harbour-plane-east.png','art/source/harbour-plane.json','art/source/harbour-plane-east.json','art/source/shore-plane.json','art/source/shore-plane-east.json']);
register('natural-coast',['art/source/natural-shipyard-beach.json','art/source/natural-constellation-shore.json']);write('art/sources.json',sources);
const {naturalCoastLayout,renderNaturalCoastMap}=await import('./natural-coast');
for(const id of ['shipyard-beach','constellation-shore'] as const){
 const layout=naturalCoastLayout(id),map=renderNaturalCoastMap(layout,loadTileCatalog());
 write(`world/layouts/${id}.json`,layout);writeFileSync(`maps/${id}.tmj`,JSON.stringify(map)+'\n');
}
console.log('Both96-tile coast maps now publish the two synchronized flight halves. Source WAMs unchanged.');
