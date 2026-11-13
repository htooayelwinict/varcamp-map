import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { build } from 'vite';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WORLD_CATALOG } from '../src/world/catalog';
import {syntheticReleasePlugin} from './helpers/synthetic-release-plugin';
import * as releaseModule from '../tools/release';
import { pinnedTilesetValidation } from './helpers/pinned-tileset-validator';

const project = process.cwd();
const ids = Object.keys(WORLD_CATALOG);
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
let fixture: string;

beforeEach(() => {
  fixture = mkdtempSync(resolve(tmpdir(), 'varcamp-release-cache-'));
  for (const path of ['maps', 'src', 'art', 'world/layouts', 'assets/tilesets/original', 'docs/dependencies']) mkdirSync(resolve(fixture, path), { recursive: true });
  cpSync(resolve(project, 'src'), resolve(fixture, 'src'), { recursive: true });
  cpSync(resolve(project, 'world/maze-route.json'), resolve(fixture, 'world/maze-route.json'));
  symlinkSync(resolve(project, 'node_modules'), resolve(fixture, 'node_modules'));
  writeFileSync(resolve(fixture, 'package.json'), '{"type":"module"}');
  writeFileSync(resolve(fixture, 'art/sources.json'), '{}');
  writeFileSync(resolve(fixture, 'art/sponsors.json'), '{}');
  writeFileSync(resolve(fixture, 'docs/dependencies/LICENSE.starter'), 'MIT fixture');
  writeFileSync(resolve(fixture, 'src/main.ts'), 'console.log("first runtime")');
  for (const id of ids) {
    const definition=WORLD_CATALOG[id as keyof typeof WORLD_CATALOG];
    writeFileSync(resolve(fixture,`world/layouts/${id}.json`),JSON.stringify({id,width:definition.width,height:definition.height,placements:[],entries:[],exits:[],areas:[],inspectionZones:[]}));
    writeFileSync(resolve(fixture, `maps/${id}.tmj`), JSON.stringify({
      width: definition.width, height: definition.height, tilewidth: 32, tileheight: 32,
      properties: [{ name: 'script', type: 'string', value: '../src/main.ts' },{name:'worldMapId',type:'string',value:id}],
      tilesets: [], layers: [{ id: 1, type: 'tilelayer', name: 'terrain', width: definition.width, height: definition.height, data: Array.from({length:definition.width*definition.height},(_,i)=>i===0?1:0) }],
    }, null, 2));
    writeFileSync(resolve(fixture, `maps/${id}.wam`), JSON.stringify({
      version: '2.1.0', mapUrl: `${id}.tmj`, entities: {}, areas: [], entityCollections: [],
      settings: { copyright: 'Fixture author' }, metadata: { name: id, preserved: { value: true } },
    }, null, 2));
  }
  mkdirSync(resolve(fixture,'public/wokas'),{recursive:true});
  cpSync(resolve(project,'public/wokas/varcamp-zodiac-v1'),resolve(fixture,'public/wokas/varcamp-zodiac-v1'),{recursive:true});
  process.chdir(fixture);
});

afterEach(() => { process.chdir(project); rmSync(fixture, { recursive: true, force: true }); });

async function release(directory: string, ui = false): Promise<string> {
  // Vitest sets NODE_ENV=test; exercise the same production URL branch as the Vite CLI.
  await build({ configFile: false, publicDir: false, logLevel: 'silent', define: { 'import.meta.env.DEV': false }, plugins: [syntheticReleasePlugin()], build: {
    outDir: directory, rollupOptions: { preserveEntrySignatures: 'strict', input: { 'src-main': resolve('src/main.ts'), ...(ui ? { journal: resolve('src/journal/index.html') } : {}) } },
  } });
  return resolve(directory);
}

function mapUrl(root: string, id = 'overworld'): URL {
  return new URL(json(resolve(root, `maps/${id}.wam`)).mapUrl, `https://maps.example/world/maps/${id}.wam`);
}

function emittedMap(root: string, url: URL): Buffer {
  return readFileSync(resolve(root, 'maps', url.pathname.split('/').at(-1)!));
}

