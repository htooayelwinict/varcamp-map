# VarCamp wordmark proportions and alignment

Goal: retain the approved Russo One typeface while correcting the shared logo composition. Scope is the six PNGs and their deterministic exporter/provenance, with all native map footprints, placements, saved WAMs and original masters protected.

Validated cause: the exporter reused the prior font's independent coordinates. At entrance resolution, the subtitle center is 37 pixels left of VARCAMP and its 24-pixel line gap leaves the combined text block below the flame. Live hashed artwork and Chromium reloads match source, so this is a baked asset layout issue.

Implementation: proportionally reduce title widths from 282/141/94 to 266/133/88 pixels. Use the original flame at 74-pixel arrival height, half scale in rooms and 28-pixel booth height. Center each composition inside its unchanged PNG. Retain the exact arrival subtitle glyph bitmap, moved under VARCAMP; use a 10-pixel arrival gap and half-scale room spacing. No infrastructure, network or runtime font changes.

Acceptance: title/subtitle horizontal centers and text-block/flame vertical centers differ by at most one native pixel; image margins are balanced within one pixel; no overlap or clipping; seven white uppercase glyphs remain readable at all scales. Preserve 141 protected source/map/control files, exact original masters/font/licenses, native dimensions and arrival seams. All focused tests run individually inside tmux with 6GB RAM/no swap. Review the staged changes independently before commit. Prepare and inspect the release, preserve all 34 saved WAMs, then verify exact live artwork and browser reloads at entrance, info desk and Solar hall.

Known unrelated limitation: the historical hall-map pin in the existing event-identity placement test predates this change. Record it without changing maps or broadening scope.
