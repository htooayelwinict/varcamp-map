import {eventIdentitySuccessorSha,eventIdentityRegistration,eventIdentityRegistrySuccessor} from './helpers/event-identity-history';
import {renderHallBuildings,HALL_BUILDINGS_SOURCE_PATHS} from '../tools/art/hall-buildings';
import {renderLeoLionHead,LEO_LION_SOURCE_PATHS} from '../tools/art/leo-lion-head';
import {renderFountainMotion} from '../tools/art/fountain-motion';
import {preSpacingLayout} from './helpers/expo-spacing-history';
import {renderPlazaPatrol,PATROL_RECIPE} from '../tools/art/plaza-patrol';
import {PATROL_IDS} from '../tools/maps/patrol-roles';
import {patrolSuccessorSha} from './helpers/plaza-patrol-history';
import {renderArrivalRefresh,ARRIVAL_ROADSTER_METADATA} from '../tools/art/arrival-refresh';
import {renderTropicalCove,tropicalCoveMetadata,COVE_IMAGE} from '../tools/art/tropical-cove';
import{cpSync,mkdtempSync,readFileSync,writeFileSync,rmSync,symlinkSync,existsSync,readdirSync}from'node:fs';
import{CAPTION_FAMILIES,captionFamily,captionSpecs,renderCaptionMaster}from'../tools/art/standing-captions';
import{resolve}from'node:path';
import{tmpdir}from'node:os';
import{createHash}from'node:crypto';
import{spawnSync}from'node:child_process';
import{beforeAll,beforeEach,afterEach,afterAll,expect,it}from'vitest';
import sharp from'sharp';
import{checkArt}from'../tools/art/check';
import{checkWorldAmbientArt}from'../tools/art/world-ambient-check';
import{renderRoadster,renderRoadsterV1,ROADSTER_V2_METADATA_PATH}from'../tools/art/roadster';
import{renderCoastalFlight}from'../tools/art/coastal-flight';
import{renderPlazaIdentity}from'../tools/art/plaza-generated';
import{renderPlazaGarden}from'../tools/art/plaza-garden';
import{renderPlazaBuildings,renderPlazaGrass}from'../tools/art/plaza-buildings';
import{renderPlazaPots}from'../tools/art/plaza-pots';
import{renderPlazaDrones}from'../tools/art/plaza-drones';
import{renderPlazaFleet}from'../tools/art/plaza-fleet';
import{renderCoastLifeAssets}from'../tools/art/coast-life-assets';
import{renderCoastLife}from'../tools/art/coast-life';
import{renderInteriorReferenceMotion}from'../tools/art/interior-reference-motion';
import{renderWorldAmbientAssets}from'../tools/art/world-ambient-assets';
import{renderWorldAmbient}from'../tools/art/world-ambient';
import{approvedFleetStaticPins,approvedBirdRecipePins,approvedExpoStaticPins,approvedExpoStaticRows,approvedExpoCaptionRows,approvedExpoRegistryNote,approvedBrandAssetRegistry,approvedRoadsterV2StaticPins,approvedRoadsterV2Rows,approvedRoadsterV2RegistryNote,approvedAriesStyleStaticPins,approvedAriesStyleRows,approvedAriesStyleRegistryNote,assertApprovedLayoutSuccessor}from'./helpers/approved-world-successor';
import{cafeArrivalSuccessorSha}from'./helpers/cafe-arrival-history';
import {approvedZodiacRegistry} from './helpers/zodiac-exterior-history';
import {approvedHallRegistry} from './helpers/hall-exterior-history';
const project=process.cwd(),sha=(v:Buffer|string)=>createHash('sha256').update(v).digest('hex');
const stable=(v:any):any=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=(v:unknown)=>sha(JSON.stringify(stable(v))),read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
let fixture:string;const originals=new Map<string,Buffer>();
beforeAll(()=>{fixture=mkdtempSync(resolve(tmpdir(),'varcamp-ambient-art-check-'));for(const dir of ['art','assets','world','tools','tests/fixtures'])cpSync(resolve(project,dir),resolve(fixture,dir),{recursive:true});symlinkSync(resolve(project,'node_modules'),resolve(fixture,'node_modules'),'dir');});
beforeEach(()=>process.chdir(fixture));
afterEach(()=>{for(const[path,bytes]of originals)writeFileSync(path,bytes);originals.clear();process.chdir(project);});
afterAll(()=>{process.chdir(project);rmSync(fixture,{recursive:true,force:true});});
const remember=(p:string)=>{if(!originals.has(p))originals.set(p,readFileSync(p));};
function refreshRegistry(path:string){remember('art/sources.json');const source=read('art/sources.json'),row=source.original.files.find((r:any)=>r.path===path),value={path,sha256:sha(readFileSync(path))};if(row)Object.assign(row,value);else source.original.files.push(value);writeFileSync('art/sources.json',JSON.stringify(source,null,2)+'\n');}
async function corruptPng(path:string){remember(path);const{data,info}=await sharp(readFileSync(path)).ensureAlpha().raw().toBuffer({resolveWithObject:true});const i=data.findIndex((_,i)=>i%4===3&&data[i]>0)-3;if(i<0)throw Error('Expected actual painted PNG');data[i]=(data[i]+1)%256;writeFileSync(path,await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer());refreshRegistry(path);}
async function expectProducerFailure(path:string){const bytes=readFileSync(path),errors=await checkWorldAmbientArt();expect(errors.some(e=>e.includes('world-ambient:')&&e.includes(path)),errors.join('\n')).toBe(true);expect(readFileSync(path).equals(bytes)).toBe(true);}

