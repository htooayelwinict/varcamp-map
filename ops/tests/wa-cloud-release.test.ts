import { execFileSync } from 'node:child_process';
import { it } from 'vitest';

it('preserves live WAMs and existing cloud rooms through the guarded production publisher', () => {
  execFileSync('python3', ['ops/tests/wa_cloud_release_test.py'], { stdio: 'pipe' });
});