describe('release TMJ cache identity', () => {
  it('publishes named coastal sources with their full upstream attribution dependencies', async () => {
    const all=JSON.parse(readFileSync(resolve(project,'art/sources.json'),'utf8'));
    const coastal=Object.fromEntries(['lpc-ship','lpc-dock','lpc-containers','lpc-water'].map(id=>[id,all[id]]));
    writeFileSync('art/sources.json',JSON.stringify(coastal));
    for(const id of Object.keys(coastal))cpSync(resolve(project,`assets/tilesets/${id}`),resolve(fixture,`assets/tilesets/${id}`),{recursive:true});
    const root=await release('coastal-credits');
    const html=readFileSync(resolve(root,'credits/index.html'),'utf8');
    for(const name of ['LPC Ship','Reid Dock tileset','LPC Containers','LPC Base Water'])expect(html).toContain(`<h2>${name}</h2>`);
    for(const [id,file] of [['lpc-ship','CREDITS-ship.txt'],['lpc-containers','CREDITS-container.txt'],['lpc-water','AUTHORS']]){
      expect(html).toContain(`${id}/${file}?v=`);
      expect(readFileSync(resolve(root,`credits/${id}/${file}`))).toEqual(readFileSync(resolve(project,`assets/tilesets/${id}/${file}`)));
    }
  });

  it('requests fresh tilemap bytes after a native Tiled edit despite an old URL cached by the browser', async () => {
    const before = await release('before');
    const oldUrl = mapUrl(before);
    const oldBytes = emittedMap(before, oldUrl);
    const browserCache = new Map([[oldUrl.href, oldBytes]]);
    const native = json('maps/overworld.tmj');
    native.layers[0].data[0] = 2;
    writeFileSync('maps/overworld.tmj', JSON.stringify(native));
    const after = await release('after');
    const currentUrl = mapUrl(after);
    const loaded = browserCache.get(currentUrl.href) ?? emittedMap(after, currentUrl);
    expect(JSON.parse(loaded.toString()).layers[0].data[0]).toBe(2);
    expect(JSON.parse(loaded.toString()).layers[0].data).toEqual(native.layers[0].data);
    expect(currentUrl.href).not.toBe(oldUrl.href);
    expect(emittedMap(after, currentUrl)).not.toEqual(oldBytes);
  });

  it('hashes the exact emitted runtime-rewritten TMJ and preserves every other WAM field and native source byte', async () => {
    const sourceMap = readFileSync('maps/overworld.tmj');
    const sourceWam = readFileSync('maps/overworld.wam');
    const root = await release('release');
    const url = mapUrl(root);
    const bytes = emittedMap(root, url);
    expect(JSON.parse(bytes.toString()).properties[0].value).toMatch(/^\.\.\/assets\/src-main-.+\.js$/);
    expect(digest(bytes)).not.toBe(digest(sourceMap));
    expect(json(resolve(root, 'maps/overworld.wam')).mapUrl).toBe(`overworld.tmj?v=${digest(bytes)}`);
    expect({ ...json(resolve(root, 'maps/overworld.wam')), mapUrl: 'overworld.tmj' }).toEqual(JSON.parse(sourceWam.toString()));
    expect(readFileSync('maps/overworld.tmj')).toEqual(sourceMap);
    expect(readFileSync('maps/overworld.wam')).toEqual(sourceWam);
  });

  it('keeps URLs stable for identical emitted maps and changes them when the bundled runtime changes', async () => {
    const first = await release('first');
    const firstUrls = ids.map(id => mapUrl(first, id).href);
    const native = json('maps/overworld.tmj');
    native.properties[0].value = '../src/another-native-script.ts';
    writeFileSync('maps/overworld.tmj', JSON.stringify(native));
    const repeated = await release('repeated');
    expect(ids.map(id => mapUrl(repeated, id).href)).toEqual(firstUrls);
    expect(emittedMap(repeated, mapUrl(repeated))).toEqual(emittedMap(first, mapUrl(first)));
    writeFileSync('src/main.ts', 'console.log("changed runtime")');
    const changed = await release('changed');
    for (const [index, id] of ids.entries()) {
      expect(emittedMap(changed, mapUrl(changed, id))).not.toEqual(emittedMap(first, mapUrl(first, id)));
      expect(mapUrl(changed, id).href).not.toBe(firstUrls[index]);
    }
  });
});

function modalRequests(root: string): URL[] {
  const runtime = json(resolve(root, 'maps/overworld.tmj')).properties.find((p: { name: string }) => p.name === 'script').value;
  const script = `import { pathToFileURL } from 'node:url'; const module = await import(pathToFileURL(process.argv[1]).href); const urls=[]; const api={ui:{modal:{openModal:({src})=>urls.push(src)}}}; for(const section of ['directory','journal'])module.openJournal(api,section); console.log(JSON.stringify(urls));`;
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script, resolve(root, 'maps', runtime)], { encoding: 'utf8', timeout: 5000 })).map((url: string) => new URL(url));
}

