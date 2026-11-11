import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {describe, expect, it} from 'vitest';
import {applyEventPresentation, restoreEventPresentation} from '../tools/maps/event-presentation';
import {assertCurrentNativeMap} from '../tools/maps/current-native';
import {loadTileCatalog} from '../tools/art/catalog';
import type {MapLayout, TiledMap} from '../tools/maps/types';

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const bytes = readFileSync('tests/fixtures/hall-ceremonies/before.json.gz');
if (createHash('sha256').update(bytes).digest('hex') !== 'f6ecb328f92765892f7dab509d1363692d4ba97285dbaa20faf84ccecbf9ead2') throw Error('Frozen hall predecessor changed');
const history = JSON.parse(gunzipSync(bytes).toString());
const cases = [['solar-hall', 'Solar', 'OPENING CEREMONY'], ['lunar-hall', 'Lunar', 'CLOSING CEREMONY']] as const;

describe.each(cases)('%s ceremony display', (id, label, caption) => {
  it('renders the ceremony caption with only VarCamp branding and no orphan community heading', () => {
    const layout = read(`world/layouts/${id}.json`) as MapLayout;
    const native = read(`maps/${id}.tmj`) as TiledMap;
    expect(layout.signs?.find(s => s.name === 'stage-label')?.text).toBe(caption);
    const signs = native.layers.flatMap(l => l.type === 'objectgroup' ? l.objects : []);
    expect(signs.find(s => s.name === 'stage-label')?.text).toMatchObject({text: caption});
    expect(layout.images).toEqual([{name: `${label} / VarCamp`, image: 'assets/sponsors/varcamp-2026.png', x: 29, y: 0, width: 6, height: 2}]);
    expect(native.layers.filter(l => l.name.startsWith(label + ' / ')).map(l => l.name)).toEqual([label + ' / VarCamp']);
    expect(native.tilesets.filter(t => t.name?.startsWith(label + ' / ')).map(t => t.name)).toEqual([label + ' / VarCamp']);
    expect(signs.some(s => (s.text as {text?: string} | undefined)?.text === 'COMMUNITY PARTNERS')).toBe(false);
  });

  it('rebuilds the ceremony treatment from history and rejects unrelated source drift', () => {
    const before = history[`world/layouts/${id}.json`] as MapLayout;
    const current = read(`world/layouts/${id}.json`) as MapLayout;
    const fresh = applyEventPresentation(restoreEventPresentation(before));
    expect(fresh.signs?.find(s => s.name === 'stage-label')?.text).toBe(caption);
    expect(fresh).toEqual(current);
    expect(restoreEventPresentation(current)).toEqual(restoreEventPresentation(before));
    for (const change of ['caption', 'mark', 'furniture'] as const) {
      const bad = structuredClone(current);
      if (change === 'caption') bad.signs!.find(s => s.name === 'stage-label')!.text = 'WRONG ROOM';
      if (change === 'mark') bad.images = [];
      if (change === 'furniture') bad.placements[0].x++;
      expect(() => restoreEventPresentation(bad), change).toThrow();
    }
  });

  it('preserves the physical room, protected controls, saved WAM and other captions', () => {
    const before = history[`world/layouts/${id}.json`] as MapLayout;
    const current = read(`world/layouts/${id}.json`) as MapLayout;
    const native = read(`maps/${id}.tmj`) as TiledMap;
    const prior = history[`maps/${id}.tmj`] as TiledMap;
    const plain = (layout: MapLayout) => { const {images, signs, ...rest} = layout; return rest; };
    expect(plain(current)).toEqual(plain(before));
    const retained = (layout: MapLayout) => layout.signs?.filter(s => s.name !== 'stage-label' && s.name !== `${id}-style-partners`);
    expect(retained(current)).toEqual(retained(before));
    expect({...current.signs!.find(s => s.name === 'stage-label'), text: 'PRESENTATION STAGE'}).toEqual(before.signs!.find(s => s.name === 'stage-label'));
    const collision = (map: TiledMap) => { const {id: layerId, ...layer} = map.layers.find(l => l.name === 'physical-collisions')!; return layer; };
    expect(collision(native)).toEqual(collision(prior));
    expect(native.properties).toEqual(prior.properties);
    expect(read(`maps/${id}.wam`)).toEqual(history[`maps/${id}.wam`]);
    expect(() => assertCurrentNativeMap(id, native, current, read(`maps/${id}.wam`), loadTileCatalog())).not.toThrow();
  });
});
