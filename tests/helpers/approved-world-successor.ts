import {advanceMazeInteriorLayout} from './maze-interiors-history';
import {advanceMazeGateLayout} from './maze-gate-history';
import {applyVibeCodeBranding,VIBECODE_MAP_IDS} from '../../tools/maps/vibecode-branding';
import {vibeCodeSuccessorSha} from './vibecode-history';
import {advanceCafeArrivalLayout} from './cafe-arrival-history';
/** Test-only finite forward epoch. Genuine historical bytes are never inferred
 * from current receipts, stripped current objects or a producer's own output. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {WORLD_CATALOG} from '../../src/world/catalog';
import type {MapLayout,TiledMap} from '../../tools/maps/types';
import {applyAriesPresentation} from '../../tools/maps/aries-presentation';
import {arrivalSuccessorSha} from './arrival-refresh-history';
import {advanceArrivalProvenance} from '../../tools/maps/arrival-refresh';
import {applyHallPresentation} from '../../tools/maps/hall-presentation';

const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
/** Pins from the separately reviewed original18-file fleet source epoch. The
 * ten generated exports are verified by their pure producer instead. */
export const approvedFleetStaticPins:Record<string,string>={
 'art/source/plaza-fleet-original/NOTICE.txt':'48d58c59629c4b2e82ba91d085c1c91dfdecd47031af9a17212799090b2c407f',
 'art/source/plaza-fleet-original/camera-generated-master.png':'b5a8e018bac965c4cf142cf643696e95d39ac1b1938d211a2f0f9aa63edf1820',
 'art/source/plaza-fleet-original/delivery-generated-master.png':'2927e60ebbe6afd41c7f903d2811b42614360050f721ef48fde5df79a7bc261b',
 'art/source/plaza-fleet-original/prompts.json':'01508859019a2669ffce68048e00257018d1933a7934a84817ffa504523a0b26',
 'art/source/plaza-fleet-original/survey-generated-master.png':'ed9734eb1de8b895676a49e08131e9fb48b5db453f7305efc8bc3983c9e38908',
 // Drone-depth epoch (2026-10-26): the only recipe change is the three lanes' level, belowAvatar -> aboveScenery.
 'art/source/plaza-fleet-recipe.json':'56ccb60d6a7d40ad99954ce4c6c90972fbcfad87482427238fa8c713536bd793',
};
/** Pins from the reviewed expo epoch: the static booth sticker sheet and its master, the
 * only rows the expo added to the closed `original` source registry so far. */
export const approvedExpoStaticPins:Record<string,string>={
 'art/source/booth-stickers.svg':'839720ee00ad4c94b1358698d89f59ddd867065a55031004c3d7c874908c9c72',
 'assets/tilesets/original/booth-stickers.png':'b319354b5e5b8dbd1b549fa98af6d77280361fff907aee5dc03d4b0c84535241',
};
/** Where those two rows sit inside the otherwise unchanged `original` registry order. */
export const approvedExpoStaticRows:Record<string,number>={'art/source/booth-stickers.svg':0,'assets/tilesets/original/booth-stickers.png':46};
/** The expo caption family (hall epoch): descriptor, SVG master and glyph PNG rendered by the
 * caption producer from the twelve linked overworld booth nameplates, registered in path order. */
export const approvedExpoCaptionRows:Record<string,number>={'art/source/expo-captions.json':28,'art/source/expo-captions.svg':29,'assets/tilesets/original/expo-captions.png':62};
/** The one sentence the expo epoch appended to the `original` registry's change log. */
export const approvedExpoRegistryNote=' Expo-plaza addition: six original 32px booth sticker badges (star, heart, bolt, pin, smile, leaf) in the cream/teal/peach/lavender/amber palette with a thin cream outline, authored on the integer grid in booth-stickers.svg and exported natively to booth-stickers.png; no imported pixels copied.';
/** The brand epoch (owner-provided 2026 assets): the one registry id added beside the closed `original`
 * registry, with its complete reviewed metadata and the two native exports it owns. The masters stay
 * with the organiser; the credit files live in assets/tilesets/varcamp-organiser. */
