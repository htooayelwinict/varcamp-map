import{cpSync,mkdtempSync,mkdirSync,readFileSync,rmSync,symlinkSync,writeFileSync}from'node:fs';
import{spawnSync}from'node:child_process';
import{tmpdir}from'node:os';
import{resolve}from'node:path';
import{expect,it}from'vitest';
import{worldRelease}from'../tools/release';
import{stageCurrentWorldInputs}from'./helpers/current-interior-fixture';
it('actual normal build and direct current release reject coherent aircraft omission before writing or emitting anything',async()=>{
 const project=process.cwd(),fixture=mkdtempSync(resolve(tmpdir(),'varcamp-aerial-entry-'));
 try{
  stageCurrentWorldInputs(project,fixture);cpSync(resolve(project,'public'),resolve(fixture,'public'),{recursive:true});cpSync(resolve(project,'docs/dependencies'),resolve(fixture,'docs/dependencies'),{recursive:true});mkdirSync(resolve(fixture,'maps/preview'),{recursive:true});symlinkSync(resolve(project,'node_modules'),resolve(fixture,'node_modules'),'dir');process.chdir(fixture);
  const normal=()=>spawnSync(process.execPath,['--import','tsx',resolve(project,'tools/maps/build.ts')],{cwd:fixture,encoding:'utf8',timeout:20000,maxBuffer:1024*1024});
  const release=async()=>{const rows:unknown[]=[];let error:unknown;const hook=worldRelease().generateBundle;if(typeof hook!=='function')throw Error('Missing actual current release entry');try{await hook.call({emitFile:(row:unknown)=>{rows.push(row);return String(rows.length);}}as never,{}as never,{runtime:{type:'chunk',isEntry:true,name:'src-main',fileName:'assets/src-main-fixture.js'}}as never,false);}catch(e){error=e;}return{rows,error};};
  const control=normal();expect(control.status,control.stderr).toBe(0);const previous=readFileSync('maps/preview/air-district.tmj');const releaseControl=await release();expect(releaseControl.error).toBeUndefined();expect(releaseControl.rows.length).toBeGreaterThan(68);
  const layout=JSON.parse(readFileSync('world/layouts/shipyard-beach.json','utf8')),map=JSON.parse(readFileSync('maps/shipyard-beach.tmj','utf8'));layout.animatedOverlays=layout.animatedOverlays.filter((o:{name:string})=>o.name!=='coastal-flight');map.layers=map.layers.filter((l:{name:string})=>l.name!=='coastal-flight');writeFileSync('world/layouts/shipyard-beach.json',JSON.stringify(layout));writeFileSync('maps/shipyard-beach.tmj',JSON.stringify(map));
  const rejected=normal();expect(rejected.status).not.toBe(0);expect(rejected.stderr).toMatch(/animation safety/i);expect(rejected.stdout).toBe('');expect(readFileSync('maps/preview/air-district.tmj').equals(previous)).toBe(true);
  const rejectedRelease=await release();expect(rejectedRelease.error).toBeInstanceOf(Error);expect(String(rejectedRelease.error)).toMatch(/animation safety/i);expect(rejectedRelease.rows).toEqual([]);
 }finally{process.chdir(project);rmSync(fixture,{recursive:true,force:true});}
},30000);
