import{assertNativeSourceProjection,reconcileNativeProjection}from'../../tools/maps/native-projection';
import{buildMap}from'../../tools/maps/builder';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {refinePlazaFloorGarden} from '../../tools/maps/plaza-floor-garden';
import {applyZodiacExteriors} from '../../tools/maps/zodiac-exteriors';
import {beforeZodiacJson} from './zodiac-exterior-history';
import {applyHallExteriors} from '../../tools/maps/hall-exteriors';
import {beforeHallJson} from './hall-exterior-history';
import {beforePhysicsJson} from './zodiac-physics-history';
import {applyZodiacPhysics,reconcileZodiacPhysics} from '../../tools/maps/zodiac-physics';
import {refineNativePlaza} from '../../tools/maps/plaza-native';
import {EXPO_PLAZA,applyExpoPlaza,expoFixtures,expoPlacements,expoPlazaNative} from '../../tools/maps/expo-plaza';
import {refineExpoBooths} from '../../tools/maps/expo-booths';
import {applyBrandAssets,brandAssetPlacements,brandAssetsNative} from '../../tools/maps/brand-assets';
import {plazaGardenSprites} from '../../tools/art/plaza-garden';
import {renderRoadster,renderRoadsterV1,ROADSTER_V2_ATLAS_PATH} from '../../tools/art/roadster';
import {renderPlazaDrones} from '../../tools/art/plaza-drones';
import {renderPlazaFleet} from '../../tools/art/plaza-fleet';
import {approvedHistoricalPlaza,approvedHistoricalRaw} from './approved-world-successor';
import {DRONE_DEPTH_INPUTS,advanceDroneDepthLayout,advanceDroneDepthNative,beforeDroneDepthJson,renumberFreshDroneLayers} from './drone-depth-epoch';
import type {TileCatalog} from '../../tools/art/catalog';
import type {MapLayout,TiledMap,TileLayer} from '../../tools/maps/types';
import contract from '../../world/plaza-floor-garden-native.json';
const folder='tests/fixtures/plaza-floor-garden/';
export function historicalFloorPlaza(kind:'layout'|'native'):MapLayout|TiledMap{
 assert.equal(contract.beforeNativeSha256,'6ae3de6475c7410101e1c7e2689f581c83f044f86bc19b6dc996f763d28541f2');
 assert.equal(contract.beforeLayoutSha256,'ff2d682ae76144ada9f67b93a1af479159733ce086a31b66d01c3a4289eaa9ed');
 const raw=readFileSync(folder+`before-${kind}.${kind==='native'?'tmj':'json'}`),pin=kind==='native'?contract.beforeNativeSha256:contract.beforeLayoutSha256;
 assert.equal(createHash('sha256').update(raw).digest('hex'),pin,'Actual36c7 plaza fixture changed');return JSON.parse(raw.toString());
}
/** Direct current-state successor proof. Frozen historical bytes are input, never recovered from current state. */
const fleetNames=['plaza-fleet-camera','plaza-fleet-delivery','plaza-fleet-survey'];
const fleetPngPins=['24e1fb8d757c08aefc12e6f7e27b8103f8a20b55811c26edd4081f48bd529cb0','caf13a85f2e813a64354e823f14ba8f0b027c1df13a60d481a6659d63d1fce57','b391c29129d863be52d51ec529431bcb837c911cd9706042e863c5e02776863e'];
type Fleet=Awaited<ReturnType<typeof renderPlazaFleet>>['aircraft'];
/** Independent native extension, not a call back into the projection under
 * test. All65 historical atlases and98 layer bodies remain exact. The chain runs in the
 * drone-depth successor space (tests/helpers/drone-depth-epoch.ts): the forty ring drones move to
 * the native tail and the three fleet drones are appended after them, all aboveScenery. */
