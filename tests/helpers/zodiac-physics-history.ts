import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {advanceDroneDepthLayout,advanceDroneDepthNative} from './drone-depth-epoch';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
export function beforeZodiacPhysics(){
 const raw=readFileSync('tests/fixtures/zodiac-physics/before.json.gz');assert.equal(sha(raw),'36a7afdbffc1f41255ae081491052c65370affdfd42ddafd57a3f5922a993989','Genuine pre-physics fixture changed');
 const data=JSON.parse(gunzipSync(raw).toString());assert.equal(data.version,1);assert.equal(data.base,'65a2b63d12dd3d99040da1d0da8703bdb1ee84d2');
 return data as {components:Record<string,{raw:string;sha256:string;bytes:number}>;assets:Record<string,string>;protected:Record<string,string>};
}
export function beforePhysicsRaw(path:string):Buffer{const r=beforeZodiacPhysics().components[path];assert.ok(r,'Unknown pre-physics input');assert.equal(Buffer.byteLength(r.raw),r.bytes);assert.equal(sha(r.raw),r.sha256);return Buffer.from(r.raw);}
// The overworld source/native pass the closed, commuting drone-depth transition (tests/helpers/drone-depth-epoch.ts)
// so the current builder can project them; the raw bytes above stay the genuine history.
export const beforePhysicsJson=<T=any>(path:string):T=>{const value=JSON.parse(beforePhysicsRaw(path).toString());return path==='world/layouts/overworld.json'?advanceDroneDepthLayout(value):path==='maps/overworld.tmj'?advanceDroneDepthNative(value):value;};
