import{readFileSync}from'node:fs';
import{describe,expect,it}from'vitest';
import{createHash}from'node:crypto';
import{loadTileCatalog}from'../tools/art/catalog';
import{SIGN_IDS}from'../src/world/catalog';
import{assertNativeReferenceInterior,renderReferenceInterior}from'../tools/maps/reference-interiors';
import type{MapLayout,TiledMap,WamFile}from'../tools/maps/types';
const ids=[...SIGN_IDS.map(s=>`speaker-${s}`),'solar-hall','lunar-hall'];
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const data=(id='speaker-aries')=>({layout:read(`world/layouts/${id}.json`)as MapLayout,map:read(`maps/${id}.tmj`)as TiledMap,wam:read(`maps/${id}.wam`)as WamFile,catalog:loadTileCatalog()});
const check=(a:ReturnType<typeof data>)=>assertNativeReferenceInterior(a.map,a.layout,a.catalog,a.wam);
const regenerate=(a:ReturnType<typeof data>)=>{a.map=renderReferenceInterior(a.layout,a.catalog).tmj;};
describe('closed current14 interior source/native/WAM contract',()=>{
 it('retains the independent historical functional baseline in the production contract',()=>{const raw=readFileSync('tests/fixtures/interior-reference/before-functions.json'),before=JSON.parse(raw.toString()),contract=read('world/interior-reference-contract.json');expect(Object.keys(contract.maps).sort()).toEqual(ids.slice().sort());expect(contract.historicalFunctionalSource.sha256).toBe(createHash('sha256').update(raw).digest('hex'));for(const id of ids)expect(contract.maps[id].functional).toEqual(before[id]);});
 for(const id of ids)it(`${id}: accepts the actual source and saved native/WAM pair`,()=>expect(()=>check(data(id))).not.toThrow());
 it.each(['audience-seats','all-furnishings','one-sofa','own-crest','motion-families'])('rejects omitted %s even after the native map is regenerated to match',kind=>{
  const a=data();if(kind==='audience-seats')a.layout.placements=a.layout.placements.filter(p=>!p.id.startsWith('seat-')&&!p.id.startsWith('audience-chair-'));if(kind==='all-furnishings'){a.layout.placements=a.layout.placements.filter(p=>!p.sprite.startsWith('interior-ref-')&&!p.sprite.startsWith('zodiac-emblem-'));a.layout.animatedOverlays=[];}
  if(kind==='one-sofa')a.layout.placements=a.layout.placements.filter(p=>p.sprite!=='interior-ref-sofa');
  if(kind==='own-crest')a.layout.placements=a.layout.placements.filter(p=>!p.sprite.startsWith('zodiac-emblem-'));
  if(kind==='motion-families')a.layout.animatedOverlays=[];
  regenerate(a);expect(()=>check(a)).toThrow(/Interior|Vibe Code branding: unreviewed source layout|Event presentation: unreviewed source layout/);
 });
 it.each(['wrong-crest','motion-clock','blocking-crest','native-cell','foreground','title','collision','layout-rights','layout-exit','saved-wam-rights','saved-wam-geometry','saved-wam-missing','extra-duplicate-id','extra-duplicate-name','extra-duplicate-control','extra-duplicate-property'])('rejects %s without hiding the defect in renderer/metadata checks',kind=>{
  const a=data(kind==='layout-rights'?'solar-hall':'speaker-aries');
  if(kind==='wrong-crest'){a.layout.placements.find(p=>p.id==='interior-ref-zodiac-floor-crest')!.sprite='zodiac-emblem-taurus';regenerate(a);}
  if(kind==='motion-clock')a.layout.animatedOverlays![0].animations[0].frames[0].duration+=750;
  if(kind==='blocking-crest'){a.catalog['zodiac-emblem-aries'].blockingCells=[[0,0]];regenerate(a);}
  if(kind==='native-cell'){const layer=a.map.layers.find(l=>l.name==='terrain');if(layer?.type!=='tilelayer')throw Error('Missing actual terrain');layer.data[0]=0;}
  if(kind==='foreground'){const i=a.map.layers.findIndex(l=>l.name==='interior-ambient-plant');a.map.layers.push(a.map.layers.splice(i,1)[0]);}
  if(kind==='title'){const layer=a.map.layers.find(l=>l.type==='objectgroup'&&l.objects.some(o=>o.name==='scene-title'));if(layer?.type!=='objectgroup')throw Error('Missing title');(layer.objects.find(o=>o.name==='scene-title')!.text as {bold:boolean}).bold=false;}
  if(kind==='collision'){const layer=a.map.layers.find(l=>l.name==='physical-collisions');if(layer?.type!=='tilelayer')throw Error('Missing mask');layer.data[30*a.map.width+17]=layer.data.find(g=>g>0)!;}
  if(kind==='layout-rights')a.layout.areas[0].properties=[];
  if(kind==='layout-exit')a.layout.exits[0].destination='moon-cafe';
  if(kind==='saved-wam-rights')a.wam.areas[0].properties=[];
  if(kind==='saved-wam-geometry')a.wam.areas[0].width--;
  if(kind==='saved-wam-missing')a.wam.areas.shift();
  if(kind==='extra-duplicate-id')a.wam.areas.push(structuredClone(a.wam.areas[0]));
  if(kind==='extra-duplicate-name')a.wam.areas.push({...structuredClone(a.wam.areas[0]),id:'extra-area',properties:[]});
  if(kind==='extra-duplicate-control')a.wam.areas.push({...structuredClone(a.wam.areas[0]),id:'extra-area',name:'Extra area',properties:[{...structuredClone(a.wam.areas[0].properties[0]),id:'new-owner'}]});
  if(kind==='extra-duplicate-property')a.wam.areas.push({...structuredClone(a.wam.areas[0]),id:'extra-area',name:'Extra area',properties:[{...structuredClone(a.wam.areas[0].properties[0]),roomName:'extra-unique-room'}]});
  expect(()=>check(a)).toThrow(/Interior|Vibe Code branding: unreviewed source layout|Event presentation: unreviewed source layout/);
 });
 it('rejects a new obstruction on a protected route even when source/native parity is valid',()=>{
  const a=data();a.layout.placements.push({id:'new-route-obstruction',sprite:'interior-ref-cabinet',layer:'scenery',x:17,y:28,width:2,height:3});regenerate(a);expect(()=>check(a)).toThrow(/Interior.*route|Vibe Code branding: unreviewed source layout|Event presentation: unreviewed source layout/);
 });
 it('preserves independent valid editor entities and extra areas without writes',()=>{
  const a=data();a.wam.entities['editor-object']={x:96,y:96,prefabRef:{collectionName:'Office',id:'independent-decoration'}};a.wam.areas.push({id:'editor-extra-area',name:'Editor quiet corner',visible:true,x:32,y:32,width:32,height:32,properties:[{id:'editor-extra-silent',type:'silent'}]});const before=structuredClone(a);expect(()=>check(a)).not.toThrow();expect(a).toEqual(before);
 });
});
