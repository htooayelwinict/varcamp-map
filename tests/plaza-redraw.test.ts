import {applyVibeCodeBranding,restoreVibeCodeBranding} from '../tools/maps/vibecode-branding';
import {applyPlazaLandscape,restorePlazaLandscape} from '../tools/maps/plaza-landscape';
import {applyPlazaCrescent,restorePlazaCrescent} from '../tools/maps/plaza-crescent';
import {applyHallBuildings,restoreHallBuildings} from '../tools/maps/hall-buildings';
import {applyLeoLionHead,restoreLeoLionHead} from '../tools/maps/leo-lion-head';
import {applyFountainMotion,restoreFountainMotion} from '../tools/maps/fountain-motion';
import {applyExpoSpacing,restoreExpoSpacing} from '../tools/maps/expo-spacing';
import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {SIGN_IDS} from '../src/world/catalog';
import {loadTileCatalog} from '../tools/art/catalog';
import type {MapLayout} from '../tools/maps/types';
import {refinePlazaFloorGarden} from '../tools/maps/plaza-floor-garden';
import {applyZodiacExteriors} from '../tools/maps/zodiac-exteriors';
import {applyZodiacPhysics,restoreZodiacPhysics} from '../tools/maps/zodiac-physics';
import {prePhysicsLayout} from './helpers/pre-zodiac-physics-epoch';
import {applyArrivalRefresh,restoreArrivalRefresh} from '../tools/maps/arrival-refresh';
import {applyPlazaPatrol,restorePlazaPatrol} from '../tools/maps/plaza-patrol';
import {arrivalFloorPanels} from './helpers/physical-prop-contracts';
import {expectedPlazaSuccessor,WELCOME_PLAZA_RETIREMENT,WELCOME_SIGN_RETIREMENT} from './helpers/plaza-successor';
import routes from './fixtures/plaza-pedestrian-cells.json';
import type {TiledMap,TileLayer} from '../tools/maps/types';
import {validateMap} from '../tools/maps/validate';
import {WORLD_CATALOG} from '../src/world/catalog';
const source=()=>JSON.parse(readFileSync('world/layouts/overworld.json','utf8')) as MapLayout;
const before=()=>JSON.parse(readFileSync('tests/fixtures/plaza-floor-garden/before-layout.json','utf8')) as MapLayout;
it('reserves unique engine atlas names as well as nonoverlapping GIDs in the actual forward export',()=>{
 const map=JSON.parse(readFileSync('maps/overworld.tmj','utf8')) as TiledMap;
 expect(validateMap(map,WORLD_CATALOG)).toEqual([]);
});

it('puts sponsor and event identity on the floor without posts or unrelated sign assemblies',()=>{
 const l=source(),sponsors=l.images!.filter(p=>p.name.startsWith('Sponsors /'));
 expect(sponsors).toHaveLength(3);for(const p of sponsors)expect(p.standing,p.name).toBe(false);
 expect(l.images!.filter(p=>p.name.startsWith('Arrival /'))).toEqual(arrivalFloorPanels);
 expect(l.placements.filter(p=>/^standing-sponsor-|^sponsor-frame-|^sponsor-trim-|^reception-post-brand-|^varcamp-nameplate$/.test(p.id))).toEqual([]);
 expect(l.standingSigns!.filter(s=>s.face==='varcamp-nameplate'||s.faceKind==='image')).toEqual([]);
 // The twelve expo booth nameplates (fascia faces over fascia posts) are the only assemblies added since the retirements.
 const nameplate=(face:string)=>/^expo-[ns]\d-nameplate-fascia$/.test(face);
 expect(l.standingSigns!.filter(s=>s.face!=='varcamp-nameplate'&&!nameplate(s.face))).toEqual(before().standingSigns!.filter(s=>s.face!=='varcamp-nameplate'&&s.face!=='arrival-direction-crosspost'&&!['gate-plaza-return-solar','gate-plaza-return-lunar','exterior-road-sign-north','exterior-road-sign-south'].includes(s.face)&&s.faceKind!=='image'&&!WELCOME_PLAZA_RETIREMENT.standingSigns.includes(s.face)&&!WELCOME_SIGN_RETIREMENT.standingSigns.includes(s.face)));
 expect(l.standingSigns!.filter(s=>nameplate(s.face))).toHaveLength(12);
});

