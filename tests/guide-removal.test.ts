import { existsSync } from 'node:fs';
import { build } from 'vite';
import { afterEach, expect, it, vi } from 'vitest';
import counter from '../world/check-in-counter.json';
import stations from '../world/check-in-stations.json';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.resetModules(); });

it.each([
  ['https://play.example/~/varcamp/maps/overworld.wam', 'https://play.example/~/varcamp/maps/solar-hall.wam#solar-entry'],
  ['https://play.workadventu.re/@/varcamp/world/varcamp-2026/maps/overworld.wam', 'https://play.workadventu.re/@/varcamp/world/varcamp-2026/maps/solar-hall.wam#solar-entry'],
])('boots the real plaza entry without guide menus while navigation, quests and registration remain usable: %s', async (roomId, solarDestination) => {
  const menus = new Map<string, () => void>();
  const enters = new Map<string, () => void>();
  const actions = new Map<string, () => void>();
  const subscription = (target: Map<string, () => void>) => (name: string) => ({ subscribe: (fn: () => void) => { target.set(name, fn); return { unsubscribe() {} }; } });
  const arrival = stations.stations.find(s => s.id === 'arrival')!.interaction;
  const api = {
    onInit: async () => {}, controls: { disableRightClick: vi.fn() },
    room: { id: roomId, website: { create: vi.fn(async () => {}), delete: vi.fn(async () => {}) } },
    player: { name: 'Attendee', getPosition: async () => ({ x: (arrival.x + 0.5) * 32, y: (arrival.y + 0.5) * 32 }), onPlayerMove: () => ({ unsubscribe() {} }), state: { loadVariable: () => undefined, saveVariable: vi.fn(async () => {}), onVariableChange: () => ({ subscribe: () => ({ unsubscribe() {} }) }) } },
    mapEditor: { area: { onEnter: subscription(enters), onLeave: subscription(new Map()) } },
    nav: { goToRoom: vi.fn(), openTab: vi.fn() },
    ui: { registerMenuCommand: (label: string, options: { callback: () => void }) => { menus.set(label, options.callback); return { remove() {} }; }, displayActionMessage: ({ message, callback }: { message: string; callback: () => void }) => { actions.set(message, callback); return { remove: async () => { actions.delete(message); } }; }, modal: { openModal: vi.fn(), closeModal: vi.fn() } },
  };
  const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('WA', api); vi.stubGlobal('window', new EventTarget());
  await import('../src/main');
  await vi.waitFor(() => expect(menus.has('Quest Journal')).toBe(true));
  expect(warnings).not.toHaveBeenCalled();
  expect([...menus.keys()].sort()).toEqual(['Go to Lunar Hall', 'Go to Solar Hall', 'Quest Journal', 'Return to Plaza']);
  menus.get('Go to Solar Hall')!();
  expect(api.nav.goToRoom).toHaveBeenCalledWith(solarDestination);
  menus.get('Quest Journal')!();
  expect(api.ui.modal.openModal).toHaveBeenCalledWith(expect.objectContaining({ title: 'VarCamp Quest Journal' }));
  expect(enters.has('welcome-directory')).toBe(true);
  actions.get('Check In · open the ticket check-in page')!();
  expect(api.nav.openTab).toHaveBeenCalledWith(counter.url);
});

it('produces the complete venue release with no executable guide or NPC artifacts', async () => {
  const result = await build({ configFile: 'buildmap.vite.config.ts', logLevel: 'silent', build: { write: false } });
  if (Array.isArray(result) || !('output' in result)) throw Error('Expected one release');
  const files = result.output.map(o => o.fileName);
  expect(files.filter(p => /^(bots|src\/(guides|npc))\//.test(p))).toEqual([]);
  expect(files.filter(p => p.endsWith('.wam'))).toHaveLength(34);
  for (const file of ['src/journal/index.html', 'src/adventure/index.html', 'src/check-in/index.html']) expect(files).toContain(file);
  for (const item of result.output) if (item.type === 'chunk') {
    expect(item.code).not.toMatch(/Talk to Nearby Guides|varcamp-npc\/chat|src\/guides\/index/);
  }
}, 60000);

it('removes the guide implementation and service source trees, rather than leaving disabled systems', () => {
  for (const path of ['src/bots', 'src/guides', 'src/npc', 'ops/bots', 'ops/npc', 'tools/bots', 'tools/maps/npc-guides.ts']) expect(existsSync(path), path).toBe(false);
});
