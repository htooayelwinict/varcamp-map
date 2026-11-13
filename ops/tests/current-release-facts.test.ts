import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { currentFacts, renderFacts, checkCurrentDocs, localLinks } from '../current-release-facts.mjs';
const roots:string[]=[];
afterEach(()=>{for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});
function fixture(){
 const root=mkdtempSync(resolve(tmpdir(),'varcamp-facts-'));roots.push(root);
 const put=(path:string,value:string)=>{mkdirSync(dirname(resolve(root,path)),{recursive:true});writeFileSync(resolve(root,path),value);};
 put('src/world/catalog.ts','export const WORLD_CATALOG = {"one":{"width":2}} as const;');
 put('maps/one.tmj','{}');put('maps/one.wam','{}');
 put('publication/source-manifest.json',JSON.stringify({maps:1,wams:1,extensionInventory:{'ops/example.mjs':'a'.repeat(64)}}));
 put('ops/images.lock.json',JSON.stringify({workadventureSource:'b'.repeat(40)}));put('ops/play-cookie/provenance.json',JSON.stringify({baselineSourceCommit:'b'.repeat(40)}));
 put('.nvmrc','26.11.1\n');put('tools/maps/render.ts',"execFile(resolve('.tools/tiled-1.12.2/Tiled.app/Contents/MacOS/tmxrasterizer'))\n");
 put('package-lock.json',JSON.stringify({packages:Object.fromEntries(['vite','typescript','vitest','tsx','zod','sharp'].map(key=>['node_modules/'+key,{version:'1.2.3'}]))}));
 return {root,put};
}
it('derives facts from the catalog/native pair/manifest and compatible declared pins',()=>{
 const {root,put}=fixture();expect(currentFacts(root)).toMatchObject({mapPairs:1,extensionCount:1,nodeVersion:'26.11.1',tiledVersion:'1.12.2',workAdventureSource:'b'.repeat(40)});
 put('publication/source-manifest.json',JSON.stringify({maps:2,wams:2,extensionInventory:{}}));expect(()=>currentFacts(root)).toThrow(/map|catalog/i);
});
it('rejects a malformed, empty or multi-line .nvmrc, ambiguous Tiled pins and mismatched actual hosting provenance',()=>{
 const {root,put}=fixture();put('.nvmrc','');expect(()=>currentFacts(root)).toThrow(/Node/);
 put('.nvmrc','v26.11.1\n');expect(()=>currentFacts(root)).toThrow(/Node/);
 put('.nvmrc','26.11.1\n26.8.2\n');expect(()=>currentFacts(root)).toThrow(/Node/);
 put('.nvmrc','26.11.1\n');put('tools/maps/render.ts','tiled-1.12.2 tiled-1.11.0');expect(()=>currentFacts(root)).toThrow(/Tiled/);
 put('tools/maps/render.ts','tiled-1.12.2');put('ops/play-cookie/provenance.json',JSON.stringify({baselineSourceCommit:'c'.repeat(40)}));expect(()=>currentFacts(root)).toThrow(/WorkAdventure/);
});
it('rejects stale generated facts and missing active links while leaving historical sections alone',()=>{
 const {root,put}=fixture();put('README.md','[Current](docs/current-release-facts.md)');put('docs/dependencies.md','# Dependencies\n\n## Foundation (historical)\n[Old](missing-history.md)\n## Current tools and release\n[Missing](missing-current.md)');
 put('docs/current-release-facts.md',renderFacts(currentFacts(root))+'stale');
 expect(checkCurrentDocs(root)).toEqual(expect.arrayContaining([expect.stringMatching(/generated facts/),expect.stringMatching(/missing-current/)]));
 expect(checkCurrentDocs(root).join('\n')).not.toContain('missing-history');
});
it('a changed manifest extension inventory invalidates previously generated facts',()=>{
 const {root,put}=fixture();put('README.md','# Readme');put('docs/dependencies.md','## Current tools and release');put('docs/varcamp-map-handoff.md','# Handoff');put('docs/current-release-facts.md',renderFacts(currentFacts(root)));
 // The generated document also links authoritative owners/operating guidance.
 for(const path of ['ops/current-release-facts.mjs','docs/operating/venue-guide.md'])put(path,'');
 expect(checkCurrentDocs(root)).toEqual([]);
 put('publication/source-manifest.json',JSON.stringify({maps:1,wams:1,extensionInventory:{one:'a'.repeat(64),two:'b'.repeat(64)}}));
 expect(currentFacts(root).extensionCount).toBe(2);expect(checkCurrentDocs(root)).toEqual([expect.stringMatching(/generated facts/)]);
});
it('checks encoded and fragment local links, ignores code examples and remote destinations',()=>{
 const {root,put}=fixture();put('docs/target file.md','# Valid heading\n');
 const text='[OK](<target%20file.md#valid-heading>) [Bad](target%20file.md#absent) [Remote](https://example.invalid/)\n```md\n[Example](missing.md)\n```';
 expect(localLinks(root,'docs/readme.md',text)).toEqual([expect.stringMatching(/absent/)]);
});
it('checks explicit reference links and rejects unresolved references and repository escapes',()=>{
 const {root,put}=fixture();put('docs/target.md','# Target');
 expect(localLinks(root,'docs/readme.md','[Good][one] [Bad][missing] [Escape](../../outside.md)\n[one]: target.md#target')).toEqual([expect.stringMatching(/missing/),expect.stringMatching(/outside/)]);
});
it('current generated facts and active local links match the real source contracts',()=>{
 expect(checkCurrentDocs(process.cwd())).toEqual([]);
 expect(readFileSync('docs/current-release-facts.md','utf8')).toBe(renderFacts(currentFacts(process.cwd())));
});
