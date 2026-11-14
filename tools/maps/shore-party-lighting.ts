import contract from '../../world/shore-party-lighting.json';
import type {TiledMap} from './types';

/** Reuse one native light layer and its clocks; no additional texture or script. */
export function applyShorePartyLighting(map:TiledMap):TiledMap{
 const require=(ok:unknown,message:string)=>{if(!ok)throw Error('Shore party lighting: '+message);};
 require(contract.version===1&&map.width===contract.width&&map.height===contract.height,'unexpected map dimensions');
 const matches=map.layers.filter(l=>l.name===contract.layerName);
 const lights=matches[0],collision=map.layers.find(l=>l.name==='physical-collisions');
 require(matches.length===1&&lights?.type==='tilelayer'&&collision?.type==='tilelayer','missing native layers');
 if(lights.type!=='tilelayer'||collision?.type!=='tilelayer')throw Error('Shore party lighting: invalid layers');
 require(lights.data.length===map.width*map.height&&collision.data.length===lights.data.length,'invalid native cell count');
 const source=contract.source;
 const cells=(x:number,y:number)=>{
  require(Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x+source.width<=map.width&&y+source.height<=map.height,'patch outside map');
  return Array.from({length:source.width*source.height},(_,i)=>(y+Math.floor(i/source.width))*map.width+x+i%source.width);
 };
 const original=cells(source.x,source.y),pattern=original.map(i=>lights.data[i]);
 require(pattern.every(gid=>Number.isInteger(gid)&&gid>0)&&new Set(pattern).size===pattern.length,'invalid original light pattern');
 require(lights.data.filter(Boolean).length===pattern.length,'unexpected existing light coverage');
 const expanded=[...lights.data];
 for(const copy of contract.copies)for(const [j,i]of cells(copy.x,copy.y).entries()){
  require(expanded[i]===0&&collision.data[i]===0,'occupied or overlapping light patch');
  expanded[i]=pattern[j];
 }
 lights.data=expanded;
 return map;
}
