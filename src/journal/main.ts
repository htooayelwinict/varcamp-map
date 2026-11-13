/// <reference types="@workadventure/iframe-api-typings" />
import { DIRECTORY_DESTINATIONS, emptyJournalView, JOURNAL_KEY, parseJournalView, type JournalView } from './view';
import { ELEMENT_IDS, SIGN_IDS } from '../world/catalog';
import './style.css';
import mazeRoute from '../../world/maze-route.json';
const routeTurns = mazeRoute.route.filter((p,i,a) => i === 0 || i === a.length - 1 || (p[0]-a[i-1][0] !== a[i+1][0]-p[0] || p[1]-a[i-1][1] !== a[i+1][1]-p[1]));
const title = (s: string) => s[0].toUpperCase() + s.slice(1);
export function renderJournal(view: JournalView, container: HTMLElement): void {
 const { summary, pendingKeys } = view;
 const stamps = SIGN_IDS.map(sign => `<li class="stamp ${summary.discoveredSigns.includes(sign) ? 'discovered' : ''}">${title(sign)} — ${summary.discoveredSigns.includes(sign) ? 'Discovered' : pendingKeys.includes(`varcamp2026.sign.${sign}`) ? 'Saving…' : 'Undiscovered'}</li>`).join('');
 container.innerHTML = `<header><p class="eyebrow">VARCAMP · CONSTELLATION CAMPUS</p><h1>Quest Journal</h1><p>Explore at your own pace. Every quest is optional.</p><button type="button" data-close>Close journal</button></header>
 <section id="directory" aria-labelledby="directory-title"><h2 id="directory-title" tabindex="-1">Welcome directory</h2><p>Ask the help desk for the current programme</p><ul class="destinations" aria-label="Venue directory">${DIRECTORY_DESTINATIONS.map(d => `<li>${d.label}</li>`).join('')}</ul><p>Follow the plaza paths and building doors to visit each room.</p></section>
 <section aria-labelledby="stamps-title"><h2 id="stamps-title">Zodiac stamps</h2><p role="status">${view.errorMessage ?? (view.ready ? pendingKeys.length ? 'Saving your discovery…' : 'Your confirmed discoveries are shown below.' : 'Progress is unavailable. The venue directory and hints are still available.')}</p><ul class="stamps">${stamps}</ul><p><strong>Missing signs:</strong> ${summary.missingSigns.map(title).join(', ') || 'All twelve discovered'}</p></section>
 <section><h2>Element sigils</h2><ul class="sigils">${ELEMENT_IDS.map(e => `<li>${title(e)} — ${summary.elements.includes(e) ? 'Collected' : pendingKeys.includes(`varcamp2026.sigil.${e}`) ? 'Saving…' : 'Undiscovered'}</li>`).join('')}</ul><p>Find a sigil in each district. With all four saved, visit Stargazer Terrace from Exploration Court and explicitly use its telescope, then discover the observatory shrine.</p></section>
 <section><h2>Badges</h2><ul>${([['zodiac-explorer','Zodiac Explorer'],['maze-navigator','Maze Navigator'],['stargazer','Stargazer'],['comet-trailblazer','Comet Trailblazer']] as const).map(([id,label]) => `<li>${label} — ${summary.badges.includes(id) ? 'Earned' : 'Not yet earned'}</li>`).join('')}</ul></section>
 <section><h2>Orbit Maze</h2><details><summary>Full maze hints · no reward penalty</summary><p>Follow the open corridor from the entrance to the finish shrine. Turn back at dead ends; no discovery is lost. Use the full route below whenever you like.</p><svg viewBox="0 0 80 80" role="img" aria-label="Full maze route from southwest entrance to northeast shrine"><polyline points="${mazeRoute.route.map(p => p.join(',')).join(' ')}" fill="none" stroke="#f4cf7c" stroke-width="1.5"/><circle cx="10" cy="68" r="2" fill="#a3e3d0"/><circle cx="70" cy="11" r="2" fill="#f4cf7c"/></svg><p>Start at the green dot; follow the gold line to the shrine. North is up. At each bend, continue to the next marked tile: ${routeTurns.map(p => p.join(',')).join(' → ')}.</p><p> Activate “Complete the Orbit Maze” at the shrine to save your badge.</p></details></section><section><h2>Comet Maze</h2><p>${summary.cometCheckpoints.length} of 3 checkpoints saved. Activate each crystal’s collection prompt, then the finish shrine to earn Comet Trailblazer.</p><p>Checkpoint 1 is southwest, checkpoint 2 north of the central passage, checkpoint 3 east. The finish shrine is northeast. The south lobby returns to Orbit Maze. Follow the marked exits to return to the plaza.</p></section><footer>Your guest progress belongs to this browser. Keep one quest tab open at a time.</footer>`;
}
export async function startJournal(container: HTMLElement): Promise<void> {
 renderJournal(emptyJournalView, container);
 await WA.onInit();
 const redraw = (value: unknown) => {
  const hintsOpen = container.querySelector('details')?.open;
  renderJournal(parseJournalView(value), container);
  if (hintsOpen) container.querySelector('details')!.open = true;
 };
 const subscription = WA.player.state.onVariableChange(JOURNAL_KEY).subscribe(redraw);
 try { redraw(WA.player.state.loadVariable(JOURNAL_KEY)); } catch { redraw(undefined); }
 container.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (button?.hasAttribute('data-close')) WA.ui.modal.closeModal();
 });
 if (location.hash === '#directory') container.querySelector<HTMLElement>('#directory-title')?.focus();
 window.addEventListener('pagehide', () => subscription.unsubscribe(), { once: true });
}
if (typeof document !== 'undefined') { const container = document.getElementById('journal'); if (container) void startJournal(container); }
