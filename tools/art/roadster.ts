import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import type { LayoutAnimatedOverlay } from '../maps/types';

const authoringPath = 'art/source/roadster-authoring.json';
const metadataPath = 'art/source/roadster.json';
const atlasPath = 'assets/tilesets/original/roadster.png';
export const ROADSTER_V2_AUTHORING_PATH = 'art/source/roadster-v2-authoring.json';
export const ROADSTER_V2_METADATA_PATH = 'art/source/roadster-v2.json';
export const ROADSTER_V2_ATLAS_PATH = 'assets/tilesets/original/roadster-v2.png';
const SIZE = 160, COLUMNS = 16, MAX_TILES = 1024;
const hash = (data: Buffer): string => createHash('sha256').update(data).digest('hex');
const PAD_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" shape-rendering="crispEdges"><path d="M18 139H142V150H18Z" fill="#0d1721"/><path d="M20 137H140V146H20Z" fill="#263c4c"/><path d="M24 139H136V141H24Z" fill="#587481"/><path d="M22 139H32V142H22ZM128 139H138V142H128Z" fill="#8fd5df"/><path d="M40 135H120V139H40Z" fill="#102331"/></svg>';
// Pad light geometry declared by PAD_SVG above: the two end strips and the centre bar.
const PAD = { bar: { x0: 24, x1: 136, y0: 139, y1: 141, rgb: [0x58, 0x74, 0x81] }, strips: [{ x0: 22, x1: 32 }, { x0: 128, x1: 138 }], stripY: { y0: 139, y1: 142 }, stripRgb: [0x8f, 0xd5, 0xdf], plateY: { y0: 135, y1: 150 } } as const;
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

interface PoseCrop { cell: { left: number; top: number; width: number; height: number }; crop: { left: number; top: number; width: number; height: number }; target: { x: number; y: number; width: number; height: number }; name: string; duration: number; bottom: number }
interface Compiled { spec: { source: { path: string }; alphaThreshold: number; scale: number; position: { x: number; y: number }; poses: { name: string; duration: number; bottom: number }[] }; source: Buffer; pad: Buffer; cars: Buffer[]; crops: PoseCrop[] }
/** Shared pose compile: crop by true alpha, one nearest-neighbour scale, binary alpha and
 * integer centring over the fixed pad. Returns each pose as its own transparent car layer. */
