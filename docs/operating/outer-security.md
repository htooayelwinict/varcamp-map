# Outer-ring aerial patrols

Six additional camera quadcopters orbit the outer campus at radius 56 tiles. One unarmed H135-style helicopter follows a separate, opposite-direction circuit at radius 59 tiles. Each circuit lasts two minutes. Drone phases are spaced evenly, and the routes keep the helicopter and drones apart. The aircraft are decorative: they do not record, track attendees or send surveillance data.

The helicopter uses real light-helicopter proportions, a conventional cabin, tail, skids and animated rotor poses. The [Airbus H135 technical page](https://www.airbus.com/en/products-services/helicopters/civil-helicopters/h135/h135-technical-information) supplied proportions and configuration context. The generated artwork contains no manufacturer photograph or branding. Its retained master is `art/source/outer-security-helicopter-master.png`; the exact generation and correction prompts are in `art/source/outer-security/`. Existing original VarCamp drone poses are reused.

`art/source/outer-security-flight.json` records every bounded position and heading in a complete loop, including the wrap. `tools/art/outer-security.ts` compiles these into 53 synchronized native animation clips. Those clips represent seven aircraft, not 53 aircraft. Native animation runs locally in the map without player bots, a server loop or additional network traffic.

All clips use `aboveScenery` and sit after every previous map layer. They add no ground collisions. The physical collision layer, walking paths, entries, exits and functional zones stay exact. The existing eleven aircraft remain, bringing the overworld total to eighteen. Retained atlas ranges are never reused.

The new atlas textures decode to 36,503,552 bytes, bounded by a 64MiB budget. Each individual atlas stays within the native 4MiB cap. Run art generation and validation sequentially with MemoryMax=6G and MemorySwapMax=0. `tests/outer-security.test.ts` checks complete separated flight loops, drawing order, synchronized clocks and unchanged ground physics. Before deployment, inspect motion and overlap in the real client and walk beneath a flight lane.
