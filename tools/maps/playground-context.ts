import {createHash} from 'node:crypto';
import data from '../../art/source/orbit-course-refresh.json';
import type {TiledLayer,TiledMap} from './types';
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
function active(id:string):boolean{
 if(data.version!==1||data.mapId!=='orbit-playground'||data.layer.after.name!=='wayfinding-text')throw Error('Playground course owner changed');
 return id===data.mapId;
}
export function playgroundProtectedLayers(id:string,prior:TiledLayer[]):TiledLayer[]{
 if(!active(id))return prior;
 return prior.map(l=>{if(l.name!==data.layer.after.name)return l;if(sha(l)!==data.layer.beforeSha256)throw Error('Playground caption predecessor changed');return structuredClone(data.layer.after) as TiledLayer;});
}
export function playgroundOwners(id:string,prior:any[]):any[]{
 if(!active(id))return prior;
 return prior.map(o=>{if(o.name!==data.layer.after.name)return o;if(o.bodySha256!==data.layer.beforeSha256)throw Error('Playground caption ownership changed');return{...o,bodySha256:sha(data.layer.after),source:'art/source/orbit-course-refresh.json'};});
}
export function authorPlaygroundContext(map:TiledMap):void{
 if(!active(String(map.properties?.find(p=>p.name==='worldMapId')?.value)))return;
 const at=map.layers.findIndex(l=>l.name===data.layer.after.name);
 if(at<0||![data.layer.beforeSha256,sha(data.layer.after)].includes(sha(map.layers[at])))throw Error('Playground author input changed');
 map.layers[at]=structuredClone(data.layer.after) as TiledLayer;
 for(const old of data.retiredPaint as {name:string;sha256:string}[]){const index=map.layers.findIndex(l=>l.name===old.name);if(index<0)continue;if(!/^scenery-/.test(old.name)||sha(map.layers[index])!==old.sha256)throw Error('Playground paint predecessor changed');map.layers.splice(index,1);}
 map.nextobjectid=Math.max(map.nextobjectid??1,...map.layers.flatMap(l=>l.type==='objectgroup'?l.objects.map(o=>o.id+1):[]));
}