it('retains the exact independently reviewed126-path registration epoch and its original70-row oracle',()=>{
 const raw=readFileSync('tests/fixtures/ambient-art-publication/source-registry-before-aerial.json');expect(sha(raw)).toBe('bb557c5266bfd5b082119616918125e206f0514b3fa73a6e8e2d2f18de488d41');const source=JSON.parse(raw.toString()),{original,...other}=source,{files,...originalMetadata}=original;
 expect(digest({other,originalMetadata})).toBe('746cd49c975ddbcaf4fe23df14130dcfc104a955fd7c235d83c0c1aa36944c1a');
 const oldPins:Record<string,string>={'art/source/rolling-breaker-east.json':'9d0e357b78e684827d73633c8c96e3594a75bc9e3817dba15108cff924326bc1','art/source/rolling-breaker-west.json':'7ed945c5006eee8c03bd6dc874afb30c0741e38d6381b7eea629a8465196e4ab','art/source/rolling-breaker.json':'669b168b595c8f89dd686e6f8b851a4df7e26edd77862ec7270066fb1e5c71e6','art/source/ship-interior.json':'835b51dc4aeea4eea269107639064370ef7f24aef27b90ffa8030a1432fd69b5'};
 expect(digest(files.slice(0,70).map((r:any)=>oldPins[r.path]?{...r,sha256:oldPins[r.path]}:r))).toBe('57ad0e57c9aa182d966e3e5215bc9d940d21cc6499d60a2aa84203540ffc40b1');
 const added=files.slice(70);expect(added).toHaveLength(126);expect(new Set(files.map((r:any)=>r.path)).size).toBe(196);expect(added.every((r:any)=>r.path.includes('world-ambient-')||r.path==='art/source/world-ambient.json')).toBe(true);
 expect(added.some((r:any)=>/native-ownership-context|layer-ownership|world-ambient-plants\.json/.test(r.path))).toBe(false);
 expect(added.some((r:any)=>r.path==='assets/tilesets/original/world-ambient-plants.png')).toBe(true);
});
/** Descriptor authority comes from actual pure producer outputs, never a JSON
 * prefix, current source-registry contents or a caller acceptance flag. */
