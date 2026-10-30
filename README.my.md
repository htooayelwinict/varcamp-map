# VarCamp Myanmar 2026 — မြန်မာဘာသာ လမ်းညွှန်

**[Read in English](README.md)** · **မြန်မာဘာသာ**

VarCamp Myanmar သည် **WorkAdventure** ပေါ်တွင် တည်ဆောက်ထားသော ရာသီခွင်အခြေပြု အွန်လိုင်းပွဲကျင်းပရာ နေရာတစ်ခု ဖြစ်ပါသည်။ ကြိုဆိုရေးရင်ပြင်၌ တွေ့ဆုံနိုင်ပြီး လူမှုအသိုင်းအဝိုင်းများ၏ ပြခန်းများကို လည်ပတ်နိုင်ပါသည်။ ရာသီခွင်အလိုက် ဟောပြောခန်း ၁၂ ခန်းနှင့် အဓိကခန်းမ ၂ ခန်းတွင် အစီအစဉ်များ တက်ရောက်နိုင်သလို ဥယျာဉ်၊ ကော်ဖီဆိုင်၊ ဝင်္ကပါနှင့် အပူပိုင်းကမ်းခြေတို့ကိုလည်း လေ့လာနိုင်ပါသည်။

ကမ္ဘာတစ်ခုလုံးတွင် **ချိတ်ဆက်ထားသော မြေပုံ ၃၄ ခု** ပါဝင်ပြီး **တစ်ကွက်လျှင် 32 × 32 pixel** ရှိသော tile စနစ်ကို အသုံးပြုထားပါသည်။ ပြင်ဆင်နိုင်သော Tiled မြေပုံများ၊ မူရင်းအနုပညာဖိုင်များ၊ TypeScript code၊ စိတ်ကြိုက်ပါဝင်နိုင်သော လေ့လာရေးစိန်ခေါ်မှုများနှင့် ထုတ်လွှင့်ခြင်းဆိုင်ရာ လုပ်ငန်းစဉ်များကို ဤ repository တွင် ထိန်းသိမ်းထားပါသည်။

ဤလမ်းညွှန်သည် ယခုနှစ်အတွက်သာ မဟုတ်ဘဲ **နောင်နှစ်များတွင် VarCamp ကို ဆက်လက်စီစဉ်မည့် မျိုးဆက်သစ်များ၊ ထိန်းသိမ်းသူများနှင့် ပါဝင်ကူညီလိုသူများ** အတွက်ပါ ရည်ရွယ်ပါသည်။ နည်းပညာအမည်များ၊ ဖိုင်အမည်များ၊ command များနှင့် မျက်နှာပြင်ပေါ်မှ menu အမည်များကို ရှာဖွေအသုံးပြုရလွယ်စေရန် မူရင်းအတိုင်း ထားရှိထားပါသည်။