export function appendReviewedFleetNative(original:TiledMap,aircraft:Fleet):TiledMap{
 assert.equal(original.tilesets.length,65);assert.equal(original.layers.length,98);assert.equal(original.nextlayerid,102);
 assert.deepEqual(aircraft.map(a=>a.overlay.name),fleetNames,'Exactly three reviewed fleet types required');
 assert.equal(original.layers[45].name,'Sponsors / Demo 01');assert.equal(original.layers[49].name,'floorLayer');
 const native=advanceDroneDepthNative(original),layers:TileLayer[]=[];let gid=10914;
 assert.equal(Math.max(...original.tilesets.map(t=>t.firstgid+t.tilecount!)),gid);
 for(const[i,a]of aircraft.entries()){
  const o=a.overlay;assert.equal(o.level,'aboveScenery');assert.equal(createHash('sha256').update(a.png).digest('hex'),fleetPngPins[i]);
  assert.equal(o.image,`assets/tilesets/original/${fleetNames[i]}.png`);assert.ok(a.png.equals(readFileSync(o.image)),'Saved fleet PNG differs from reviewed pure producer');
  const width=a.png.readUInt32BE(16),height=a.png.readUInt32BE(20),count=width/32*height/32;assert.equal(width,512);assert.equal(count,[176,240,272][i]);
  assert.deepEqual([o.x,o.y,o.width,o.height],[[60,62,6,3],[67,70,8,3],[53,69,7,3]][i]);
  native.tilesets.push({firstgid:gid,name:o.name,tilewidth:32,tileheight:32,columns:16,tilecount:count,image:'../'+o.image,imagewidth:width,imageheight:height,properties:[{name:'tilesetCopyright',type:'string',value:'Original generated VarCamp drone sprites; native motion authored for this project; Original project artwork; permitted project distribution'}],tiles:o.animations.map(a=>({id:a.id,animation:a.frames.map(f=>({...f})),properties:[{name:'collides',type:'bool',value:false}]}))});
  const data=Array(128*128).fill(0);for(let y=0;y<o.height;y++)for(let x=0;x<o.width;x++)data[(o.y+y)*128+o.x+x]=gid+o.carrierTileIds[y*o.width+x];
  layers.push({id:102+i,name:o.name,type:'tilelayer',width:128,height:128,data,visible:true,opacity:1,x:0,y:0});gid+=count;
 }
 native.layers.push(...layers);native.nextlayerid=105;return native;
}
/** Approved welcome-plaza retirement: two standing signs with posts, the compass marker, the
 * reception desk and its wide screen. Source IDs and native cells are listed independently;
 * every cell must be occupied before clearing, and the production projection gate must accept
 * the result, so the native delta is exactly the projection of the source delta. */
export const WELCOME_PLAZA_RETIREMENT=Object.freeze({
 placements:['directory-prompt','arrival-position-label','arrival-compass','reception-post-directory','reception-post-position','reception-desk','reception-screen','reception-screen-content'],
 standingSigns:['directory-prompt','arrival-position-label'],
 nativeCells:{
  'scenery-aboveAvatar-0':[[61,70],[62,70],[63,70],[64,70],[61,73],[62,73],[63,73],[64,73]],
  'scenery-belowAvatar-1':[[62,71],[62,74],[59,73],[76,65],[77,65],[78,65],[76,66],[77,66],[78,66],[75,67],[76,67],[77,67],[78,67],[75,68],[76,68],[77,68],[78,68],[75,69],[76,69],[77,69],[78,69]],
  'scenery-belowAvatar-2':[[76,65],[77,65],[78,65],[76,66],[77,66],[78,66]],
  'physical-collisions':[[62,71],[62,74],[75,67],[76,67],[77,67],[78,67],[75,68],[78,68],[75,69],[78,69]],
 } as Record<string,number[][]>,
 cells:45,
});
/** Approved welcome-board retirement, applied after the plaza retirement: the raster welcome
 * board with its two posts and the blue sofa beside the arrival court. */
