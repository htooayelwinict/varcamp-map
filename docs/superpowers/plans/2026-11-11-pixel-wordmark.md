# VarCamp pixel wordmark

User selected a readable pixel font for the VarCamp wordmark. Preserve the supplied magenta flame, MYANMAR 2026 subtitle, transparent backgrounds and all six existing export footprints. Keep the titlecase spelling VarCamp. This is an artwork export change, not a room or infrastructure change.

Use the existing export pipeline with a small explicit bitmap alphabet for the six distinct letters. Render white rectangles at integer pixel scales: 6px in the arrival lockup, 3px in the room mark, 2px in the booth mark. This avoids web-font availability and blurry resampling at the map's native sizes. Preserve the original vector source as historical evidence.

Acceptance: all six current exported logos use readable pixel lettering; every pixel outside the wordmark bounds matches the frozen predecessor. All 141 protected map/layout/WAM and source-art files stay byte-identical. Rebuild and check source registration; validate through a capped native browser at the arrival, info desk and a speaker hall. Preserve all live saved WAM data during the existing guarded publication and verify after live reload.

- [x] Establish baseline and failing-first typography/preservation tests.
- [x] Update only the wordmark export, metadata and provenance; run focused tests individually under 6G/no swap in tmux.
- [x] Review native-size and in-map previews; build and prepare a token-only live-preserving release.
- [ ] Independent review-agent and code-review passes before commit; resolve all findings.
- [ ] Publish to the existing map storage, verify exact readbacks and actual live browser display.

No new map placements, collision changes, new fonts fetched at runtime, infrastructure changes or uncapped test suites.