**[စမ်းသပ်ကမ္ဘာသို့ ဝင်ရောက်ရန်](https://varcamp.3-1-133-135.sslip.io/~/varcamp-demo/maps/overworld.wam)** · [တက်ရောက်သူ လမ်းညွှန်](#visitors) · [စတင်တည်ဆောက်ရန်](#development) · [မျိုးဆက်သစ်များအတွက် လွှဲပြောင်းလမ်းညွှန်](#handoff) · [နောက်ဆုံး မြေပုံစစ်ဆေးချက်](docs/qa/map-stability-2026-10-29/README.md)

![VarCamp ကမ္ဘာအတွင်း လည်ပတ်နိုင်သော FA SHIP သင်္ဘောနေရာ](publication/fa-ship.jpg)

## မာတိကာ

- [ကမ္ဘာအတွင်း ပါဝင်သည့်နေရာများ](#overview)
- [တက်ရောက်သူများအတွက် လမ်းညွှန်](#visitors)
- [မြေပုံ ၃၄ ခု၏ စာရင်း](#maps)
- [စစ်ဆေးပြီးသည့် အခြေအနေနှင့် ကျန်ရှိသောအလုပ်များ](#status)
- [Developer များအတွက် စတင်တည်ဆောက်နည်း](#development)
- [Repository ဖိုင်လမ်းညွှန်](#repository)
- [မြေပုံနှင့် အနုပညာဖိုင်များ ပြင်ဆင်နည်း](#editing)
- [စစ်ဆေးခြင်းနှင့် စမ်းသပ်ခြင်း](#testing)
- [Demo ကို ထုတ်လွှင့်နည်း](#publishing)
- [Guide bot နှင့် NPC ဝန်ဆောင်မှုများ](#guides)
- [ပါဝင်ကူညီခြင်းနှင့် နောင်နှစ်များအတွက် လွှဲပြောင်းခြင်း](#handoff)
- [အဖြစ်များသော ပြဿနာများ](#troubleshooting)
- [ဆက်လက်ဖတ်ရှုရန်](#documentation)
- [ဖန်တီးသူများနှင့် အသုံးပြုခွင့်လိုင်စင်များ](#credits)

<a id="overview"></a>

## ကမ္ဘာအတွင်း ပါဝင်သည့်နေရာများ

| နေရာ | ပါဝင်သည့်အရာများ |
| --- | --- |
| ကြိုဆိုရေးနှင့် ပြခန်းရင်ပြင် | VarCamp Myanmar 2026 ကြမ်းပြင်လိုဂို၊ မိတ်ဖက်အဖွဲ့များ၏ အမှတ်တံဆိပ်၊ လှုပ်ရှားနေသော ရေပန်းနှင့် အလယ်လမ်းမတစ်လျှောက် ပြခန်း ၁၂ ခန်း။ |
| ရာသီခွင်ဝန်း | စက်ဝိုင်းပုံ အနေအထားဖြင့် စီထားသော အဆောက်အဦ ၁၂ လုံး၊ ကြမ်းပြင်အမည်စာတန်းများ၊ သစ်ပင်ပန်းပင်များနှင့် အပြင်ဘက်ပတ်လမ်း။ |
| ဟောပြောခန်းများ | သက်ဆိုင်ရာ ရာသီခွင်ပုံစံ၊ စင်မြင့်၊ ထိုင်ခုံ၊ ဟောပြောသူနှင့် နားထောင်သူ နေရာများ၊ VarCamp နှင့် မိတ်ဖက်အဖွဲ့ နံရံအမှတ်တံဆိပ်များ။ |
| Solar နှင့် Lunar ခန်းမများ | နေနှင့်လ အပြင်အဆင်အသီးသီးရှိသော အဓိကခန်းမနှစ်ခု။ |
| ပွဲတော်နှင့် ကစားကွင်း | ပွဲတော်ဥယျာဉ်၊ လူတွေ့ဆုံနိုင်သော arcade နှင့် ကစားကွင်း၊ Orbit Maze နှင့် checkpoint များပါသော Comet Maze။ |
| ကမ်းခြေနှင့် သင်္ဘော | အပူပိုင်းကမ်းခြေကွေ့၊ Constellation Shore၊ FA SHIP ၏ အပေါ်ထပ်နှင့် အတွင်းခန်း။ |
| လေ့လာရေးနေရာများ | ဓာတ်ကြီးလေးပါးအလိုက် နေရာများ၊ Star Garden၊ Moon Café၊ Moon Grotto၊ Stargazer Terrace နှင့် လျှို့ဝှက်ကြယ်ကြည့်စခန်း။ |
| လှုပ်ရှားမှုအလှဆင်များ | ရေပန်း၊ ကောင်းကင်၌ လှည့်လည်သော drone များ၊ လေပေါ်ဝဲနေသော Roadster နှင့် ပတ်ဝန်းကျင်လှုပ်ရှားမှုများ။ ယာဉ်များသည် အလှဆင်မှုများဖြစ်ပြီး ကစားသူက မောင်းနှင်ခြင်း၊ စီးနင်းခြင်း မပြုနိုင်သေးပါ။ |

ပြခန်းရင်ပြင်၏ မြောက်ဘက်တန်းတွင် **Demo Orbit၊ Demo Nova၊ Demo Atlas၊ Demo Vector၊ Demo Lumen နှင့် Info Desk** ရှိပါသည်။ တောင်ဘက်တန်းတွင် **AWS UG Myanmar၊ BSides Myanmar၊ OpenInfra MM၊ Code Circle၊ Design Guild နှင့် Vibe Code Tours** ရှိပါသည်။ ပြခန်းများကြား နေရာကျယ်အောင် စီစဉ်ထားပြီး စကားဝိုင်းခွဲရန် သီးခြား meeting zone များ မသတ်မှတ်ထားပါ။

Demo ကုမ္ပဏီနှင့် community-hub အမည်အချို့သည် နမူနာအမည်များ ဖြစ်ပါသည်။ စီစဉ်သူပေးထားသော community နှင့် မိတ်ဖက်လိုဂိုများ၏ မူရင်းနှင့် အသုံးပြုခွင့်မှတ်တမ်းများကို [branding registry](art/sponsors.json) တွင် ကြည့်နိုင်ပါသည်။

<a id="visitors"></a>

## တက်ရောက်သူများအတွက် လမ်းညွှန်

### ဝင်ရောက်ခြင်းနှင့် လမ်းလျှောက်ခြင်း

1. [Live demo](https://varcamp.3-1-133-135.sslip.io/~/varcamp-demo/maps/overworld.wam) ကို ဖွင့်ပါ။
2. Display name ကို **စာလုံး ၁၀ လုံးထက် မပိုအောင်** ထည့်ပါ။ မိမိ၏ WOKA ကိုယ်စားပြုဇာတ်ကောင်ကို ရွေးပြီး camera/microphone သတ်မှတ်သည့် စာမျက်နှာမှ ဆက်သွားပါ။ လေ့လာရုံအတွက် camera နှင့် microphone ကို ပိတ်ထားနိုင်ပါသည်။
3. ကြိုဆိုရေးအလယ်နေရာသို့ ရောက်ပါမည်။ မြားခလုတ်များ သို့မဟုတ် WASD ဖြင့် လမ်းလျှောက်ပါ။ အမည်ပါသော တံခါးနှင့် ဝင်ပေါက်များကို ဖြတ်သွားလျှင် သက်ဆိုင်ရာမြေပုံသို့ ရောက်ပါမည်။
4. သွားရောက်လိုသောနေရာနှင့် လေ့လာရေးတိုးတက်မှုအတွက် welcome directory သို့မဟုတ် **Quest Journal** menu ကို အသုံးပြုပါ။ အရာဝတ္ထုတစ်ခုအနီးတွင် လုပ်ဆောင်ရန်စာတန်း ပေါ်လာပါက ထိုစာတန်းပါ ခလုတ်အတိုင်း ဆောင်ရွက်ပါ။
5. ဟောပြောပွဲတက်ရောက်ရန် သတ်မှတ်ထားသော ရာသီခွင်အခန်း သို့မဟုတ် Solar/Lunar ခန်းမသို့ ဝင်ပြီး နားထောင်သူနေရာကို အသုံးပြုပါ။ အချိန်ဇယားအတွက် စီစဉ်သူထုတ်ပြန်ချက်ကို ကြည့်ပြီး အသံ၊ ဗီဒီယိုနှင့် တင်ဆက်မှုအတွက် အခန်းတာဝန်ခံ၏ ညွှန်ကြားချက်ကို လိုက်နာပါ။

Quest interface စတင်မရလျှင်လည်း မြေပုံ၏ တံခါးနှင့် ထွက်ပေါက်များကို အသုံးပြုနိုင်ပါသည်။ Arcade စက်များနှင့် ကစားကွင်းပစ္စည်းများသည် တွေ့ဆုံအပန်းဖြေရန် အလှဆင်မှုများဖြစ်ပြီး ဤ repository တွင် ပြင်ပ arcade ဂိမ်းဝန်ဆောင်မှု မပါဝင်ပါ။

### အဓိကလမ်းကြောင်းများ

Overworld မှ ရာသီခွင်အဆောက်အဦများနှင့် ခန်းမနှစ်ခုသို့ ကိုယ်ပိုင်ဝင်ပေါက်များမှ ဝင်နိုင်ပါသည်။ အပြင်ဘက်တံခါးများမှ **မြောက်ဘက်သို့ Orbit Maze၊ အနောက်ဘက်သို့ ပွဲတော်ဥယျာဉ်၊ အရှေ့ဘက်သို့ ကမ်းခြေ၊ တောင်ဘက်သို့ Campus Exploration** သွားနိုင်ပါသည်။ ရင်ပြင်သို့ ပြန်ရန် လမ်းညွှန်ဆိုင်းဘုတ်နှင့် directory ကို ကြည့်ပါ။

ပွဲတော်ဥယျာဉ်မှ arcade နှင့် ကစားကွင်းသို့ ဆက်သွားနိုင်ပါသည်။ ကမ်းခြေမှ Constellation Shore နှင့် FA SHIP သို့ သွားနိုင်ပြီး သင်္ဘောလှေကားမှ အောက်ထပ်သို့ ဆင်းနိုင်ပါသည်။ Campus Exploration မှ ဓာတ်ကြီးလေးပါးနေရာများနှင့် အပန်းဖြေနေရာများသို့ ဆက်သွားနိုင်ပါသည်။ Stargazer Terrace တွင် လျှို့ဝှက်ကြယ်ကြည့်စခန်းသို့ သွားသည့်လမ်း ရှိပါသည်။

### စိတ်ကြိုက်ပါဝင်နိုင်သော စိန်ခေါ်မှုများ

Quest များတွင် ပါဝင်ရန် မဖြစ်မနေ မလိုအပ်ပါ။ ဟောပြောပွဲတက်ရောက်ရန် quest ပြီးမြောက်ထားရမည်ဟု ကန့်သတ်မထားပါ။

| ဆုတံဆိပ် | ရရှိရန် |
| --- | --- |
| Zodiac Explorer | ရာသီခွင်အမှတ်အသား ၁၂ ခုလုံးကို ရှာဖွေတွေ့ရှိပါ။ |
| Maze Navigator | Orbit Maze ကို ပြီးဆုံးအောင် ဖြတ်သန်းပါ။ |
| Stargazer | ဓာတ်ကြီးလေးပါးအမှတ်အသား လေးခုကို စုဆောင်းပြီး လျှို့ဝှက်ကြယ်ကြည့်စခန်းကို ရှာဖွေတွေ့ရှိပါ။ |
| Comet Trailblazer | Comet Maze ၏ checkpoint သုံးခုလုံးကို သိမ်းဆည်းပြီး ဝင်္ကပါကို ပြီးဆုံးအောင် ဖြတ်သန်းပါ။ |

Journal တွင် အတည်ပြုပြီး၊ သိမ်းဆည်းရန်စောင့်နေဆဲနှင့် မတွေ့ရှိသေးသော အခြေအနေများကို ခွဲပြထားပါသည်။ သိမ်းဆည်းမှုစောင့်နေဆဲဖြစ်ပါက retry ကို အသုံးပြုပါ။ တိုးတက်မှုကို WorkAdventure player variables နှင့် browser storage အရန်စနစ်ဖြင့် သိမ်းဆည်းထားသောကြောင့် guest အဖြစ်အသုံးပြုသည့် မှတ်တမ်းသည် အခြား browser သို့မဟုတ် စက်သို့ အလိုအလျောက်ပါလာမည်ဟု မယူဆသင့်ပါ။ Quest လုပ်နေစဉ် tab တစ်ခုတည်းကို အသုံးပြုပါ။

<a id="maps"></a>

## မြေပုံ ၃၄ ခု၏ စာရင်း

အောက်ပါမြေပုံတစ်ခုစီအတွက် [`maps/`](maps/) တွင် `.tmj` မူရင်းဖိုင်နှင့် တွဲဖက် `.wam` ဖိုင် ရှိပါသည်။ ဤဇယားရှိ link များသည် GitHub ပေါ်မှ source ဖိုင်များကို ဖွင့်ပေးပါသည်။ ကစားရန် live demo link ကို အသုံးပြုပါ။

### ရာသီခွင် ဟောပြောခန်းများ

| အမှတ် | အခန်း | မူရင်းမြေပုံ |
| --- | --- | --- |
| 01 | Aries | [speaker-aries.tmj](maps/speaker-aries.tmj) |
| 02 | Taurus | [speaker-taurus.tmj](maps/speaker-taurus.tmj) |
| 03 | Gemini | [speaker-gemini.tmj](maps/speaker-gemini.tmj) |
| 04 | Cancer | [speaker-cancer.tmj](maps/speaker-cancer.tmj) |
| 05 | Leo | [speaker-leo.tmj](maps/speaker-leo.tmj) |
| 06 | Virgo | [speaker-virgo.tmj](maps/speaker-virgo.tmj) |
| 07 | Libra | [speaker-libra.tmj](maps/speaker-libra.tmj) |
| 08 | Scorpio | [speaker-scorpio.tmj](maps/speaker-scorpio.tmj) |
| 09 | Sagittarius | [speaker-sagittarius.tmj](maps/speaker-sagittarius.tmj) |
| 10 | Capricorn | [speaker-capricorn.tmj](maps/speaker-capricorn.tmj) |
| 11 | Aquarius | [speaker-aquarius.tmj](maps/speaker-aquarius.tmj) |
| 12 | Pisces | [speaker-pisces.tmj](maps/speaker-pisces.tmj) |

### ရင်ပြင်၊ လှုပ်ရှားမှုနှင့် အပန်းဖြေနေရာများ

| အုပ်စု | မြေပုံများ | အသုံးပြုပုံ |
| --- | --- | --- |
| ကြိုဆိုရေး | [Overworld](maps/overworld.tmj) | 128 × 128 tile ရှိပြီး ပြခန်း၊ ဥယျာဉ်နှင့် အနီးပတ်ဝန်းကျင်အဆောက်အဦများ၏ ဝင်ပေါက်များ ပါဝင်ပါသည်။ |
| အဓိကခန်းမ | [Solar Hall](maps/solar-hall.tmj)၊ [Lunar Hall](maps/lunar-hall.tmj) | တစ်ခန်းလျှင် 64 × 56 tile ရှိသော ဟောပြောပွဲခန်းမနှစ်ခု။ |
| ဝင်္ကပါ | [Orbit Maze](maps/orbit-maze.tmj)၊ [Comet Maze](maps/comet-maze.tmj) | Orbit တွင် သစ်ပင်ပန်းပင်များပါသော ဥယျာဉ်ဝင်္ကပါ၊ Comet တွင် ကြယ်စုအလှဆင်နံရံများနှင့် သိမ်းဆည်းရမည့် checkpoint သုံးခု ရှိပါသည်။ နှစ်ခုလုံးတွင် လမ်းမီးများ၊ အမှတ်အသားနေရာများနှင့် အနားယူရာနေရာများ ပါဝင်သည်။ [အတွင်းပိုင်းပြင်ဆင်နည်း](docs/operating/maze-interiors.md)။ |
| ပွဲတော် | [Zodiac Festival Park](maps/zodiac-festival-park.tmj)၊ [Nebula Arcade](maps/nebula-arcade.tmj)၊ [Orbit Playground](maps/orbit-playground.tmj) | အလွတ်သဘောတွေ့ဆုံခြင်းနှင့် အပန်းဖြေခြင်း။ |
| ကမ်းခြေ | [Shipyard Beach](maps/shipyard-beach.tmj)၊ [Constellation Shore](maps/constellation-shore.tmj)၊ [FA SHIP](maps/fa-ship.tmj)၊ [Ship Interior](maps/fa-ship-interior.tmj) | ကမ်းခြေကွေ့၊ ပင်လယ်ကမ်းလျှောက်လမ်းနှင့် နှစ်ထပ်သင်္ဘော။ |
| လေ့လာရေးလမ်းဆုံ | [Campus Exploration](maps/campus-exploration.tmj) | ဓာတ်ကြီးလေးပါးနှင့် အပန်းဖြေနေရာများသို့ ချိတ်ဆက်ပေးပါသည်။ |
| ဓာတ်ကြီးလေးပါး | [Fire](maps/fire-district.tmj)၊ [Earth](maps/earth-district.tmj)၊ [Air](maps/air-district.tmj)၊ [Water](maps/water-district.tmj) | သက်ဆိုင်ရာအပြင်အဆင်နှင့် စုဆောင်းနိုင်သော sigil အမှတ်အသားများ။ |
| အပန်းဖြေ | [Star Garden](maps/star-garden.tmj)၊ [Moon Café](maps/moon-cafe.tmj)၊ [Moon Grotto](maps/moon-grotto.tmj) | အစီအစဉ်များကြား နားနေပြီး လေ့လာနိုင်သောနေရာများ။ |
| ကြယ်ကြည့် | [Stargazer Terrace](maps/stargazer-terrace.tmj)၊ [Hidden Observatory](maps/hidden-observatory.tmj) | မှန်ပြောင်းနှင့် ဆက်စပ်လုပ်ဆောင်မှု၊ sigil လေးခုဖြင့် ရှာဖွေရသော လမ်းကြောင်း။ |

မြေပုံ ID၊ အရွယ်အစားနှင့် ဝင်ရောက်နေရာအမည်များ၏ အဓိကမှတ်တမ်းမှာ [`src/world/catalog.ts`](src/world/catalog.ts) ဖြစ်ပါသည်။

<a id="status"></a>

## စစ်ဆေးပြီးသည့် အခြေအနေနှင့် ကျန်ရှိသောအလုပ်များ

နောက်ဆုံးမှတ်တမ်းတင်ထားသော မြေပုံစစ်ဆေးရက်မှာ **၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ ၂၉ ရက်** ဖြစ်ပါသည်။ ထိုစစ်ဆေးမှုမှ ပြင်ဆင်ချက်ကို commit [`e095eef`](https://github.com/htooayelwinict/varcamp-map/commit/e095eef16f3e3967c7cc2d98e82ef5e3f163fec0) ဖြင့် live သို့ ထုတ်လွှင့်ခဲ့ပါသည်။ စာရွက်စာတမ်း commit များသည် live map build ထက် အသစ်ဖြစ်နေနိုင်ပါသည်။

| စစ်ဆေးမှု | မှတ်တမ်းတင်ရလဒ် |
| --- | --- |
| Source နှင့် နေရာအထားအသို | မြေပုံ ၃၄ ခု၊ placement 23,046 ခု၊ native object 371 ခုနှင့် ရေးဆွဲထားသော tile 166,340 ခုကို စစ်ဆေးခဲ့ပါသည်။ ပြခန်းထိုင်ခုံ ၁၂ လုံး၏ collision footprint ကို ပြင်ဆင်ခဲ့ပါသည်။ |
| လမ်းကြောင်း | Spawn layer 81 ခု၊ ထွက်ပေါက် 80 ခုနှင့် WAM area 91 ခုကို စစ်ဆေးခဲ့ပြီး ထွက်ပေါက် 80 ခုလုံးကို browser ဖြင့် ဖြတ်သန်းခဲ့ပါသည်။ |
| ထုတ်လွှင့်ပြီးနောက် | မြေပုံ ၃၄ ခုလုံး တင်နိုင်ခဲ့ပြီး page error နှင့် ပျောက်နေသော asset မတွေ့ခဲ့ပါ။ ရင်ပြင်၏ ထွက်ပေါက် 18 ခုနှင့် collision probe 29 ခုကို ထပ်မံစစ်ဆေးရာ အောင်မြင်ခဲ့ပါသည်။ |
| ထုတ်လွှင့်မှု | ပြန်လည်ဒေါင်းလုဒ်စစ်ဆေးမှု နှစ်ကြိမ်တွင် မျှော်မှန်းထားသော live ဖိုင် 745 ခုလုံး ကိုက်ညီခဲ့ပြီး ပုံမှန် acceptance smoke အောင်မြင်ခဲ့ပါသည်။ |
| အလိုအလျောက်စမ်းသပ်မှု | Test file တစ်ခုစီ၏ နောက်ဆုံးရလဒ်ကို ပေါင်းစည်းရာ **2,376 အောင်မြင်၊ ယခင်ကတည်းကရှိသော failure 175 ခုနှင့် skip 89 ခု** ရှိပါသည်။ သီးခြား Node operations suite တွင် **17/18** အောင်မြင်ပါသည်။ Test အားလုံး အောင်မြင်နေခြင်း မဟုတ်ပါ။ |
| Guide ဝန်ဆောင်မှု | Private release pin များကို ပြန်လည်အတည်ပြုရန် လိုနေသဖြင့် **Orion၊ Nova နှင့် Lyra တို့ကို ရပ်ထားပါသည်**။ |
| Dependency | ထို audit ၏ push အချိန်တွင် GitHub က **alert 153 ခု၊ ၎င်းတို့အနက် critical 7 ခု** ကို ဖော်ပြခဲ့ပါသည်။ မြေပုံစစ်ဆေးမှုတွင် ထို alert များကို မခွဲခြမ်းစစ်ဆေးခဲ့သဖြင့် လက်တွေ့အသုံးပြုမှုအပေါ် သက်ရောက်မှုကို မသတ်မှတ်ရသေးပါ။ |

အသေးစိတ်ကို [audit နှင့် အထောက်အထားများ](docs/qa/map-stability-2026-10-29/README.md)၊ [test ရလဒ်စာရင်း](docs/qa/map-stability-2026-10-29/test-results-final.json) နှင့် [dependency alert များ](https://github.com/htooayelwinict/varcamp-map/security/dependabot) တွင် ဖတ်နိုင်ပါသည်။ အထက်ပါအချက်များသည် ထိုနေ့က စစ်ဆေးထားသည့် မှတ်တမ်းဖြစ်ပြီး အချိန်နှင့်တစ်ပြေးညီ health dashboard မဟုတ်ပါ။

ဤစစ်ဆေးမှုသည် မြေပုံဖိုင်၊ လမ်းကြောင်းနှင့် သတ်မှတ်ထားသော live အသုံးပြုမှုတို့ကို အတည်ပြုထားခြင်း ဖြစ်ပါသည်။ **လူ ၁,၀၀၀ တစ်ပြိုင်နက် တက်ရောက်နိုင်ကြောင်း အတည်ပြုချက် မဟုတ်ပါ။** Core hosting capacity၊ အသံ/ဗီဒီယို၊ screen sharing၊ staff ခွင့်ပြုချက်နှင့် စက်ပြောင်းသုံးသည့် မှတ်တမ်းတို့အတွက် သီးခြားအစမ်းပွဲ လိုအပ်ပါသည်။ WorkAdventure က ပံ့ပိုးပေးမည့် event hosting နှင့် ဤလမ်းညွှန်ရှိ devbox demo ကို သီးခြားစဉ်းစားရပါမည်။

<a id="development"></a>

## Developer များအတွက် စတင်တည်ဆောက်နည်း

### လိုအပ်သော ကိရိယာများ

- Git၊ npm နှင့် [`.nvmrc`](.nvmrc) တွင် သတ်မှတ်ထားသော **Node.js 26.11.1**။
- မူရင်းမြေပုံပြင်ဆင်ခြင်း သို့မဟုတ် သတ်မှတ်ထားသော renderer အသုံးပြုခြင်းအတွက် **Tiled 1.12.2**။
- ထုတ်လွှင့်ရေးကိရိယာနှင့် သီးခြား geometry audit အတွက် Python 3။
- ကမ္ဘာကို ကစားရန် WorkAdventure client/server။ Vite သည် map asset နှင့် development tooling ကို ပေးပြီး multiplayer core ကို မပေးပါ။

Repository ထဲရှိ npm lockfile ကို အသုံးပြုပါ။ ကိရိယာနှင့် WorkAdventure source version အတိအကျကို [current release facts](docs/current-release-facts.md) တွင် ကြည့်ပါ။ သိမ်းဆည်းထားပြီးသော မြေပုံများကို build လုပ်ရန် upload credential သို့မဟုတ် OpenRouter key မလိုပါ။

```sh
git clone https://github.com/htooayelwinict/varcamp-map.git
cd varcamp-map

# fnm အသုံးပြုပါက repository နှင့် ကိုက်ညီသော Node ကို ရွေးပါ။
fnm install 26.11.1
fnm use 26.11.1

npm ci
npm run maps:validate
npm run art:check
npm run maps:build
npm run buildmap
```

ရလဒ်ဖြစ်သော `dist/` တွင် TMJ/WAM အတွဲ ၃၄ တွဲ၊ runtime နှင့် journal ဖိုင်များ၊ guide module၊ အသုံးပြုထားသော artwork နှင့် public credits ပါဝင်ပါသည်။ Private configuration နှင့် development preview များ မပါဝင်ပါ။

### မိမိစက်ပေါ်တွင် ကြည့်ရှုခြင်း

```sh
# Development server စပြီး Vite ဖော်ပြသည့် URL ကို အသုံးပြုပါ။
npm run dev

# သို့မဟုတ် build ပြီးသော dist/ ကို local preview ဖွင့်ပါ။
npm run preview -- --host 127.0.0.1
```

အများသုံး devbox ပေါ်တွင် development server ကို loopback ပေါ်၌သာ ထားပြီး SSH port forwarding သို့မဟုတ် Orca Ports panel မှ ဝင်ကြည့်ပါ။ ကြာမြင့်သောအလုပ်များကို `tmux` ထဲတွင် လုပ်ပါ။ ထိုစက်တွင် ARM64-native ကိရိယာများနှင့် Playwright ပါ bundled Chromium ကို အသုံးပြုပါ။

WorkAdventure custom map အဖြစ် သတ်မှတ်လိုပါက ထုတ်လွှင့်ထားသော entry asset URL မှာ အောက်ပါအတိုင်း ဖြစ်ပါသည်။

```text
https://maps.3-1-133-135.sslip.io/varcamp-demo/maps/overworld.tmj
```

ဤ URL သည် map JSON ဖိုင်ကို ပြန်ပေးပါသည်။ လူဝင်ကစားနိုင်သော URL မှာ [live demo](https://varcamp.3-1-133-135.sslip.io/~/varcamp-demo/maps/overworld.wam) ဖြစ်ပါသည်။ မိမိတို့ asset server ဖြင့် host လုပ်ပါက build ထဲရှိ relative path များကို ထိန်းထားပြီး WorkAdventure deployment မှ ဆက်သွယ်နိုင်သော HTTPS/CORS configuration ရှိရပါမည်။

<a id="repository"></a>

## Repository ဖိုင်လမ်းညွှန်

| လမ်းကြောင်း | တာဝန် |
| --- | --- |
| [`maps/`](maps/) | Tiled `.tmj` မူရင်းမြေပုံနှင့် တွဲဖက် WorkAdventure `.wam` ဖိုင်များ။ |
| [`maps/preview/`](maps/preview/) | Authoring preview များ။ Clean release ထဲတွင် မပါဝင်ပါ။ |
| [`world/`](world/) | Layout၊ အဆောက်အဦ၊ ပြခန်း၊ zone နှင့် geometry သတ်မှတ်ချက်များ။ |
| [`src/world/catalog.ts`](src/world/catalog.ts) | Map ID၊ အရွယ်အစားနှင့် ဝင်ရောက်နေရာ သတ်မှတ်ချက်များ။ |
| [`src/`](src/) | WorkAdventure runtime၊ လမ်းညွှန်၊ quest state နှင့် interface code။ |
| [`art/`](art/) | Sprite catalog၊ မူရင်း artwork၊ branding နှင့် attribution မှတ်တမ်းများ။ |
| [`assets/`](assets/) | Tileset၊ image atlas နှင့် runtime အတွက် အနုပညာဖိုင်များ။ |
| [`tools/`](tools/) | မြေပုံတည်ဆောက်ခြင်း၊ စစ်ဆေးခြင်း၊ art processing နှင့် rendering ကိရိယာများ။ |
| [`tests/`](tests/) | Runtime၊ မြေပုံ၊ art နှင့် publication ဆိုင်ရာ regression test များ။ |
| [`ops/`](ops/) | Publisher၊ demo deploy၊ live smoke test နှင့် ရွေးချယ်အသုံးပြုနိုင်သော service များ။ |
| [`publication/`](publication/) | မူရင်း source inventory၊ ပြန်လည်သုံးသပ်ထားသော ပြောင်းလဲမှုနှင့် SHA-256 မှတ်တမ်းများ။ |
| [`docs/operating/`](docs/operating/) | Editing၊ hosting၊ branding နှင့် guide ဝန်ဆောင်မှု လုပ်ငန်းစဉ်အသေးစိတ်။ |
| [`docs/qa/`](docs/qa/) | ရက်စွဲပါ စစ်ဆေးမှု၊ screenshot နှင့် အထောက်အထားများ။ |

`dist/` ကို `buildmap` က ထုတ်ပေးပါသည်။ `.qa/` တွင် local စစ်ဆေးမှုနှင့် release plan များကို သိမ်းပါသည်။ Root မှ `varcamp.tmj`၊ `tileset.png` နှင့် `build_map.py` တို့သည် သမိုင်းမှတ်တမ်းအဖြစ် ထားရှိသော မူကြမ်းဟောင်းများ ဖြစ်ပါသည်။ **လက်ရှိကမ္ဘာ၏ အစမှာ `maps/overworld.tmj` ဖြစ်ပါသည်။**

<a id="editing"></a>

## မြေပုံနှင့် အနုပညာဖိုင်များ ပြင်ဆင်နည်း

### ပြင်ဆင်မည့် နည်းလမ်းကို ရွေးပါ

မူရင်းမြေပုံကို ပြင်ဆင်ရန် Tiled ဖြင့် `maps/<map-id>.tmj` ကို ဖွင့်ပါ။ Layout source များမှာ `world/layouts/` တွင် ရှိပါသည်။ ရေရှည်ထိန်းသိမ်းမည့် ပြောင်းလဲမှုအတွက် layout source၊ native map နှင့် သက်ဆိုင်ရာ စစ်ဆေးသတ်မှတ်ချက်များ ကိုက်ညီနေအောင် ထားပါ။

| Command | လုပ်ဆောင်ချက် |
| --- | --- |
| `npm run maps:validate` | မူရင်းမြေပုံများကို စစ်ဆေးပါသည်။ |
| `npm run maps:build` | လက်ရှိကမ္ဘာကို စစ်ဆေးပြီး `maps/preview/` ကို ပြန်ထုတ်ပါသည်။ Native TMJ/WAM များကို မပြန်ရေးပါ။ |
| `npm run maps:author` | Layout များမှ native map များကို ပြန်ထုတ်ပါသည်။ Native edit guard က ဖိုင်အစုလိုက် စစ်ဆေးကာကွယ်ပေးပါသည်။ |
| `npm run buildmap` | Type-check လုပ်ပြီး သိမ်းဆည်းထားသောကမ္ဘာကို `dist/` အဖြစ် ထုတ်ပါသည်။ |

အသစ် clone လုပ်သော repository တွင် `.qa/authored-map-hashes.json` မရှိသေးပါ။ ထို့ကြောင့် `maps:author` က ရှိပြီးသော native map များအပေါ် ပြန်ရေးခြင်းကို ငြင်းပါမည်။ Tiled ဖြင့် တိုက်ရိုက်ပြင်ထားသမျှကို စစ်ဆေးညှိနှိုင်းပြီး backup ယူထားကာ **မူရင်းမှ ရည်ရွယ်ချက်ရှိရှိ ပြန်တည်ဆောက်မည့်အချိန်၌သာ** `npm run maps:author -- --initialize` ကို သုံးပါ။ ပုံမှန် setup သို့မဟုတ် preview အတွက် မလိုပါ။

### နေရာအထားအသိုနှင့် ကစားသူလမ်းကြောင်းကို ထိန်းပါ

- 32 px grid၊ embedded tileset၊ GID နှင့် boolean collision property များ ကိုက်ညီနေစေရပါမည်။
- မြင်ရသောပစ္စည်းနှင့် တိုက်မိ၍ ရပ်တန့်မည့် tile များကို တိကျစွာ ကိုက်ညီစေပါ။ လှန်ထားသော sprite နှင့် ကြည်လင်နေသော အနား tile များကိုပါ စစ်ပါ။ အပေါ်ဘက်အလှဆင်ပုံကြောင့် အောက်ရှိလမ်း မပိတ်စေရပါ။
- Layer အစဉ်၊ `floorLayer`၊ default/named entry နှင့် exit destination များကို ထိန်းပါ။ တံခါးရှေ့နှင့် ပြန်ရောက်မည့် spawn နေရာများတွင် လမ်းလျှောက်နိုင်ရပါမည်။
- WAM area ID၊ စီစဉ်သူ၏ property နှင့် live editor metadata ကို ထိန်းပါ။ အခန်း သို့မဟုတ် ပရိဘောဂရွှေ့လျှင် သက်ဆိုင်ရာ zone ကိုပါ ရည်ရွယ်ချက်နှင့်အညီ ရွှေ့ပါ။
- WorkAdventure client အစစ်ထဲတွင် သက်ဆိုင်ရာဘက်များမှ လမ်းလျှောက်စမ်းပါ။ တံခါးအဝင်အထွက် နှစ်ဖက်လုံးနှင့် avatar ကို ပုံများက မှန်ကန်စွာ ဖုံးကွယ်ခြင်းရှိမရှိ စစ်ပါ။

Native rendering နှင့် WAM ထိန်းသိမ်းနည်းကို [map-editing guide](docs/operating/map-editing.md) တွင်၊ ပြန်စစ်နိုင်သော collision စစ်ဆေးမှုများကို [နောက်ဆုံး audit](docs/qa/map-stability-2026-10-29/README.md) တွင် ဖတ်ပါ။

### လိုဂိုနှင့် အနုပညာပြောင်းလဲမှု

မူရင်းဖိုင်၊ အသုံးပြုခွင့်၊ attribution၊ အရွယ်အစားနှင့် sprite footprint ကို [`art/sponsors.json`](art/sponsors.json)၊ [`art/sources.json`](art/sources.json) နှင့် [`art/tile-catalog.json`](art/tile-catalog.json) တို့ဖြင့် မှတ်တမ်းတင်ပါ။ လိုဂိုများကို ရှိပြီးသော native tile-layer ပုံစံအတိုင်း အစားထိုးပြီး ပြခန်းနှင့် နံရံပေါ်တွင် အရွယ်အစားကိုက်ညီအောင် ထားပါ။ သတ်မှတ်ထားသော WorkAdventure engine တွင် ဤနေရာများကို Tiled image layer ဖြင့် အစားထိုးအသုံးပြု၍ မရပါ။

ပြင်ဆင်နိုင်သော master ဖိုင်နှင့် လိုင်စင်စာသားများကို ထိန်းသိမ်းပါ။ [Sponsor replacement](docs/operating/sponsors.md) နှင့် သက်ဆိုင်ရာ art generator ကို လိုက်နာပါ။ Flight atlas ကို Linux နှင့် သတ်မှတ်ထားသော macOS renderer တို့ဖြင့် ပြန်ထုတ်ရာ pixel ကွာခြားမှုရှိကြောင်း သိထားပါသည်။ မသက်ဆိုင်သောပြင်ဆင်မှုအတွက် committed pixel များကို ထိန်းထားပြီး ပြန်ထုတ်လိုက်သော atlas ကို ထုတ်လွှင့်မီ သီးခြားစစ်ဆေးအတည်ပြုပါ။

### ပြောင်းလဲမှုကို မှတ်တမ်းတင်ပြီး ပြန်လည်သုံးသပ်ပါ

သက်ဆိုင်ရာ validator နှင့် test များကို run ပါ။ မြင်ရသောရလဒ်ကို စစ်ပြီး သက်ဆိုင်ရာ publication hash မှတ်တမ်းများကို ပြင်ဆင်ပါ။ မူရင်း source-inventory entry 303 ခုကို မပြောင်းရပါ။ ပြန်လည်သုံးသပ်ထားသော အစားထိုးမှုများကို revision chain တွင် မှတ်တမ်းတင်ပြီး ထပ်တိုးကာကွယ်ထားသောဖိုင်များကို `extensionInventory` တွင် မှတ်တမ်းတင်ပါသည်။ README များကဲ့သို့ documentation ဖိုင်များလည်း ထိုနေရာတွင် hash ဖြင့် မှတ်တမ်းတင်ထားပါသည်။ ပြောင်းလဲမှုကို ပြန်လည်သုံးသပ်ပြီး hash မှတ်တမ်းပြင်ဆင်ပြီးနောက် source verifier ကို run ပါ။

လက်ရှိလုပ်ငန်းစဉ်မှာ တာဝန်ခံက local ပြောင်းလဲမှုကို ပြန်လည်သုံးသပ်၊ commit လုပ်ပြီး `main` သို့ fast-forward push လုပ်ခြင်း ဖြစ်ပါသည်။ **မဖြစ်မနေ PR ဖွင့်ရခြင်း သို့မဟုတ် hosted CI အဆင့် မရှိပါ။** GitHub သို့ push လုပ်ခြင်းသည် source history ကို ထုတ်ဝေခြင်းဖြစ်ပြီး live map deploy သည် သီးခြားလုပ်ဆောင်ချက် ဖြစ်ပါသည်။

<a id="testing"></a>

## စစ်ဆေးခြင်းနှင့် စမ်းသပ်ခြင်း

| စစ်ဆေးမည့်အရာ | Command |
| --- | --- |
| Native map | `npm run maps:validate` |
| Art catalog နှင့် asset | `npm run art:check` |
| Preview နှင့် source ကိုက်ညီမှု | `npm run maps:build` |
| TypeScript နှင့် release package | `npm run buildmap` |
| Source hash နှင့် publication မှတ်တမ်း | `node publication/verify-source.mjs .` |
| Current facts နှင့် documentation link | `node ops/current-release-facts.mjs --check` |
| Vitest suite | `npm test -- --maxWorkers=1 --testTimeout=30000` |
| Node operations suite | `npm run test:node` |

Package ပေါ်မူတည်သော test များမစမီ `dist/` ကို build လုပ်ပါ။ ရှိပြီးသော failure များကို [နောက်ဆုံး audit](docs/qa/map-stability-2026-10-29/README.md) တွင် မှတ်တမ်းတင်ထားပါသည်။ Test အချို့အောင်မြင်ခြင်းကို test အားလုံးအောင်မြင်သည်ဟု မဖော်ပြပါနှင့်။ သမိုင်းဝင် fixture အချို့တွင် macOS Tiled executable path၊ Apple Python 3.9.6 အပြုအမူနှင့် Docker CLI/Compose သတ်မှတ်ချက်များ ရှိပါသည်။ ၎င်းတို့သည် Linux ပေါ်တွင် committed world ကို build လုပ်ရန် လိုအပ်ချက်နှင့် သီးခြားဖြစ်ပါသည်။

သီးခြား geometry နှင့် sprite-footprint စစ်ဆေးမှုများကိုလည်း ပြန်လုပ်နိုင်ပါသည်။

```sh
python3 docs/qa/map-stability-2026-10-29/audit.py
node docs/qa/map-stability-2026-10-29/alpha-audit.mjs
```

ရလဒ်များကို `.qa/map-stability-audit/` အောက်တွင် သိမ်းပါသည်။

### Live browser smoke

Acceptance အတွက် သီးခြား dependency များကို တစ်ကြိမ်တပ်ဆင်ပါ။

```sh
cd ops/acceptance
npm ci
npx playwright install chromium
cd ../..

npm run acceptance:smoke
```

ဤစမ်းသပ်မှုသည် **live demo သို့ အမှန်တကယ် ဆက်သွယ်ပါသည်**။ Name/avatar ရွေးချယ်မှု၊ camera/microphone settings၊ journal၊ guide-panel interface နှင့် ဒုတိယမြေပုံတင်နိုင်မှုကို စစ်ပါသည်။ Screenshot နှင့် JSON summary ကို ထုတ်ပေးပါသည်။ Pass/fail နှင့်အတူ ဖော်ပြထားသော console error များကိုပါ ကြည့်ပါ။ Guide panel ပွင့်ခြင်းတစ်ခုတည်းက ရပ်ထားသော bot များ ပြန်ဖြေနိုင်ကြောင်း မသက်သေပြပါ။ URL၊ visitor name သို့မဟုတ် output directory ပြောင်းရန် [acceptance options](ops/acceptance/README.md) ကို ဖတ်ပါ။

<a id="publishing"></a>

## Demo ကို ထုတ်လွှင့်နည်း

လက်ရှိ demo ကို devbox ပေါ်တွင် build လုပ်ပြီး upload လုပ်ပါသည်။ GitHub တွင် source ကို သိမ်းပြီး demo ၏ WorkAdventure map storage က release ကို ပေးပါသည်။ Upload credential များကို `/srv/varcamp/private/environment` တွင်သာ ထားပါ။ Git၊ client script၊ screenshot သို့မဟုတ် log ထဲသို့ မထည့်ပါနှင့်။

**ရှိပြီးသော WAM များတွင် စီစဉ်သူ၏ live editor state ပါဝင်ပါသည်။** Storage upload သည် target directory တစ်ခုလုံးကို အစားထိုးသဖြင့် live ဖိုင်များကို ထိန်းသိမ်းပြီး ပြန်လည်သုံးသပ်ထားသော WAM ပြောင်းလဲမှုများကိုသာ ရွှေ့ပေးသည့် planner ကို အသုံးပြုပါ။ Raw ZIP တင်ခြင်း သို့မဟုတ် `dist/` ကို တိုက်ရိုက်အစားထိုးကူးခြင်းကြောင့် ထို state ပျောက်နိုင်ပါသည်။

### ပြင်ဆင်ပြီး စစ်ဆေးခြင်း

သက်ဆိုင်ရာ local check များပြီးပါက မရှိသေးသော plan directory အသစ်တစ်ခုဖြင့် run ပါ။ `YYYYMMDD-HHMM` ကို မိမိ release ၏ ရက်စွဲနှင့်အချိန်ဖြင့် အစားထိုးနိုင်ပါသည်။

```sh
npm run deploy:demo -- --plan .qa/release-YYYYMMDD-HHMM
```

`--apply` မပါလျှင် source ကို build/verify လုပ်ခြင်း၊ live target ကို ဖတ်ခြင်း၊ WAM `?v=` token migration ပြင်ဆင်ခြင်းနှင့် release plan ထုတ်ခြင်းတို့ကိုသာ လုပ်ပါသည်။ **Upload မလုပ်သေးပါ။** အောက်ပါဖိုင်များကို စစ်ဆေးပါ။

| ဖိုင် | စစ်ဆေးရန် |
| --- | --- |
| `plan.json` | Target၊ baseline၊ ထိန်းသိမ်းမည့်ဖိုင်၊ ပြန်လည်သုံးသပ်ထားသော WAM ပြောင်းလဲမှုနှင့် နောက်ဆုံးမျှော်မှန်းဖိုင်စာရင်း။ |
| `baseline.zip` | နှိုင်းယှဉ်ခြင်းနှင့် recovery စီစဉ်ခြင်းအတွက် ဒေါင်းလုဒ်ထားသော live state။ |
| `release.zip` | Clean build release။ |
| `package.zip` | ထိန်းသိမ်းမည့် live asset များပါဝင်သော အမှန်တကယ် upload package။ |
| `reviewed-wams.zip` | Live baseline မှ ဆင်းသက်လာပြီး ပြန်လည်သုံးသပ်ထားသော token ပြောင်းလဲမှုပါ WAM ဖိုင်များ။ |

### အမှန်တကယ်တင်ပြီး အတည်ပြုခြင်း

Editor ကို မည်သူမျှ မပြင်နေသောအချိန်ကို ညှိနှိုင်းပါ။ Autosave ပြီးဆုံးစေရန် စောင့်ပြီး စစ်ဆေးထားသော plan အတိအကျကို apply လုပ်ပါ။

```sh
python3 ops/release_upload.py apply \
  --plan .qa/release-YYYYMMDD-HHMM \
  --environment /srv/varcamp/private/environment \
  --quiet-editor-window

npm run acceptance:smoke
```

ခွင့်ပြုပြီးသော release အတွက် ထို quiet-editor အခြေအနေကို ပြည့်မီစွာ ထိန်းထား၍ တစ်ဆက်တည်း build နှင့် apply လုပ်လိုပါက အောက်ပါ command ကို သုံးနိုင်ပါသည်။

```sh
npm run deploy:demo -- --apply
```

Publisher သည် upload မလုပ်မီ live inventory ကို 16 စက္ကန့်ခြား၍ နှစ်ကြိမ် နှိုင်းယှဉ်ပါသည်။ Upload ပြီးလျှင်လည်း အချိန်ခြား၍ ဖိုင်အပြည့်အစုံကို နှစ်ကြိမ် ပြန်ဖတ်စစ်ဆေးပါသည်။ Baseline ပြောင်းသွားလျှင် plan အသစ်လိုပါသည်။ Plan၊ smoke output နှင့် မြင်ကွင်းစစ်ဆေးမှု အထောက်အထားကို release နှင့်အတူ ထိန်းသိမ်းပါ။ Upload အောင်မြင်ပြီးနောက် smoke မအောင်မြင်ကြောင်း wrapper က ဖော်ပြနိုင်သဖြင့် ထုတ်လွှင့်ပြီးပြီဟု မကြေညာမီ နောက်ဆုံး smoke result ကို စစ်ပါ။

Atomic editor lock သို့မဟုတ် အလိုအလျောက် rollback မရှိပါ။ Upload သို့မဟုတ် verification မအောင်မြင်လျှင် အထောက်အထားကို ထိန်းထားပြီး recovery စီစဉ်မီ လက်ရှိ live state နှင့် saved baseline ကို နှိုင်းယှဉ်ပါ။ `--with-tests` ထည့်လျှင် automated suite နှစ်ခုကို အရင် run ပြီး failure ရှိပါက ရပ်ပါမည်။ လက်ရှိသိထားသော failure များကို အထက်တွင် ဖော်ပြထားပါသည်။

Publication သည် WorkAdventure core သို့မဟုတ် guide service များကို restart မလုပ်ပါ။ ကိရိယာနှင့် service configuration အသေးစိတ်ကို [publication procedure](docs/operating/publication.md) နှင့် [devbox deployment notes](docs/operating/devbox-deployment.md) တွင် ဖတ်ပါ။ ရက်စွဲဟောင်းပါ မှတ်တမ်းများတွင် ထိုအချိန်၏ အရေအတွက်နှင့် deployment ယူဆချက်များ ကျန်ရှိနေသဖြင့် လက်ရှိ command နှင့် status အတွက် ဤ README မှ စတင်ဖတ်ပါ။

<a id="guides"></a>

## Guide bot နှင့် NPC ဝန်ဆောင်မှုများ

**Orion၊ Nova နှင့် Lyra တို့ကို လက်ရှိ ရပ်ထားပါသည်။** ရေးသားထားသော guide အပြုအမူနှင့် service source များ ရှိနေသော်လည်း ပြန်ဖွင့်မီ private release pin များကို ပြန်လည်အတည်ပြုရန် လိုပါသည်။

Scripted guide များသည် ကြိုတင်ရေးသားထားသော တုံ့ပြန်ချက်များကို အသုံးပြုသဖြင့် AI-provider key မလိုပါ။ Release တွင် `bots/lyra.js` ပါဝင်ပါသည်။ ဖွင့်မီ ထုတ်လွှင့်ထားသော module byte နှင့် map/collision hash မှတ်တမ်းများကို ပြန်လည်သုံးသပ်ထားသော package နှင့် ကိုက်ညီကြောင်း စစ်ပြီး သီးခြားတက်ရောက်သူနှစ်ဦးဖြင့် အတူတကွအသုံးပြုမှုကို စမ်းသပ်ရပါမည်။

Guide များ ဖွင့်ထားချိန်တွင် avatar menu → **All settings** → **Talk to Nearby Guides** သို့ ဝင်ပါ။ အနီးရှိ guide ကို ရွေးပြီး ရာသီခွင်အမည် သို့မဟုတ် panel command ကို ပေးပါ။ Guide panel သည် သတ်မှတ်ထားသော ဆက်သွယ်နည်း ဖြစ်ပါသည်။ Map သို့မဟုတ် module အသစ်တင်ခြင်းတစ်ခုတည်းဖြင့် guide service ကို ပြန်အတည်ပြုပြီးသား မဖြစ်ပါ။

[Legacy NPC chat server](ops/npc/README.md) သည် server-side OpenRouter configuration ပါသော သီးခြားရွေးချယ်အသုံးပြုနိုင်သည့် integration ဖြစ်ပါသည်။ Provider key ကို private server configuration တွင်သာ ထားပါ။ အသေးစိတ်ကို [Scripted Lyra](docs/operating/scripted-lyra.md)၊ [guide operations](ops/bots/README.md) နှင့် [persistent guide services](ops/bots/persistent-service/README.md) တွင် ဖတ်ပါ။

<a id="handoff"></a>

## ပါဝင်ကူညီခြင်းနှင့် နောင်နှစ်များအတွက် လွှဲပြောင်းခြင်း

VarCamp ကို နောက်စီစဉ်မည့်အဖွဲ့ကလည်း နားလည်ပြီး ဆက်ထိန်းသိမ်းနိုင်စေရန် ရည်ရွယ်ပါသည်။ Code ရေးတတ်မှသာ ပါဝင်ကူညီနိုင်ခြင်း မဟုတ်ပါ။ မြန်မာ/အင်္ဂလိပ်စာရွက်စာတမ်း၊ တက်ရောက်သူလမ်းညွှန်၊ မြေပုံဒီဇိုင်း၊ အနုပညာ၊ လူတိုင်းလက်လှမ်းမီအသုံးပြုနိုင်ရေး၊ စမ်းသပ်ခြင်းနှင့် runtime code တို့တွင် ကူညီနိုင်ပါသည်။ လက်ရှိထိန်းသိမ်းသူ ပြန်လည်သုံးသပ်နိုင်သော အလုပ်အသေးတစ်ခုမှ စတင်ပါ။

### ပထမဆုံး ပါဝင်ကူညီမည့်သူအတွက်

1. Demo ကို လည်ပတ်ပြီး နောက်ဆုံးရက်စွဲပါ audit ကို ဖတ်ပါ။ ပြီးစီးထားသည့်အရာနှင့် မဖြေရှင်းရသေးသည့်အရာကို ခွဲသိပါ။
2. Repository ကို clone လုပ်၊ သတ်မှတ်ထားသော Node version ကို ရွေးပြီး local validation နှင့် build အဆင့်များကို ပြီးအောင် လုပ်ပါ။
3. လက်ရှိစီစဉ်သူအဖွဲ့နှင့် အလုပ်အသေးတစ်ခုကို ညှိနှိုင်းပါ။ မပြင်မီ ထိခိုက်မည့်မြေပုံ/ဖိုင်နှင့် ရလိုသောရလဒ်ကို မှတ်သားပါ။
4. သက်ဆိုင်ပါက editable source၊ export လုပ်ထားသော asset၊ collision footprint နှင့် attribution ကို တစ်ပါတည်း ထိန်းသိမ်းပါ။ အပြုအမူ သို့မဟုတ် setup ပြောင်းလျှင် **ဘာသာစကားနှစ်မျိုးလုံး၏ လမ်းညွှန်** ကို ပြင်ပါ။
5. ပြောင်းလဲမှုနှင့် သက်ဆိုင်သော check များကို run ပါ။ Map ပြင်ဆင်မှုအတွက် screenshot နှင့် လမ်းလျှောက်/တံခါးစစ်ဆေးချက်ကို ထည့်ပါ။ Code ပြင်ဆင်မှုအတွက် သက်ဆိုင်ရာ test result ကို ထည့်ပါ။
6. ပြောင်းလဲမှု၊ အထောက်အထားနှင့် ကျန်ရှိသော ကန့်သတ်ချက်များကို maintainer ထံ ပေးပါ။ လက်ရှိလုပ်ငန်းစဉ်အရ maintainer က local review လုပ်၊ commit လုပ်ပြီး `main` သို့ push လုပ်ပါသည်။ Live deploy ကို သီးခြား ဆောင်ရွက်ပါသည်။

### နောက်နှစ်ပွဲအတွက် ပြင်ဆင်ခြင်း

| အဆင့် | နောက်အဖွဲ့က ဆောင်ရွက်ရန် |
| --- | --- |
| ယခင်နှစ်ကို မှတ်တမ်းတင်ပါ | နှစ်သစ်စတင်မီ ယခင် edition ၏ Git commit၊ live URL၊ map-storage target၊ release plan နှင့် ရက်စွဲပါ QA report ကို မှတ်တမ်းတင်ပါ။ Recovery archive များကို private နေရာတွင် ထိန်းသိမ်းပါ။ |
| ပွဲ၏အမှတ်အသားကို ပြင်ပါ | နှစ်၊ ပွဲအမည်၊ ကြမ်းပြင်လိုဂို၊ နံရံ panel၊ ကြိုဆိုစာနှင့် ထုတ်ဝေထားသော link များကို ပြန်စစ်ပါ။ `art/sponsors.json` မှ source master နှင့် generator အထိ လိုက်စစ်ပါ။ `2026` ပါသမျှကို အစုလိုက် အလိုအလျောက် မအစားထိုးပါနှင့်။ |
| မိတ်ဖက်အသုံးပြုခွင့်ကို ပြန်အတည်ပြုပါ | နှစ်သစ်အတွက် logo ခွင့်ပြုချက်ကို ပြန်မေးပါ။ ၂၀၂၆ ပွဲအတွက် ပေးထားသောလိုဂိုက နောင်နှစ်များတွင်ပါ အလိုအလျောက်ခွင့်ပြုသည်ဟု မယူဆပါနှင့်။ သက်တမ်းကုန် သို့မဟုတ် ရုပ်သိမ်းထားသော branding ကို ပြောင်းပြီး attribution ကို ထိန်းပါ။ |
| အစီအစဉ်ကို စီစဉ်ပါ | ဟောပြောပွဲများကို ရာသီခွင်အခန်းနှင့် ခန်းမများသို့ ခွဲဝေပါ။ Presenter/listener နေရာကို စစ်ပြီး စီစဉ်သူရွေးထားသော လမ်းကြောင်းမှ အချိန်ဇယားကို ထုတ်ပြန်ပါ။ |
| Quest မှတ်တမ်းဆက်သုံးမသုံး ဆုံးဖြတ်ပါ | လက်ရှိ progress key များမှာ `varcamp2026.*` ဖြစ်ပါသည်။ နှစ်သစ်တွင် အဟောင်းကို ထိန်းမည်လား၊ အသစ်စမည်လား ဆုံးဖြတ်ပြီး migration ကို ရည်ရွယ်ချက်ရှိရှိ ရေးသားစမ်းသပ်ပါ။ မြင်ရသောနှစ်စာသား ပြောင်းရုံဖြင့် သိမ်းထားသော progress မပျောက်ပါ။ |
| အစမ်းပွဲနေရာ သီးခြားပြင်ဆင်ပါ | Hosting တာဝန်ခံနှင့် rehearsal target သီးခြားညှိနှိုင်းပါ။ မထုတ်လွှင့်မီ ပိုင်ဆိုင်မှု၊ map URL နှင့် credential ကို အတည်ပြုပါ။ Setup လွယ်စေရန် ယခင်ပွဲအပေါ် တိုက်ရိုက်မရေးပါနှင့်။ |
| ပွဲအစမ်းလုပ်ပါ | Map၊ တံခါး၊ collision၊ asset၊ branding၊ browser နှင့် လူတိုင်းအသုံးပြုနိုင်မှုကို ပြန်စစ်ပါ။ WorkAdventure hosting အဖွဲ့နှင့် capacity၊ media နှင့် staff-role စမ်းသပ်မှုကို ညှိနှိုင်းပါ။ Guide bot သုံးမည်ဆိုလျှင် သီးခြားအတည်ပြုပါ။ |
| လွှဲပြောင်းမှတ်တမ်းအသစ် ချန်ထားပါ | `README.md` နှင့် `README.my.md` ကို ပြင်ပါ။ ရက်စွဲပါ QA မှတ်တမ်းထုတ်ပြီး မဖြေရှင်းရသေးသောအလုပ်၊ နောက် release တာဝန်ခံနှင့် hosting account တာဝန်ခံကို ရှင်းလင်းစွာ ဖော်ပြပါ။ |

### နောက်ထိန်းသိမ်းသူများထံ လွှဲပေးရမည့်အရာများ

ရက်စွဲပါ handoff စာတမ်းတွင် အောက်ပါအချက်များ ပါဝင်စေပါ။

- ပွဲနှစ်၊ တာဝန်ယူသည့် စီစဉ်သူအဖွဲ့၊ လက်ရှိ source commit နှင့် **သီးခြား deployed commit**။
- Demo/rehearsal/event URL များ၊ map-storage target၊ ကိရိယာ version နှင့် build/release လုပ်ငန်းစဉ်အတိအကျ။
- နောက်ဆုံး map/browser စစ်ဆေးချက်၊ မအောင်မြင်သေးသော test၊ dependency-alert စစ်ဆေးဆုံးဖြတ်ချက်နှင့် ပွဲမစမီ ကျန်ရှိသေးသောအလုပ်။
- Guide service အခြေအနေ၊ pin qualification အခြေအနေနှင့် private recovery archive တည်နေရာ။
- Editable artwork၊ asset source၊ မိတ်ဖက်ခွင့်ပြုချက်နှင့် license/attribution မှတ်တမ်း။
- Repository နှင့် hosting access တာဝန်ခံ။ Access ကို အဖွဲ့၏ private လုပ်ငန်းစဉ်ဖြင့် လွှဲပါ။ Public handoff တွင် တာဝန်ခံနှင့် တည်နေရာကို ဖော်ပြနိုင်သော်လည်း password၊ API key နှင့် သီးသန့် visitor data မထည့်ပါနှင့်။

နောင်အဖွဲ့များသည် ပူးပေါင်းလုပ်ဆောင်ပုံကို အတူညှိနှိုင်း၍ ပြင်ဆင်နိုင်ပါသည်။ လူသစ်များက chat history ဟောင်းကို ပြန်ရှာပြီး ခန့်မှန်းစရာမလိုစေရန် ဆုံးဖြတ်ချက်အသစ်ကို ဘာသာစကားနှစ်မျိုးလုံးတွင် မှတ်တမ်းတင်ပါ။

<a id="troubleshooting"></a>

## အဖြစ်များသော ပြဿနာများ

| လက္ခဏာ | စစ်ဆေးရန် |
| --- | --- |
| Map URL ဖွင့်လျှင် JSON ပေါ်နေသည် | ကစားနိုင်သော demo URL ကို သုံးပါ၊ သို့မဟုတ် `.tmj` asset ကို WorkAdventure client မှ တင်ပါ။ |
| အမည်တိုအောင် ပြင်သော်လည်း “Name is too long” ပေါ်နေသည် | စာလုံး ၁၀ လုံးထက် မပိုအောင် ထားပြီး validation မရှင်းပါက page ကို reload လုပ်ပါ။ |
| Clone အသစ်တွင် `maps:author` မလုပ်ပေးပါ | Native-edit guard မရှိသေးခြင်း ဖြစ်နိုင်ပါသည်။ ပုံမှန် setup အတွက် validate/build ကို သုံးပါ။ Native edit များညှိနှိုင်းပြီး backup ယူပြီးမှ author initialize လုပ်ပါ။ |
| ပစ္စည်းပေါ် လမ်းလျှောက်ရသည်၊ ကြမ်းပြင်လွတ်နေရာတွင် ပိတ်နေသည် | Sprite နှင့် collision cell ကို နှိုင်းယှဉ်ပါ။ Flip နှင့် transparent tile ကိုပါ စစ်ပြီး rebuild လုပ်ကာ client ထဲတွင် လမ်းလျှောက်စမ်းပါ။ |
| Deploy ပြီးလည်း ပုံဟောင်းပဲ မြင်ရသည် | WAM ၏ TMJ hash token၊ ဖတ်ယူလာသော asset byte နှင့် room အသစ်ဖွင့်ကြည့်မှုကို စစ်ပါ။ Review လုပ်ထားသော token-migration လုပ်ငန်းစဉ်ကို သုံးပါ။ |
| Guide panel ပွင့်ပြီး ပြန်မဖြေပါ | Service ဖွင့်ထားမထားနှင့် release pin အတည်ပြုပြီးမပြီး စစ်ပါ။ လက်ရှိမှတ်တမ်းမှာ ရပ်ထားခြင်း ဖြစ်ပါသည်။ |
| Linux တွင် test မအောင်မြင်ပါ | ရက်စွဲပါ baseline နှင့် fixture/tool လိုအပ်ချက်ကို နှိုင်းယှဉ်ပါ။ Failure တိုင်းကို platform ကြောင့်ဟု မယူဆပါနှင့်။ |
| ပြင်ပြီးနောက် source verifier မအောင်မြင်ပါ | ပြောင်းသွားသောဖိုင်ကို အတိအကျ review လုပ်ပြီး သက်ဆိုင်ရာ hash မှတ်တမ်းကို ပြင်ပါ။ မူရင်း snapshot inventory ကို ထိန်းထားပါ။ |
| Upload plan သည် live state နှင့် မကိုက်တော့ပါ | Plan ကို သိမ်းထား၊ စီစဉ်သူ၏ edit များကို ညှိနှိုင်းပြီး လက်ရှိ target မှ plan အသစ် ပြင်ဆင်ပါ။ |

Issue တင်ရာတွင် မြေပုံအမည်၊ tile ခန့်မှန်းတည်နေရာ သို့မဟုတ် landmark၊ မျှော်လင့်ထားသောနှင့် တကယ်ဖြစ်သောအပြုအမူ၊ လိုအပ်ပါက screenshot၊ source commit သို့မဟုတ် deployed asset version ကို ထည့်ပါ။ Credential နှင့် သီးသန့် visitor data ကို မထည့်ပါနှင့်။

<a id="documentation"></a>

## ဆက်လက်ဖတ်ရှုရန်

အောက်ပါ နည်းပညာစာတမ်းအသေးစိတ်များကို အင်္ဂလိပ်ဘာသာဖြင့် ထိန်းသိမ်းထားပါသည်။

- [Current release facts](docs/current-release-facts.md) — Source မှတွက်ထုတ်ထားသော အရေအတွက်နှင့် ကိရိယာ version များ။
- [Map editing](docs/operating/map-editing.md) — Native authoring၊ rendering၊ collision နှင့် WAM ထိန်းသိမ်းခြင်း။
- [Venue guide](docs/operating/venue-guide.md) — လမ်းကြောင်းနှင့် interaction ဒီဇိုင်းအသေးစိတ်။ လက်ရှိပြခန်းနှင့် service status အတွက် ဤ README ကို ကြည့်ပါ။
- [Sponsor replacement](docs/operating/sponsors.md) — Branding asset နှင့် မူရင်းမှတ်တမ်း။
- [Publication](docs/operating/publication.md) — Plan ဖိုင်များ၊ readback နှင့် recovery စဉ်းစားချက်များ။
- [Map stability audit](docs/qa/map-stability-2026-10-29/README.md) — Source၊ browser၊ collision နှင့် release အထောက်အထား။
- [Dependencies](docs/dependencies.md) — Toolchain၊ asset မူရင်းနှင့် historical fixture လိုအပ်ချက်များ။
- [Custom WOKA tooling](tools/wokas/README.md) — Avatar asset လုပ်ငန်းစဉ်။
- [Roadster animation](docs/operating/roadster.md) — Native animation နှင့် crop မှတ်တမ်း။

<a id="credits"></a>

## ဖန်တီးသူများနှင့် အသုံးပြုခွင့်လိုင်စင်များ

Starter မှ ဆင်းသက်လာသော code သည် [MIT license](LICENSE) ကို ဆက်လက်လိုက်နာပါသည်။ Artwork၊ font၊ logo နှင့် compatibility fixture များတွင် ကိုယ်ပိုင်လိုင်စင်စည်းကမ်းများ ရှိပါသည်။ Code ၏လိုင်စင်က ပုံအားလုံးကို လွတ်လပ်စွာ အသုံးပြုခွင့်ပေးသည်ဟု မယူဆရပါ။

[Art source registry](art/sources.json)၊ [branding records](art/sponsors.json)၊ asset folder တစ်ခုစီ၏ LICENSE/ATTRIBUTION/CREDITS ဖိုင်များနှင့် [ထုတ်ဝေထားသော credits](https://maps.3-1-133-135.sslip.io/varcamp-demo/credits/index.html) ကို ကြည့်ပါ။ သင်္ဘော၊ ဆိပ်ခံ၊ ရေနှင့် container asset များတွင် LPC ဖန်တီးသူများ၏ credit ကို ထိန်းသိမ်းထားပါသည်။ အခကြေးငွေဖြင့်ရသော tileset preview ပုံများကို production artwork အဖြစ် ပြန်လည်မဖြန့်ဝေပါ။ Asset ပြောင်းလဲသုံးစွဲသည့်အခါ ဖန်တီးသူအမည်နှင့် အသုံးပြုခွင့်မှတ်တမ်းကို ဆက်လက်ထိန်းသိမ်းပါ။
