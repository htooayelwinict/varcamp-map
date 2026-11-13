import {registerProgrammeAccess} from './programme/access';
/// <reference types="@workadventure/iframe-api-typings" />
/// <reference types="vite/client" />
import { createProgressStore } from './quests/store';
import { registerInteractions } from './quests/interactions';
import { WORLD_CATALOG } from './world/catalog';
import { emptyJournalView, JOURNAL_KEY, type JournalView } from './journal/view';

/** Structural subset of the installed 1.32.10 API; no administration metadata. */
export interface WorkAdventureApi {
 onInit: typeof WA.onInit;
 controls: Pick<typeof WA.controls, 'disableRightClick' | 'disableRoomList'>;
 room: Pick<typeof WA.room, 'id'>;
 mapEditor: { area: Pick<typeof WA.mapEditor.area, 'onEnter' | 'onLeave'> };
 player: { state: Pick<typeof WA.player.state, 'loadVariable' | 'saveVariable' | 'onVariableChange'> };
 nav: Pick<typeof WA.nav, 'goToRoom'>;
 ui: Pick<typeof WA.ui, 'registerMenuCommand' | 'displayActionMessage' | 'modal' | 'actionBar'>;
}
// HTML is a separate Vite entry. Do not import it as a raw URL asset.
const journalPath = import.meta.env.DEV ? './journal/index.html' : `../src/journal/index.html?v=${import.meta.env.VARCAMP_UI_RELEASE}`;
const journalAsset = new URL(/* @vite-ignore */ journalPath, import.meta.url).href;
export function openJournal(api: WorkAdventureApi, section: 'journal' | 'directory' = 'journal'): void {
 api.ui.modal.openModal({ src: `${journalAsset}#${section}`, title: 'VarCamp Quest Journal', allow: null, allowApi: true, position: 'right', allowFullScreen: false, closable: true });
}
export function publishView(api: WorkAdventureApi, view: JournalView): void {
 void api.player.state.saveVariable(JOURNAL_KEY, view, { public: false, persist: false, scope: 'room' }).catch(() => {
  // Quest durability and public navigation never depend on this presentation bridge.
 });
}
export async function initializeWorld(api: WorkAdventureApi): Promise<void> {
 await api.onInit();
 // Keep movement deliberate: keyboard/joystick only; also disables native mobile tap walking.
 api.controls.disableRightClick();
 api.controls.disableRoomList();
 registerProgrammeAccess(api);
 api.ui.registerMenuCommand('Quest Journal', { key: 'Quest Journal', callback: () => openJournal(api) });
 const store = createProgressStore({ read: key => api.player.state.loadVariable(key), save: (key, value) => api.player.state.saveVariable(key, value, { public: false, persist: true, scope: 'world' }) });
 publishView(api, emptyJournalView);
 // Interactions own load errors and retain this store for the entire map scene.
 const dispose = registerInteractions(api, store, WORLD_CATALOG);
 if (typeof window !== 'undefined') window.addEventListener('pagehide', () => { dispose(); }, { once: true });
}
