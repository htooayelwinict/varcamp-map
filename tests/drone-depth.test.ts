import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,expect,it} from 'vitest';
import type {MapLayout,TiledMap} from '../tools/maps/types';
import {PLAZA_DRONES} from '../tools/maps/airborne';
import {applyDroneDepth,beforeDroneDepthJson,beforeDroneDepthLayout,beforeDroneDepthRaw,droneDepthNative,preDroneDepthLayout,preDroneDepthNative,isDrone} from './helpers/drone-depth-epoch';
const read=<T=any>(p:string):T=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
describe('drone-depth epoch: every overworld drone flies above all scenery and attendees',()=>{
 it('the current source is exactly the genuine predecessor with only the43 drone levels moved',()=>{
  const current=read<MapLayout>('world/layouts/overworld.json'),before=beforeDroneDepthLayout();
  expect(current).toEqual(applyDroneDepth(before));expect(preDroneDepthLayout(current)).toEqual(before);
  const moved=current.animatedOverlays!.filter((o,i)=>o.level!==before.animatedOverlays![i].level).map(o=>o.name);
  expect(moved).toEqual(PLAZA_DRONES.map(r=>r.name));
  expect({...current,animatedOverlays:[]}).toEqual({...before,animatedOverlays:[]});
 });
 it('the current native is exactly the predecessor with the same drone layer bodies moved to the end of the stack',()=>{
  const map=read<TiledMap>('maps/overworld.tmj'),before=beforeDroneDepthJson<TiledMap>('maps/overworld.tmj');
  expect(map).toEqual(droneDepthNative(before,beforeDroneDepthLayout()));expect(preDroneDepthNative(map)).toEqual(before);
  expect(map.tilesets).toEqual(before.tilesets);
  const names=map.layers.slice(-PLAZA_DRONES.length).map(l=>l.name);expect(names).toEqual(PLAZA_DRONES.map(r=>r.name));
  for(const l of map.layers)expect(l,l.name).toEqual(before.layers.find(b=>b.name===l.name));
  expect(map.layers.filter(l=>!isDrone(l.name)).map(l=>l.name)).toEqual(before.layers.filter(l=>!isDrone(l.name)).map(l=>l.name));
  const floor=before.layers.findIndex(l=>l.name==='floorLayer');expect(before.layers.every((l,i)=>!isDrone(l.name)||i<floor)).toBe(true);
 });
 it('carries a closed byte receipt that changes no image and starts from the genuine base bytes',()=>{
  const table=read('tests/fixtures/drone-depth/transitions.json');
  for(const[path,[from,to]]of Object.entries(table.transitions)as[string,[string,string]][]){
   expect(path,'no test path in the release receipt').not.toMatch(/^tests\//);expect(path,'no image changes').not.toMatch(/\.(png|svg)$/);
   expect(from).not.toBe(to);expect(sha(readFileSync(path)),path).toBe(to);
  }
  for(const path of ['world/layouts/overworld.json','maps/overworld.tmj'])expect(table.transitions[path][0]).toBe(sha(beforeDroneDepthRaw(path)));
 });
});
