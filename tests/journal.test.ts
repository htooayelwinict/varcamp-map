import {describe,it,expect} from 'vitest';
import {parseJournalView,emptyJournalView,DIRECTORY_DESTINATIONS} from '../src/journal/view';
import {renderJournal} from '../src/journal/main';
import {summarizeProgress,normalizeProgress} from '../src/quests/model';
import {WORLD_CATALOG} from '../src/world/catalog';
import {roomDestination,previewRoomDestination} from '../src/navigation';
describe('journal',()=>{
 it('strictly rejects corrupt, optimistic or inconsistent snapshots',()=>{for(const value of [undefined,null,{}, {...emptyJournalView,extra:true},{...emptyJournalView,summary:{...emptyJournalView.summary,badges:['stargazer']}},{...emptyJournalView,summary:{...emptyJournalView.summary,missingSigns:[]}}])expect(parseJournalView(value)).toEqual(emptyJournalView);});
 it('shows confirmed stamps, missing signs, exact failure copy and optional full hints',()=>{const container={innerHTML:''} as HTMLElement;renderJournal({ready:true,summary:summarizeProgress(normalizeProgress({'varcamp2026.sign.aries':true})),pendingKeys:['varcamp2026.sign.leo'],errorMessage:'Progress could not be saved. Try again.'},container);expect(container.innerHTML).toContain('Aries — Discovered');expect(container.innerHTML).toContain('Leo — Saving');expect(container.innerHTML).toContain('Progress could not be saved. Try again.');expect(container.innerHTML).toContain('Missing signs');expect(container.innerHTML).toContain('Full maze hints');expect(container.innerHTML).toContain('10,68');expect(container.innerHTML).toContain('70,11');expect(container.innerHTML).toContain('Ask the help desk for the current programme');expect(container.innerHTML).not.toContain('Stargazer — Earned');});
 it('keeps all venue information and maze hints without clickable room-jump shortcuts',()=>{
 const c={innerHTML:''} as HTMLElement;renderJournal(emptyJournalView,c);
 expect(DIRECTORY_DESTINATIONS.map(x=>x.id).sort()).toEqual(Object.keys(WORLD_CATALOG).filter(id=>!['overworld','hidden-observatory'].includes(id)).sort());
 for(const room of ['R1 · Aries','R12 · Pisces','Solar Hall','Comet Maze'])expect(c.innerHTML).toContain(room);
 expect(c.innerHTML).not.toContain('data-destination');expect(c.innerHTML).not.toContain('data-plaza');
 expect(c.innerHTML).not.toContain('Return to Plaza is always available');
 expect(c.innerHTML).toContain('Full maze hints');expect(c.innerHTML).toContain('data-close');
 });
 it('keeps final production, candidate and preview wrappers',()=>{expect(roomDestination('https://play.example/~/varcamp/maps/fire-district.wam','overworld')).toBe('https://play.example/~/varcamp/maps/overworld.wam#welcome');expect(roomDestination('https://play.example/~/candidate/maps/fire-district.wam','overworld')).toContain('/~/candidate/maps/overworld.wam');expect(previewRoomDestination('https://play.example/_/preview/maps.example/candidate/maps/preview/fire-district.tmj','overworld')).toBe('https://play.example/_/preview/maps.example/candidate/maps/preview/overworld.tmj#welcome');});
});
