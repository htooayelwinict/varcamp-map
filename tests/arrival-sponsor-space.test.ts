import {restoreSponsorTiers} from '../tools/maps/sponsor-tiers';
import {beforeSponsorTierNative} from './helpers/sponsor-tier-history';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {describe, it, expect} from 'vitest';
import {buildMap} from '../tools/maps/builder';
import {loadTileCatalog} from '../tools/art/catalog';
import {assertNativeSourceProjection} from '../tools/maps/native-projection';
import {applyArrivalSponsorSpace, restoreArrivalSponsorSpace} from '../tools/maps/arrival-sponsor-space';
import type {MapLayout, TiledMap, TileLayer} from '../tools/maps/types';

const read = (path:string) => JSON.parse(readFileSync(path, 'utf8'));
const baseline = () => {
  const bytes=readFileSync('tests/fixtures/arrival-sponsor-space/before.json.gz');
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('77dfb67eb7c12c4f6f6705a4ec3372e281a7247ab5f6ecd8e5965b50be87d44b');
  return JSON.parse(gunzipSync(bytes).toString()) as {base:string; layout:MapLayout; native:TiledMap};
};
const panels = (l:MapLayout) => l.images!.filter(i => i.name.startsWith('Arrival / VarCamp '));
const tile = (m:TiledMap, name:string) => m.layers.find(l => l.name === name) as TileLayer;
const current = () => ({layout:read('world/layouts/overworld.json') as MapLayout, native:read('maps/overworld.tmj') as TiledMap});

describe('arrival space reserved for main sponsors', () => {
  it('moves the complete existing logo six tiles north and leaves its former floor space clear', () => {
    const {layout} = current(), before = baseline().layout;
    expect(panels(layout)).toEqual(panels(before).map(p => ({...p, y:p.y - 6})));
    expect(panels(layout)).toHaveLength(4);
    const overlaps = (p:{x:number;y:number;width:number;height:number}) => p.x < 70 && p.x+p.width > 58 && p.y < 64 && p.y+p.height > 60;
    expect(layout.images!.filter(overlaps)).toEqual([]);
    expect(layout.placements.filter(p => p.layer !== 'terrain' && p.layer !== 'atmosphere' && overlaps(p))).toEqual([]);
  });

  it('keeps a uniform blue logo background and a connected, walkable north approach', () => {
    const {layout, native} = current(), ground = Array<string>(128*128);
    for (const p of layout.placements) if (p.layer === 'terrain')
      for (let y=p.y; y<p.y+p.height; y++) for (let x=p.x; x<p.x+p.width; x++) ground[y*128+x]=p.sprite;
    for (let y=54; y<58; y++) for (let x=58; x<70; x++) expect(ground[y*128+x], `logo floor ${x},${y}`).toBe('floor-blue');
    const collisions=tile(native, 'physical-collisions').data;
    for (let y=51; y<65; y++) for (let x=62; x<66; x++) expect(collisions[y*128+x], `north approach ${x},${y}`).toBe(0);
    for (let y=60; y<64; y++) for (let x=58; x<70; x++) expect(collisions[y*128+x], `sponsor space ${x},${y}`).toBe(0);
  });

  it('preserves every other object, artwork, control and collision, and translates native panels without changing GIDs', () => {
    const now=current(), layout=restoreSponsorTiers(now.layout), native=beforeSponsorTierNative(now.native), before=baseline();
    const restored=structuredClone(layout);
    for (const p of panels(restored)) p.y+=6;
    restored.placements.find(p => p.id === 'arrival-hospitality-central-walk')!.height=8;
    expect(isDeepStrictEqual(restored,before.layout), 'unrelated layout data changed').toBe(true);
    const nativeRestored=structuredClone(native);
    for (const p of panels(before.layout)) {
      const old=tile(before.native,p.name), next=tile(native,p.name), expected=Array<number>(128*128).fill(0);
      old.data.forEach((gid,i) => {if (gid) expected[i-6*128]=gid;});
      expect(isDeepStrictEqual(next,{...old,data:expected}), p.name+' native translation').toBe(true);
      tile(nativeRestored,p.name).data=old.data;
    }
    const ground=tile(native,'terrain').data, oldGround=tile(before.native,'terrain').data;
    const changed=ground.flatMap((gid,i) => gid !== oldGround[i] ? [i] : []);
    expect(changed).toEqual(Array.from({length:20}, (_,i) => (54+Math.floor(i/4))*128+62+i%4));
    tile(nativeRestored,'terrain').data=oldGround;
    expect(isDeepStrictEqual(nativeRestored,before.native), 'unrelated native data changed').toBe(true);
    expect(() => assertNativeSourceProjection(native,buildMap(layout,loadTileCatalog()).tmj)).not.toThrow();
  });

  it('round-trips the approved predecessor and rejects additional edits to either epoch', () => {
    const layout=restoreSponsorTiers(current().layout), before=baseline().layout;
    expect(isDeepStrictEqual(applyArrivalSponsorSpace(before),layout)).toBe(true);
    expect(isDeepStrictEqual(restoreArrivalSponsorSpace(layout),before)).toBe(true);
    panels(before)[0].x++;
    expect(() => applyArrivalSponsorSpace(before)).toThrow('unreviewed source layout');
    layout.placements.find(p => p.id==='check-in-counter-desk')!.x++;
    expect(() => restoreArrivalSponsorSpace(layout)).toThrow('unreviewed source layout');
  });
});
