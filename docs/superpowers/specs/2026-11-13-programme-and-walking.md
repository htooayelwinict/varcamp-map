# Approved programme and walking experience

The user approved the public-plaza programme mockup and explicitly excluded sponsor space. The teleport change is a separate request approved during that work. On 13 November they also approved hiding the whole WA people list after the platform limitation was explained.

## Programme

Use the official 15 November 2026 programme, in Asia/Yangon (UTC+06:30), fetched 13 November at 13:03:43Z: 56 scheduled talks, 12 zodiac rooms, three published profiles without slots. Do not invent slots or translate/correct supplied names. Keep a versioned maintained snapshot; the official site remains the authority for late changes. Display source and last-updated time. The website refuses embedding; serve our own small panel with deliberate external links.

One physical board left of the arrival logo, above the public fountain, north of the expo boundary; twelve smaller boards beside speaker entrances. The main face occupies x54,y55,width4,height3. Keep both the expo x38,y65,width52,height25 and the reserved sponsor floor x58,y60,width12,height4 clear. Do not cover entrances, room labels, check-in desks, sponsor art, booths, or sponsor frontage. Reuse the map's navy/gold signage, with a solid support and accessible approach. Nearby prompt and board click open a shared panel, filtered to the room when appropriate. Load only nearby board frames. A Programme toolbar button is available across maps. No automatic panel, audio, redirect, or teleport.

Panel: Scheduled now / Up next / Full day, R1 Aries through R12 Pisces filter, talk/speaker search, pending talks section, Myanmar font, responsive layout. Clock-derived status must not claim that a talk is actually live. Include explicit before-event, lunch, empty-room-slot and ended states. Opening/closing retain the website's wording rather than invent a source room assignment.

Acceptance: all 13 boards present outside expo space, all approaches walkable and door routes unchanged; 56 talks and three pending profiles displayed faithfully; exact time boundaries, room filter, Burmese search, external links and close behavior verified; 390px panel has no horizontal overflow; hosted board/button interactions verified; panel opening/closing leaves an existing public-room connection intact. Full cloud WAM editor state and other world files must be preserved.

## Walking / shortcut scope

Remove the three custom hall/plaza jump menus and journal navigation buttons/links. Keep journal discoveries, hints and an informational directory. Hide native WA room list using its documented API. Disable only Enable users list in the sponsored world's admin settings, with all other settings preserved. WA's explorer uses pathfinding, not teleportation, and remains usable. Keep physical exits/doors and the telescope quest entrance (the observatory's intended physical approach).

This removes supported UI shortcuts; it is not an access-control guarantee against direct room URLs or modified clients. Do not alter organizer permissions, meetings, chat, camera, microphone or map-edit rights.

Acceptance: ordinary guest cannot see custom jump actions or the people/room lists after refresh; keyboard walking works; an actual speaker doorway and its return exit still work; journal remains useful; native guest people-list shortcut U cannot expose its list. Confirm persisted world-setting readback. No live change until failing-first coverage and independent review.

## Validation evidence

The user subsequently requested arrival on the existing VarCamp logo. Move only the default `welcome` and matching `start` markers from x63,y65,width2,height2 to x63,y55,width2,height2. Preserve all return entries, the logo and sponsor art. Acceptance: all four new arrival tiles are unblocked inside the logo; a fresh hosted guest entering `#welcome` appears within that rectangle and can walk away. The programme map transaction owns this exact reversible marker change as well as its boards.

Baseline cloud archive: .qa/programme-20261113/baseline.zip, 526 files, SHA256 a2b081feb8384f7c437d974f5db7f91e402982db50d8bd5460cac58063a831e0 (15:40:58Z). Guest controls probe: .qa/programme-20261113/native-shortcuts-probe.json. Installed and live controls API exposes disableRoomList, no disableTeleport. Current WA source UserActionButton renders cross-map teleport independently. Admin world form has Enable users list, no separate teleport toggle; all values left unchanged during inspection.

Official-source double check at 2026-11-13T16:40:03Z: the server-rendered schedule matches all 56 local session records exactly. Independently decoded all 56 Google Calendar export links: names, titles, rooms and UTC start/end match. All 12 room assignments and three shared slots match. The three unassigned speaker pages still match their local names/titles; no slot is invented. Four photo URLs changed on the site; this panel does not render photos. Evidence: `.qa/programme-20261113/official-recheck-result.json`.
