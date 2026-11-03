import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {loadTileCatalog} from '../tools/art/catalog';
import {buildMap} from '../tools/maps/builder';
import type {MapLayout} from '../tools/maps/types';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
describe('Distinct Aries and Capricorn; original Taurus',()=>{
 it('retains exactly the original Taurus building at the owner request',()=>{
  const l=read('world/layouts/overworld.json'),c=loadTileCatalog();
  expect(l.placements.find((p:any)=>p.id==='taurus-building')).toEqual({id:'taurus-building',sprite:'grounded-zodiac-physical-taurus',x:96,y:80,width:12,height:12,layer:'props'});
  expect(c['grounded-zodiac-physical-taurus'].sheet).toBe('assets/tilesets/original/zodiac-exteriors.png');
  expect(c['taurus-citadel']).toBeUndefined();
 });
 for(const [sign,x,y]of [['aries',102,58],['capricorn',58,14]] as const){
  it(`${sign}: replaces the horn pavilion without moving its doorway or grounded walls`,()=>{
   const l=read('world/layouts/overworld.json') as MapLayout,c=loadTileCatalog(),p=l.placements.find(p=>p.id===`${sign}-building`)!;
   expect(p).toEqual({id:`${sign}-building`,sprite:`${sign}-citadel`,x,y,width:12,height:12,layer:'props'});
   expect(c[p.sprite].sheet).toBe(`assets/tilesets/original/${sign}-citadel.png`);
   expect(c[p.sprite].blockingCells).toEqual(c[`grounded-zodiac-physical-${sign}`].blockingCells);
   expect(c[p.sprite].level).toBe('aboveAvatar');
   const m=buildMap(l,c).tmj,layer=m.layers.find(l=>l.name==='physical-collisions');if(layer?.type!=='tilelayer')throw Error('missing physics');
   for(let xx=0;xx<12;xx++)expect(layer.data[(y+7)*m.width+x+xx]).toBe(0);
   for(const yy of [9,10,11])for(let xx=0;xx<12;xx++)expect(Boolean(layer.data[(y+yy)*m.width+x+xx])).toBe(xx!==5&&xx!==6);
   expect(l.exits.find(e=>e.name===`speaker-${sign}`)).toEqual({name:`speaker-${sign}`,destination:`speaker-${sign}`,entry:'speaker-entry',x:x+5,y:y+11,width:2,height:1});
  });
 }
});
