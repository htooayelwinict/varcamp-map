# Enchanted Exploration — VarCamp

Lewis requested a complete overhaul of Exploration Court and its four places, inspired by Harvest Moon, with zodiac identity, dark forests, shadows, friendly ghosts, magic and enough optional activities to make this an adventure destination. The latest scope authorizes all five maps together. This is not a promise of a full day's bespoke game content; it is a connected, replayable social exploration district.

## Design decisions

Use the existing 32px WorkAdventure tile pipeline and licensed hand-drawn LPC assets. Retain file names, public entry names, connections to the four element districts, return to Zodiac Plaza, and the four-sigil observatory quest. Expand the five maps to 64 by 56 tiles. Replace the old sci-fi court, carpet, large boards and repetitive gate modules with a village green, woodland paths, water, cottages and ruin entrances. No changes to the accepted plaza/car/buildings, speaker rooms, harbour or other side maps.

- Exploration Court: a village trailhead with a pond, small timber cottages, welcoming central green and eight short signed trails to the four districts and four adventure areas. Optional field-guide station starts the adventure; wayfinding stays compact.
- Star Garden: sunny growing beds and orchard give way to dense shaded woods, winding trails, a fishing pond, mushroom circles and three zodiac discoveries. Main paths are 3-4 tiles wide; side paths reach actual destinations and reconnect.
- Moon Grotto: a winding cavern with blue pools, weathered ruins, a lantern trail, crystals and a friendly lost spirit. Three hidden discoveries and a moon-order puzzle; darkness is environmental rather than a black overlay that conceals navigation.
- Moon Cafe: a timber farmhouse cafe with a proper counter, tables, outdoor orchard terrace, herb beds and a secret reading nook. Three discoveries and a repeatable recipe puzzle; generous group seating without forced meeting zones.
- Stargazer Terrace: forested hilltop with a telescope platform, ruined zodiac stones, warm campfire seating, three discoveries and a constellation puzzle. Preserve the existing gated observatory interaction.

## Play and social use

A separate Expedition Journal offers twelve clue-based discoveries (three in each branch), four area activities and repeatable pond fishing. Collectible/solved flags save privately in WorkAdventure world player state, independently of the existing quest flags. Progress is idempotent; failures show a retry message instead of claiming a save. Full collection unlocks a short woodland-spirit story conclusion. No external game service, accounts, payments, forced media or autoplay. Journal interactions work with keyboard and touch; hints remain available and puzzles can be replayed. Visitors can also simply walk, discover scenery and chat. The four branches form a walkable portal circuit, with the Court and Plaza always reachable.

## Physics and visuals

Keep native sprite scale, bottom/trunk collisions and canopies above avatars. Water, cliff walls, building walls and counters are solid. Doors, bridges, every spawn, every exit and every action approach are walkable. Never cover the arrival cell with an exit or put an action under a blocking sprite. Compact labels appear at route choices. Add low-density magical animation using native tile frames, with a bounded atlas/memory budget and no polling loop when idle.

## Verification and delivery

Capture baseline map/WAM/source hashes, preserve saved editor WAM entities and unrelated areas, and migrate only owned areas for these five maps. Add a mandatory five-map successor projection/geometry contract; old historical fixtures remain intact. Validate routes with bounded BFS, visible collision footprints and action reachability. Run focused tests one file per 6GiB/no-swap systemd scope inside tmux, then native map/art/release checks. Inspect rendered maps and live WorkAdventure walkthroughs, test journal/puzzle/save/retry/keyboard/touch behavior and verify all portals. Use owner-authorized devbox deployment, retain receipts/readbacks, and close all test browsers with media disabled.
