# The Lantern Trail

Exploration Court and its four branches are now a connected pastoral adventure district. Each map is 64 × 56 native 32 px tiles. The Plaza, speaker rooms, mazes, coast and existing element districts keep their layouts.

| Place | Landscape and activity |
| --- | --- |
| Exploration Court | Woodland trailhead, two thatched cottages, field-guide stall, pond and a friendly spirit. Northern paths still enter the four element districts. |
| Star Garden | Orchard, seed beds, potting shed, pond fishing and Seed Memory. Find Taurus, Virgo and Capricorn. |
| Moon Grotto | Dark pools, stone passages, crystals, old ruins and animated shades. Solve Moon Echoes and find Cancer, Scorpio and Pisces. |
| Moon Café | Open-air tea terrace, herb beds, reading and conversation spots. Play Moonleaf Kitchen and find Gemini, Libra and Aquarius. |
| Stargazer Terrace | Deep-green woodland, ancient stones, a telescope and a gathering clearing. Trace a constellation and find Aries, Leo and Sagittarius. |

Walk close to a zodiac landmark, blue-lit parcel box, spirit or activity station and choose its action prompt. The **Expedition Journal** menu remains available across these five maps. Twelve riddle discoveries and four completed activities unlock the spirit's ending. Fishing has six collectible species and an optional relaxed mode without a reaction deadline. All activities can be replayed; exploration and return paths never require quest completion.

**The letters we left behind** is a separate five-stop story. Find one blue-lit parcel box in each place; its page points to a landmark in the next area. Read collected pages again using **Lost letters** in the journal. Pages can be collected in any order, and the original twelve-memory ending remains independent. Existing saved discoveries and completed activities are retained.

Progress uses private, persistent, world-scoped WorkAdventure player variables under `varcamp2026.expedition.v1.*`. It belongs to the current WorkAdventure identity; a different guest browser or identity starts separately. Failed saves show a retry message and do not count as confirmed progress. There are no external game embeds, new accounts, timers that require returning daily, or forced meeting zones.

The circuit is Garden → Grotto → Terrace → Café → Garden. Each branch also has an Exploration Court return and a direct Zodiac Plaza return. The original telescope action still requires four saved element sigils before entering the hidden observatory.

## Maintain and publish

- Composition: [authored woodland scenes](../../tools/maps/woodland-layout.ts), [native projection and geometry guard](../../tools/maps/exploration.ts); [authoring entry point](../../tools/maps/author-exploration.ts).
- Interactions, riddles and UI: [adventure source](../../src/adventure/content.ts).
- Artwork: [upstream credits and licenses](../../assets/tilesets/lpc-exploration/ATTRIBUTION.md). Native licensed sheets remain unmodified. No Harvest Moon assets are used.
- The action-location manifest is generated with the map, so UI proximity checks follow the same geometry.
- The five retired layouts are retained only as immutable contexts for validating previously published ambient artwork. They are not deployed as current maps.
- Run tests one file at a time under `systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm test -- <file>`. Run long jobs in tmux. Never use an uncapped full suite.
- After authoring, run map validation/build, artwork checks, the release build, source receipts and browser verification. Geometry changes also need the [closed WAM migration](../../ops/enchanted_exploration.py).
- Deploy with `npm run deploy:demo -- --apply --enchanted-exploration --plan <new-plan-directory>`. This preserves unrelated saved editor entities, settings and areas. Any conflicting edit to the owned old/new areas aborts migration.

This is an optional social exploration trail with short replayable activities, not a claim that every attendee will spend a full day completing quests. Extend it through authored story chapters and tested stations while preserving exits and accessibility.

## မြန်မာလို လွှဲပြောင်းမှတ်စု

Exploration Court နဲ့ နေရာခွဲလေးခုကို တောလမ်းတွေ၊ စိုက်ခင်းတွေ၊ လျှို့ဝှက်သင်္ကေတတွေပါတဲ့ Lantern Trail အဖြစ် ပြင်ဆင်ထားပါတယ်။ Zodiac ကျောက်တိုင်၊ ဝိညာဉ်လေး သို့မဟုတ် ကစားစရာနေရာနားကို လျှောက်သွားပြီး ပြထားတဲ့ action ကို ရွေးပါ။ Expedition Journal မှာ တွေ့ရှိပြီးသား အမှတ်တရတွေနဲ့ လုပ်ဆောင်ချက်တွေကို ကြည့်နိုင်ပါတယ်။

Zodiac အမှတ်တရ ၁၂ ခုနဲ့ လုပ်ဆောင်ချက် ၄ ခု ပြီးသွားရင် ဝိညာဉ်လေးရဲ့ ဇာတ်လမ်းအဆုံးကို ဖတ်နိုင်ပါတယ်။ ငါးမျှားတာက ရွေးချယ်နိုင်တဲ့ အပိုကစားနည်းပါ။ အချိန်မကန့်သတ်တဲ့ Relaxed mode လည်း ပါပါတယ်။ Quest မပြီးလည်း နေရာအားလုံးကို သွားနိုင်ပြီး Plaza ကို အမြဲပြန်နိုင်ပါတယ်။

တိုးတက်မှုကို လက်ရှိ WorkAdventure အသုံးပြုသူအတွက် သီးသန့်သိမ်းပါတယ်။ Guest browser သို့မဟုတ် အသုံးပြုသူအမည်/အကောင့် ပြောင်းသွားရင် ယခင်တိုးတက်မှု အလိုအလျောက် မပါလာနိုင်ပါ။ နောက်နှစ်အတွက် ပြင်ဆင်သူတွေက မူရင်းပန်းချီရင်းမြစ်နဲ့ လိုင်စင်တွေကို ထိန်းသိမ်းပြီး collision၊ အဝင်အထွက်နဲ့ save ပြန်ကြိုးစားမှုတွေကို စမ်းသပ်ပါ။ Devbox မတုံ့ပြန်တော့တာ မဖြစ်အောင် test တစ်ဖိုင်စီကို 6 GB memory limit နဲ့သာ run ပါ။

Lost letters မှာ နေရာငါးခုအတွင်း စာတစ်စောင်စီ ရှာနိုင်ပါတယ်။ အပြာရောင်ကျောက်လေးဘေးက ပစ္စည်းသေတ္တာကို ချဉ်းကပ်ပြီး စာကိုဖတ်ပါ။ စာထဲမှာ နောက်နေရာအတွက် လမ်းညွှန်ပါတယ်။ ရှာတွေ့ပြီးသားစာတွေကို journal ထဲကနေ ပြန်ဖတ်နိုင်ပြီး ယခင် Zodiac အမှတ်တရနဲ့ ကစားနည်းတိုးတက်မှုတွေကို မဖျက်ပါ။