export const approvedBrandAssetRegistry={
 'varcamp-organiser':{
  attribution:'Ornate azure fountain and lamp post pixel illustrations supplied by the VarCamp Myanmar 2026 organiser (varcamp2026_assets drop, 2026-10-22); native 32px exports by the VarCamp map team',
  url:'https://var.camp/',
  license:'Supplied by the VarCamp organiser for the 2026 event; event-use permission, all rights retained by the owner; not CC0',
  licenseFile:'assets/tilesets/varcamp-organiser/LICENSE.txt',
  changes:'Alpha-bounding-box crop and aspect-preserving Lanczos3 downscale of the supplied masters to the native tile footprint (fountain 128x96 / 4x3 tiles, lamp 32x96 / 1x3 tiles), centred on the transparent grid, alpha thresholded to binary. Master hashes are recorded in ATTRIBUTION.md; the masters are not redistributed. No other registry row changed.',
  files:[
   {path:'assets/tilesets/original/plaza-fountain.png',sha256:'cec850cca9c6f9e1e2c523314105dc201500d8009db29e15022e8fc382d97af4'},
   {path:'assets/tilesets/original/plaza-lamp.png',sha256:'6ef8f70c29743dc6eddf4387f8be88d34505908b353ebdbb52fda9975405fd44'},
  ],
 },
};
/** The roadster-v2 epoch: the motion authoring spec is a static reviewed input; the v2 descriptor and
 * atlas are verified by their pure producer (tools/art/roadster.ts). Appended after every earlier row so
 * no registered row position moves. */
