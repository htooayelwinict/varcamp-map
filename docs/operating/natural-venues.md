# Harbour, shore and room interiors

The November 2026 redesign uses [wa-beach](https://github.com/kokoye2007/wa-beach/tree/92a8045ccfe9ea1addb7d88391b7a2738ee2e905) for its continuous coast, planted backshore and simple piers, and [wa-internal-map](https://github.com/kokoye2007/wa-internal-map/tree/998c27f89c976289c453381a0b9bfa029bfa7565) for furniture scale and distinct interior areas. These are composition references. No tiles or sponsor marks were copied from those repositories.

`shipyard-beach` now has an open harbour approach, stone quay, timber boarding piers and small moored boats. Its previous oversized ship display and advertising flight are retired; the separate FA Ship map and its entrance still work. `constellation-shore` has a continuous beach below a palm grove, an open games area, a small kiosk, loungers and a jetty. Both maps use small floor wayfinding instead of standing boards. The old source art remains archived for existing receipts.

The twelve zodiac rooms retain 36 audience chairs each. Solar and Lunar retain 60 audience chairs each, with warm and cool materials respectively. All fourteen rooms have clearer floor zones, a centered lectern, lounge furniture and their existing thematic details. Orange borders continue to match the listening zones. VarCamp is the only banner in zodiac rooms; BSides Myanmar and Vibe Code Tours remain in the two halls. Saved WAM controls, entrances, exits and inspection areas are preserved.

## Authoring and validation

`world/natural-coast.json` owns the two coast compositions and retained wildlife. `tools/art/natural-coast.ts` compiles their 32 px shoreline and dune tiles from already licensed project assets. `tools/maps/author-natural-coast.ts` exports those two maps. `assertNaturalCoast` is the complete current acceptance boundary for this new coast epoch: exact source projection, water collisions, connected entrances, saved areas, wildlife habitat and airborne depth are all required. The earlier island contracts remain historical and are not applied to the new geometry.

`world/room-refinement.json` records reversible changes to furnishing and signage only. `tools/maps/room-refinement.ts` links these to the existing room presentation checks. Floor materials use additive catalog aliases; earlier catalog entries and source sheets are retained.

Run long jobs in tmux. On this devbox, run tests one file at a time with no parallel heavy jobs, using `systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- <file> --maxWorkers=1`. The focused files are `tests/natural-coast.test.ts` and `tests/room-refinement.test.ts`.

Builds, art checks and browser runs also require the 6 GiB cap and zero permitted swap. Qualify source receipts, walk the candidate in WorkAdventure, deploy using `npm run deploy:demo -- --apply`, then verify live maps and saved WAMs before reporting completion. The legacy zodiac-physics snapshot test has a known stale predecessor assertion; do not run the whole historical suite uncapped or describe it as passing.
