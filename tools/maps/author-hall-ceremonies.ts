import {readFileSync, writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {loadTileCatalog} from '../art/catalog';
import {applyHallCeremonies} from './hall-ceremonies';
import {renderReferenceInterior} from './reference-interiors';
import {assertCurrentNativeMap} from './current-native';
import type {MapLayout, TiledMap} from './types';

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const catalog = loadTileCatalog(), writes = new Map<string, string>();
for (const id of ['solar-hall', 'lunar-hall']) {
  const layoutPath = `world/layouts/${id}.json`, mapPath = `maps/${id}.tmj`;
  const before = read(layoutPath) as MapLayout, native = read(mapPath) as TiledMap;
  if (!isDeepStrictEqual(native, renderReferenceInterior(before, catalog).tmj)) throw Error(id + ': unexpected native edits');
  const layout = applyHallCeremonies(before), map = renderReferenceInterior(layout, catalog).tmj;
  const retired = new Set(before.images!.filter(i => !layout.images!.some(n => n.name === i.name)).map(i => i.name));
  const expected = structuredClone(native);
  expected.layers = expected.layers.filter(layer => !retired.has(layer.name));
  expected.tilesets = expected.tilesets.filter(set => !retired.has(set.name!));
  let objectId = 1;
  for (const layer of expected.layers) if (layer.type === 'objectgroup') {
    layer.objects = layer.objects.filter(object => object.name !== `${id}-style-partners`);
    for (const object of layer.objects) {
      object.id = objectId++;
      if (object.name === 'stage-label') (object.text as {text: string}).text = layout.signs!.find(s => s.name === 'stage-label')!.text;
    }
  }
  expected.nextobjectid = objectId;
  expected.layers.forEach((layer, index) => { layer.id = index + 1; });
  expected.nextlayerid = expected.layers.length + 1;
  if (!isDeepStrictEqual(map, expected)) throw Error(id + ': unrelated native data changed');
  assertCurrentNativeMap(id, map, layout, read(`maps/${id}.wam`), catalog);
  writes.set(layoutPath, JSON.stringify(layout, null, 2) + '\n');
  writes.set(mapPath, JSON.stringify(map) + '\n');
}
for (const [path, body] of writes) writeFileSync(path, body);
console.log('Authored opening/closing ceremony labels; removed hall community logos/headings. Physical rooms and WAMs unchanged.');
