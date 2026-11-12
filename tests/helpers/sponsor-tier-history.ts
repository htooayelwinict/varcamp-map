import {beforeExpoRosterNative} from './expo-roster-history';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import data from '../../world/sponsor-tiers.json';
import reception from '../../world/arrival-check-in-expansion.json';
import type {TiledMap} from '../../tools/maps/types';

const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Historical tests replay their original epoch only after verifying the exact new native map. */
export function beforeSponsorTierNative(current:TiledMap):TiledMap{
 current=beforeExpoRosterNative(current);
 if(sha(current)==='8ef2f9655277975b43f864346ef482f4c41c462ea18c6a3cd3b6a6369fa1990d'){
  const logos=readFileSync('tests/fixtures/sponsor-logos/before.json.gz');
  assert.equal(createHash('sha256').update(logos).digest('hex'),'4cdbd8417abf8b5632022536180dfcbec1fe7408e9f5a1674a27c376d1d5bccc');
  current=JSON.parse(gunzipSync(logos).toString()).native;
  assert.equal(sha(current),reception.native.afterSha256,'Unexpected sponsor-logo predecessor map');
 }
 if(sha(current)===reception.native.afterSha256){
  const expanded=readFileSync('tests/fixtures/arrival-check-in/before.json.gz');
  assert.equal(createHash('sha256').update(expanded).digest('hex'),'0854c8ee37bb73d74af6fec9adf6c0b805ea2c32a1a2d70450c5368e7703efd5');
  current=JSON.parse(gunzipSync(expanded).toString())['maps/overworld.tmj'];
  assert.equal(sha(current),reception.native.beforeSha256,'Unexpected reception predecessor map');
 }
 assert.equal(sha(current),data.native.afterSha256,'Unexpected sponsor successor map');
 const bytes=readFileSync('tests/fixtures/sponsor-tiers/before.json.gz');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'aace51d98ba5d1470220d7b265865145341bd9cbd46f999a1d6d8c769ff12037');
 const prior=JSON.parse(gunzipSync(bytes).toString()).native as TiledMap;
 assert.equal(sha(prior),data.native.beforeSha256,'Unexpected sponsor predecessor map');return prior;
}
