import{mkdtempSync,readFileSync,rmSync,symlinkSync,writeFileSync}from'node:fs';
import{spawnSync}from'node:child_process';
import{tmpdir}from'node:os';
import{resolve}from'node:path';
import{expect,it}from'vitest';
import{stageCurrentWorldInputs}from'./helpers/current-interior-fixture';
import{renderReferenceInterior}from'../tools/maps/reference-interiors';
import{loadTileCatalog}from'../tools/art/catalog';
it('normal maps:build accepts genuine sources, then rejects a coherent source/native furnishing omission before writing any preview',()=>{
 const project=process.cwd(),fixture=mkdtempSync(resolve(tmpdir(),'varcamp-current-interior-entry-'));
 try{
  stageCurrentWorldInputs(project,fixture);symlinkSync(resolve(project,'node_modules'),resolve(fixture,'node_modules'),'dir');
  const run=()=>spawnSync(process.execPath,['--import','tsx',resolve(project,'tools/maps/build.ts')],{cwd:fixture,encoding:'utf8',timeout:20000,maxBuffer:1024*1024});
  const control=run();expect(control.status,control.stderr).toBe(0);expect(control.stdout).toContain('lunar-hall.tmj: native Tiled source retained');
  const preview=readFileSync(resolve(fixture,'maps/preview/air-district.tmj'));
  const layout=JSON.parse(readFileSync(resolve(fixture,'world/layouts/lunar-hall.json'),'utf8'));layout.placements=layout.placements.filter((p:{sprite:string})=>p.sprite!=='interior-ref-sofa');const map=renderReferenceInterior(layout,loadTileCatalog()).tmj;
  writeFileSync(resolve(fixture,'world/layouts/lunar-hall.json'),JSON.stringify(layout));writeFileSync(resolve(fixture,'maps/lunar-hall.tmj'),JSON.stringify(map));
  const mutant=run();expect(mutant.status).not.toBe(0);expect(mutant.stderr).toMatch(/Interior lunar-hall: required furnishing|Vibe Code branding: unreviewed source layout|Event presentation: unreviewed source layout/);expect(mutant.stdout).toBe('');expect(readFileSync(resolve(fixture,'maps/preview/air-district.tmj'))).toEqual(preview);
 }finally{rmSync(fixture,{recursive:true,force:true});}
},30000);
