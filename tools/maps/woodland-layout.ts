import {readFileSync} from 'node:fs';
import type {MapLayout,TileRect} from './types';
import type {TileCatalog} from '../art/catalog';
import type {MapId} from '../../src/world/catalog';
import type {ExplorationId} from './exploration';
import {markExplorationExits} from './exploration-wayfinding';

const W=64,H=56;
const hit=(a:TileRect,b:TileRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const noise=(x:number,y:number,s=0)=>{let n=Math.imul(x+113,374761393)^Math.imul(y+97,668265263)^s;n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0;};
type Point=[number,number];
type Grove=[number,number,number,number];

/** Hand-placed landmarks and landforms; seeded planting only fills the groves.
 * Public route identities and persistent discovery IDs survive this revision. */
export function woodlandLayout(id:ExplorationId,catalog:TileCatalog):MapLayout{
 const l:MapLayout={id,width:W,height:H,placements:[],entries:[],exits:[],areas:[],inspectionZones:[],signs:[],images:[],animatedOverlays:[]};
 const protectedRects:TileRect[]=[],paths=new Set<number>(),wet=new Set<number>(),ground:MapLayout['placements']=[],groves:Grove[]=[];
 let seq=0;
 const prop=(sprite:string,x:number,y:number,name?:string,width?:number,height?:number,layer='props')=>{
  const s=catalog[sprite];if(!s)throw Error('Missing woodland sprite '+sprite);
  const p={id:name??`woodland-${seq++}`,sprite,x,y,width:width??s.rect.width,height:height??s.rect.height,layer};l.placements.push(p);return p;
 };
 const reserve=(x:number,y:number,width:number,height:number)=>protectedRects.push({x,y,width,height});
 const label=(name:string,text:string,x:number,y:number,width=8)=>l.signs!.push({name,text,x,y,width,height:1,fontSize:13,color:id==='moon-grotto'||id==='stargazer-terrace'?'#d7e3cf':'#fff0c8',align:'center'});
 const area=(name:string,x:number,y:number,width=2,height=2)=>{
  const names:Record<string,string>={'exp-story':'Woodland Spirit','exp-journal':'Field Guide','exp-fishing':'Moon Pond','exp-garden-game':'Seed Memory','exp-grotto-game':'Moon Echoes','exp-cafe-game':'Moonleaf Kitchen','exp-terrace-game':'Star Weaver'};
  const display=names[name]??(name.startsWith('exp-letter-')?'Lost Letter · '+name.slice(11):name.startsWith('exp-discovery-')?name.slice(14).toUpperCase()+' Memory':name);
  l.areas.push({id:name,name:display,x,y,width,height,properties:[]});reserve(x-1,y-1,width+2,height+2);
 };
 const path=(points:Point[],width=3)=>{for(let p=1;p<points.length;p++){
  const [ax,ay]=points[p-1],[bx,by]=points[p],steps=Math.max(Math.abs(bx-ax),Math.abs(by-ay))*3;
  for(let i=0;i<=steps;i++){const x=Math.round(ax+(bx-ax)*i/Math.max(1,steps)),y=Math.round(ay+(by-ay)*i/Math.max(1,steps));
   for(let dy=-Math.floor(width/2);dy<Math.ceil(width/2);dy++)for(let dx=-Math.floor(width/2);dx<Math.ceil(width/2);dx++)if(x+dx>=0&&y+dy>=0&&x+dx<W&&y+dy<H)paths.add((y+dy)*W+x+dx);
  }
 }};
 const ellipse=(x:number,y:number,cx:number,cy:number,rx:number,ry:number)=>(x-cx)**2/rx**2+(y-cy)**2/ry**2<=1;
 const region=(prefix:string,blobs:Grove[],options:{water?:boolean;avoidPaths?:boolean}={})=>{
  const cells=new Set<number>();
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(blobs.some(([cx,cy,rx,ry])=>ellipse(x,y,cx,cy,rx,ry))&&(!options.avoidPaths||!paths.has(y*W+x)))cells.add(y*W+x);
  // Trim one-cell tips before selecting corner art: a rounded shore must not
  // acquire the isolated spikes produced by a raw ellipse raster.
  const tips=[...cells].filter(n=>(!cells.has(n-1)&&!cells.has(n+1))||(!cells.has(n-W)&&!cells.has(n+W)));
  tips.forEach(n=>cells.delete(n));
  for(const n of cells){const x=n%W,y=Math.floor(n/W),dx=!cells.has(n-1)?0:!cells.has(n+1)?2:1,dy=!cells.has(n-W)?0:!cells.has(n+W)?2:1;
   ground.push({id:`landform-${seq++}`,sprite:`exp-${prefix}-${dx}-${dy}`,x,y,width:1,height:1,layer:'props'});if(options.water)wet.add(n);
  }
 };
 const deck=(x:number,y:number,w:number,h:number)=>{prop('exp-bridge-deck',x,y,undefined,w,h);reserve(x-1,y-1,w+2,h+2);};
 const seat=(x:number,y:number)=>{prop('bench-park',x,y);reserve(x-1,y-1,4,3);};
 const cottage=(x:number,y:number,name:string,sections=2,dark=false)=>{
  reserve(x-1,y-1,sections*3+2,9);
  for(let a=0;a<sections;a++){prop(a%2?'exp-timber-wall':'exp-wall',x+a*3,y+2);prop(dark?'exp-roof-gable-dark':'exp-roof-gable',x+a*3,y);prop('exp-foundation',x+a*3,y+5);}
  prop('door-wood-closed',x+1,y+3);prop('exp-stair',x,y+6);path([[x+1,y+7],[x+1,y+9]],2);
  prop('garden-meadow-pink',x+sections*3-1,y+5);prop('exp-herb-basket',x+sections*3-2,y+6);label(name,name.toUpperCase(),x-1,y+7,sections*3+2);
 };
 const arch=(x:number,y:number)=>{prop('exp-arch',x,y);prop('exp-arch-foot',x,y+2);prop('exp-arch-foot-right',x+4,y+2);reserve(x-1,y-1,7,5);};
 const clue=(sign:string,x:number,y:number,object='exp-obelisk')=>{
  const s=catalog[object];prop(object,x,y-s.rect.height,`relic-${sign}`);prop('glyph-'+sign,x+s.rect.width,y-1,`relic-glyph-${sign}`);area('exp-discovery-'+sign,x,y,3,2);
 };
 const letter=(name:string,x:number,y:number)=>{prop('exp-letter',x,y-1,'letter-box-'+name);prop('exp-crystal-small',x-1,y-1);area('exp-letter-'+name,x,y);};
 const grove=(...a:Grove[])=>groves.push(...a);
 const base=id==='moon-grotto'?'exp-cave-floor':id==='stargazer-terrace'?'exp-dark-grass':'exp-meadow';
 prop(base,0,0,'exploration-ground',W,H,'terrain');
 if(id!=='moon-grotto')prop('exp-grass',0,0,'woodland-texture',W,H);

 if(id==='campus-exploration'){
  const originals=JSON.parse(readFileSync('world/exploration-predecessors.json','utf8')).maps[id];
  l.entries=originals.entries.map((e:any)=>({...e,x:31,y:49}));
  const routes:[string,MapId,string,number,number][]=[['fire','fire-district','fire-entry',9,7],['air','air-district','air-entry',23,7],['earth','earth-district','earth-entry',38,7],['water','water-district','water-entry',53,7],['star-garden','star-garden','arrival',7,25],['moon-cafe','moon-cafe','arrival',54,25],['moon-grotto','moon-grotto','arrival',7,42],['stargazer-terrace','stargazer-terrace','arrival',54,42]];
  for(const[name,dest,entry,x,y]of routes){l.exits.push({name,destination:dest,entry,x,y,width:2,height:1});Object.assign(l.entries.find(e=>e.name==='from-'+name)!,{x,y:y+3});reserve(x-2,y-2,6,7);if(['fire','air','earth','water'].includes(name)){arch(x-1,y-2);prop('sigil-'+name,x,y-3);}else{prop('exp-fence-post',x-1,y);prop('exp-fence-post',x+2,y);}label(name+'-label',name.replaceAll('-',' ').toUpperCase(),Math.max(1,x-3),y+2,8);path([[x+1,y],[x+1,y+4]],3);}
  l.exits.push({name:'plaza-return',destination:'overworld',entry:'from-campus',x:31,y:54,width:2,height:1});
  path([[32,55],[32,47],[29,41],[30,34],[33,27],[35,21]],4);
  path([[10,11],[12,15],[24,24],[33,27]],3);path([[24,11],[26,16],[24,24]],3);path([[39,11],[38,18],[35,21]],3);path([[54,11],[52,16],[45,22],[35,21]],3);
  path([[8,29],[16,28],[24,30],[30,34]],3);path([[55,29],[49,29],[40,32],[30,34]],3);
  path([[8,46],[14,45],[23,41],[29,41]],3);path([[55,46],[48,43],[40,39],[29,41]],3);
  region('pond',[[14,35,5,4],[18,36,4,3]],{water:true});
  cottage(15,16,'Trailkeeper',2);cottage(41,12,'Seed library',2,true);
  deck(35,32,7,5);prop('exp-market',38,29);prop('exp-market-front',38,32);prop('exp-produce',35,30);
  area('exp-journal',36,34,3,2);area('welcome-directory',29,43,3,2);label('trailhead','THE LANTERN TRAIL',25,46,14);label('plaza-label','ZODIAC PLAZA',28,52,8);
  prop('exp-ghost',24,35,'trailkeeper-spirit');area('exp-story',24,36);seat(23,38);seat(17,40);seat(42,38);
  prop('exp-lilies',13,34);prop('garden-reeds',10,34);prop('garden-reeds',21,36);letter('trailhead',48,48);path([[48,43],[49,47]],2);
  grove([5,15,5,6],[5,35,5,6],[18,5,7,4],[33,8,5,8],[48,5,6,4],[30,19,4,4],[59,19,4,7],[56,36,6,4],[17,52,10,4],[42,52,5,4],[3,52,6,4],[38,25,5,4],[43,46,4,3],[25,48,3,4]);
 }else{
  l.entries=[{name:'arrival',x:31,y:49,width:2,height:2,isDefault:true},{name:'from-trail-west',x:4,y:28,width:2,height:2},{name:'from-trail-east',x:58,y:28,width:2,height:2}];
  l.exits=[{name:'branch-return',destination:'campus-exploration',entry:'from-'+id,x:30,y:54,width:2,height:1},{name:'plaza-return',destination:'overworld',entry:'from-campus',x:43,y:54,width:2,height:1}];
  const ring=['star-garden','moon-grotto','stargazer-terrace','moon-cafe'] as const,n=ring.indexOf(id);
  l.exits.push({name:'trail-west',destination:ring[(n+3)%4],entry:'from-trail-east',x:1,y:28,width:1,height:2},{name:'trail-east',destination:ring[(n+1)%4],entry:'from-trail-west',x:62,y:28,width:1,height:2});
  path([[0,29],[5,29]],3);path([[58,29],[63,29]],3);path([[31,55],[31,49]],3);path([[44,55],[44,49]],3);
  label('branch-return-label','EXPLORATION',27,52);label('plaza-return-label','ZODIAC PLAZA',40,52);label('west-trail-label',ring[(n+3)%4].replaceAll('-',' ').toUpperCase(),2,31,10);label('east-trail-label',ring[(n+1)%4].replaceAll('-',' ').toUpperCase(),52,31,10);
  if(id==='star-garden'){
   path([[31,49],[28,43],[24,34],[21,27],[21,18],[19,9]],3);path([[5,29],[12,29],[21,27]],3);path([[58,29],[54,26],[54,16],[44,15],[30,18],[21,18]],3);
   path([[44,49],[43,44],[44,36],[53,35],[58,29]],3);path([[28,43],[36,39],[44,36]],3);path([[54,16],[56,13]],2);path([[24,34],[15,37],[14,44],[28,43]],2);path([[12,29],[10,20],[8,12]],2);
   region('pond',[[41,9,3,6],[40,20,4,7],[44,25,8,6],[42,32,3,5]],{water:true,avoidPaths:true});
   
   deck(44,30,3,4);deck(37,14,8,3);area('exp-fishing',45,31);label('fishing-label','MOON POND',44,34,8);prop('exp-boat',46,25);
   for(const [x,y]of [[12,16],[12,20],[26,14],[26,20]]){prop('exp-soil',x,y,undefined,4,3);for(let dx=0;dx<4;dx+=2)for(let dy=0;dy<3;dy+=2)prop(dx===0?'exp-crop-corn':'exp-crop-tomato',x+dx,y+dy);reserve(x-1,y-1,6,5);}
   prop('exp-fence',10,14,undefined,6,1);prop('exp-sacks',28,24);area('exp-garden-game',25,26);label('garden-game-label','SEED MEMORY',23,28);
   clue('taurus',19,9,'exp-grain-basket');clue('virgo',55,13,'exp-herb-basket');clue('capricorn',14,44,'exp-stump');
   prop('exp-ghost',53,10,'orchard-spirit');area('exp-story',53,14);cottage(4,36,'Potting shed',2);path([[5,45],[14,44]],2);seat(34,42);seat(47,37);
   letter('orchard',8,12);prop('exp-lilies',42,23);prop('garden-reeds',49,29);prop('garden-reeds',37,25);
   grove([7,5,7,5],[25,5,10,5],[33,26,5,8],[58,7,5,6],[58,40,5,7],[7,48,7,6],[20,51,6,4],[37,50,4,5],[18,34,4,4],[52,49,7,5]);
  }else if(id==='moon-grotto'){
   path([[31,49],[26,43],[25,34],[35,28],[43,22],[40,12],[25,10],[20,12]],3);path([[5,29],[14,28],[25,34]],3);path([[58,29],[50,27],[43,22]],3);
   path([[44,49],[49,46],[56,43],[56,35],[50,27]],3);path([[26,43],[18,46],[8,44]],3);path([[35,28],[35,25]],3);path([[25,34],[18,28],[13,21],[15,14],[20,12]],2);
   region('cave-rim',[[5,6,9,7],[32,3,12,4],[58,10,8,10],[3,19,5,5],[59,49,5,7],[19,53,8,3],[34,42,5,6],[20,23,4,5]],{water:true,avoidPaths:true});
   region('moon-water',[[28,19,8,5],[31,22,6,5],[49,38,4,5],[13,37,5,3]],{water:true,avoidPaths:true});
   region('paving',[[35,27,4,3],[42,12,4,3]]);arch(35,22);prop('exp-stone-circle',34,26);area('exp-grotto-game',34,29);label('moon-order-label','MOON ECHOES',31,32);
   for(const [x,y]of [[35,18],[42,15],[8,18],[46,33]]){prop('exp-ruin',x,y);reserve(x-1,y-1,6,5);}
   for(const [x,y]of [[22,16],[31,13],[36,21],[43,34],[50,32],[17,39],[8,40],[30,46]]){prop('exp-crystal-tall',x,y);prop('exp-crystal-small',x+1,y+1);reserve(x,y,2,2);}
   clue('cancer',20,12,'exp-tablet');clue('scorpio',50,45,'exp-broken-column');clue('pisces',8,44,'exp-obelisk');
   prop('exp-ghost',47,22,'grotto-spirit');area('exp-story',48,23);prop('exp-ghost',27,21,'pool-spirit');prop('exp-ghost',15,38,'echo-spirit');
   letter('grotto',43,10);seat(22,41);seat(43,46);grove([8,11,8,8],[31,6,10,5],[56,17,6,8],[6,50,5,5],[35,43,6,7],[20,22,5,7],[52,50,6,4]);
  }else if(id==='moon-cafe'){
   path([[31,49],[32,40],[29,33],[30,27],[25,19]],3);path([[5,29],[12,29],[18,26],[30,27],[39,25],[50,28],[58,29]],3);
   path([[44,49],[45,46],[39,40],[32,40]],3);path([[39,25],[42,18],[46,13],[50,10]],2);path([[50,28],[53,34],[51,43],[45,46]],2);path([[18,26],[14,20],[14,17]],2);path([[25,19],[39,18]],3);
   region('pond',[[8,16,4,6],[9,20,3,4],[51,38,3,2]],{water:true});
   cottage(17,8,'Moonleaf kitchen',3,true);path([[18,17],[25,19]],3);deck(19,20,12,7);deck(41,32,8,5);deck(51,36,2,5);
   prop('exp-market',30,12);prop('exp-market-front',30,15);prop('exp-kettle',29,16);prop('exp-herb-basket',33,15);area('exp-cafe-game',30,17);label('cafe-game-label','MOONLEAF TEA',27,19,10);
   for(const[x,y]of [[21,21],[27,21],[23,25],[43,33],[47,33],[17,37]]){prop('table-small-wood',x,y);prop('cafe-chair-cream',x-1,y+1);prop('cafe-chair-cream',x+1,y+1);reserve(x-2,y-1,5,4);}
   for(const[x,y]of [[19,19],[25,19],[41,31],[47,31],[16,35]])prop('garden-hedge',x,y);
   prop('bookcase',48,7);seat(46,10);letter('teahouse',50,10);prop('exp-ghost',45,37,'cafe-spirit');area('exp-story',45,38);
   clue('gemini',14,17,'exp-small-table');clue('libra',39,18,'exp-grain-basket');clue('aquarius',51,43,'exp-kettle');
   for(let x=16;x<29;x+=3){prop('exp-soil',x,42,undefined,2,3);prop('exp-crop-herb',x,42);prop('garden-meadow-white',x,43);}reserve(15,41,15,5);seat(37,44);prop('exp-lilies',7,17);
   grove([7,6,8,6],[33,5,14,3],[57,10,5,7],[37,33,3,5],[10,39,4,7],[7,49,7,5],[20,50,8,4],[53,49,7,4],[57,21,5,4],[42,9,4,5],[37,21,3,3],[47,24,4,3]);
  }else{
   path([[31,49],[27,43],[22,35],[24,26],[29,22],[35,18],[39,14]],3);path([[5,29],[13,30],[22,35]],3);path([[58,29],[51,27],[46,22],[35,18]],3);
   path([[44,49],[40,46],[35,43],[27,43]],3);path([[51,27],[53,35],[51,43],[40,46]],2);path([[13,30],[14,22],[12,18]],2);path([[46,22],[52,22],[51,19]],2);path([[13,30],[9,39],[10,44],[22,46],[27,43]],2);path([[24,26],[30,30]],2);
   region('paving',[[39,12,9,6],[30,28,5,4]]);
   // Low walls and stair breaks give the observatory a silhouette and clear entrance.
   for(let x=33;x<=45;x++){prop('exp-ruin-coping',x,7);prop('exp-ruin-brick',x,8);}for(const[x,y]of [[31,10],[47,10],[31,14],[47,14]])prop('exp-moss-column',x,y);
   prop('exp-stair',35,18,undefined,6,1);prop('telescope',40,9);area('observatory-telescope',39,13,3,2);label('four-sigil-clue','FOUR DISTRICTS / FOUR SIGILS',33,16,14);
   arch(28,23);prop('exp-stone-circle',28,27);area('exp-terrace-game',30,30);label('stars-game-label','STAR WEAVER',27,33);
   clue('aries',12,18,'exp-campfire');clue('leo',51,19,'exp-statue');clue('sagittarius',51,43,'exp-tablet');
   prop('exp-campfire',35,40);seat(31,40);seat(39,41);seat(34,44);reserve(30,38,12,8);prop('exp-ghost',10,42,'terrace-spirit');area('exp-story',10,44);letter('summit',7,44);
   prop('exp-fallen-log',15,40);prop('exp-moss-column',7,40);prop('exp-broken-column',5,43);
   grove([8,7,9,8],[23,9,6,10],[53,6,8,6],[57,16,4,6],[37,25,4,6],[43,34,6,3],[5,35,4,5],[18,36,4,6],[19,51,8,4],[56,49,6,5],[60,39,3,9]);
  }
 }

 // Terrain remains beneath every prop. Never paint water over the approach to
 // an activity or a native wooden bridge/pier.
 const decking=l.placements.filter(p=>p.sprite==='exp-bridge-deck'||p.sprite==='exp-soil');
 const groundVisible=ground.filter(p=>!decking.some(d=>hit(d,p))).sort((a,b)=>Number(/exp-(pond|moon-water|cave-rim)-/.test(a.sprite))-Number(/exp-(pond|moon-water|cave-rim)-/.test(b.sprite)));
 const groundOffset=id==='moon-grotto'?1:2;
 l.placements.splice(groundOffset,0,...groundVisible);
 const pathArt:MapLayout['placements']=[];
 for(const n of [...paths].sort((a,b)=>a-b)){
  const x=n%W,y=Math.floor(n/W);if(decking.some(d=>hit(d,{x,y,width:1,height:1}))||groundVisible.some(p=>p.x===x&&p.y===y&&p.sprite.startsWith('exp-paving-')))continue;
  const dx=!paths.has(n-1)?0:!paths.has(n+1)?2:1,dy=!paths.has(n-W)?0:!paths.has(n+W)?2:1;
  pathArt.push({id:`trail-${n}`,sprite:id==='moon-grotto'?'exp-cave-floor':`exp-path-${dx}-${dy}`,x,y,width:1,height:1,layer:'props'});
 }
 l.placements.splice(groundOffset+groundVisible.length,0,...pathArt);
 for(const r of [...l.entries,...l.exits])reserve(r.x-2,r.y-2,r.width+4,r.height+4);
 for(const sign of l.signs??[])reserve(sign.x,sign.y,sign.width,sign.height);
 const occupied=l.placements.filter(p=>p.id!=='exploration-ground'&&p.id!=='woodland-texture'&&!p.id.startsWith('trail-')&&!p.id.startsWith('landform-'));
 const available=(r:TileRect)=>r.x>=1&&r.y>=1&&r.x+r.width<W-1&&r.y+r.height<H-1&&!protectedRects.some(p=>hit(p,r))&&!occupied.some(p=>hit(p,r))&&!Array.from({length:r.width*r.height},(_,i)=>(r.y+Math.floor(i/r.width))*W+r.x+i%r.width).some(n=>paths.has(n)||wet.has(n));
 const planted:TileRect[]=[];
 const seed=['campus-exploration','star-garden','moon-grotto','moon-cafe','stargazer-terrace'].indexOf(id)*977;
 for(let y=1;y<52;y++)for(let x=1;x<60;x++){
  const n=noise(x,y,seed),edge=x<4||x>57||y<4||y>50,insideGrove=groves.some(([cx,cy,rx,ry])=>ellipse(x,y,cx,cy,rx,ry));
  if(!edge&&!insideGrove||n%3)continue;
  const dark=id==='stargazer-terrace'||id==='star-garden'&&y<14;
  const choices=id==='moon-grotto'?['exp-rock','exp-dead-tree','exp-rock']:dark?['garden-pine','garden-cypress','garden-canopy']:['garden-oak','garden-linden','garden-orchard'];
  const sprite=choices[(n>>>8)%choices.length],s=catalog[sprite],r={x,y,width:s.rect.width,height:s.rect.height};
  if(!available(r)||planted.some(p=>Math.abs(p.x-r.x)<2&&Math.abs(p.y-r.y)<2))continue;
  prop(sprite,x,y);planted.push(r);
 }
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
  const n=noise(x,y,seed+7),r={x,y,width:1,height:1};if(n%7||!available(r))continue;
  const inGrove=groves.some(([cx,cy,rx,ry])=>ellipse(x,y,cx,cy,rx,ry));
  if(id==='moon-grotto'){if(n%3===0)prop('exp-rock',x,y);continue;}
  const choices=inGrove?['garden-fern','exp-grass-tuft','exp-berry','exp-mushrooms']:['garden-meadow-white','garden-meadow-pink','garden-meadow-blue','exp-grass-tuft','exp-grass-tuft'];
  const sprite=choices[n%choices.length],s=catalog[sprite];if(available({...r,width:s.rect.width,height:s.rect.height}))prop(sprite,x,y);
 }
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if((x===0||y===0||x===W-1||y===H-1)&&!paths.has(y*W+x))prop('exp-boundary',x,y,`boundary-${x}-${y}`);
 l.inspectionZones=[{name:'enchanted-exploration',kind:'landmark',x:1,y:1,width:62,height:54}];
 markExplorationExits(l);
 return l;
}
