import {execFileSync} from 'node:child_process';import{it,expect}from'vitest';
it('preserves saved editor data and rejects off-scope/changed geometry and controls in all twelve room migrations',()=>{expect(execFileSync('python3',['ops/tests/auditorium-spacing-fixture.py'],{encoding:'utf8',timeout:30000})).toContain('216 migration checks passed');});
