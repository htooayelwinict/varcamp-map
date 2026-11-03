import {checkPlazaPatrolArt} from './plaza-patrol';
import {checkFountainMotionArt} from './fountain-motion';
import {checkLeoLionHeadArt} from './leo-lion-head';
import {checkHallBuildingsArt} from './hall-buildings';
import{checkStandingCaptionArt}from'./standing-captions';
import {checkTropicalCoveArt} from './tropical-cove';
import {checkNaturalCoastArt} from './natural-coast';
import {checkHarbourPlane} from './harbour-plane';
import{checkWorldAmbientArt}from'./world-ambient-check';
import {renderPlazaIdentity} from './plaza-generated';
import {renderPlazaGarden} from './plaza-garden';
import {renderPlazaBuildings,renderPlazaGrass} from './plaza-buildings';
import {checkZodiacExteriorArt} from './zodiac-exteriors';
import {checkHallExteriorArt} from './hall-exteriors';
import {checkZodiacPhysicsArt} from '../maps/zodiac-physics';
import {checkArrivalRefreshArt} from './arrival-refresh';
import {renderPlazaDrones} from './plaza-drones';
import {checkPlazaFleetArt} from './plaza-fleet-check';
import {renderPlazaPots} from './plaza-pots';
import {renderCoastLifeAssets} from './coast-life-assets';
import {renderCoastLife} from './coast-life';
import {renderInteriorReferenceMotion} from './interior-reference-motion';
import {isDeepStrictEqual} from 'node:util';
import {validateSpriteDepth} from '../maps/solid-props';
import {renderRoadster,renderRoadsterV1,ROADSTER_V2_ATLAS_PATH,ROADSTER_V2_METADATA_PATH} from './roadster';
import {renderCoastalFlight} from './coastal-flight';
import {renderExteriorGates} from './exterior-gates';
import { renderHubMasters } from './hub-art';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { loadTileCatalog, type TileCatalog } from './catalog';
import { SIGN_IDS, ELEMENT_IDS } from '../../src/world/catalog';