export const approvedRoadsterV2StaticPins:Record<string,string>={
 'art/source/roadster-v2-authoring.json':'1ce94db442ebdc102efd7bd10c448fa5a91d4e991c9c819b6cd7cebd363bb4f3',
};
export const approvedRoadsterV2Rows:Record<string,number>={'art/source/roadster-v2-authoring.json':201,'art/source/roadster-v2.json':202,'assets/tilesets/original/roadster-v2.png':203};
/** The one sentence the roadster-v2 epoch appended to the `original` registry's change log. */
export const approvedRoadsterV2RegistryNote=' Roadster-v2 addition: the plaza display is recompiled from the same sixteen generated poses with compiler-synthesised 100 ms tweens, hover bob, landing settle, thruster bloom, pad shadow/light chases, dust puffs, light pulses and roll ghosting into roadster-v2.png; the v1 atlas stays frozen as the registered reservation body and no new car pixels were drawn.';
/** Three geometric wallpaper records and the one motion-producer control update for Aries. */
export const approvedAriesStyleStaticPins:Record<string,string>={
 'art/source/speaker-room-style.svg':'552235adcbae421da41edbed7488a12e3ea58d52023b48e4841eb51b482289fa',
 'art/source/speaker-room-style.json':'dbf49a9a5e3aa33a113986c324668e80184eb343c92a811820abeebcae364a37',
 'assets/tilesets/original/speaker-room-style.png':'b7dab480865258feb6d296febc4fbf70daabe4a56dd3f07f348bbce637189a9e',
 'tools/art/interior-reference-motion.ts':'7e3a076865d3e52177585f6eac406b508e7f98d595104bb0ce4a04e76a83c4ec',
};
export const approvedAriesStyleRows:Record<string,number>={'art/source/speaker-room-style.svg':204,'art/source/speaker-room-style.json':205,'assets/tilesets/original/speaker-room-style.png':206};
export const approvedAriesStyleRegistryNote=' Aries owner-review addition: seven original geometric 32px charcoal wallpaper, orange trim and cream logo-plate tiles; SVG master and native PNG preserved in speaker-room-style records. Existing logo pixels remain separate and unchanged.';
export const approvedBirdRecipePins:Record<string,string>={
 'art/source/coast-life-tracks.json':'bd0dbb1202ccd1e84a89f0e796ab839371f102ebec1de4cb67053c84a190e7f6',
 'art/source/world-ambient.json':'a890d78049e5f891358e11a3e8270ede2c2fb97ce5d3bd339686e3924a8ce8b7',
};
const changes:Record<string,readonly[string,string]>={
 'art/source/world-ambient.json':['c4c7651c3b7e31d7e5762ee0ede695209080ee9d76ed8f9ce27a44d404a596ad','a890d78049e5f891358e11a3e8270ede2c2fb97ce5d3bd339686e3924a8ce8b7'],
 'tools/art/world-ambient.ts':['0d1e1c1e2b9625c48e48a975ceea79375f2b58b6ddf77169d693ffecfe03efd1','46cbb04d3e4e016e72e8fea91f5c21bb67f13f219d4992996c3153a2735a6bac'],
 'tools/maps/animated-decoration-contract.json':['0be7d46784d2038890168d22e4dbf0c84d745d100e367a2f99fc592aa39ed189','ad2cdc7b80dd2d60e4b4fc17597056d950f67952557e6615e245bfff7dfb6f0f'],
 'tools/maps/animated-decoration.ts':['b775031225c80a635de80d0e99a3791938e1d809998a9d880abc7e00e52b78cf','803ec55098732becbdf5fbf315097a57363af5eaa77758fe6e9ba68c2ae259b5'],
 'tools/maps/native-projection.ts':['ddd3886d4549044efb7e82455c283e12e26089859b4a8aa05c9a222798c27554','8bda8df3ffbeec8d958d12ef0f5f91d818bdb8853decc5fddd1ab333b0ac38c0'],
 'tools/maps/native-ownership-context.ts':['3ded4e618c1e53e73a0afc3813bceae75a71460af6b3e06cd2b6ed3aa7571e50','ee34e0f903bd0a3e546d57d1163a5e15226315c6ff4ff82286123c7a4971dbe4'],
 'tools/art/native-motion.ts':['8746ae341a730748115a051a7b8b6750689f9afac6bd5b59f4900aa2e730b9a6','4e6f0d41813fefc8a40dd5bf211866e5cd51eed882182bd97b93b220e13acf1a'],
 'tools/maps/builder.ts':['f7b58d120c5d97f63a3800bdd1d6c4aa1203402ef7d309da29b6d9c743197a50','d5825e67c9a3ab86dd1b9c3f922e6f8fb126e652ee9ff149e8d2ead8d249ce3d'],
 'tools/maps/types.ts':['cf573467e8a0e086e6c96210881bd568da6e6dc048763ae8cd6e647d11974767','fbc36024fcd05330f1e7e7593158e877585a55447be4cfcb964202cbd47a58ff'],
 'tools/art/interior-reference-motion.ts':['ebd941d548a992237d197763ed3ce569f8de8d9aaa63777aa8a52bb82b9a79bc','7e3a076865d3e52177585f6eac406b508e7f98d595104bb0ce4a04e76a83c4ec'],
};
// The cove and zodiac exteriors append named atlas families without changing any older reservation.
const exteriorContext='e2aa6ada9d1b8242682dc5680d62f3e8c4684287530ac0514e5e3556eaf74c53';
const hallContext='fe81107c36662bc6f4d77590f481618bb69db0e8771fc77d31a1ed3a83ac62ea';
const coveChanges:Record<string,readonly[string,string]>={'tools/maps/native-ownership-context.ts':['ee34e0f903bd0a3e546d57d1163a5e15226315c6ff4ff82286123c7a4971dbe4','e740a0984f2ebb75115abd1ec0a4666d886abd0840d36cdccf615b87f0cc2be7']};
export const approvedUnchangedLayoutIds=Object.keys(WORLD_CATALOG).filter(id=>!['overworld','shipyard-beach','constellation-shore','fa-ship'].includes(id)).sort();
interface Component {path:string;bytes:number;sha256:string;raw:string}
function components():Map<string,Component>{
 const raw=readFileSync('tests/fixtures/approved-world-successor/before.json.gz');
 assert.equal(sha(raw),'70663c032ff1977885948e0e2e0eaf6f7f482cd8c0cb64a91cf44e5d20895407','Genuine pre-fleet fixture changed');
 const value=JSON.parse(gunzipSync(raw,{maxOutputLength:6*1024*1024}).toString());
 assert.equal(value.version,1);assert.equal(value.sourceInventorySha256,'d274c3e25dab2e5123a382db796b4a88980485aa6ee845a3d55baf83a8fc7080');
 assert.equal(approvedUnchangedLayoutIds.length,30);
 assert.deepEqual(value.components.map((r:Component)=>r.path),[...approvedUnchangedLayoutIds.map(id=>`world/layouts/${id}.json`),'maps/overworld.tmj','maps/overworld.wam']);
 const result=new Map<string,Component>();for(const c of value.components){assert.deepEqual(Object.keys(c).sort(),['bytes','path','raw','sha256']);assert.equal(Buffer.byteLength(c.raw),c.bytes);assert.equal(sha(c.raw),c.sha256);result.set(c.path,c);}
 assert.equal(result.size,32);return result;
}
export function approvedHistoricalRaw(path:string):Buffer{
 const c=components().get(path);assert.ok(c,'Unregistered historical component '+path);return Buffer.from(c.raw);
}
export function approvedHistoricalLayout(id:string):MapLayout{return JSON.parse(approvedHistoricalRaw(`world/layouts/${id}.json`).toString());}
export function approvedHistoricalPlaza():TiledMap{return JSON.parse(approvedHistoricalRaw('maps/overworld.tmj').toString());}
/** No field removal: only nine reviewed input SHA transitions, from exact old
 * values to independently reviewed current producer bytes, preserve every key.
 * The expo epoch advanced three of them (builder footprints, image type note,
 * expo reservation family); every other row is the fleet epoch value. */