export const WELCOME_SIGN_RETIREMENT=Object.freeze({
 placements:['welcome-control-sign','reception-post-welcome-left','reception-post-welcome-right','welcome-seat'],
 standingSigns:['welcome-control-sign'],
 nativeCells:{
  'scenery-aboveAvatar-0':[[55,63],[56,63],[57,63],[58,63],[59,63]],
  'scenery-belowAvatar-1':[[52,61],[53,61],[54,61],[52,62],[53,62],[54,62],[56,64],[59,64]],
  'physical-collisions':[[52,62],[53,62],[54,62],[56,64],[59,64]],
 } as Record<string,number[][]>,
 cells:18,
});
type Retirement=typeof WELCOME_PLAZA_RETIREMENT|typeof WELCOME_SIGN_RETIREMENT;
export function retirePlazaProps(layout:MapLayout,native:TiledMap,catalog:TileCatalog,r:Retirement):{layout:MapLayout;native:TiledMap}{
 const l=structuredClone(layout),map=structuredClone(native);
 for(const id of r.placements)assert.equal(l.placements.filter(p=>p.id===id).length,1,`Retired placement ${id} must exist exactly once`);
 for(const face of r.standingSigns)assert.equal(l.standingSigns!.filter(s=>s.face===face).length,1,`Retired standing sign ${face} must exist exactly once`);
 l.placements=l.placements.filter(p=>!r.placements.includes(p.id));l.standingSigns=l.standingSigns!.filter(s=>!r.standingSigns.includes(s.face));
 let cleared=0;
 for(const[name,cells]of Object.entries(r.nativeCells)){const layer=map.layers.find(l=>l.name===name);assert.ok(layer?.type==='tilelayer',`Retired native layer ${name}`);
  for(const[x,y]of cells){const i=y*128+x;assert.notEqual(layer.data[i],0,`Retired native cell ${name} ${x},${y} already empty`);layer.data[i]=0;cleared++;}}
 assert.equal(cleared,r.cells);
 assertNativeSourceProjection(map,buildMap(l,catalog).tmj);
 return{layout:l,native:map};
}
export const retireWelcomePlazaProps=(layout:MapLayout,native:TiledMap,catalog:TileCatalog)=>retirePlazaProps(layout,native,catalog,WELCOME_PLAZA_RETIREMENT);
/** Approved expo hall, applied after the welcome-sign retirement: the two south grove
 * gardens, both ponds, three lawn strips and their furniture (33 placements, five of
 * them terrain) become one rectangular hall of twelve identical stalls (243 placements:
 * hall floor, carpets and wall seals as terrain; walls, posters, stickers, nameplate
 * fascias and posts, chairs, counters and balloons as props), ten 4x2 logo inlays and
 * twelve nameplate captions. The producer is pinned; the native delta is exactly the
 * projection of the source delta: every pre-expo atlas and layer stays in place and the
 * expo reservation family (sticker sheet, booth marks, caption atlas) is admitted after
 * the fleet with one panel per logo and one caption layer per nameplate. */
export const EXPO_PLAZA_PRODUCER_SHA256='11d400811d48b3e47e8f4966ae4b32b7afdee1e1abdb7a514b474ece52471a67';
/** Brand epoch: eleven logo inlays (the three owner-provided partner marks on s1-s3, the VarCamp lockup
 * on n6, the generic placeholders on s4-s5) and two six-wide plates fewer posters/more posts. */
