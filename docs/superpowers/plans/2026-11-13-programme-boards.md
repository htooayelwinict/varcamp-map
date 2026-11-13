# Programme Boards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Give attendees readable, deliberate access to the official timetable without using sponsor space; move the approved arrival markers onto the existing VarCamp logo.
**Architecture:** A versioned schedule snapshot feeds the panel and nearby board faces. Native signage supplies physical supports and collisions; runtime supplies deliberate actions and one toolbar button. Preserve the cloud's live WAM state on publication.
**Tech Stack:** TypeScript, Vite, HTML/CSS, existing Tiled sprites, Vitest, native arm64 Playwright.
**Spec:** docs/superpowers/specs/2026-11-13-programme-and-walking.md

## Global Constraints
- 15 November 2026, Asia/Yangon UTC+06:30; 56 talks, 12 rooms, three pending profiles.
- Main board at x54,y55,width4,height3 left of the arrival logo; keep the expo and reserved sponsor floor clear. Other boards sit beside exterior speaker doors.
- No teleport, auto-popup, sponsor overlap or live-WAM replacement.
- Existing source qualification and full-world guarded production uploader remain mandatory.

## Review Focus
- Date/time boundary and browser timezone differences must not show stale talks as current.
- Invalid room query, Burmese search and long names must remain readable and safe.
- Slow frame creation after walking away or scene disposal must not leak boards/actions.
- Native board supports must not obstruct check-in or doorway approaches.
- Programme panel must not interrupt an established public-room connection.

### Task 1: Shared programme page and access
**Files:** src/programme/{main.ts,style.css,index.html,access.ts}, world/programme.json, src/runtime.ts, buildmap.vite.config.ts, tests/programme*.test.ts.
**Interfaces:** the page selects snapshot rows by room/view/search and exact time boundaries; openProgramme(api, room?) opens the local panel; registerProgrammeAccess(api) adds toolbar access.
- [x] Fail first on missing Programme action; then implement menu/toolbar boundary.
- [x] Fail browser page assertions for 56 rows, room/search filters, pending profiles, time boundaries and responsive rendering; implement minimal model/page.
- [x] Verify real DOM, Myanmar font, escaping, external-link origin, close and no navigation side effects.

### Task 2: Native boards and runtime actions
**Files:** world/programme-boards.json, tools/maps/programme-boards.ts, tools/maps/plaza-native.ts, world/layouts/overworld.json, maps/overworld.tmj, src/programme/boards.ts, tests/programme-boards.test.ts.
**Interfaces:** board data defines id/room/face/support/approach rectangles; apply/restoreProgrammeBoards performs only the reviewed additions; registerProgrammeBoards(api) owns nearby frames and prompts.
- [x] Fail first on absent 13 boards; prove independent expected geometry, reachable approaches and protected doors/expo.
- [x] Add reviewed signage, preserve existing native GIDs/layers, and test reversal/tamper rejection.
- [x] Fail lifecycle tests for explicit activation, stale callbacks, slow create and cleanup; implement nearby frames and prompts.

### Task 3: Review, publish, verify
**Files:** source revisions and extension receipts; release QA under .qa/programme-20261113.
- [x] Run project tests, source qualification, TypeScript and production build in tmux with 6GB memory cap.
- [x] Run local browser checks and hosted candidate response substitution without publishing test files.
- [x] Independently review staged changes via requesting-code-review and code-review; resolve all feedback before commit.
- [ ] Prepare package from fresh full-world baseline, preserve WAM bytes except owned TMJ URL pins; guarded production upload with exact readback.
- [ ] Verify the public-plaza board, all 12 room boards, toolbar, responsive panel, physical routes and room-connection continuity on hosted WA. Report evidence and remaining blockers accurately.

### Approved arrival adjustment
- [x] Add a failing assertion for `welcome` and `start` at x63,y55,width2,height2, clear of collisions.
- [x] Move only those markers through the exact reversible programme transaction; preserve return entries.
- [ ] Verify a fresh hosted guest starts on the logo and can walk away.

### Review corrections and baseline scope
- [x] Failing-first browser regressions cover stable keyboard focus, exact slot boundaries and the pre-opening state.
- [x] Model synchronous website creation with asynchronous host acknowledgement; verify late completion cleanup.
- [x] Integrate the complete programme transaction as the next explicit layout epoch, retaining historical projection checks.
- [x] Final full regression comparison must introduce no failures beyond the recorded, explicitly deferred historical baseline.

Pre-publication evidence: all 34 current native gates pass; TypeScript and build pass. All 13 browser scenarios pass, including focus retention and exact/crossed time boundaries. The complete suite retains the authorized historical baseline; five changed-spawn assertions were reconciled with their explicit epochs, and the targeted rerun adds zero failure headings. Candidate hosted verification opened all 13 boards and completed a physical Aries round trip, logo spawn and two-attendee Libra meeting continuity. Independent requesting-code-review and both code-review bug/compliance passes are clear. A black rectangle seen only in browser screenshots was isolated to Chromium cross-origin iframe capture: actual Xvfb framebuffer remains clean before and after capture. Production acceptance is still pending.
