# Harbour navigation and side stage access

The 3 November 2026 revision restores the original LPC sailing ship at Shipyard Beach and the original 192 × 96 flying plane. The plane has no demonstration sponsor banner. The continuous natural coast, vegetation, water collision and wildlife remain. The boarding jetty now reaches the ship. No map or tile is scaled.

The two coasts, both ship decks and both mazes have aligned portal footprints, nearby non-overlapping return spawns and directional labels. The shore has a dedicated `from-harbor` arrival on its west trail. Maze portal footprints cover their visible rune thresholds. The deck and hull use a one-tile-wide, two-tile-long native LPC ladder. The timber-and-brass helm is a 64 × 64 sprite, with collision at the base and upper artwork drawn over attendees.

All twelve zodiac rooms and Solar/Lunar halls use a solid stage front and an accessible right-hand stair flight and landing. The audience and presenter zones, 48 seats per zodiac room, 60 seats per hall, room dimensions, exits and all saved WAM controls remain unchanged. The hall front crossing stays fully walkable. Leo's unanimated theatre palm moves to the left wing to keep the right landing clear.

## Authoring and checks

- `world/natural-coast.json` owns both coasts. `tools/maps/author-natural-coast.ts` builds them.
- `tools/art/harbour-plane.ts` compiles the original plane into a bounded native tile animation. Its separate metadata preserves the old advertising asset for historical provenance.
- `world/harbour-navigation.json` is the finite successor for reviewed native navigation/text owners and two new atlas reservations. All earlier native owners and reservations remain pinned.
- `world/stage-side-access.json` is the reversible furnishing/sign successor to the auditorium revision. It cannot change saved zones, portals or animation anchors.
- New helm: built-in imagegen; master `art/source/harbour-navigation/helm-master.png`, native asset `assets/tilesets/original/harbour-helm.png`. Prompt: isolated eight-spoke dark oak ship wheel on a short pedestal, worn brass hub, restrained top-down pixel art matching LPC timber, transparent background, no text or scenery. Compiled to 64 × 64 with nearest-neighbour sampling and transparency preserved.

Run `stage-side-access.test.ts`, `harbour-navigation.test.ts`, `natural-coast.test.ts` and relevant publication/interior regressions individually, sequentially, with `systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- tests/<file> --maxWorkers=1`. Long jobs run inside tmux. The full historical suite has known stale predecessor fixtures and must not be run uncapped.

Standard deployment uses `npm run deploy:demo -- --apply`. This revision needs no saved-WAM geometry migration. Preserve old receipts and append the new revision to the publication chain. Private guide service activation/pins are separate and unchanged.
