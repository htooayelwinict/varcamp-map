import{readFileSync,statSync}from'node:fs';
import{createHash}from'node:crypto';
import{isDeepStrictEqual}from'node:util';
import{WORLD_CATALOG,SIGN_IDS}from'../../src/world/catalog';
import{decodeArtRgbaPng}from'../art/native-png';
import{ambientDepthOwner,opaqueAmbientOwnerSupport}from'./world-ambient-depth';
import{assertAirborneSource,assertNativeAirborne,isCurrentAirborne,isCurrentAircraft}from'./airborne';
import type{TileCatalog}from'../art/catalog';
import type{MapLayout,TiledMap,LayoutAnimatedOverlay}from'./types';
// 'aircraft': the registered sponsor aircraft and the43 overworld drones, drawn above everything (see airborne.ts AIRCRAFT/PLAZA_DRONES).
type Role={name:string;role:'avatarForeground'|'opaqueOwnerUpper'|'airborne'|'aircraft';owner?:NonNullable<ReturnType<typeof ambientDepthOwner>>&{sheetSha256:string}};
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const need=(ok:unknown,message:string):void=>{if(!ok)throw Error('Animation safety '+message);};
const pngBytes=(path:string):Buffer=>{const s=statSync(path);need(s.isFile()&&s.size>0&&s.size<=65536,'bounded art PNG file size changed');const bytes=readFileSync(path);need(bytes.length===s.size,'art PNG changed during read');return bytes;};
const sorted=(a:readonly string[])=>a.slice().sort();
/** Independent current family authorities close the34-map/140-role registry.
 * A deleted/unknown contract row cannot turn enforcement off. */
export function currentDecorationRoles():Record<string,Role[]>{
 const contract=read('tools/maps/animated-decoration-contract.json'),ids=Object.keys(WORLD_CATALOG),interiors=[...SIGN_IDS.map(s=>'speaker-'+s),'solar-hall','lunar-hall'],interior=read('world/interior-reference-contract.json'),ambient=read('art/source/world-ambient.json');
 need(contract&&typeof contract==='object'&&!Array.isArray(contract)&&contract.version===1&&isDeepStrictEqual(Object.keys(contract).sort(),['maps','version'])&&contract.maps&&isDeepStrictEqual(sorted(Object.keys(contract.maps)),sorted(ids)),'closed current map contract changed');
 let count=0,upper=0,airborne=0,aircraft=0;
 for(const id of ids){
  const rows=contract.maps[id];need(Array.isArray(rows)&&rows.every((r:any)=>r&&typeof r.name==='string')&&new Set(rows.map((r:Role)=>r.name)).size===rows.length,'role rows missing/duplicate: '+id);let names:string[];
  if(id==='overworld')names=['roadster',...Array.from({length:40},(_,i)=>'plaza-drone-'+String(i).padStart(2,'0')),'plaza-fleet-camera','plaza-fleet-delivery','plaza-fleet-survey'];
  else if(id==='shipyard-beach')names=['coastal-flight','rolling-breaker-west','rolling-breaker-east',...['fish-west','fish-east','gull-north','gull-south','dolphin'].map(k=>'coast-life-harbor-'+k)];
  else if(id==='constellation-shore')names=['fish-west','fish-bay','gull-north','gull-south','dolphin','seal'].map(k=>'coast-life-shore-'+k);
  else if(interiors.includes(id))names=['plant','steam','server',...(interior.maps[id].water?['water']:[])].map(k=>'interior-ambient-'+k);
  else{
   const maps=ambient.maps.filter((m:any)=>m.id===id);need(maps.length===1,'ambient family missing: '+id);names=maps[0].effects.flatMap((e:any)=>read(`art/source/${e.name}.json`).componentNames);
   need(names.length===(id==='fa-ship-interior'||id==='nebula-arcade'?3:2),'independent ambient component count changed: '+id);
  }
  need(isDeepStrictEqual(rows.map((r:Role)=>r.name),sorted(names)),'required role roster/order changed: '+id);
  for(const r of rows){const isUpper=r.role==='opaqueOwnerUpper';need(r&&isDeepStrictEqual(Object.keys(r).sort(),isUpper?['name','owner','role']:['name','role'])&&typeof r.name==='string'&&['avatarForeground','opaqueOwnerUpper','airborne','aircraft'].includes(r.role),'role schema changed');if(isUpper){upper++;need(id==='fa-ship-interior'&&r.owner&&/^[a-f0-9]{64}$/.test(r.owner.sheetSha256),'owning upper family/registration changed');}need((r.role==='airborne')===isCurrentAirborne(id,r.name),'closed airborne role changed');if(r.role==='airborne')airborne++;need((r.role==='aircraft')===isCurrentAircraft(id,r.name),'closed aircraft role changed');if(r.role==='aircraft')aircraft++;count++;}
 }
 need(count===140&&upper===2&&airborne===5&&aircraft===44,'closed140-role/two-upper/44-aircraft ownership count changed');return contract.maps;
}
/** Shared current author/current acceptance source policy; historical generic
 * builders never call this and retain their independently tested behavior. */
