import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';

const checker = resolve('publication/verify-source.mjs');
const source = JSON.parse(readFileSync('publication/source-manifest.json', 'utf8'));
const catalog = readFileSync('src/world/catalog.ts', 'utf8');
const hash = (bytes: string) => createHash('sha256').update(bytes).digest('hex');
const target = 'src/npc/main.ts', receipt = 'publication/retired-source.json';
let root: string;
let manifest: { maps: number; wams: number; sourceFilesByteExact: number; sourceInventory: Record<string, string>; extensionInventory: Record<string, string> };
function put(path: string, content: string) { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), content); }
function pin(path: string, value: unknown) { const bytes = JSON.stringify(value); put(path, bytes); manifest.extensionInventory[path] = hash(bytes); }
function retire(rows = [{ path: target, fromSha256: hash('baseline'), reason: 'Remove retired guide system' }]) { pin(receipt, { schemaVersion: 1, retirements: rows }); }
function verify() {
  put('publication/source-manifest.json', JSON.stringify(manifest));
  const result = spawnSync(process.execPath, [checker, root], { encoding: 'utf8', timeout: 10000 });
  return { status: result.status, output: result.stdout + result.stderr };
}
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'varcamp-retirement-'));
  manifest = { maps: source.maps, wams: source.wams, sourceFilesByteExact: 303, sourceInventory: {}, extensionInventory: {} };
  for (const path of Object.keys(source.sourceInventory)) { put(path, 'baseline'); manifest.sourceInventory[path] = hash('baseline'); }
  put('src/world/catalog.ts', catalog); manifest.sourceInventory['src/world/catalog.ts'] = hash(catalog);
  for (const path of Object.keys(source.extensionInventory)) {
    if (/^publication\/revisions\/.*\.json$/.test(path)) pin(path, { schemaVersion: 1, revisions: [] });
    if (/^maps\/.*\.(wam|tmj)$/.test(path)) { put(path, 'extension'); manifest.extensionInventory[path] = hash('extension'); }
  }
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

it('accepts a pinned exact retirement without deleting the original source receipt', () => {
  rmSync(join(root, target)); retire();
  expect(verify().status).toBe(0);
  expect(Object.keys(manifest.sourceInventory)).toHaveLength(303);
});
it('rejects an undeclared deletion', () => {
  rmSync(join(root, target)); expect(verify().output).toContain(`Missing frozen source: ${target}`);
});
it('rejects a retired file reappearing even with its original bytes', () => {
  retire(); const result = verify(); expect(result.status).not.toBe(0); expect(result.output).toContain(`Retired source still exists: ${target}`);
});
it('requires the retirement to match the last reviewed revision, not an obsolete baseline', () => {
  const revision = Object.keys(source.extensionInventory).filter(p => /^publication\/revisions\/.*\.json$/.test(p)).sort().at(-1)!;
  pin(revision, { schemaVersion: 1, revisions: [{ path: target, fromSha256: hash('baseline'), toSha256: hash('updated'), reason: 'Prior reviewed edit' }] });
  rmSync(join(root, target)); retire();
  expect(verify().output).toContain(`Retired source prior mismatch: ${target}`);
  retire([{ path: target, fromSha256: hash('updated'), reason: 'Remove final reviewed implementation' }]); expect(verify().status).toBe(0);
});
it.each(['src/not-original.ts', 'src/npc/*', '../outside.ts'])('rejects non-original or non-exact retirement %s', path => {
  retire([{ path, fromSha256: hash('baseline'), reason: 'Invalid' }]);
  expect(verify().output).toContain('Retirement path is not an exact original source');
});
it('rejects duplicate retirement entries', () => {
  const row = { path: target, fromSha256: hash('baseline'), reason: 'Remove' }; retire([row, row]); rmSync(join(root, target));
  expect(verify().output).toContain(`Duplicate retired source: ${target}`);
});
it('continues checking unrelated source integrity after a valid retirement', () => {
  rmSync(join(root, target)); retire(); put('src/main.ts', 'tampered');
  expect(verify().output).toContain('Frozen source changed: src/main.ts');
});