describe('complete release cache boundaries', () => {
  it('opens fresh journal HTML gateways from the real bundle while preserving every section fragment', async () => {
    writeFileSync('src/main.ts', "export { openJournal } from './runtime';");
    const before = await release('before', true);
    const previous = modalRequests(before);
    const cache = new Map(previous.map(url => [`${url.pathname.replace(before, '')}${url.search}`, 'old HTML']));
    writeFileSync('src/journal/index.html', readFileSync('src/journal/index.html', 'utf8').replace('</head>', '<meta name="fixture-release" content="current"></head>'));
    const after = await release('after', true);
    const requests = modalRequests(after);
    expect(requests.map(url => url.hash)).toEqual(['#directory', '#journal']);
    for (const url of requests) {
      const key = `${url.pathname.replace(after, '')}${url.search}`;
      const loaded = cache.get(key) ?? readFileSync(url.pathname, 'utf8');
      expect(loaded).toContain('name="fixture-release" content="current"');
      expect(url.searchParams.get('v') ?? '').toMatch(/^[a-f0-9]{64}$/);
    }
  }, 15000);

  it('changes HTML identity for the complete UI input closure and keeps it stable across roots and output/private files', () => {
    const identity = (releaseModule as unknown as { uiReleaseIdentity?: (root: string) => string }).uiReleaseIdentity;
    expect(identity).toBeTypeOf('function');
    if (!identity) return;
    const inputPaths = ['src/runtime.ts', 'src/journal/index.html', 'src/journal/style.css', 'src/journal/view.ts', 'src/world/catalog.ts', 'src/check-in/index.html', 'src/check-in/style.css', 'world/maze-route.json', 'world/new-import.json', 'buildmap.vite.config.ts', 'tsconfig.json', 'package.json', 'package-lock.json', 'tools/release.ts', 'tools/release-identity.ts'];
    for (const path of inputPaths) {
      mkdirSync(resolve(path, '..'), { recursive: true });
      writeFileSync(path, `fixture input ${path}`);
    }
    const original = identity(fixture);
    const other = mkdtempSync(resolve(tmpdir(), 'varcamp-identity-root-'));
    try {
      for (const path of inputPaths) { mkdirSync(resolve(other, path, '..'), { recursive: true }); cpSync(path, resolve(other, path)); }
      // Copy the complete source/JSON closure, including files not listed above.
      for (const path of ['src', 'world']) cpSync(path, resolve(other, path), { recursive: true });
      expect(identity(other)).toBe(original);
      for (const path of inputPaths) {
        const bytes = readFileSync(path);
        writeFileSync(path, Buffer.concat([bytes, Buffer.from('\nchanged')]));
        expect(identity(fixture), path).not.toBe(original);
        writeFileSync(path, bytes);
      }
      for (const path of ['dist/output.js', 'docs/qa/evidence.json', 'ops/private/environment']) { mkdirSync(resolve(path, '..'), { recursive: true }); writeFileSync(path, 'unrelated'); }
      expect(identity(fixture)).toBe(original);
    } finally { rmSync(other, { recursive: true, force: true }); }
  });

  it('invalidates both a same-path PNG and its parent TMJ while retaining canonical paths and exact source bytes', async () => {
    const asset = 'assets/tilesets/original/guides.png';
    cpSync(resolve(project, asset), asset);
    const map = json('maps/overworld.tmj');
    map.tilesets = [{ firstgid: 1, name: 'fixture', image: `../${asset}`, tilewidth: 32, tileheight: 32, columns: 3, tilecount: 6, imagewidth: 96, imageheight: 64 }];
    writeFileSync('maps/overworld.tmj', JSON.stringify(map));
    const native = readFileSync('maps/overworld.tmj');
    const before = await release('before');
    const prior = json(resolve(before, 'maps/overworld.tmj')).tilesets[0].image;
    const original = readFileSync(asset);
    const replacement = await sharp(original).tint('#11aa99').png().toBuffer();
    writeFileSync(asset, replacement);
    const after = await release('after');
    const image = json(resolve(after, 'maps/overworld.tmj')).tilesets[0].image;
    const emitted = asset.replace(/\.png$/, `.${digest(replacement)}.png`);
    expect(image).toBe(`../${emitted}`);
    expect(image).not.toContain('?');
    expect(image).not.toBe(prior);
    expect(mapUrl(after).href).not.toBe(mapUrl(before).href);
    expect(readFileSync(resolve(after, emitted))).toEqual(replacement);
    expect(readFileSync('maps/overworld.tmj')).toEqual(native);
    expect(readFileSync(asset)).toEqual(replacement);
    const paths = readdirSync(after, { recursive: true }).map(String);
    expect(await pinnedTilesetValidation({ 'maps/overworld.tmj': json(resolve(after, 'maps/overworld.tmj')) }, paths)).toEqual({ rejectedReferences: 0, mapsRejected: 0 });
  });

  it('versions every generated local credits link by its exact delivered bytes', async () => {
    writeFileSync('art/sources.json', JSON.stringify({ original: { attribution: 'Fixture', url: 'https://example.com/source', license: 'CC0', licenseFile: 'assets/tilesets/original/LICENSE.txt', changes: 'Fixture' } }));
    writeFileSync('assets/tilesets/original/LICENSE.txt', 'Fixture license');
    writeFileSync('assets/tilesets/original/ATTRIBUTION.md', 'Fixture author');
    const root = await release('release');
    const html = readFileSync(resolve(root, 'credits/index.html'), 'utf8');
    const refs = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]).filter(value => !value.startsWith('https:'));
    expect(refs.length).toBeGreaterThanOrEqual(4);
    for (const ref of refs) {
      const url = new URL(ref, 'https://maps.example/world/credits/index.html');
      const path = resolve(root, 'credits', url.pathname.split('/credits/')[1]);
      expect(url.searchParams.get('v')).toBe(digest(readFileSync(path)));
    }
    expect(html).toContain('href="https://example.com/source"');
    expect(readFileSync(resolve(root, 'credits/original/LICENSE.txt'))).toEqual(readFileSync('assets/tilesets/original/LICENSE.txt'));
  });
});
