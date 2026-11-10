import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const bytes=readFileSync('tests/fixtures/sponsor-tiers/transitions.json');
assert.equal(createHash('sha256').update(bytes).digest('hex'),'c8c2ed0588009547110e8903fa73c6e31b1ed8e85ab7fbee7ec0ecf5dd6efe9b');
const receipt=JSON.parse(bytes.toString());
/** Admit only the finite sponsor-layout successor, leaving historical pins intact. */
export function sponsorTierSuccessorSha(path:string,pin:string):string{
 const pair=receipt.transitions[path];return pair&&pair[0]===pin?pair[1]:pin;
}
