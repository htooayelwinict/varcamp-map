# VarCamp map handoff

## Open and explore the map

Open the project in Tiled, then open `maps/overworld.tmj`. Keep the repository folder structure intact so the map can find its tilesets and image assets. This is the attendee entry map: visitors spawn in the center welcome court, then follow the clockwise or counterclockwise gold-lit stone circle to the twelve numbered zodiac speaker rooms. Each room has its own return threshold.

Arrow keys or WASD move the avatar. Follow the numbered ring to any speaker building; each doorway enters a separate room map. North leads to mazes and the two halls, west to Festival Park with Arcade and Playground branches, east to Star Harbor with separate Shore and FA SHIP branches, and south to Exploration Court with four elemental districts, Garden, Café, Grotto and Stargazer Terrace. Physical return signs and the journal directory provide routes back.

## Requirements carried forward from the original VarCamp room

The original [`kokoye2007/varcamp-room`](https://github.com/kokoye2007/varcamp-room) describes four main conference rooms, distributed meeting zones, and a garden. Those are retained as functional requirements in this redesign:

| Original requirement | Where it is fulfilled in this world |
| --- | --- |
| Four main conference rooms | Twelve individually entered zodiac speaker rooms on the welcome plaza, arranged in a ring; the Solar Hall and Lunar Hall add two larger presentation venues. |
| Distributed meeting zones | The zodiac rooms, hall stages and audiences, elemental districts, campus café, and social lounges provide separate gathering spaces. |
| Garden and chillout space | Star Garden and the expanded Zodiac Festival Park, with additional outdoor campus paths and social areas. |
| Simple orientation and room access | Welcome directory and movement instructions, numbered zodiac signs, curved clockwise/counterclockwise plaza routes, labeled destinations, and return gates. |

This is a functional carry-forward, not a byte-for-byte copy of the old map. Its source description's 300-user figure is not a tested capacity claim for this new world; the current planning target remains 30–100 concurrent attendees. The reference repo distinguishes code, map, and asset licenses and requires third-party tileset credits. This build reuses its own existing licensed art and layouts; it does not bundle the reference repo's map or asset files.

## Edit and rebuild

The thirty-three native `maps/*.tmj` files can be edited directly in Tiled. Normal `maps:build` validates those files and refreshes previews without overwriting native edits. Three independent sponsor PNGs can be replaced as described in [sponsor instructions](operating/sponsors.md).

The initial hand-composed placements are also retained in `world/layouts/*.json`. Use `npm run maps:author` only when intentionally compiling those sources. It refuses to overwrite later native edits; reconcile the two authoring representations first. `--initialize` explicitly bypasses that guard and is reserved for an intentional, backed-up redraw.

After native editing, run:

```sh
npm run maps:build
npm run maps:validate
npm run buildmap
```

Use `npm run art:check` after changing any art. At the October16 compact-release checkpoint, the recorded run passed `npm test -- --maxWorkers=1 --testTimeout30000`:715 tests plus7 Python harness checks. The explicit30-second budget accommodates native rendering on this workstation; earlier default-budget timeout results remain in QA. The release map files are emitted in `dist/maps/` alongside the runtime and asset credits. Native sponsor rendering requires the bundled Tiled renderer; the attempted ARM Linux offload did not have a working equivalent toolchain.

## Current source and verification

Use [generated current facts](current-release-facts.md) for the source inventory and toolchain; the guide systems have been removed. Source facts and historical checks do not certify current live deployment.

## October16 delivery record (historical)

The following handoff statements are retained as reported at that checkpoint. Their referenced QA files are absent from this checkout; unavailable paths below are historical references, not verifiable evidence links or current acceptance claims. In particular, the old container/area and package counts do not describe the current host or release.

The separate [devbox demo](https://varcamp.3-1-133-135.sslip.io/~/varcamp-demo/maps/overworld.wam#welcome) now serves the96-square hub, coastal redesign and compact arrival boards. The final184-file package was published successfully; two complete readbacks match all expected hashes, all79 live areas and8 core containers are preserved, and both readbacks pass the whole pinned map/WAM validator. The final normal-cache live arrival view (unavailable historical path: `qa/combined-revision-2026-10-16/live/compact-arrival-final-live.jpg`) confirms smaller signs and all three sponsor logos together. The temporary QA guest tab was closed and the IAB viewport restored after verification.

See the October16 acceptance status (unavailable historical path: `qa/combined-revision-2026-10-16/acceptance.md`) for exact artifacts and limitations. Physical entry and return verification now covers all12 speaker rooms in both directions. Aries and Taurus were checked on the preceding medium release; the other10 were checked on the compact release, whose43 entry/exit controls are preserved. Direct room navigation used for setup was not counted as a physical crossing. Recorded activity crossings now include Plaza→Festival/Harbor/Exploration/Orbit Maze; Festival→Arcade/Playground; Harbor→FA SHIP/Shore; Exploration→Garden; and Orbit→Comet. Solar and Lunar Hall entries/returns and Orbit Maze’s plaza return are also recorded:12 inbound crossings and12 returns in the activity/hall audit, with exact destinations in the acceptance table. These checks do not claim all alternate exits or completed maze gameplay. All three NPC area/Space interactions open their current offline guide gateways. The current31-destination journal shows the Aries discovery after explicit reload. The telescope rejects entry without the four sigils and opens the journal. AI replies, iframe hint-button flows, the four-sigil unlock and full maze completion are not claimed verified. The current compact directory is captured under its current UI identity in the post-reload journal evidence. Earlier screenshots and October15 records (unavailable historical path: `qa/redraw-2026-10-15/README.md`) describe earlier revisions. Sponsored event publication, media and concurrent-attendee rehearsal remain separate checks.
