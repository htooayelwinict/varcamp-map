/** Drone-depth epoch (2026-10-26 owner request: "set all drones at upper layer top of other
 * objects and tiles"). The43 overworld drone overlays (closed PLAZA_DRONES class) move from
 * belowAvatar to aboveScenery. The source delta is exactly that level after one closed
 * provenance transition (five reviewed producer input SHAs); the native delta is exactly the
 * same layer bodies moved, in source order, to the trailing airborne stack. Genuine predecessor
 * bytes come from the frozen fixture, never from current state. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {PLAZA_DRONES} from '../../tools/maps/airborne';
import {buildMap} from '../../tools/maps/builder';
import {reconcileNativeProjection} from '../../tools/maps/native-projection';
import {loadTileCatalog} from '../../tools/art/catalog';
import type {LayoutAnimatedOverlay,MapLayout,TiledMap} from '../../tools/maps/types';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
/** Exact old -> reviewed new producer bytes carried in animated-overlay provenance. The two drone
 * producers and the fleet recipe change only the emitted level; the role registry and its contract
 * change only the drones' closed role (avatarForeground -> aircraft). Every current world-ambient,
 * coast-life and aircraft descriptor on any map records those two as inputs. */
export const DRONE_DEPTH_INPUTS:Record<string,readonly[string,string]>={
 'tools/art/plaza-drones.ts':['326cca89c7dba0b8a4321ce882dca2bfcaa54c47b02ab057df6e103270ed1df6','3d5aaef73b605b81dcc7427432c54027f70fb63141d862918a2f9ce054b37eab'],
 'tools/art/plaza-fleet.ts':['3ffa9d3b2da3aba95251226725d56516ecfc5e0688944a73d41e178cb3ba6960','1805e418fb36508ea1ba0eda72d9cfbe983919a57f46a413c44deb71b6fd8bac'],
 'art/source/plaza-fleet-recipe.json':['343db1ef1f79eaf111759651092ae82efeaa61ae152fe971c5f30ce4d41f78f3','56ccb60d6a7d40ad99954ce4c6c90972fbcfad87482427238fa8c713536bd793'],
 'tools/maps/animated-decoration.ts':['b4e0788debcb53cbbac97488d88f6da2a3bdf0f0b2d6effe251f8552b4590621','803ec55098732becbdf5fbf315097a57363af5eaa77758fe6e9ba68c2ae259b5'],
 'tools/maps/animated-decoration-contract.json':['fd6a605e785551d6709e60cd1c2ae5c477e5152169b9ae7e8b78ac4d14f4a4e0','ad2cdc7b80dd2d60e4b4fc17597056d950f67952557e6615e245bfff7dfb6f0f'],
};
const droneNames=new Set(PLAZA_DRONES.map(r=>r.name));
export const isDrone=(name:string)=>droneNames.has(name);
export function assertDroneDepthProducers():void{for(const[path,[,after]]of Object.entries(DRONE_DEPTH_INPUTS))assert.equal(sha(readFileSync(path)),after,'Reviewed drone-depth producer changed '+path);}
/** Provenance-only transition of one genuine pre-epoch descriptor (any map): exact old input
 * SHAs advance to the reviewed producer bytes; level, pixels and every other field stay. */
export function advanceDroneDepthOverlay(o:LayoutAnimatedOverlay):LayoutAnimatedOverlay{
 const result=structuredClone(o);
 for(const input of result.provenance?.inputs??[]){const pair=DRONE_DEPTH_INPUTS[input.path];if(!pair)continue;assert.equal(input.sha256,pair[0],'Unreviewed pre-drone-depth provenance '+input.path+' in '+o.name);input.sha256=pair[1];}
 return result;
}
/** Genuine historical layouts stay buildable by the current builder (which re-verifies every
 * provenance input) only through this closed transition, applied to historical bytes. */
