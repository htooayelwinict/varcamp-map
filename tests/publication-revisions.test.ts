import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const checker = resolve('publication/verify-source.mjs');
const revisionPath = 'publication/revisions/2026-10-16-shared-guides.json';
const navigationRevisionPath = 'publication/revisions/2026-10-17-return-approaches.json';
const beachRevisionPath='publication/revisions/2026-10-17-beach-composition.json';
const closureRevisionPath='publication/revisions/2026-10-17-beach-ci-closure.json';
const propsRevisionPath='publication/revisions/2026-10-17-solid-props.json';
const propsClosurePath='publication/revisions/2026-10-17-solid-props-ci-closure.json';
const captionsPath='publication/revisions/2026-10-18-standing-captions.json';
const captionsClosurePath='publication/revisions/2026-10-18-standing-captions-ci-closure.json';
const constellationPath='publication/revisions/2026-10-18-constellation-coast.json';
const organicPath='publication/revisions/2026-10-18-organic-coast.json';
const campusPath='publication/revisions/2026-10-18-campus-refinement.json';
const combinedPath='publication/revisions/2026-10-18-beach-groves-guide-identity.json';
const currentReleasePath='publication/revisions/2026-10-19-shared-world-service.json';
const verificationReleasePath='publication/revisions/2026-10-19-canonical-verification.json';
const crescentPath='publication/revisions/2026-10-27-plaza-crescent.json';
const vibeCodePath='publication/revisions/2026-10-27-vibecode-branding.json';
const mazeInteriorsPath='publication/revisions/2026-10-30-maze-interiors.json';
const mapPhysicsPath='publication/revisions/2026-10-29-map-physics.json';
const mazeGatesPath='publication/revisions/2026-10-27-maze-gates.json';
const cafeArrivalPath='publication/revisions/2026-10-27-cafe-arrival.json';
const landscapePath='publication/revisions/2026-10-27-plaza-landscape.json';
const buildingsPath='publication/revisions/2026-10-26-hall-buildings.json';
const leoPath='publication/revisions/2026-10-26-leo-lion-head.json';
const fountainPath='publication/revisions/2026-10-26-fountain-motion.json';
const spacingPath='publication/revisions/2026-10-26-expo-spacing.json';
const patrolPath='publication/revisions/2026-10-26-plaza-patrol.json';
const arrivalPath='publication/revisions/2026-10-26-drones-arrival.json';
const physicsValidationPath='publication/revisions/2026-10-26-zodiac-physics-validation.json';
const physicsPath='publication/revisions/2026-10-26-zodiac-physics.json';
const hallValidationPath='publication/revisions/2026-10-25-hall-exteriors-validation.json';
const hallExteriorPath='publication/revisions/2026-10-25-hall-exteriors.json';
const finalPath='publication/revisions/2026-10-25-halls-zodiac-final.json';
const zodiacPath='publication/revisions/2026-10-25-zodiac-exteriors.json';
const hallsPath='publication/revisions/2026-10-25-assembly-halls.json';
const covePath='publication/revisions/2026-10-25-tropical-cove.json';
const speakerPath='publication/revisions/2026-10-25-speaker-presentation.json';
const ariesPath='publication/revisions/2026-10-25-aries-presentation.json';
const retirementPath='publication/revisions/2026-10-24-welcome-plaza-retirement.json';
const catalogSource=readFileSync('src/world/catalog.ts','utf8');
const catalogIds=Object.keys(JSON.parse(catalogSource.match(/export const WORLD_CATALOG\s*=\s*(\{[\s\S]*?\})\s+as const/)![1]));
const currentNative=readFileSync('maps/overworld.tmj','utf8');
const currentLayout=readFileSync('world/layouts/overworld.json','utf8');
const baselineHash = '4b654bd1437066b13498661f3ca14774daf1066d072036beffaf06f0c014250e';
const replacement = 'reviewed replacement\n';
const replacementHash = createHash('sha256').update(replacement).digest('hex');
const originalPaths = Object.keys(JSON.parse(readFileSync('publication/source-manifest.json', 'utf8')).sourceInventory);
const reviewed = () => ({ path: 'src/main.ts', fromSha256: baselineHash, toSha256: replacementHash, reason: 'Authorized fixture replacement' });

