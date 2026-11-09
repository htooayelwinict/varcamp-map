import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const bytes=readFileSync('tests/fixtures/event-identity/transitions.json');
assert.equal(createHash('sha256').update(bytes).digest('hex'),'c6e9de195a6efebb7815d74de64d1129afcb0c1c03e8b918099018c8323b08c5');
const receipt=JSON.parse(bytes.toString());
assert.equal(receipt.base,'5de44ff7f79b90fe00242970d98dea930fa68dc5');
export function eventIdentitySuccessorSha(path:string,pin:string):string {
  const pair=receipt.transitions[path];
  return pair && pair[0]===pin ? pair[1] : pin;
}

export const eventIdentityRegistration=receipt.registration;
export function eventIdentityRegistrySuccessor(id:string, record:any):any {
  const next=structuredClone(record);
  if(receipt.registryNotes[id]) next.changes+=receipt.registryNotes[id];
  if(next.files) next.files=next.files.map((r:any)=>({...r,sha256:eventIdentitySuccessorSha(r.path,r.sha256)}));
  return next;
}
