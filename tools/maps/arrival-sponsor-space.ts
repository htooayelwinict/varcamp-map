import {createHash} from 'node:crypto';
import data from '../../world/arrival-sponsor-space.json';
import type {MapLayout} from './types';

const sha = (value:unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const isArrivalSponsorSpace = (layout:MapLayout) => layout.id === data.mapId && sha(layout) === data.afterLayoutSha256;

/** Move only the four arrival panels and shorten their stone approach. */
function transform(input:MapLayout, forward:boolean):MapLayout {
  if (input.id !== data.mapId) return input;
  const before = forward ? data.beforeLayoutSha256 : data.afterLayoutSha256;
  const after = forward ? data.afterLayoutSha256 : data.beforeLayoutSha256;
  if (data.version !== 1 || sha(input) !== before) throw Error('Arrival sponsor space: unreviewed source layout');
  const layout = structuredClone(input);
  for (const row of data.images) layout.images![row.index] = structuredClone(forward ? row.after : row.before);
  layout.placements[data.walk.index] = structuredClone(forward ? data.walk.after : data.walk.before) as MapLayout['placements'][number];
  if (sha(layout) !== after) throw Error('Arrival sponsor space: unexpected source delta');
  return layout;
}

export const applyArrivalSponsorSpace = (layout:MapLayout) => transform(layout, true);
export const restoreArrivalSponsorSpace = (layout:MapLayout) => transform(layout, false);
