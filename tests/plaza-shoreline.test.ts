import {restoreArrivalSponsorSpace} from '../tools/maps/arrival-sponsor-space';
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {applyPlazaShoreline,restorePlazaShoreline,shorelineAtlases} from '../tools/maps/plaza-shoreline';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';
import recipe from '../world/plaza-shoreline.json';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const layout=()=>restoreArrivalSponsorSpace(read('world/layouts/overworld.json') as MapLayout);
const map=()=>read('maps/overworld.tmj') as TiledMap;
const layer=(m:TiledMap,n:string)=>m.layers.find(l=>l.name===n) as TileLayer;

describe('circular plaza shoreline',()=>{
 it('preserves every existing object and control, and rejects unreviewed movement or a walkable bank',()=>{
  const l=layout(),catalog=read('art/tile-catalog.json'),prior=restorePlazaShoreline(l,catalog);
  expect(applyPlazaShoreline(prior)).toEqual(l);
  expect(l.placements.slice(0,prior.placements.length)).toEqual(prior.placements);
  const {placements:a,...before}=prior,{placements:b,...after}=l;void a;void b;expect(after).toEqual(before);
  l.placements.find(p=>p.sprite==='check-in-desk-solid')!.x++;
  expect(()=>restorePlazaShoreline(l,catalog)).toThrow('unreviewed source layout');
  catalog['shoreline-bank-0-0'].blockingCells=[];
  expect(()=>restorePlazaShoreline(layout(),catalog)).toThrow('bank artwork/footprint changed');
 });
 it('keeps water and the stone bank solid, with no new obstacles on the old road or guide graph',()=>{
  const m=map(),l=layout(),mask=layer(m,'physical-collisions').data,ground=Array<string>(128*128);
  for(const p of l.placements)if(p.layer==='terrain')for(let y=p.y;y<p.y+p.height;y++)for(let x=p.x;x<p.x+p.width;x++)ground[y*128+x]=p.sprite;
  for(let i=0;i<ground.length;i++)if(ground[i]==='water-blue')expect(Boolean(mask[i]),'sea '+i).toBe(true);
  expect(recipe.bankCells.length).toBeGreaterThan(400);
  for(const[x,y]of recipe.bankCells)expect(Boolean(mask[y*128+x]),'bank').toBe(true);
  const prior=restorePlazaShoreline(l),oldGround=Array<string>(128*128);
  for(const p of prior.placements)if(p.layer==='terrain')for(let y=p.y;y<p.y+p.height;y++)for(let x=p.x;x<p.x+p.width;x++)oldGround[y*128+x]=p.sprite;
  const pots=new Set(recipe.added.filter(p=>p.sprite==='plaza-potted-lavender').map(p=>p.y*128+p.x));
  for(const c of recipe.collisionChanges)if(c.after&&!c.before)expect(pots.has(c.index),'new blocker must be a visible planter').toBe(true);
  for(let i=0;i<oldGround.length;i++)if(oldGround[i]==='path-stone')expect(ground[i],'existing road '+i).toBe('path-stone');
  for(const[x,y]of read('src/bots/lyra-routes.json').allowedCells)expect(Boolean(mask[y*128+x]),'guide').toBe(false);
 });
 it('connects all four unchanged gateways to the island with broad, walkable landings',()=>{
  const l=layout(),m=map(),mask=layer(m,'physical-collisions').data;
  for(const name of ['maze','campus','festival','shipyard']){
   const e=l.exits.find(e=>e.name===name)!;
   for(let y=e.y;y<e.y+e.height;y++)for(let x=e.x;x<e.x+e.width;x++)expect(mask[y*128+x],name+' trigger').toBe(0);
  }
  for(let i=6;i<12;i++)for(let j=(i<8?62:61);j<(i<8?66:67);j++){
   for(const[x,y]of [[j,i],[j,127-i],[i,j],[127-i,j]])expect(mask[y*128+x],'landing passage '+[x,y]).toBe(0);
  }
  // Flood-fill the real collision mask, including expanded shores and the four approaches.
  const queue=[64*128+64],seen=new Set(queue);
  for(let n=0;n<queue.length;n++){const i=queue[n],x=i%128,y=Math.floor(i/128);for(const[nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const j=ny*128+nx;if(nx>=0&&ny>=0&&nx<128&&ny<128&&!mask[j]&&!seen.has(j)){seen.add(j);queue.push(j);}}}
  for(const[x,y]of [[63,7],[63,120],[7,63],[120,63],[27,24],[100,24],[24,107],[103,107]])expect(seen.has(y*128+x),'unreachable perimeter '+[x,y]).toBe(true);
 });
 it('adds only the licensed terrain reservation with fixed native dimensions',()=>{
  const m=map(),t=m.tilesets.at(-1)!;expect(m.tilesets).toHaveLength(162);expect(t.name).toBe('plaza-shoreline-terrain');
  const source={...m,tilesets:[{...t,name:'art-0',firstgid:1}]};
  expect(shorelineAtlases(source,t.firstgid)).toEqual([t]);
  source.tilesets[0].columns=20;expect(()=>shorelineAtlases(source,t.firstgid)).toThrow('bank atlas geometry');
 });
});
