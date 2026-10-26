import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {advanceDroneDepthLayout,advanceDroneDepthNative} from './drone-depth-epoch';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
export function beforeZodiac(){
 const raw=readFileSync('tests/fixtures/zodiac-exteriors/before.json.gz');
 assert.equal(sha(raw),'09987d3fc6bf5c1ff15753caf92f441136c30cf84f4aea392b80adce30948dc8','Genuine pre-exterior fixture changed');
 const data=JSON.parse(gunzipSync(raw).toString());assert.equal(data.version,1);assert.equal(data.base,'340f11532d32eb490576f75e86bef9adf36e3057');
 assert.deepEqual(Object.keys(data.components),['world/layouts/overworld.json','maps/overworld.tmj','maps/overworld.wam','art/tile-catalog.json','art/sources.json']);
 return data as {components:Record<string,{raw:string;sha256:string;bytes:number}>;assets:Record<string,string>};
}
export function beforeZodiacRaw(path:string):Buffer{
 const r=beforeZodiac().components[path];assert.ok(r,'Unknown pre-exterior input');
 assert.equal(Buffer.byteLength(r.raw),r.bytes);assert.equal(sha(r.raw),r.sha256);return Buffer.from(r.raw);
}
// The overworld source/native pass the closed, commuting drone-depth transition (tests/helpers/drone-depth-epoch.ts)
// so the current builder can project them; the raw bytes above stay the genuine history.
export const beforeZodiacJson=<T=any>(path:string):T=>{const value=JSON.parse(beforeZodiacRaw(path).toString());return path==='world/layouts/overworld.json'?advanceDroneDepthLayout(value):path==='maps/overworld.tmj'?advanceDroneDepthNative(value):value;};
export function approvedZodiacRegistry(){
 const raw=readFileSync('tests/fixtures/zodiac-exteriors/source-registration.json');
 assert.equal(sha(raw),'db9166a8eac3d1b51c8bbda43040544defe1bac60e28903c8d21953f70378078','Reviewed zodiac art registration changed');return JSON.parse(raw.toString());
}
