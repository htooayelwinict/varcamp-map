import {it,expect} from 'vitest';
import {execFileSync} from 'node:child_process';
it('preserves saved editor content while appending the closed office areas',()=>{
 expect(execFileSync('python3',['ops/tests/office-wings-fixture.py'],{encoding:'utf8'})).toContain('12 office migrations preserve editor data');
});
