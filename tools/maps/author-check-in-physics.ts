import {readFileSync,writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/check-in-physics.json';
import {applyCheckInPhysics} from './check-in-physics';
import {buildMap} from './builder';
import {reconcileNativeProjection} from './native-projection';
import {assertCurrentNativeMap} from './current-native';
import {loadTileCatalog} from '../art/catalog';
import type {MapLayout,TiledMap} from './types';

const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const catalog=loadTileCatalog(),before=read('maps/overworld.tmj') as TiledMap;
const layout=applyCheckInPhysics(read('world/layouts/overworld.json') as MapLayout);
const oldMask=before.layers.find(l=>l.name==='physical-collisions');
if(oldMask?.type!=='tilelayer')throw Error('Missing previous physical collision layer');
const blocked=[...new Set(oldMask.data.filter(Boolean))];
if(blocked.length!==1)throw Error('Ambiguous native collision marker');
// Invisible collision data is protected by the projection reconciler. Author
// only these three approved cells explicitly, retaining its native atlas GID.
const staged=structuredClone(before),stagedMask=staged.layers.find(l=>l.name==='physical-collisions');
if(stagedMask?.type!=='tilelayer')throw Error('Missing staged physical collision layer');
for(const i of [60*128+71,60*128+72,60*128+73])stagedMask.data[i]=blocked[0];
const map=reconcileNativeProjection(staged,buildMap(layout,catalog).tmj);
const mask=map.layers.find(l=>l.name==='physical-collisions');
if(oldMask?.type!=='tilelayer'||mask?.type!=='tilelayer')throw Error('Missing physical collision layer');
const expected=[60*128+71,60*128+72,60*128+73];
const delta=mask.data.flatMap((v,i)=>v!==oldMask.data[i]?[i]:[]);
if(!isDeepStrictEqual(delta,expected)||expected.some(i=>oldMask.data[i]!==0||mask.data[i]===0))throw Error('Unexpected collision delta');
const restored=structuredClone(map),restoredMask=restored.layers.find(l=>l.name==='physical-collisions');
if(restoredMask?.type!=='tilelayer')throw Error('Missing restored mask');
restoredMask.data=structuredClone(oldMask.data);
if(!isDeepStrictEqual(restored,before))throw Error('Physics fix changed unrelated native data');
if(!isDeepStrictEqual(catalog[data.spriteId],data.sprite))throw Error('Missing solid desk alias');
assertCurrentNativeMap('overworld',map,layout,read('maps/overworld.wam'),catalog);
writeFileSync('world/layouts/overworld.json',JSON.stringify(layout,null,2)+'\n');
writeFileSync('maps/overworld.tmj',JSON.stringify(map)+'\n');
console.log('Made only the three desktop cells solid; artwork, controls and all other native data unchanged.');
