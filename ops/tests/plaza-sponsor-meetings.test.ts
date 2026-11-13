import {execFileSync} from 'node:child_process';
import {expect,it} from 'vitest';
it('repairs only the three owner-drawn sponsor chats while rejecting boundary and independent-data changes',()=>{
 const result=execFileSync('python3',['ops/tests/plaza-sponsor-meetings-fixture.py'],{encoding:'utf8'});
 expect(result).toContain('21 unsafe changes rejected');
});