export function assertAnimatedDecorationSource(layout:MapLayout):Role[]{
 const roles=currentDecorationRoles()[layout.id];need(roles,'unknown current map identity');const overlays=layout.animatedOverlays??[];
 need(isDeepStrictEqual(sorted(overlays.map(o=>o.name)),roles.map(r=>r.name)),'required source roles missing/unknown: '+layout.id);
 for(const r of roles){const o=overlays.find(o=>o.name===r.name)!;need(o.level===(r.role==='avatarForeground'?'belowAvatar':r.role==='airborne'||r.role==='aircraft'?'aboveScenery':'aboveAvatar'),'explicit role depth changed: '+r.name);}
 assertAirborneSource(layout);return roles;
}
/** Prove pixels the real native consumer can reference, rather than trusting
 * pose receipts or unused atlas pixels. The two valid upper projections add no
 * avatar occlusion beyond the same owning fixture's existing opaque upper art. */
export function assertOwnedUpperAnimation(map:TiledMap,layout:MapLayout,o:LayoutAnimatedOverlay,catalog:TileCatalog,registered:Role):void{
 need(o.provenance?.metadataPath===`art/source/${o.name}.json`,'upper descriptor identity changed');const meta=read(o.provenance!.metadataPath),recipe=read('art/source/world-ambient.json'),group=recipe.maps.filter((m:any)=>m.id===layout.id);need(group.length===1,'upper family missing');const effects=group[0].effects.filter((e:any)=>e.name===meta.effect?.name);need(effects.length===1&&isDeepStrictEqual(effects[0],meta.effect)&&meta.componentNames?.includes(o.name)&&meta.partition==='opaqueOwnerUpper','upper component role changed');
 const e=effects[0],owner=ambientDepthOwner(layout,e,catalog);need(owner,'upper pixels have no owning fixture');if(!owner)return;
 need(registered.role==='opaqueOwnerUpper'&&registered.owner,'physical owner registration missing');if(!registered.owner)return;const{sheetSha256,...registeredOwner}=registered.owner;need(isDeepStrictEqual(owner,registeredOwner),'registered owner identity/partition changed before image read');
 need(isDeepStrictEqual(meta.depthReceipt?.owner,owner)&&meta.depthReceipt?.policy==='opaque-owner-upper-v1','upper owner identity changed');
 const owners=map.tilesets.filter(s=>s.image==='../'+owner.visual.sheet);need(owners.length===1,'owning atlas reservation changed');const os=owners[0],ownerBytes=pngBytes(owner.visual.sheet);need(sha(ownerBytes)===meta.depthReceipt.sheetSha256&&sha(ownerBytes)===sheetSha256,'registered owning PNG bytes changed');
 const support=opaqueAmbientOwnerSupport(owner,o.width*32,o.height*32,decodeArtRgbaPng(ownerBytes,os.imagewidth!,os.imageheight!));need(support.includes(1)&&support.equals(Buffer.from(meta.depthReceipt.opaqueUpperSupport,'base64')),'actual opaque owner support changed');
 const sets=map.tilesets.filter(s=>s.name===o.name&&s.image==='../'+o.image);need(sets.length===1,'upper native atlas role changed');const set=sets[0],imageBytes=pngBytes(o.image);need(sha(imageBytes)===o.provenance!.atlasSha256,'upper native PNG bytes changed');const image=decodeArtRgbaPng(imageBytes,set.imagewidth!,set.imageheight!);need(set.columns===image.width/32&&set.tilecount===image.width*image.height/1024,'upper native atlas geometry changed');
 const layers=map.layers.filter(l=>l.name===o.name);need(layers.length===1&&layers[0].type==='tilelayer','upper native layer missing');const layer=layers[0];if(layer.type!=='tilelayer')return;
 need(layer.visible===true&&layer.opacity===1&&layer.x===0&&layer.y===0&&!layer.offsetx&&!layer.offsety&&layer.width===map.width&&layer.height===map.height,'upper native envelope changed');
 for(const[cell,gid]of layer.data.entries())if(gid){
  need((gid&0xf0000000)===0,'unsupported transformed upper native tile');const cx=cell%map.width-o.x,cy=Math.floor(cell/map.width)-o.y;need(cx>=0&&cy>=0&&cx<o.width&&cy<o.height,'upper native footprint changed');
  const definitions=set.tiles?.filter(t=>t.id===gid-set.firstgid);need(definitions?.length===1&&definitions[0].animation?.length,'upper native carrier binding changed');
  for(const frame of definitions![0].animation!){need(Number.isSafeInteger(frame.tileid)&&frame.tileid>=0&&frame.tileid<set.tilecount!,'upper native frame outside atlas');const sx=frame.tileid%set.columns!*32,sy=Math.floor(frame.tileid/set.columns!)*32;
   for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(image.rgba[((sy+y)*image.width+sx+x)*4+3])need(support[(cy*32+y)*o.width*32+cx*32+x]===1,'actual native upper pixel leaves owning alpha255 support: '+o.name);
  }
 }
}
/** Mandatory actual current-world boundary, after domain/atlas/semantic owners. */
export function assertNativeAnimationSafety(map:TiledMap,layout:MapLayout,catalog:TileCatalog):void{
 const roles=assertAnimatedDecorationSource(layout),floor=map.layers.findIndex(l=>l.name==='floorLayer');need(floor>=0,'avatar floor is missing');
 for(const r of roles){const o=layout.animatedOverlays!.find(o=>o.name===r.name)!,layers=map.layers.filter(l=>l.name===r.name);need(layers.length===1&&layers[0].type==='tilelayer','native role missing/unknown: '+r.name);const index=map.layers.indexOf(layers[0]);need(r.role==='avatarForeground'?index<floor:index>floor,'native role crosses avatar floor: '+r.name);if(r.role==='opaqueOwnerUpper')assertOwnedUpperAnimation(map,layout,o,catalog,r);}
 assertNativeAirborne(map,layout);
}
