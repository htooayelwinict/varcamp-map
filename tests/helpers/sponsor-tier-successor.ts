import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const bytes=readFileSync('tests/fixtures/sponsor-tiers/transitions.json');
assert.equal(createHash('sha256').update(bytes).digest('hex'),'a3007e915f0c4d621f9ae651cc56bd79bd9db06e4d5344eea3fadbc335bf0ec2');
const receipt=JSON.parse(bytes.toString());
/** Admit only the finite sponsor-layout successor, leaving historical pins intact. */
export function sponsorTierSuccessorSha(path:string,pin:string):string{
 const pair=receipt.transitions[path];return pair&&pair[0]===pin?pair[1]:pin;
}
