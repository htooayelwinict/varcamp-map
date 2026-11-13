import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {buildMap} from '../tools/maps/builder';
import {loadTileCatalog} from '../tools/art/catalog';
import type {MapLayout} from '../tools/maps/types';
import {gunzipSync} from 'node:zlib';
import {applyProgrammeBoards,restoreProgrammeBoards,refineNativeProgramme} from '../tools/maps/programme-boards';
const positions=[['arrival',54,55,4,3],['aries',101,71,4,2],['taurus',95,93,4,2],['gemini',79,109,4,2],['cancer',57,115,4,2],['leo',44,109,4,2],['virgo',28,93,4,2],['libra',22,71,4,2],['scorpio',28,49,4,2],['sagittarius',44,33,4,2],['capricorn',57,27,4,2],['aquarius',79,33,4,2],['pisces',95,49,4,2]] as const;
const read=()=>JSON.parse(readFileSync('world/layouts/overworld.json','utf8')) as MapLayout;
it('compiles the additive boards without changing historical captions',()=>{
 const before=JSON.parse(gunzipSync(readFileSync('tests/fixtures/programme/before.json.gz')).toString())['world/layouts/overworld.json'];
 expect(()=>buildMap(applyProgrammeBoards(before),loadTileCatalog())).not.toThrow();
});
it('provides thirteen physical programme boards clear of doors and the expo',()=>{
 const l=read(),faces=l.placements.filter(p=>p.id.startsWith('programme-face-'));
 expect(faces).toHaveLength(13);
 const overlap=(a:{x:number;y:number;width:number;height:number},b:typeof a)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 for(const[id,x,y,width,height]of positions){
  const face=faces.find(p=>p.id==='programme-face-'+id)!;
  expect(face).toMatchObject({x,y,width,height});
  expect(l.standingSigns?.find(s=>s.face===face.id)?.supports).toHaveLength(2);
  expect(overlap({...face,height:height+1},{x:38,y:65,width:52,height:25})).toBe(false);
  expect(overlap({...face,height:height+1},{x:58,y:60,width:12,height:4}),'reserved arrival sponsor space').toBe(false);
  for(const protectedRect of [...l.entries,...l.exits,...(l.images??[]),...l.placements.filter(p=>p.id.includes('ground-name')||p.id.includes('approach-arrow')||p.id.includes('zodiac-threshold')||p.id.endsWith('-desk'))])
   expect(overlap({...face,height:height+1},protectedRect),id+' overlaps '+JSON.stringify(protectedRect)).toBe(false);
 }
});
it('keeps every programme approach and all physical room doors reachable from arrival',()=>{
 const l=read();expect(l.placements.filter(p=>p.id.startsWith('programme-face-'))).toHaveLength(13);
 const m=buildMap(l,loadTileCatalog()).tmj;const layer=m.layers.find(p=>p.name==='physical-collisions');
 if(layer?.type!=='tilelayer')throw Error('Missing native collisions');const c=layer.data;
 const start=l.entries.find(e=>e.isDefault)!;const queue=[start.y*128+start.x],seen=new Set(queue);
 for(let h=0;h<queue.length;h++){const i=queue[h];for(const n of [i-128,i+128,i-1,i+1])if(n>=0&&n<16384&&Math.abs(n%128-i%128)<=1&&!c[n]&&!seen.has(n)){seen.add(n);queue.push(n);}}
 for(const[id,x,y,w,h]of positions){
  for(let dx=0;dx<w;dx++)expect(seen.has((y+h+1)*128+x+dx),id+' approach blocked').toBe(true);
  expect(c[(y+h)*128+x]).not.toBe(0);expect(c[(y+h)*128+x+w-1]).not.toBe(0);
 }
 for(const exit of l.exits)expect(Array.from({length:exit.width*exit.height},(_,i)=>(exit.y+Math.floor(i/exit.width))*128+exit.x+i%exit.width).some(i=>seen.has(i)),exit.name+' door unreachable').toBe(true);
});
it('adds only the approved boards and rejects altered board geometry',()=>{
 const before=JSON.parse(gunzipSync(readFileSync('tests/fixtures/programme/before.json.gz')).toString())['world/layouts/overworld.json'];
 expect(restoreProgrammeBoards(read())).toEqual(before);expect(applyProgrammeBoards(before)).toEqual(read());
 const changed=read();changed.placements.find(p=>p.id==='programme-face-aries')!.x++;
 expect(()=>restoreProgrammeBoards(changed)).toThrow(/programme/i);
});
it('spawns new visitors and the start alias on clear tiles at the centre of the VarCamp logo',()=>{
 const l=read(),m=JSON.parse(readFileSync('maps/overworld.tmj','utf8'));
 for(const name of ['welcome','start']){
  expect(l.entries.find(e=>e.name===name)).toMatchObject({x:63,y:55,width:2,height:2});
  const entry=m.layers.find((p:{name:string})=>p.name===name),mask=m.layers.find((p:{name:string})=>p.name==='physical-collisions');
  const cells=entry.data.flatMap((v:number,i:number)=>v?[i]:[]);
  expect(cells).toEqual([55*128+63,55*128+64,56*128+63,56*128+64]);
  for(const i of cells)expect(mask.data[i]).toBe(0);
 }
});
it('changes only native board paint and support collisions while preserving every other map field',()=>{
 const b=JSON.parse(gunzipSync(readFileSync('tests/fixtures/programme/before.json.gz')).toString());
 const actual=JSON.parse(readFileSync('maps/overworld.tmj','utf8'));
 expect(actual).toEqual(refineNativeProgramme(b['maps/overworld.tmj'],buildMap(read(),loadTileCatalog()).tmj));
 const mask=(m:typeof actual)=>m.layers.find((l:{name:string})=>l.name==='physical-collisions').data as number[];
 expect(mask(actual).flatMap((v,i)=>v!==mask(b['maps/overworld.tmj'])[i]?[i]:[])).toEqual(positions.flatMap(([,x,y,w,h])=>[(y+h)*128+x,(y+h)*128+x+w-1]).sort((a,b)=>a-b));
 for(const key of ['tilesets','properties','nextobjectid'])expect(actual[key]).toEqual(b['maps/overworld.tmj'][key]);
 for(const layer of b['maps/overworld.tmj'].layers.filter((l:{type:string})=>l.type!=='tilelayer'))expect(actual.layers.find((l:{name:string})=>l.name===layer.name)).toEqual(layer);
});
