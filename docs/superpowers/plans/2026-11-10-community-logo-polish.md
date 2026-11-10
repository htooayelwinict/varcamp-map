# Community logo and caption polish

The user approved removing AWS/OSRFM background boxes, balancing logo sizes/centering, fixing text/fonts, and explicitly using the original PNGs and export script rather than image generation.

## Validated scope

Live logo bytes match the checked-in exports. The previous exporter added opaque cream backings to two otherwise transparent originals; alpha-only crop bounds also retained faint padding that undersized Ten Ten. Booth captions were squeezed beside laptops into three tiles with mixed11/14px sizes and line breaks.

Preserve the four supplied original PNGs, original mark colors/aspect ratios and attribution. Correct their exports to transparent128×64 with a visibly centered mark inside120×56. Fit using alpha32 visible bounds plus a1% safety margin, retaining interior pixels and soft edges inside that crop. Keep Vibe Code Tours artwork. Place all five booth names below the logos on the outer frontage: full six-tile width, one line,16px Arial (the map's existing native font), consistent warm cream and 4px vertical padding. Native horizontal insets center the actual single-line glyphs. No wall/floor/furniture/collision changes.

## Execution

1. Add failing-first tests for transparent corners, visible logo height/centering/aspect ratio, reproducible exports from the unchanged supplied originals, and consistent unclipped captions clear of furnishings/art.
2. Adapt the existing export script into a reproducible checked-in tool. Export four marks without backings. Update artwork change notes, five caption placements and exact transition/publication receipts; retain all atlas reservations and source identities.
3. Run files separately under MemoryMax6G/MemorySwapMax0 in tmux. Check community presentation/logos/access, sponsor tiers/court, arrival/event/native regression gates; art/native-map/source/build checks. Inspect native WorkAdventure candidate and verify actual logo bytes, legible names and unchanged visitor routes.
4. Request independent review-agent and code-review on the staged tree. Resolve findings, commit once, publish as htooayelwinict through guarded live-preserving upload, verify readbacks and fresh live/reload screenshots.

Completion requires transparent correctly scaled original marks and readable consistent labels in the published map. Existing shared walls, five equal booths, guide paths, map controls and saved editor data must remain intact. Dark original brand colors are retained; the separate bright labels provide readable names without recoloring marks.

## Rendered alignment correction

The first candidate and independent reviewer exposed a renderer limitation: the pinned WorkAdventure TextUtils uses object width only for word wrapping, so halign:center does not center a single line. A failing rendered-center regression covers the correction. The existing sponsor native-context adapter applies five explicit horizontal offsets from the reviewed recipe; the authored tile footprints and all other labels remain unchanged. Candidate and live checks measure font widths and actual centers in addition to visual inspection. The shared builder and animation descriptors remain unchanged.
