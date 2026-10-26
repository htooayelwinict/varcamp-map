import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {advanceDroneDepthLayout,advanceDroneDepthNative} from './drone-depth-epoch';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
export function beforeHallExteriors(){
 const raw=readFileSync('tests/fixtures/hall-exteriors/before.json.gz');
 assert.equal(sha(raw),'31c9ee3e4a9b3fab2b1ca13cd51024768ccd2453e7c90fed38124c92664f1e27','Genuine pre-hall-exterior fixture changed');
 const data=JSON.parse(gunzipSync(raw).toString());assert.equal(data.version,1);assert.equal(data.base,'c44dd4579544010b049afda6f95f11c1a48be335');
 return data as {components:Record<string,{raw:string;sha256:string;bytes:number}>;assets:Record<string,string>;nativeMaps:Record<string,string>;wams:Record<string,string>};
}
export function beforeHallRaw(path:string):Buffer{const r=beforeHallExteriors().components[path];assert.ok(r,'Unknown pre-hall input');assert.equal(Buffer.byteLength(r.raw),r.bytes);assert.equal(sha(r.raw),r.sha256);return Buffer.from(r.raw);}
// The overworld source/native pass the closed, commuting drone-depth transition (tests/helpers/drone-depth-epoch.ts)
// so the current builder can project them; the raw bytes above stay the genuine history.
export const beforeHallJson=<T=any>(path:string):T=>{const value=JSON.parse(beforeHallRaw(path).toString());return path==='world/layouts/overworld.json'?advanceDroneDepthLayout(value):path==='maps/overworld.tmj'?advanceDroneDepthNative(value):value;};
export function approvedHallRegistry(){const raw=readFileSync('tests/fixtures/hall-exteriors/source-registration.json');assert.equal(sha(raw),'62da0237b5fb686c3ea45a5881a0eefd0a3afb8222d7703ad3574674f4ec60ae','Reviewed hall registration changed');return JSON.parse(raw.toString());}