export const EXPO_PLAZA_COUNTS=Object.freeze({placements:253,images:11,captions:12});
export function applyExpoPlazaSuccessor(layout:MapLayout,native:TiledMap,catalog:TileCatalog):{layout:MapLayout;native:TiledMap}{
 assert.equal(createHash('sha256').update(readFileSync('tools/maps/expo-plaza.ts')).digest('hex'),EXPO_PLAZA_PRODUCER_SHA256,'Expo plaza producer changed');
 const fixtures=expoFixtures(),{placements,images,captions}=EXPO_PLAZA_COUNTS;
 assert.equal(EXPO_PLAZA.retiredPlacements.length,33);assert.equal(expoPlacements().length,placements);assert.equal(fixtures.images.length,images);assert.equal(fixtures.captions.length,captions);
 const l=applyExpoPlaza(layout);
 assert.equal(l.placements.length,layout.placements.length-33+placements);
 assert.equal(l.images!.length,layout.images!.length+images);assert.equal(l.signs!.length,(layout.signs??[]).length+captions);assert.equal(l.standingSigns!.length,(layout.standingSigns??[]).length+captions);
 const map=expoPlazaNative(native,l,catalog);
 assert.deepEqual(map.tilesets.slice(0,native.tilesets.length),native.tilesets,'Expo must keep every pre-expo atlas reservation');
 const admitted=map.tilesets.slice(native.tilesets.length);
 assert.deepEqual(admitted.map(t=>t.name),['booth-stickers',...fixtures.images.map(i=>i.name),'standing-captions'],'Expo admits exactly the expo reservation family after the fleet');
 assert.equal(admitted[0].firstgid,Math.max(...native.tilesets.map(t=>t.firstgid+t.tilecount!)));
 const added=new Set([...fixtures.images.map(i=>i.name),...fixtures.captions.map(c=>'standing-caption-'+c.sign.name)]);
 assert.deepEqual(map.layers.map(x=>x.name).filter(n=>!added.has(n)),native.layers.map(x=>x.name),'Expo must keep every pre-expo native layer in order');
 assert.deepEqual(map.layers.map(x=>x.name).filter(n=>added.has(n)).sort(),[...added].sort(),'Expo adds exactly one panel per logo and one caption layer per nameplate');
 assert.equal(map.nextlayerid,native.nextlayerid!+added.size);
 assertNativeSourceProjection(map,buildMap(l,catalog).tmj);
 return{layout:l,native:map};
}
/** The approved chain up to (excluding) the expo hall: the input of applyExpoPlazaSuccessor. */
export async function expectedPreExpoSuccessor(catalog:TileCatalog):Promise<{layout:MapLayout;native:TiledMap}>{
 for(const [id,s] of Object.entries(plazaGardenSprites()))assert.deepEqual(catalog[id],s,`Original grounded tree/canopy contract ${id}`);
 return (async()=>{
  // The reviewed fleet producer/recipe advanced once, in the drone-depth epoch (level only, belowAvatar -> aboveScenery).
  assert.equal(DRONE_DEPTH_INPUTS['tools/art/plaza-fleet.ts'][0],'3ffa9d3b2da3aba95251226725d56516ecfc5e0688944a73d41e178cb3ba6960');assert.equal(DRONE_DEPTH_INPUTS['art/source/plaza-fleet-recipe.json'][0],'343db1ef1f79eaf111759651092ae82efeaa61ae152fe971c5f30ce4d41f78f3');
  assert.equal(createHash('sha256').update(readFileSync('tools/art/plaza-fleet.ts')).digest('hex'),DRONE_DEPTH_INPUTS['tools/art/plaza-fleet.ts'][1]);
  assert.equal(createHash('sha256').update(readFileSync('art/source/plaza-fleet-recipe.json')).digest('hex'),DRONE_DEPTH_INPUTS['art/source/plaza-fleet-recipe.json'][1]);
  const l=refinePlazaFloorGarden(historicalFloorPlaza('layout') as MapLayout),roadster=await renderRoadsterV1(),drones=await renderPlazaDrones(),fleet=await renderPlazaFleet();// the pre-v2 chain carries the frozen v1 roadster epoch
  l.animatedOverlays=l.animatedOverlays!.filter(o=>o.name!=='roadster'&&!o.name.startsWith('plaza-drone-'));
  l.animatedOverlays.push(roadster.metadata.overlay,...drones.metadata.resources.map(r=>r.overlay));
  // Refine the genuine old65 epoch BEFORE adding fleet source. Passing the
  // historical refiner a current fleet would manufacture an invalid hybrid.
  const raw=readFileSync(folder+'before-native.tmj','utf8'),legacy=renumberFreshDroneLayers(refineNativePlaza(raw,l,catalog),JSON.parse(raw));
  const base=approvedHistoricalPlaza();assert.equal(createHash('sha256').update(approvedHistoricalRaw('maps/overworld.tmj')).digest('hex'),'65d9705f7c44078bf7f593b4d966315cac67f0b02029660f7d2666bbd18ebcd8');assert.deepEqual(legacy.tilesets,base.tilesets);
  l.animatedOverlays.push(...fleet.aircraft.map(a=>a.overlay));
  const manual=appendReviewedFleetNative(base,fleet.aircraft);
  assert.deepEqual(reconcileNativeProjection(legacy,buildMap(l,catalog).tmj),manual,'Production current forward transaction differs from independent three-append native oracle');
  assert.ok(readFileSync('maps/overworld.wam').equals(approvedHistoricalRaw('maps/overworld.wam')),'Fleet must retain all organizer controls');
  const plaza=retireWelcomePlazaProps(l,manual,catalog);
  return retirePlazaProps(plaza.layout,plaza.native,catalog,WELCOME_SIGN_RETIREMENT);
 })();
}
/** Approved owner-provided brand assets, applied after the expo hall: the 4x3 court fountain and six
 * 1x3 road lamps (seven placements, no image, sign or control). The producer is pinned; the native
 * delta is exactly the projection of the source delta: every expo-epoch atlas and layer stays in
 * place and the two brand atlases are admitted after the expo family under their registered names. */
