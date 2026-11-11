# Official VarCamp 2026 sponsor artwork

Organizer Lewis supplied the public [Sponsor Assets folder](https://drive.google.com/drive/folders/12iPftbNTbAB-a8WPxV7N6AfguH6BpzPG) on 2026-11-11 and authorized placement of DigiSec Lab (Main), Newness (Spark), and Lokal Zaytann (Mini). Duwun is excluded from this change as requested. Trademark and artwork rights remain with each owner; these are not CC0 assets.

The original `DigSecLab_Secondary.png`, `newness-white.png`, and `LKZT-logo.pdf` are retained byte-for-byte. The light-on-dark DigiSec variant and the white Newness variant were supplied in their respective folders. Newness's supplied brand guide explicitly includes the reversed white mark on a dark background. File links and SHA-256 hashes are recorded in `exports.json` and `art/sponsors.json`.

`Lokal-Zaytann.png` is a transparent raster of page 1 of the original PDF, rendered at 8 pixels per PDF point using pypdfium2 5.15.2. No vector artwork, typography, colours or proportions were changed. To recreate it with an isolated Python environment:

```sh
uv run --with pypdfium2==5.15.2 --with pillow python -c 'import pypdfium2 as p; d=p.PdfDocument("art/source/sponsors/tier-logos/LKZT-logo.pdf"); d[0].render(scale=8,fill_color=(0,0,0,0)).to_pil().save("art/source/sponsors/tier-logos/Lokal-Zaytann.png")'
```

Native exports use the existing Sharp 0.34.5 dependency and `node tools/art/sponsor-logo-export.mjs`. Visible alpha bounds (threshold 32) plus a 1% safety margin were recorded once as crop rectangles. All visible interior pixels, original lettering and aspect ratios are retained. The marks are scaled with Lanczos3 and centred on transparent canvases. DigiSec's 192×128 canvas is split into two contiguous 192×64 native panels; Newness uses 192×64 and Lokal Zaytann uses 128×64. These are walkable floor displays with no added collision.

The export script also accepts `--out <directory>` for a non-mutating regeneration check. No runtime font loading, remote image fetching or new browser dependencies are required.
