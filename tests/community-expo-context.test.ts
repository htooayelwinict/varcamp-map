import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {buildMap} from '../tools/maps/builder';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertNativeOwnershipContext,assertNativeAuthoringContext} from '../tools/maps/native-ownership-context';
import type {TiledMap,TiledTileset} from '../tools/maps/types';

const extra=(name:string,image:string,firstgid:number):TiledTileset=>({name,image,firstgid,tilewidth:32,tileheight:32,columns:4,tilecount:8,imagewidth:128,imageheight:64,properties:[{name:'sponsorPanel',type:'bool',value:true},{name:'tilesetCopyright',type:'string',value:'Sponsor artwork: see credits/sponsors.json for original attribution and replacement terms.'}]});
function pair(){
 const layout=JSON.parse(readFileSync('world/layouts/overworld.json','utf8'));
 const source=buildMap(layout,loadTileCatalog()).tmj,actual=JSON.parse(readFileSync('maps/overworld.tmj','utf8')) as TiledMap;
 // Reconstruct the old atlas roster even after the integration is authored.
 for(const map of [source,actual])map.tilesets=map.tilesets.filter(t=>!['Expo / OSRFM','Expo / Ten Ten'].includes(t.name!));
 const prior=structuredClone(actual);
 for(const map of [source,actual]){let at=Math.max(...map.tilesets.map(t=>t.firstgid+t.tilecount!));for(const [name,image]of [['Expo / OSRFM','partner-osrfm'],['Expo / Ten Ten','partner-ten-ten']]){map.tilesets.push(extra(name,'../assets/sponsors/'+image+'.png',at));at+=8;}}
 return{source,actual,prior};
}
describe('bounded community logo atlas admission',()=>{
 it('appends OSRFM and Ten Ten without moving existing reservations',()=>{
  const {source,actual,prior}=pair();
  expect(()=>assertNativeOwnershipContext(actual,source)).not.toThrow();
  expect(()=>assertNativeAuthoringContext(prior,source)).not.toThrow();
  expect(()=>assertNativeOwnershipContext(prior,source)).toThrow();
 });
 it.each(['missing','duplicate','image','geometry','shift'])('rejects an invalid community reservation: %s',kind=>{
  const {source,actual}=pair();
  if(kind==='missing')source.tilesets.pop();
  if(kind==='duplicate')source.tilesets.push(structuredClone(source.tilesets.at(-1)!));
  if(kind==='image')source.tilesets.at(-1)!.image='../assets/sponsors/hub-01.png';
  if(kind==='geometry')source.tilesets.at(-1)!.columns=6;
  if(kind==='shift')actual.tilesets.at(-1)!.firstgid++;
  expect(()=>assertNativeOwnershipContext(actual,source)).toThrow();
 });
});
