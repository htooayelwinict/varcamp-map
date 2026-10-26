import{readFileSync,statSync}from'node:fs';
import{createHash}from'node:crypto';
import{isDeepStrictEqual}from'node:util';
import{decodeAirborneRgbaPng}from'../art/native-png';
import type{LayoutAnimatedOverlay,MapLayout,TiledMap,TileRect}from'./types';
/** Finite original32px bird roles. Each lane spans the full map width so a
 * bird enters at one edge and leaves at the other; rectangles may cross
 * nonwalkable scenery, never attendee/control/label pixels. Clocks are pinned. */
export const AIRBORNE_BIRDS=[
 {map:'shipyard-beach',name:'coast-life-harbor-gull-north',x:0,y:38,width:48,height:3,stepMs:100,periodMs:27000},
 {map:'shipyard-beach',name:'coast-life-harbor-gull-south',x:0,y:41,width:48,height:3,stepMs:100,periodMs:27000},
 {map:'constellation-shore',name:'coast-life-shore-gull-north',x:0,y:37,width:40,height:3,stepMs:100,periodMs:22600},
 {map:'constellation-shore',name:'coast-life-shore-gull-south',x:0,y:37,width:40,height:3,stepMs:100,periodMs:22600},
 {map:'fa-ship',name:'world-ambient-fa-ship-gull-1',x:0,y:17,width:48,height:1,stepMs:200,periodMs:32000},
]as const;
/** The closed overworld drone class (2026-10-26 owner decision, "set all
 * drones at upper layer top of other objects and tiles"): the forty ring drone
 * resources and the three fleet drones fly above every tile, object and
 * attendee exactly like the sponsor seaplane. Exactly these43 rows. */
export const PLAZA_DRONES=[
 ...Array.from({length:40},(_,i)=>({map:'overworld',name:'plaza-drone-'+String(i).padStart(2,'0')})),
 {map:'overworld',name:'plaza-fleet-camera'},{map:'overworld',name:'plaza-fleet-delivery'},{map:'overworld',name:'plaza-fleet-survey'},
]as readonly{map:'overworld';name:string}[];
/** The sponsor aircraft role (2026-10-24 owner decision) and the overworld
 * drones above: each draws above every tile, object and attendee as a purely
 * visual crossing, so it is deliberately exempt from the bird lane rules
 * (offshore blocked lane, 32px sprite, attendee-envelope alpha). Only these
 * closed44 rows may claim that exemption; every other aboveScenery overlay is a bird. */
export const AIRCRAFT=[{map:'shipyard-beach',name:'coastal-flight'},...PLAZA_DRONES]as readonly{map:string;name:string}[];
export const isCurrentAircraft=(map:string,name:string)=>AIRCRAFT.some(r=>r.map===map&&r.name===name);
const need=(ok:unknown,m:string):void=>{if(!ok)throw Error('Airborne safety '+m);};
const overlap=(a:TileRect,b:TileRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
export const isCurrentAirborne=(map:string,name:string)=>AIRBORNE_BIRDS.some(r=>r.map===map&&r.name===name);
export function assertAirborneSource(layout:MapLayout):void{
 const rows=AIRBORNE_BIRDS.filter(r=>r.map===layout.id),overlays=layout.animatedOverlays??[];
 need(overlays.filter(o=>o.level==='aboveScenery'&&!isCurrentAircraft(layout.id,o.name)).length===rows.length,'closed five-role source class changed');
 const terrain=Array(layout.width*layout.height).fill('')as string[];
 for(const p of layout.placements.filter(p=>p.layer==='terrain'))for(let y=p.y;y<p.y+p.height;y++)for(let x=p.x;x<p.x+p.width;x++)terrain[y*layout.width+x]=p.sprite;
 for(const r of rows){const matches=overlays.filter(o=>o.name===r.name);need(matches.length===1,'required bird missing: '+r.name);const o=matches[0];
  need(o.level==='aboveScenery'&&['x','y','width','height'].every(k=>(o as any)[k]===(r as any)[k]),'registered airborne lane/depth changed: '+r.name);
  need(o.image===`assets/tilesets/original/${r.name}.png`&&o.provenance?.metadataPath===`art/source/${r.name}.json`,'original bird asset identity changed');
  need(![...layout.entries,...layout.exits,...layout.areas,...layout.signs??[],...layout.images??[]].some(p=>overlap(o,p)),'lane intersects a functional/label footprint: '+r.name);
  for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++)need(x>=0&&y>=0&&x<layout.width&&y<layout.height&&/^(naval-water-|constellation-coast-water-)/.test(terrain[y*layout.width+x]),'registered lane must remain offshore: '+r.name);
 }
}
/** Actual native RGBA, not metadata sample receipts. The callback is per phase
 * including a wrap. At most one bounded clip/frame is retained in memory. */
