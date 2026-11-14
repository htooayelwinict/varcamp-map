import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {loadTileCatalog} from '../tools/art/catalog';
import {naturalCoastLayout,renderNaturalCoastMap} from '../tools/maps/natural-coast';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import type {TiledMap,TileLayer} from '../tools/maps/types';

const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const hash=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const before=read('tests/fixtures/shore-party-lighting-before.json');
const copies=[[3,15],[15,14],[41,17],[54,16],[69,17],[81,14]];
const load=()=>read('maps/constellation-shore.tmj') as TiledMap;
const layer=(m:TiledMap,name:string)=>m.layers.find(l=>l.name===name) as TileLayer;

describe('disco lights across the party shore',()=>{
 for(const kind of ['shipped','fresh export'])it(`${kind} lights seven separate patches from west beach to far east`,()=>{
  const map=kind==='shipped'?load():renderNaturalCoastMap(naturalCoastLayout('constellation-shore'),loadTileCatalog());
  const lights=layer(map,'shore-dj-lights'),collision=layer(map,'physical-collisions');
  expect(lights.data.filter(Boolean),'Seven complete 8x6 patches').toHaveLength(336);
  for(const [x,y]of copies)for(let dy=0;dy<6;dy++)for(let dx=0;dx<8;dx++){
   expect(lights.data[(y+dy)*map.width+x+dx],`Light at ${x+dx},${y+dy}`).toBe(lights.data[(14+dy)*map.width+27+dx]);
   expect(collision.data[(y+dy)*map.width+x+dx],'Light patch stays on open dry sand').toBe(0);
  }
 });

 it('reuses the existing atlas, clock and layer while retaining every other map field and source WAM',()=>{
  const map=load();layer(map,'shore-dj-lights').data=[];
  expect(hash(JSON.stringify(canonical(map)))).toBe(before.mapOutsideFloorLightDataSha256);
  for(const[path,digest]of Object.entries(before.unchangedFiles))expect(hash(readFileSync(path)),path).toBe(digest);
  const actual=load(),lights=layer(actual,'shore-dj-lights'),atlas=actual.tilesets.find(t=>t.name==='shore-dj-lights')!;
  expect(atlas.tiles).toHaveLength(48);
  expect(actual.layers.indexOf(lights)).toBeLessThan(actual.layers.findIndex(l=>l.name==='floorLayer'));
  expect(atlas.tiles!.every(t=>t.animation!.reduce((n,f)=>n+f.duration,0)===6000)).toBe(true);
 });

 it('rejects losing a far-end light through the actual native map validator',()=>{
  const map=load();layer(map,'shore-dj-lights').data[14*map.width+81]=0;
  expect(()=>assertCurrentNativeMap('constellation-shore',map,naturalCoastLayout('constellation-shore'),read('maps/constellation-shore.wam'),loadTileCatalog())).toThrow(/native source projection/);
 });
});
