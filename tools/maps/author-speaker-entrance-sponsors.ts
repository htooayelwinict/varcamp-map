import {readFileSync,writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {SIGN_IDS} from '../../src/world/catalog';
import {loadTileCatalog} from '../art/catalog';
import {applySpeakerEntranceSponsor} from './speaker-entrance-sponsors';
import {renderReferenceInterior} from './reference-interiors';
import {assertCurrentNativeMap} from './current-native';
import type {MapLayout,TiledMap} from './types';

const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const catalog=loadTileCatalog(),writes=new Map<string,string>();
for(const sign of SIGN_IDS){
 const id='speaker-'+sign,layoutPath=`world/layouts/${id}.json`,mapPath=`maps/${id}.tmj`;
 const before=read(layoutPath) as MapLayout,native=read(mapPath) as TiledMap;
 if(!isDeepStrictEqual(native,renderReferenceInterior(before,catalog).tmj))throw Error(id+': unexpected native edits');
 const layout=applySpeakerEntranceSponsor(before),map=renderReferenceInterior(layout,catalog).tmj;
 const mask=(m:TiledMap)=>({...m.layers.find(l=>l.name==='physical-collisions'),id:0});
 if(!isDeepStrictEqual(mask(native),mask(map)))throw Error(id+': entrance physics changed');
 assertCurrentNativeMap(id,map,layout,read(`maps/${id}.wam`),catalog);
 writes.set(layoutPath,JSON.stringify(layout,null,2)+'\n');
 writes.set(mapPath,JSON.stringify(map)+'\n');
}
for(const [path,body] of writes)writeFileSync(path,body);
console.log('Added complete DigiSec Lab marks and official titles inside 12 entrances. Saved WAMs and physics retained.');
