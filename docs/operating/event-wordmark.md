# VarCamp pixel wordmark

The organizer selected readable pixel lettering on11November2026. All six shared VarCamp PNG exports use white titlecase **VarCamp** lettering. The supplied magenta flame, MYANMAR2026 subtitle, transparent backgrounds and native dimensions are retained.

The glyph source is `art/source/event-identity/pixel-wordmark.json`; the exporter is `tools/art/event-identity.ts`. The arrival lockup uses6px squares, the192×64 room panel3px squares and the128×64 booth panel2px squares. Rendering at each native size avoids blurred resizing and requires no installed or web font. The four arrival quadrants join into the existing384×128 panel. Original supplied artwork and the historical vector wordmark remain unchanged.

Run `node --import tsx tools/art/event-identity.ts` and `node --import tsx tools/art/plaza-generated.ts` for an intentional re-export. Update the owner registries and exact publication receipts after review. Run `tests/pixel-wordmark.test.ts` alone under the required6GB/no-swap limit, then `npm run art:check` under the same limit. Preserve live saved WAMs with the token-only release procedure. Inspect the entrance, info desk and room branding after reload.

VarCamp စာလုံးကို ဖတ်ရလွယ်သော pixel ပုံစံဖြင့် ပြောင်းထားပါသည်။ မူရင်းပန်းခရမ်းရောင် မီးတောက်၊ MYANMAR2026 စာတန်း၊ နောက်ခံအကြည်နှင့် မြေပုံပေါ်ရှိ အရွယ်အစား၊ နေရာတို့ကို မပြောင်းထားပါ။ အင်တာနက်မှ font တင်ရန် မလိုပါ။ နောင်ပြင်ဆင်သူများသည် မူရင်းဖိုင်များကို ထိန်းသိမ်းပြီး export နှင့် စစ်ဆေးမှုများ ပြုလုပ်ကာ live မြေပုံကို reload လုပ်၍ စစ်ဆေးပါ။
