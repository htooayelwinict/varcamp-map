# Check-in counter

The small native computer desk stands to the right of the main arrival logo in the overworld. Click the computer above its **CHECK IN** floor label, or walk into the clear approach and use the Check In action. Both open the official [2026 attendee check-in page](https://register.var.camp/2026/attendee/check-in) in a new tab, leaving WorkAdventure open.

On 2 November 2026 the registration page returned `X-Frame-Options: SAMEORIGIN`, so the map does not iframe that external page. WorkAdventure documents [opening a new tab](https://docs.workadventu.re/developer/map-scripting/references/api-nav/) for this integration. A transparent local link over the computer provides click access with scripting API access and media permissions disabled. Ticket scanning, uploads, opening times, validation and attendance records belong to the registration service; the map neither stores tickets nor marks attendance itself.

## Future event updates

- Change the official URL in [world/check-in-counter.json](../../world/check-in-counter.json). The clickable computer and action use that same URL.
- The current native desk geometry and click rectangle are in [check-in-counter-style.json](../../world/check-in-counter-style.json), applied through the [event presentation revision](event-presentation.md). The first counter recipe remains as historical data. Keep current furniture on the 32 px grid, clear of the logo, arrival spawn, guide route and booth entrances. Geometry changes require updating the explicit collision allowance and tests.
- The [runtime interaction](../../src/check-in/counter.ts) creates the clickable [sign](../../src/check-in/index.html) only in the overworld. It offers an action on approach, removes it on exit and cleans up on scene unload. It never opens a tab automatically.
- Recheck the registration site's frame policy before changing the opening mode. Do not remove security headers or proxy ticket data merely to force embedding.
- Run the counter and runtime tests, map validation, source qualification and build. Verify the real clickable sign and keyboard action in WorkAdventure, the opened URL, return to the map, desk collision and clear walkway. Test without submitting an attendee's ticket.
- Regenerate public guide geometry/module receipts after physical map changes; this does not authorize starting the guide services or changing their private release pins.

```sh
node tools/run-tool.mjs tools/maps/author-event-presentation.ts
npm run maps:build
npm run maps:validate
npm test -- tests/check-in-counter.test.ts tests/runtime-contract.test.ts --maxWorkers=1 --testTimeout=30000
npm run buildmap
```

Use the [devbox deployment workflow](devbox-deployment.md) after qualification. Preserve live organizer WAM edits. This counter adds no meeting zone and does not alter saved WAM areas.

## မြန်မာဘာသာ လွှဲပြောင်းမှတ်စု

နောက်နှစ်ပွဲအတွက် URL ပြောင်းရန် အထက်ပါ `world/check-in-counter.json` ကို ပြင်ပါ။ ကောင်တာစာတန်းနှင့် အနီးကပ်လုပ်ဆောင်ရန်ခလုတ်တို့သည် ထို URL တစ်ခုတည်းကို အသုံးပြုပါသည်။ ကောင်တာ၊ ကွန်ပျူတာနှင့် လူသွားလမ်းနေရာကို ပြောင်းပါက tile collision နှင့် guide လမ်းကြောင်းကိုပါ ပြန်စစ်ပါ။

လက်ရှိ check-in စာမျက်နှာက အခြား website အတွင်း ထည့်သွင်းဖွင့်ခြင်းကို ခွင့်မပြုသောကြောင့် tab အသစ်ဖြင့် ဖွင့်ထားပါသည်။ လက်မှတ်ဖတ်ခြင်း၊ ပုံတင်ခြင်း၊ ဖွင့်ချိန်နှင့် attendance မှတ်တမ်းကို registration စနစ်ကသာ တာဝန်ယူပါသည်။ မြေပုံသည် လက်မှတ်အချက်အလက်ကို မသိမ်းဆည်းပါ။ စမ်းသပ်ရာတွင် အမှန်တကယ်တက်ရောက်သူ၏ လက်မှတ်ကို မတင်ဘဲ link ဖွင့်နိုင်ခြင်း၊ မြေပုံသို့ ပြန်လာနိုင်ခြင်းနှင့် စားပွဲကို ဖြတ်မလျှောက်နိုင်ခြင်းတို့ကို စစ်ဆေးပါ။