async function compilePoses(): Promise<Compiled> {
 const spec = JSON.parse(readFileSync(authoringPath, 'utf8'));
 const source = readFileSync(spec.source.path);
 const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
 if (info.width !== 1254 || info.height !== 1254 || spec.poses.length !== 16 || spec.framePixels !== 160) throw Error('Roadster requires the reviewed 1254px 4×4 source and sixteen 160px frames');
 const pad = await sharp(Buffer.from(PAD_SVG)).ensureAlpha().raw().toBuffer();
 const cars: Buffer[] = [], crops: PoseCrop[] = [];
 for (let i = 0; i < 16; i++) {
  const left = Math.floor(i % 4 * info.width / 4), top = Math.floor(Math.floor(i / 4) * info.height / 4);
  const right = Math.floor((i % 4 + 1) * info.width / 4), bottom = Math.floor((Math.floor(i / 4) + 1) * info.height / 4);
  let x0 = right, y0 = bottom, x1 = left - 1, y1 = top - 1;
  for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) if (data[(y * info.width + x) * 4 + 3] >= spec.alphaThreshold) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < x0) throw Error(`Empty Roadster pose ${i}`);
  const crop = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  const width = Math.round(crop.width * spec.scale), height = Math.round(crop.height * spec.scale);
  const x = Math.floor((160 - width) / 2), y = spec.poses[i].bottom - height;
  if (x < 0 || y < 0 || x + width > 160 || y + height > 160) throw Error(`Clipped Roadster pose ${i}`);
  const pixels = await sharp(source).extract(crop).resize(width, height, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer();
  const car = Buffer.alloc(SIZE * SIZE * 4);
  // Binary alpha removes resampling fringes; retain every chosen opaque RGB value.
  for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) {
   const offset = (py * width + px) * 4;
   if (pixels[offset + 3] < spec.alphaThreshold) continue;
   const dest = ((py + y) * 160 + px + x) * 4;
   pixels.copy(car, dest, offset, offset + 3); car[dest + 3] = 255;
  }
  cars.push(car); crops.push({ cell: { left, top, width: right - left, height: bottom - top }, crop, target: { x, y, width, height }, ...spec.poses[i] });
 }
 return { spec, source, pad, cars, crops };
}
/** Opaque car pixels over the pad, exactly as the v1 compiler composed them. */
function composite(pad: Buffer, car: Buffer): Buffer {
 const frame = Buffer.from(pad);
 for (let i = 0; i < SIZE * SIZE; i++) if (car[i * 4 + 3]) { car.copy(frame, i * 4, i * 4, i * 4 + 3); frame[i * 4 + 3] = 255; }
 return frame;
}
interface Packed { tiles: Buffer[]; uniqueTiles: number; carrierTileIds: number[]; animations: LayoutAnimatedOverlay['animations']; png: Buffer; width: number; height: number; tilecount: number }
/** Native 32px packing: deduplicated frame tiles in frame order, then 25 synchronized carriers. */
async function packAtlas(frames: Buffer[], durations: number[]): Promise<Packed> {
 const tiles: Buffer[] = [], sequences: number[][] = Array.from({ length: 25 }, () => []), known = new Map<string, number>();
 for (const frame of frames) for (let ty = 0; ty < 5; ty++) for (let tx = 0; tx < 5; tx++) {
  const tile = Buffer.alloc(4096);
  for (let row = 0; row < 32; row++) frame.copy(tile, row * 128, ((ty * 32 + row) * 160 + tx * 32) * 4, ((ty * 32 + row) * 160 + tx * 32 + 32) * 4);
  const digest = hash(tile); let id = known.get(digest);
  if (id === undefined) { id = tiles.length; known.set(digest, id); tiles.push(tile); }
  sequences[ty * 5 + tx].push(id);
 }
 const uniqueTiles = tiles.length, carrierTileIds: number[] = [], animations: LayoutAnimatedOverlay['animations'] = [];
 for (const sequence of sequences) {
  const id = tiles.length; carrierTileIds.push(id); tiles.push(Buffer.from(tiles[sequence[0]]));
  animations.push({ id, frames: sequence.map((tileid, i) => ({ tileid, duration: durations[i] })) });
 }
 if (tiles.length > MAX_TILES) throw Error(`Roadster atlas exceeds the 4 MiB native bound: ${tiles.length} tiles`);
 const width = COLUMNS * 32, height = Math.ceil(tiles.length / COLUMNS) * 32, raw = Buffer.alloc(width * height * 4);
 for (const [id, tile] of tiles.entries()) for (let row = 0; row < 32; row++) tile.copy(raw, ((Math.floor(id / COLUMNS) * 32 + row) * width + id % COLUMNS * 32) * 4, row * 128, (row + 1) * 128);
 const png = await sharp(raw, { raw: { width, height, channels: 4 } }).png().toBuffer();
 return { tiles, uniqueTiles, carrierTileIds, animations, png, width, height, tilecount: width * height / 1024 };
}
const provenance = (metadata: string, png: Buffer, inputs: string[]): LayoutAnimatedOverlay['provenance'] => ({ metadataPath: metadata, atlasSha256: hash(png), inputs: inputs.map(path => ({ path, sha256: hash(readFileSync(path)) })) });

/** The frozen v1 epoch: sixteen whole-pose frames, 240 tiles, the registered `roadster`
 * reservation at GID 4330. Its atlas bytes never change; only input receipts advance. */
export async function renderRoadsterV1() {
 const { spec, source, pad, cars, crops } = await compilePoses();
 const frames = cars.map(car => composite(pad, car));
 const packed = await packAtlas(frames, spec.poses.map(p => p.duration));
 const overlay: LayoutAnimatedOverlay = { name: 'roadster', image: atlasPath, sourceId: 'original', level: 'belowAvatar', ...spec.position, width: 5, height: 5, carrierTileIds: packed.carrierTileIds, animations: packed.animations,
  provenance: provenance(metadataPath, packed.png, [spec.source.path, authoringPath, 'tools/art/roadster.ts', 'tools/maps/builder.ts', 'tools/maps/types.ts']) };
 const metadata = { version: 1, source: { ...spec.source, sha256: hash(source) }, framePixels: 160, alphaThreshold: spec.alphaThreshold, scale: spec.scale, crops, cycleMs: spec.poses.reduce((n: number, p: { duration: number }) => n + p.duration, 0), atlas: { width: packed.width, height: packed.height, columns: COLUMNS, tilecount: packed.tilecount, sha256: hash(packed.png) }, overlay };
 return { png: packed.png, metadata, frames };
}

