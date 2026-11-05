import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {buildMap} from './builder';
import {loadTileCatalog,type TileCatalog} from '../art/catalog';
import type {MapLayout,TiledMap,WamFile,TileRect} from './types';
import type {MapId} from '../../src/world/catalog';
import sprites from '../../art/exploration-sprites.json';
export const EXPLORATION_IDS=['campus-exploration','star-garden','moon-grotto','moon-cafe','stargazer-terrace'] as const;
export type ExplorationId=typeof EXPLORATION_IDS[number];
export const isExplorationId=(id:string):id is ExplorationId=>(EXPLORATION_IDS as readonly string[]).includes(id);
const intersects=(a:TileRect,b:TileRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const inside=(x:number,y:number,r:TileRect)=>x>=r.x&&y>=r.y&&x<r.x+r.width&&y<r.y+r.height;
const noise=(x:number,y:number,s=0)=>{let n=Math.imul(x+113,374761393)^Math.imul(y+97,668265263)^s;n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0;};
/** Five independently authored landscapes. Public names remain stable; geometry
 * is deliberately replaced by this named successor rather than old epoch pins. */
export function explorationLayout(id:ExplorationId,catalog=loadTileCatalog()):MapLayout{
 const l:MapLayout={id,width:64,height:56,placements:[],entries:[],exits:[],areas:[],inspectionZones:[],signs:[],images:[],animatedOverlays:[]};
 const protectedRects:TileRect[]=[],pathCells=new Set<number>();let seq=0;
 const prop=(sprite:string,x:number,y:number,name?:string,w?:number,h?:number,layer='props')=>{const s=catalog[sprite];if(!s)throw Error('Missing exploration sprite '+sprite);const p={id:name??`exploration-${seq++}`,sprite,x,y,width:w??s.rect.width,height:h??s.rect.height,layer};l.placements.push(p);return p;};
 const reserve=(x:number,y:number,width:number,height:number)=>{protectedRects.push({x,y,width,height});};
 const label=(name:string,text:string,x:number,y:number,width=7)=>l.signs!.push({name,text,x,y,width,height:1,fontSize:12,color:id==='moon-grotto'?'#ddedef':'#fff0c8',align:'center'});
 const area=(name:string,x:number,y:number,width=2,height=2)=>{const names:Record<string,string>={'exp-story':'Woodland Spirit','exp-journal':'Field Guide','exp-fishing':'Moon Pond','exp-garden-game':'Seed Memory','exp-grotto-game':'Moon Echoes','exp-cafe-game':'Moonleaf Kitchen','exp-terrace-game':'Star Weaver'};const display=names[name]??(name.startsWith('exp-discovery-')?name.slice(14).toUpperCase()+' Memory':name);l.areas.push({id:name,name:display,x,y,width,height,properties:[]});reserve(x-1,y-1,width+2,height+2);};
 const path=(points:number[][],width=3)=>{for(let p=1;p<points.length;p++){const [ax,ay]=points[p-1],[bx,by]=points[p];const steps=Math.max(Math.abs(bx-ax),Math.abs(by-ay))*2;for(let i=0;i<=steps;i++){const x=Math.round(ax+(bx-ax)*i/Math.max(1,steps)),y=Math.round(ay+(by-ay)*i/Math.max(1,steps));for(let dy=-Math.floor(Math.min(width,3)/2);dy<Math.ceil(Math.min(width,3)/2);dy++)for(let dx=-Math.floor(Math.min(width,3)/2);dx<Math.ceil(Math.min(width,3)/2);dx++)if(x+dx>=0&&y+dy>=0&&x+dx<64&&y+dy<56)pathCells.add((y+dy)*64+x+dx);}}};
 const patch=(name:string,x:number,y:number,w:number,h:number)=>{for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)prop(`exp-${name}-${dx===0?0:dx===w-1?2:1}-${dy===0?0:dy===h-1?2:1}`,x+dx,y+dy);reserve(x-1,y-1,w+2,h+2);};
 const deck=(x:number,y:number,w:number,h:number)=>{prop('floor-wood',x,y,undefined,w,h,'terrain');reserve(x-1,y-1,w+2,h+2);};
 const cottage=(x:number,y:number,name:string)=>{reserve(x-1,y-1,7,10);prop('exp-wall',x+1,y+3);prop('exp-roof',x,y);prop('door-wood-closed',x+2,y+4);prop('exp-stair',x+1,y+6);path([[x+2,y+7],[x+2,y+9]],3);label(name,name.toUpperCase(),x-1,y+7,7);};
 const arch=(x:number,y:number)=>{prop('exp-arch',x,y);prop('exp-arch-foot',x,y+2);prop('exp-arch-foot-right',x+4,y+2);};
 const seat=(x:number,y:number)=>{prop('bench-park',x,y);reserve(x-1,y-1,4,3);};
 const lamp=(x:number,y:number)=>{prop('exp-crystal-small',x,y);reserve(x,y,1,1);};
 const clue=(sign:string,x:number,y:number)=>{prop('exp-obelisk',x,y-2,`relic-${sign}`);prop('glyph-'+sign,x+1,y-1,`relic-glyph-${sign}`);area('exp-discovery-'+sign,x,y,3,2);};
 prop(id==='moon-grotto'?'exp-cave-floor':id==='stargazer-terrace'?'exp-dark-grass':'exp-grass',0,0,'exploration-ground',64,56,'terrain');
 if(id==='campus-exploration'){
  const originals=JSON.parse(readFileSync('world/exploration-predecessors.json','utf8')).maps[id];
  l.entries=originals.entries.map((e:any)=>({...e,x:31,y:49}));
  const routes:[string,MapId,string,number,number][]=[['fire','fire-district','fire-entry',9,7],['air','air-district','air-entry',23,7],['earth','earth-district','earth-entry',38,7],['water','water-district','water-entry',53,7],['star-garden','star-garden','arrival',7,25],['moon-cafe','moon-cafe','arrival',54,25],['moon-grotto','moon-grotto','arrival',7,42],['stargazer-terrace','stargazer-terrace','arrival',54,42]];
  for(const [name,dest,entry,x,y]of routes){l.exits.push({name,destination:dest,entry,x,y,width:2,height:1});const e=l.entries.find(e=>e.name==='from-'+name)!;Object.assign(e,{x,y:y+3});reserve(x-3,y-4,8,9);prop('exp-fence-post',x-1,y);prop('exp-fence-post',x+2,y);if(['fire','air','earth','water'].includes(name))prop('sigil-'+name,x,y-2);label(name+'-label',name.replaceAll('-',' ').toUpperCase(),x-3,y+2,8);path([[x+1,y],[x+1,y+4],[x<32?20:44,y+4],[32,y<15?13:y<35?32:46]],3);}
  l.exits.push({name:'plaza-return',destination:'overworld',entry:'from-campus',x:31,y:54,width:2,height:1});path([[32,55],[32,30],[32,14]],5);path([[8,29],[20,36],[44,36],[55,29]],4);path([[8,46],[22,45],[32,49],[43,45],[55,46]],4);
  patch('water',25,23,9,6);prop('exp-lilies',27,25);seat(25,31);seat(34,25);cottage(16,17,'Trailkeeper');cottage(41,17,'Seed library');
  prop('exp-market',38,32);prop('exp-market-front',38,35);area('exp-journal',36,36,3,2);area('welcome-directory',29,41,3,2);label('trailhead','THE LANTERN TRAIL',25,39,14);label('plaza-label','ZODIAC PLAZA',28,52,8);
  area('exp-story',20,36);prop('exp-ghost',20,35,'trailkeeper-spirit');seat(21,38);seat(41,39);
 }else{
  l.entries=[{name:'arrival',x:31,y:49,width:2,height:2,isDefault:true},{name:'from-trail-west',x:4,y:28,width:2,height:2},{name:'from-trail-east',x:58,y:28,width:2,height:2}];
  l.exits=[{name:'branch-return',destination:'campus-exploration',entry:'from-'+id,x:30,y:54,width:2,height:1},{name:'plaza-return',destination:'overworld',entry:'from-campus',x:43,y:54,width:2,height:1}];
  const ring=['star-garden','moon-grotto','stargazer-terrace','moon-cafe'] as const,n=ring.indexOf(id);
  l.exits.push({name:'trail-west',destination:ring[(n+3)%4],entry:'from-trail-east',x:1,y:28,width:1,height:2},{name:'trail-east',destination:ring[(n+1)%4],entry:'from-trail-west',x:62,y:28,width:1,height:2});
  path([[31,55],[31,48],[38,46],[44,48],[44,55]],4);path([[0,29],[13,29],[21,34],[32,35],[46,32],[63,29]],4);path([[31,50],[31,35]],4);
  label('branch-return-label','EXPLORATION',27,52,8);label('plaza-return-label','ZODIAC PLAZA',40,52,8);label('west-trail-label',ring[(n+3)%4].replaceAll('-',' ').toUpperCase(),2,31,10);label('east-trail-label',ring[(n+1)%4].replaceAll('-',' ').toUpperCase(),52,31,10);
  if(id==='star-garden'){
   path([[13,29],[12,18],[20,10],[35,10],[46,18],[48,31]],4);path([[31,35],[30,22],[21,18],[12,18]],3);path([[46,18],[56,12]],3);path([[21,34],[12,42],[17,46],[31,48]],3);
   patch('water',34,19,11,9);prop('exp-lilies',36,22);deck(30,24,4,6);area('exp-fishing',31,28);lamp(30,24);seat(36,31);
   reserve(17,12,12,10);for(let y=14;y<22;y+=3)for(let x=18;x<28;x+=3){prop('exp-soil',x,y,undefined,2,2,'terrain');prop((x+y)%2?'exp-crop-tomato':'exp-crop-corn',x,y);}
   prop('exp-fence',18,12,undefined,9,1);prop('exp-sacks',28,18);area('exp-garden-game',25,24);label('garden-game-label','SEED MEMORY',23,27,8);
   clue('taurus',19,9);clue('virgo',55,13);clue('capricorn',14,44);prop('exp-ghost',54,10,'orchard-spirit');area('exp-story',53,14);
   seat(24,36);seat(43,37);cottage(4,36,'Potting shed');
  }else if(id==='moon-grotto'){
   path([[13,29],[13,18],[21,12],[34,12],[49,16],[51,29]],4);path([[31,35],[34,24],[34,12]],3);path([[46,32],[50,42],[42,46],[31,48]],4);path([[21,34],[16,43],[8,44]],3);
   patch('moon-water',19,18,10,10);patch('moon-water',38,22,9,7);patch('moon-water',33,38,9,6);prop('exp-crystal-tall',22,16);prop('exp-crystal-tall',45,20);prop('exp-crystal-tall',30,39);
   for(const [x,y]of [[4,8],[26,4],[44,5],[3,36],[54,38],[17,48]])patch('cave-rim',x,y,6,5);
   arch(32,17);prop('exp-stone-circle',32,21);area('exp-grotto-game',34,25);label('moon-order-label','MOON ECHOES',31,28,8);
   clue('cancer',20,12);clue('scorpio',50,43);clue('pisces',8,43);area('exp-story',49,17);prop('exp-ghost',49,16,'grotto-spirit');prop('exp-ghost',27,22,'pool-spirit');
   for(const [x,y]of [[11,20],[20,31],[32,33],[49,32],[33,13],[44,44],[30,48]])lamp(x,y);
   seat(19,37);seat(47,37);
  }else if(id==='moon-cafe'){
   path([[13,29],[14,16],[24,12],[43,12],[51,19],[50,31]],4);path([[31,35],[31,28],[25,25]],4);path([[21,34],[12,43],[29,44],[31,48]],3);path([[46,32],[51,42],[42,46],[31,48]],3);
   deck(20,8,25,19);prop('exp-fence',20,8,undefined,24,1);prop('exp-fence',20,26,undefined,9,1);prop('exp-fence',36,26,undefined,9,1);
   prop('exp-market',22,11);prop('exp-market-front',22,14);prop('exp-produce',29,12);prop('exp-counter',37,11);area('exp-cafe-game',31,16);label('cafe-game-label','MOONLEAF TEA',29,18,9);
   for(const[x,y]of [[22,20],[30,21],[38,20],[24,24],[38,24],[10,36],[45,39]]){prop('table-small-wood',x,y);prop('cafe-chair-cream',x-1,y+1);prop('cafe-chair-cream',x+1,y+1);reserve(x-2,y-2,5,5);}
   prop('bookcase',42,19);prop('exp-ghost',43,22,'cafe-spirit');area('exp-story',43,23);seat(22,39);seat(36,40);patch('water',6,15,5,8);
   clue('gemini',14,17);clue('libra',51,19);clue('aquarius',51,43);cottage(6,5,'Moon cafe');
   for(let x=15;x<28;x+=3){prop('exp-soil',x,42,undefined,2,2,'terrain');prop('exp-crop-herb',x,42);}reserve(14,41,15,4);lamp(20,17);lamp(43,17);
  }else{
   path([[13,29],[12,17],[21,11],[35,11],[49,17],[51,29]],4);path([[31,35],[31,23],[31,11]],4);path([[21,34],[12,43],[25,45],[31,48]],3);path([[46,32],[51,42],[42,46],[31,48]],3);
   deck(23,7,17,11);prop('telescope',29,9);area('observatory-telescope',29,13,3,2);label('four-sigil-clue','FOUR DISTRICTS / FOUR SIGILS',23,16,17);
   arch(29,20);prop('exp-stone-circle',29,24);area('exp-terrace-game',30,27);label('stars-game-label','STAR WEAVER',27,30,9);
   clue('aries',12,18);clue('leo',51,19);clue('sagittarius',51,43);prop('exp-ghost',14,41,'terrace-spirit');area('exp-story',14,43);
   prop('exp-campfire',35,39);seat(31,40);seat(38,40);seat(34,43);reserve(30,37,13,9);lamp(24,10);lamp(38,10);lamp(30,23);
   for(const[x,y]of [[8,8],[45,8],[8,37]]){prop('exp-statue',x,y);prop('exp-obelisk',x+3,y+1);reserve(x-1,y-1,6,5);}
  }
 }
 // Paint rounded path edge tiles onto grass without discarding the underlying
 // grass pixels. Path cells remain reserved against all procedural planting.
 const pathPlacements:MapLayout['placements']=[];
 for(const n of [...pathCells].sort((a,b)=>a-b)){
  const x=n%64,y=Math.floor(n/64);if(l.placements.some(p=>p.id!=='exploration-ground'&&p.layer==='terrain'&&inside(x,y,p)))continue;
  const left=pathCells.has(n-1)&&x>0,right=pathCells.has(n+1)&&x<63,top=pathCells.has(n-64),bottom=pathCells.has(n+64);
  pathPlacements.push({id:`trail-${n}`,sprite:id==='moon-grotto'?'exp-stone':`exp-path-${!left?0:!right?2:1}-${!top?0:!bottom?2:1}`,x,y,width:1,height:1,layer:'props'});
 }
 l.placements.splice(1,0,...pathPlacements);
 for(const r of [...l.entries,...l.exits])reserve(r.x-2,r.y-2,r.width+4,r.height+4);
 // Deterministic clustered vegetation. Test the complete sprite rectangle so
 // tree canopies cannot conceal a narrow route, sign or interaction.
 const occupied=l.placements.filter(p=>!p.id.startsWith('trail-')&&p.id!=='exploration-ground');
 const available=(r:TileRect)=>r.x>=1&&r.y>=1&&r.x+r.width<63&&r.y+r.height<55&&!protectedRects.some(p=>intersects(p,r))&&!occupied.some(p=>intersects(p,r))&&!Array.from({length:r.width*r.height},(_,i)=>(r.y+Math.floor(i/r.width))*64+r.x+i%r.width).some(n=>pathCells.has(n));
 const seed=EXPLORATION_IDS.indexOf(id)*197;
 const planted:TileRect[]=[];
 // Canopies may overlap each other, as a real woodland canopy does. Their entire
 // art remains clear of signed paths and authored activity spaces.
 for(let y=0;y<53;y+=2)for(let x=0;x<61;x+=2){
  const n=noise(x,y,seed),edge=x<6||x>56||y<6||y>49;
  if(!edge&&n%5===0)continue;
  const dark=id==='stargazer-terrace'||id==='star-garden'&&y<18;
  const choices=id==='moon-grotto'?['exp-rock','exp-dead-tree','exp-rock','exp-crystal-tall']:dark?['garden-pine','garden-cypress','garden-canopy']:['garden-oak','garden-linden','garden-orchard'];
  const sprite=choices[n%choices.length],s=catalog[sprite],r={x:x+n%2,y:y+(n>>>4)%2,width:s.rect.width,height:s.rect.height};
  if(available(r)&&!planted.some(p=>Math.abs(p.x-r.x)<2&&Math.abs(p.y-r.y)<2)){prop(sprite,r.x,r.y);planted.push(r);}
 }
 for(let y=1;y<55;y++)for(let x=1;x<63;x++){
  const n=noise(x,y,seed+9);if(n%4)continue;const r={x,y,width:1,height:1};if(!available(r))continue;
  prop(id==='moon-grotto'?'exp-rock':['garden-meadow-white','garden-meadow-gold','garden-meadow-violet','exp-grass-tuft','garden-fern','exp-grass-tuft','exp-grass-tuft'][n%7],x,y);
 }
 // Visible forest/rock perimeter with collision only on the map boundary.
 for(let y=0;y<56;y++)for(let x=0;x<64;x++)if((x===0||y===0||x===63||y===55)&&!pathCells.has(y*64+x))prop('exp-boundary',x,y,`boundary-${x}-${y}`);
 l.inspectionZones=[{name:'enchanted-exploration',kind:'landmark',x:1,y:1,width:62,height:54}];
 return l;
}
export function renderExplorationMap(layout:MapLayout,catalog:TileCatalog):TiledMap{
 const map=buildMap(layout,catalog).tmj;
 const ghost=map.tilesets.find(t=>t.image==='../assets/tilesets/lpc-exploration/ghost.png');
 if(ghost)ghost.tiles=[{id:0,animation:Array.from({length:6},(_,tileid)=>({tileid,duration:200})),properties:[{name:'collides',type:'bool',value:false}]}];
 map.backgroundcolor=layout.id==='moon-grotto'?'#17242b':'#234329';
 return JSON.parse(JSON.stringify(map));
}
export function explorationReachability(map:TiledMap,layout:MapLayout):Set<number>{
 const mask=map.layers.find(l=>l.name==='physical-collisions');if(mask?.type!=='tilelayer')throw Error('Exploration physics missing');
 const start=layout.entries.find(e=>e.isDefault)!;const seen=new Set<number>(),queue=[start.y*map.width+start.x];seen.add(queue[0]);
 if(mask.data[queue[0]])throw Error('Exploration default spawn is blocked');
 for(let i=0;i<queue.length;i++){const n=queue[i],x=n%map.width,y=Math.floor(n/map.width);for(const[a,b]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const k=b*map.width+a;if(a<0||b<0||a>=map.width||b>=map.height||seen.has(k)||mask.data[k])continue;seen.add(k);queue.push(k);}}
 return seen;
}
export function assertExplorationMap(map:TiledMap,layout:MapLayout,wam:WamFile,catalog:TileCatalog):void{
 const need=(v:unknown,m:string)=>{if(!v)throw Error('Enchanted exploration: '+m);};
 need(isExplorationId(layout.id),'closed map identity');if(!isExplorationId(layout.id))return;
 need(isDeepStrictEqual(layout,explorationLayout(layout.id,catalog)),'source composition '+layout.id);
 for(const[name,s]of Object.entries(sprites))need(isDeepStrictEqual(catalog[name],s),'sprite physics '+name);
 need(isDeepStrictEqual(map,renderExplorationMap(layout,catalog)),'native projection '+layout.id);
 const sources=JSON.parse(readFileSync('art/sources.json','utf8'));for(const source of ['lpc-exploration','exploration-ghost'])for(const f of sources[source].files)need(createHash('sha256').update(readFileSync(f.path)).digest('hex')===f.sha256,'art provenance '+f.path);
 const seen=explorationReachability(map,layout);
 for(const target of [...layout.entries,...layout.exits,...layout.areas])for(let y=target.y;y<target.y+target.height;y++)for(let x=target.x;x<target.x+target.width;x++)need(seen.has(y*map.width+x),`${layout.id}: blocked ${target.name} at ${x},${y}`);
 for(const e of layout.entries)need(!layout.exits.some(x=>intersects(e,x)),'spawn overlaps exit '+e.name);
 for(const a of layout.areas){const saved=wam.areas.find(s=>s.id===a.id);need(saved&&saved.name===a.name&&saved.x===a.x*32&&saved.y===a.y*32&&saved.width===a.width*32&&saved.height===a.height*32&&isDeepStrictEqual(saved.properties,a.properties),'saved area '+a.id);}
 need(!layout.signs?.some(s=>s.height>1||s.fontSize!>14),'oversized signage');
}
