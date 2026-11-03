import {navigationOwners} from './harbour-navigation-context';
import {parkArcadeOwners} from './park-arcade-context';
import {playgroundOwners} from './playground-context';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import type{MapLayout,TiledMap,TiledLayer,TiledTileset}from'./types';
import type{TileCatalog}from'../art/catalog';
import{cafeArrivalOwners}from'./cafe-arrival-context';
import{mazeGateOwners}from'./maze-gate-context';
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Navigation uses a separate reserved GID range even when its one tile comes
 * from the same magic.png as ordinary art. Image identity alone is ambiguous. */
export function ambientAtlasKey(t:TiledTileset):string{if(t.name==='navigation-mask')return'navigation-mask';if(!t.image||t.source)throw Error('World ambient native atlas must have one embedded source image');return'image:'+t.image;}
/** One closed ownership boundary for all17 native scenes. Historical projection
 * retirement is proof-driven; layer names alone never authorize deleting data. */
export function validateAmbientOwnership(map:TiledMap,layout:MapLayout,catalog:TileCatalog,intended:TiledMap,retireHistorical=false):TiledLayer[]{
 const registry=JSON.parse(readFileSync('art/source/world-ambient-layer-ownership.json','utf8')).maps[layout.id];if(!registry)throw Error('World ambient ownership registry missing');
 const oldOwners=registry.protectedLayers;
 const precedingOwners=cafeArrivalOwners(layout.id,oldOwners);
 registry.protectedLayers=playgroundOwners(layout.id,parkArcadeOwners(layout.id,navigationOwners(layout.id,mazeGateOwners(layout.id,precedingOwners))));
 const names=new Set<string>(),ids=new Set<number>();for(const l of map.layers){if(names.has(l.name)||ids.has(l.id))throw Error('World ambient duplicate layer/producer ownership');names.add(l.name);ids.add(l.id);}
 for(const p of registry.protectedLayers){const found=map.layers.filter(l=>l.name===p.name),priors=[oldOwners,precedingOwners].map(owners=>owners.find((o:any)=>o.name===p.name));if(retireHistorical&&priors.some(old=>(!old&&!found.length)||(old&&found.length===1&&sha(found[0])===old.bodySha256)))continue;if(found.length!==1||sha(found[0])!==p.bodySha256)throw Error('World ambient protected native ownership changed: '+p.name);}
 const sceneNames=new Set([...registry.sourceSceneLayers,...intended.layers.filter(l=>/^scenery-(belowAvatar|aboveAvatar)-[0-9]+$/.test(l.name)||l.name==='terrain').map(l=>l.name)]),overlayNames=new Set((layout.animatedOverlays??[]).map(o=>o.name)),retired=new Set<string>();
 for(const layer of map.layers){if(registry.protectedLayers.some((p:any)=>p.name===layer.name)||sceneNames.has(layer.name)||overlayNames.has(layer.name))continue;
  const old=registry.retiredProjections.find((p:any)=>p.layer===layer.name);if(!old||!retireHistorical)throw Error('World ambient unknown or retired native ownership: '+layer.name);
  if(layer.type!=='tilelayer'||sha(layer)!==old.layerSha256)throw Error('World ambient retired source projection body changed: '+layer.name);
  let cells=0;const witnessed=new Set<string>();for(let i=0;i<layer.data.length;i++)if(layer.data[i]){cells++;const gid=layer.data[i],x=i%map.width,y=Math.floor(i/map.width),set=map.tilesets.find(t=>gid>=t.firstgid&&gid<t.firstgid+t.tilecount!);if(!set?.image||!set.columns)throw Error('World ambient retired atlas ownership missing');
   const owners=layout.placements.filter(p=>p.layer!=='terrain'&&x>=p.x&&x<p.x+p.width&&y>=p.y&&y<p.y+p.height).filter(p=>{const s=catalog[p.sprite];return!!s&&'../'+s.sheet===set.image&&(s.rect.y+(y-p.y)%s.rect.height)*set.columns!+s.rect.x+(x-p.x)%s.rect.width===gid-set.firstgid;});
   if(owners.length!==1||!old.sourcePlacementIds.includes(owners[0].id))throw Error('World ambient ambiguous retired source ownership: '+layer.name);witnessed.add(owners[0].id);
  }
  if(cells!==old.cells||witnessed.size!==old.sourcePlacementIds.length)throw Error('World ambient incomplete retired source ownership: '+layer.name);retired.add(layer.name);
 }
 return map.layers.filter(l=>!retired.has(l.name));
}
