# DigiSec Lab beach flight

The Shipyard Beach aircraft tows DigiSec Lab's official secondary logo on
a navy flag. Its title remains **Digital Safety Partner**. The original
PNG, approved crop and SHA-256 are retained in
[the sponsor recipe](../../art/source/harbour-sponsor.json).

The [renderer](../../tools/art/harbour-plane.ts) verifies the original,
fits the complete mark proportionally, and compiles two synchronized
native tile tracks. The aircraft retains its original pixels and speed
(80 pixels/second). The 352-pixel combined span uses a 23.6-second loop
so the entire flag clears the right edge before returning at the left.
Its existing 48-by-3-tile flight corridor stays above scenery and does
not alter collisions, paths, entrances, meetings, or runtime scripts.

The composite uses separate sponsor rights rather than labelling the
official mark CC0. The retired demonstration-banner asset is unchanged.

Acceptance requires the approved mark to remain readable, the tow line
to stay attached, the whole loop to render without seams, and current
hosted WAM data to survive deployment except for TMJ version tokens.
Local artifact tests do not establish hosted acceptance. Retain the
release receipt and live visual check before calling the change complete.
