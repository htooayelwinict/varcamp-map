# Sponsor court refinement implementation plan

> Execute inline with superpowers:executing-plans, failing-first tests and independent review before commit.

**Goal:** Decorate the approved tiered expo and make its entrances, walls and circulation feel intentional.

**Architecture:** Refine the existing sponsor recipe and native layout with already-reserved tile assets. Retain the original reversible predecessor and all unrelated controls. No shared runtime code, new artwork, meeting providers or new map areas.

**Tech stack:** Tiled JSON, existing WorkAdventure tiles, TypeScript/Vitest, native Chromium acceptance.

**Design / approaches:** Keep the accepted seven-booth hierarchy. A closed-room layout would obscure sponsors and constrain circulation; decoration alone would leave the awkward inward walls. Use open pavilions around the existing crosswalks: main north/south access, Spark east-facing, Mini west-facing, communities north-facing. Glass wall sections replace long opaque rear walls. Existing sofas gain small tables and rugs; secondary sponsors gain seating and plants; community booths gain compact greenery. A planted seating pocket occupies the empty west apron. These furnishing choices are implementation decisions within the user's requested refinement.

## Constraints and review focus

- Expo only: x38–89/y65–89. Main remains largest, then Spark, Mini, four equal communities. Info Desk remains.
- Preserve all entries, exits, meeting areas, WAM data, exterior collisions, logos and reserved atlases.
- Central route x62–65 and crosswalks y74,75,82,89 remain open. Side-booth entrances are at least three tiles wide.
- No labels hidden by scenery; no furniture over logos; no new props in existing fleet lanes.
- Native walls block correctly. Lamps and plants retain their existing base footprints.
- Every test file alone in tmux with MemoryMax=6G and MemorySwapMax=0. No uncapped full suite.

## Tasks

- [x] Write `tests/sponsor-court.test.ts`: physical inward doors and open main front; accessible furnished booths with tiered usable floor; green seating pockets; clear logos. Observed three failures against 9c27849 before implementation.
- [x] Refine `world/layouts/overworld.json` and `world/sponsor-tiers.json`; reconcile `maps/overworld.tmj`, preserving atlases and controls. New tests and existing sponsor/fleet checks pass individually.
- [x] Build preview/release; inspect native WorkAdventure candidate and walk all entrances. The label regression caught an OSRFM plant overlap; repositioned the community pots. Review caught a blocked Mini sofa approach; added a failing-first check and moved the sofa north. All label and seating checks and 20 browser visits pass.
- [ ] Update exact transition/publication receipts and generated facts; run required art/map/source/facts checks. Request independent review and code-review; resolve all findings before commit.
- [ ] Push and apply a live-preserving release plan, verify full readbacks, fresh browser visit/reload and saved room data. Report actual deployment status.
