import {preVibeCodeNative} from './helpers/vibecode-history';
import {vibeCodeSuccessorSha} from './helpers/vibecode-history';
import {readFileSync} from 'node:fs';
import {preSpacingLayout} from './helpers/expo-spacing-history';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import sharp from 'sharp';
import {it,expect} from 'vitest';
import {PATROL_IDS} from '../tools/maps/patrol-roles';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertNativePlaza} from '../tools/maps/plaza-native';
import type {MapLayout,TiledMap,TileLayer} from '../tools/maps/types';
const read=<T=any>(p:string):T=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const baseline=()=>JSON.parse(gunzipSync(readFileSync('tests/fixtures/plaza-patrol/before.json.gz')).toString());
it('removes the photographed white table at52,67 and leaves its actual tile walkable',()=>{
 const l=read<MapLayout>('world/layouts/overworld.json'),m=read<TiledMap>('maps/overworld.tmj');
 expect(l.placements.some(p=>p.id==='welcome-table')).toBe(false);
 expect((m.layers.find(l=>l.name==='physical-collisions') as TileLayer).data[67*128+52]).toBe(0);
 const old=JSON.parse(baseline().components['world/layouts/overworld.json'].raw);
 expect(preSpacingLayout(l).placements).toEqual(old.placements.filter((p:any)=>p.id!=='welcome-table'));
});
it('adds six travelling camera patrols above every old layer, preserving the89old atlas bodies',()=>{
 const m=preVibeCodeNative(read<TiledMap>('maps/overworld.tmj')),l=read<MapLayout>('world/layouts/overworld.json'),old=JSON.parse(baseline().components['maps/overworld.tmj'].raw);
 expect(m.tilesets.slice(0,89)).toEqual(old.tilesets);expect(m.tilesets).toHaveLength(100);
 expect(m.layers.slice(-6).map(l=>l.name)).toEqual(PATROL_IDS);
 for(const id of PATROL_IDS){const o=l.animatedOverlays!.find(o=>o.name===id)!;expect(o.level).toBe('aboveScenery');
  const meta=read(`art/source/${id}.json`),points=meta.track.samples as {x:number;y:number;pose:number}[];
  expect(new Set(points.map(p=>`${p.x},${p.y}`)).size).toBeGreaterThan(120);
  expect(Math.max(...points.map(p=>Math.max(p.x,p.y)))).toBeGreaterThan(350);
  for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];expect(Math.hypot(b.x-a.x,b.y-a.y)).toBeLessThan(24);}
  const set=m.tilesets.find(t=>t.name===id)!;expect(set.tiles!.every(t=>t.properties!.some(p=>p.name==='collides'&&p.value===false))).toBe(true);
 }
});
it('prints every MYANMAR2026 glyph beneath the aligned wordmark at native pixel scale',async()=>{
 const rgba=Buffer.alloc(384*128*4);
 for(const[i,key]of ['nw','ne','sw','se'].entries()){const b=await sharp(`assets/sponsors/varcamp-arrival-${key}.png`).ensureAlpha().raw().toBuffer();for(let y=0;y<64;y++)b.copy(rgba,((Math.floor(i/2)*64+y)*384+i%2*192)*4,y*192*4,(y+1)*192*4);}
 const glyphs=read('art/source/hub-nameplates.json').glyphs,text='MYANMAR 2026',left=138;
 for(const[i,c]of [...text].entries())for(let y=0;y<7;y++)for(let x=0;x<5;x++)for(let sy=0;sy<2;sy++)for(let sx=0;sx<2;sx++){
  const offset=((80+y*2+sy)*384+left+i*16+x*2+sx)*4;
  if(glyphs[c][y][x]==='1')expect([...rgba.subarray(offset,offset+4)],c+' native subtitle pixel').toEqual([255,255,255,255]);
  else expect(rgba[offset+3],c+' transparent glyph space').toBe(0);
 }
});
it('the actual native carrier frames show one visible24px camera moving around each complete loop',async()=>{
 const m=read<TiledMap>('maps/overworld.tmj'),layout=read<MapLayout>('world/layouts/overworld.json');
 for(const name of PATROL_IDS){
  const o=layout.animatedOverlays!.find(o=>o.name===name)!,set=m.tilesets.find(t=>t.name===name)!,layer=m.layers.find(l=>l.name===name) as TileLayer;
  const {data,info}=await sharp(o.image).ensureAlpha().raw().toBuffer({resolveWithObject:true}),centres:number[][]=[];
  for(const time of [0,8000,16000,24000]){
   const visible:number[][]=[];
   for(let y=0;y<o.height;y++)for(let x=0;x<o.width;x++){
    const gid=layer.data[(o.y+y)*128+o.x+x],def=set.tiles!.find(t=>t.id===gid-set.firstgid)!;let remaining=time,frame=def.animation![0];
    for(const candidate of def.animation!){frame=candidate;if(remaining<candidate.duration)break;remaining-=candidate.duration;}
    const sx=frame.tileid%set.columns!*32,sy=Math.floor(frame.tileid/set.columns!)*32;
    for(let py=0;py<32;py++)for(let px=0;px<32;px++)if(data[((sy+py)*info.width+sx+px)*4+3]>=192)visible.push([x*32+px,y*32+py]);
   }
   expect(visible.length,name+' opaque camera pixels').toBeGreaterThan(70);
   const left=Math.min(...visible.map(p=>p[0])),right=Math.max(...visible.map(p=>p[0])),top=Math.min(...visible.map(p=>p[1])),bottom=Math.max(...visible.map(p=>p[1]));
   expect(right-left+1).toBeLessThanOrEqual(24);expect(bottom-top+1).toBeLessThanOrEqual(24);centres.push([(left+right)/2,(top+bottom)/2]);
  }
  expect(Math.max(...centres.flatMap(a=>centres.map(b=>Math.hypot(a[0]-b[0],a[1]-b[1])))),name+' actual visible movement').toBeGreaterThan(270);
 }
});
it('preserves every earlier media file except the four explicitly updated arrival logo quadrants',()=>{
 const b=baseline();for(const[p,pin]of Object.entries({...b.assets,...b.protected}))if(!/^assets\/sponsors\/varcamp-arrival-(nw|ne|sw|se)\.png$/.test(p))expect(sha(readFileSync(p)),p).toBe(vibeCodeSuccessorSha(p,String(pin)));
});
it('requires the patrol family and table removal even after coherent source/native omissions',()=>{
 const l=read<MapLayout>('world/layouts/overworld.json'),m=read<TiledMap>('maps/overworld.tmj');
 l.animatedOverlays=l.animatedOverlays!.filter(o=>!o.name.startsWith('plaza-patrol-'));m.layers=m.layers.filter(l=>!l.name.startsWith('plaza-patrol-'));
 expect(()=>assertNativePlaza(m,l,loadTileCatalog())).toThrow(/Plaza patrol|Expo spacing|Fountain motion|Leo lion head|Hall buildings|Plaza crescent|Plaza landscape|Vibe Code branding/);
});
