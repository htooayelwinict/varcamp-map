import {createHash} from 'node:crypto';
import data from '../../world/sponsor-tiers.json';
import type {TiledMap,TiledLayer,ObjectLayer} from './types';

const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const active=(source:TiledMap)=>source.properties?.some(p=>p.name==='worldMapId'&&p.value==='overworld')&&source.layers.some(l=>l.type==='objectgroup'&&l.name==='wayfinding-text'&&l.objects.some(o=>o.name==='sponsor-tier-main-name'));

/** The pinned renderer aligns intrinsic lines, not the Tiled text rectangle.
 * Position these five single-line captions explicitly, retaining room to wrap
 * up to the original right edge and preserving every other text object. */
export function centerSponsorTierCaptions(layer:ObjectLayer):ObjectLayer{
 const result=structuredClone(layer),seen=new Set<string>();
 for(const {name,pixels} of data.native.captionInsets){
  const matches=result.objects.filter(o=>o.name===name);
  if(seen.has(name)||matches.length!==1||!Number.isInteger(pixels)||pixels<0||pixels>=matches[0].width)throw Error('Invalid sponsor caption inset: '+name);
  seen.add(name);matches[0].x+=pixels;matches[0].width-=pixels;
 }
 return result;
}

/** The existing label layer receives only the reviewed sponsor captions; controls retain their IDs. */
export function sponsorTierProtectedLayers(prior:TiledLayer[],source:TiledMap):TiledLayer[]{
 if(!active(source))return prior;
 const sourceLabels=centerSponsorTierCaptions(source.layers.find(l=>l.name===data.native.layer.after.name) as ObjectLayer);
 const bodies=(l:ObjectLayer)=>l.objects.map(o=>({...o,id:0}));
 // Native JSON omits optional undefined text fields; compare the serialized bodies.
 if(sha(bodies(sourceLabels))!==sha(bodies(data.native.layer.after as ObjectLayer)))throw Error('Sponsor label source differs from reviewed geometry');
 return prior.map(l=>{
  if(l.name!==data.native.layer.after.name)return l;
  if(sha(l)!==data.native.layer.beforeSha256)throw Error('Sponsor label predecessor changed');
  return structuredClone(data.native.layer.after) as ObjectLayer;
 });
}
export function authorSponsorTierContext(map:TiledMap,source:TiledMap):void{
 if(!active(source))return;
 const at=map.layers.findIndex(l=>l.name===data.native.layer.after.name);
 if(at<0||![data.native.layer.beforeSha256,sha(data.native.layer.after)].includes(sha(map.layers[at])))throw Error('Sponsor label author input changed');
 map.layers[at]=structuredClone(data.native.layer.after) as ObjectLayer;
 map.nextobjectid=Math.max(map.nextobjectid??1,...map.layers.flatMap(l=>l.type==='objectgroup'?l.objects.map(o=>o.id+1):[]));
}
