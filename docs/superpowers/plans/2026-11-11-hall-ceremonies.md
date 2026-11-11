# Hall Ceremony Labels Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans with failing-first tests and independent review before committing.

**Goal:** Solar Hall reads OPENING CEREMONY; Lunar Hall reads CLOSING CEREMONY; neither shows community logos or their heading.

**Architecture:** Add an exact reversible hall-only successor at the end of the event-presentation composition. Leave the animation producers and their receipts untouched. Remove the two community image placements and their heading; retain the decorative wall and VarCamp mark. Regenerate only the two hall maps and previews. Live WAMs receive only map-version token updates.

**Tech Stack:** TypeScript, native Tiled maps, Vitest, capped native Chromium.

**Spec:** User screenshot and explicit request, 11 November 2026. Text uses existing stage-label position, font, size and color. No room redesign, furniture, collision, seating, stage rights, meetings, entrances or community-expo changes.

## Validation and acceptance

Live map inspection reproduces PRESENTATION STAGE plus BSides and Vibe Code Tours image layers in both halls. Matching layout sources own those labels/images. This is an authored-content change; no infrastructure or saved-control migration is needed. Removing the obsolete COMMUNITY PARTNERS heading avoids an orphan caption. Retaining the wall paint avoids changing room geometry.

Acceptance: both reviewed native maps and the reloaded live halls display the exact ceremony text, retain VarCamp, and contain neither community image layers nor the heading. Native collision and functional map data must remain equal to the frozen predecessor; all saved WAM bytes outside mapUrl version tokens must be preserved.

## Review focus

- A future rebuild must retain the requested captions and absent community artwork.
- Preserve unrelated labels and the VarCamp mark.
- Preserve physical tiles, seats, right-side stairs, audience/stage rights and saved editor data.
- Reject unexpected source edits; the inverse must recover the exact predecessor.
- Inspect the live-derived WAMs and reload both actual halls after publishing.

## Task

- [x] Add failing tests for both authored and native ceremony displays, round-trip/source rejection and frozen physical/functional preservation.
- [x] Implement `tools/maps/hall-ceremonies.ts` with its two-hall contract, compose it at the event-presentation boundary, and author only the two maps.
- [x] Run relevant test files individually with `systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- <file>`; validate all native maps, update publication receipts and build.
- [x] Prepare a guarded release and inspect exact deltas; verify both candidate halls visually in Chromium.
- [ ] Run requesting-code-review with review-agent and code-review before committing. Publish and verify the actual live maps after reload; record exact evidence and deployment status.

Long jobs run inside tmux. No uncapped/grouped test suite, AWS access, new public ports, runtime changes or service restarts.
