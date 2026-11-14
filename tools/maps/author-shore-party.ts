/** Scoped shore art revision; saved native WAM areas are managed by live-preserving release. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {writeShoreParty} from '../art/shore-party';
import {shorePlaneMetadata} from '../art/shore-plane';
import type {Placement} from './types';

const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const write=(p:string,v:unknown)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const hash=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const art=await writeShoreParty(),recipe=read('world/natural-coast.json');
const row=recipe.maps['constellation-shore'];
const existing=row.props.filter((p:Placement)=>p.id!=='beach-kiosk'&&!p.id.startsWith('shore-dj-')&&!p.id.startsWith('shore-party-'));
const added:Placement[]=[
 {id:'shore-dj-stage',sprite:'shore-dj-stage',x:28,y:9,width:6,height:5,layer:'scenery'},
 {id:'shore-dj-floor',sprite:'shore-dj-floor',x:28,y:14,width:6,height:3,layer:'scenery'},
];
let ribbon=0;
const addRibbon=(x:number,y:number,width:2|4)=>added.push({id:`shore-party-bunting-${ribbon++}`,sprite:width===4?'shore-party-bunting':'shore-party-bunting-short',x,y,width,height:1,layer:'scenery'});
// Low festival decoration follows the backshore. Wide openings retain the
// harbor/plaza approaches, palms, and the stage; these are not access barriers.
for(const[left,right]of [[0,3],[7,13],[16,18],[22,28],[34,50],[53,82],[85,96]]){
 let x=left;while(x+2<=right){const width=x+4<=right?4:2;addRibbon(x,10,width);x+=width;}
}
const current=read('maps/constellation-shore.tmj');
const mask=current.layers.find((l:{name:string})=>l.name==='physical-collisions').data;
const ground=read('art/source/natural-constellation-shore.json').ground;
const finalGround=new Map<string,string>();
for(const p of ground)for(let y=p.y;y<p.y+p.height;y++)for(let x=p.x;x<p.x+p.width;x++)finalGround.set(`${x},${y}`,p.sprite);
const dry=(x:number,y:number)=>{const s=finalGround.get(`${x},${y}`)??'';return !!s&&!s.includes('-water-')&&!s.startsWith('naval-water-');};
// Southern flags follow actual dry sand, not an artificial straight line over
// the sea. Keep the jetty opening and occupied furniture cells clear.
for(let x=0;x<96;x+=4){
 if(x<12&&x+4>9)continue;
 const lastDry=Array.from({length:4},(_,i)=>{for(let y=28;y>=20;y--)if(dry(x+i,y))return y;return -1;});
 const y=Math.min(...lastDry);
 if(y<20||Array.from({length:4},(_,i)=>mask[y*96+x+i]!==0||!dry(x+i,y)).some(Boolean))continue;
 addRibbon(x,y,4);
}
const signs=[
 {name:'shore-party-west',text:'BEACH PARTY',x:6,y:16},
 {name:'shore-party-entry',text:'LISTEN HERE',x:23,y:16},
 {name:'shore-party-east',text:'BEACH PARTY',x:57,y:16},
 {name:'shore-party-far',text:'LISTEN ANYWHERE',x:85,y:16},
 {name:'shore-party-dj',text:'HAL · DJ',x:28,y:8},
];
for(const sign of signs)added.push({id:sign.name+'-panel',sprite:'shore-party-sign',x:sign.x,y:sign.y,width:5,height:1,layer:'scenery'});
row.props=[...existing,...added];
row.signs=[...row.signs.filter((s:{name:string})=>!s.name.startsWith('shore-party-')),...signs.map(s=>({...s,width:5,height:1,fontSize:12,color:'#fff0c9',align:'center'}))];
row.animatedOverlays=[...row.animatedOverlays.filter((o:{name:string})=>!['coastal-flight','shore-dj-lights','shore-dj-stage-lights'].includes(o.name)),...art.metadata.overlays,shorePlaneMetadata().overlay];
write('world/natural-coast.json',recipe);
const catalog=read('art/tile-catalog.json');Object.assign(catalog,art.catalog);write('art/tile-catalog.json',catalog);
// Both metadata receipts hash the shared recipe; terrain pixels are unchanged.
for(const id of ['shipyard-beach','constellation-shore']){
 const p=`art/source/natural-${id}.json`,meta=read(p);
 meta.inputs.find((v:{path:string})=>v.path==='world/natural-coast.json').sha256=hash('world/natural-coast.json');write(p,meta);
}
const sources=read('art/sources.json');
function register(id:string,paths:string[]){for(const path of paths){const f={path,sha256:hash(path)},list=sources[id].files,index=list.findIndex((v:{path:string})=>v.path===path);if(index<0)list.push(f);else list[index]=f;}}
register('original',['art/source/shore-dj-stage-master.png','art/source/shore-party-generation.json','art/source/shore-party.json','art/source/shore-dj-lights.json','art/source/shore-dj-stage-lights.json','assets/tilesets/original/shore-party.png','assets/tilesets/original/shore-dj-lights.png','assets/tilesets/original/shore-dj-stage-lights.png']);
register('natural-coast',['art/source/natural-shipyard-beach.json','art/source/natural-constellation-shore.json']);
register('harbour-sponsor',['art/source/shore-plane.json']);write('art/sources.json',sources);
// Import after recipe writes: this module intentionally reads the saved source.
const {naturalCoastLayout,renderNaturalCoastMap}=await import('./natural-coast');
const layout=naturalCoastLayout('constellation-shore'),map=renderNaturalCoastMap(layout,catalog);
write('world/layouts/constellation-shore.json',layout);
writeFileSync('maps/constellation-shore.tmj',JSON.stringify(map)+'\n');
console.log(JSON.stringify({stage:'original DJ equipment',buntingSegments:ribbon,signs:signs.length,lightLoops:2,planeY:23,savedWamsChanged:0}));
