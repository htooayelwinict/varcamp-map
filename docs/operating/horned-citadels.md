# Aries and Capricorn architecture; original Taurus

Aries and Capricorn use the approved Leo and Cancer rendering style, with their zodiac identities expressed through complete building forms. Aries has paired copper spiral galleries. Capricorn has an asymmetric mountain tower joined to a curling coastal gallery. The rejected Renaissance and badge-on-house previews are not published.

Lewis asked to restore only Taurus after reviewing the previews. Taurus therefore keeps its original `grounded-zodiac-physical-taurus` sprite from `zodiac-exteriors.png`, with its original green stonework and bull-horn roof. Its rejected replacement master and sprite are excluded from the release. Aries, Capricorn and the approved aerial patrol work remain.

The 12 by 12 tile footprints remain at Aries (102,58), Taurus (96,80) and Capricorn (58,14). Each keeps its original central two-tile entrance, return pad, ground-wall collision mask and walk-behind roof behavior. Their positions in the zodiac circle do not move. Other buildings, road tiles and garden objects remain intact.

Generated Aries and Capricorn masters and exact prompts are in `art/source/horned-citadels/`. They were generated using OpenAI's built-in image tool with the approved Leo and Cancer sprites as rendering references. `tools/art/horned-citadels.ts` uniformly fits the full transparent subjects into native 384px canvases. The compiler does not add emblems. Two atlas reservations append after the 106 retained preceding reservations.

Use the devbox's capped job runner to recompile. Run each affected test file alone under `systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- <file> --maxWorkers=1`. Check the changed and restored buildings' doorways and grounded walls in the real client before release. Preserve token-only WAM migration and the existing editor data.