export function advanceDroneDepthProvenance<T extends MapLayout>(layout:T):T{
 assertDroneDepthProducers();const result=structuredClone(layout);
 if(result.animatedOverlays)result.animatedOverlays=result.animatedOverlays.map(advanceDroneDepthOverlay);
 return result;
}
/** The epoch's source delta: the43 provenance-advanced drone descriptors move belowAvatar -> aboveScenery. */
export function applyDroneDepth(layout:MapLayout):MapLayout{
 assertDroneDepthProducers();const result=structuredClone(layout);let count=0;
 result.animatedOverlays=result.animatedOverlays?.map(o=>{
  if(!isDrone(o.name))return o;count++;assert.equal(o.level,'belowAvatar','Drone depth epoch requires belowAvatar: '+o.name);
  for(const input of o.provenance?.inputs??[])if(DRONE_DEPTH_INPUTS[input.path])assert.equal(input.sha256,DRONE_DEPTH_INPUTS[input.path][1],'Drone depth requires advanced provenance '+input.path);
  return{...o,level:'aboveScenery'};
 });
 assert.equal(count,PLAZA_DRONES.length,'Drone depth epoch requires all43 drones');return result;
}
/** Inverse level move for historical chains that reconstruct earlier epochs from the current pure
 * drone producers (whose provenance already carries the reviewed producer bytes). */
export function retractDroneLevel(o:LayoutAnimatedOverlay):LayoutAnimatedOverlay{
 assert.ok(isDrone(o.name),'Not a registered drone: '+o.name);assert.equal(o.level,'aboveScenery','Current drone producer must emit aboveScenery: '+o.name);
 return{...structuredClone(o),level:'belowAvatar'};
}
/** Closed byte receipt of the epoch: every non-test path it changed, base SHA -> current SHA. An
 * earlier epoch's "every other byte unchanged" pin advances only through an exact row here. */
export function droneDepthSuccessorSha(path:string,pin:string):string{
 const table=JSON.parse(readFileSync('tests/fixtures/drone-depth/transitions.json','utf8'));assert.equal(table.version,1);assert.equal(table.base,'01502e170de47873fae2c3ad4b04343c783b8c84');
 const row=table.transitions[path] as [string,string]|undefined;return row&&row[0]===pin?row[1]:pin;
}
export const DRONE_DEPTH_FIXTURE_SHA256='a6c3b45513d9d660a4d8a956c86e4b4cddb7c42f62692bd4f661fcea1ce70096';
function fixture(){
 const raw=readFileSync('tests/fixtures/drone-depth/before.json.gz');assert.equal(sha(raw),DRONE_DEPTH_FIXTURE_SHA256,'Genuine pre-drone-depth fixture changed');
 const data=JSON.parse(gunzipSync(raw,{maxOutputLength:16*1024*1024}).toString());assert.equal(data.version,1);assert.equal(data.base,'01502e170de47873fae2c3ad4b04343c783b8c84');
 assert.deepEqual(Object.keys(data.components),['world/layouts/overworld.json','maps/overworld.tmj']);
 return data as {components:Record<string,{raw:string;sha256:string;bytes:number}>};
}
export function beforeDroneDepthRaw(path:string):Buffer{const r=fixture().components[path];assert.ok(r,'Unknown pre-drone-depth input');assert.equal(Buffer.byteLength(r.raw),r.bytes);assert.equal(sha(r.raw),r.sha256);return Buffer.from(r.raw);}
export const beforeDroneDepthJson=<T=any>(path:string):T=>JSON.parse(beforeDroneDepthRaw(path).toString());
/** Genuine pre-epoch overworld source with the closed provenance transition applied. */
export const beforeDroneDepthLayout=()=>advanceDroneDepthProvenance(beforeDroneDepthJson<MapLayout>('world/layouts/overworld.json'));
/** Independent native oracle: same tilesets and layer bodies, drone layers moved to the tail. */
export function droneDepthNativeOracle(before:TiledMap,layout:MapLayout):TiledMap{
 const result=structuredClone(before),names=layout.animatedOverlays!.filter(o=>isDrone(o.name)).map(o=>o.name);
 assert.equal(names.length,PLAZA_DRONES.length);const floor=result.layers.findIndex(l=>l.name==='floorLayer');
 const drones=names.map(n=>{const i=result.layers.findIndex(l=>l.name===n);assert.ok(i>=0&&i<floor,'Pre-epoch drone must sit below the avatar floor: '+n);return result.layers[i];});
 result.layers=[...result.layers.filter(l=>!isDrone(l.name)),...drones];return result;
}
/** The complete closed transition, for genuine sources of every earlier current-world epoch
 * (exteriors, halls, physics): the drone delta is disjoint from and commutes with each of them,
 * and the current builder only projects descriptors equal to the current drone metadata. Earlier
 * epoch proofs therefore compose with this one in the drone-depth successor space. */