// ---------------------------------------------------------------------------------------------
// v2: synthesised motion and effects. Every car pixel still comes from the sixteen poses.
interface Blob { cx: number; yTop: number; yBottom: number; height: number; count: number; seeds: number }
interface Features { jets: Blob[]; jetMask: Uint8Array; front: number[]; rear: number[] }
interface V2Pose { name: string; altitudePx: number; upright: boolean }
interface V2Phase { name: string; pose: number; durationMs: number; motion: 'ground' | 'tween' | 'roll' | 'drop'; tweenMs?: number; endDy?: number; dropMs?: number; settlePx?: number[]; bob?: boolean; glow?: number; steadyGlow?: boolean; dust?: boolean; rearLight?: 'flare' | 'bright'; padLights?: 'wake' | 'flash' }
interface V2Spec { version: number; base: string; atlas: string; position?: { x: number; y: number }; stepMs: number; visibleWidth: number; pad: { surfaceY: number; centerX: number }; flip: { sourcePose: number; centerX: number; centerY: number; durationMs: number }; poses: V2Pose[]; phases: V2Phase[]; bob: { amplitudePx: number; periodMs: number }; flicker: number[]; shadow: { centerY: number; groundHalfWidth: number; highHalfWidth: number; halfHeight: number; levels: number; maxAltitudePx: number }; glow: { color: number[]; radiusScale: number; minRadius: number; maxRadius: number }; frontLight: { periodMs: number }; padChase: { stepMs: number; segmentPx: number; stridePx: number } }
type PadState = { mode: 'static' } | { mode: 'chase'; phase: number } | { mode: 'wake'; phase: number } | { mode: 'flash' };
export interface RoadsterStep { phase: string; pose: number; rotationDeg: number | null; blendFrom: number | null; dy: number; altitudePx: number; shadowLevel: number; glow: number; flicker: number; dust: number; frontLight: number; rearLight: number; pad: PadState }
export interface RoadsterFrameReceipt extends RoadsterStep { index: number; durationMs: number; glowPixels: number; shadowHalfWidth: number }
const easeInOut = (t: number): number => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeIn = (t: number): number => t * t;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const inView = (x: number, y: number, visibleWidth: number): boolean => x >= 1 && x < visibleWidth - 1 && y >= 1 && y < SIZE - 1;
/** Locate the generated jet plumes, the thin white front strip and the red rear bar by colour
 * class and body region. Nothing is redrawn; these only steer where effects are applied. */
