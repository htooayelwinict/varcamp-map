# Arrival check-in expansion — 10 November 2026

Scope: three adjacent computer desks at the main arrival counter, a wider wooden platform, existing check-in links and full desk collisions. The twelve zodiac counters, sponsor reservation, guide route cells, doors, saved meeting areas and other maps are preserved.

The initial tests demonstrated the single-station limitation. Existing physical and sponsor-space checks rejected two draft placements; the final counter occupies tiles x=70–78, y=60–61, between the reserved sponsor floor and the guide path at x=79. Both ends and rows 62–64 remain walkable. No shared sprite, artwork, collision definition or runtime implementation was changed.

Verification artifacts are retained locally under `.orca/arrival-check-in-20261110/`: failing-first logs, individual capped test logs, candidate/live browser results and screenshots, and release archive comparison. Every test file and browser run is capped at 6 GiB with no swap, and long jobs run in tmux.

## Separate pre-existing finding

The complete guide-bot audit reports `native raised object overlaps route` on both the immutable pre-change fixture (`0854c8ee37bb73d74af6fec9adf6c0b805ea2c32a1a2d70450c5368e7703efd5`) and the candidate. This is separate from attendee navigation: all 864 guide route cells remain free of collision. Native object layers are byte-equivalent as parsed before and after this change. The guide geometry/module receipts cannot be requalified until that existing audit failure is addressed; no guide service or public/private guide pin is changed or activated by this task.

## Acceptance

Candidate acceptance passed in native Chromium: all three visible laptops opened `https://register.var.camp/2026/attendee/check-in` in separate tabs displaying “Check-in | VarCamp 2026”, with no opener and no automatic tab on approach. All 22 keyboard collision probes passed, with a successful free-movement control, clear perimeter and sponsor approach. No browser errors were reported. The eight targeted files passed 89 tests individually under the cap; all 34 maps passed native validation. The prepared archive preserves all 34 live WAMs and changes the other 33 maps only to reference the new script bundle.

Publication and a second live pass, including reload, are separate release gates. No attendee registration or ticket submission is performed.
