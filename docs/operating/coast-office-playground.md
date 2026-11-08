# Coast extensions, speaker side wings and Orbit Run

Both `shipyard-beach` and `constellation-shore` are 96×48 tiles at the existing 32-pixel scale. The additional east coast has irregular palm clusters, open sand, loungers and continuous animated surf. Existing piers, ship placements, harbour plane, wildlife routes and entrance/return coordinates remain. `world/natural-coast.json` is the composition source; regenerate it with `node --import tsx tools/maps/author-natural-coast.ts` under the memory cap below.

## Speaker offices

Every zodiac speaker interior has thirty new columns on its east side. Eleven are 66 tiles wide; Sagittarius is 70 because its original auditorium is wider. Room heights stay unchanged (46, or 48 for Pisces). The existing stage, 48 audience chairs, listener boundary, right-side stairs, entry and exit remain in place. Solar and Lunar are outside this extension.

Use the three-tile doorway behind the audience, at row 35. A corridor connects four furnished spaces: organizer workstations, a silent reading/work room, a launch/briefing room and a lounge. Everyone inside the Organizer Team office joins the same native meeting, including people at opposite desks. Each zodiac has a separate meeting name; text chat is enabled, entry uses the attendee's current microphone/camera choices, and leaving the office leaves the meeting. The label does not impose access restrictions. The silent room retains WorkAdventure's native `silent` property; the briefing room and lounge retain ordinary proximity chat. The [wa-internal-map reference](https://github.com/kokoye2007/wa-internal-map/tree/998c27f89c976289c453381a0b9bfa029bfa7565) informed the layout. Existing licensed project tiles supply the furniture and walls.

`world/speaker-office-wings.json` records the reversible append-only successor, including exact before/after functional contracts. `tools/maps/speaker-office-wings.ts` verifies its closed twelve-room roster and original furnishing preservation. `reference-interiors.ts` still checks the complete native result, collision routes and protected controls. Office desks block their entire surface; tall furniture separates its base from its upper artwork. The shared interior-animation producer accepts the expanded room contract and refreshes its source receipts across all fourteen interiors. The recipe records Solar/Lunar as provenance-only successors; their floor plans, animation pixels, timing and positions stay exact.

The first deployment requires:

```sh
npm run deploy:demo -- --apply --office-wings --plan .qa/coast-office-20261103
```

`ops/office_wings.py` appends only the four owned areas to freshly downloaded live WAMs. It preserves all old areas, entities and unknown editor fields. Changed owned controls, partial additions, duplicate IDs and an independent area overlapping the new quiet room abort the migration. An already-current release is idempotent. Never replace a live WAM with the source WAM wholesale.

The later [organizer meeting contract](../../world/organizer-meetings.json) adds only a native `livekitRoomProperty` to each existing organizer area. The historical office layout recipe remains unchanged. Native authoring and interior acceptance apply this WAM control successor through `tools/maps/organizer-meetings.ts`; tiles, furniture, collision masks, auditorium controls and art receipts stay exact. [WorkAdventure's meeting area documentation](https://docs.workadventu.re/map-building/inline-editor/area-editor/meetingRoom/) describes entry and room-name behavior.

For an already-expanded live venue, deploy this control change with `npm run deploy:demo -- --apply --organizer-meetings`. `ops/organizer_meetings.py` appends only the organizer meeting property in freshly downloaded WAMs. It retains existing description, lock and highlight properties, plus all other areas, entities, settings and unknown editor fields. Geometry drift, conflicting audio controls and overlapping independent areas abort the migration; an already-current office is unchanged. Fresh installations use the checked-in WAMs, which already include these meetings. The `--office-wings` option above describes the earlier migration; it is not needed when the offices already exist.

The separately requested Sagittarius reset uses `--reset-sagittarius-organizer`. It removes only the exact manual lock, dark highlight, empty description and editor override captured on 2026-11-08, so this organizer office matches the other eleven. The shared meeting stays enabled. Changed or additional manual settings abort this reset; ordinary deployments still preserve editor changes.

## Orbit Run

Walk onto the START/FINISH pad in Orbit Playground and press Space (or click the action prompt). Visit pads 1–7 in order, following the arrows, then return to FINISH. The prompt shows the next checkpoint and your final time. Press Space during a run to cancel; a run expires after three minutes. Repeat to improve your private personal best. This is a walking challenge using your existing Woka, with no additional game download or game server. It does not provide a shared leaderboard or synchronized race start. Friends can start together and compare their displayed times. Personal bests use [WorkAdventure player state](https://docs.workadventu.re/developer/map-scripting/references/api-player/#player-specific-variables), with private, persisted, room-scoped storage. Anonymous players keep it in their browser through WorkAdventure; signed-in players use the storage provided by their WorkAdventure server. If saving fails, the current session still keeps its best time.

`world/orbit-course.json` owns the physical checkpoint rectangles. `src/playground/course.ts` handles explicit start, ordered progress, cancellation, expiry, persisted personal best and cleanup on leaving. It registers only on `orbit-playground`. The floor pads and text in `world/layouts/orbit-playground.json` must match these rectangles. `art/source/orbit-course-refresh.json` and `tools/maps/playground-context.ts` admit the reviewed caption replacement while preserving existing native portals, saved areas and atlas reservations.

## Verification and future edits

Run long jobs in tmux, with heavy jobs sequential. Run each test file separately:

```sh
systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- tests/coast-office-expansion.test.ts --maxWorkers=1
```

Other focused files: `orbit-course.test.ts`, `office-wam-migration.test.ts`, `natural-coast.test.ts`, `harbour-navigation.test.ts`. Run `maps:build`, `maps:validate`, `art:check`, TypeScript and the publication verifier under the same cap. Browser acceptance must walk each new room, test furniture and walls, cross coast/room portals, complete a real course and check an ordinary reload. Current evidence is under `.orca/coast-office-20261103/`; this document describes intended contracts and is not itself live verification.
