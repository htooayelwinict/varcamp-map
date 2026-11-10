import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--out' || !args[1])) {
  throw new Error('Usage: node tools/art/community-logo-export.mjs [--out <directory>]');
}
const output = args.length ? resolve(args[1]) : join(root, 'assets/sponsors');
await mkdir(output, { recursive: true });

const logos = [
  ['AWS-Usergroup-MYANMAR', 'partner-aws-ug-mm'],
  ['BSides-Myanmar', 'partner-bsides-mm'],
  ['Open-Source-Robotics-Foundation-For-Myanmar', 'partner-osrfm'],
  ['Ten-Ten', 'partner-ten-ten'],
];

for (const [original, panel] of logos) {
  const source = join(root, 'art/source/sponsors', `${original}.png`);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = -1, bottom = -1;
  // Ignore faint padding when measuring the mark, but retain the source pixels
  // (including soft edges) inside the crop. Never recolor or flatten the logo.
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 32) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  if (right < left) throw new Error(`No visible artwork in ${original}`);
  const padX = Math.ceil((right - left + 1) * 0.01);
  const padY = Math.ceil((bottom - top + 1) * 0.01);
  const cropLeft = Math.max(0, left - padX), cropTop = Math.max(0, top - padY);
  const crop = {
    left: cropLeft, top: cropTop,
    width: Math.min(info.width - 1, right + padX) - cropLeft + 1,
    height: Math.min(info.height - 1, bottom + padY) - cropTop + 1,
  };
  const mark = await sharp(source).extract(crop)
    .resize(120, 56, { fit: 'inside', kernel: 'lanczos3' }).png().toBuffer();
  const { width, height } = await sharp(mark).metadata();
  await sharp({ create: { width: 128, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, left: Math.floor((128 - width) / 2), top: Math.floor((64 - height) / 2) }])
    .png().toFile(join(output, `${panel}.png`));
}
console.log('Exported four transparent community logos from their original PNGs.');
