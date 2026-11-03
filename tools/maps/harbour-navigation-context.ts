import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import data from '../../world/harbour-navigation.json';
import type {TiledLayer,TiledMap,TiledTileset} from './types';
type Change={beforeSha256:string;after:TiledLayer};
type Row={layers:Change[];atlases:TiledTileset[];retiredPaint:{name:string;sha256:string}[]};
const rows=data.maps as unknown as Record<string,Row>;
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
function row(id:string){
 if(data.version!==1||!isDeepStrictEqual(Object.keys(rows).sort(),['comet-maze','fa-ship','fa-ship-interior','orbit-maze']))throw Error('Navigation revision roster changed');
 return rows[id];
}
/** A finite successor for reviewed portals, their captions and the helm. All
 * other native owners and historical atlas reservations remain unchanged. */
export function navigationProtectedLayers(id:string,prior:TiledLayer[]):TiledLayer[]{
 const r=row(id);if(!r)return prior;
 return prior.map(layer=>{const c=r.layers.find(c=>c.after.name===layer.name);if(!c)return layer;if(sha(layer)!==c.beforeSha256)throw Error('Navigation layer predecessor changed: '+layer.name);return structuredClone(c.after);});
}
export function navigationOwners(id:string,prior:any[]):any[]{
 const r=row(id);if(!r)return prior;
 return prior.map(owner=>{const c=r.layers.find(c=>c.after.name===owner.name);if(!c)return owner;if(owner.bodySha256!==c.beforeSha256)throw Error('Navigation owner predecessor changed: '+owner.name);return{...owner,bodySha256:sha(c.after),source:'world/harbour-navigation.json'};});
}
export function navigationAtlases(id:string):TiledTileset[]{return structuredClone(row(id)?.atlases??[]);}
export function authorNavigationContext(map:TiledMap){
 const id=String(map.properties?.find(p=>p.name==='worldMapId')?.value),r=row(id);if(!r)return;
 for(const c of r.layers){const at=map.layers.findIndex(l=>l.name===c.after.name);if(at<0)throw Error('Navigation owner missing');if(sha(map.layers[at])===sha(c.after))continue;if(sha(map.layers[at])!==c.beforeSha256)throw Error('Navigation author input changed: '+c.after.name);map.layers[at]=structuredClone(c.after);}
 for(const c of r.retiredPaint){const at=map.layers.findIndex(l=>l.name===c.name);if(at<0)continue;if(!/^scenery-(belowAvatar|aboveAvatar)-\d+$/.test(c.name)||sha(map.layers[at])!==c.sha256)throw Error('Navigation retired board paint changed');map.layers.splice(at,1);}
}
