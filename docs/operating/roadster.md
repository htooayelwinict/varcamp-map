# Plaza Roadster display

The silver Roadster-inspired car performs one longitudinal barrel roll during a rise and descent, then brakes and settles upright. The camera and nose-to-tail heading remain fixed. Sixteen body poses expose the side panels, wheels and underbody as the car turns; the roof is not spun as a flat picture. Cold-gas effects are separate from the body, with brief lift, attitude-control and landing pulses.

This is a compact pixel-art adaptation, not a physically scaled recreation of the forward leap over Tesla's vehicle lineup. The full loop remains 12.8 seconds on WorkAdventure's native 100 ms tile-animation cadence. The car starts and ends on the same pose, without a seam at the loop boundary. There is no browser timer, moving map actor, external video or network request for the effect.

## Location and collision

The display occupies tile `(83,53)` in a 5 by 5 tile frame. Every visible animation pixel stays within that frame. All 25 cells remain solid, so Wokas cannot walk through the car or stand on it. The walkway around the bay, all other object positions, doors, zones and the 864 guide-route cells are unchanged. The collision-only predecessor is recorded in `world/roadster-physics.json`.

## Reference checks and artwork

The motion was checked against Tesla's [The Kickflip](https://www.youtube.com/watch?v=r5vsHHPVhJg), [The Ramp](https://www.youtube.com/watch?v=7p5LxFdc-Qg), and [Roadster specifications](https://www.tesla.com/roadster), plus the [report on the November 3 POV video](https://www.teslarati.com/tesla-shows-off-roadster-kickflip-new-pov-video/). The ramp maneuver is distinct from the full airborne roll used here.

Direct YouTube playback required sign-in on the devbox, so only its official descriptions were readable there. For visual inspection, an accessible [44-second copy credited to Tesla](https://roadster.rocks/media/clips/kickflip.mp4), linked by its host to [Tesla's original post](https://x.com/Tesla/status/2110926164306931860), was sampled across its multiple camera angles. Separately credited crowd footage was used to distinguish the ramp approach. These clips are references only and are not redistributed in this repository.

`art/source/roadster-roll-poses.png` is the generated transparent 4 by 4 body-pose master. The built-in image-generation prompt, original car reference, timing and source links are retained in `art/source/roadster-flight-authoring.json`. The compiler registers each pose to a common longitudinal axis and length using nearest-neighbor sampling and binary alpha. It does not generate the roll by rotating one upright bitmap. The native contact-sheet preview is a required visual check whenever the master changes.

## Native ownership and reproducibility

| Epoch | Producer | Atlas | Reservation |
| --- | --- | --- | --- |
| v1, frozen | `renderRoadsterV1()` | `roadster.png` | GID 4330, vacated |
| v2, frozen | `renderRoadster()` | `roadster-v2.png` | GID 11783, retained as `roadster-v2-history` |
| v3, current | `renderRoadsterFlight()` | `roadster-flight.png` | GID 31670, appended after the 162 previous reservations |

Both older PNGs and their metadata remain byte-exact. The current `roadster` layer retains its id and 25 cells. `world/roadster-flight.json` records an exact reversible overlay transaction and the predecessor atlas body. `tools/maps/roadster-flight.ts` and the native ownership gate admit that single successor; all previous GID ranges remain unchanged. The new atlas stays below the 4 MiB decoded limit, using deduplicated 32 px tiles and 25 synchronized animation carriers.

`tools/art/roadster-flight.ts` compiles the master and authoring file into the atlas and metadata. The metadata records every pose registration and timed frame. Updating only those files is not a release: also update the exact overlay transaction, native map, source manifests and public guide pins, then run the normal reviewed author/build/deploy workflow. Do not regenerate the frozen 303-file source inventory or rewrite earlier publication receipts.

`tests/roadster-flight.test.ts` verifies the full roll, altitude arc, landing, pixel bounds, loop closure, source/native ownership and every frame through the checksum-pinned deployed Phaser parser. Historical v1/v2 tests remain in `tests/roadster.test.ts`. Run test files one at a time under the owner's memory limits, inside tmux:

```sh
systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 \
  npm test -- tests/roadster-flight.test.ts --testTimeout=30000
```

The public guide geometry digest and module/config pins change because decoration is part of the map signature. The route graph and collision mask do not change. Private guide services remain stopped; this release does not re-qualify their private pins.