export const BRAND_ASSETS_PRODUCER_SHA256='ab66e87410ffb7ca0efb71f4328f81553e5b605d5437b5dfaf546f4d22806e90';
export const BRAND_ASSETS_COUNTS=Object.freeze({placements:7,atlases:['plaza-fountain','plaza-lamp']});
export function applyBrandAssetsSuccessor(layout:MapLayout,native:TiledMap,catalog:TileCatalog):{layout:MapLayout;native:TiledMap}{
 assert.equal(createHash('sha256').update(readFileSync('tools/maps/brand-assets.ts')).digest('hex'),BRAND_ASSETS_PRODUCER_SHA256,'Brand assets producer changed');
 assert.equal(brandAssetPlacements().length,BRAND_ASSETS_COUNTS.placements);
 const l=applyBrandAssets(layout);
 assert.equal(l.placements.length,layout.placements.length+BRAND_ASSETS_COUNTS.placements);
 for(const key of ['images','signs','standingSigns','animatedOverlays'] as const)assert.deepEqual(l[key],layout[key],'Brand assets touch no '+key);
 const map=brandAssetsNative(native,l,catalog);
 assert.deepEqual(map.tilesets.slice(0,native.tilesets.length),native.tilesets,'Brand assets must keep every expo-epoch atlas reservation');
 assert.deepEqual(map.tilesets.slice(native.tilesets.length).map(t=>t.name),BRAND_ASSETS_COUNTS.atlases,'Brand assets admit exactly the two registered atlases after the expo family');
 assert.equal(map.tilesets[native.tilesets.length].firstgid,Math.max(...native.tilesets.map(t=>t.firstgid+t.tilecount!)));
 assert.deepEqual(map.layers.map(x=>x.name),native.layers.map(x=>x.name),'Brand assets add no native layer');
 assert.equal(map.nextlayerid,native.nextlayerid);
 assertNativeSourceProjection(map,buildMap(l,catalog).tmj);
 return{layout:l,native:map};
}
/** The approved chain up to (excluding) the brand assets: the input of applyBrandAssetsSuccessor. */
export async function expectedExpoSuccessor(catalog:TileCatalog):Promise<{layout:MapLayout;native:TiledMap}>{
 const signs=await expectedPreExpoSuccessor(catalog);
 return applyExpoPlazaSuccessor(signs.layout,signs.native,catalog);
}
/** Approved roadster-v2 epoch, applied after the brand assets: the plaza's `roadster` role moves from
 * the frozen sixteen-pose v1 atlas (registered GID 4330, 240 tiles) to the compiled v2 motion atlas.
 * The source delta is one descriptor; the native delta is exactly its projection: the v1 reservation
 * is vacated, the v2 body is appended after the brand family, the roadster layer keeps its id, position
 * and footprint, and every other atlas and layer stays in place. */
