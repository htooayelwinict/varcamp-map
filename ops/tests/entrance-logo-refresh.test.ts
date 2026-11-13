import {execFileSync} from 'node:child_process';
import {expect,it} from 'vitest';

it('refreshes all twelve cached entrance images without changing saved editor data',()=>{
 const result=execFileSync('python3',['ops/tests/entrance-logo-refresh-fixture.py'],{encoding:'utf8'});
 expect(result).toContain('12 hosted logo references refreshed; saved WAM bytes preserved');
});
