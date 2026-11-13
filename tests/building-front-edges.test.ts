import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {loadTileCatalog} from '../tools/art/catalog';
import {buildMap} from '../tools/maps/builder';
import {assertNativePlaza} from '../tools/maps/plaza-native';
import type {MapLayout,TiledMap} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
// Literal roster/coordinates from the audited live baseline; not derived from the rule under test.
const rows=[
  {
    "id": "aries-building",
    "sprite": "aries-citadel",
    "x": 102,
    "y": 58,
    "sheet": "assets/tilesets/original/aries-citadel.png"
  },
  {
    "id": "taurus-building",
    "sprite": "grounded-zodiac-physical-taurus",
    "x": 96,
    "y": 80,
    "sheet": "assets/tilesets/original/zodiac-exteriors.png"
  },
  {
    "id": "gemini-building",
    "sprite": "grounded-zodiac-physical-gemini",
    "x": 80,
    "y": 96,
    "sheet": "assets/tilesets/original/zodiac-exteriors.png"
  },
  {
    "id": "cancer-building",
    "sprite": "cancer-citadel",
    "x": 58,
    "y": 102,
    "sheet": "assets/tilesets/original/cancer-citadel.png"
  },
  {
    "id": "leo-building",
    "sprite": "leo-citadel",
    "x": 36,
    "y": 96,
    "sheet": "assets/tilesets/original/leo-citadel.png"
  },
  {
    "id": "virgo-building",
    "sprite": "grounded-zodiac-physical-virgo",
    "x": 20,
    "y": 80,
    "sheet": "assets/tilesets/original/zodiac-exteriors.png"
  },
  {
    "id": "libra-building",
    "sprite": "grounded-zodiac-physical-libra",
    "x": 14,
    "y": 58,
    "sheet": "assets/tilesets/original/zodiac-exteriors.png"
  },
  {
    "id": "scorpio-building",
    "sprite": "grounded-zodiac-physical-scorpio",
    "x": 20,
    "y": 36,
    "sheet": "assets/tilesets/original/zodiac-exteriors.png"
  },
  {
    "id": "sagittarius-building",
    "sprite": "grounded-zodiac-physical-sagittarius",
    "x": 36,
    "y": 20,
    "sheet": "assets/tilesets/original/zodiac-exteriors.png"
  },
  {
    "id": "capricorn-building",
    "sprite": "capricorn-citadel",
    "x": 58,
    "y": 14,
    "sheet": "assets/tilesets/original/capricorn-citadel.png"
  },
  {
    "id": "aquarius-building",
    "sprite": "grounded-zodiac-physical-aquarius",
    "x": 80,
    "y": 20,
    "sheet": "assets/tilesets/original/zodiac-exteriors.png"
  },
  {
    "id": "pisces-building",
    "sprite": "grounded-zodiac-physical-pisces",
    "x": 96,
    "y": 36,
    "sheet": "assets/tilesets/original/zodiac-exteriors.png"
  },
  {
    "id": "exterior-gate-solar",
    "sprite": "grounded-hall-building-solar",
    "x": 15,
    "y": 10,
    "sheet": "assets/tilesets/original/hall-buildings.png"
  },
  {
    "id": "exterior-gate-lunar",
    "sprite": "grounded-hall-building-lunar",
    "x": 101,
    "y": 10,
    "sheet": "assets/tilesets/original/hall-buildings.png"
  }
];
const changed=rows.filter(r=>r.id!=='capricorn-building');
const unaffectedMapHashes={
  "maps/overworld.tmj": "81abd4fc20997a1ce7797d3b552d008b0e556f7479634cff1b02ab65620009b6",
  "maps/preview/overworld.tmj": "3e03cfe9ec4e952ebe5a85d631b183d56460bae9d6ed569dc5e832626d10d94c"
};

function checkDepth(m:TiledMap,r:typeof rows[number]){
 const s=loadTileCatalog()[r.sprite],sets=m.tilesets.filter(t=>t.image?.endsWith('/'+r.sheet));expect(sets).toHaveLength(1);const set=sets[0];
 const floor=m.layers.findIndex(l=>l.name==='floorLayer');expect(floor).toBeGreaterThan(0);
 for(let y=0;y<12;y++)for(let x=0;x<12;x++){
  const at=(r.y+y)*m.width+r.x+x,gid=set.firstgid+(s.rect.y+y)*set.columns!+s.rect.x+x;
  const owners=m.layers.flatMap((l,i)=>l.type==='tilelayer'&&l.data[at]===gid?[i]:[]);
  expect(owners,r.id+' cell '+x+','+y+' must paint exactly once').toHaveLength(1);
  expect(owners[0]<floor,r.id+' row '+y+' has wrong avatar depth').toBe(y===11);
 }
}
describe('all speaker and hall frontages keep Wokas visible',()=>{
 for(const r of rows)it(r.id+' has its front below and roof above avatars',()=>checkDepth(read('maps/overworld.tmj'),r));
 it('preview uses the same partition for every frontage',()=>{const m=read('maps/preview/overworld.tmj');for(const r of rows)checkDepth(m,r);});
 it('regeneration preserves the partition for every frontage',()=>{
  const c=loadTileCatalog(),m=buildMap(read('world/layouts/overworld.json') as MapLayout,c).tmj;
  for(const r of rows)checkDepth(m,r);
 },20000);
 it('preserves all map data outside the 156 reviewed transfers, including Capricorn',()=>{
  for(const [path,want]of Object.entries(unaffectedMapHashes)){
   const m=read(path) as TiledMap;
   for(const l of m.layers)if(l.type==='tilelayer'&&['scenery-belowAvatar-1','scenery-aboveAvatar-0'].includes(l.name))for(const r of changed)for(let x=0;x<12;x++)l.data[(r.y+11)*128+r.x+x]=0;
   expect(hash(m),path+' changed outside its thirteen front rows').toBe(want);
  }
 });
 it('preserves every catalog field except the thirteen front partitions',()=>{
  const c=loadTileCatalog();for(const r of changed)delete c[r.sprite].upperCells;
  expect(hash(c)).toBe('5a893a1b3c7ff71395b206d1dfa7ffa07d0411dea87783881fc103dd5c8263e6');
  expect(hash(read('world/layouts/overworld.json'))).toBe('754fef83cdf754c2525a526fb99fcc86edce4120fde898d16fcc4a4bcaa3873b');
  const images=[...new Set(rows.map(r=>r.sheet))].sort();
  expect(hash(images.map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]))).toBe('71b0d6302bddd2a1c8e1d3fa7815c0bca70dc0db2f463d13c36515bcb590c5b2');
 });
 it('accepts the current export and rejects each reverted partition and changed footprint',()=>{
  const m=read('maps/overworld.tmj'),l=read('world/layouts/overworld.json'),c=loadTileCatalog();
  expect(()=>assertNativePlaza(m,l,c)).not.toThrow();
  for(const r of rows){
   const missing=structuredClone(c);delete missing[r.sprite].upperCells;
   expect(()=>assertNativePlaza(m,l,missing),r.id+' must reject old occlusion').toThrow();
   const wrong=structuredClone(c);wrong[r.sprite].upperCells!.push([0,11]);
   expect(()=>assertNativePlaza(m,l,wrong),r.id+' must reject a foreground front tile').toThrow();
   const footprint=structuredClone(c);footprint[r.sprite].blockingCells=[];
   expect(()=>assertNativePlaza(m,l,footprint),r.id+' must reject missing walls').toThrow();
  }
 },20000);
});
