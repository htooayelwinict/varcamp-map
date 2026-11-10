import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const bytes=readFileSync('tests/fixtures/sponsor-tiers/transitions.json');
assert.equal(createHash('sha256').update(bytes).digest('hex'),'6860702578963bf115ff89a3c7d0ec26f97576898b0c0a8689ecdf46bce1888f');
const receipt=JSON.parse(bytes.toString());
/** Admit only the finite sponsor-layout successor, leaving historical pins intact. */
export function sponsorTierSuccessorSha(path:string,pin:string):string{
 const pair=receipt.transitions[path];return pair&&pair[0]===pin?pair[1]:pin;
}
