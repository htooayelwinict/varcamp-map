/** Offline admission of the unchanged finite guide graph against real source/native geometry.
 * This never moves a player, supplies a runtime authority, or invents additional route cells.
 */
import {createHash} from 'node:crypto';
import type {TileCatalog} from '../art/catalog';
import type {MapLayout,TiledMap,TileRect,WamFile} from '../maps/types';
import {isCurrentAircraft} from '../maps/airborne';
interface Routes {allowedCells:number[][];startupReservedCells:number[][];home:number[];patrol:number[][];destinations:{id:string;tile:number[];gate:string;onward:string}[]}
interface Input {map:TiledMap;layout:MapLayout;catalog:TileCatalog;wam:WamFile;routes:Routes}
const need=(ok:unknown,message:string):void=>{if(!ok)throw Error('Guide route audit: '+message);};
const W=128,N=W*W,GRAPH_SHA='04695f018d0f5f46b0ff52c41afe0c50facdbf5c2db3acf2df06fbaf9e33a0b9';
const STARTUP=[[63,65],[64,65],[63,66],[64,66]];
const index=(x:number,y:number)=>y*W+x;
const cell=(p:number[])=>{need(Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&p.every(n=>n>=0&&n<W),'invalid graph coordinate');return index(p[0],p[1]);};
const rect=(r:TileRect,label:string)=>need([r.x,r.y,r.width,r.height].every(Number.isInteger)&&r.x>=0&&r.y>=0&&r.width>0&&r.height>0&&r.x+r.width<=W&&r.y+r.height<=W,'invalid '+label+' rectangle');
const each=(r:TileRect,visit:(i:number,x:number,y:number)=>void)=>{for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++)visit(index(r.x+x,r.y+y),x,y);};
const matches=(a:Set<number>,b:Set<number>)=>a.size===b.size&&[...a].every(i=>b.has(i));
const overlaps=(a:Set<number>,b:Set<number>)=>[...a].some(i=>b.has(i));
const neighbors=(i:number)=>[...(i%W?[i-1]:[]),...(i%W<W-1?[i+1]:[]),...(i>=W?[i-W]:[]),...(i<N-W?[i+W]:[])];

