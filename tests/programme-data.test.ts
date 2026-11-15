import {expect, it} from 'vitest';
import programme from '../world/programme.json';
import official from './fixtures/programme/official-2026-11-15.json';

it('publishes every current official talk with its verified speaker, title, time and room', () => {
 expect(programme.sessions).toEqual(official.sessions);
});

it('keeps room totals and open slots consistent with the published schedule', () => {
 expect(programme.rooms).toEqual(official.rooms);
});

it('removes the pending section once every published speaker has a scheduled slot', () => {
 expect(programme.unassigned_speakers).toEqual([]);
});

it('retains the official event date, Myanmar timezone and shared ceremony slots', () => {
 expect(programme).toMatchObject({event_date: official.event_date, timezone: official.timezone,
  utc_offset: official.utc_offset, shared_events: official.shared_events});
 for (const s of programme.sessions) {
  expect(s.start_iso).toBe(`${programme.event_date}T${s.start_time}:00+06:30`);
  expect(s.end_iso).toBe(`${programme.event_date}T${s.end_time}:00+06:30`);
 }
});
