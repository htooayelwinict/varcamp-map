import { z } from 'zod';
import { COMET_CHECKPOINT_IDS, normalizeProgress, summarizeProgress, type QuestSummary, type FlagKey } from '../quests/model';
import { ELEMENT_IDS, SIGN_IDS, type MapId } from '../world/catalog';
export type JournalView = { ready: boolean; summary: QuestSummary; pendingKeys: FlagKey[]; errorMessage?: string };
export const JOURNAL_KEY = 'varcamp2026.journalView';
export const SAVE_ERROR = 'Progress could not be saved. Try again.';
export const emptyJournalView: JournalView = { ready: false, summary: summarizeProgress(normalizeProgress({})), pendingKeys: [] };
export const DIRECTORY_DESTINATIONS: { id: MapId; label: string }[] = [
 ...SIGN_IDS.map((sign,i)=>({id:`speaker-${sign}` as MapId,label:`R${i+1} · ${sign[0].toUpperCase()+sign.slice(1)} Speaker Room`})),
 { id: 'solar-hall', label: 'Solar Hall' },
 { id: 'lunar-hall', label: 'Lunar Hall' },
 { id: 'zodiac-festival-park', label: 'Zodiac Festival Park' },
 { id: 'nebula-arcade', label: 'Nebula Arcade & Esports Lounge' },
 { id: 'orbit-playground', label: 'Orbit Playground' },
 { id: 'orbit-maze', label: 'Orbit Maze' },
 { id: 'comet-maze', label: 'Comet Maze' },
 { id: 'shipyard-beach', label: 'Star Harbor · Shipyard' },
 { id: 'constellation-shore', label: 'Constellation Shore' },
 { id: 'fa-ship', label: 'FA SHIP' },
 { id: 'fa-ship-interior', label: 'FA SHIP · Lower Deck' },
 { id: 'campus-exploration', label: 'Exploration Court' },
 { id: 'fire-district', label: 'Fire Workshop' },
 { id: 'earth-district', label: 'Earth Library' },
 { id: 'air-district', label: 'Air Studio' },
 { id: 'water-district', label: 'Water Conservatory' },
 { id: 'star-garden', label: 'Star Garden' },
 { id: 'moon-cafe', label: 'Moon Café' },
 { id: 'moon-grotto', label: 'Moon Grotto' },
 { id: 'stargazer-terrace', label: 'Stargazer Terrace' },
];
const flags = [...SIGN_IDS.map(s => `varcamp2026.sign.${s}`), ...ELEMENT_IDS.map(e => `varcamp2026.sigil.${e}`), ...COMET_CHECKPOINT_IDS.map(id => `varcamp2026.comet.checkpoint.${id}`), 'varcamp2026.cometComplete', 'varcamp2026.mazeComplete', 'varcamp2026.observatoryDiscovered'];
const unique = (items: string[]) => new Set(items).size === items.length;
const schema = z.object({
 ready: z.boolean(), summary: z.object({ discoveredSigns: z.array(z.enum(SIGN_IDS)), missingSigns: z.array(z.enum(SIGN_IDS)), elements: z.array(z.enum(ELEMENT_IDS)), cometCheckpoints: z.array(z.enum(COMET_CHECKPOINT_IDS)), badges: z.array(z.enum(['zodiac-explorer', 'maze-navigator', 'stargazer', 'comet-trailblazer'])) }).strict(),
 pendingKeys: z.array(z.string().refine(k => flags.includes(k))), errorMessage: z.literal(SAVE_ERROR).optional(),
}).strict().refine(v => {
 const s = v.summary;
 return unique([...s.discoveredSigns, ...s.missingSigns]) && s.discoveredSigns.length + s.missingSigns.length === 12 && unique(s.elements) && unique(s.badges) && unique(s.cometCheckpoints) && unique(v.pendingKeys)
  && (!s.badges.includes('stargazer') || s.elements.length === 4)
  && (!s.badges.includes('comet-trailblazer') || s.cometCheckpoints.length === 3)
  && (s.badges.includes('zodiac-explorer') === (s.discoveredSigns.length === 12));
});
export function parseJournalView(value: unknown): JournalView {
 const result = schema.safeParse(value);
 return result.success ? result.data as JournalView : structuredClone(emptyJournalView);
}
