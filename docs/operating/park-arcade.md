# Zodiac Gardens and Nebula Arcade

The park has a continuous lawn, curved gravel paths, a pond walk, four flower gardens, mature trees, benches and a picnic corner. Its north-west path enters Nebula Arcade, its north-east path enters Orbit Playground, and its south path returns to the plaza. Existing saved conversation areas and return spawns are retained. Trees block at their roots and lamps at their bases; their upper artwork draws over people walking behind them.

The arcade has six cabinets, in three facing pairs:

| Pair | Game | Play |
| --- | --- | --- |
| North | [War Brokers](https://warbrokers.io/) | Team FPS |
| Middle | [DEADSHOT](https://deadshot.io/) | Arena FPS |
| South | [HaxBall](https://www.haxball.com/play) | Team PvP football |

Stand on the mat immediately in front of a cabinet and press **Space**, or click its action prompt. The game opens on its official website in a **new browser tab**. Return to the VarCamp tab to continue exploring. Each game controls its own matches, accounts and room selection; the map does not automatically put attendees into the same match. To play together, use the game's own room or party controls. The playground remains a social space.

Games never load merely because an attendee enters the arcade. No game client, game server, account credentials or advertising scripts are hosted by this map. New tabs give FPS games their own keyboard, mouse capture and fullscreen context; they receive no WorkAdventure scripting API access. An old action prompt cannot launch after the attendee has left its cabinet.

## Editing and verification

- Art and placement: `world/layouts/zodiac-festival-park.json` and `world/layouts/nebula-arcade.json`. Preserve the 32px grid, native sprite sizes, paths, entrance names and saved WAM areas.
- Games and approach mats: `world/arcade-games.json`; action lifecycle: `src/arcade/cabinets.ts`. Keep the cabinet's visible label, title and official HTTPS destination consistent. Do not add automatic launches or guessed multiplayer-room URLs.
- Footprints and canopy partitions: `art/tile-catalog.json`. Keep roots, bases and cabinet feet solid; do not make the entire vertical artwork collide.
- Native owner changes: `art/source/park-arcade-refresh.json` and `tools/maps/park-arcade-context.ts`. This is a closed two-map successor; previous reservations and all other maps retain their owners. The three arcade device effects may draw above avatars only inside their owning screen's opaque upper pixels. Retained coastal artwork is unchanged; its provenance receipts follow the updated common animation validator.
- The arcade screen is an exact native-size crop of the existing original presentation screen; `tools/art/arcade-screen.ts` verifies its bytes.
- New art: `assets/tilesets/lpc-garden/`. The three complete upstream PNGs are unchanged, total less than 8 MiB when decoded. Full upstream credits, CC-BY-SA 3.0 and SHA-256 source records are retained. Art licensing is separate from the code licence.

Run checks **one file at a time**, inside tmux on the devbox:

```sh
systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- tests/arcade-cabinets.test.ts --maxWorkers=1
systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- tests/park-arcade.test.ts --maxWorkers=1
```

Then use the normal source receipts and demo deployment procedure. Walk every entrance and exit, all six cabinet mats, both sides of a tree canopy and trunk, a lamp shaft and base, and the pond edge. Check that walking across a mat does not open a tab; pressing Space opens exactly its labelled game. Test returning to the map and an ordinary page reload. Do not describe the historical full suite as green based on these focused checks.

## Web resources researched on 2026-11-03

- [WorkAdventure: opening websites and action triggers](https://docs.workadventu.re/map-building/tiled-editor/opening-a-website/) and [navigation API](https://docs.workadventu.re/developer/map-scripting/references/api-nav/).
- [War Brokers official FAQ](https://warbrokers.io/FAQ.html): browser play, team modes and fullscreen controls. A bounded Chromium check reached a live team match.
- [DEADSHOT official game](https://deadshot.io/): its game lobby was loaded in Chromium. Use this publisher domain, not similarly named SEO sites.
- [HaxBall official description](https://www.haxball.com/about): real-time team PvP. The nickname screen and live room browser were verified.
- [Venge](https://venge.io/) was considered but its devbox browser request hit a security challenge, so it is not on the cabinet roster.
- [LPC Trees](https://opengameart.org/content/lpc-trees), [LPC Flowers / Plants / Fungi / Wood](https://opengameart.org/content/lpc-flowers-plants-fungi-wood), and [LPC Terrain Repack](https://lpc.opengameart.org/content/lpc-terrain-repack). Full artist lists are linked from [the retained attribution](../../assets/tilesets/lpc-garden/ATTRIBUTION.md).

## မြန်မာဘာသာဖြင့် လွှဲပြောင်းမှတ်စု

ပန်းခြံတွင် မြက်ခင်း၊ ကျောက်စရစ်လမ်းကွေ့များ၊ ရေကန်ပတ်လမ်း၊ ပန်းဥယျာဉ်လေးခု၊ အရိပ်ရသစ်ပင်များနှင့် ထိုင်ခုံများ ပါဝင်ပါသည်။ အနောက်မြောက်ဘက်လမ်းမှ Arcade သို့၊ အရှေ့မြောက်ဘက်လမ်းမှ Playground သို့ ဝင်နိုင်ပြီး တောင်ဘက်လမ်းမှ Plaza သို့ ပြန်နိုင်ပါသည်။ မူလတွေ့ဆုံစကားပြောနေရာများနှင့် ပြန်ဝင်ရာနေရာများကို ထိန်းသိမ်းထားပါသည်။

Arcade စက်ရှေ့ရှိ ဖျာပေါ်တွင် ရပ်ပြီး **Space** နှိပ်ပါ၊ သို့မဟုတ် ပေါ်လာသော စာတန်းကို နှိပ်ပါ။ သက်ဆိုင်ရာဂိမ်း၏ တရားဝင်ဝက်ဘ်ဆိုက်ကို **browser tab အသစ်** တွင် ဖွင့်ပေးပါမည်။ မြေပုံသို့ ပြန်လာလိုလျှင် VarCamp tab ကို ပြန်ရွေးပါ။ မြောက်ဘက်စက်နှစ်လုံးမှာ War Brokers၊ အလယ်နှစ်လုံးမှာ DEADSHOT၊ တောင်ဘက်နှစ်လုံးမှာ HaxBall ဖြစ်ပါသည်။ အတူတူကစားလိုလျှင် ဂိမ်းအတွင်းရှိ room သို့မဟုတ် party စနစ်ကို အသုံးပြုရပါမည်။ မြေပုံက ကစားသူအားလုံးကို ပွဲတစ်ပွဲတည်းသို့ အလိုအလျောက် ထည့်ပေးခြင်း မရှိပါ။

နောက်နှစ်အတွက် ပြင်ဆင်သူများသည် `world/arcade-games.json` တွင် ဂိမ်းလင့်ခ်နှင့် စက်ရှေ့ရပ်ရမည့် နေရာကို ပြင်နိုင်ပါသည်။ မြေပုံပေါ်ရှိ ဂိမ်းအမည်ကိုလည်း ကိုက်ညီအောင် ပြင်ပါ။ သစ်ပင်အမြစ်နှင့် မီးတိုင်အောက်ခြေကိုသာ တိုက်မိရပ်တန့်စေပြီး အပေါ်ပိုင်းပုံရိပ်တစ်ခုလုံးကို လမ်းပိတ်အတားအဆီး မလုပ်ပါနှင့်။ အသုံးပြုထားသော ပုံများ၏ မူပိုင်ခွင့်လိုင်စင်နှင့် ဖန်တီးသူစာရင်းကို မဖျက်ပါနှင့်။ စမ်းသပ်မှုတစ်ဖိုင်စီကို RAM 6 GB ကန့်သတ်ချက်ဖြင့်သာ run ပါ။
