# Community logo integration implementation plan

> Execute inline using superpowers:executing-plans, failing-first tests and independent review before committing.

**Goal:** Publish all four approved PR #9 marks in the expo and add Ten Ten while retaining Vibe Code Tours.

**Architecture:** Merge the four original PNGs from PR head `9c0aa287d4b427839a03a0595ecdb2d0fd9f0ec2`, retaining contributor history. Fit native 128×64 logo panels with original colours and proportions. Extend the existing reversible sponsor recipe; admit only the two new OSRFM/Ten Ten atlas reservations after all existing reservations.

**Stack:** Existing Sharp asset export, Tiled JSON, TypeScript/Vitest, native Chromium acceptance.

## Design and scope

The user explicitly chose five communities, retaining Vibe Code Tours. Use five equal six-by-four floor areas within the existing lower community row: AWS, BSides and Vibe on the left; OSRFM and Ten Ten on the right. Each keeps a desk, laptop, plant, four-by-two logo and readable name. Labels sit beside the desks; logos occupy the clear front floor. Keep the north entrances, central columns62–65 and south row89 open. The main/Spark/Mini sponsors and arrival stay as approved.

Alternatives considered: replacing Vibe contradicts the user's choice; putting a fifth booth in the main garden removes the newly approved planting; extending south would change circulation outside the expo. Compact equal booths retain the existing site boundary and paths.

## Acceptance and review focus

- All four retained originals match PR #9 byte-for-byte; credits record each owner, approved event use and website. No generated or recoloured replacement branding.
- Four native panels use the complete mark at its original aspect ratio. A light backing supports the dark OSRFM mark; Ten Ten's white mark stays on a dark floor.
- Exactly five accessible community booths; no desks or plants cover logos/labels, no guide or fleet path is blocked.
- Existing native atlas intervals and protected map objects remain unchanged. Only OSRFM and Ten Ten append eight-cell reservations; reject duplicate, renamed, malformed or misplaced reservations.
- Shared ownership-code fingerprints require a mechanical update of the existing 48 animation descriptors/36 registrations. Native maps and animation pixels outside the expo remain unchanged; exact provenance receipts prove this scope.
- Run each test file alone in tmux with MemoryMax=6G and MemorySwapMax=0; never use the uncapped suite.

## Tasks

- [x] Write and observe failing integration and atlas-admission tests.
- [x] Import PR originals, export native panels, update credits and the five-booth recipe; add the two strictly bounded atlas roles. Reconcile native/preview maps and update exact dependency receipts.
- [ ] Run focused tests, art/map/source/facts/build checks; inspect actual WorkAdventure candidate and walk all five booths.
- [ ] Review staged changes with review-agent and separate code-review bug/compliance passes; resolve every finding before the merge commit.
- [ ] Push as htooayelwinict, apply a guarded live-preserving release, verify full readbacks plus fresh-browser/reload logos and routes. Confirm PR #9 merged through ancestry.

## Validation evidence

Stage1 confirmed PR9 contains only the four approved originals; no live map wiring exists for OSRFM or Ten Ten. The existing event caption adapter assumed three fixed signs; retiring two in this layout required filtering its paint rows while retaining the full caption atlas. A failing test demonstrated the two undefined rows before the correction.

Stage2 focused coverage: community-logos4, community-expo-context6, sponsor-tiers7, sponsor-court6 and sponsor-tier-provenance3 tests pass, each file run separately with a6GB memory cap and no swap. All162 earlier atlas reservations are unchanged; two8-cell marks append last. Native captions, source placement, reachability, contrast exports, provenance and ownership are covered.
