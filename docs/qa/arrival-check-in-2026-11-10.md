# Arrival check-in expansion — 10 November 2026

Scope: three adjacent computer desks at the main arrival counter, a wider wooden platform, existing check-in links and full desk collisions. The twelve zodiac counters, sponsor reservation, guide route cells, doors, saved meeting areas and other maps are preserved.

The initial tests demonstrated the single-station limitation. Existing physical and sponsor-space checks rejected two draft placements; the final counter occupies tiles x=70–78, y=60–61, between the reserved sponsor floor and the guide path at x=79. Both ends and rows 62–64 remain walkable. No shared sprite, artwork, collision definition or runtime implementation was changed.

Verification artifacts are retained locally under `.orca/arrival-check-in-20261110/`: failing-first logs, individual capped test logs, candidate/live browser results and screenshots, and release archive comparison. Every test file and browser run is capped at 6 GiB with no swap, and long jobs run in tmux.

## Separate pre-existing finding

The complete guide-bot audit reports `native raised object overlaps route` on both the immutable pre-change fixture (`0854c8ee37bb73d74af6fec9adf6c0b805ea2c32a1a2d70450c5368e7703efd5`) and the candidate. This is separate from attendee navigation: all 864 guide route cells remain free of collision. Native object layers are byte-equivalent as parsed before and after this change. The guide geometry/module receipts cannot be requalified until that existing audit failure is addressed; no guide service or public/private guide pin is changed or activated by this task.

## Acceptance

Candidate acceptance passed in native Chromium: all three visible laptops opened `https://register.var.camp/2026/attendee/check-in` in separate tabs displaying “Check-in | VarCamp 2026”, with no opener and no automatic tab on approach. All 22 keyboard collision probes passed, with a successful free-movement control, clear perimeter and sponsor approach. No browser errors were reported. The eight targeted files passed 89 tests individually under the cap; all 34 maps passed native validation. The prepared archive preserves all 34 live WAMs and changes the other 33 maps only to reference the new script bundle.

Publication and a second live pass, including reload, are separate release gates. No attendee registration or ticket submission is performed.

## Saved quiet/highlight area

The first publication (`2549f62`) passed all three live laptop clicks and 22 keyboard collision probes. Final visual inspection after reload nevertheless found the saved highlight still ended at the old counter width: the third laptop was dimmed. This saved area was not present in the checked-in WAM used by the initial candidate preview. The user outcome was therefore still incomplete.

The follow-up owns only the width of live area `5051b43b-7d12-4272-bcaa-f6284bb4f58c`: 239 → 335 pixels. Position, height, quiet-mode and highlight properties, property IDs and all independent editor data are retained. `--arrival-check-in` is an opt-in migration; unexpected source edits, duplicate target IDs or another saved area intersecting the added strip fail closed. Native maps and runtime are unchanged.

The new test first failed on migration/admission being absent, then passed. Three individually capped files passed 48 tests: `ops/tests/arrival-check-in-zone.test.ts`, `ops/tests/migrate-wam-tokens.test.ts` and `ops/tests/release-upload.test.ts`. Artifacts are under `.orca/arrival-check-in-20261110/zone/`. The follow-up browser candidate must use the prepared live-derived WAM, followed by actual live reload verification after publication.

The live-derived candidate passed all three laptop clicks, 22 collision probes and reload. Quiet-mode detection passed at each station, including the rightmost one after reload; visual inspection confirms the third laptop is within the highlight. The prepared archive changes only `maps/overworld.wam`, with only that area's width changed in parsed JSON; all 34 native maps and the other 33 saved WAMs are byte-identical to the current live baseline. The candidate package SHA-256 is `bde19d389a2460328824992617c3fd8116cd6820f7aa773a44d1e1d07b422ddb`. Publication and actual live verification remain separate gates.
