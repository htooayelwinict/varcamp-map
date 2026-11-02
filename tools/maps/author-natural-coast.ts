import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {writeNaturalCoastArt,NATURAL_COAST_IDS} from '../art/natural-coast';
import {naturalCoastLayout,renderNaturalCoastMap} from './natural-coast';
import {assertCurrentNativeMap} from './current-native';
import {loadTileCatalog} from '../art/catalog';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const hash=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const c=loadTileCatalog(),assets=[];
for(const key of Object.keys(c))if(key.startsWith('natural-'))delete c[key];
for(const id of NATURAL_COAST_IDS){const art=await writeNaturalCoastArt(id);Object.assign(c,art.catalog);assets.push(art.duneImage,`art/source/natural-${id}.json`);}
writeFileSync('art/tile-catalog.json',JSON.stringify(c,null,2)+'\n');
const sources=read('art/sources.json');sources['natural-coast']={attribution:'VarCamp native terrain compilation from original sand and WorkAdventure exterior pixels. Layout reference: kokoye2007/wa-beach (92a8045). No upstream reference assets copied.',url:'https://github.com/kokoye2007/wa-beach',license:'WorkAdventure-specific assets: permitted only in WorkAdventure maps; original recipe CC0-1.0',licenseFile:'assets/tilesets/natural-coast/'+sources.workadventure.licenseFile.split('/').at(-1),changes:'Organic planted backshore. Original source files retained unchanged.',files:assets.map(path=>({path,sha256:hash(path)}))};
// Coast boundary tiles combine original sand and LPC water; record that share-alike lineage.
for(const id of NATURAL_COAST_IDS){const art=read(`art/source/natural-${id}.json`);const files=sources['lpc-water'].files;for(const path of [art.image]){const row=files.find((f:{path:string})=>f.path===path);if(row)row.sha256=hash(path);else files.push({path,sha256:hash(path)});}}
writeFileSync('art/sources.json',JSON.stringify(sources,null,2)+'\n');
const writes=new Map<string,string>();
for(const id of NATURAL_COAST_IDS){const l=naturalCoastLayout(id),m=renderNaturalCoastMap(l,c);assertCurrentNativeMap(id,m,l,read(`maps/${id}.wam`),c);writes.set(`world/layouts/${id}.json`,JSON.stringify(l,null,2)+'\n');writes.set(`maps/${id}.tmj`,JSON.stringify(m)+'\n');}
for(const[p,v]of writes)writeFileSync(p,v);
console.log('Two continuous natural coasts authored; all entries, exits and saved WAMs retained.');