function analyze(car: Buffer, target: PoseCrop['target']): Features {
 const n = SIZE * SIZE, seed = new Uint8Array(n), mask = new Uint8Array(n);
 const rgb = (i: number) => [car[i * 4], car[i * 4 + 1], car[i * 4 + 2]] as const, opaque = (i: number) => car[i * 4 + 3] !== 0;
 for (let i = 0; i < n; i++) if (opaque(i)) { const [r, g, b] = rgb(i); if (b >= 200 && g >= 170 && r <= g - 40) seed[i] = mask[i] = 1; }
 for (let pass = 0; pass < 2; pass++) {
  const grown = new Uint8Array(mask);
  for (let y = 1; y < SIZE - 1; y++) for (let x = 1; x < SIZE - 1; x++) { const i = y * SIZE + x; if (mask[i] || !opaque(i)) continue; const [r, g, b] = rgb(i); if (Math.min(r, g, b) < 170) continue; for (let dy = -1; dy <= 1 && !grown[i]; dy++) for (let dx = -1; dx <= 1; dx++) if (mask[i + dy * SIZE + dx]) { grown[i] = 1; break; } }
  mask.set(grown);
 }
 const seen = new Uint8Array(n), jets: Blob[] = [];
 for (let start = 0; start < n; start++) {
  if (!mask[start] || seen[start]) continue;
  const stack = [start]; seen[start] = 1; let sx = 0, yTop = SIZE, yBottom = -1, count = 0, seeds = 0;
  while (stack.length) { const i = stack.pop()!, x = i % SIZE, y = Math.floor(i / SIZE); sx += x; yTop = Math.min(yTop, y); yBottom = Math.max(yBottom, y); count++; seeds += seed[i]; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue; const j = ny * SIZE + nx; if (mask[j] && !seen[j]) { seen[j] = 1; stack.push(j); } } }
  if (count >= 12 && seeds >= 6 && yBottom - yTop + 1 >= 6) jets.push({ cx: Math.round(sx / count), yTop, yBottom, height: yBottom - yTop + 1, count, seeds });
 }
 jets.sort((a, b) => a.cx - b.cx);
 const front: number[] = [], rear: number[] = [];
 for (let i = 0; i < n; i++) {
  if (!opaque(i) || mask[i]) continue; const [r, g, b] = rgb(i), x = i % SIZE, y = Math.floor(i / SIZE);
  if (Math.min(r, g, b) >= 236 && x < target.x + .45 * target.width && y > target.y + .5 * target.height) front.push(i);
  if (r >= 140 && g <= 90 && b <= 90) rear.push(i);
 }
 return { jets, jetMask: mask, front, rear };
}
function timeline(spec: V2Spec, crops: PoseCrop[]): RoadsterStep[] {
 const steps: RoadsterStep[] = [], step = spec.stepMs, top = (pose: number) => crops[pose].target.y;
 const turnSteps = spec.flip.durationMs / step;
 let t = 0, lastPose = spec.phases.at(-1)!.pose, lastDy = 0, bobClock = 0, turnStep = 0;
 for (const p of spec.phases) {
  const count = p.durationMs / step, rolling = p.motion === 'roll', poseIndex = rolling ? spec.flip.sourcePose : p.pose, pose = spec.poses[poseIndex], entryRoof = top(lastPose) + lastDy, startDy = entryRoof - top(poseIndex), drop = (p.dropMs ?? 0) / step;
  for (let s = 0; s < count; s++, t += step) {
   let dy = 0, glow = rolling ? 0 : p.glow ?? 0;
   const blendFrom = null, rotationDeg = rolling ? 360 * Math.min(turnStep, turnSteps) / turnSteps : null;
   if (p.motion === 'tween') { const f = easeInOut(Math.min(1, (s + 1) * step / p.tweenMs!)); dy = Math.round(startDy * (1 - f) + (p.endDy ?? 0) * f); if (p.bob && f >= 1) { dy += Math.round(spec.bob.amplitudePx * Math.sin(2 * Math.PI * bobClock / spec.bob.periodMs)); bobClock += step; } }
   else if (rolling && p.name !== 'recover') { turnStep++; }
   else if (p.motion === 'drop') { if (s < drop) dy = Math.round(startDy * (1 - easeIn((s + 1) * step / p.dropMs!))); else dy = p.settlePx?.[s - drop] ?? 0; }
   dy = dy || 0;// Math.round yields -0 for small negative tweens; receipts must round-trip through JSON
   const flicker = p.steadyGlow ? 1 : s % spec.flicker.length;
   if (p.padLights === 'wake') glow *= Math.min(1, (s + 1) / 3);
   if (p.motion === 'drop' && s >= drop + 2) glow = 0;
   const dust = p.dust ? (p.motion === 'drop' ? s - (drop - 1) : s) : -1;
   const altitudePx = pose.altitudePx - dy;
   const shadowLevel = clamp(Math.round(altitudePx / spec.shadow.maxAltitudePx * (spec.shadow.levels - 1)), 0, spec.shadow.levels - 1);
   const upright = pose.upright && !rolling;
   const frontLight = upright ? Math.round(1 + Math.sin(2 * Math.PI * t / spec.frontLight.periodMs)) : -1;
   const rearLight = !upright ? 0 : p.rearLight === 'flare' ? (s < 3 ? 2 : 1) : p.rearLight === 'bright' ? 1 : 0;
   let pad: PadState = { mode: 'static' };
   if (p.padLights === 'wake') pad = { mode: 'wake', phase: s };
   else if (p.motion === 'drop') pad = s < drop - 1 ? { mode: 'chase', phase: Math.floor(t / spec.padChase.stepMs) % 14 } : s <= drop ? { mode: 'flash' } : { mode: 'static' };
   else if (p.motion !== 'ground') pad = { mode: 'chase', phase: Math.floor(t / spec.padChase.stepMs) % 14 };
   steps.push({ phase: p.name, pose: poseIndex, rotationDeg, blendFrom, dy, altitudePx, shadowLevel, glow: Number((glow * (glow ? spec.flicker[flicker] : 0)).toFixed(4)), flicker, dust: dust >= 0 && dust < 3 ? dust : -1, frontLight, rearLight, pad });
   lastDy = dy;
  }
  lastPose = poseIndex;
 }
 return steps;
}
class Renderer {
 constructor(private readonly spec: V2Spec, private readonly pad: Buffer, private readonly cars: Buffer[], private readonly features: Features[]) {}
 private set(frame: Buffer, x: number, y: number, rgb: readonly number[]): void { const o = (y * SIZE + x) * 4; frame[o] = rgb[0]; frame[o + 1] = rgb[1]; frame[o + 2] = rgb[2]; frame[o + 3] = 255; }
 private add(frame: Buffer, i: number, rgb: readonly number[], w: number): void { for (let c = 0; c < 3; c++) frame[i * 4 + c] = Math.min(255, Math.round(frame[i * 4 + c] + rgb[c] * w)); }
 private isPad(i: number): boolean { return this.pad[i * 4 + 3] !== 0; }
 private padLights(frame: Buffer, state: PadState): void {
  const { bar, strips, stripY, stripRgb } = PAD, bright = [0xc8, 0xf4, 0xfa], dim = [0x6f, 0xb3, 0xc0];
  const paintStrip = (k: number, rgb: readonly number[]) => { for (let y = stripY.y0; y < stripY.y1; y++) for (let x = strips[k].x0; x < strips[k].x1; x++) this.set(frame, x, y, rgb); };
  const paintBar = (x0: number, x1: number, rgb: readonly number[]) => { for (let y = bar.y0; y < bar.y1; y++) for (let x = Math.max(bar.x0, x0); x < Math.min(bar.x1, x1); x++) { const o = (y * SIZE + x) * 4; if (frame[o] === bar.rgb[0] && frame[o + 1] === bar.rgb[1] && frame[o + 2] === bar.rgb[2]) this.set(frame, x, y, rgb); } };
  if (state.mode === 'wake') { const on = state.phase % 2 === 0; paintStrip(0, on ? bright : stripRgb); paintStrip(1, on ? bright : stripRgb); }
  else if (state.mode === 'flash') { paintStrip(0, bright); paintStrip(1, bright); paintBar(bar.x0, bar.x1, stripRgb); }
  else if (state.mode === 'chase') {
   const { segmentPx, stridePx } = this.spec.padChase, span = bar.x1 - bar.x0, a = bar.x0 + (state.phase * stridePx) % span, b = bar.x0 + ((state.phase + 7) * stridePx) % span;
   paintBar(a, a + segmentPx, stripRgb); paintBar(b, b + segmentPx, dim);
   paintStrip(0, state.phase % 2 === 0 ? bright : stripRgb); paintStrip(1, state.phase % 2 === 0 ? stripRgb : bright);
  }
 }
 private shadow(frame: Buffer, level: number): number {
  const s = this.spec.shadow, f = level / (s.levels - 1), hw = s.groundHalfWidth + (s.highHalfWidth - s.groundHalfWidth) * f, hh = s.halfHeight * (1 - .35 * f), k = .55 - .3 * f, cx = this.spec.pad.centerX;
  for (let y = PAD.plateY.y0; y < PAD.plateY.y1; y++) for (let x = 0; x < SIZE; x++) { const i = y * SIZE + x; if (!this.isPad(i)) continue; const d2 = ((x - cx) / hw) ** 2 + ((y - s.centerY) / hh) ** 2; if (d2 >= 1) continue; const m = 1 - k * (1 - d2); for (let c = 0; c < 3; c++) frame[i * 4 + c] = Math.round(frame[i * 4 + c] * m); }
  return Math.round(hw);
 }
 private dust(frame: Buffer, k: number): void {
  const rx = 16 + 18 * k, ry = 3 + 2 * k, dots = 14 + 4 * k, rgb = [[0xe6, 0xf8, 0xff], [0xbf, 0xe7, 0xf5], [0x9f, 0xcd, 0xe0]][k], cy = this.spec.pad.surfaceY - 3;
  for (let d = 0; d < dots; d++) { if (k === 2 && d % 2) continue; const a = 2 * Math.PI * d / dots, x = Math.round(this.spec.pad.centerX + rx * Math.cos(a)), y = Math.round(cy + ry * Math.sin(a)); if (y < 130 || y > 142 || !inView(x, y, this.spec.visibleWidth)) continue; this.set(frame, x, y, rgb); }
 }
 private blobs(pose: number, dy: number): { cx: number; cy: number; r: number }[] {
  const g = this.spec.glow; return this.features[pose].jets.map(j => ({ cx: j.cx, cy: j.yBottom + dy - 1, r: clamp(j.height * g.radiusScale, g.minRadius, g.maxRadius) }));
 }
 /** Additive cyan/white bloom beneath each plume: dithered 255-alpha pixels over the transparent
 * terrace, additive light on the pad. Returns the number of placed glow pixels. */
 private glowUnder(frame: Buffer, pose: number, dy: number, intensity: number, variant: number): number {
  if (!intensity) return 0; const color = this.spec.glow.color, [ox, oy] = [[0, 0], [1, 2], [2, 1]][variant % 3]; let placed = 0;
  for (const b of this.blobs(pose, dy)) { const R = b.r * intensity; for (let y = Math.floor(b.cy - R); y <= Math.ceil(b.cy + R); y++) for (let x = Math.floor(b.cx - R); x <= Math.ceil(b.cx + R); x++) {
   if (!inView(x, y, this.spec.visibleWidth)) continue; const d2 = ((x - b.cx) ** 2 + (y - b.cy) ** 2) / (R * R); if (d2 >= 1) continue; const w = (1 - d2) * intensity, i = y * SIZE + x;
   if (frame[i * 4 + 3]) { this.add(frame, i, [40, 120, 150], w * .8); continue; }
   if (w * .9 * 16 <= BAYER[(y + oy) % 4][(x + ox) % 4]) continue; const k = clamp((w - .5) * 2, 0, 1); this.set(frame, x, y, color.map(c => Math.round(c + (255 - c) * k))); placed++;
  } }
  return placed;
 }
 private glowOver(frame: Buffer, pose: number, dy: number, intensity: number): void {
  if (!intensity) return; const mask = this.features[pose].jetMask;
  for (const b of this.blobs(pose, dy)) { const R = b.r * intensity * 1.4; for (let y = Math.floor(b.cy - R); y <= Math.ceil(b.cy + R); y++) for (let x = Math.floor(b.cx - R); x <= Math.ceil(b.cx + R); x++) {
   if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || y - dy < 0 || y - dy >= SIZE || !mask[(y - dy) * SIZE + x]) continue; const d2 = ((x - b.cx) ** 2 + (y - b.cy) ** 2) / (R * R); if (d2 >= 1) continue; this.add(frame, y * SIZE + x, [30, 90, 110], (1 - d2) * intensity * .6);
  } }
 }
 private lights(car: Buffer, pose: number, front: number, rear: number): void {
  const f = this.features[pose];
  if (front > 0) { const m = [[1, 1, 1], [.86, .93, .98], [.72, .83, .91]][front]; for (const i of f.front) for (let c = 0; c < 3; c++) car[i * 4 + c] = Math.round(car[i * 4 + c] * m[c]); }
  if (rear > 0) {
   const core = rear === 2 ? [0xff, 0x6a, 0x50] : [0xff, 0x3b, 0x2e], reach = rear, halo = rear === 2 ? [90, 20, 0] : [70, 10, 0], redSet = new Set(f.rear);
   for (const i of f.rear) { const x = i % SIZE, y = Math.floor(i / SIZE); for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue; const j = ny * SIZE + nx; if (redSet.has(j) || !car[j * 4 + 3]) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); this.add(car, j, halo, 1 - (d - 1) / (reach + 1)); } }
   for (const i of f.rear) for (let c = 0; c < 3; c++) car[i * 4 + c] = core[c];
  }
 }
 private shifted(pose: number, dy: number): Buffer {
  const out = Buffer.alloc(SIZE * SIZE * 4), src = this.cars[pose];
  for (let y = 0; y < SIZE; y++) { const sy = y - dy; if (sy < 0 || sy >= SIZE) continue; src.copy(out, y * SIZE * 4, sy * SIZE * 4, (sy + 1) * SIZE * 4); }
  return out;
 }
 /** One fixed-viewpoint car, sampled without scaling or blending around a fixed pivot. */
 private rotated(pose: number, degrees: number): Buffer {
  const out = Buffer.alloc(SIZE * SIZE * 4), source = this.cars[pose], angle = degrees * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle), { centerX, centerY } = this.spec.flip;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
   const dx = x - centerX, dy = y - centerY, sx = Math.round(centerX + dx * cos + dy * sin), sy = Math.round(centerY - dx * sin + dy * cos);
   if (sx < 0 || sy < 0 || sx >= SIZE || sy >= SIZE) continue;
   const from = (sy * SIZE + sx) * 4;
   if (source[from + 3]) source.copy(out, (y * SIZE + x) * 4, from, from + 4);
  }
  return out;
 }
 render(step: RoadsterStep): { frame: Buffer; glowPixels: number; shadowHalfWidth: number } {
  const frame = Buffer.from(this.pad);
  this.padLights(frame, step.pad);
  const shadowHalfWidth = this.shadow(frame, step.shadowLevel);
  if (step.dust >= 0) this.dust(frame, step.dust);
  const glowPixels = this.glowUnder(frame, step.pose, step.dy, step.glow, step.flicker);
  const car = step.rotationDeg === null ? this.shifted(step.pose, step.dy) : this.rotated(step.pose, step.rotationDeg);
  if (step.rotationDeg === null) this.lights(car, step.pose, step.frontLight, step.rearLight);
  for (let i = 0; i < SIZE * SIZE; i++) if (car[i * 4 + 3]) { const x = i % SIZE, y = Math.floor(i / SIZE); if (x === 0 || y === 0 || x >= this.spec.visibleWidth || y === SIZE - 1) throw Error(`Roadster v2 car pixel leaves the arrival view at ${x},${y} (${step.phase})`); car.copy(frame, i * 4, i * 4, i * 4 + 3); frame[i * 4 + 3] = 255; }
  this.glowOver(frame, step.pose, step.dy, step.glow);
  return { frame, glowPixels, shadowHalfWidth };
 }
}
/** Compile the v2 display: 100 ms motion steps with eased roof-height tweens, a sinusoidal
 * hover bob, a landing settle, flickering thruster bloom, an altitude-scaled pad shadow, pad
 * light chases, ignition/touchdown dust, light pulses and one fixed-sprite full flip;
 * consecutive identical steps merge. */
