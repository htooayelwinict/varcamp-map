# Expo Booth Meetings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Six separate muted-on-entry booth meetings with eight-person caps, and muted-on-entry sponsor meetings without booth caps.

**Architecture:** Apply a narrow named WAM migration to the live saved plaza. The publisher admits only the exact generated change and preserves the paired TMJ and all independent live files.

**Tech Stack:** Python migration/publisher, JSON contract, Vitest/Python integration tests, Playwright hosted acceptance.

**Spec:** `docs/superpowers/specs/2026-11-13-expo-booth-meetings-design.md`

## Global Constraints

- Production target `varcamp-2026`; the booth task owns only `maps/overworld.wam`. The separately approved logo task adds one PNG and updates only twelve speaker TMJ image references and twelve WAM version tokens.
- Preserve the three owner-drawn sponsor geometries and all unrelated editor content.
- Eight-person caps on six new booths only; no sponsor caps.
- All nine meetings start audio/video muted with native chat enabled.
- Failing-first implementation, independent code review before commit, guarded upload and live verification.
- No shared QA messages without explicit scoped permission; always close owned QA sessions.

## Review Focus

- Concurrent owner edits must be retained or cause a fail-closed drift guard.
- Duplicate identities or meeting names must not merge conversations.
- Functional overlaps must not mute passersby or block shared paths.
- Wrong JSON types must not bypass exact matching (notably booleans versus integers).
- A cap must never be added to the three existing sponsors.

### Task 1: Guarded native booth configuration

**Files:**
- Create: `world/expo-booth-meetings.json`, `ops/expo_booth_meetings.py`.
- Modify: `ops/release_upload.py`, `publication/source-manifest.json`, `docs/current-release-facts.md`.
- Test: `ops/tests/expo-booth-meetings-fixture.py`, `ops/tests/expo-booth-meetings.test.ts`.

**Interfaces:**
- Consumes: live WAM object and `wam_dependencies(release, baseline, reviewed_wams)`.
- Produces: `expo_booth_meetings_candidate(path, data) -> dict | None`; `is_expo_booth_meetings_wam_change(path, before, after) -> bool`; migration name `expo-booth-meetings-v1`.

- [ ] Write a publisher integration test using a hand-derived before/after WAM: preserve manual data, append six floor-confined meetings with cap 8, mutate only the two sponsor mute flags. Include unsafe output and ambiguous-input cases named above, idempotence and input nonmutation.
- [ ] Run `python3 ops/tests/expo-booth-meetings-fixture.py`; expect the existing publisher to reject the new migration before the implementation exists.
- [ ] Implement the exact JSON contract and migration, then register its predicate in `wam_dependencies`.
- [ ] Run the new fixture, existing sponsor-chat fixture, focused publisher tests, TypeScript check, map validation, source verification and release facts check. Expect scoped checks green; retain recorded historical full-suite failures.
- [ ] Prepare a fresh WAM-only package and audit preservation. Obtain independent requesting-code-review and code-review; resolve every actionable finding before commit.
- [ ] Commit and push the reviewed change. Confirm a quiet editor window, then deploy using two preflight snapshots and two full-world readbacks.
- [ ] Run bounded hosted acceptance for muted arrivals, chat availability, six meeting identities, normal entry/exit and isolation, plus occupancy blocking/release. Close QA browsers. Report deployed result separately from any unverified load/capacity claim.

### Task 2: Enlarge the shared entrance logo (parallel, explicitly added by user)

**Files:** `tools/art/sponsor-logo-export.mjs`, `art/source/sponsors/tier-logos/exports.json`, `assets/sponsors/sponsor-digisec-entrance.png`, `tests/speaker-entrance-sponsors.test.ts`, `tests/sponsor-logos.test.ts`, `tests/fixtures/sponsor-digisec-entrance-plaque-before.png`, `ops/entrance_logo_refresh.py`, `ops/tests/entrance-logo-refresh.test.ts`.

**Interfaces:** Consumes official artwork and a fresh hosted file dictionary. Produces the enlarged shared PNG and `entrance_logo_refresh(live, png) -> dict[str, bytes]` containing only the new hashed PNG, twelve image-reference-only TMJs and twelve token-only WAMs.

- [ ] Write/run a failing image test for the enlarged full mark and unchanged frame/title.
- [ ] Implement the 56 by 50 mark fit; regenerate the shared sign, verify original brand pixels and export reproducibility.
- [ ] Write/run a failing hosted-refresh test for all twelve rooms, preserving unrelated bytes and rejecting unexpected image references, dimensions or asset contents.
- [ ] Implement the exact reference refresh using the existing token-only WAM helper, and run the focused test.
- [ ] Root integrates source hashes and reviews both task diffs before committing. The combined deployment must retain all unrelated world files; visually verify fresh hosted artwork in all twelve rooms.

## Added-scope integration

The user's logo request extends the remote allowlist from plaza WAM only to that WAM plus twelve speaker TMJs and twelve speaker WAMs, adding one new hashed PNG. Shared manifests and publishing remain root-owned. No live editor geometry, speaker meeting behavior, original logo source, layout or physics changes are authorized by this addition.
