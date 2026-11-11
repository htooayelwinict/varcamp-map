# Hall ceremony captions — 11 November 2026

Request: Solar Hall's stage reads OPENING CEREMONY; Lunar Hall's reads CLOSING CEREMONY. Remove community logos from both. The obsolete COMMUNITY PARTNERS heading is also removed; VarCamp and the decorative wall remain.

Before implementation, live TMJs showed PRESENTATION STAGE plus BSides Myanmar and Vibe Code Tours in each hall. The checked-in layouts and native layers matched this evidence. The saved hall WAMs have three areas and no independent entities. This is map content, not an infrastructure or meeting fault.

The exact reversible successor changes only two image placements and two caption entries per hall. Native changes are the two logo layers/tilesets, the stage text, removal of the community heading, and Tiled layer/object numbering. Every physical collision cell, other tile, furniture placement, VarCamp mark, animation, entry and saved control remains unchanged. Existing animation-source modules are kept intact; the new successor is composed at the event-content boundary.

The frozen pre-change fixture is `tests/fixtures/hall-ceremonies/before.json.gz`, SHA-256 `f6ecb328f92765892f7dab509d1363692d4ba97285dbaa20faf84ccecbf9ead2`. Six new checks first produced four old-caption failures, then passed after implementation. Targeted test files run sequentially inside tmux, each with MemoryMax=6G and MemorySwapMax=0. Hall ceremony (6), event presentation (31), side-stage access (28), and auditorium spacing (14) checks passed: **79 tests**. All 34 native maps passed the map-build validation gate.

The production build and TypeScript check passed. Native Chromium loaded both candidate halls through the existing WorkAdventure host, walked the front aisles, and reloaded each hall. Both displayed the correct captions and retained only VarCamp branding; no page errors occurred. These browser runs used the prepared release with the live-derived WAMs.

The release delta is limited to the two native hall display changes, map-script/version tokens, and generated previews. All 34 saved WAMs retain their exact independent data outside mapUrl version tokens. Prepared package SHA-256: `2dbffb3c2406f8568804e36124450d37b0fcf1b50777b12bf5187b5558160248`; expected live inventory: 1,118 files.

Independent code reviews, guarded publication and actual live reload remain separate acceptance gates. Local evidence is retained under `.orca/hall-ceremonies-20261111/`. No audio call, attendee-capacity or registration-service testing is claimed by this change.
