# Walking Shortcuts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Remove the requested room-jump UI while preserving physical traversal and communication.
**Architecture:** Remove our menu/journal shortcuts; call WA's supported room-list control; use the hosted world's existing people-list setting. Keep the native door graph unchanged.
**Tech Stack:** TypeScript, Vitest, native arm64 Playwright, WA scripting and Admin.
**Spec:** docs/superpowers/specs/2026-11-13-programme-and-walking.md

## Global Constraints
- Hosted production world varcamp/world, directory varcamp-2026. No test directory or infrastructure changes.
- Preserve live WAM editor data; no credential output.
- User approved hiding the people list; keep chat and meetings enabled.
- Review staged code before commit. User's review/TDD requirements override any lighter skill guidance.

## Review Focus
- Scene reload must reapply controls and clean menu registration.
- A failed progress read must not restore shortcuts or break the journal.
- The observatory must retain its physical quest entrance.
- Removing shortcut copy must not leave dead buttons or misleading maze-reset instructions.
- Native world settings must preserve every unrelated option.

### Task 1: Remove shortcuts and verify the hosted outcome
**Files:** src/runtime.ts, src/journal/main.ts, src/journal/view.ts; tests/runtime-contract.test.ts, tests/journal.test.ts; publication receipts as required.
**Interface:** initializeWorld(api) continues initializing the journal and discoveries; controls adds disableRoomList. renderJournal renders an informational directory without room-jump actions.
- [x] Write failing tests for no jump menus, room-list disable before progress load, useful journal without destinations, and preserved telescope path.
- [x] Run `fnm exec --using 26.11.1 npm test -- tests/runtime-contract.test.ts tests/journal.test.ts`; verify intended failures.
- [x] Implement only those behavior changes and update obsolete navigation assertions.
- [x] Run targeted tests and full project suite; qualify source and build.
- [ ] Run independent requesting-code-review and code-review staged-diff passes, resolve findings, commit.
- [ ] Prepare preservation-checked production package; record native people-list baseline, toggle only that option and verify saved readback. Publish once using guarded uploader.
- [ ] Verify hosted guest controls, U key, keyboard walking and physical speaker roundtrip; record exact evidence and limits.