export async function applyRoadsterV2Successor(layout:MapLayout,native:TiledMap,catalog:TileCatalog):Promise<{layout:MapLayout;native:TiledMap}>{
 const v2=await renderRoadster(),l=structuredClone(layout),i=l.animatedOverlays!.findIndex(o=>o.name==='roadster');assert.ok(i>=0,'Roadster role missing');
 assert.equal(l.animatedOverlays![i].image,'assets/tilesets/original/roadster.png','Roadster v2 applies to the v1 epoch');assert.equal(v2.metadata.overlay.image,ROADSTER_V2_ATLAS_PATH);
 assert.ok(v2.png.equals(readFileSync(v2.metadata.overlay.image)),'Saved roadster-v2 PNG differs from reviewed pure producer');l.animatedOverlays![i]=v2.metadata.overlay;
 const old=native.tilesets.filter(t=>t.name==='roadster');assert.equal(old.length,1);assert.deepEqual([old[0].firstgid,old[0].tilecount,old[0].image],[4330,240,'../assets/tilesets/original/roadster.png']);
 const map=reconcileNativeProjection(native,buildMap(l,catalog).tmj);
 assert.deepEqual(map.tilesets.slice(0,-1),native.tilesets.filter(t=>t!==old[0]),'Roadster v2 must keep every other atlas reservation in place');
 const added=map.tilesets.at(-1)!;assert.equal(added.firstgid,Math.max(...native.tilesets.map(t=>t.firstgid+t.tilecount!)));assert.equal(added.name,'roadster');assert.equal(added.image,'../'+ROADSTER_V2_ATLAS_PATH);assert.equal(added.tilecount,v2.metadata.atlas.tilecount);
 assert.deepEqual(map.layers.map(x=>[x.id,x.name]),native.layers.map(x=>[x.id,x.name]),'Roadster v2 must keep every native layer and id in order');assert.equal(map.nextlayerid,native.nextlayerid);
 const cells=(m:TiledMap)=>(m.layers.find(x=>x.name==='roadster') as TileLayer).data.flatMap((g,n)=>g?[n]:[]);assert.deepEqual(cells(map),cells(native),'Roadster footprint unchanged');
 assert.deepEqual((map.layers.find(x=>x.name==='roadster') as TileLayer).data.filter(Boolean),v2.metadata.overlay.carrierTileIds.map(id=>added.firstgid+id));
 assertNativeSourceProjection(map,buildMap(l,catalog).tmj);
 return{layout:l,native:map};
}
/** The approved chain up to (excluding) the roadster-v2 epoch: the input of applyRoadsterV2Successor. */
export async function expectedBrandSuccessor(catalog:TileCatalog):Promise<{layout:MapLayout;native:TiledMap}>{
 const expo=await expectedExpoSuccessor(catalog);
 return applyBrandAssetsSuccessor(expo.layout,expo.native,catalog);
}
/** One shared actual forward producer transaction for groves/redraw tests. */
export async function expectedPlazaSuccessor(catalog:TileCatalog):Promise<{layout:MapLayout;native:TiledMap}>{
 const brand=await expectedBrandSuccessor(catalog);
 const roadster=await applyRoadsterV2Successor(brand.layout,brand.native,catalog);
 const layout=refineExpoBooths(roadster.layout);
 const native=expoPlazaNative(roadster.native,layout,catalog);
 assert.deepEqual(layout,beforeZodiacJson('world/layouts/overworld.json'),'Genuine pre-exterior source must match the complete preceding forward chain');
 assert.deepEqual(native,beforeZodiacJson('maps/overworld.tmj'),'Genuine pre-exterior native must match the complete preceding forward chain');
 const zodiac=applyZodiacExteriors(layout),zodiacNative=reconcileNativeProjection(native,buildMap(zodiac,catalog).tmj);
 assert.deepEqual(zodiac,beforeHallJson('world/layouts/overworld.json'),'Genuine pre-hall source must match the zodiac forward operation');
 assert.deepEqual(zodiacNative,beforeHallJson('maps/overworld.tmj'),'Genuine pre-hall native must match the zodiac forward operation');
 const next=applyHallExteriors(zodiac);
 const hallNative=reconcileNativeProjection(zodiacNative,buildMap(next,catalog).tmj);
 assert.deepEqual(next,beforePhysicsJson('world/layouts/overworld.json'),'Genuine pre-physics source must match the hall forward operation');
 assert.deepEqual(hallNative,beforePhysicsJson('maps/overworld.tmj'),'Genuine pre-physics native must match the hall forward operation');
 const physical=applyZodiacPhysics(next),physicalNative=reconcileZodiacPhysics(hallNative,physical,catalog);
 assert.deepEqual(physical,advanceDroneDepthLayout(beforeDroneDepthJson('world/layouts/overworld.json')),'Genuine pre-drone-depth source must match the physics forward operation');
 assert.deepEqual(physicalNative,advanceDroneDepthNative(beforeDroneDepthJson('maps/overworld.tmj')),'Genuine pre-drone-depth native must match the physics forward operation');
 return {layout:physical,native:physicalNative};
}
export async function assertPlazaSuccessor(layout:MapLayout,map:TiledMap,catalog:TileCatalog):Promise<void>{
 const expected=await expectedPlazaSuccessor(catalog);
 assert.ok(isDeepStrictEqual(layout,expected.layout),'Current plaza source must be exactly the approved forward operation');
 assert.ok(isDeepStrictEqual(map,expected.native),'Current native must be exactly the approved forward operation');
}