export function visitAirborneNativePhases(map:TiledMap,o:LayoutAnimatedOverlay,visit:(rgba:Buffer,timeMs:number)=>void):void{
 const r=AIRBORNE_BIRDS.find(r=>r.map===map.properties?.find(p=>p.name==='worldMapId')?.value&&r.name===o.name);need(r,'unregistered actual airborne role');if(!r)return;
 const sets=map.tilesets.filter(s=>s.name===o.name&&s.image==='../'+o.image);need(sets.length===1,'native bird atlas role changed');const set=sets[0];
 const stat=statSync(o.image);need(stat.isFile()&&stat.size>0&&stat.size<=196608,'bounded native bird PNG required');const bytes=readFileSync(o.image);need(bytes.length===stat.size&&createHash('sha256').update(bytes).digest('hex')===o.provenance?.atlasSha256,'native bird PNG changed');
 const image=decodeAirborneRgbaPng(bytes,set.imagewidth!,set.imageheight!);need(image.width===512&&set.columns===16&&set.tilecount===image.width*image.height/1024&&set.tilewidth===32&&set.tileheight===32,'native bird atlas geometry changed');
 const ls=map.layers.filter(l=>l.name===o.name);need(ls.length===1&&ls[0].type==='tilelayer','native airborne layer missing');const layer=ls[0];if(layer.type!=='tilelayer')return;
 need(layer.visible===true&&layer.opacity===1&&layer.x===0&&layer.y===0&&!layer.offsetx&&!layer.offsety&&layer.width===map.width&&layer.height===map.height,'native airborne envelope changed');
 const expected=new Map<number,number>();for(let y=0;y<o.height;y++)for(let x=0;x<o.width;x++)expected.set((o.y+y)*map.width+o.x+x,o.carrierTileIds[y*o.width+x]);
 const carriers:{cx:number;cy:number;frames:{tileid:number;duration:number}[]}[]=[];
 for(const[i,gid]of layer.data.entries()){
  if(!expected.has(i)){need(gid===0,'native bird pixels outside declared lane');continue;}
  need((gid&0xf0000000)===0&&gid===set.firstgid+expected.get(i)!,'native bird carrier/flip changed');
  const defs=set.tiles?.filter(t=>t.id===gid-set.firstgid);need(defs?.length===1&&defs[0].animation?.length,'native bird clock missing');const frames=defs![0].animation!;
  need(isDeepStrictEqual(frames,o.animations.find(a=>a.id===gid-set.firstgid)?.frames)&&frames.every(f=>Number.isSafeInteger(f.tileid)&&f.tileid>=0&&f.tileid<set.tilecount!&&Number.isSafeInteger(f.duration)&&f.duration>=r.stepMs&&f.duration%r.stepMs===0)&&frames.reduce((n,f)=>n+f.duration,0)===r.periodMs,'native bird clock/frame binding changed');
  carriers.push({cx:i%map.width-o.x,cy:Math.floor(i/map.width)-o.y,frames});
 }
 need(carriers.length===o.width*o.height,'native bird carriers incomplete');const w=o.width*32,h=o.height*32;
 for(let t=0;t<=r.periodMs;t+=r.stepMs){const rgba=Buffer.alloc(w*h*4);
  for(const c of carriers){let time=t%r.periodMs,local=-1;for(const f of c.frames){if(time<f.duration){local=f.tileid;break;}time-=f.duration;}need(local>=0,'native clock has no actual frame');const sx=local%16*32,sy=Math.floor(local/16)*32;
   for(let y=0;y<32;y++)image.rgba.copy(rgba,((c.cy*32+y)*w+c.cx*32)*4,((sy+y)*image.width+sx)*4,((sy+y)*image.width+sx+32)*4);
  }visit(rgba,t);
 }
}
/** One closed airborne class. Native map order has to put birds and the
 * registered aircraft (also on a map without birds, such as the overworld
 * drones) after all scenery, while actual bird alpha must remain outside any
 * possible attendee body. */
export function assertNativeAirborne(map:TiledMap,layout:MapLayout):void{
 assertAirborneSource(layout);
 const names=(layout.animatedOverlays??[]).filter(o=>o.level==='aboveScenery').map(o=>o.name);if(!names.length)return;
 need(isDeepStrictEqual(map.layers.slice(-names.length).map(l=>l.name),names),'airborne birds are not at the end of the complete native stack');
 const rows=AIRBORNE_BIRDS.filter(r=>r.map===layout.id);if(!rows.length)return;
 const masks=map.layers.filter(l=>l.name==='physical-collisions');need(masks.length===1&&masks[0].type==='tilelayer','actual physical mask missing');const mask=masks[0];if(mask.type!=='tilelayer')return;
 const w=map.width*32,h=map.height*32,unsafe=Buffer.alloc(w*h);
 // A32px attendee may occupy any point in a walkable32px cell. This conservative
 // union extends16px sideways/down and32px above that whole physical cell.
 for(const[i,gid]of mask.data.entries())if(!gid){const cx=i%map.width*32,cy=Math.floor(i/map.width)*32;for(let y=Math.max(0,cy-32);y<Math.min(h,cy+48);y++)unsafe.fill(1,y*w+Math.max(0,cx-16),y*w+Math.min(w,cx+48));}
 for(const r of rows){const o=layout.animatedOverlays!.find(o=>o.name===r.name)!;for(let y=o.y;y<o.y+o.height;y++)for(let x=o.x;x<o.x+o.width;x++)need(!!mask.data[y*map.width+x],'airborne lane contains walkable ground');
  visitAirborneNativePhases(map,o,(rgba)=>{const cw=o.width*32;let left=Infinity,right=-1,top=Infinity,bottom=-1,count=0;
   for(let i=3;i<rgba.length;i+=4)if(rgba[i]){const pixel=(i-3)/4,x=pixel%cw,y=Math.floor(pixel/cw);need(!unsafe[(o.y*32+y)*w+o.x*32+x],'actual bird alpha can hide an attendee');left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
   need(count<=1024&&(count===0||right-left<32&&bottom-top<32),'actual bird phase is larger than the approved32px sprite');
  });
 }
}
