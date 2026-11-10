import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const bytes=readFileSync('tests/fixtures/sponsor-tiers/transitions.json');
assert.equal(createHash('sha256').update(bytes).digest('hex'),'a804f705c2d46084a9be375429f4542a35179a2d6dba286a602e3f8670b9455f');
const receipt=JSON.parse(bytes.toString());
/** Admit only the finite sponsor-layout successor, leaving historical pins intact. */
export function sponsorTierSuccessorSha(path:string,pin:string):string{
 const pair=receipt.transitions[path];return pair&&pair[0]===pin?pair[1]:pin;
}
