import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import data from '../../art/source/park-arcade-refresh.json';
import type {TiledLayer,TiledMap,TiledTileset} from './types';

type Change={beforeSha256:string;after:TiledLayer};
type Row={layers:Change[];atlases:TiledTileset[];retiredPaint:{name:string;sha256:string}[]};
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
function row(id:string):Row|undefined {
 const rows=data.maps as unknown as Record<string,Row>;
 if(data.version!==1||!isDeepStrictEqual(Object.keys(rows).sort(),['nebula-arcade','zodiac-festival-park']))throw Error('Park/arcade revision roster changed');
 const r=rows[id];if(!r)return;
 const allowed=new Set(['physical-collisions','wayfinding-text',...(id==='nebula-arcade'?['exit-plaza-return','exit-branch-return']:[])]);
 if(r.layers.some(l=>!allowed.has(l.after.name))||new Set(r.layers.map(l=>l.after.name)).size!==r.layers.length)throw Error('Park/arcade protected owner roster changed');
 return r;
}
/** Two finite map successors. Saved WAM areas, entries and all other native
 * owners retain their previous identities and bodies. */
export function parkArcadeProtectedLayers(id:string,prior:TiledLayer[]):TiledLayer[] {
 const r=row(id);if(!r)return prior;
 return prior.map(l=>{const c=r.layers.find(c=>c.after.name===l.name);if(!c)return l;if(sha(l)!==c.beforeSha256)throw Error('Park/arcade predecessor changed: '+l.name);return structuredClone(c.after);});
}
export function parkArcadeOwners(id:string,prior:any[]):any[] {
 const r=row(id);if(!r)return prior;
 return prior.map(o=>{const c=r.layers.find(c=>c.after.name===o.name);if(!c)return o;if(o.bodySha256!==c.beforeSha256)throw Error('Park/arcade owner predecessor changed: '+o.name);return{...o,bodySha256:sha(c.after),source:'art/source/park-arcade-refresh.json'};});
}
export function parkArcadeAtlases(id:string):TiledTileset[] {
 const r=row(id);if(!r)return[];
 const images=id==='nebula-arcade'?['../assets/tilesets/original/arcade-screen.png','../assets/tilesets/original/plaza-pots.png']:[
  '../assets/tilesets/lpc-garden/terrain.png','../assets/tilesets/lpc-garden/plants.png',
  '../assets/tilesets/lpc-garden/trees-green.png','../assets/tilesets/original/plaza-lamp.png',
 ];
 if(!isDeepStrictEqual(r.atlases.map(t=>t.image),images))throw Error('Park/arcade atlas roster changed');
 return structuredClone(r.atlases);
}
/** This one existing lamp sheet has a separate, exact park reservation. The
 * fountain and all other plaza-only art remain excluded from side maps. */
export function isParkLampSource(id:string,set:TiledTileset):boolean {
 return id==='zodiac-festival-park'&&set.image==='../assets/tilesets/original/plaza-lamp.png'
  &&/^art-\d+$/.test(set.name??'')&&!set.source&&!set.tiles&&set.tilewidth===32&&set.tileheight===32
  &&set.columns===1&&set.tilecount===3&&set.imagewidth===32&&set.imageheight===96
  &&(set.spacing??0)===0&&(set.margin??0)===0;
}
export function authorParkArcadeContext(map:TiledMap):void {
 const id=String(map.properties?.find(p=>p.name==='worldMapId')?.value),r=row(id);if(!r)return;
 for(const c of r.layers){const at=map.layers.findIndex(l=>l.name===c.after.name);if(at<0)throw Error('Park/arcade owner missing');if(sha(map.layers[at])===sha(c.after))continue;if(sha(map.layers[at])!==c.beforeSha256)throw Error('Park/arcade author input changed: '+c.after.name);map.layers[at]=structuredClone(c.after);}
 for(const c of r.retiredPaint){const at=map.layers.findIndex(l=>l.name===c.name);if(at<0)continue;if(!/^scenery-(belowAvatar|aboveAvatar)-\d+$/.test(c.name)||sha(map.layers[at])!==c.sha256)throw Error('Park/arcade retired scenery changed');map.layers.splice(at,1);}
 map.nextobjectid=Math.max(map.nextobjectid??1,...map.layers.flatMap(l=>l.type==='objectgroup'?l.objects.map(o=>o.id+1):[]));
}