export const advanceDroneDepthLayout=<T extends MapLayout>(layout:T):T=>applyDroneDepth(advanceDroneDepthProvenance(layout)) as T;
/** Native half of the same transition: every registered drone layer below the avatar floor moves,
 * body and id unchanged and in its existing relative order, to the end of the native stack. */
export function advanceDroneDepthNative<T extends TiledMap>(map:T):T{
 const result=structuredClone(map),floor=result.layers.findIndex(l=>l.name==='floorLayer');assert.ok(floor>=0,'Avatar floor missing');
 const drones=result.layers.filter(l=>isDrone(l.name));assert.ok(drones.every(l=>result.layers.indexOf(l)<floor),'Pre-epoch drones must sit below the avatar floor');
 result.layers=[...result.layers.filter(l=>!isDrone(l.name)),...drones];return result;
}
/** The historical floor-garden refiner numbers fresh layers in its paint order. In the drone-depth
 * space it meets the then-new drone layers after the floor, so it would number them after the new
 * floor image; historically the drones were painted (and numbered) first. Only fresh ids move. */
export function renumberFreshDroneLayers<T extends TiledMap>(map:T,prior:TiledMap):T{
 const result=structuredClone(map),names=new Set(prior.layers.map(l=>l.name)),old=new Set(prior.layers.map(l=>l.id)),fresh=result.layers.filter(l=>!names.has(l.name));
 const ids=fresh.map(l=>l.id).sort((a,b)=>a-b);assert.ok(ids.every(id=>!old.has(id)),'Fresh refiner id collides with a prior layer');
 [...fresh.filter(l=>isDrone(l.name)),...fresh.filter(l=>!isDrone(l.name))].forEach((l,i)=>{l.id=ids[i];});return result;
}
/** The complete native successor of a pre-epoch native and its (provenance-advanced) source. */
export function droneDepthNative(before:TiledMap,layout:MapLayout):TiledMap{
 const next=applyDroneDepth(layout),map=reconcileNativeProjection(before,buildMap(next,loadTileCatalog()).tmj);
 assert.deepEqual(map,droneDepthNativeOracle(before,next),'Drone-depth projection differs from the independent reorder oracle');return map;
}
export function preDroneDepthLayout(layout:MapLayout):MapLayout{
 if(!layout.animatedOverlays?.some(o=>isDrone(o.name)&&o.level==='aboveScenery'))return structuredClone(layout);
 const before=beforeDroneDepthLayout();
 assert.deepEqual(layout,applyDroneDepth(before),'Current source must be exactly the drone-depth successor');return before;
}
let expected:TiledMap|undefined;
export function preDroneDepthNative(map:TiledMap):TiledMap{
 const floor=map.layers.findIndex(l=>l.name==='floorLayer');
 if(!map.layers.some((l,i)=>isDrone(l.name)&&i>floor))return structuredClone(map);
 const before=beforeDroneDepthJson<TiledMap>('maps/overworld.tmj');
 expected??=droneDepthNative(before,beforeDroneDepthLayout());
 assert.deepEqual(map,expected,'Current native must be exactly the drone-depth successor');return before;
}
