# Community Outer Access Implementation Plan

> Execute inline with superpowers:executing-plans, failing-first tests and independent review before committing.

**Goal:** Let visitors enter all five community booths directly from the lower outer walkway, with their backs facing the sponsor booths.

**Architecture:** Reorient the five existing community footprints within their existing six-tile-deep row. Move the glazed backs from rows87–88 to83–84 and shift the four-tile usable floors, desks, logos and labels two tiles south. Keep every atlas, brand asset, sponsor booth and saved map control unchanged. Move the Community Corner floor label to the southern walkway.

**Tech Stack:** Existing reversible sponsor recipe, native Tiled projection, Vitest and native Chromium WorkAdventure verification.

## Scope and validation

The user requested opposite-facing, back-to-back sponsor/community rows. The live collision layer matches the checked-in map: all12 southern approach cells in each of the five community booths are blocked by their current glazed backs. This is authored map geometry, not a networking or deployment failure.

Reorienting the complete community row fits the request while preserving its footprint. Cutting a door through the existing back would leave the booths facing the internal aisle; moving the whole sponsor court would expand the requested scope. The existing crosswalk at row82 stays open behind the two rows; it also carries existing circulation/guide routes.

## Acceptance

- Every community desk can be reached from the southern outer road without entering any sponsor booth or the inner crosswalk.
- The two southern frontage rows are clear across each six-tile booth; a solid glazed north back separates each booth from the inner aisle.
- Five equal usable floors, all approved logos, BSides/Vibe adjacency, furnishings and legible labels remain.
- All164 atlas reservations, collision outside the community row, other sponsor placements, source WAMs and native controls remain unchanged. Only the community label moves onto the southern walkway.
- Live Chromium walks each booth from the outer road and returns outside; recorded positions stay south of the booth backs. Fresh reload shows the same layout and logo bytes.

## Tasks

- [ ] Write and observe a failing test for outer-road access, north backs and direct southern frontage.
- [ ] Reorient community placements in the source layout/reversible recipe, reconcile native/preview maps and refresh only exact successor/release receipts. Update existing geometry assertions for the requested orientation.
- [ ] Run relevant test files individually in tmux with MemoryMax=6G and MemorySwapMax=0; validate/build maps, art/source/facts, and inspect the WorkAdventure candidate.
- [ ] Review staged changes with review-agent and separate code-review bug/compliance passes; resolve findings before commit.
- [ ] Push using htooayelwinict, prepare/apply a live-preserving map release, verify editor-state preservation, full file readbacks, direct outer entry and fresh reload. Report actual deployment evidence.
