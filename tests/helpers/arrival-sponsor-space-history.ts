import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {sponsorTierSuccessorSha} from './sponsor-tier-successor';
const bytes=readFileSync('tests/fixtures/arrival-sponsor-space/transitions.json');
assert.equal(createHash('sha256').update(bytes).digest('hex'),'744ce0aef69b40c3c1deede592a89a25c629055c49bf9bb4fbc66384b64e3632');
const receipt=JSON.parse(bytes.toString());
assert.equal(receipt.base,'2ac477a90b6f8c8a376de70a49b67239b0fca17d');
/** Admit only this finite, independently tested logo-placement successor. */
export function arrivalSponsorSpaceSuccessorSha(path:string,pin:string):string {
  const pair=receipt.transitions[path];
  return sponsorTierSuccessorSha(path,pair && pair[0]===pin ? pair[1] : pin);
}
