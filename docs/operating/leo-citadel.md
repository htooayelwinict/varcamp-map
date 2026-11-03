# Leo citadel exterior

Leo uses a stepped sandstone and slate building with an integrated bronze lion relief. Solar retains its gold sun palace. The replacement changes only Leo's exterior paint: the campus circle, building location, doorway, floor emblem, labels, road tiles and grounded collision cells stay exact.

The retained [generated master](../../art/source/leo-citadel/generated-master.png) and [image-generation prompt](../../art/source/leo-citadel/prompt.json) compile through [the sprite producer](../../tools/art/leo-citadel.ts) into a transparent 384 by 384 PNG, on the map's native 32px tile grid. The compiler uses a uniform nearest-neighbor fit anchored at the south edge.

The [source transaction](../../world/leo-citadel.json) records the preceding layout and atlas inventory. The separate old lion ornament is retired from painted layers, while its asset reservation remains allocated. The new atlas appends after the 104 preceding reservations. Never repack the historical zodiac atlas to update Leo.

Local roof rows 0–7 draw above the player and remain walkable behind the facade. Rows 8–11 retain the grounded wall mask; the centered two-tile doorway stays open on rows 9–11. The existing portal at map tiles (41–42, 107) still enters `speaker-leo`; its return lands at `from-speaker-leo`.

Use `tests/leo-citadel.test.ts` for the new design and footprint, and the current `audience-footprints`, `check-in-counter`, and `event-presentation` tests for surrounding behavior. Run each file separately under the devbox's 6 GB systemd memory cap. Check the live doorway in both directions and walk around the facade before completing a new release.
