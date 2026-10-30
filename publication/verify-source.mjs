import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { catalogMapIds } from '../ops/current-release-facts.mjs';

const root = resolve(process.argv[2] ?? '.');
const manifest = JSON.parse(readFileSync(resolve(root, 'publication/source-manifest.json'), 'utf8'));
const inventory = manifest.sourceInventory;
const extensions = manifest.extensionInventory ?? {};
// Explicit reviewed release chain; all earlier receipts and documents stay immutable.
const revisionPaths = ['publication/revisions/2026-10-16-shared-guides.json', 'publication/revisions/2026-10-17-return-approaches.json', 'publication/revisions/2026-10-17-beach-composition.json', 'publication/revisions/2026-10-17-beach-ci-closure.json', 'publication/revisions/2026-10-17-solid-props.json', 'publication/revisions/2026-10-17-solid-props-ci-closure.json', 'publication/revisions/2026-10-18-standing-captions.json', 'publication/revisions/2026-10-18-standing-captions-ci-closure.json', 'publication/revisions/2026-10-18-beach-groves-guide-identity.json', 'publication/revisions/2026-10-18-organic-coast.json', 'publication/revisions/2026-10-18-constellation-coast.json','publication/revisions/2026-10-18-campus-refinement.json', 'publication/revisions/2026-10-19-shared-world-service.json', 'publication/revisions/2026-10-19-canonical-verification.json', 'publication/revisions/2026-10-24-welcome-plaza-retirement.json', 'publication/revisions/2026-10-25-aries-presentation.json', 'publication/revisions/2026-10-25-speaker-presentation.json', 'publication/revisions/2026-10-25-tropical-cove.json', 'publication/revisions/2026-10-25-assembly-halls.json', 'publication/revisions/2026-10-25-zodiac-exteriors.json', 'publication/revisions/2026-10-25-halls-zodiac-final.json', 'publication/revisions/2026-10-25-hall-exteriors.json', 'publication/revisions/2026-10-25-hall-exteriors-validation.json', 'publication/revisions/2026-10-26-zodiac-physics.json','publication/revisions/2026-10-26-zodiac-physics-validation.json','publication/revisions/2026-10-26-drones-arrival.json','publication/revisions/2026-10-26-plaza-patrol.json','publication/revisions/2026-10-26-expo-spacing.json','publication/revisions/2026-10-26-fountain-motion.json','publication/revisions/2026-10-26-leo-lion-head.json','publication/revisions/2026-10-26-hall-buildings.json','publication/revisions/2026-10-27-plaza-crescent.json', 'publication/revisions/2026-10-27-plaza-landscape.json', 'publication/revisions/2026-10-27-vibecode-branding.json', 'publication/revisions/2026-10-27-cafe-arrival.json','publication/revisions/2026-10-27-maze-gates.json','publication/revisions/2026-10-29-map-physics.json', 'publication/revisions/2026-10-30-maze-interiors.json'];
assert.equal(Object.keys(inventory).length, 303);
for (const path of Object.keys(extensions)) {
  assert.ok(!Object.hasOwn(inventory, path), `Extension overlaps frozen source: ${path}`);
  assert.ok(existsSync(resolve(root, path)), `Missing extension source: ${path}`);
}
for (const [path, expected] of Object.entries(extensions)) {
  const hash = createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
  assert.equal(hash, expected, `Extension source changed: ${path}`);
}
const exactKeys = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const revisions = new Map();
for (const [index, revisionPath] of revisionPaths.entries()) {
  assert.ok(Object.hasOwn(extensions, revisionPath), 'Reviewed revision file must be pinned in extensionInventory');
  const revisionInventory = JSON.parse(readFileSync(resolve(root, revisionPath), 'utf8'));
  assert.ok(exactKeys(revisionInventory, ['schemaVersion', 'revisions'])
    && revisionInventory.schemaVersion === 1 && Array.isArray(revisionInventory.revisions), 'Invalid reviewed revision schema');
  const seen = new Set();
  for (const revision of revisionInventory.revisions) {
    assert.ok(exactKeys(revision, ['path', 'fromSha256', 'toSha256', 'reason'])
      && typeof revision.path === 'string'
      && typeof revision.reason === 'string' && revision.reason.trim().length > 0
      && typeof revision.fromSha256 === 'string' && /^[a-f0-9]{64}$/.test(revision.fromSha256)
      && typeof revision.toSha256 === 'string' && /^[a-f0-9]{64}$/.test(revision.toSha256), 'Invalid reviewed revision schema');
    const { path, fromSha256 } = revision;
    assert.ok(Object.hasOwn(inventory, path) && !/[\*?\[\]{}]/.test(path)
      && !path.startsWith('/') && !path.split('/').includes('..'), `Reviewed revision path is not an exact original source: ${path}`);
    assert.ok(!seen.has(path), `Duplicate reviewed revision: ${path}`);
    seen.add(path);
    const prior = revisions.get(path)?.toSha256 ?? inventory[path];
    assert.equal(fromSha256, prior, `Reviewed revision ${index === 0 ? 'baseline' : 'prior'} mismatch: ${path}`);
    revisions.set(path, revision);
  }
}
for (const [path, original] of Object.entries(inventory)) {
  assert.ok(existsSync(resolve(root, path)), `Missing frozen source: ${path}`);
  const hash = createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
  const revision = revisions.get(path);
  assert.equal(hash, revision?.toSha256 ?? original, `${revision ? 'Reviewed' : 'Frozen'} source changed: ${path}`);
}
const folders = ['app', 'art', 'assets', 'maps', 'src', 'tools', 'tests', 'world'];
const files = folders.flatMap(folder => readdirSync(resolve(root, folder), { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile())
  .map(entry => relative(root, resolve(entry.parentPath, entry.name))).sort()).sort();
const reviewedFiles = [...Object.keys(inventory), ...Object.keys(extensions)]
  .filter(path => folders.some(folder => path.startsWith(`${folder}/`))).sort();
assert.deepEqual(files, reviewedFiles, 'Source inventory has missing or additional files');
const maps = readdirSync(resolve(root, 'maps'));
const ids = extension => maps.filter(path => path.endsWith(extension)).map(path => path.slice(0, -extension.length)).sort();
assert.deepEqual(ids('.tmj'), ids('.wam'), 'Native TMJ and WAM map IDs differ');
const currentIds = catalogMapIds(root);
assert.deepEqual(ids('.tmj'), currentIds, 'Native map IDs differ from current catalog');
assert.equal(manifest.maps, currentIds.length);
assert.equal(manifest.wams, currentIds.length);
assert.equal(manifest.sourceFilesByteExact, 303);
console.log(`Verified 303 original source receipts: ${303 - revisions.size} unchanged source hashes and ${revisions.size} exact reviewed replacement${revisions.size === 1 ? '' : 's'}, ${Object.keys(extensions).length} reviewed extension hashes and ${currentIds.length} native TMJ/WAM map pairs.`);
