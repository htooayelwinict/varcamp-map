# Expo partner roster implementation plan

**Goal:** Publish the organizer's corrected three sponsors, two media partners and four communities, with Ten Ten removed.

**Design and authorization:** The organizer authorized rearranging the rooms. Keep the prominent DigiSec Lab pavilion and label it Digital Safety Partner. Keep Newness as Spark Sponsor and Lokal Zaytann as Mini Sponsor, including the exact Myanmar name ဒေသစျေးတန်း. Retain the three western community booths. Make the eastern row three equal six-by-four rooms: OSRFM, Duwun and Open Taxi, with shared divider walls and south entrances. This fits within the existing expo bounds and preserves the central and outside paths. Compared with sharing one cramped media booth or expanding into the surrounding plaza, this gives each partner its own usable room without changing the campus circulation.

**Architecture:** Add one finite reversible successor to the reviewed sponsor source chain. Retain Ten Ten's unused atlas reservation for stable GIDs, but remove its painted layer, name and booth identity. Append native panels for the supplied media artwork and a reproducible Myanmar caption using the pinned Noto font. Keep originals and licenses. Update only affected source receipts and dependency fingerprints; preserve saved WAM data.

**Acceptance:** Nine partners appear under their supplied categories; no Ten Ten branding is rendered. Six lower booths have equal usable floor area, unobscured logos and reachable desk approaches from the outside walkway. All shared walls and desk surfaces block walking. All other maps, portals, arrival stations and saved meeting controls remain intact. Verify the candidate and live map visually after reload, then verify two complete upload readbacks.

## Work

- [ ] Write and observe failing roster, native rendering, room-access and artwork tests.
- [ ] Implement the bounded source/native transition, official logo exports, corrected captions and shared-wall layout.
- [ ] Run focused files separately with MemoryMax=6G and MemorySwapMax=0, type checking, map validation and artwork validation.
- [ ] Independently review the complete staged change with review-agent and code-review; resolve findings before committing.
- [ ] Prepare and inspect a live-preserving release, verify candidate screenshots, commit/push using htooayelwinict, deploy and verify live reloads and complete readbacks.

## Review focus

Missing or duplicated media panels; accidental Ten Ten painting through historical reservations; text wrapping or Myanmar fallback glyphs; desk or divider collisions blocking south entrances; historical replay and source-provenance regressions.
