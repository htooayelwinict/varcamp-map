# Reference-style VarCamp wordmark implementation plan

> Execution: superpowers:executing-plans; failing-first tests and independent review before commit.

Goal: match the organizer's supplied bold, squared uppercase lettering using Russo One, a close visual match rather than a claimed exact identification. Supersedes the earlier titlecase pixel selection. Keep the supplied magenta flame, MYANMAR 2026 subtitle, all six image dimensions and all map placements unchanged.

Architecture: retain the current deterministic Sharp export pipeline. Bundle the unmodified Russo One font and its SIL OFL attribution; rasterize VARCAMP at build time. Copy only nontransparent wordmark pixels into the flame/subtitle canvas to preserve existing pixels exactly. No runtime font or network dependency. Use proportional, centered text within the existing wordmark bounds at all three native sizes.

Alternatives: manually drawing another bitmap font would miss the reference's contours; screenshot extraction would carry blur/glow and background artifacts. A bundled licensed font gives clean contours and reproducible exports.

- [x] Freeze the current six PNGs and 141 protected map/layout/control/source hashes; replace the obsolete pixel-style assertions with failing uppercase/font/weight checks in tests/pixel-wordmark.test.ts.
- [x] Update tools/art/event-identity.ts and derived art/provenance only. Pin bundled font bytes and retain OFL attribution. Preserve the prior bitmap recipe as historical source.
- [x] Pass typography, protected pixel/seam/source checks; run applicable event-identity and plaza original-art tests separately under 6G/no swap inside tmux. Record the known pre-existing historical hall-map pin mismatch separately.
- [x] Build/check artwork and inspect native plus candidate entrance/info/hall previews. Prepare a release preserving all 34 saved WAMs except map URL version tokens.
- [ ] Stage the final tree, run review-agent plus independent code-review passes; resolve feedback before commit/push.
- [ ] Publish through the existing guarded workflow, verify two full file readbacks and actual live browser reloads at the entrance/info desk/hall.

No infrastructure, interactions, collision, stage captions or layout changes. Keep all original brand art and the previous pixel recipe. No uncapped suite or parallel test files. The only text change is uppercase VARCAMP, matching the new reference; the subtitle remains MYANMAR 2026.
