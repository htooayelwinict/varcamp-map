# Plaza shoreline and gate approaches

The circular overworld has a narrow rocky bank outside its planted verge. The four cardinal gateways meet wider stone approaches. All twelve zodiac buildings, both halls, existing trees, roads, check-in desks, entry points and flight routes retain their positions.

`world/plaza-shoreline.json` records the exact additive layout change and the terrain/collision differences from commit `016fce2`. `tools/maps/plaza-shoreline.ts` applies or reverses that change and validates the bank's footprint. The atlas is an unchanged, credited LPC source sheet at `assets/tilesets/lpc-garden/terrain.png`; its licence and artist credits remain in the same directory. Nine native tile selections provide corners, sides and centre rock. No raster art was generated or modified for this change.

The bank and water are solid. The approaches are walkable; the gate pillars and visible lavender pots retain their own solid footprints. The opening through each gateway remains four tiles wide, broadening into the paved landing. Do not extend a solid shoreline tile into a gate opening or the outer road. Keep the public guide graph clear and requalify its source/geometry pins after changing the layout.

To validate changes, run each relevant test file separately in tmux with `systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- <file>`. The focused shoreline test covers water/bank collision, preserved objects, clear approaches and reachability. Browser checks must also walk the outer loop, test the bank with real keyboard input and traverse all four portals in both directions before deployment.
