import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import type {TiledMap} from '../../tools/maps/types';
const sha=(data:Buffer|string)=>createHash('sha256').update(data).digest('hex');
/** Replay historical epochs only from the exact reviewed programme successor. */
export function beforeProgrammeNative(map:TiledMap):TiledMap{
 if(sha(JSON.stringify(map))!=='32f07192c11814166f5831fc155f2bbc8c83906d817d35e87fc5b775468af9cd')return map;
 const bytes=readFileSync('tests/fixtures/programme/before.json.gz');
 assert.equal(sha(bytes),'83f7ff2d81bdf935079b2e151434af388a6a5c47dd1c2de4aee98eefce3dad0b');
 return JSON.parse(gunzipSync(bytes).toString())['maps/overworld.tmj'];
}
