import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import * as consumer from '../tools/maps/plaza-native';
import {loadTileCatalog} from '../tools/art/catalog';
const fixture=()=>({layout:JSON.parse(readFileSync('world/layouts/overworld.json','utf8')),map:JSON.parse(readFileSync('maps/overworld.tmj','utf8')),catalog:loadTileCatalog()});
it('checks the actual current plaza through a normal-build source/native consumer',()=>{
 expect((consumer as any).assertNativePlaza).toBeTypeOf('function');const f=fixture();(consumer as any).assertNativePlaza(f.map,f.layout,f.catalog);
});
it.each(['all-source-missing','building-source-missing','crest-missing','renamed-layout','missing-native-identity','wrong-terrain','wrong-collision','lowered-canopy','raised-logo','wrong-drone-clock','missing-drone','extra-native-layer','moved-entry'])('rejects current plaza %s without a source-presence opt-out',kind=>{
 const f=fixture();if(kind==='all-source-missing')f.layout.placements=[];
 if(kind==='building-source-missing')f.layout.placements=f.layout.placements.filter((p:any)=>!p.id.endsWith('-building'));
 if(kind==='crest-missing')f.layout.placements=f.layout.placements.filter((p:any)=>p.id!=='aries-zodiac-threshold');
 if(kind==='renamed-layout')f.layout.id='star-garden';
 if(kind==='missing-native-identity')f.map.properties=f.map.properties.filter((p:any)=>p.name!=='worldMapId');
 if(kind==='wrong-terrain')f.map.layers.find((p:any)=>p.name==='terrain').data[64*128+64]++;
 if(kind==='wrong-collision')f.map.layers.find((p:any)=>p.name==='physical-collisions').data[64*128+64]=1;
 if(kind==='lowered-canopy')f.catalog['plaza-tree-round'].upperCells=[];
 if(kind==='raised-logo'){const i=f.map.layers.findIndex((p:any)=>p.name==='Expo / VarCamp');expect(i).toBeGreaterThanOrEqual(0);f.map.layers.push(f.map.layers.splice(i,1)[0]);}
 if(kind==='wrong-drone-clock')f.map.tilesets.find((p:any)=>p.name.startsWith('plaza-drone-')).tiles[0].animation[0].duration++;
 if(kind==='missing-drone')f.map.layers=f.map.layers.filter((p:any)=>p.name!=='plaza-drone-00');
 if(kind==='extra-native-layer'){const extra=structuredClone(f.map.layers.find((p:any)=>p.name==='plaza-drone-00'));extra.name='unapproved-extra';extra.id=999;f.map.layers.push(extra);}
 if(kind==='moved-entry'){const entry=f.map.layers.find((p:any)=>p.name==='welcome');const i=entry.data.findIndex(Boolean);entry.data[i+3]=entry.data[i];entry.data[i]=0;}
 expect(()=>{expect((consumer as any).assertNativePlaza).toBeTypeOf('function');(consumer as any).assertNativePlaza(f.map,f.layout,f.catalog);}).toThrow();
});
