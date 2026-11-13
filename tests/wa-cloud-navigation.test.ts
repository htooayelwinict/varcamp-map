import { build } from 'vite';
import { describe, expect, it } from 'vitest';
import { roomDestination, venueDestination } from '../src/navigation';

describe('WA production navigation', () => {
  it.each([
    ['https://play.workadventu.re/@/varcamp/world/varcamp-2026/maps/overworld.wam?old=1#welcome', 'https://play.workadventu.re/@/varcamp/world/varcamp-2026/maps/solar-hall.wam#solar-entry'],
    ['https://event.example/@/varcamp-2026/maps/overworld.wam', 'https://event.example/@/varcamp-2026/maps/solar-hall.wam#solar-entry'],
    ['https://play.example/~/varcamp/maps/overworld.wam', 'https://play.example/~/varcamp/maps/solar-hall.wam#solar-entry'],
  ])('keeps travel inside the current hosted world: %s', (current, destination) => {
    expect(venueDestination(current, 'solar-hall')).toBe(destination);
  });

  it('keeps a journal return inside the production directory after visiting an exploration room', () => {
    expect(venueDestination('https://play.workadventu.re/@/varcamp/world/varcamp-2026/maps/moon-grotto.wam', 'overworld'))
      .toBe('https://play.workadventu.re/@/varcamp/world/varcamp-2026/maps/overworld.wam#welcome');
  });

  it.each(['https://storage.example/maps/overworld.wam', 'https://play.example/@/org/world/maps/overworld.tmj', 'file:///@/org/world/maps/overworld.wam'])('refuses asset URLs as production room identity: %s', current => {
    expect(() => roomDestination(current, 'overworld')).toThrow();
  });

  it('publishes a quest journal that requests its bridge from WA without contacting the devbox', async () => {
    const result = await build({ configFile: 'buildmap.vite.config.ts', logLevel: 'silent', build: { write: false } });
    if (Array.isArray(result) || !('output' in result)) throw Error('Expected one release');
    const journal = result.output.find(item => item.fileName === 'src/journal/index.html');
    if (!journal || journal.type !== 'asset') throw Error('Missing journal entry');
    const html = String(journal.source);
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
    expect(scripts.filter(src => /^https?:/.test(src))).toEqual(['https://play.workadventu.re/iframe_api.js']);
  }, 60000);
});
