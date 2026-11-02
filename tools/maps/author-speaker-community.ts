import {readFileSync,writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {SPEAKER_COMMUNITY_MAP_IDS,applySpeakerCommunity} from './speaker-community';
import {renderReferenceInterior} from './reference-interiors';
import {assertCurrentNativeMap} from './current-native';
import {loadTileCatalog} from '../art/catalog';
import type {MapLayout,TiledMap} from './types';

const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const catalog=loadTileCatalog(),writes=new Map<string,string>();
for(const id of SPEAKER_COMMUNITY_MAP_IDS){
 const lp=`world/layouts/${id}.json`,mp=`maps/${id}.tmj`;
 const before=read(lp) as MapLayout,layout=applySpeakerCommunity(before);
 const old=read(mp) as TiledMap,map=renderReferenceInterior(layout,catalog).tmj;
 const removed=new Set(before.images!.filter(i=>!layout.images!.some(a=>a.name===i.name)).map(i=>i.name));
 if(removed.size!==2)throw Error('Expected exactly two community banners');
 const expected=structuredClone(old);
 expected.layers=expected.layers.filter(l=>!removed.has(l.name));
 const panels=before.placements.filter(p=>p.id.endsWith('-style-partner-wallpaper')||p.id.endsWith('-style-partner-rule'));
 if(panels.length!==2||panels.some(p=>catalog[p.sprite].blockingCells.length))throw Error('Community panels must be decorative only');
 const heading=before.signs!.find(s=>s.text==='COMMUNITY PARTNERS');
 if(!heading)throw Error('Community heading missing');
 const panelCells=new Set(panels.flatMap(p=>Array.from({length:p.width*p.height},(_,i)=>(p.y+Math.floor(i/p.width))*old.width+p.x+i%p.width)));
 const scenery=(m:TiledMap)=>m.layers.filter(l=>l.type==='tilelayer'&&l.name.startsWith('scenery-'));
 for(const cell of panelCells){
  const x=cell%old.width,y=Math.floor(cell/old.width);
  const removedGids=new Set(panels.filter(p=>x>=p.x&&x<p.x+p.width&&y>=p.y&&y<p.y+p.height).map(p=>{
   const sprite=catalog[p.sprite],atlas=old.tilesets.find(t=>t.image==='../'+sprite.sheet)!;
   return atlas.firstgid+(sprite.rect.y+(y-p.y)%sprite.rect.height)*atlas.columns!+sprite.rect.x+(x-p.x)%sprite.rect.width;
  }));
  const stack=(m:TiledMap)=>scenery(m).flatMap(l=>l.type==='tilelayer'&&l.data[cell]?[l.data[cell]]:[]);
  if(!isDeepStrictEqual(stack(old).filter(gid=>!removedGids.has(gid)),stack(map)))throw Error(id+': non-banner artwork changed inside the panel');
  // Existing decor can move to a lower paint layer once its backdrop is gone.
  for(const layer of scenery(expected))if(layer.type==='tilelayer'){
   const actual=map.layers.find(l=>l.name===layer.name);
   if(actual?.type!=='tilelayer')throw Error('Unrelated scenery layer retired');
   layer.data[cell]=actual.data[cell];
  }
 }
 let objectId=1;
 for(const layer of expected.layers){
  if(layer.type==='objectgroup'){
   layer.objects=layer.objects.filter(o=>o.name!==heading.name);
   for(const object of layer.objects)object.id=objectId++;
  }
 }
 expected.nextobjectid=objectId;
 expected.layers.forEach((l,i)=>l.id=i+1);expected.nextlayerid=expected.layers.length+1;
 expected.tilesets=expected.tilesets.filter(t=>!removed.has(t.name!));
 if(!isDeepStrictEqual(map,expected))throw Error(id+': unrelated native data changed');
 assertCurrentNativeMap(id,map,layout,read(`maps/${id}.wam`),catalog);
 writes.set(lp,JSON.stringify(layout,null,2)+'\n');writes.set(mp,JSON.stringify(map)+'\n');
}
for(const[path,value]of writes)writeFileSync(path,value);
console.log('Removed community logos, headings and empty display panels from each zodiac room. Hall banners, furniture, physics and saved WAMs unchanged.');
