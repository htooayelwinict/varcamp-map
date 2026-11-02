import {beforeExpoChairCatalog,restoreExpoChairNative} from '../../tools/maps/expo-chair-physics';
import {cafeArrivalSuccessorSha} from './cafe-arrival-history';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {applyVibeCodeBranding,restoreVibeCodeBranding,reconcileVibeCodeBranding} from '../../tools/maps/vibecode-branding';
import {loadTileCatalog} from '../../tools/art/catalog';
import {renderReferenceInterior} from '../../tools/maps/reference-interiors';
import type {MapLayout,TiledMap} from '../../tools/maps/types';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');let saved:any;
export function beforeVibeCode(){if(saved)return saved;const b=readFileSync('tests/fixtures/vibecode/before.json.gz');assert.equal(sha(b),'72b7c42fb448dce358ad8491df31f136704209cac95f3f0d24f569b9410cc11f');saved=JSON.parse(gunzipSync(b).toString());assert.equal(saved.base,'5c57fb4385d13300f6472516708d520e2d71092a');return saved;}
export function beforeVibeCodeJson<T=any>(p:string):T{const r=beforeVibeCode().components[p];assert.ok(r);assert.equal(sha(Buffer.from(r.raw)),r.sha256);return JSON.parse(r.raw);}
export function vibeCodeSuccessorSha(p:string,pin:string):string{const t=JSON.parse(readFileSync('tests/fixtures/vibecode/transitions.json','utf8'));assert.equal(t.base,beforeVibeCode().base);const pair=t.transitions[p];if(!pair||pair[0]!==pin)return cafeArrivalSuccessorSha(p,pin);assert.equal(pair[0],beforeVibeCode().pins[p]);return cafeArrivalSuccessorSha(p,pair[1]);}
export function preVibeCodeLayout(l:MapLayout):MapLayout{return l.images?.some(i=>i.image==='assets/sponsors/vibecode-tours.png')?restoreVibeCodeBranding(l):structuredClone(l);}
const cache=new Map<string,TiledMap>();
export function preVibeCodeNative(map:TiledMap):TiledMap{
 if(!map.tilesets.some(t=>t.image==='../assets/sponsors/vibecode-tours.png'))return structuredClone(map);
 const id=String(map.properties?.find(p=>p.name==='worldMapId')?.value),old=beforeVibeCodeJson<TiledMap>(`maps/${id}.tmj`);
 if(id==='overworld')map=restoreExpoChairNative(map,JSON.parse(readFileSync('world/layouts/overworld.json','utf8')),loadTileCatalog());
 if(!cache.has(id)){const l=applyVibeCodeBranding(beforeVibeCodeJson<MapLayout>(`world/layouts/${id}.json`)),c=beforeExpoChairCatalog(loadTileCatalog());cache.set(id,id==='overworld'?reconcileVibeCodeBranding(old,l,c):renderReferenceInterior(l,c).tmj);}
 // A native map contains millions of repeated cells. Node's automatic deep
 // assertion diff can exhaust host memory for a stale historical epoch.
 // Keep the exact comparison, but report only the map identity on failure.
 assert.ok(isDeepStrictEqual(map,cache.get(id)),`exact Vibe Code native successor required: ${id}`);return old;
}
