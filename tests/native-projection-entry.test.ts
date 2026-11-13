import{cpSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync,symlinkSync}from'node:fs';
import{spawnSync}from'node:child_process';
import{tmpdir}from'node:os';
import{resolve}from'node:path';
import{expect,it}from'vitest';
import{worldRelease}from'../tools/release';
import{stageCurrentWorldInputs}from'./helpers/current-interior-fixture';
it('actual current release rejects an invisible coast overlay before any artifact emission',async()=>{
 const project=process.cwd(),fixture=mkdtempSync(resolve(tmpdir(),'varcamp-projection-release-'));
 try{
  stageCurrentWorldInputs(project,fixture);mkdirSync(resolve(fixture,'public/wokas'),{recursive:true});cpSync(resolve(project,'public/wokas/varcamp-zodiac-v1'),resolve(fixture,'public/wokas/varcamp-zodiac-v1'),{recursive:true});cpSync(resolve(project,'docs/dependencies'),resolve(fixture,'docs/dependencies'),{recursive:true});process.chdir(fixture);
  const run=async()=>{const rows:unknown[]=[];let error:unknown;const hook=worldRelease().generateBundle;if(typeof hook!=='function')throw Error('No actual release entry');try{await hook.call({emitFile:(row:unknown)=>{rows.push(row);return String(rows.length);}}as never,{}as never,{runtime:{type:'chunk',isEntry:true,name:'src-main',fileName:'assets/src-main-fixture.js'}}as never,false);}catch(e){error=e;}return{rows,error};};
  const control=await run();expect(control.error).toBeUndefined();expect(control.rows.length).toBeGreaterThan(68);
  const path='maps/constellation-shore.tmj',map=JSON.parse(readFileSync(path,'utf8'));map.layers.find((l:{name:string})=>l.name==='coast-life-shore-fish-west').visible=false;writeFileSync(path,JSON.stringify(map));
  const mutant=await run();expect(mutant.error).toBeInstanceOf(Error);expect(String(mutant.error)).toMatch(/projection/);expect(mutant.rows).toEqual([]);
 }finally{process.chdir(project);rmSync(fixture,{recursive:true,force:true});}
},30000);

it('actual normal build rejects hidden ambient motion before writing any earlier preview',()=>{
 const project=process.cwd(),fixture=mkdtempSync(resolve(tmpdir(),'varcamp-projection-normal-'));
 try{stageCurrentWorldInputs(project,fixture);symlinkSync(resolve(project,'node_modules'),resolve(fixture,'node_modules'),'dir');const run=()=>spawnSync(process.execPath,['--import','tsx',resolve(project,'tools/maps/build.ts')],{cwd:fixture,encoding:'utf8',timeout:20000,maxBuffer:1024*1024});const control=run();expect(control.status,control.stderr).toBe(0);const preview=readFileSync(resolve(fixture,'maps/preview/air-district.tmj'));const path=resolve(fixture,'maps/fa-ship-interior.tmj'),map=JSON.parse(readFileSync(path,'utf8'));map.layers.find((l:{name:string})=>l.name==='world-ambient-fa-ship-interior-lamp-2').visible=false;writeFileSync(path,JSON.stringify(map));const mutant=run();expect(mutant.status).not.toBe(0);expect(mutant.stderr).toMatch(/projection/);expect(mutant.stdout).toBe('');expect(readFileSync(resolve(fixture,'maps/preview/air-district.tmj'))).toEqual(preview);
 }finally{rmSync(fixture,{recursive:true,force:true});}
},30000);
