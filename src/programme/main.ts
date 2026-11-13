import programme from '../../world/programme.json';
import './style.css';

type View = 'now' | 'next' | 'day';
const params = new URLSearchParams(location.search);
const rooms = programme.rooms;
let room = rooms.some(r => r.room_id === params.get('room')) ? params.get('room')! : 'all';
const clock = (time: string) => Date.parse(`${programme.event_date}T${time}:00+06:30`);
const boundaries = [...new Set([
 ...programme.sessions.flatMap(s => [Date.parse(s.start_iso), Date.parse(s.end_iso)]),
 ...programme.shared_events.flatMap(s => [clock(s.start_time), clock(s.end_time)]),
])].sort((a, b) => a - b);
const eventStart = boundaries[0], eventEnd = boundaries.at(-1)!;
let view: View = Date.now() >= eventStart && Date.now() < eventEnd ? 'now' : 'day';
let search = '';
const app = document.querySelector<HTMLElement>('#app')!;
function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = ''): HTMLElementTagNameMap[K] {
 const node = document.createElement(tag); node.textContent = text; node.className = className; return node;
}
function link(text: string, url: string): HTMLAnchorElement {
 const node = element('a', text); node.href = url; node.target = '_blank'; node.rel = 'noopener noreferrer'; return node;
}
const matches = (title: string, speaker: string) => `${title} ${speaker}`.normalize('NFC').toLocaleLowerCase().includes(search.normalize('NFC').trim().toLocaleLowerCase());
const filtered = () => programme.sessions.filter(s => (room === 'all' || s.room_id === room) && matches(s.session_title, s.speaker_name));
function selected(now: number) {
 const talks = filtered();
 if (view === 'now') return talks.filter(s => Date.parse(s.start_iso) <= now && now < Date.parse(s.end_iso));
 if (view === 'next') {
  const future = talks.filter(s => Date.parse(s.start_iso) > now);
  const next = Math.min(...future.map(s => Date.parse(s.start_iso)));
  return future.filter(s => Date.parse(s.start_iso) === next);
 }
 return talks;
}
const heading = element('header');
heading.append(element('p', 'VARCAMP 2026 · 15 NOVEMBER', 'eyebrow'), element('h1', 'Programme'));
const close = element('button', '×', 'close'); close.type = 'button'; close.setAttribute('aria-label', 'Close programme');
close.addEventListener('click', () => { if (typeof WA !== 'undefined') WA.ui.modal.closeModal(); });
heading.append(close, element('p', 'Myanmar time · UTC+06:30', 'timezone'));
app.append(heading);
const tabs = element('nav', '', 'tabs'); tabs.setAttribute('aria-label', 'Programme view');
const buttons = (['now', 'next', 'day'] as const).map((id, i) => {
 const button = element('button', ['Scheduled now', 'Up next', 'Full day'][i]); button.type = 'button';
 button.addEventListener('click', () => { view = id; render(); }); tabs.append(button); return {id, button};
});
app.append(tabs);
const filters = element('div', '', 'filters');
const roomLabel = element('label', 'Room'); const select = element('select'); select.id = 'room';
for (const [value, label] of [['all', 'All 12 rooms'], ...rooms.map(r => [r.room_id, `${r.room_code} · ${r.room_name}`])]) {
 const option = element('option', label); option.value = value; select.append(option);
}
select.value = room; select.addEventListener('change', () => { room = select.value; render(); }); roomLabel.append(select);
const searchLabel = element('label', 'Find a talk or speaker'); const input = element('input'); input.id = 'search'; input.type = 'search'; input.placeholder = 'Name or topic…';
input.addEventListener('input', () => { search = input.value; render(); }); searchLabel.append(input); filters.append(roomLabel, searchLabel); app.append(filters);
const summary = element('p', '', 'summary'); summary.id = 'summary'; summary.setAttribute('aria-live', 'polite'); app.append(summary);
const shared = element('div', '', 'shared'); app.append(shared);
const sessions = element('section'); sessions.id = 'sessions'; sessions.setAttribute('aria-label', 'Talks'); app.append(sessions);
const pending = element('section', '', 'pending'); app.append(pending);
const footer = element('footer');
footer.append(link('Official programme ↗', programme.source_url + '#schedule'), element('p', `Schedule snapshot updated ${new Intl.DateTimeFormat('en-GB', {timeZone: programme.timezone, day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false}).format(new Date(programme.fetched_at))} Myanmar time.`), element('p', 'Times follow the published schedule. Sessions may change; check the official programme for updates.'));
app.append(footer);
let rendered = '';
function render(now = Date.now()): void {
 const talks = selected(now);
 const key = JSON.stringify([view, room, search, view === 'day' ? 0 : boundaries.filter(t => t <= now).length]);
 if (key === rendered) return; // Preserve card nodes and keyboard focus when results are unchanged.
 rendered = key;
 for (const {id, button} of buttons) button.setAttribute('aria-pressed', String(id === view));
 const activeShared = programme.shared_events.find(s => clock(s.start_time) <= now && now < clock(s.end_time));
 summary.textContent = view === 'day' ? `${talks.length} scheduled talks${room === 'all' ? ' · 12 zodiac rooms' : ` · ${rooms.find(r => r.room_id === room)!.map_label}`}`
  : talks.length ? `${view === 'now' ? 'Scheduled now' : 'Up next'} · ${talks.length} talks · ${talks[0].start_time}–${talks[0].end_time}`
  : search.trim() ? 'No matching talks. Try another name or topic.'
  : now < eventStart ? 'The programme begins on 15 November at 09:00 Myanmar time. Browse Full day to plan your visit.'
  : now >= eventEnd ? 'The published programme has ended. Full day keeps every talk available.'
  : view === 'now' && activeShared ? `${activeShared.title} · ${activeShared.start_time}–${activeShared.end_time}`
  : view === 'next' ? 'No more talks scheduled in this selection.' : 'No talk scheduled in this room at this time. Explore Full day or another room.';
 shared.replaceChildren();
 if (view === 'day') for (const item of programme.shared_events) shared.append(element('p', `${item.start_time}–${item.end_time} · ${item.title}`));
 sessions.replaceChildren();
 for (const s of talks) {
  const card = element('article', '', 'talk'); card.dataset.session = s.speaker_name;
  const meta = element('div', '', 'meta'); meta.append(element('span', `${s.start_time}–${s.end_time}`), element('span', `${s.room_code} · ${s.room_name}`, 'room'));
  card.append(meta, element('h2', s.session_title), link(`${s.speaker_name} ↗`, s.speaker_url)); sessions.append(card);
 }
 pending.replaceChildren();
 const unpublished = programme.unassigned_speakers.filter(s => matches(s.session_title, s.speaker_name));
 if (view === 'day' && room === 'all' && unpublished.length) {
  pending.append(element('h2', 'Room & time to be confirmed'), element('p', 'These speaker profiles are published without a scheduled slot.'));
  for (const s of unpublished) { const card = element('article'); card.dataset.pending = s.speaker_name; card.append(element('h3', s.session_title), link(`${s.speaker_name} ↗`, s.speaker_url)); pending.append(card); }
 }
}
let refresh: number | undefined;
function tick(): void {
 window.clearTimeout(refresh);
 const now = Date.now(); render(now);
 const next = boundaries.find(t => t > now);
 if (next !== undefined) refresh = window.setTimeout(tick, Math.min(2_147_483_647, Math.max(1, next - Date.now())));
}
const visible = () => { if (document.visibilityState === 'visible') tick(); };
document.addEventListener('visibilitychange', visible);
tick();
window.addEventListener('pagehide', () => { window.clearTimeout(refresh); document.removeEventListener('visibilitychange', visible); }, {once: true});
