import {arrivalSponsorSpaceSuccessorSha} from './arrival-sponsor-space-history';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const bytes=readFileSync('tests/fixtures/event-identity/transitions.json');
assert.equal(createHash('sha256').update(bytes).digest('hex'),'c6e9de195a6efebb7815d74de64d1129afcb0c1c03e8b918099018c8323b08c5');
const receipt=JSON.parse(bytes.toString());
assert.equal(receipt.base,'5de44ff7f79b90fe00242970d98dea930fa68dc5');
const wordmarkBytes=readFileSync('tests/fixtures/pixel-wordmark/transitions.json');
assert.equal(createHash('sha256').update(wordmarkBytes).digest('hex'),'8505ac11a022984bf23c9faa64ed238fdd7af7bbcedc8ff7b582762e898a1653');
const wordmark=JSON.parse(wordmarkBytes.toString());
assert.equal(wordmark.base,'34f52ccb8c43c9683a1e43d7b71750f7601ff34b');
const boldBytes=readFileSync('tests/fixtures/bold-wordmark/transitions.json');
assert.equal(createHash('sha256').update(boldBytes).digest('hex'),'e23d80b7e468a99e6ac71429d21a729894e7968de4ef2c455ac6b8e0f8279414');
const bold=JSON.parse(boldBytes.toString());
assert.equal(bold.base,'4aa4790c7c9ba1fa4478aa9b1287d94cb152ce65');
const alignmentBytes=readFileSync('tests/fixtures/wordmark-alignment/transitions.json');
assert.equal(createHash('sha256').update(alignmentBytes).digest('hex'),'e3300702c70479b83d9fad57b5d8af78219291425a1b1baa6817706dd3e18338');
const alignment=JSON.parse(alignmentBytes.toString());
assert.equal(alignment.base,'598c3b5d0b91729a01bae9e1c9af9c81f3e985c2');
export function eventIdentitySuccessorSha(path:string,pin:string):string {
  const pair=receipt.transitions[path];
  const prior=arrivalSponsorSpaceSuccessorSha(path, pair && pair[0]===pin ? pair[1] : pin);
  const next=wordmark.transitions[path];
  const pixel=next && next[0]===prior ? next[1] : prior;
  const final=bold.transitions[path];
  const boldPin=final && final[0]===pixel ? final[1] : pixel;
  const aligned=alignment.transitions[path];
  return aligned && aligned[0]===boldPin ? aligned[1] : boldPin;
}

export const eventIdentityRegistration={...receipt.registration,files:[...receipt.registration.files,wordmark.fontFile,...bold.fontFiles]};
export function eventIdentityRegistrySuccessor(id:string, record:any):any {
  const next=structuredClone(record);
  if(receipt.registryNotes[id]) next.changes+=receipt.registryNotes[id];
  if(wordmark.registryNotes[id]) next.changes+=wordmark.registryNotes[id];
  if(bold.registryNotes[id]) next.changes+=bold.registryNotes[id];
  if(alignment.registryNotes[id]) next.changes+=alignment.registryNotes[id];
  if(next.files) next.files=next.files.map((r:any)=>({...r,sha256:eventIdentitySuccessorSha(r.path,r.sha256)}));
  return next;
}
