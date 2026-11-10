# Arrival logo and main sponsor space

The VarCamp floor identity sits higher in the arrival plaza so the main sponsor
logos can be added below it when the organizers supply the artwork.

The four existing panels retain their pixels, size, horizontal alignment and
floor depth. Their combined bounds move from `(58,60,12,4)` to `(58,54,12,4)` in
32-pixel tile coordinates. The central stone approach ends at row 54 instead of
59; its last 20 cells return to the surrounding blue floor. The former logo
bounds `(58,60,12,4)` remain empty and walkable. No sponsor placeholders are added.

The fountain, check-in stations, booths, entrances, meeting areas, aircraft,
collision mask, native atlas reservations and saved WAM files are unchanged.
The welcome spawn remains at its existing position. On smaller viewports the
complete logo comes into view when walking north into the sponsor floor; the
old guarantee of showing the whole logo in the first frame is intentionally
retired by this higher placement.

The exact predecessor is retained in
`tests/fixtures/arrival-sponsor-space/before.json.gz`. The reviewed forward and
inverse transaction is defined in `world/arrival-sponsor-space.json` and enforced
by `tools/maps/arrival-sponsor-space.ts` in the current native-map validation.
Earlier historical tests restore that predecessor without rewriting old receipts.

## Acceptance

- All four native panels move north by 192 pixels with the same tile GIDs.
- The logo has a uniform blue background; its former space is unobstructed.
- All other layout fields and native map data are identical to the predecessor,
  except the 20 specified terrain cells.
- Normal map validation, art checks, previews and the release build pass.
- A fresh WorkAdventure browser session and a normal reload display the moved
  logo, clear sponsor floor and working arrival route after publication.

Run each relevant test file separately with the devbox memory limit:

```bash
systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- tests/arrival-sponsor-space.test.ts
```

The neighboring regression files are `event-identity`, `event-presentation`,
`check-in-counter`, `check-in-stations`, `plaza-shoreline` and `roadster-physics`.
Publication follows [the live-preserving release procedure](publication.md).
