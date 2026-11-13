import{cpSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync,symlinkSync}from'node:fs';
import{spawnSync}from'node:child_process';
import{tmpdir}from'node:os';
import{resolve}from'node:path';
import{expect,it}from'vitest';
import{worldRelease}from'../tools/release';
import{stageCurrentWorldInputs}from'./helpers/current-interior-fixture';
import{mutateNativeContext}from'./helpers/native-context-mutations';
import{assertNativeAirborne}from'../tools/maps/airborne';
it.each(['unused','text'])('actual direct release refuses %s drift before any artifact emission',async kind=>{
 const project=process.cwd(),fixture=mkdtempSync(resolve(tmpdir(),'varcamp-context-release-'));
 try{
  stageCurrentWorldInputs(project,fixture);mkdirSync(resolve(fixture,'public/wokas'),{recursive:true});cpSync(resolve(project,'public/wokas/varcamp-zodiac-v1'),resolve(fixture,'public/wokas/varcamp-zodiac-v1'),{recursive:true});cpSync(resolve(project,'docs/dependencies'),resolve(fixture,'docs/dependencies'),{recursive:true});process.chdir(fixture);
  const run=async()=>{const rows:unknown[]=[];let error:unknown;const hook=worldRelease().generateBundle;if(typeof hook!=='function')throw Error('No actual release hook');try{await hook.call({emitFile:(row:unknown)=>{rows.push(row);return String(rows.length);}}as never,{}as never,{runtime:{type:'chunk',isEntry:true,name:'src-main',fileName:'assets/src-main-fixture.js'}}as never,false);}catch(e){error=e;}return{rows,error};};
  const control=await run();expect(control.error).toBeUndefined();expect(control.rows.length).toBeGreaterThan(68);
  const path='maps/shipyard-beach.tmj',raw=readFileSync(path);
  const map=JSON.parse(raw.toString());mutateNativeContext(map,kind==='unused'?'unused-body':'unknown-text');expect(()=>assertNativeAirborne(map,JSON.parse(readFileSync('world/layouts/shipyard-beach.json','utf8')))).not.toThrow();writeFileSync(path,JSON.stringify(map));const result=await run();expect(result.error,kind).toBeInstanceOf(Error);expect(String(result.error)).toMatch(/Native context/);expect(result.rows).toEqual([]);
 }finally{process.chdir(project);rmSync(fixture,{recursive:true,force:true});}
},30000);
it.each(['unused','text'])('actual normal builder refuses %s drift before writing previews',kind=>{
 const project=process.cwd(),fixture=mkdtempSync(resolve(tmpdir(),'varcamp-context-build-'));
 try{
  stageCurrentWorldInputs(project,fixture);symlinkSync(resolve(project,'node_modules'),resolve(fixture,'node_modules'),'dir');
  const run=()=>spawnSync(process.execPath,['--import','tsx',resolve(project,'tools/maps/build.ts')],{cwd:fixture,encoding:'utf8',timeout:20000,maxBuffer:1024*1024});const control=run();expect(control.status,control.stderr).toBe(0);
  const preview=readFileSync(resolve(fixture,'maps/preview/air-district.tmj')),path=resolve(fixture,'maps/shipyard-beach.tmj'),raw=readFileSync(path);
  const map=JSON.parse(raw.toString());mutateNativeContext(map,kind==='unused'?'unused-body':'unknown-text');expect(()=>assertNativeAirborne(map,JSON.parse(readFileSync(resolve(fixture,'world/layouts/shipyard-beach.json'),'utf8')))).not.toThrow();writeFileSync(path,JSON.stringify(map));const result=run();expect(result.status,kind).not.toBe(0);expect(result.stderr).toMatch(/Native context/);expect(result.stdout).toBe('');expect(readFileSync(resolve(fixture,'maps/preview/air-district.tmj'))).toEqual(preview);
 }finally{rmSync(fixture,{recursive:true,force:true});}
},30000);
