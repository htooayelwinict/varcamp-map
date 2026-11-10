import {readFileSync,writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {buildMap} from './builder';
import {loadTileCatalog} from '../art/catalog';
import {assertNativeSourceProjection,reconcileNativeProjection} from './native-projection';
import {restoreArrivalCheckIn} from './arrival-check-in';
import type {MapLayout,TiledMap,TileLayer} from './types';

const layout=JSON.parse(readFileSync('world/layouts/overworld.json','utf8')) as MapLayout;
const native=JSON.parse(readFileSync('maps/overworld.tmj','utf8')) as TiledMap;
const catalog=loadTileCatalog();
// Verify the actual predecessor before authoring; never overwrite manual native edits.
assertNativeSourceProjection(native,buildMap(restoreArrivalCheckIn(layout),catalog).tmj);
const intended=buildMap(layout,catalog).tmj,base=structuredClone(native);
const mask=(m:TiledMap)=>m.layers.find(l=>l.name==='physical-collisions') as TileLayer;
const from=intended.tilesets.find(t=>t.name==='navigation-mask')!;
const to=base.tilesets.find(t=>t.name==='navigation-mask')!;
if(!isDeepStrictEqual({...from,firstgid:0},{...to,firstgid:0}))throw Error('Check-in navigation atlas changed');
mask(base).data=mask(intended).data.map(g=>g?g-from.firstgid+to.firstgid:0);
const result=reconcileNativeProjection(base,intended);
if(!isDeepStrictEqual(result.tilesets,native.tilesets)||!isDeepStrictEqual(result.properties,native.properties)||!isDeepStrictEqual(result.layers.filter(l=>l.type==='objectgroup'),native.layers.filter(l=>l.type==='objectgroup')))throw Error('Check-in changed protected native state');
writeFileSync('maps/overworld.tmj',JSON.stringify(result)+'\n');
const recipePath='world/arrival-check-in-expansion.json',recipe=JSON.parse(readFileSync(recipePath,'utf8'));
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
recipe.native={beforeSha256:sha(native),afterSha256:sha(result)};
writeFileSync(recipePath,JSON.stringify(recipe,null,2)+'\n');
console.log('Expanded arrival check-in; existing atlases and controls preserved.');