export function auditGuideRoutes({map,layout,catalog,wam,routes}:Input){
 need(layout.id==='overworld'&&layout.width===W&&layout.height===W&&map.type==='map'&&map.orientation==='orthogonal'&&map.width===W&&map.height===W&&map.tilewidth===32&&map.tileheight===32&&map.infinite===false,'current map/layout identity changed');
 const identity=map.properties?.filter(p=>p.name==='worldMapId')??[];
 need(identity.length===1&&identity[0].type==='string'&&identity[0].value==='overworld','native world identity changed');
 need(routes.allowedCells.length===792&&createHash('sha256').update(JSON.stringify(routes.allowedCells)).digest('hex')===GRAPH_SHA,'normal graph roster changed');
 need(JSON.stringify(routes.startupReservedCells)===JSON.stringify(STARTUP),'startup escape roster changed');
 const allowed=new Set(routes.allowedCells.map(cell)),reserved=new Set(routes.startupReservedCells.map(cell)),checked=new Set([...allowed,...reserved]);
 need(allowed.size===792&&!overlaps(allowed,reserved),'normal graph duplicate/reserved cell');
 const homes=[cell(routes.home),...routes.patrol.map(cell),...routes.destinations.map(d=>cell(d.tile))];
 need(homes.every(i=>allowed.has(i)),'home/patrol/destination outside normal graph');
 const connected=new Set([homes[0]]),queue=[homes[0]];
 for(let h=0;h<queue.length;h++)for(const i of neighbors(queue[h]))if(allowed.has(i)&&!connected.has(i)){connected.add(i);queue.push(i);}
 need(connected.size===allowed.size,'normal graph disconnected');
 for(const x of [63,64])need(allowed.has(index(x,64)),'startup escape cannot join the normal graph');
 const spawn=layout.entries.filter(e=>e.isDefault);need(spawn.length===1&&spawn[0].x===63&&spawn[0].y===65&&spawn[0].width===2&&spawn[0].height===2,'native startup source changed');
 const floors=map.layers.flatMap((l,i)=>l.name==='floorLayer'?[i]:[]);need(floors.length===1&&map.layers[floors[0]].type==='objectgroup','missing/ambiguous avatar boundary');
 const floor=floors[0],nativeBlocked=new Set<number>(),nativePortals=new Set<number>(),nativeRaised=new Set<number>();
 const collides=new Set<number>();
 for(const s of map.tilesets){
  need(Number.isInteger(s.firstgid)&&s.firstgid>0&&Number.isInteger(s.tilecount)&&s.tilecount!>0&&s.tilewidth===32&&s.tileheight===32&&!s.source,'unsupported native GID atlas');
  for(const t of s.tiles??[]){const p=t.properties?.filter(p=>p.name==='collides')??[];need(p.length<=1&&(!p.length||p[0].type==='bool'&&typeof p[0].value==='boolean'),'ambiguous native collision property');if(p[0]?.value===true)collides.add(s.firstgid+t.id);}
 }
 const tile=(gid:number)=>{need(Number.isInteger(gid)&&gid>=0&&gid<=0xffffffff,'invalid native GID');const plain=(gid&0x0fffffff)>>>0;need(plain>0&&map.tilesets.filter(t=>plain>=t.firstgid&&plain<t.firstgid+t.tilecount!).length===1,'unbound/ambiguous native GID');return plain;};
 for(const [z,l] of map.layers.entries()){
  need(!(l.x||l.y||l.offsetx||l.offsety),'unsupported native layer offset');
  const exit=l.properties?.some(p=>p.name==='exitUrl')??false;
  if(l.type==='tilelayer'){
   need(l.width===W&&l.height===W&&Array.isArray(l.data)&&l.data.length===N,'unsupported native tile data');
   // The closed overworld drone class (airborne.ts PLAZA_DRONES) flies above every attendee by owner
   // decision: a transient 24px crossing, never static raised scenery, so it may pass over the graph.
   const aircraft=z>floor&&isCurrentAircraft(layout.id,l.name);
   for(const [i,gid] of l.data.entries())if(gid){const g=tile(gid);if(collides.has(g))nativeBlocked.add(i);if(exit)nativePortals.add(i);if(z>floor&&!aircraft&&l.visible!==false&&(l.opacity??1)>0)nativeRaised.add(i);}
  }else if(l.type==='objectgroup'){
   for(const o of l.objects){
    need(!(o.rotation||o.gid||o.polygon||o.polyline||o.ellipse||o.point),'unsupported native object shape');
    if(!o.width||!o.height)continue;
    for(const i of checked){const x=(i%W)*32+16,y=Math.floor(i/W)*32+16;if(x>=o.x&&x<o.x+o.width&&y>=o.y&&y<o.y+o.height){
     need(!exit&&!(o.properties?.length),'native object interaction overlaps route');
     need(!(z>floor&&l.visible!==false&&o.visible!==false&&(l.opacity??1)>0),'native raised object overlaps route');
    }}
   }
  }else need(false,'unsupported native layer type');
 }
 need(!overlaps(checked,nativeBlocked),'native collision on guide graph');
 need(!overlaps(checked,nativePortals),'native portal on guide graph');
 need(!overlaps(checked,nativeRaised),'native raised artwork on guide graph');
 const ground=new Uint8Array(N),props=new Set<number>(),sourceRaised=new Set<number>(),terrain=new Map<number,string>();
 const walkableProps:{id:string;sprite:string;cells:number[][]}[]=[];
 for(const p of layout.placements){
  rect(p,'source placement');const s=catalog[p.sprite];need(Boolean(s),'unknown source sprite');
  need(Number.isInteger(s.rect.width)&&Number.isInteger(s.rect.height)&&s.rect.width>0&&s.rect.height>0&&p.width%s.rect.width===0&&p.height%s.rect.height===0,'invalid repeated sprite dimensions');
  need(s.level==='belowAvatar'||s.level==='aboveAvatar','invalid source avatar depth');
  const local=(points:number[][],name:string)=>new Set(points.map(q=>{need(Array.isArray(q)&&q.length===2&&q.every(Number.isInteger)&&q[0]>=0&&q[1]>=0&&q[0]<s.rect.width&&q[1]<s.rect.height,'invalid source '+name+' cell');return q[1]*s.rect.width+q[0];}));
  const blocked=local(s.blockingCells,'blocking'),upper=s.upperCells===undefined?undefined:local(s.upperCells,'upper');
  need(!p.renderRole||['grounded','canopy','cutaway'].includes(p.renderRole),'invalid source render role');
  need(!(upper!==undefined&&(p.renderRole||p.layer==='terrain')),'source upper partition override');
  const cells:number[][]=[];
  each(p,(i,x,y)=>{const dy=p.flipY?s.rect.height-1-y%s.rect.height:y%s.rect.height,uv=dy*s.rect.width+x%s.rect.width,b=blocked.has(uv);
   if(p.layer==='terrain'){ground[i]=b?1:0;terrain.set(i,p.sprite);}else{
    if(b)props.add(i);
    const raised=upper!==undefined?upper.has(uv):(p.renderRole?p.renderRole==='canopy':s.level==='aboveAvatar');
    if(raised)sourceRaised.add(i);
    if(allowed.has(i)&&!b&&!raised&&p.layer!=='atmosphere')cells.push([p.x+x,p.y+y]);
   }
  });
  if(cells.length)walkableProps.push({id:p.id,sprite:p.sprite,cells});
 }
 const sourceBlocked=new Set(props);ground.forEach((v,i)=>{if(v)sourceBlocked.add(i);});
 need(matches(sourceBlocked,nativeBlocked),'source/native collision masks disagree');
 need(!overlaps(checked,sourceRaised),'source raised artwork on guide graph');
 const publicSurfaces=new Set(['path-stone','floor-blue','floor-inlay','floor-charcoal','floor-wood']);
 for(const i of checked){need(publicSurfaces.has(terrain.get(i)??''),'unsupported public surface on guide graph');need(Math.hypot(i%W-63.5,Math.floor(i/W)-63.5)<=60,'guide graph radius exceeded');}
 const sourcePortals=new Set<number>();for(const e of layout.exits){rect(e,'source exit');each(e,i=>sourcePortals.add(i));}
 need(matches(sourcePortals,nativePortals),'source/native portal mask disagreement');
 for(const s of layout.standingSigns??[]){
  const faces=s.faceKind==='image'?(layout.images??[]).filter(p=>p.name===s.face):layout.placements.filter(p=>p.id===s.face);
  need(faces.length===1,'standing face missing/ambiguous');
  for(const p of [...faces,...s.supports.map(id=>{const p=layout.placements.find(p=>p.id===id);need(Boolean(p),'standing support missing');return p!;})]){rect(p,'standing');each(p,i=>need(!checked.has(i),'standing assembly overlaps guide graph'));}
 }
 let walkableImageOverlapCells=0;
 for(const image of layout.images??[]){
  rect(image,'source image');const layers=map.layers.filter(l=>l.name===image.name);need(layers.length===1&&layers[0].type==='tilelayer','source image layer missing/ambiguous');
  each(image,i=>{if(checked.has(i)){need(image.standing!==true,'standing image overlaps guide graph');if(allowed.has(i))walkableImageOverlapCells++;}});
  need((map.layers.indexOf(layers[0])>floor)===Boolean(image.standing),'source image/native depth disagreement');
 }
 const startupInsideWelcome=new Set<number>();
 const area=(name:string,x:number,y:number,width:number,height:number)=>{
  need([x,y,width,height].every(Number.isFinite)&&x>=0&&y>=0&&width>0&&height>0&&x+width<=W*32&&y+height<=W*32,'invalid interaction rectangle');
  for(const i of checked){const px=(i%W)*32+16,py=Math.floor(i/W)*32+16;if(px>=x&&px<x+width&&py>=y&&py<y+height){
   need(!allowed.has(i),'normal guide graph interaction overlap');
   need(name==='welcome-directory'&&x===62*32&&y===65*32&&width===4*32&&height===2*32&&reserved.has(i),'startup interaction exception changed');startupInsideWelcome.add(i);
  }}
 };
 for(const a of layout.areas){rect(a,'source interaction');area(a.name,a.x*32,a.y*32,a.width*32,a.height*32);}
 need(Object.keys(wam.entities).length===0,'unaudited WAM entity footprint');
 for(const a of wam.areas)area(a.name,a.x,a.y,a.width,a.height);
 need(matches(startupInsideWelcome,reserved),'inherited startup welcome interaction missing');
 const welcome=map.layers.filter(l=>l.name==='welcome');need(welcome.length===1&&welcome[0].type==='tilelayer','native welcome startup missing');
 const welcomeCells=new Set<number>();if(welcome[0].type==='tilelayer')welcome[0].data.forEach((g,i)=>{if(g)welcomeCells.add(i);});need(matches(welcomeCells,reserved),'native welcome startup roster changed');
 for(const d of routes.destinations)need(layout.exits.some(e=>e.name===d.gate&&e.destination===d.onward),'destination gate/onward changed');
 return {allowedCells:allowed.size,startupReservedCells:reserved.size,nativeCollisionCells:nativeBlocked.size,portalCells:nativePortals.size,walkablePropOverlapCells:new Set(walkableProps.flatMap(p=>p.cells.map(cell))).size,walkableImageOverlapCells,walkableProps,startupInsideWelcomeArea:routes.startupReservedCells.filter(p=>startupInsideWelcome.has(cell(p)))};
}