describe('publication exact reviewed replacements', () => {
  let root: string;
  let manifest: { maps: number; wams: number; sourceFilesByteExact: number; sourceInventory: Record<string, string>; extensionInventory: Record<string, string> };
  let baselineManifest: typeof manifest;
  const touched=new Map<string,Buffer|undefined>();
  let track=false;
  function remember(path:string){if(track&&!touched.has(path))touched.set(path,existsSync(join(root,path))?readFileSync(join(root,path)):undefined);}
  function remove(path:string){remember(path);rmSync(join(root,path));}
  function write(path: string, content: string) {
    remember(path);
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  function pinRevisions(value: unknown = { schemaVersion: 1, revisions: [] }) {
    const bytes = JSON.stringify(value);
    write(revisionPath, bytes);
    manifest.extensionInventory[revisionPath] = createHash('sha256').update(bytes).digest('hex');
  }
  function pinNavigation(value:unknown={schemaVersion:1,revisions:[]}) {
    const bytes=JSON.stringify(value);write(navigationRevisionPath,bytes);
    manifest.extensionInventory[navigationRevisionPath]=createHash('sha256').update(bytes).digest('hex');
  }
  function pinBeach(value:unknown={schemaVersion:1,revisions:[]}) {
    const bytes=JSON.stringify(value);write(beachRevisionPath,bytes);
    manifest.extensionInventory[beachRevisionPath]=createHash('sha256').update(bytes).digest('hex');
  }
  function pinClosure(value:unknown={schemaVersion:1,revisions:[]}) {
    const bytes=JSON.stringify(value);write(closureRevisionPath,bytes);
    manifest.extensionInventory[closureRevisionPath]=createHash('sha256').update(bytes).digest('hex');
  }
  function pinProps(value:unknown={schemaVersion:1,revisions:[]}) {
    const bytes=JSON.stringify(value);write(propsRevisionPath,bytes);
    manifest.extensionInventory[propsRevisionPath]=createHash('sha256').update(bytes).digest('hex');
  }
  function pinPropsClosure(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(propsClosurePath,bytes);manifest.extensionInventory[propsClosurePath]=createHash('sha256').update(bytes).digest('hex');}
  function pinCaptions(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(captionsPath,bytes);manifest.extensionInventory[captionsPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinCaptionsClosure(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(captionsClosurePath,bytes);manifest.extensionInventory[captionsClosurePath]=createHash('sha256').update(bytes).digest('hex');}
  function pinCombined(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(combinedPath,bytes);manifest.extensionInventory[combinedPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinOrganic(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(organicPath,bytes);manifest.extensionInventory[organicPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinConstellation(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(constellationPath,bytes);manifest.extensionInventory[constellationPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinCampus(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(campusPath,bytes);manifest.extensionInventory[campusPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinCurrentRelease(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(currentReleasePath,bytes);manifest.extensionInventory[currentReleasePath]=createHash('sha256').update(bytes).digest('hex');}
  function pinVerificationRelease(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(verificationReleasePath,bytes);manifest.extensionInventory[verificationReleasePath]=createHash('sha256').update(bytes).digest('hex');}
  function pinCrescent(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(crescentPath,bytes);manifest.extensionInventory[crescentPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinLandscape(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(landscapePath,bytes);manifest.extensionInventory[landscapePath]=createHash('sha256').update(bytes).digest('hex');}
  function pinVibeCode(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(vibeCodePath,bytes);manifest.extensionInventory[vibeCodePath]=createHash('sha256').update(bytes).digest('hex');}
  function pinMazeInteriors(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(mazeInteriorsPath,bytes);manifest.extensionInventory[mazeInteriorsPath]=createHash("sha256").update(bytes).digest("hex");}
  function pinMapPhysics(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(mapPhysicsPath,bytes);manifest.extensionInventory[mapPhysicsPath]=createHash("sha256").update(bytes).digest("hex");}
  function pinMazeGates(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(mazeGatesPath,bytes);manifest.extensionInventory[mazeGatesPath]=createHash("sha256").update(bytes).digest("hex");}
  function pinCafeArrival(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(cafeArrivalPath,bytes);manifest.extensionInventory[cafeArrivalPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinBuildings(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(buildingsPath,bytes);manifest.extensionInventory[buildingsPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinLeo(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(leoPath,bytes);manifest.extensionInventory[leoPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinFountain(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(fountainPath,bytes);manifest.extensionInventory[fountainPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinSpacing(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(spacingPath,bytes);manifest.extensionInventory[spacingPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinPatrol(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(patrolPath,bytes);manifest.extensionInventory[patrolPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinArrival(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(arrivalPath,bytes);manifest.extensionInventory[arrivalPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinPhysicsValidation(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(physicsValidationPath,bytes);manifest.extensionInventory[physicsValidationPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinPhysics(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(physicsPath,bytes);manifest.extensionInventory[physicsPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinHallValidation(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(hallValidationPath,bytes);manifest.extensionInventory[hallValidationPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinHallExteriors(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(hallExteriorPath,bytes);manifest.extensionInventory[hallExteriorPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinFinal(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(finalPath,bytes);manifest.extensionInventory[finalPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinZodiac(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(zodiacPath,bytes);manifest.extensionInventory[zodiacPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinHalls(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(hallsPath,bytes);manifest.extensionInventory[hallsPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinCove(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(covePath,bytes);manifest.extensionInventory[covePath]=createHash('sha256').update(bytes).digest('hex');}
  function pinSpeaker(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(speakerPath,bytes);manifest.extensionInventory[speakerPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinAries(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(ariesPath,bytes);manifest.extensionInventory[ariesPath]=createHash('sha256').update(bytes).digest('hex');}
  function pinRetirement(value:unknown={schemaVersion:1,revisions:[]}) {const bytes=JSON.stringify(value);write(retirementPath,bytes);manifest.extensionInventory[retirementPath]=createHash('sha256').update(bytes).digest('hex');}
  function verify() {
    write('publication/source-manifest.json', JSON.stringify(manifest));
    const result = spawnSync(process.execPath, [checker, root], { encoding: 'utf8' });
    return { status: result.status, output: result.stdout + result.stderr };
  }
  function rejects(message: string) {
    const result = verify();
    expect(result.status).not.toBe(0);
    expect(result.output).toContain(message);
  }
  it('accepts exact sixth document chaining and refuses a wrong prior hash',()=>{pinRevisions({schemaVersion:1,revisions:[reviewed()]});write('src/main.ts',replacement+'sixth');const next={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(replacement+'sixth').digest('hex')};pinPropsClosure({schemaVersion:1,revisions:[next]});expect(verify().status).toBe(0);pinPropsClosure({schemaVersion:1,revisions:[{...next,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts exact seventh caption document and refuses wrong prior',()=>{pinRevisions({schemaVersion:1,revisions:[reviewed()]});write('src/main.ts',replacement+'captions');const next={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(replacement+'captions').digest('hex')};pinCaptions({schemaVersion:1,revisions:[next]});expect(verify().status).toBe(0);pinCaptions({schemaVersion:1,revisions:[{...next,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts exact eighth caption observer document and refuses wrong prior',()=>{pinRevisions({schemaVersion:1,revisions:[reviewed()]});write('src/main.ts',replacement+'observer');const next={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(replacement+'observer').digest('hex')};pinCaptionsClosure({schemaVersion:1,revisions:[next]});expect(verify().status).toBe(0);pinCaptionsClosure({schemaVersion:1,revisions:[{...next,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts the ninth combined release and refuses its wrong prior',()=>{pinRevisions({schemaVersion:1,revisions:[reviewed()]});write('src/main.ts',replacement+'combined');const next={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(replacement+'combined').digest('hex')};pinCombined({schemaVersion:1,revisions:[next]});expect(verify().status).toBe(0);pinCombined({schemaVersion:1,revisions:[{...next,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts the tenth coast release only from its exact prior receipt and rejects drift',()=>{pinRevisions({schemaVersion:1,revisions:[reviewed()]});write('src/main.ts',replacement+'coast');const next={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(replacement+'coast').digest('hex')};pinOrganic({schemaVersion:1,revisions:[next]});expect(verify().status).toBe(0);pinOrganic({schemaVersion:1,revisions:[{...next,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts the eleventh constellation coast release only from its exact predecessor and rejects drift',()=>{pinRevisions({schemaVersion:1,revisions:[reviewed()]});write('src/main.ts',replacement+'constellation');const next={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(replacement+'constellation').digest('hex')};pinConstellation({schemaVersion:1,revisions:[next]});expect(verify().status).toBe(0);pinConstellation({schemaVersion:1,revisions:[{...next,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts the twelfth campus receipt from the exact eleventh effective hash and rejects a wrong prior',()=>{
    pinConstellation({schemaVersion:1,revisions:[reviewed()]});const final=replacement+'campus',next={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(final).digest('hex')};pinCampus({schemaVersion:1,revisions:[next]});write('src/main.ts',final);const result=verify();expect(result.status,result.output).toBe(0);pinCampus({schemaVersion:1,revisions:[{...next,fromSha256:baselineHash}]});rejects('prior');
  });
  it('requires the twelfth receipt to be pinned and present',()=>{delete manifest.extensionInventory[campusPath];rejects('Reviewed revision file must be pinned');pinCampus();remove(campusPath);rejects('Missing extension source: '+campusPath);});
  it.each([null,{schemaVersion:2,revisions:[]},{schemaVersion:1,revisions:[],extra:true},{schemaVersion:1,revisions:[null]}])('enforces the unchanged closed schema for the twelfth receipt %#',value=>{pinCampus(value);rejects('Invalid reviewed revision schema');});
  it('rejects duplicate sources within the twelfth document',()=>{pinCampus({schemaVersion:1,revisions:[reviewed(),reviewed()]});write('src/main.ts',replacement);rejects('Duplicate reviewed revision');});
  it('accepts thirteenth shared-world receipt from exact effective prior and rejects a wrong predecessor',()=>{pinCampus({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'source19';const row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinCurrentRelease({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const result=verify();expect(result.status,result.output).toBe(0);pinCurrentRelease({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('requires thirteenth shared-world receipt pin and physical presence',()=>{delete manifest.extensionInventory[currentReleasePath];rejects('Reviewed revision file must be pinned');pinCurrentRelease();remove(currentReleasePath);rejects('Missing extension source: '+currentReleasePath);});
  it('accepts the fourteenth receipt only from the exact thirteenth predecessor',()=>{pinCurrentRelease({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'verification';const row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinVerificationRelease({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const result=verify();expect(result.status,result.output).toBe(0);pinVerificationRelease({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('requires the fourteenth receipt pin and actual file',()=>{delete manifest.extensionInventory[verificationReleasePath];rejects('Reviewed revision file must be pinned');pinVerificationRelease();remove(verificationReleasePath);rejects('Missing extension source: '+verificationReleasePath);});
  it('accepts final caption anchors only from the exact zodiac predecessor',()=>{pinZodiac({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'final-captions',row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinFinal({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const positive=verify();expect(positive.status,positive.output).toBe(0);pinFinal({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts plaza patrol only from the exact arrival predecessor',()=>{pinArrival({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'plaza-patrol',row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinPatrol({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const positive=verify();expect(positive.status,positive.output).toBe(0);pinPatrol({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('requires the patrol receipt pin and actual file',()=>{delete manifest.extensionInventory[patrolPath];rejects('Reviewed revision file must be pinned');pinPatrol();remove(patrolPath);rejects('Missing extension source: '+patrolPath);});
  it('accepts drones and arrival only from the exact physics-validation predecessor',()=>{pinPhysicsValidation({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'drones-arrival',row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinArrival({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const positive=verify();expect(positive.status,positive.output).toBe(0);pinArrival({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('requires the drones and arrival receipt pin and actual file',()=>{delete manifest.extensionInventory[arrivalPath];rejects('Reviewed revision file must be pinned');pinArrival();remove(arrivalPath);rejects('Missing extension source: '+arrivalPath);});
  it('accepts physics validation only from the exact physics predecessor',()=>{pinPhysics({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'physics-validation',row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinPhysicsValidation({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const positive=verify();expect(positive.status,positive.output).toBe(0);pinPhysicsValidation({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts zodiac physics only from the exact hall-validation predecessor',()=>{pinHallValidation({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'zodiac-physics',row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinPhysics({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const positive=verify();expect(positive.status,positive.output).toBe(0);pinPhysics({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts hall validation only from the exact hall-exterior predecessor',()=>{pinHallExteriors({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'hall-validation',row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinHallValidation({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const positive=verify();expect(positive.status,positive.output).toBe(0);pinHallValidation({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts hall exteriors only from the exact final-caption predecessor',()=>{pinFinal({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'hall-exteriors',row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinHallExteriors({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const positive=verify();expect(positive.status,positive.output).toBe(0);pinHallExteriors({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts zodiac exteriors only from the exact hall predecessor',()=>{pinHalls({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'zodiac',row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinZodiac({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const positive=verify();expect(positive.status,positive.output).toBe(0);pinZodiac({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts the halls only from the exact tropical-cove predecessor',()=>{pinCove({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'halls',row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinHalls({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const positive=verify();expect(positive.status,positive.output).toBe(0);pinHalls({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts the speaker rollout only from its exact Aries predecessor',()=>{pinAries({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'speaker-rollout',row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinSpeaker({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const positive=verify();expect(positive.status,positive.output).toBe(0);pinSpeaker({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts the Aries receipt only from its exact prior and rejects a wrong predecessor',()=>{pinRetirement({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'aries',row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinAries({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const positive=verify();expect(positive.status,positive.output).toBe(0);pinAries({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('accepts the fifteenth welcome-plaza receipt only from the exact fourteenth predecessor',()=>{pinVerificationRelease({schemaVersion:1,revisions:[reviewed()]});const bytes=replacement+'retirement';const row={...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(bytes).digest('hex')};pinRetirement({schemaVersion:1,revisions:[row]});write('src/main.ts',bytes);const result=verify();expect(result.status,result.output).toBe(0);pinRetirement({schemaVersion:1,revisions:[{...row,fromSha256:baselineHash}]});rejects('prior');});
  it('requires the fifteenth receipt pin and actual file',()=>{delete manifest.extensionInventory[retirementPath];rejects('Reviewed revision file must be pinned');pinRetirement();pinAries();pinSpeaker();pinCove();pinHalls();pinZodiac();pinFinal();pinHallExteriors();pinHallValidation();pinPhysics();pinPhysicsValidation();pinArrival();pinPatrol();pinSpacing();pinFountain();pinLeo();pinBuildings();pinCrescent();pinLandscape();pinVibeCode();pinCafeArrival();pinMazeGates();pinMapPhysics();pinMazeInteriors();remove(retirementPath);rejects('Missing extension source: '+retirementPath);});
  beforeAll(() => {
    // One immutable physical baseline; cases mutate and restore only touched files.
    root = mkdtempSync(join(tmpdir(), 'varcamp-revisions-'));
    manifest = {
      maps: catalogIds.length, wams: catalogIds.length, sourceFilesByteExact: 303,
      sourceInventory: Object.fromEntries(originalPaths.map(path => [path, baselineHash])),
      extensionInventory: { 'src/bots/reviewed.ts': baselineHash },
    };
    for (const path of originalPaths) write(path, 'baseline\n');
    write('src/bots/reviewed.ts', 'baseline\n');
    write('src/world/catalog.ts',catalogSource);manifest.sourceInventory['src/world/catalog.ts']=createHash('sha256').update(catalogSource).digest('hex');
    for(const id of catalogIds)for(const ext of ['tmj','wam']){const path=`maps/${id}.${ext}`;if(!Object.hasOwn(manifest.sourceInventory,path)){write(path,'baseline\n');manifest.extensionInventory[path]=baselineHash;}}
    pinRevisions();
    pinNavigation();
    pinBeach();
    pinProps();
    pinClosure();
    pinPropsClosure();
    pinCaptions();
    pinCaptionsClosure();
    pinCombined();
    pinOrganic();
    pinConstellation();
    pinCampus();
    pinCurrentRelease();
    pinVerificationRelease();
    pinRetirement();pinAries();pinSpeaker();pinCove();pinHalls();pinZodiac();pinFinal();pinHallExteriors();pinHallValidation();pinPhysics();pinPhysicsValidation();pinArrival();pinPatrol();pinSpacing();pinFountain();pinLeo();pinBuildings();pinCrescent();pinLandscape();pinVibeCode();pinCafeArrival();pinMazeGates();pinMapPhysics();pinMazeInteriors();
    baselineManifest=structuredClone(manifest);track=true;
  });
  beforeEach(()=>{expect(touched.size).toBe(0);manifest=structuredClone(baselineManifest);});
  afterEach(()=>{
    for(const[path,bytes]of touched){
      if(bytes===undefined)rmSync(join(root,path),{force:true});
      else{mkdirSync(dirname(join(root,path)),{recursive:true});writeFileSync(join(root,path),bytes);}
    }
    touched.clear();
  });
  afterAll(()=>rmSync(root,{recursive:true,force:true}));

  it('accepts an empty pinned revision list with all original bytes unchanged', () => {
    expect(verify().status).toBe(0);
  });

  it('rejects changed baseline bytes without a reviewed record', () => {
    write('src/main.ts', replacement);
    rejects('Frozen source changed: src/main.ts');
  });

  it('accepts only the exact reviewed old-to-new replacement and reports it truthfully', () => {
    pinRevisions({ schemaVersion: 1, revisions: [reviewed()] });
    write('src/main.ts', replacement);
    const result = verify();
    expect(result.status, result.output).toBe(0);
    expect(result.output).toContain('302 unchanged source hashes and 1 exact reviewed replacement');
    expect(result.output).not.toContain('No source files were rewritten');
    expect(manifest.sourceInventory['src/main.ts']).toBe(baselineHash);
  });

  it('rejects an unrelated edit beside an exact reviewed replacement', () => {
    pinRevisions({ schemaVersion: 1, revisions: [reviewed()] });
    write('src/main.ts', replacement);
    write('src/quests/model.ts', replacement);
    rejects('Frozen source changed: src/quests/model.ts');
  });

  it('requires the fixed revision file to be pinned in extensions', () => {
    delete manifest.extensionInventory[revisionPath];
    rejects('Reviewed revision file must be pinned in extensionInventory');
  });

  it('rejects a missing revision file', () => {
    remove(revisionPath);
    rejects(`Missing extension source: ${revisionPath}`);
  });

  it('rejects revision file bytes that disagree with their extension hash', () => {
    write(revisionPath, JSON.stringify({ schemaVersion: 1, revisions: [reviewed()] }));
    rejects(`Extension source changed: ${revisionPath}`);
  });

  it('rejects a missing reviewed source', () => {
    pinRevisions({ schemaVersion: 1, revisions: [reviewed()] });
    remove('src/main.ts');
    rejects('Missing frozen source: src/main.ts');
  });

  it('checks the old digest against the original receipt even when replacement bytes match', () => {
    pinRevisions({ schemaVersion: 1, revisions: [{ ...reviewed(), fromSha256: replacementHash }] });
    write('src/main.ts', replacement);
    rejects('Reviewed revision baseline mismatch: src/main.ts');
  });

  it('rejects replacement bytes that disagree with the approved new digest', () => {
    pinRevisions({ schemaVersion: 1, revisions: [reviewed()] });
    write('src/main.ts', 'unapproved\n');
    rejects('Reviewed source changed: src/main.ts');
  });

  it('rejects an approved replacement when the old bytes remain', () => {
    pinRevisions({ schemaVersion: 1, revisions: [reviewed()] });
    rejects('Reviewed source changed: src/main.ts');
  });

  it('rejects duplicate revisions for the same source', () => {
    pinRevisions({ schemaVersion: 1, revisions: [reviewed(), reviewed()] });
    rejects('Duplicate reviewed revision: src/main.ts');
  });

  it.each(['src/unknown.ts', 'src/*.ts', '../src/main.ts', '/src/main.ts'])(
    'rejects a revision outside the exact original receipt: %s', path => {
      pinRevisions({ schemaVersion: 1, revisions: [{ ...reviewed(), path }] });
      rejects('Reviewed revision path is not an exact original source');
    },
  );

  it('rejects extension overlap with a revised original source', () => {
    pinRevisions({ schemaVersion: 1, revisions: [reviewed()] });
    manifest.extensionInventory['src/main.ts'] = replacementHash;
    write('src/main.ts', replacement);
    rejects('Extension overlaps frozen source: src/main.ts');
  });

  it('rejects a revision of an extension file', () => {
    pinRevisions({ schemaVersion: 1, revisions: [{ ...reviewed(), path: 'src/bots/reviewed.ts' }] });
    rejects('Reviewed revision path is not an exact original source');
  });

  it('still rejects changed extensions beside an exact reviewed replacement', () => {
    pinRevisions({ schemaVersion: 1, revisions: [reviewed()] });
    write('src/main.ts', replacement);
    write('src/bots/reviewed.ts', replacement);
    rejects('Extension source changed: src/bots/reviewed.ts');
  });

  it('still rejects unlisted additions beside an exact reviewed replacement', () => {
    pinRevisions({ schemaVersion: 1, revisions: [reviewed()] });
    write('src/main.ts', replacement);
    write('src/unlisted.ts', replacement);
    rejects('Source inventory has missing or additional files');
  });

  it.each([
    null,
    [],
    { schemaVersion: 2, revisions: [] },
    { schemaVersion: 1, revisions: [], wildcard: true },
    { schemaVersion: 1, revisions: {} },
    { schemaVersion: 1 },
    { schemaVersion: 1, revisions: [null] },
    { schemaVersion: 1, revisions: [{ ...reviewed(), unknown: true }] },
    { schemaVersion: 1, revisions: [{ ...reviewed(), reason: '' }] },
    { schemaVersion: 1, revisions: [{ ...reviewed(), reason: '  ' }] },
    { schemaVersion: 1, revisions: [{ ...reviewed(), reason: 4 }] },
    { schemaVersion: 1, revisions: [{ ...reviewed(), path: 4 }] },
    { schemaVersion: 1, revisions: [{ ...reviewed(), fromSha256: 'wrong' }] },
    { schemaVersion: 1, revisions: [{ ...reviewed(), toSha256: replacementHash.toUpperCase() }] },
    { schemaVersion: 1, revisions: [{ path: 'src/main.ts', fromSha256: baselineHash, toSha256: replacementHash }] },
  ])('rejects malformed or widened revision schema %#', value => {
    pinRevisions(value);
    rejects('Invalid reviewed revision schema');
  });
  it('composes the fixed second document from the exact prior effective receipt',()=>{
    const final='navigation replacement\n',digest=createHash('sha256').update(final).digest('hex');
    pinRevisions({schemaVersion:1,revisions:[reviewed()]});
    pinNavigation({schemaVersion:1,revisions:[{...reviewed(),fromSha256:replacementHash,toSha256:digest}]});
    write('src/main.ts',final);const result=verify();expect(result.status,result.output).toBe(0);
    expect(manifest.sourceInventory['src/main.ts']).toBe(baselineHash);
  });
  it('requires the second fixed document to be explicitly pinned',()=>{
    delete manifest.extensionInventory[navigationRevisionPath];
    rejects('Reviewed revision file must be pinned in extensionInventory');
  });
  it('rejects a wrong prior link even when the first document bytes still match',()=>{
    pinRevisions({schemaVersion:1,revisions:[reviewed()]});write('src/main.ts',replacement);
    pinNavigation({schemaVersion:1,revisions:[{...reviewed(),fromSha256:baselineHash}]});
    rejects('Reviewed revision prior mismatch: src/main.ts');
  });
  it('rejects duplicates within the second document, not legitimate cross-document succession',()=>{
    pinRevisions({schemaVersion:1,revisions:[reviewed()]});write('src/main.ts',replacement);
    const next={...reviewed(),fromSha256:replacementHash};pinNavigation({schemaVersion:1,revisions:[next,next]});
    rejects('Duplicate reviewed revision: src/main.ts');
  });
  it('rejects a missing second-document link to final replacement bytes',()=>{
    pinRevisions({schemaVersion:1,revisions:[reviewed()]});write('src/main.ts','unlinked next release\n');
    rejects('Reviewed source changed: src/main.ts');
  });
  it('rejects a second-document row for an unlisted source',()=>{
    pinNavigation({schemaVersion:1,revisions:[{...reviewed(),path:'src/unlisted.ts'}]});
    rejects('Reviewed revision path is not an exact original source');
  });
  it('rejects a missing second document even when every original byte is unchanged',()=>{
    remove(navigationRevisionPath);rejects(`Missing extension source: ${navigationRevisionPath}`);
  });
  it.each([null,{schemaVersion:2,revisions:[]},{schemaVersion:1,revisions:[],extra:true},{schemaVersion:1,revisions:[null]}])('enforces the unchanged closed schema for the second document %#',value=>{
    pinNavigation(value);rejects('Invalid reviewed revision schema');
  });
  it.each(['scenery','layer-order','collision','metadata','role','placement'])('actual publication CLI rejects %s drift after a positive current artifact baseline',kind=>{
    const rows=[['maps/overworld.tmj',currentNative],['world/layouts/overworld.json',currentLayout]].map(([path,raw])=>({path,fromSha256:baselineHash,toSha256:createHash('sha256').update(raw).digest('hex'),reason:'Exact current navigation artifact fixture'}));
    pinNavigation({schemaVersion:1,revisions:rows});write('maps/overworld.tmj',currentNative);write('world/layouts/overworld.json',currentLayout);
    const positive=verify();expect(positive.status,positive.output).toBe(0); // Establish genuine success BEFORE the mutation.
    const map=JSON.parse(currentNative),layout=JSON.parse(currentLayout);
    if(kind==='scenery'){const l=map.layers.find((l:{name:string})=>l.name==='scenery-belowAvatar-0');l.data[l.data.findIndex(Boolean)]=0;}
    if(kind==='layer-order'){const l=map.layers.find((l:{name:string})=>l.name==='scenery-belowAvatar-2');map.layers=map.layers.filter((x:unknown)=>x!==l);map.layers.push(l);}
    if(kind==='collision'){const l=map.layers.find((l:{name:string})=>l.name==='physical-collisions');l.data[65*128+63]=l.data.find(Boolean);}
    if(kind==='metadata')map.nextobjectid++;
    if(kind==='role')layout.placements.find((p:{id:string})=>p.id==='aries-building').renderRole='canopy';
    if(kind==='placement')layout.placements[0].x++;
    const path=kind==='role'||kind==='placement'?'world/layouts/overworld.json':'maps/overworld.tmj';
    write(path,JSON.stringify(path.endsWith('.tmj')?map:layout)+'\n');rejects('Reviewed source changed: '+path);
  });
  it('composes the fixed third beach document from the exact second receipt',()=>{
    pinRevisions({schemaVersion:1,revisions:[reviewed()]});
    const second='navigation bytes\n',secondHash=createHash('sha256').update(second).digest('hex');
    pinNavigation({schemaVersion:1,revisions:[{...reviewed(),fromSha256:replacementHash,toSha256:secondHash}]});
    const final='beach bytes\n';
    pinBeach({schemaVersion:1,revisions:[{...reviewed(),fromSha256:secondHash,toSha256:createHash('sha256').update(final).digest('hex')}]});
    write('src/main.ts',final);const result=verify();expect(result.status,result.output).toBe(0);
    pinBeach({schemaVersion:1,revisions:[{...reviewed(),fromSha256:replacementHash,toSha256:createHash('sha256').update(final).digest('hex')}]});
    rejects('Reviewed revision prior mismatch: src/main.ts');
  });
  it.each(['maps/fa-ship.tmj','maps/shipyard-beach.tmj','world/layouts/fa-ship.json','world/layouts/shipyard-beach.json'])('actual CLI rejects changed current beach artifact %s after a positive baseline',path=>{
    const raw=readFileSync(path,'utf8');pinBeach({schemaVersion:1,revisions:[{path,fromSha256:baselineHash,toSha256:createHash('sha256').update(raw).digest('hex'),reason:'Exact current beach artifact'}]});
    write(path,raw);const positive=verify();expect(positive.status,positive.output).toBe(0);
    const artifact=JSON.parse(raw);if(path.endsWith('.tmj'))artifact.nextobjectid++;else artifact.placements[0].x++;
    write(path,JSON.stringify(artifact));rejects('Reviewed source changed: '+path);
  });
  it('requires the fourth fixed document to link the exact prior beach receipt',()=>{
    pinBeach({schemaVersion:1,revisions:[reviewed()]});
    const final='canonical producer bytes\n',digest=createHash('sha256').update(final).digest('hex');
    pinClosure({schemaVersion:1,revisions:[{...reviewed(),fromSha256:replacementHash,toSha256:digest}]});
    write('src/main.ts',final);const accepted=verify();expect(accepted.status,accepted.output).toBe(0);
    pinClosure({schemaVersion:1,revisions:[{...reviewed(),fromSha256:baselineHash,toSha256:digest}]});
    rejects('Reviewed revision prior mismatch: src/main.ts');
  });

  it('composes the fixed fifth props document only from the actual prior effective receipt',()=>{
    pinRevisions({schemaVersion:1,revisions:[reviewed()]});
    const fourth='fourth release\n',fourthHash=createHash('sha256').update(fourth).digest('hex');
    pinClosure({schemaVersion:1,revisions:[{...reviewed(),fromSha256:replacementHash,toSha256:fourthHash}]});
    const final='physical props release\n',finalHash=createHash('sha256').update(final).digest('hex');
    pinProps({schemaVersion:1,revisions:[{...reviewed(),fromSha256:fourthHash,toSha256:finalHash}]});
    write('src/main.ts',final);const positive=verify();expect(positive.status,positive.output).toBe(0);
    pinProps({schemaVersion:1,revisions:[{...reviewed(),fromSha256:replacementHash,toSha256:finalHash}]});rejects('Reviewed revision prior mismatch: src/main.ts');
  });
  it.each(['maps/overworld.tmj','maps/constellation-shore.tmj','maps/shipyard-beach.tmj','world/layouts/overworld.json','world/layouts/constellation-shore.json','world/layouts/shipyard-beach.json'])('actual CLI rejects current physical support/scenery mutation %s after a positive baseline',path=>{
    const raw=readFileSync(path,'utf8');pinProps({schemaVersion:1,revisions:[{path,fromSha256:baselineHash,toSha256:createHash('sha256').update(raw).digest('hex'),reason:'Exact reviewed physical prop artifact'}]});
    write(path,raw);const positive=verify();expect(positive.status,positive.output).toBe(0);
    const changed=JSON.parse(raw);if(path.endsWith('.tmj')){const l=changed.layers.find((l:any)=>l.name==='physical-collisions'),i=l.data.findIndex((v:number)=>v!==0);l.data[i]=0;}else changed.standingSigns[0].supports=[];
    write(path,JSON.stringify(changed));rejects('Reviewed source changed: '+path);
  });

});
