/** Stage genuine current14 domain inputs for complete-package entry tests.
 * Other map/art families are not asserted by this domain fixture. */
import{cpSync,mkdirSync,readFileSync,statSync}from'node:fs';
import{dirname,resolve,relative}from'node:path';
import{SIGN_IDS}from'../../src/world/catalog';
export function stageCurrentInteriorInputs(project:string,target:string):void{
 const copy=(relative:string)=>{mkdirSync(dirname(resolve(target,relative)),{recursive:true});cpSync(resolve(project,relative),resolve(target,relative));};
 copy('art/tile-catalog.json');copy('art/sources.json');copy('art/sponsors.json');copy('world/interior-reference-contract.json');copy('world/editor-collections.json');
 for(const id of [...SIGN_IDS.map(s=>`speaker-${s}`),'solar-hall','lunar-hall']){
  for(const file of [`maps/${id}.tmj`,`maps/${id}.wam`,`world/layouts/${id}.json`])copy(file);
  const map=JSON.parse(readFileSync(resolve(project,`maps/${id}.tmj`),'utf8')),layout=JSON.parse(readFileSync(resolve(project,`world/layouts/${id}.json`),'utf8'));
  for(const set of map.tilesets)copy(relative(project,resolve(project,'maps',set.image)));
  for(const overlay of layout.animatedOverlays??[]){copy(overlay.provenance.metadataPath);for(const input of overlay.provenance.inputs)copy(input.path);}
 }
 const sources=JSON.parse(readFileSync(resolve(project,'art/sources.json'),'utf8'));
 for(const id of Object.keys(sources)){const directory=id==='ocean-audio'?'assets/audio':`assets/tilesets/${id}`;cpSync(resolve(project,directory),resolve(target,directory),{recursive:true,filter:p=>statSync(p).isDirectory()||!(/\.(png|mp3)$/).test(p)});}
}
/** Genuine complete source input tree for invoking the unmodified normal builder.
 * Source files are copied; preview writes stay in the private fixture. */
export function stageCurrentWorldInputs(project:string,target:string):void{
 for(const directory of ['maps','world','assets','art','tools','src'])cpSync(resolve(project,directory),resolve(target,directory),{recursive:true,filter:p=>!p.includes('/maps/preview')&&!p.includes('/art/source/wokas')});
 for(const version of ['v1','v2','v3'])cpSync(resolve(project,`public/wokas/varcamp-zodiac-${version}`),resolve(target,`public/wokas/varcamp-zodiac-${version}`),{recursive:true});
 mkdirSync(resolve(target,'art/source/wokas-readable-v2'),{recursive:true});cpSync(resolve(project,'art/source/wokas-readable-v2/native-design.json'),resolve(target,'art/source/wokas-readable-v2/native-design.json'));
 mkdirSync(resolve(target,'art/source/wokas-pixel-v3'),{recursive:true});cpSync(resolve(project,'art/source/wokas-pixel-v3/native-design.json'),resolve(target,'art/source/wokas-pixel-v3/native-design.json'));
}
/** Complete pure-art producer inputs; no generated artifact is written here. */
export function stageCurrentArtInputs(project:string,target:string):void{
 for(const directory of ['art','assets','world','tools','tests/fixtures/interior-reference'])cpSync(resolve(project,directory),resolve(target,directory),{recursive:true});
}
