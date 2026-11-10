import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const bytes=readFileSync('tests/fixtures/sponsor-tiers/transitions.json');
assert.equal(createHash('sha256').update(bytes).digest('hex'),'3b872dbd4f7dd9605acea257a45bce8ec270d4270addc53b25f5db7666726247');
const receipt=JSON.parse(bytes.toString());
/** Admit only the finite sponsor-layout successor, leaving historical pins intact. */
export function sponsorTierSuccessorSha(path:string,pin:string):string{
 const pair=receipt.transitions[path];return pair&&pair[0]===pin?pair[1]:pin;
}
