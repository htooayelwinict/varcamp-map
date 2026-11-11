import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import recipe from '../../world/hall-ceremonies.json';
import type {LayoutImage, LayoutSign, MapLayout} from './types';

type Row = {
  beforeSha256: string; afterSha256: string;
  removedImages: {index: number; value: LayoutImage}[];
  removedHeading: {index: number; value: LayoutSign};
  stage: {before: LayoutSign; after: LayoutSign};
};
const rows = recipe.maps as Record<string, Row>;
const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const need = (ok: unknown, message: string) => { if (!ok) throw Error('Hall ceremonies: ' + message); };
export const isHallCeremonies = (layout: MapLayout) => rows[layout.id]?.afterSha256 === sha(layout);

/** Captions and two community images only; the physical room and controls remain exact. */
function transform(layout: MapLayout, forward: boolean): MapLayout {
  const row = rows[layout.id];
  if (!row) return layout;
  need(recipe.version === 1 && isDeepStrictEqual(Object.keys(rows).sort(), ['lunar-hall', 'solar-hall']), 'two-hall roster changed');
  need(sha(layout) === (forward ? row.beforeSha256 : row.afterSha256), 'unreviewed source ' + layout.id);
  const result = structuredClone(layout);
  if (forward) {
    result.images = result.images!.filter(image => !row.removedImages.some(r => r.value.name === image.name));
    result.signs = result.signs!.filter(sign => sign.name !== row.removedHeading.value.name);
  } else {
    for (const image of row.removedImages) result.images!.splice(image.index, 0, structuredClone(image.value));
    result.signs!.splice(row.removedHeading.index, 0, structuredClone(row.removedHeading.value));
  }
  result.signs = result.signs!.map(sign => sign.name === 'stage-label' ? structuredClone(row.stage[forward ? 'after' : 'before']) : sign);
  need(sha(result) === (forward ? row.afterSha256 : row.beforeSha256), 'unexpected output ' + layout.id);
  return result;
}

export const applyHallCeremonies = (layout: MapLayout) => transform(layout, true);
export const restoreHallCeremonies = (layout: MapLayout) => transform(layout, false);
