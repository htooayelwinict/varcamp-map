# Building Front Edges Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this single scoped task with the user's required independent review before committing.

**Goal:** Keep approaching Wokas visible at all twelve speaker buildings and both halls.

**Architecture:** Extend the existing explicit upper-cell partition to the thirteen remaining active exterior sprites. A closed shared validation rule replaces the Capricorn-only exception; existing map generation and collision behavior remain unchanged.

**Tech Stack:** TypeScript, Vitest, Tiled JSON, native ARM64 Playwright, existing guarded WA cloud uploader.

**Spec:** `docs/superpowers/specs/2026-11-13-building-front-edges.md`

## Global constraints

- Preserve Capricorn, all collision/door controls, artwork, boards and owner WAM edits.
- Change exactly 156 bottom-row tile positions in each of two existing visual layers; do not regenerate unrelated preview content.
- No shared chat messages; close QA sessions after each run.
- Deployment target remains production `varcamp-2026` on `world-43813.map-storage.workadventu.re`.

## Review focus

- An omitted building or the unused old zodiac alias must not silently receive the wrong partition.
- Incorrect upper-row/last-row depth, duplicate tiles or a changed collider must fail tests.
- Native/preview divergence outside the owned rows must remain unchanged.
- Live editor saves must survive packaging; snapshot drift must stop the upload, and a confirmed quiet editor window must cover the non-atomic upload.
- Browser setup must use walkable ground and dismiss tutorials before visual evidence is accepted.

## Task 1: Shared front-edge partition and production acceptance

**Files:** Add `tools/maps/building-front-edges.ts` and `tests/building-front-edges.test.ts`; update the catalog, two plaza TMJs, current guards in audience-footprints/Leo/Cancer/horned-citadels, the existing Capricorn regression tests, and exact publication receipts.

Art integration: add `tests/building-front-art.test.ts`; update the Leo/Cancer/horned-citadel art guards and only their `art/sources.json` families so current depth checks and pinned source hashes agree. Preserve the original recipes, PNGs, masters and generated metadata.

**Interfaces:** `currentBuildingFrontSprite<T extends object>(id: string, sprite: T): T` returns the expected current descriptor for the closed exterior roster, retaining the historical JSON recipe's inferred fields. Consumers compare the actual descriptor against this expected descriptor without weakening any other field check.

- [ ] Write native/preview/generated front-edge tests and invariant checks using literal building identities, coordinates and pre-change hashes. Run them against the baseline and record expected failures.
- [ ] Apply only the reviewed thirteen partitions and 156 tile transfers. Connect current guards to the shared finite rule. Update the Capricorn tests' broader preservation assertions without losing Capricorn depth coverage.
- [ ] Verify focused tests, typecheck, all map validation, provenance and release facts. Record baseline-only failures separately if encountered.
- [ ] Build a package from a fresh complete cloud snapshot. Verify only the plaza TMJ and WAM cache token differ; all live editor fields and other files survive.
- [ ] Run candidate browser checks, then requesting-code-review and code-review on the staged diff/package. Resolve all verified findings before the single commit and push.
- [ ] Confirm a quiet map-editor window, then upload with unchanged-baseline guards and complete readbacks. Verify all fourteen frontages and door round trips in production, save screenshots/positions and close the browser. Report deployment and any unmet acceptance criteria exactly.
