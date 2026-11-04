# Check-in counter

Thirteen small native computer desks serve the overworld: one beside the main arrival logo and one beside each of the twelve zodiac speaker-building entrances. Each is placed to the side of the doorway, with an open approach and a small **CHECK IN** floor label. Click the computer above its **CHECK IN** floor label, or walk into the clear approach and use the Check In action. Both open the official [2026 attendee check-in page](https://register.var.camp/2026/attendee/check-in) in a new tab, leaving WorkAdventure open.

On 2 November 2026 the registration page returned `X-Frame-Options: SAMEORIGIN`, so the map does not iframe that external page. WorkAdventure documents [opening a new tab](https://docs.workadventu.re/developer/map-scripting/references/api-nav/) for this integration. A transparent local link over the computer provides click access with scripting API access and media permissions disabled. Ticket scanning, uploads, opening times, validation and attendance records belong to the registration service; the map neither stores tickets nor marks attendance itself.

## Future event updates

- Change the official URL in [world/check-in-counter.json](../../world/check-in-counter.json). The clickable computer and action use that same URL.
- Current desk and approach rectangles are in [check-in-stations.json](../../world/check-in-stations.json). The arrival desk retains its geometry from [check-in-counter-style.json](../../world/check-in-counter-style.json). The twelve additional desks and reception gardens are applied by the reversible [arrival hospitality recipe](../../world/arrival-hospitality.json), after the [event presentation revision](event-presentation.md). Earlier counter recipes remain historical data. Keep current furniture on the 32 px grid, clear of the logo, arrival spawn, guide route and booth entrances. Geometry changes require updating the explicit collision allowance and tests.
- The [desk physics successor](../../world/check-in-physics.json) introduced the solid 3 × 2 footprint now reused by all thirteen desks through the `check-in-desk-solid` catalog entry. Its artwork is identical to `desk-coding`, whose shared bottom-row collision remains unchanged elsewhere. The three added desktop cells prevent entry from the back and sides; the whole perimeter stays open. Test entry with movement keys from north, south, east and west, including both side rows, as pathfinding alone can hide a collision gap.
- The [runtime interaction](../../src/check-in/counter.ts) creates the clickable [sign](../../src/check-in/index.html) only for nearby overworld desks and removes it when the visitor moves away. It does not load thirteen frames at startup. It offers an action on approach, removes it on exit and cleans up on scene unload. It never opens a tab automatically.
- Recheck the registration site's frame policy before changing the opening mode. Do not remove security headers or proxy ticket data merely to force embedding.
- Run the counter and runtime tests, map validation, source qualification and build. Verify the real clickable sign and keyboard action in WorkAdventure, the opened URL, return to the map, desk collision and clear walkway. Test without submitting an attendee's ticket.
- Regenerate public guide geometry/module receipts after physical map changes; this does not authorize starting the guide services or changing their private release pins.

```sh
npm run maps:build
npm run maps:validate
systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- tests/check-in-counter.test.ts
systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- tests/check-in-stations.test.ts
systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- tests/runtime-contract.test.ts
npm run buildmap
```

Use the [devbox deployment workflow](devbox-deployment.md) after qualification. Preserve live organizer WAM edits. This counter adds no meeting zone and does not alter saved WAM areas.

Run the checks sequentially inside tmux on the devbox. Do not run the test files together or without memory limits. The arrival gardens reuse existing trees, flowers, benches and fountain artwork; all aircraft animations, building doors and public guide route cells remain unchanged.

## မြန်မာဘာသာ လွှဲပြောင်းမှတ်စု

Check-in ကောင်တာ စုစုပေါင်း ၁၃ ခု ရှိပါသည်။ ကြိုဆိုရေးနေရာတွင် တစ်ခုနှင့် ရာသီခွင်ဟောပြောပွဲအဆောက်အဦ ၁၂ လုံး၏ ဝင်ပေါက်ဘေးတွင် တစ်ခုစီ ဖြစ်ပါသည်။ တံခါးနှင့် လူသွားလမ်းကို မပိတ်အောင် နေရာချထားပါသည်။

နောက်နှစ်ပွဲအတွက် URL ပြောင်းရန် အထက်ပါ `world/check-in-counter.json` ကို ပြင်ပါ။ ကောင်တာစာတန်းနှင့် အနီးကပ်လုပ်ဆောင်ရန်ခလုတ်တို့သည် ထို URL တစ်ခုတည်းကို အသုံးပြုပါသည်။ ကောင်တာ၊ ကွန်ပျူတာနှင့် လူသွားလမ်းနေရာကို ပြောင်းပါက tile collision နှင့် guide လမ်းကြောင်းကိုပါ ပြန်စစ်ပါ။

Check-in စားပွဲ၏ tile ခြောက်ကွက်လုံးကို ပိတ်ထားရပါမည်။ ရှေ့ဘက်တစ်ဖက်တည်းမဟုတ်ဘဲ နောက်ဘက်နှင့် ဘေးနှစ်ဖက်မှလည်း လမ်းလျှောက်ဝင်၍ မရကြောင်း ဦးတည်ရာခလုတ်များဖြင့် စမ်းသပ်ပါ။ စားပွဲပတ်လည် လူသွားလမ်းကို မပိတ်ပါနှင့်။

လက်ရှိ check-in စာမျက်နှာက အခြား website အတွင်း ထည့်သွင်းဖွင့်ခြင်းကို ခွင့်မပြုသောကြောင့် tab အသစ်ဖြင့် ဖွင့်ထားပါသည်။ လက်မှတ်ဖတ်ခြင်း၊ ပုံတင်ခြင်း၊ ဖွင့်ချိန်နှင့် attendance မှတ်တမ်းကို registration စနစ်ကသာ တာဝန်ယူပါသည်။ မြေပုံသည် လက်မှတ်အချက်အလက်ကို မသိမ်းဆည်းပါ။ စမ်းသပ်ရာတွင် အမှန်တကယ်တက်ရောက်သူ၏ လက်မှတ်ကို မတင်ဘဲ link ဖွင့်နိုင်ခြင်း၊ မြေပုံသို့ ပြန်လာနိုင်ခြင်းနှင့် စားပွဲကို ဖြတ်မလျှောက်နိုင်ခြင်းတို့ကို စစ်ဆေးပါ။
