# Zodiac building and hall review

The November 2026 exterior review keeps the campus circle and the existing entrances. Cancer receives a new coastal crab citadel because its preceding scallop roof read as a shell rather than its zodiac animal. The other buildings already have distinct silhouettes and retain their artwork.

| Building | Architectural identity | Decision |
| --- | --- | --- |
| Aries | Copper ram horns and angular roof | Keep |
| Taurus | Broad bull horns and green stonework | Keep |
| Gemini | Two towers joined by a bridge | Keep |
| Cancer | Limestone claw towers, segmented copper roof and crab relief | Replace shell pavilion |
| Leo | Stepped stone citadel and integrated bronze lion | Keep the preceding redesign |
| Virgo | Planted greenhouse with wheat finials | Keep |
| Libra | Balanced domes and scales | Keep |
| Scorpio | Dark armored roof and raised scorpion tail | Keep |
| Sagittarius | Bow and arrow roof structure | Keep |
| Capricorn | Steep mountain roof and curling horns | Keep |
| Aquarius | Paired amphora spillways | Keep |
| Pisces | Paired fish around the central entrance | Keep |
| Solar | Gold sun palace | Keep |
| Lunar | Blue moon observatory dome | Keep |

## Cancer source and editing

The [generated master](../../art/source/cancer-citadel/generated-master.png) and [prompt](../../art/source/cancer-citadel/prompt.json) are retained. [The compiler](../../tools/art/cancer-citadel.ts) uniformly fits the complete transparent subject into a 384 by 384 pixel canvas, centered and anchored at the south edge. It uses nearest-neighbor sampling on the map's 32px tile grid.

The building stays at tiles (58,102), with a 12 by 12 tile extent. Its two-tile entrance remains at (63–64,113), leading to `speaker-cancer`; returning from that room uses `from-speaker-cancer`. Roof rows 0–7 draw above the avatar and allow walking behind the projected roof. The grounded lower walls retain their collision mask, including the open central doorway.

The [source transaction](../../world/cancer-citadel.json) records the exact predecessor, placement change and protected native layers. The new atlas appends after all 105 preceding atlas reservations. Original zodiac artwork, map controls, floor emblems, road tiles, collision cells and saved WAM editor data remain unchanged. The old Cancer sprite stays in the retained source atlas for recovery.

Recompile with `node --import tsx tools/art/cancer-citadel.ts` inside the devbox's capped job scope. Include the license and attribution in `assets/tilesets/cancer-citadel/` when distributing the map. Do not replace the original shared zodiac atlas to make a future correction.

## Verification

`tests/citadel-review.test.ts` checks Cancer's footprint and bounded walkable connectivity from the arrival floor to all 14 entrances and return pads. Run each affected test file alone with `systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- <file> --maxWorkers=1`.

Before releasing a later change, inspect the building at game scale, walk behind its roof, verify that the lower walls block movement, and enter and leave through the existing portal. For a whole-campus review, exercise all twelve speaker entrances and both hall entrances in both directions. Follow the devbox deployment workflow and preserve live editor data with a token-only WAM migration.
