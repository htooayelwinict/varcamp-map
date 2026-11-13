import type { MapLayout } from '../../tools/maps/types';

const retiredHosts = {
  overworld: 'guide',
  'orbit-maze': 'maze-keeper',
  'comet-maze': 'maze-keeper',
  'shipyard-beach': 'dockmaster',
} as const;

/** Test-only adapter for frozen layouts from before the static hosts were retired. */
export function retireHistoricalHosts(layouts: MapLayout[]): MapLayout[] {
  return layouts.map(source => {
    const npc = retiredHosts[source.id as keyof typeof retiredHosts];
    if (!npc) return source;
    const layout = structuredClone(source);
    layout.placements = layout.placements.filter(p => p.id !== `npc-character-${npc}`);
    layout.signs = layout.signs?.filter(s => s.name !== `npc-name-${npc}`);
    layout.areas = layout.areas.filter(a => a.name !== `npc-${npc}`);
    return layout;
  });
}
