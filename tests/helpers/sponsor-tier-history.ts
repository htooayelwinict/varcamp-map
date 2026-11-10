import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import data from '../../world/sponsor-tiers.json';
import type {TiledMap} from '../../tools/maps/types';

const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Historical tests replay their original epoch only after verifying the exact new native map. */
export function beforeSponsorTierNative(current:TiledMap):TiledMap{
 assert.equal(sha(current),data.native.afterSha256,'Unexpected sponsor successor map');
 const bytes=readFileSync('tests/fixtures/sponsor-tiers/before.json.gz');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'aace51d98ba5d1470220d7b265865145341bd9cbd46f999a1d6d8c769ff12037');
 const prior=JSON.parse(gunzipSync(bytes).toString()).native as TiledMap;
 assert.equal(sha(prior),data.native.beforeSha256,'Unexpected sponsor predecessor map');return prior;
}
