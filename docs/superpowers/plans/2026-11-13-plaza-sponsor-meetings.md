# Plaza sponsor meetings implementation plan

> **For agentic workers:** Use superpowers:executing-plans in the existing session; independent reviewers review before any commit.

**Goal:** Restore native text chat in the three owner-drawn sponsor meeting zones without changing their geometry.

**Architecture:** A named WAM migration recognizes only the exact three owned meeting/Matrix properties and preserves all other live data. The existing release validator and guarded full-world comparisons prevent unrelated edits or stale uploads.

**Tech Stack:** Python migration and release tools, Vitest wrapper, native arm64 Playwright and Orca.

**Spec:** `docs/superpowers/specs/2026-11-13-plaza-sponsor-meetings.md`

## Constraints and review focus

Preserve every area boundary, ID, name and unrelated property. Reject unknown chat/audio changes, duplicate identities, overlapping audio/chat/access areas and shared meeting names; allow harmless empty directory or description-only overlaps. Preserve editor metadata and entities. Refuse live drift before upload. Native chat is public to attendees inside that booth; no cross-booth conversation or Matrix API mutation.

## Task: narrow chat configuration migration

- [x] Add fixture-driven failing test through `wam_dependencies` for the three approved changes; require exact preservation, idempotence, rejection of geometry/property/cross-room drift.
- [x] Add `world/plaza-sponsor-meetings.json`, `ops/plaza_sponsor_meetings.py` and the named release validation branch.
- [x] Run focused publisher/migration tests and document pre-existing suite failures separately.
- [ ] Generate candidate from the fresh live backup, compare every non-owned field, and independently review staged changes.
- [ ] Request permission for six specified QA messages, if needed; do not send until approved.
- [ ] Commit, push under `htooayelwinict`, apply a guarded production release, and verify complete readbacks.
- [ ] Verify all three live meetings, native message inputs and approved bidirectional delivery, exit/re-entry and cross-zone isolation.
