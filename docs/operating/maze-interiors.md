# Maze interiors

Orbit Maze uses planted wall beds, stone corridors with dark edging, warm sconces and wood-framed landmark courts. Comet Maze uses constellation panels, cool sconces and framed crystal courts. Both entrances retain their VarCamp branding and furnished rest areas.

The October 2026 interior update preserves every original collision cell, portal, checkpoint, sign, image, animated effect and saved WAM. Added plants occupy existing solid wall beds. Added floor borders and rugs remain walkable. Comet's three original checkpoint crystals are the only small collectible crystal sprites; avoid adding decorative copies that confuse the quest.

## Editing and rebuilding

Use the repository's pinned Node version. Edit [the design configuration](../../world/maze-interiors.json) and, when necessary, [the deterministic decorator](../../tools/maps/maze-interiors.ts). Sprites come from the existing [tile catalog](../../art/tile-catalog.json); they must fit the native 32 px tile grid and existing atlas reservations.

```sh
node tools/run-tool.mjs tools/maps/maze-interiors.ts
npm run maps:build
npm run maps:validate
npm run art:check
npm run buildmap
npm test -- tests/maze-interiors.test.ts tests/maze-gates.test.ts tests/comet-maze.test.ts --maxWorkers=1 --testTimeout=30000
```

The decorator checks both scenes before writing their layout and TMJ files. Repeated runs replace its own `maze-interior-` placements without accumulating objects. It never writes WAM files. It rejects new furnishings that block previously walkable cells, then compares the full before/after collision masks.

Review the resulting maps in WorkAdventure. Walk the Orbit landmark route to the shrine, visit all three Comet checkpoints and its shrine, and use the maze-to-maze and plaza return portals. Check the actual action prompts, wall collisions and entrance/lounge clearances with camera and microphone off.

Follow [the devbox deployment guide](devbox-deployment.md) for release qualification and deployment. The frozen [historical successor fixture](../../tests/fixtures/maze-interiors/successor.json.gz) and [helper](../../tests/helpers/maze-interiors-history.ts) allow older regression tests to compare their original baselines. Do not silently regenerate those snapshots or earlier publication receipts to accept unrelated changes; a later redesign needs its own bounded successor and source receipt.

## နောက်နှစ်များအတွက် လွှဲပြောင်းလမ်းညွှန်

Orbit ဝင်္ကပါကို ဥယျာဉ်ပုံစံ၊ Comet ဝင်္ကပါကို ကြယ်စုအလှဆင်ပုံစံအဖြစ် ပြင်ဆင်ထားပါသည်။ အလှဆင်ပစ္စည်းအသစ်များသည် ယခင်ကတည်းက ပိတ်ထားသော နံရံဧရိယာအတွင်း၌သာ ရှိရမည်။ လူသွားလမ်း၊ ဝင်ပေါက်၊ ထွက်ပေါက်နှင့် checkpoint နေရာများကို မပိတ်ဆို့ပါနှင့်။ Comet ၏ checkpoint crystal သုံးခုနှင့် မှားနိုင်သော အလှဆင် crystal များကို ထပ်မထည့်ပါနှင့်။

အထက်ပါ configuration နှင့် decorator ကို ပြင်ပြီး command များကို အစဉ်လိုက် run ပါ။ ထို့နောက် WorkAdventure ထဲတွင် ကိုယ်တိုင်လမ်းလျှောက်၍ checkpoint စာသားများ၊ နံရံတိုက်မိမှု၊ ဝင်ပေါက်နှင့် ရင်ပြင်ပြန်လမ်းများကို စမ်းသပ်ပါ။ စမ်းသပ်စဉ် ကင်မရာနှင့် မိုက်ခရိုဖုန်းကို ပိတ်ထားပါ။ ယခင်စစ်ဆေးမှုမှတ်တမ်းများကို အောင်မြင်သွားစေရန်သာ ပြန်မရေးပါနှင့်။ ဒီဇိုင်းအသစ်အတွက် သီးခြားစစ်ဆေးမှုမှတ်တမ်းနှင့် publication receipt ထပ်ထည့်ပါ။