async function generatedDescriptors():Promise<Map<string,{json:unknown}|{bytes:Buffer}|{pixels:Buffer}>>{
 const outputs=new Map<string,{json:unknown}|{bytes:Buffer}|{pixels:Buffer}>();const add=(path:string,value:unknown)=>{if(outputs.has(path))throw Error('Duplicate native descriptor owner: '+path);outputs.set(path,{json:value});};
 const arrival=await renderArrivalRefresh();add(ARRIVAL_ROADSTER_METADATA,arrival.roadster.metadata);
 add('art/source/roadster.json',(await renderRoadsterV1()).metadata);const roadster=await renderRoadster();add(ROADSTER_V2_METADATA_PATH,roadster.metadata);outputs.set(roadster.metadata.overlay.image,{bytes:roadster.png});const flight=await renderCoastalFlight();add('art/source/coastal-flight.json',flight.metadata);outputs.set(flight.metadata.overlay.image,{bytes:flight.png});
 add('art/source/plaza-generated.json',(await renderPlazaIdentity()).metadata);add('art/source/plaza-garden.json',(await renderPlazaGarden()).metadata);
 add('art/source/plaza-buildings.json',(await renderPlazaBuildings()).metadata);add('art/source/plaza-grass.json',(await renderPlazaGrass()).metadata);add('art/source/plaza-pots.json',(await renderPlazaPots()).metadata);
 const drones=await renderPlazaDrones();add('art/source/plaza-drones.json',drones.metadata);for(const r of drones.resources)add(r.metadataPath,{version:1,source:drones.metadata.source,overlay:r.overlay,diagnostics:r.diagnostics});
 const patrol=await renderPlazaPatrol();add('art/source/plaza-patrol.json',patrol.metadata);for(const r of patrol.resources){add(r.metadataPath,r.metadata);outputs.set(r.overlay.image,{bytes:r.png});}
 const fleet=await renderPlazaFleet();add('art/source/plaza-fleet.json',fleet.metadata);for(const r of fleet.aircraft){add(r.metadataPath,r.metadata);outputs.set(r.overlay.image,{bytes:r.png});outputs.set(r.posePath,{bytes:r.posePng});}
 add('art/source/coast-life-assets.json',(await renderCoastLifeAssets()).metadata);for(const r of await renderCoastLife()){add(r.overlay.provenance!.metadataPath,r.metadata);outputs.set(r.overlay.image,{bytes:r.png});}
 const interior=await renderInteriorReferenceMotion();for(const[path,body]of interior.artifacts)if(path.endsWith('.json'))add(path,JSON.parse(body.toString()));
 add('art/source/world-ambient-assets.json',(await renderWorldAmbientAssets()).metadata);for(const r of await renderWorldAmbient()){add(r.overlay.provenance!.metadataPath,r.metadata);outputs.set(r.overlay.image,{bytes:r.png});}
 // Caption family descriptors are rendered by the current caption producer from the linked layouts; the glyph PNGs themselves stay static registry rows.
 for(const family of CAPTION_FAMILIES){const specs=family.id==='shared'?read(family.meta).specs:readdirSync('world/layouts').filter(f=>f.endsWith('.json')).sort().map(f=>read('world/layouts/'+f)).filter(l=>captionFamily(l.id)===family).flatMap(l=>captionSpecs(preSpacingLayout(l)));if(!specs.length)continue;const master=renderCaptionMaster(specs);add(family.meta,{schemaVersion:1,specs,glyphsSha256:sha(readFileSync('art/source/hub-nameplates.json')),producerSha256:sha(readFileSync('tools/art/standing-captions.ts')),svgSha256:sha(master.svg),pngSha256:sha(readFileSync(family.image))});
  // The expo family (overworld booth nameplates) is fully rendered: its SVG master is the producer's bytes and its glyph PNG the producer's pixels.
  if(family.id==='expo'){outputs.set(family.svg,{bytes:Buffer.from(master.svg)});outputs.set(family.image,{pixels:await sharp(Buffer.from(master.svg)).ensureAlpha().raw().toBuffer()});}}
 const halls=await renderHallBuildings();add('art/source/hall-buildings.json',halls.metadata);outputs.set('assets/tilesets/original/hall-buildings.png',{bytes:halls.png});outputs.set('assets/tilesets/original/zodiac-ground-names.png',{bytes:halls.names});
 const lion=await renderLeoLionHead();add('art/source/leo-lion-head.json',lion.metadata);outputs.set(lion.metadata.image.path,{bytes:lion.png});
 const fountain=await renderFountainMotion();for(const r of fountain.resources){add(r.metadataPath,r.metadata);outputs.set(r.overlay.image,{bytes:r.png});}
 const cove=await renderTropicalCove();add('art/source/tropical-cove-coast.json',tropicalCoveMetadata(cove));outputs.set(COVE_IMAGE,{bytes:cove.png});
 return outputs;
}
it('binds every current registry path and preserves static artwork while validating genuine generated descriptors',async()=>{
 const beforeRaw=readFileSync('tests/fixtures/ambient-art-publication/source-registry-before-aerial.json');expect(sha(beforeRaw)).toBe('bb557c5266bfd5b082119616918125e206f0514b3fa73a6e8e2d2f18de488d41');
 const before=JSON.parse(beforeRaw.toString()),current=read('art/sources.json');
 const patrolPaths=[PATROL_RECIPE,'tools/art/plaza-patrol.ts','tools/maps/patrol-roles.ts','art/source/plaza-patrol.json',...PATROL_IDS.flatMap(id=>[`assets/tilesets/original/${id}.png`,`art/source/${id}.json`])];
 const patrolStatic:Record<string,string>={"tools/art/plaza-patrol.ts":"ee6c558de3cfabffbde89ef33d2b1f4a8d8bc7acf70164380ca525f66730e993","tools/maps/patrol-roles.ts":"1a36045b32572b299ecf98ffeafafe20afb21f5c3a624ab256985ac955740212","art/source/plaza-patrol-recipe.json":"5710f418301eec9c17d6ad894f960952b0828e2cb4a474883f8fa37c73616b10"};
 assertApprovedLayoutSuccessor('speaker-aries',read('world/layouts/speaker-aries.json'));
 const fleetPaths=[...Object.keys(approvedFleetStaticPins),'art/source/plaza-fleet.json',...['camera','delivery','survey'].flatMap(type=>[`art/source/plaza-fleet-${type}.json`,`art/source/plaza-fleet-${type}-poses.png`,`assets/tilesets/original/plaza-fleet-${type}.png`])].sort();expect(fleetPaths).toHaveLength(16);
 // The brand epoch added exactly one reviewed registry id after the closed roster (owner-provided, not CC0); its complete record is pinned.
 const arrival=await renderArrivalRefresh(),arrivalRows=['tools/art/arrival-refresh.ts','art/source/arrival-refresh.json',ARRIVAL_ROADSTER_METADATA];
 const additions={...approvedBrandAssetRegistry,'varcamp-organiser':{...approvedBrandAssetRegistry['varcamp-organiser'],files:[...approvedBrandAssetRegistry['varcamp-organiser'].files,{path:'art/source/varcamp-horizontal.svg',sha256:'05f5ea29e8635156bf4ed74f9e39a6067bb2121ac266db514d7918703924250f'},...arrival.logos.map(r=>({path:r.path,sha256:sha(r.png)}))]},'zodiac-exteriors':approvedZodiacRegistry(),'hall-exteriors':approvedHallRegistry(),'varcamp-event-identity':eventIdentityRegistration};
 expect(Object.keys(current)).toEqual([...Object.keys(before),...Object.keys(additions)]);for(const[id,priorRecord]of Object.entries(additions)){const record=eventIdentityRegistrySuccessor(id,priorRecord);expect(current[id],id+' exact reviewed registry').toEqual(record);for(const row of record.files)expect(sha(readFileSync(row.path)),row.path+' actual registered bytes').toBe(row.sha256);expect(existsSync(record.licenseFile)).toBe(true);}
 const hallBuildingStatic:Record<string,string>={"world/hall-buildings.json":"229462e953be8e7501b220616f7c10eb2a7672e413e42312be4589d98b3ee2f8","tools/art/hall-buildings.ts":"f124d57d926f3d8357482b957754f312c5de861e438798840b77d52420fe8f07","tools/maps/hall-buildings-definition.ts":"8ba8606c519803afe7cdb53bcde93d7cf0f9a7fa5f1524de401b3a59899fe9f0","art/source/hall-buildings/prompts.json":"a7beb5a90864e9fe1589681fbec0eef378f7fb551a5c9680fd7a1244601021de","art/source/hall-buildings/solar-generated-master.png":"4a0dbd292889748524637a1047d2c6b85333fc71aca51666f249d89c544b995b","art/source/hall-buildings/lunar-generated-master.png":"a87c8955b53f74a0b3b63f8040396a31e567d9542925e22e2152887a9c72e1f7"};
 const leoStatic:Record<string,string>={"world/leo-lion-head.json":"c87a048eebd33362874ec230f87aaac6d2d0b3571fd67247de25f473868d1762","tools/art/leo-lion-head.ts":"e7c029ecdeec16d7c155e166e907538752728e6836675f6498064c807dcba15c","tools/maps/leo-lion-head-definition.ts":"96cf0d83176d727278157c19962178c9be20f2df50124f1ff55d5e39106406d8","art/source/leo-lion-head/prompt.json":"daf4ed8954884b0df3c53dbe42e45d4fc1d5a0df66aef45e0af2a156ded6f9ae","art/source/leo-lion-head/generated-master.png":"7d0402abcfeb992eeaa5ac7c8d78436e225eb7a4a405fdd561111ef80115fa9f"};
 const fountainStatic:Record<string,string>={'tools/art/fountain-motion.ts':'833c684ac2a048a7cbe0412d2a0f0e92cdb30923f08f8ede71357bae20142af2','tools/maps/fountain-motion-roles.ts':'7f1e390b098d26861f919097a4c0cb5d9698d0bc6b21742403fd9ab67e0b1801'};
 const fountainPaths=[...Object.keys(fountainStatic),...['plaza-fountain-water','plaza-fountain-water-upper'].flatMap(id=>[`assets/tilesets/original/${id}.png`,`art/source/${id}.json`])];
 expect(current.original.files.slice(210,216).map((r:any)=>r.path)).toEqual(fountainPaths);
 expect(current.original.files.slice(216,223).map((r:any)=>r.path)).toEqual(LEO_LION_SOURCE_PATHS);expect(current.original.files.slice(223).map((r:any)=>r.path)).toEqual(HALL_BUILDINGS_SOURCE_PATHS);expect(current.original.files).toHaveLength(232);const expoPaths=[...Object.keys(approvedExpoStaticPins),...Object.keys(approvedExpoCaptionRows),...Object.keys(approvedRoadsterV2Rows),...Object.keys(approvedAriesStyleRows)].sort();expect(expoPaths).toHaveLength(11);
 for(const[path,i]of arrivalRows.map((p,i)=>[p,i]as const))expect(current.original.files[207+i].path).toBe(path);
 const generated=await generatedDescriptors();const arrivalStatic:Record<string,string>={'tools/art/arrival-refresh.ts':'255fc99a65f9100b62e9399ebd6a55ddf5a1dbda7334689077ac07e3e17b1395','art/source/arrival-refresh.json':'de2cf09d014d7ad5317acdc3c95fb3b7aa50b9e3b0cab527de6b19e97ff717c2'};const covePaths=['world/tropical-cove.json','tools/art/tropical-cove.ts','assets/tilesets/original/tropical-cove-coast.png','art/source/tropical-cove-coast.json'];const coveStatic:Record<string,string>={'world/tropical-cove.json':'a72cf832da463bff1f150bec1c545084560d30a54927c60c640f506d807076bc','tools/art/tropical-cove.ts':'f707595c40540800922b90fd4839f4a7fcd696d61323f4cbcfd6e5848f059812'};
 for(const id of Object.keys(before)){
  const{files:oldFiles,...oldMetadata}=before[id],{files:currentFiles,...currentMetadata}=current[id];expect(currentMetadata,id+' complete source metadata').toEqual(eventIdentityRegistrySuccessor(id,id==='original'?{...oldMetadata,changes:oldMetadata.changes+approvedExpoRegistryNote+approvedRoadsterV2RegistryNote+approvedAriesStyleRegistryNote}:id==='lpc-water'?{...oldMetadata,changes:oldMetadata.changes+' Tropical cove is a separately named32px derivative; original water and organic-coast atlases remain byte-exact.'}:oldMetadata));
  if(id==='original'){expect(currentFiles.map((r:any)=>r.path).filter((p:string)=>!expoPaths.includes(p)&&!arrivalRows.includes(p)&&!fountainPaths.includes(p)&&!LEO_LION_SOURCE_PATHS.includes(p)&&!HALL_BUILDINGS_SOURCE_PATHS.includes(p)),id+' closed path roster/order').toEqual(oldFiles.map((r:any)=>r.path));for(const[path,index]of Object.entries({...approvedExpoStaticRows,...approvedExpoCaptionRows,...approvedRoadsterV2Rows,...approvedAriesStyleRows}))expect(currentFiles[index].path,path+' registered forward row position').toBe(path);}
  else expect(currentFiles.map((r:any)=>r.path),id+' closed path roster/order').toEqual([...oldFiles.map((r:any)=>r.path),...(id==='plaza-original-drones'?[...fleetPaths,...patrolPaths]:id==='lpc-water'?covePaths:[])]);
  for(let i=0;i<currentFiles.length;i++){
   const row=currentFiles[i],old=id==='original'?oldFiles.find((r:any)=>r.path===row.path):oldFiles[i],bytes=readFileSync(row.path);expect(Object.keys(row).sort()).toEqual(old?Object.keys(old).sort():['path','sha256']);expect(row.sha256,row.path+' actual registered bytes').toBe(sha(bytes));
   const produced=generated.get(row.path);
   if(produced){if('json'in produced)expect(JSON.parse(bytes.toString()),row.path+' genuine current producer').toEqual(produced.json);else if('pixels'in produced)expect((await sharp(bytes).ensureAlpha().raw().toBuffer()).equals(produced.pixels),row.path+' genuine caption glyph pixels').toBe(true);else expect(bytes.equals(produced.bytes),row.path+' genuine native/pose PNG').toBe(true);}
   else if(Object.hasOwn(hallBuildingStatic,row.path))expect(row.sha256,row.path+' reviewed hall-building source').toBe(eventIdentitySuccessorSha(row.path,hallBuildingStatic[row.path]));
   else if(Object.hasOwn(leoStatic,row.path))expect(row.sha256,row.path+' reviewed Leo ornament source').toBe(leoStatic[row.path]);
   else if(Object.hasOwn(fountainStatic,row.path))expect(row.sha256,row.path+' reviewed fountain source').toBe(fountainStatic[row.path]);
   else if(Object.hasOwn(arrivalStatic,row.path))expect(row.sha256,row.path+' reviewed arrival source').toBe(patrolSuccessorSha(row.path,arrivalStatic[row.path]));
   else if(Object.hasOwn(patrolStatic,row.path))expect(row.sha256,row.path+' reviewed patrol source').toBe(patrolStatic[row.path]);
   else if(Object.hasOwn(coveStatic,row.path))expect(row.sha256,row.path+' reviewed cove source').toBe(coveStatic[row.path]);
   else if(Object.hasOwn(approvedBirdRecipePins,row.path))expect(row.sha256,row.path+' exact independently reviewed bird recipe').toBe(cafeArrivalSuccessorSha(row.path,approvedBirdRecipePins[row.path]));
   else if(Object.hasOwn(approvedFleetStaticPins,row.path))expect(row.sha256,row.path+' exact independently reviewed original fleet input').toBe(approvedFleetStaticPins[row.path]);
   else if(Object.hasOwn(approvedExpoStaticPins,row.path))expect(row.sha256,row.path+' exact independently reviewed expo sticker artwork').toBe(approvedExpoStaticPins[row.path]);
   else if(Object.hasOwn(approvedRoadsterV2StaticPins,row.path))expect(row.sha256,row.path+' exact reviewed roadster-v2 motion authoring').toBe(approvedRoadsterV2StaticPins[row.path]);
   else if(Object.hasOwn(approvedAriesStyleStaticPins,row.path))expect(row.sha256,row.path+' exact reviewed Aries wallpaper source/export').toBe(approvedAriesStyleStaticPins[row.path]);
   else{expect(old,row.path+' no undeclared extension').toBeDefined();expect(row,row.path+' unchanged static/master/source').toEqual({...old,sha256:eventIdentitySuccessorSha(row.path,old.sha256)});}
  }
 }
},30000);
it('normal art check accepts the actual closed ambient publication without repairing any output',async()=>{const before=readFileSync('assets/tilesets/original/world-ambient-plants.png');expect(await checkArt()).toEqual([]);expect(readFileSync('assets/tilesets/original/world-ambient-plants.png').equals(before)).toBe(true);},30000);
it.each(['assets/tilesets/original/world-ambient-plants.png','art/source/world-ambient-lamp-poses.png','assets/tilesets/original/world-ambient-fa-ship-interior-steam-1.png','art/source/world-ambient-fa-ship-interior-steam-1-poses.png','art/source/world-ambient-fa-ship-interior-steam-1-upper-poses.png'])('rejects coherent registry hash refresh over corrupted native/source PNG %s',async path=>{await corruptPng(path);await expectProducerFailure(path);},30000);
it.each(['art/source/world-ambient-assets.json','art/source/world-ambient-fa-ship-interior-steam-1.json'])('rejects complete metadata drift despite matching registry hash %s',async path=>{remember(path);const data=read(path);data.unregisteredMetadata='not the producer';writeFileSync(path,JSON.stringify(data,null,2)+'\n');refreshRegistry(path);await expectProducerFailure(path);},30000);
it('rejects a removed logical recipe instead of validating only remaining output',async()=>{const path='art/source/world-ambient.json';remember(path);const data=read(path);data.maps[0].effects=[];writeFileSync(path,JSON.stringify(data,null,2)+'\n');refreshRegistry(path);const errors=await checkWorldAmbientArt();expect(errors.some(e=>/world-ambient:.*closed/.test(e)),errors.join('\n')).toBe(true);},30000);
it('rejects a missing approved master instead of making ambient checks optional',async()=>{const path='art/source/world-ambient-fx-master.png';remember(path);rmSync(path);const errors=await checkWorldAmbientArt();expect(errors.some(e=>e.includes('world-ambient:')&&e.includes(path)),errors.join('\n')).toBe(true);expect(existsSync(path)).toBe(false);},30000);
it('rejects a missing publication registry row even while every produced byte remains correct',async()=>{remember('art/sources.json');const source=read('art/sources.json'),path='assets/tilesets/original/world-ambient-fa-ship-interior-steam-1.png';source.original.files=source.original.files.filter((r:any)=>r.path!==path);writeFileSync('art/sources.json',JSON.stringify(source,null,2)+'\n');const errors=await checkWorldAmbientArt();expect(errors.some(e=>e.includes('world-ambient:')&&e.includes(path)&&e.includes('registration')),errors.join('\n')).toBe(true);},30000);
it('actual normal CLI rejects omitted layout overlays without modifying the descriptor',()=>{const path='world/layouts/moon-cafe.json';remember(path);const layout=read(path);layout.animatedOverlays=layout.animatedOverlays.filter((o:any)=>!o.name.startsWith('world-ambient-'));writeFileSync(path,JSON.stringify(layout,null,2)+'\n');const before=readFileSync(path);const result=spawnSync(process.execPath,['--import','tsx',resolve(project,'tools/art/check.ts')],{cwd:fixture,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});expect(result.status).not.toBe(0);expect(result.stderr).toContain(`world-ambient: ${path}`);expect(readFileSync(path).equals(before)).toBe(true);},30000);
