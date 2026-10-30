import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {loadTileCatalog,type TileCatalog} from '../art/catalog';
import {buildMap} from './builder';
import {reconcileNativeProjection} from './native-projection';
import {assertCurrentNativeMap} from './current-native';
import type {MapLayout,TileRect,TiledMap} from './types';
import design from '../../world/maze-interiors.json';

const prefix='maze-interior-';
type Placement=MapLayout['placements'][number];
const overlaps=(a:TileRect,b:TileRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const mask=(map:TiledMap)=>{
 const layer=map.layers.find(l=>l.name==='physical-collisions');
 if(layer?.type!=='tilelayer')throw Error('Maze collision layer is absent');
 return layer.data.map(g=>Boolean(g));
};

/** Reversible decoration of the existing maze walls and floor. Each solid
 * furnishing must fit an already-solid wall cell. No routes or controls move. */
export function decorateMazeInterior(input:MapLayout,catalog:TileCatalog):MapLayout{
 if(design.version!==1||!['orbit-maze','comet-maze'].includes(input.id))throw Error('Unsupported maze interior');
 const layout=structuredClone(input),orbit=layout.id==='orbit-maze';
 const plan=design.maps[layout.id as keyof typeof design.maps];
 layout.placements=layout.placements.filter(p=>!p.id.startsWith(prefix));
 const original=buildMap(layout,catalog).tmj,solid=mask(original),w=layout.width,h=layout.height;
 const floor=Array<string>(w*h).fill('');
 for(const p of layout.placements.filter(p=>p.layer==='terrain'))for(let y=p.y;y<p.y+p.height;y++)for(let x=p.x;x<p.x+p.width;x++)floor[y*w+x]=p.sprite;
 const controls:TileRect[]=[...layout.entries,...layout.exits,...(layout.signs??[]),...(layout.images??[]),...layout.areas.filter(a=>/^(maze-finish|comet-checkpoint-[123]|comet-finish)$/.test(a.name))];
 const fixtures=layout.placements.filter(p=>p.layer!=='terrain'&&p.sprite!=='maze-wall-rim');
 const additions:Placement[]=[],occupied:TileRect[]=[];
 const inBounds=(x:number,y:number)=>x>=0&&y>=0&&x<w&&y<h;
 const wall=(x:number,y:number)=>inBounds(x,y)&&floor[y*w+x]==='maze-solid';
 const safe=(box:TileRect)=>!controls.some(c=>overlaps(c,box))&&!fixtures.some(p=>overlaps(p,box));
 const inside=(box:TileRect,pad=0)=>({x:box.x-pad,y:box.y-pad,width:box.width+pad*2,height:box.height+pad*2});
 const add=(id:string,sprite:string,box:TileRect,layer:Placement['layer']='architecture')=>{
  const s=catalog[sprite];if(!s)throw Error('Unknown maze furnishing '+sprite);
  if(box.x<0||box.y<0||box.x+box.width>w||box.y+box.height>h||box.width%s.rect.width||box.height%s.rect.height)throw Error('Invalid maze furnishing bounds '+id);
  const p:Placement={id:prefix+id,sprite,...box,layer};
  for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(s.blockingCells.some(([sx,sy])=>sx===x%s.rect.width&&sy===y%s.rect.height)&&!solid[(p.y+y)*w+p.x+x])throw Error('Maze furnishing would block a route: '+id);
  additions.push(p);return p;
 };

 // Garden beds and gallery wall panels are inset by a full masonry tile.
 // Their original wall terrain remains the owner of the exact collision mask.
 const roof=new Set<number>(),bounds=plan.wallBounds;
 for(let y=bounds.y+1;y<bounds.y+bounds.height-1;y++)for(let x=bounds.x+1;x<bounds.x+bounds.width-1;x++){
  if([[x,y],[x-1,y],[x+1,y],[x,y-1],[x,y+1]].every(([a,b])=>wall(a,b))&&safe({x,y,width:1,height:1}))roof.add(y*w+x);
 }
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(roof.has(y*w+x)){
  const from=x;while(x+1<w&&roof.has(y*w+x+1))x++;
  add(`wall-bed-${from}-${y}`,plan.wallInfill,{x:from,y,width:x-from+1,height:1});
 }

 // Orbit's broad stone corridors gain a darker edge without narrowing their
 // walkable width. Comet retains its entire three-tile blue corridor width.
 if(orbit)for(let y=bounds.y;y<bounds.y+bounds.height;y++)for(let x=bounds.x;x<bounds.x+bounds.width;x++){
  if(floor[y*w+x]!==plan.path||solid[y*w+x])continue;
  if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([a,b])=>wall(a,b)))add(`path-edge-${x}-${y}`,'floor-charcoal',{x,y,width:1,height:1},'terrain');
 }
 const fitsRoof=(box:TileRect)=>safe(box)&&!occupied.some(o=>overlaps(inside(o,2),box))&&Array.from({length:box.width*box.height},(_,i)=>(box.y+Math.floor(i/box.width))*w+box.x+i%box.width).every(i=>roof.has(i));
 if(orbit){
  const garden=design.maps['orbit-maze'];let count=0;
  const sites:{x:number;y:number;rank:number}[]=[];
  for(let y=bounds.y+2;y<bounds.y+bounds.height-2;y++)for(let x=bounds.x+2;x<bounds.x+bounds.width-2;x++)sites.push({x,y,rank:((x*73856093)^(y*19349663))>>>0});
  for(const {x,y}of sites.sort((a,b)=>a.rank-b.rank)){
   if(count>=garden.gardenLimit)continue;
   for(let attempt=0;attempt<garden.gardenSprites.length;attempt++){
    const sprite=garden.gardenSprites[(count+attempt)%garden.gardenSprites.length],r=catalog[sprite].rect,box={x,y,width:r.width,height:r.height};
    if(!fitsRoof(box))continue;
    add(`garden-${count}`,sprite,box,'props');occupied.push(box);count++;break;
   }
  }
 }else{
  const gallery=design.maps['comet-maze'];let count=0;
  for(let y=bounds.y+2;y<bounds.y+bounds.height-3;y++)for(let x=bounds.x+2;x<bounds.x+bounds.width-4;x++){
   const box={x,y,width:4,height:3};if(count>=gallery.galleryLimit||!fitsRoof(box))continue;
   add(`gallery-frame-${count}`,'floor-charcoal',box);
   add(`gallery-stars-${count}`,'constellation-'+gallery.constellations[count%gallery.constellations.length],{x,y,width:3,height:2},'props');
   add(`gallery-light-${count}`,'light-cyan',{x:x+3,y,width:1,height:2},'props');
   occupied.push(box);count++;
  }
 }

 // Small wall-mounted lights face the passages, with existing signs and
 // animated lamp anchors reserved. No pedestal is introduced on the route.
 let lights=0;
 for(let y=bounds.y+2;y<bounds.y+bounds.height-2;y++)for(let x=bounds.x+2;x<bounds.x+bounds.width-2;x++){
  const box={x,y,width:1,height:2};
  if((x+3*y)%9!==0)continue;
  if(!wall(x,y)||!wall(x,y+1)||wall(x,y+2)||!inBounds(x,y+2)||solid[(y+2)*w+x]||!safe(box)||occupied.some(o=>overlaps(inside(o,2),box)))continue;
  add(`wall-sconce-${lights}`,orbit?'light-amber':'light-cyan',box,'props');occupied.push(box);lights++;
 }

 // Floor-only court details and lounge rugs sit below the existing furniture.
 // Blocking water, pedestals and all saved area shapes retain their owners.
 const courts=layout.placements.filter(p=>p.layer==='terrain'&&p.sprite==='floor-cosmic'&&(/chamber$/.test(p.id)||p.id.startsWith('court-')||p.id==='finish-court'));
 for(const court of courts)for(let y=court.y;y<court.y+court.height;y++)for(let x=court.x;x<court.x+court.width;x++){
  if(solid[y*w+x]||floor[y*w+x]!=='floor-cosmic')continue;
  const edge=x===court.x||y===court.y||x===court.x+court.width-1||y===court.y+court.height-1;
  if(edge)add(`court-edge-${court.id}-${x}-${y}`,orbit?'floor-wood-long':'floor-charcoal',{x,y,width:1,height:1},'terrain');
  else if((x===court.x+1||x===court.x+court.width-2)&&(y===court.y+1||y===court.y+court.height-2))add(`court-inlay-${court.id}-${x}-${y}`,'floor-inlay',{x,y,width:1,height:1},'terrain');
 }
 for(const [i,rug]of plan.loungeRugs.entries())add(`lounge-rug-${i}`,rug.sprite,{x:rug.x,y:rug.y,width:rug.width,height:rug.height},'terrain');
 layout.placements.push(...additions);
 if(!isDeepStrictEqual(mask(buildMap(layout,catalog).tmj),solid))throw Error('Maze interior changed the physical puzzle');
 return layout;
}

// Preflight both scenes before writing. Native projection preserves every
// existing atlas reservation and protected control layer; WAMs are read only.
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const catalog=loadTileCatalog(),outputs=new Map<string,string>();
 for(const id of ['orbit-maze','comet-maze']){
  const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
  const layout=decorateMazeInterior(read(`world/layouts/${id}.json`),catalog);
  const map=reconcileNativeProjection(read(`maps/${id}.tmj`),buildMap(layout,catalog).tmj);
  assertCurrentNativeMap(id,map,layout,read(`maps/${id}.wam`),catalog);
  outputs.set(`world/layouts/${id}.json`,JSON.stringify(layout,null,2)+'\n');
  outputs.set(`maps/${id}.tmj`,JSON.stringify(map)+'\n');
 }
 for(const [path,bytes]of outputs)writeFileSync(path,bytes);
 console.log('Decorated both maze interiors; all collisions, controls, WAMs and native atlas reservations preserved.');
}
