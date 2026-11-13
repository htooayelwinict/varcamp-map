import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { buildMap } from '../tools/maps/builder';
import { retireHistoricalHosts } from './helpers/retired-host-layout';
import { loadTileCatalog } from '../tools/art/catalog';
import type { MapLayout, TiledMap, TileLayer } from '../tools/maps/types';

function pinned(name: string, sha: string) {
  const bytes = readFileSync(`tests/fixtures/workadventure-96d43a84/${name}.ts.txt`);
  if (createHash('sha256').update(bytes).digest('hex') !== sha) throw Error(`Changed pinned ${name}`);
  return bytes.toString();
}
const calculator = pinned('StartPositionCalculator', '78ba5907ff74458ee4bcbb8faf2a6c4daa5071b8c905ae85ff0c83cfed8ca7ad');
const methods = pinned('StartLayerMethods', '7d722386465a4538ee6e53841ef00a73a4773d72c68e9d2b38d9c4c745a8b390');
const compile = (code: string) => ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
const createProbe = new Function('MathUtils', 'GameMapProperties', `${compile(`class Probe { ${methods} }`)};return Probe;`);
const createCompute = new Function('MathUtils', 'localUserStore', `${compile(calculator.replace(/^import .*\n/gm, '').replace('export function computeStartPosition', 'function computeStartPosition'))};return computeStartPosition;`);

// Execute the unchanged pinned selector and layer-selection methods. Only browser
// persistence and the wrapper's map boundary are supplied here; no player state or
// selected-layer result is mocked. Removing/moving the native start alias must fail.
function startPosition(map: TiledMap, sample: number, name?: string): { x: number; y: number } {
  const MathUtils = {
    randomFromArray: <T>(items: T[]) => items[sample % items.length],
    randomPositionFromRect: () => { throw Error('Unexpected area-based spawn in hub fixture'); },
  };
  const Probe = createProbe(MathUtils, { START: 'start', START_LAYER: 'startLayer' });
  const wrapper = Object.assign(new Probe(), {
    dynamicAreas: new Map(), getAreas: () => new Map(), getAreaByName: () => undefined,
    getFlatLayers: () => map.layers,
    findLayer: (layerName: string) => map.layers.find(l => l.name === layerName),
    getTiledObjectProperty: (object: TileLayer, property: string) => object.properties?.find(p => p.name === property)?.value,
    hasStartTile: () => map.tilesets.some(t => t.tiles?.some(tile => tile.properties?.some(p => p.name === 'start'))),
  });
  const compute = createCompute(MathUtils, { getLocalUser: () => undefined });
  return compute(wrapper, map, undefined, name);
}
const welcome = [{ x: 2032, y: 2096 }, { x: 2064, y: 2096 }, { x: 2032, y: 2128 }, { x: 2064, y: 2128 }];
const aries = [{ x: 3248, y: 2288 }, { x: 3280, y: 2288 }, { x: 3248, y: 2320 }, { x: 3280, y: 2320 }];
let mapCache: { authored: TiledMap; exported: TiledMap } | undefined;
const maps = () => {
  if (mapCache) return structuredClone(mapCache);
  const layout = JSON.parse(readFileSync('world/layouts/overworld.json', 'utf8')) as MapLayout;
  mapCache = {
    authored: buildMap(retireHistoricalHosts([layout])[0], loadTileCatalog()).tmj,
    exported: JSON.parse(readFileSync('maps/overworld.tmj', 'utf8')) as TiledMap,
  };
  return structuredClone(mapCache);
};

describe('fresh plaza arrival uses the central welcome court in the pinned client', () => {
  it.each([undefined, 'missing-entry'])('resolves %s to welcome rather than the first house return', name => {
    for (const [kind, map] of Object.entries(maps())) for (let sample = 0; sample < 4; sample++) {
      expect(startPosition(map, sample, name), `${kind}, sample ${sample}`).toEqual(welcome[sample]);
    }
  });
  it('retains explicit welcome and Aries house return positions', () => {
    for (const map of Object.values(maps())) for (let sample = 0; sample < 4; sample++) {
      expect(startPosition(map, sample, 'welcome')).toEqual(welcome[sample]);
      expect(startPosition(map, sample, 'from-speaker-aries')).toEqual(aries[sample]);
    }
  });
  it('historically preserved the selected positions of every prior named entry', () => {
    const before = JSON.parse(readFileSync('docs/qa/plaza-start-2026-10-16/before/maps/overworld.tmj', 'utf8')) as TiledMap;
    const names = before.layers.filter(l => l.type === 'tilelayer' && l.properties?.some(p => p.name === 'startLayer' && p.value === true)).map(l => l.name);
    expect(names).toHaveLength(25);
    const historicalBytes = readFileSync('tests/fixtures/overworld-history/17d4-native.tmj');
    expect(createHash('sha256').update(historicalBytes).digest('hex')).toBe('87e88dd082910b789578188147e9b91b1f060c9d62309c158b785c2bf4cbbaad');
    const historical = JSON.parse(historicalBytes.toString()) as TiledMap;
    for (const name of names) for (let sample = 0; sample < 4; sample++) {
      expect(startPosition(historical, sample, name), name).toEqual(startPosition(before, sample, name));
    }
  });
  it('selects every corrected return cell and preserves all other prior named entries', () => {
    const before = JSON.parse(readFileSync('docs/qa/plaza-start-2026-10-16/before/maps/overworld.tmj', 'utf8')) as TiledMap;
    const names = before.layers.filter(l => l.type === 'tilelayer' && l.properties?.some(p => p.name === 'startLayer' && p.value === true)).map(l => l.name);
    const corrected: Record<string, { x: number; y: number }[]> = {
      'from-festival': [{ x: 304, y: 2032 }, { x: 336, y: 2032 }, { x: 304, y: 2064 }, { x: 336, y: 2064 }],
      'from-arcade': [{ x: 304, y: 2032 }, { x: 336, y: 2032 }, { x: 304, y: 2064 }, { x: 336, y: 2064 }],
      'from-maze': [{ x: 2032, y: 304 }, { x: 2064, y: 304 }, { x: 2032, y: 336 }, { x: 2064, y: 336 }],
    };
    expect(names).toHaveLength(25);
    expect(names.filter(name => name in corrected).sort()).toEqual(Object.keys(corrected).sort());
    for (const [kind, map] of Object.entries(maps())) for (const name of names) for (let sample = 0; sample < 4; sample++) {
      expect(startPosition(map, sample, name), `${kind}, ${name}, sample ${sample}`).toEqual(
        corrected[name]?.[sample] ?? startPosition(before, sample, name),
      );
    }
  });
  it('reproduces the Aries fallback if the literal start alias is removed', () => {
    const map = maps().exported;
    map.layers = map.layers.filter(layer => layer.name !== 'start');
    for (let sample = 0; sample < 4; sample++) expect(startPosition(map, sample)).toEqual(aries[sample]);
  });
});
