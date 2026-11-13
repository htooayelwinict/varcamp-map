import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildMap } from './builder';
import {withOrganizerMeetings} from './organizer-meetings';
import {withAriesSharedChat} from './aries-shared-chat';
import { loadTileCatalog } from '../art/catalog';
import { validateMap, validateWam } from './validate';
import { WORLD_CATALOG } from '../../src/world/catalog';
import type { MapLayout } from './types';

const initialize=process.argv.includes('--initialize');
const manifestPath='.qa/authored-map-hashes.json';
const hash=(bytes:string)=>createHash('sha256').update(bytes).digest('hex');
const prior:Record<string,string>=existsSync(manifestPath)?JSON.parse(await readFile(manifestPath,'utf8')):{};
const layouts=await Promise.all((await readdir('world/layouts')).filter(f=>f.endsWith('.json')).sort().map(async f=>JSON.parse(await readFile(`world/layouts/${f}`,'utf8')) as MapLayout));
const outputs:Record<string,string>={};
for(const layout of layouts){
 const{tmj,wam:baseWam}=buildMap(layout,loadTileCatalog()),wam=withAriesSharedChat(layout.id,withOrganizerMeetings(layout.id,baseWam)),issues=[...validateMap(tmj,WORLD_CATALOG),...validateWam(wam)];
 if(issues.length)throw Error(`${layout.id}: ${JSON.stringify(issues)}`);
 outputs[`maps/${layout.id}.tmj`]=JSON.stringify(tmj)+'\n';outputs[`maps/${layout.id}.wam`]=JSON.stringify(wam,null,2)+'\n';
}
// Preflight the whole batch before writing any source file.
if(!initialize)for(const path of Object.keys(outputs))if(existsSync(path)&&(!prior[path]||hash(await readFile(path,'utf8'))!==prior[path]))throw Error(`Native Tiled/WAM edit would be overwritten: ${path}. Keep native edits, or reconcile them before an explicit --initialize author export.`);
await mkdir('maps',{recursive:true});await mkdir('.qa',{recursive:true});
for(const[path,bytes]of Object.entries(outputs))await writeFile(path,bytes);
await writeFile(manifestPath,JSON.stringify(Object.fromEntries(Object.entries(outputs).map(([p,b])=>[p,hash(b)])),null,2)+'\n');
console.log(`Authored ${layouts.length} native TMJ/WAM pairs${initialize?' (explicit source redraw)':''}. Normal maps:build preserves later Tiled edits.`);
