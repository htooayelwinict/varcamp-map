import {cpSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,rmSync,unlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {afterEach,beforeEach,expect,it} from 'vitest';
import {WORLD_CATALOG} from '../src/world/catalog';
import {worldRelease} from '../tools/release';
import {renderReferenceInterior} from '../tools/maps/reference-interiors';
import {loadTileCatalog} from '../tools/art/catalog';
import {stageCurrentWorldInputs} from './helpers/current-interior-fixture';
const project=process.cwd();let fixture:string;
beforeEach(()=>{
 fixture=mkdtempSync(resolve(tmpdir(),'varcamp-direct-release-roster-'));
 for(const p of ['maps','world/layouts','art','docs/dependencies','public/wokas'])mkdirSync(resolve(fixture,p),{recursive:true});
 for(const version of ['v1','v2','v3'])cpSync(resolve(project,`public/wokas/varcamp-zodiac-${version}`),resolve(fixture,`public/wokas/varcamp-zodiac-${version}`),{recursive:true});
 writeFileSync(resolve(fixture,'art/sources.json'),'{}');writeFileSync(resolve(fixture,'art/sponsors.json'),'{}');writeFileSync(resolve(fixture,'docs/dependencies/LICENSE.starter'),'MIT controlled release fixture');
 for(const [id,definition] of Object.entries(WORLD_CATALOG)){
  const map={type:'map',version:'1.10',orientation:'orthogonal',renderorder:'right-down',infinite:false,width:definition.width,height:definition.height,tilewidth:32,tileheight:32,properties:[{name:'worldMapId',type:'string',value:id},{name:'script',type:'string',value:'../src/main.ts'}],layers:[],tilesets:[]};
  const layout={id,width:definition.width,height:definition.height,placements:[],entries:[],exits:[],areas:[],inspectionZones:[]};
  writeFileSync(resolve(fixture,`maps/${id}.tmj`),JSON.stringify(map));writeFileSync(resolve(fixture,`maps/${id}.wam`),JSON.stringify({version:'2.1.0',mapUrl:`${id}.tmj`,entities:{},areas:[],entityCollections:[]}));writeFileSync(resolve(fixture,`world/layouts/${id}.json`),JSON.stringify(layout));
 }
 stageCurrentWorldInputs(project,fixture);
 mkdirSync(resolve(fixture,'art/source/wokas-readable-v2'),{recursive:true});cpSync(resolve(project,'art/source/wokas-readable-v2/native-design.json'),resolve(fixture,'art/source/wokas-readable-v2/native-design.json'));
 mkdirSync(resolve(fixture,'art/source/wokas-pixel-v3'),{recursive:true});cpSync(resolve(project,'art/source/wokas-pixel-v3/native-design.json'),resolve(fixture,'art/source/wokas-pixel-v3/native-design.json'));
 process.chdir(fixture);
});
afterEach(()=>{process.chdir(project);rmSync(fixture,{recursive:true,force:true});});
async function directRelease(){
 const rows:{fileName:string;source:string|Buffer}[]=[];const plugin=worldRelease();const hook=plugin.generateBundle;if(typeof hook!=='function')throw Error('Expected actual direct release hook');
 let error:unknown;try{await hook.call({emitFile:(row:{fileName:string;source:string|Buffer})=>{rows.push(row);return String(rows.length);}}as never,{}as never, {'runtime':{type:'chunk',isEntry:true,name:'src-main',fileName:'assets/src-main-fixture.js'}}as never,false);}catch(cause){error=cause;}
 return{rows,error};
}
it('direct release emits exactly the declared34 native pairs and preserves every source WAM body',async()=>{
 expect(Object.keys(WORLD_CATALOG)).toHaveLength(34);const before=readFileSync('maps/overworld.wam');const {rows,error}=await directRelease();expect(error).toBeUndefined();expect(rows.filter(r=>/\.(tmj|wam)$/.test(r.fileName)).map(r=>r.fileName).sort()).toEqual(Object.keys(WORLD_CATALOG).flatMap(id=>[`maps/${id}.tmj`,`maps/${id}.wam`]).sort());expect(readFileSync('maps/overworld.wam')).toEqual(before);
});
it('direct release rejects an unknown extra source pair before emitting any artifact',async()=>{
 writeFileSync('maps/unreviewed.tmj','{}');writeFileSync('maps/unreviewed.wam','{}');const {rows,error}=await directRelease();expect(error).toBeInstanceOf(Error);expect(rows).toEqual([]);expect(String(error)).toMatch(/roster/);
});
it('direct release rejects a missing later WAM before emitting any earlier map',async()=>{
 unlinkSync('maps/overworld.wam');const {rows,error}=await directRelease();expect(error).toBeInstanceOf(Error);expect(rows).toEqual([]);expect(String(error)).toMatch(/roster/);
});
it('direct release rejects an invalid later source WAM identity before emitting any earlier map',async()=>{
 const wam=JSON.parse(readFileSync('maps/overworld.wam','utf8'));wam.mapUrl='overworld.tmj?v=stale';writeFileSync('maps/overworld.wam',JSON.stringify(wam));const {rows,error}=await directRelease();expect(error).toBeInstanceOf(Error);expect(rows).toEqual([]);expect(String(error)).toMatch(/WAM/);
});
it('direct release includes all81 exact v1, v2 and v3 portable bodies despite publicDir:false',async()=>{
 const {rows,error}=await directRelease();expect(error).toBeUndefined();const assets=rows.filter(row=>row.fileName.startsWith('wokas/varcamp-zodiac-'));expect(assets).toHaveLength(81);
 expect(assets.map(row=>row.fileName).sort()).toEqual(['v1','v2','v3'].flatMap(version=>readdirSync(`public/wokas/varcamp-zodiac-${version}`).map(name=>`wokas/varcamp-zodiac-${version}/${name}`)).sort());
 for(const row of assets){expect(Buffer.isBuffer(row.source),row.fileName).toBe(true);expect((row.source as Buffer).equals(readFileSync(`public/${row.fileName}`)),row.fileName).toBe(true);}
});
it.each(['v1','v2','v3'].flatMap(version=>['missing','stale'].map(mode=>({version,mode}))))('direct release refuses $version $mode Woka assets before emitting any artifact',async({version,mode})=>{
 const path=`public/wokas/varcamp-zodiac-${version}/aries-male.png`;if(mode==='missing')unlinkSync(path);else writeFileSync(path,'stale');const {rows,error}=await directRelease();expect(error).toBeInstanceOf(Error);expect(rows).toEqual([]);
});
it('real current release refuses matching regenerated native input with omitted required furnishings before any emission',async()=>{
 const layout=JSON.parse(readFileSync('world/layouts/speaker-aries.json','utf8'));layout.placements=layout.placements.filter((p:{sprite:string})=>p.sprite!=='interior-ref-sofa');const map=renderReferenceInterior(layout,loadTileCatalog()).tmj;writeFileSync('world/layouts/speaker-aries.json',JSON.stringify(layout));writeFileSync('maps/speaker-aries.tmj',JSON.stringify(map));const {rows,error}=await directRelease();expect(error).toBeInstanceOf(Error);expect(String(error)).toMatch(/Interior.*furnishing|Event presentation: unreviewed source layout: speaker-aries/);expect(rows).toEqual([]);
});