it('is idempotent and retains every real native semantic layer and reachable guide/entrance cell',async()=>{
 const l=source(),catalog=loadTileCatalog();expect(applyVibeCodeBranding(applyPlazaLandscape(applyPlazaCrescent(applyHallBuildings(applyLeoLionHead(applyFountainMotion(applyExpoSpacing(applyPlazaPatrol(applyArrivalRefresh(applyZodiacPhysics(applyZodiacExteriors(refinePlazaFloorGarden(restoreZodiacPhysics(restoreArrivalRefresh(restorePlazaPatrol(restoreExpoSpacing(restoreFountainMotion(restoreLeoLionHead(restoreHallBuildings(restorePlazaCrescent(restorePlazaLandscape(restoreVibeCodeBranding(l))))))))))))))))))))))).toEqual(l);
 const native=JSON.parse(readFileSync('maps/overworld.tmj','utf8')) as TiledMap,expected=await expectedPlazaSuccessor(catalog);
 expect(l).toEqual(expected.layout);expect(expected.native).toEqual(native);
 const mask=native.layers.find(p=>p.name==='physical-collisions') as TileLayer;
 for(const [x,y] of routes.allowedCells)expect(mask.data[y*128+x],`guide ${x},${y}`).toBe(0);
 const spawn=l.entries.find(p=>p.isDefault)!,queue=[spawn.y*128+spawn.x],seen=new Set(queue);
 for(let h=0;h<queue.length;h++){const n=queue[h],x=n%128,y=Math.floor(n/128);for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const c=ny*128+nx;if(nx>=0&&ny>=0&&nx<128&&ny<128&&!mask.data[c]&&!seen.has(c)){seen.add(c);queue.push(c);}}}
 for(const p of [...l.entries,...l.exits,...l.areas])for(let y=p.y;y<p.y+p.height;y++)for(let x=p.x;x<p.x+p.width;x++)expect(seen.has(y*128+x),p.name).toBe(true);
 const floor=native.layers.findIndex(p=>p.name==='floorLayer');
 for(const image of l.images!)expect(native.layers.findIndex(p=>p.name===image.name),image.name).toBeLessThan(floor);
 expect(restorePlazaCrescent(restorePlazaLandscape(restoreVibeCodeBranding(l))).placements.filter(p=>p.id.startsWith('plaza-garden-'))).toHaveLength(132);
},45000); // Complete historical chain now includes the additional spacing projection and native reconciliation.

it('retains all twelve doorway footprints while consuming original generated pavilion and grass artwork',()=>{
 // Prove the complete current physical successor before staging its genuine
 // pre-physics layout for this retained original pavilion/grass contract.
 const l=prePhysicsLayout(source()),old=before(),catalog=loadTileCatalog();
 for(const sign of SIGN_IDS){
  const p=l.placements.find(p=>p.id===`${sign}-building`)!,b=old.placements.find(row=>row.id===p.id)!;
  expect({...p,sprite:b.sprite}).toEqual(b);
  expect(p.sprite).toBe('zodiac-building-'+sign);
  expect(catalog[p.sprite].sourceId).toBe('zodiac-exteriors');
  expect(catalog[p.sprite].blockingCells).toEqual(catalog[b.sprite].blockingCells);
  expect(catalog[p.sprite].level).toBe(catalog[b.sprite].level);
  expect(l.placements.find(p=>p.id===`${sign}-zodiac-threshold`)).toMatchObject({sprite:`zodiac-emblem-${sign}`,x:p.x+4,y:p.y+12,width:4,height:4});
 }
 expect(l.placements.filter(p=>p.sprite==='ground-grass')).toEqual([]);
 expect(l.placements.filter(p=>['plant-grass','plant-flower'].includes(p.sprite))).toEqual([]);
 expect(l.placements.filter(p=>p.layer==='terrain'&&p.sprite.startsWith('plaza-grass-')).length).toBeGreaterThan(100);
 for(const p of l.placements.filter(p=>p.sprite.startsWith('plaza-grass-')))expect(catalog[p.sprite]).toMatchObject({sourceId:'plaza-original-garden',blockingCells:[],level:'belowAvatar'});
 expect(l.entries).toEqual(old.entries);expect(l.exits).toEqual(old.exits);expect(l.areas).toEqual(old.areas);
 // The expo hall appended its twelve booth nameplate captions after the original signs.
 expect(l.signs!.slice(0,old.signs!.length)).toEqual(old.signs);expect(l.signs!.slice(old.signs!.length).map(s=>s.name)).toEqual(['n1','n2','n3','n4','n5','n6','s1','s2','s3','s4','s5','s6'].map(id=>`expo-${id}-nameplate`));
});
