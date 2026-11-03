import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import {emitNativeMapAssets} from '../tools/release';

it('publishes the garden sources with their complete upstream credits and retained licence',()=>{
 const files=new Map<string,string|Buffer>();
 emitNativeMapAssets([], 'unused.js', [], a=>files.set(a.fileName,a.source));
 const html=String(files.get('credits/index.html'));
 for(const [id,title,credits] of [
  ['lpc-garden-trees','LPC garden trees','CREDITS-trees.txt'],
  ['lpc-garden-plants','LPC garden flowers and plants','CREDITS-plants.txt'],
  ['lpc-garden-terrain','LPC garden gravel paths','CREDITS-terrain.txt'],
 ]){
  expect(html).toContain(`<h2>${title}</h2>`);
  expect(html).toContain(`${id}/${credits}?v=`);
  for(const name of [credits,'ATTRIBUTION.md','LICENSE-CC-BY-SA-3.0.txt']){
   expect(Buffer.from(files.get(`credits/${id}/${name}`)!)).toEqual(readFileSync(`assets/tilesets/lpc-garden/${name}`));
  }
 }
});
