import {execFileSync} from 'node:child_process';
import {expect,it} from 'vitest';

it('publishes isolated capped booth meetings while preserving uncapped sponsors and owner edits',()=>{
 const result=execFileSync('python3',['ops/tests/expo-booth-meetings-fixture.py'],{encoding:'utf8'});
 expect(result).toContain('36 unsafe changes rejected');
});
