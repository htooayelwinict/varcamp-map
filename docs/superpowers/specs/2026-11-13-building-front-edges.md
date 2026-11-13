# Speaker building and hall front edges

The user confirmed Capricorn is fixed and requested the remaining eleven speaker buildings and two halls. The new screenshot is Libra. This extends the existing front-edge repair, not the building artwork or layout.

## Cause and design reassessment

All thirteen remaining exteriors still put the entire 12-by-12 sprite above avatars. Collision masks stop Wokas at the south edge, but their heads extend into the last sprite row and are painted over. The current source and downloaded production visual/collision layers match. This is an authoring depth defect, not a hosting or networking issue.

Use the existing `upperCells` partition consistently for the fourteen active exteriors: rows 0–10 above avatars; row 11 below them. Consolidate the validation rule behind a closed roster instead of accumulating per-building exceptions. Capricorn remains byte-for-byte unchanged in the catalog and map. Do not change unused historical sprite aliases.

## Approaches

- Selected: extend Capricorn's proven tile-depth partition. It preserves artwork, walking boundaries and entrances and needs no hosted engine customization.
- Moving collision boundaries outward would conceal the depth defect by keeping people away from the building and reducing walkable space.
- Moving whole buildings below avatars would break roof occlusion. Dynamic sprite sorting would require a much wider rendering change.

## Scope and invariants

Change only thirteen catalog depth partitions, their 156 bottom-row tile transfers in the native and preview plaza, and the current validation contracts. Preserve every collision cell, upper tile, atlas, door/return control, map envelope, board, label and unrelated visual cell. Preserve every latest live WAM editor field; only update the map's content-hash cache token. No artwork edits, room-interior changes, chat messages or new assets.

The Leo, Cancer and horned-citadel art validators also compare catalog descriptors and pin the map-guard source hashes. Update those current contracts and their source records together, retaining exact image/master/render-metadata checks. The nine art integration tests first fail against the old contracts; correct front partitions pass, wrong partitions and missing shared-rule provenance remain rejected. The broad suite's six newly named failures versus the older recorded snapshot all reproduce at the exact pre-change commit; unrelated historical fixtures remain outside scope.

## Acceptance

1. Failing-first tests prove the incorrect native, preview and generated depth for the remaining thirteen buildings; Capricorn is a control. Tests cover every sprite cell and preserve the untouched map/catalog state.
2. Current validation accepts the corrected exports and rejects missing/wrong partitions and unrelated footprint changes. Typecheck, 34-map validation, source provenance and release-facts checks pass. Previously authorized historical test failures stay recorded separately.
3. Independently review the staged change and exact deployment package before the single commit/upload. Require a confirmed quiet editor window before upload. Two baseline checks detect earlier editor drift; they are not atomic protection against saves during upload. Read back the complete world twice.
4. In production, approach both accessible front sides, verify the unchanged collision stop and visible Woka, move along the edge, enter every building through its real door and walk back. Include Capricorn as a regression control. Hall probes start on their walkable forecourts, not blocked coastline cells.
5. Close every QA browser in `finally`; preserve the user's Admin tab. Local tests and candidate screenshots are not production completion.
