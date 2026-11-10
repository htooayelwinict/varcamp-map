# Arrival Check-In Expansion Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan with failing-first tests and independent review before committing.

**Goal:** Expand the photographed arrival desk into three usable registration stations.

**Architecture:** Reuse the solid desk, laptop, floor label and existing deliberate new-tab check-in interaction. Add an exact reversible source successor after the sponsor layout; preserve native atlas reservations, protected controls and saved WAM edits.

**Tech Stack:** TypeScript, Tiled JSON, Vitest, native Chromium / Playwright.

**Spec:** User screenshot and request: “add more desks (widen up) and add more laptops to click for register.” Main arrival only; three adjacent 3×2 desks at (70,60), (73,60), (76,60), laptops centered on each. Widen the wooden platform to 9×5 tiles at (70,59). Center the existing CHECK IN label and garden on the middle station. The guide path at x=79 stays clear.

## Global Constraints

- Existing official check-in URL and separate browser tab; no registration submissions or new remote iframe permissions.
- Keep the 12 zodiac entrance desks, sponsor booths, logo, arrival spawn and guide paths unchanged.
- Every desk tile remains solid. Two front rows and both ends remain walkable.
- Each test file runs alone in a systemd scope capped at 6G with zero swap. Long jobs run inside tmux.
- Guarded publication preserves live editor data. No infrastructure, credentials, ports or meeting changes.

## Review Focus

- Adjacent interaction rectangles must not overlap or fire twice.
- All three laptop links must be clickable in the actual game after reload.
- Desk collision must be verified with keyboard movement, not only pathfinding.
- Recipe rollback must recover the exact prior layout and reject unrelated edits.
- Live upload must preserve all saved WAM objects and unrelated map geometry.

## Task: Expand the arrival counter

- [x] Add tests proving three distinct local clickable overlays, deliberate URL actions, solid desk cells, clear perimeter, and preserved unrelated source/native data; run red.
- [x] Implement the finite map successor, extend station data and regenerate only the overworld native projection. Update prior tests for the intentional larger counter.
- [x] Run the targeted tests individually, validate art/source receipts and guide routes, and prepare a release. Update English/Burmese operator guidance.
- [x] Exercise candidate click links, prompts, keyboard collisions, perimeter routes and screenshots in native Chromium.
- [x] Run requesting-code-review with review-agent, plus code-review; resolve findings before commit.
- [x] Commit and publish through the guarded release path, verify all three live laptop tabs and reload, record exact evidence and deployment status.

## Live saved-area follow-up

Live reload exposed an old-width quiet/highlight area that was absent from the checked-in WAM preview. The third laptop falls outside its highlighted boundary. The desk geometry, link and collision checks passed, but visual acceptance remains pending.

Scope: change only the width of saved area `5051b43b-7d12-4272-bcaa-f6284bb4f58c` from 239 to 335 pixels. Preserve its origin, height, IDs, all quiet/highlight settings and every other saved editor field. Reject changed source controls or a newly overlapping saved area. No native map or runtime changes.

- [x] Reproduce the live mismatch and write failing-first migration/admission checks.
- [x] Implement an opt-in bounded migration; run each targeted test file alone under the memory cap.
- [x] Prepare against the live WAM, inspect the exact width-only delta and test the reviewed saved area in Chromium, including reload and the third laptop.
- [ ] Independent review-agent plus code-review, commit, guarded publication, live verification and evidence update.