export async function renderRoadster(options: { spec?: Partial<V2Spec> } = {}) {
 const compiled = await compilePoses(), { spec, source, pad, cars, crops } = compiled;
 const v2 = { ...JSON.parse(readFileSync(ROADSTER_V2_AUTHORING_PATH, 'utf8')), ...options.spec } as V2Spec;
 const cycleMs = spec.poses.reduce((n: number, p: { duration: number }) => n + p.duration, 0);
 if (v2.version !== 2 || v2.base !== authoringPath || v2.atlas !== ROADSTER_V2_ATLAS_PATH || v2.stepMs !== 100 || v2.poses.length !== 16 || v2.phases.length !== 16 || v2.phases.some((p, i) => p.pose !== i || p.durationMs % v2.stepMs || p.name !== spec.poses[i].name || v2.poses[i].name !== spec.poses[i].name)) throw Error('Roadster v2 authoring must step every reviewed pose in order at 100 ms');
 if (v2.phases.reduce((n, p) => n + p.durationMs, 0) !== cycleMs) throw Error('Roadster v2 must keep the reviewed 12.8 s cycle');
 if (v2.phases[0].motion !== 'ground' || v2.phases.at(-1)!.motion !== 'ground') throw Error('Roadster v2 first/last poses must stay grounded on the v1 anchor');
 if (v2.flip?.sourcePose !== 5 || v2.flip.centerX !== 80 || v2.flip.centerY !== 74 || v2.flip.durationMs !== 1600 || v2.phases.filter(p => p.motion === 'roll' && p.name !== 'recover').reduce((n,p) => n+p.durationMs,0) !== 1800) throw Error('Roadster flip must rotate the jump sprite once around its reviewed fixed pivot');
 const features = cars.map((car, i) => analyze(car, crops[i].target)), renderer = new Renderer(v2, pad, cars, features), steps = timeline(v2, crops);
 const frames: Buffer[] = [], durations: number[] = [], receipts: RoadsterFrameReceipt[] = []; let lastDigest = '';
 for (const step of steps) {
  const { frame, glowPixels, shadowHalfWidth } = renderer.render(step), digest = hash(frame);
  if (digest === lastDigest) { durations[durations.length - 1] += v2.stepMs; receipts[receipts.length - 1].durationMs += v2.stepMs; continue; }
  lastDigest = digest; frames.push(frame); durations.push(v2.stepMs); receipts.push({ index: frames.length - 1, durationMs: v2.stepMs, glowPixels, shadowHalfWidth, ...step });
 }
 const packed = await packAtlas(frames, durations);
 // Arrival refresh (2026-10-26): the v2 display may sit on its own tile; the frozen v1 epoch keeps the base position.
 const position = v2.position ?? spec.position;
 if (![position.x, position.y].every(n => Number.isSafeInteger(n) && n >= 0 && n + 5 <= 128)) throw Error('Roadster v2 position must keep the 5x5 display on the 128 tile map');
 const overlay: LayoutAnimatedOverlay = { name: 'roadster', image: ROADSTER_V2_ATLAS_PATH, sourceId: 'original', level: 'belowAvatar', x: position.x, y: position.y, width: 5, height: 5, carrierTileIds: packed.carrierTileIds, animations: packed.animations,
  provenance: provenance(ROADSTER_V2_METADATA_PATH, packed.png, [spec.source.path, authoringPath, ROADSTER_V2_AUTHORING_PATH, 'tools/art/roadster.ts', 'tools/maps/builder.ts', 'tools/maps/types.ts']) };
 const hoverDy = receipts.filter(r => r.phase === 'hover').map(r => r.dy);
 const metadata = { version: 2, source: { ...spec.source, sha256: hash(source) }, base: { path: authoringPath, sha256: hash(readFileSync(authoringPath)) }, authoring: { path: ROADSTER_V2_AUTHORING_PATH, sha256: hash(readFileSync(ROADSTER_V2_AUTHORING_PATH)) }, framePixels: 160, alphaThreshold: spec.alphaThreshold, scale: spec.scale, stepMs: v2.stepMs, crops,
  poses: v2.poses.map((p, i) => ({ ...p, jets: features[i].jets, frontLightPixels: features[i].front.length, rearLightPixels: features[i].rear.length })),
  frames: receipts, cycleMs, diagnostics: { steps: steps.length, frames: frames.length, uniqueTiles: packed.uniqueTiles, carrierTiles: 25, hoverBob: { amplitudePx: v2.bob.amplitudePx, minDy: Math.min(...hoverDy), maxDy: Math.max(...hoverDy) }, glowFrames: receipts.filter(r => r.glowPixels > 0).length, blendFrames: receipts.filter(r => r.blendFrom !== null).length, decodedRgbaBytes: packed.width * packed.height * 4 },
  atlas: { width: packed.width, height: packed.height, columns: COLUMNS, tilecount: packed.tilecount, sha256: hash(packed.png) }, overlay };
 return { png: packed.png, metadata, frames, steps };
}
/** Write both epochs: the frozen v1 atlas must reproduce byte for byte (only its receipts
 * advance); the v2 atlas and metadata are the current display. */
export async function writeRoadster(): Promise<void> {
 const v1 = await renderRoadsterV1();
 if (!readFileSync(atlasPath).equals(v1.png)) throw Error('Frozen v1 Roadster atlas no longer reproduces; the registered reservation body must not change');
 await writeFile(metadataPath, JSON.stringify(v1.metadata, null, 2) + '\n');
 const { png, metadata } = await renderRoadster();
 await writeFile(ROADSTER_V2_ATLAS_PATH, png);
 await writeFile(ROADSTER_V2_METADATA_PATH, JSON.stringify(metadata, null, 2) + '\n');
 console.log(`roadster: v1 ${v1.metadata.atlas.tilecount} tiles retained; v2 ${metadata.frames.length} frames, ${metadata.diagnostics.uniqueTiles} unique tiles, ${metadata.atlas.tilecount} atlas tiles, ${metadata.cycleMs} ms`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await writeRoadster();
