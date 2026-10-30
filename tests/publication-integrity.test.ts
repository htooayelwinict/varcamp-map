import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const checker = resolve('publication/verify-source.mjs');
const baselineHash = '4b654bd1437066b13498661f3ca14774daf1066d072036beffaf06f0c014250e'; // "baseline\n"
const extensionHash = 'f7315289ab7085fe7c2c0cde78d3fb1f1ec0b5d324ca49c50954f991eeb32aca'; // "extension\n"
const baselinePaths = Object.keys(JSON.parse(readFileSync('publication/source-manifest.json', 'utf8')).sourceInventory);
const catalogSource = readFileSync('src/world/catalog.ts', 'utf8');
const catalogIds = Object.keys(JSON.parse(catalogSource.match(/export const WORLD_CATALOG\s*=\s*(\{[\s\S]*?\})\s+as const/)![1]));
const combinedRevision = 'publication/revisions/2026-10-18-beach-groves-guide-identity.json';

describe('publication source integrity CLI', () => {
  let root: string;
  let manifest: { maps: number; wams: number; sourceFilesByteExact: number; sourceInventory: Record<string, string>; extensionInventory: Record<string, string> };
  function write(path: string, content: string) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  function verify() {
    write('publication/source-manifest.json', JSON.stringify(manifest));
    const result = spawnSync(process.execPath, [checker, root], { encoding: 'utf8' });
    return { status: result.status, output: result.stdout + result.stderr };
  }
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'varcamp-publication-'));
    manifest = {
      maps: catalogIds.length, wams: catalogIds.length, sourceFilesByteExact: 303,
      sourceInventory: Object.fromEntries(baselinePaths.map(path => [path, baselineHash])),
      extensionInventory: {
        'src/bots/reviewed.ts': extensionHash,
        'buildmap.vite.config.ts': extensionHash,
        'ops/bots/reviewed-runner.mjs': extensionHash,
      },
    };
    for (const path of baselinePaths) write(path, 'baseline\n');
    for (const path of Object.keys(manifest.extensionInventory)) write(path, 'extension\n');
    write('src/world/catalog.ts', catalogSource);
    manifest.sourceInventory['src/world/catalog.ts'] = createHash('sha256').update(catalogSource).digest('hex');
    for (const id of catalogIds) for (const ext of ['tmj', 'wam']) {
      const path = `maps/${id}.${ext}`;
      if (!Object.hasOwn(manifest.sourceInventory, path)) { write(path, 'extension\n'); manifest.extensionInventory[path] = extensionHash; }
    }
    const revisions = JSON.stringify({ schemaVersion: 1, revisions: [] });
    for(const revisionPath of ['publication/revisions/2026-10-16-shared-guides.json','publication/revisions/2026-10-17-return-approaches.json','publication/revisions/2026-10-17-beach-composition.json','publication/revisions/2026-10-17-beach-ci-closure.json','publication/revisions/2026-10-17-solid-props.json', 'publication/revisions/2026-10-17-solid-props-ci-closure.json', 'publication/revisions/2026-10-18-standing-captions.json', 'publication/revisions/2026-10-18-standing-captions-ci-closure.json','publication/revisions/2026-10-18-campus-refinement.json', 'publication/revisions/2026-10-19-shared-world-service.json', 'publication/revisions/2026-10-19-canonical-verification.json','publication/revisions/2026-10-24-welcome-plaza-retirement.json','publication/revisions/2026-10-25-aries-presentation.json','publication/revisions/2026-10-25-speaker-presentation.json','publication/revisions/2026-10-25-tropical-cove.json','publication/revisions/2026-10-25-assembly-halls.json','publication/revisions/2026-10-25-zodiac-exteriors.json','publication/revisions/2026-10-25-halls-zodiac-final.json','publication/revisions/2026-10-25-hall-exteriors.json','publication/revisions/2026-10-25-hall-exteriors-validation.json','publication/revisions/2026-10-26-zodiac-physics.json','publication/revisions/2026-10-26-zodiac-physics-validation.json','publication/revisions/2026-10-26-drones-arrival.json','publication/revisions/2026-10-26-plaza-patrol.json','publication/revisions/2026-10-26-expo-spacing.json','publication/revisions/2026-10-26-fountain-motion.json','publication/revisions/2026-10-26-leo-lion-head.json','publication/revisions/2026-10-26-hall-buildings.json','publication/revisions/2026-10-27-plaza-crescent.json','publication/revisions/2026-10-27-plaza-landscape.json', 'publication/revisions/2026-10-27-vibecode-branding.json','publication/revisions/2026-10-27-cafe-arrival.json','publication/revisions/2026-10-27-maze-gates.json','publication/revisions/2026-10-29-map-physics.json', 'publication/revisions/2026-10-30-maze-interiors.json']){
      write(revisionPath, revisions);
      manifest.extensionInventory[revisionPath] = createHash('sha256').update(revisions).digest('hex');
    }
    const constellationRevision='publication/revisions/2026-10-18-constellation-coast.json';write(constellationRevision,revisions);manifest.extensionInventory[constellationRevision]=createHash('sha256').update(revisions).digest('hex');
    const coastRevision='publication/revisions/2026-10-18-organic-coast.json';write(coastRevision,revisions);manifest.extensionInventory[coastRevision]=createHash('sha256').update(revisions).digest('hex');
    write(combinedRevision, revisions);
    manifest.extensionInventory[combinedRevision] = createHash('sha256').update(revisions).digest('hex');
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('accepts reviewed additions inside source folders and outside them', () => {
    expect(verify().status).toBe(0);
  });

  it('still rejects changed frozen source bytes when extensions are approved', () => {
    write('src/main.ts', 'tampered\n');
    const result = verify();
    expect(result.status).not.toBe(0);
    expect(result.output).toContain('Frozen source changed: src/main.ts');
  });

  it.each(['src/bots/reviewed.ts', 'buildmap.vite.config.ts', 'ops/bots/reviewed-runner.mjs'])(
    'rejects extension hash drift at %s', path => {
      write(path, 'tampered\n');
      const result = verify();
      expect(result.status).not.toBe(0);
      expect(result.output).toContain(`Extension source changed: ${path}`);
    },
  );

  it.each(['src/bots/reviewed.ts', 'buildmap.vite.config.ts', 'ops/bots/reviewed-runner.mjs'])(
    'rejects a missing extension at %s', path => {
      rmSync(join(root, path));
      const result = verify();
      expect(result.status).not.toBe(0);
      expect(result.output).toContain(`Missing extension source: ${path}`);
    },
  );

  it('rejects unlisted additions in the eight source folders', () => {
    write('src/bots/unreviewed.ts', 'extension\n');
    const result = verify();
    expect(result.status).not.toBe(0);
    expect(result.output).toContain('Source inventory has missing or additional files');
  });

  it('rejects an extension that overlaps the immutable baseline', () => {
    manifest.extensionInventory['src/main.ts'] = extensionHash;
    const result = verify();
    expect(result.status).not.toBe(0);
    expect(result.output).toContain('Extension overlaps frozen source: src/main.ts');
  });

  it('keeps exact native map-pair identities even when renamed map bytes are approved', () => {
    const oldPath = 'maps/overworld.wam';
    const newPath = 'maps/unpaired.wam';
    rmSync(join(root, oldPath));
    delete manifest.sourceInventory[oldPath];
    manifest.sourceInventory[newPath] = baselineHash;
    write(newPath, 'baseline\n');
    const result = verify();
    expect(result.status).not.toBe(0);
    expect(result.output).toContain('Native TMJ and WAM map IDs differ');
  });
  it('refuses a paired same-count foreign map even when both new paths are pinned', () => {
    for (const ext of ['tmj', 'wam']) {
      const oldPath = `maps/overworld.${ext}`, path = `maps/foreign.${ext}`;
      rmSync(join(root, oldPath)); delete manifest.sourceInventory[oldPath];
      write(path, 'baseline\n'); manifest.sourceInventory[path] = baselineHash;
    }
    const result = verify(); expect(result.status).not.toBe(0);
    expect(result.output).toContain('Native map IDs differ from current catalog');
  });
});