export function advanceReviewedProvenance(layout:MapLayout):MapLayout{
 for(const[path,[,after]]of Object.entries(changes))assert.equal(sha(readFileSync(path)),arrivalSuccessorSha(path,path==='tools/maps/native-ownership-context.ts'?hallContext:coveChanges[path]?.[1]??after),'Reviewed producer epoch changed '+path);
 const result=structuredClone(layout);
 for(const overlay of result.animatedOverlays??[])for(const input of overlay.provenance?.inputs??[]){const pair=changes[input.path];if(pair){assert.equal(input.sha256,pair[0],'Unreviewed old provenance '+input.path);input.sha256=pair[1];const cove=coveChanges[input.path];if(cove){assert.equal(input.sha256,cove[0],'Unreviewed pre-cove provenance '+input.path);input.sha256=cove[1];if(input.path==='tools/maps/native-ownership-context.ts'){assert.equal(input.sha256,coveChanges[input.path][1]);input.sha256=exteriorContext;assert.equal(input.sha256,'e2aa6ada9d1b8242682dc5680d62f3e8c4684287530ac0514e5e3556eaf74c53');input.sha256=hallContext;}}}}
 const next=advanceArrivalProvenance(result);for(const o of next.animatedOverlays??[])for(const input of o.provenance?.inputs??[])input.sha256=vibeCodeSuccessorSha(input.path,input.sha256);return next;
}
export function assertApprovedLayoutSuccessor(id:string,current:MapLayout):void{
 const baseline=advanceReviewedProvenance(approvedHistoricalLayout(id));
 const speaker=applyAriesPresentation(baseline),next=['solar-hall','lunar-hall'].includes(id)?applyHallPresentation(speaker):speaker;
 assert.deepEqual(current,advanceMazeInteriorLayout(advanceMazeGateLayout(advanceCafeArrivalLayout(VIBECODE_MAP_IDS.includes(id)?applyVibeCodeBranding(next):next))),'Only finite reviewed producer/presentation successors may advance '+id);
}