/** Returns all actionable asset errors without overwriting outputs or repairing corrupt data. */
interface SourceRecord { attribution: string; url: string; license: string; licenseFile: string; changes: string; files: { path: string; sha256: string }[]; }
export async function checkArt(catalog: TileCatalog = loadTileCatalog()): Promise<string[]> {
  const errors: string[]=[];
  await checkNaturalCoastArt();
  await checkHarbourPlane();
  const sources=JSON.parse(readFileSync('art/sources.json','utf8')) as Record<string,SourceRecord>;
  // Reject an incomplete mandatory family before evaluating dependent artwork.
  // This remains unconditional even when all fleet registry rows are removed.
  const fleetErrors=await checkPlazaFleetArt(sources);
  if(fleetErrors.length)return fleetErrors;
  const zodiacErrors=await checkZodiacExteriorArt(catalog,sources);if(zodiacErrors.length)return zodiacErrors;
  const hallErrors=await checkHallExteriorArt(catalog,sources);if(hallErrors.length)return hallErrors;
  const physicsErrors=await checkZodiacPhysicsArt(catalog);if(physicsErrors.length)return physicsErrors;
  const arrivalErrors=await checkArrivalRefreshArt();if(arrivalErrors.length)return arrivalErrors;
  const patrolErrors=await checkPlazaPatrolArt();if(patrolErrors.length)return patrolErrors;
  try{await checkFountainMotionArt();}catch(error){errors.push(String(error));}
  try{await checkLeoLionHeadArt(catalog);}catch(error){errors.push(String(error));}
  try{await checkHallBuildingsArt(catalog);}catch(error){errors.push(String(error));}
  errors.push(...await checkWorldAmbientArt());
  try{await checkStandingCaptionArt();}catch(error){errors.push(String(error));}
  try{await checkTropicalCoveArt();}catch(error){errors.push(String(error));}
  for (const id of [...SIGN_IDS.flatMap(sign=>[`glyph-${sign}`,`constellation-${sign}`]), ...ELEMENT_IDS.map(el=>`sigil-${el}`), 'telescope','quest-shrine','door-open','npc-guide','npc-maze-keeper','npc-dockmaster']) {
    if(!catalog[id]) errors.push(`${id}: missing required sprite`);
  }
  for (const [id,s] of Object.entries(sources)) {
    if(!s.attribution || !s.license || !s.url || !s.changes || !existsSync(s.licenseFile)) errors.push(`${id}: missing provenance or retained license`);
    for(const file of s.files) {
      if(!existsSync(file.path)) { errors.push(`${file.path}: missing source sheet`); continue; }
      if(createHash('sha256').update(readFileSync(file.path)).digest('hex')!==file.sha256) errors.push(`${file.path}: source hash mismatch; update changes and record only after review`);
    }
  }
  for (const [id,s] of Object.entries(catalog)) {
    try{validateSpriteDepth(id,s);}catch(error){errors.push(String(error));}
    if(!sources[s.sourceId]) errors.push(`${id}: unknown source ${s.sourceId}`);
    else if(!sources[s.sourceId].files.some(file=>file.path===s.sheet)) errors.push(`${id}: sheet absent from source manifest`);
    if(!existsSync(s.sheet)) { errors.push(`${id}: missing PNG ${s.sheet}`); continue; }
    let meta;
    try { meta=await sharp(s.sheet).metadata(); } catch { errors.push(`${id}: unreadable PNG`); continue; }
    const {x,y,width,height}=s.rect;
    if(![x,y,width,height].every(Number.isInteger) || x<0 || y<0 || width<1 || height<1) errors.push(`${id}: rectangle must use positive integer tile sizes and nonnegative positions`);
    if((x+width)*32>meta.width! || (y+height)*32>meta.height!) errors.push(`${id}: rectangle exceeds PNG bounds`);
    if(meta.format!=='png' || meta.width!%32 || meta.height!%32) errors.push(`${id}: sheet is not a PNG on a 32px grid`);
    for(const [cx,cy] of s.blockingCells) if(!Number.isInteger(cx) || !Number.isInteger(cy) || cx<0 || cy<0 || cx>=width || cy>=height) errors.push(`${id}: invalid blocking cell ${cx},${cy}`);
    if(!['belowAvatar','aboveAvatar'].includes(s.level)) errors.push(`${id}: invalid drawing level`);
  }
  if(readFileSync('art/source/exterior-gates.svg','utf8')!==renderExteriorGates())errors.push('exterior-gates: SVG differs from deterministic native gate master');
  const hubMasters=renderHubMasters(JSON.parse(readFileSync('art/source/hub-nameplates.json','utf8')));
  for(const [name,expected] of Object.entries({'hub-labels':hubMasters.labels,'hub-buildings':hubMasters.buildings}))if(readFileSync(`art/source/${name}.svg`,'utf8')!==expected)errors.push(`${name}: SVG differs from deterministic hub-art master`);
  for(const name of ['zodiac','magic','campus','amenities','guides','wayfinding','hub-buildings','hub-labels', 'coastal','exterior-gates','naval-details','beach-lounge','beach-surf','rolling-breaker','ship-interior']) {
    const png=`assets/tilesets/original/${name}.png`;
    if(!existsSync(png)) { errors.push(`${name}: missing custom PNG export`); continue; }
    const expected=await sharp(`art/source/${name}.svg`,{density:72}).ensureAlpha().raw().toBuffer();
    const actual=await sharp(png).ensureAlpha().raw().toBuffer();
    if(!expected.equals(actual)) errors.push(`${name}: PNG differs from native SVG export`);
    const stats=await sharp(png).stats();
    if(stats.isOpaque) errors.push(`${name}: custom sheet must retain transparency`);
  }
  const flight=await renderCoastalFlight();
  if(!readFileSync('assets/tilesets/original/coastal-flight.png').equals(flight.png))errors.push('coastal-flight: native animated PNG differs from deterministic source');
  if(JSON.stringify(JSON.parse(readFileSync('art/source/coastal-flight.json','utf8')))!==JSON.stringify(flight.metadata))errors.push('coastal-flight: metadata differs from deterministic source');
  const roadsterV1=await renderRoadsterV1();
  if(!readFileSync('assets/tilesets/original/roadster.png').equals(roadsterV1.png))errors.push('roadster: frozen v1 animated PNG differs from compiled original poses');
  if(JSON.stringify(JSON.parse(readFileSync('art/source/roadster.json','utf8')))!==JSON.stringify(roadsterV1.metadata))errors.push('roadster: v1 metadata differs from compiled original poses');
  const roadster=await renderRoadster();
  if(!readFileSync(ROADSTER_V2_ATLAS_PATH).equals(roadster.png))errors.push('roadster-v2: animated PNG differs from compiled motion');
  if(JSON.stringify(JSON.parse(readFileSync(ROADSTER_V2_METADATA_PATH,'utf8')))!==JSON.stringify(roadster.metadata))errors.push('roadster-v2: metadata differs from compiled motion');
  const identity=await renderPlazaIdentity(),garden=await renderPlazaGarden(),buildings=await renderPlazaBuildings(),grass=await renderPlazaGrass(),drones=await renderPlazaDrones(),pots=await renderPlazaPots();
  const nativeOutputs:[string,Buffer][]=[['assets/tilesets/original/zodiac-emblems.png',identity.zodiac],['assets/sponsors/varcamp-2026.png',identity.brand],['assets/tilesets/original/plaza-garden.png',garden.png],['assets/tilesets/original/plaza-buildings.png',buildings.png],['assets/tilesets/original/plaza-grass.png',grass.png],['assets/tilesets/original/plaza-pots.png',pots.png],['art/source/plaza-drone-poses.png',drones.posePng],...drones.resources.map(r=>[r.overlay.image,r.png] as [string,Buffer])];
  for(const[path,expected]of nativeOutputs)if(!existsSync(path)||!readFileSync(path).equals(expected))errors.push(`${path}: differs from retained original native export`);
  const descriptors:[string,unknown][]=[['art/source/plaza-generated.json',identity.metadata],['art/source/plaza-garden.json',garden.metadata],['art/source/plaza-buildings.json',buildings.metadata],['art/source/plaza-grass.json',grass.metadata],['art/source/plaza-pots.json',pots.metadata],['art/source/plaza-drones.json',drones.metadata],...drones.resources.map(r=>[r.metadataPath,{version:1,source:drones.metadata.source,overlay:r.overlay,diagnostics:r.diagnostics}] as [string,unknown])];
  for(const[path,expected]of descriptors)if(!existsSync(path)||!isDeepStrictEqual(JSON.parse(readFileSync(path,'utf8')),expected))errors.push(`${path}: differs from original native export receipt`);
  const coastAssets=await renderCoastLifeAssets(),coastLife=await renderCoastLife(),interior=await renderInteriorReferenceMotion();
  const addedOutputs:[string,Buffer][]=[['assets/tilesets/original/coast-life-props.png',coastAssets.atlas],['art/source/coastal-flight-plane.png',coastAssets.plane],...Object.entries(coastAssets.poseStrips).map(([group,png])=>[`art/source/coast-life-${group}-poses.png`,png] as [string,Buffer]),...coastLife.map(r=>[r.overlay.image,r.png] as [string,Buffer]),...interior.artifacts.entries()];
  for(const[path,expected]of addedOutputs)if(!existsSync(path)||!readFileSync(path).equals(expected))errors.push(`${path}: differs from native PNG producer`);
  for(const[path,expected]of [['art/source/coast-life-assets.json',coastAssets.metadata],...coastLife.map(r=>[r.overlay.provenance!.metadataPath,r.metadata])] as [string,unknown][])if(!existsSync(path)||!isDeepStrictEqual(JSON.parse(readFileSync(path,'utf8')),expected))errors.push(`${path}: differs from native coast producer`);
  for(const[path,expected]of interior.layouts){const actual=JSON.parse(readFileSync(path,'utf8'));if(!isDeepStrictEqual(actual.animatedOverlays,expected.animatedOverlays))errors.push(`${path}: differs from native interior motion descriptor`);}
  if(!isDeepStrictEqual(catalog['interior-ref-plant-motion-base'],interior.catalogEntry))errors.push('interior-reference: animated plant base differs from producer');
  return errors;
}
if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const errors=await checkArt();
  if(errors.length) { console.error(errors.join('\n')); process.exitCode=1; }
  else console.log(`Art check passed: ${Object.keys(loadTileCatalog()).length} sprites; bounds, licenses, source hashes, transparent native exports.`);
}
