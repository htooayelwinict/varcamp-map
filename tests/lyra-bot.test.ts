import {auditGuideRoutes} from '../tools/bots/route-audit';
import {historicalPlaza} from './helpers/plaza-groves';
import {historicalFloorPlaza} from './helpers/plaza-successor';
import {loadTileCatalog} from '../tools/art/catalog';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LyraAdapter, Audience, GuideRequest, Point } from '../src/bots/controller';
import type { TiledMap } from '../tools/maps/types';

const native = () => JSON.parse(readFileSync('maps/overworld.tmj', 'utf8')) as TiledMap;
async function modules() {
  expect(existsSync('src/bots/controller.ts'), 'Lyra controller must exist before dedicated startup can work').toBe(true);
  return { ...(await import('../src/bots/controller')), ...(await import('../src/bots/venue')), ...(await import('../src/bots/map-guard')) };
}
function harness(start: Point = { x: 2256, y: 2448 }) {
  let position = start, room = 'overworld', chat: (e: GuideRequest) => void = () => {}, bubble: (b: Audience) => void = () => {};
  const replies: string[] = [], diagnostics: string[] = [], moves: Point[] = [];
  let automatic = false;
  let pending: { resolve: (p: Point & { cancelled: boolean }) => void; reject: (e: Error) => void } | undefined;
  const unsubscribed: string[] = [];
  const adapter: LyraAdapter = {
    map: async () => native(), roomId: () => room, position: async () => position,
    move: (point) => { moves.push(point); if(automatic){position=point;return Promise.resolve({...point,cancelled:false});} return new Promise((resolve, reject) => { pending = { resolve, reject }; }); },
    reply: (_recipient, text) => { replies.push(text); }, diagnostic: text => { diagnostics.push(text); },
    onRequest: cb => { chat = cb; return () => { unsubscribed.push('chat'); }; },
    onAudience: cb => { bubble = cb; return () => { unsubscribed.push('bubble'); }; },
  };
  return { adapter, moves, replies, diagnostics, unsubscribed,
    chat: (text: string, ...authors: (number | undefined)[]) => chat({ text, authorId: authors.length ? authors[0] : 1 }),
    automatic: () => { automatic = true; if(pending){position=moves.at(-1)!;pending.resolve({...position,cancelled:false});pending=undefined;} },
    join: (ids = [1]) => {
      let enter: (id: number) => void = () => {}, leave: (id: number) => void = () => {}, end = () => {};
      const b: Audience = { participants: ids, onJoin: cb => { enter = cb; return () => { unsubscribed.push('participant-join'); }; }, onLeave: cb => { leave = cb; return () => { unsubscribed.push('participant-leave'); }; }, onEnd: cb => { end = cb; return () => { unsubscribed.push('meeting-end'); }; } };
      bubble(b); return { enter: (id: number) => enter(id), leave: (id: number) => leave(id), end: () => end() };
    },
    complete: (override?: Partial<Point & { cancelled: boolean }>) => { position = { ...moves.at(-1)!, ...override }; const p = pending; pending = undefined; p!.resolve({ ...position, cancelled: false, ...override }); },
    reject: () => { pending!.reject(Error('native move failed')); pending = undefined; },
    room: (id: string) => { room = id; },
  };
}
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('audited native navigation', () => {
  it('pins current provenance and audits physical/depth boundaries while preserving walkable floor graphics', async () => {
    const { ROUTES, planRoute } = await modules();
    expect(ROUTES.allowedCells).toHaveLength(864);
    expect(createHash('sha256').update(JSON.stringify(ROUTES.allowedCells)).digest('hex')).toBe('a47715acb0c16ea90f90da48f7cfa9f9a2c51a00f077edeb8f2d36bf582788c2');
    for (const [path, hash] of Object.entries(ROUTES.provenance.sourceSha256)) expect(createHash('sha256').update(readFileSync(path)).digest('hex'), path).toBe(hash);
    const map=native(),layout=JSON.parse(readFileSync('world/layouts/overworld.json','utf8')),wam=JSON.parse(readFileSync('maps/overworld.wam','utf8'));
    const result=auditGuideRoutes({map,layout,wam,catalog:loadTileCatalog(),routes:ROUTES});
    expect(result).toMatchObject({allowedCells:864,startupReservedCells:4,nativeCollisionCells:6860,portalCells:48,walkablePropOverlapCells:102,walkableImageOverlapCells:8});
    const collisionGids=new Set<number>();for(const s of map.tilesets)for(const t of s.tiles??[])if(t.properties?.some(p=>p.name==='collides'&&p.value===true))collisionGids.add(s.firstgid+t.id);
    const forbidden=new Set<number>();for(const l of map.layers)if(l.type==='tilelayer')l.data.forEach((g,i)=>{if(collisionGids.has((g&0x0fffffff)>>>0)||(g&&l.properties?.some(p=>p.name==='exitUrl')))forbidden.add(i);});
    for(const n of forbidden)expect(()=>planRoute([70,76],[n%128,Math.floor(n/128)])).toThrow();
    for (const d of ROUTES.destinations) {
      const route = planRoute([70, 76], d.tile);
      expect(route.at(-1)).toEqual(d.tile);
      for (let i = 1; i < route.length; i++) expect(Math.abs(route[i][0] - route[i-1][0]) + Math.abs(route[i][1] - route[i-1][1])).toBe(1);
    }
  });
  it('allows exactly the four northward native startup prefixes, never reserved-cell reentry', async () => {
    const { startupRoute, planRoute } = await modules();
    for (const x of [63, 64]) for (const y of [65, 66]) {
      const route = startupRoute([x, y]);
      expect(route.slice(0, y - 64 + 1)).toEqual(Array.from({ length: y - 63 }, (_, i) => [x, y - i]));
      expect(route.at(-1)).toEqual([70, 76]);
      expect(() => planRoute([70, 76], [x, y])).toThrow();
    }
    for (const cell of [[62,65], [65,66], [0,0], [76,71]]) expect(() => startupRoute(cell)).toThrow();
  });
  it('accepts rewritten release URLs and rejects geometry, collision and exit changes', async () => {
    const { guardMap } = await modules();
    await expect(guardMap(native())).resolves.toBeUndefined();
    const release = native(); release.properties!.find(p => p.name === 'script')!.value = '../assets/src-main-hash.js';
    for (const t of release.tilesets) t.image = '../assets/hash.png';
    await expect(guardMap(release)).resolves.toBeUndefined();
    for (const mutate of [
      (m: TiledMap) => { m.width = 127; },
      (m: TiledMap) => { const l=m.layers.find(l=>l.name==='scenery-belowAvatar-1'); if(l?.type==='tilelayer')l.data[70*128+77]=3984; },
      (m: TiledMap) => { const l = m.layers.find(l => l.name === 'physical-collisions'); if (l?.type === 'tilelayer') l.data[70 * 128 + 70] = 1; },
      (m: TiledMap) => { m.tilesets.find(s=>s.name==='navigation-mask')!.tiles![0].properties![0].value = true; },
      (m: TiledMap) => { m.layers.find(l => l.name === 'exit-solar')!.properties![0].value = 'different.wam'; },
    ]) { const changed = native(); mutate(changed); await expect(guardMap(changed)).rejects.toThrow(/map|geometry|signature/i); }
  });
});

describe('commands', () => {
  const goals = [['aries',107,71],['taurus',101,93],['gemini',85,109],['cancer',63,115],['leo',41,109],['virgo',25,93],['libra',19,71],['scorpio',25,49],['sagittarius',41,33],['capricorn',63,27],['aquarius',85,33],['pisces',101,49],['solar hall',20,24],['lunar hall',106,24],['mazes',68,5],['park',5,68],['harbor',118,63],['exploration',63,120]] as const;
  it.each(goals)('escorts %s to its safe preportal point and returns home', async (alias, x, y) => {
    const { createLyraController } = await modules(); const h = harness(); const c = createLyraController(h.adapter); await c.start();await flush(); h.join(); h.chat(` GO   ${alias.toUpperCase()} `); await flush();
    let reached = false;
    for (let i = 0; i < 300; i++) {
      if (!h.moves.length || h.moves.at(-1)!.x === 2256 && h.moves.at(-1)!.y === 2448 && reached) break;
      const p = h.moves.at(-1)!; if (p.x === x*32+16 && p.y === y*32+16) reached = true;
      h.complete(); await flush(); await vi.advanceTimersByTimeAsync(100);
    }
    expect(reached).toBe(true); expect(h.replies.some(r => /gate/i.test(r))).toBe(true); expect(h.moves.at(-1)).toEqual({x:2256,y:2448}); c.stop(); await flush();
  });
  it('normalizes every numbered English/Burmese room and returns Burmese for Burmese forms', async () => {
    const { parseCommand } = await modules();
    const signs = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
    for (let i = 1; i <= 12; i++) {
      const mm = String(i).replace(/\d/g, d => '၀၁၂၃၄၅၆၇၈၉'[Number(d)]);
      expect(parseCommand(String(i))).toMatchObject({kind:'go', destination:{id:`speaker-${signs[i-1]}`}, language:'en'});
      expect(parseCommand(`သွား ${mm}`)).toMatchObject({kind:'go', destination:{id:`speaker-${signs[i-1]}`}, language:'my'});
    }
    expect(parseCommand('အကူအညီ')).toMatchObject({kind:'help',language:'my'}); expect(parseCommand('အခန်းများ')).toMatchObject({kind:'rooms',language:'my'}); expect(parseCommand('ရပ်')).toMatchObject({kind:'stop',language:'my'});
    const h=harness(); const c=(await modules()).createLyraController(h.adapter);await c.start();await flush();h.join();h.chat('သွား ၁');expect(h.replies.at(-1)).toMatch(/[က-အ]/);c.stop();await flush();
  });
});

describe('single movement lifecycle and conversation', () => {
  it('starts from native spawn, reaches home, patrols adjacent cells and rests at corners', async () => {
    const {createLyraController}=await modules();const h=harness({x:2032,y:2128});const c=createLyraController(h.adapter);await c.start();await flush();await flush();
    expect(h.moves[0]).toEqual({x:2032,y:2096});h.complete();await flush();await vi.advanceTimersByTimeAsync(99);expect(h.moves).toHaveLength(1);await vi.advanceTimersByTimeAsync(1);expect(h.moves[1]).toEqual({x:2032,y:2064});
    for(let i=0;i<120&&!(h.moves.at(-1)!.x===2352&&h.moves.at(-1)!.y===2448);i++){h.complete();await flush();await vi.advanceTimersByTimeAsync(100);}
    expect(h.moves.at(-1)).toEqual({x:2352,y:2448});h.complete();await flush();const count=h.moves.length;await vi.advanceTimersByTimeAsync(1999);expect(h.moves).toHaveLength(count);await vi.advanceTimersByTimeAsync(101);expect(h.moves.length).toBeGreaterThan(count);c.stop();await flush();
  });
  it('pauses only for bubble members, greets once per 120s, resumes after 20s idle and cleans subscriptions', async () => {
    const {createLyraController}=await modules();const h=harness();const c=createLyraController(h.adapter);await c.start();await flush();h.chat('help',9);expect(h.replies).toHaveLength(0);
    const meeting=h.join();expect(h.replies).toHaveLength(1);h.complete();await flush();await vi.advanceTimersByTimeAsync(19999);expect(h.moves).toHaveLength(1);await vi.advanceTimersByTimeAsync(101);expect(h.moves).toHaveLength(2);
    meeting.leave(1);meeting.enter(1);expect(h.replies).toHaveLength(1);h.automatic();await vi.advanceTimersByTimeAsync(120000);meeting.leave(1);meeting.enter(1);expect(h.replies).toHaveLength(2);meeting.end();c.stop();await flush();expect(h.unsubscribed.sort()).toEqual(['bubble','chat','meeting-end','participant-join','participant-leave']);expect(vi.getTimerCount()).toBe(0);
  });
  it('honors escort ownership, cooldown, own-message ignore and stop during an unresolved move', async () => {
    const {createLyraController}=await modules();const h=harness();const c=createLyraController(h.adapter);await c.start();await flush();h.join([1,2]);const greetings=h.replies.length;
    h.chat('go aries',undefined);expect(h.replies).toHaveLength(greetings);h.chat('go aries');h.chat('help');expect(h.replies).toHaveLength(greetings+1);
    h.chat('go lunar hall',2);expect(h.replies.at(-1)).toMatch(/busy/i);await vi.advanceTimersByTimeAsync(2000);h.chat('stop',2);expect(h.replies.at(-1)).toMatch(/busy/i);h.chat('stop',1);expect(h.replies.at(-1)).toMatch(/stop|home/i);expect(h.moves).toHaveLength(1);
    h.complete();await flush();await vi.advanceTimersByTimeAsync(100);expect(h.moves[1]).toEqual({x:2256,y:2448});c.stop();await flush();
  });
  it('bounds and expires visitor reply/greeting bookkeeping without flooding unsupported text', async () => {
    const {createLyraController}=await modules();const h=harness();const c=createLyraController(h.adapter);await c.start();await flush();const b=h.join();h.chat('weather');const count=h.replies.length;h.chat('weather');expect(h.replies).toHaveLength(count);
    for(let id=2;id<=260;id++){b.enter(id);b.leave(id);}b.leave(1);b.enter(1);expect(h.replies).toHaveLength(count+255);
    const bounded=h.replies.length;b.enter(257);h.chat('help',257);expect(h.replies).toHaveLength(bounded);b.leave(257);
    h.automatic();await vi.advanceTimersByTimeAsync(600001);b.leave(1);const before=h.replies.length;b.enter(1);expect(h.replies).toHaveLength(before+1);c.stop();await flush();
  });
  it.each(['reject','cancel','wrong-cell','timeout','room-change','unknown-position'] as const)('stops safely on %s and ignores late completion', async reason => {
    const {createLyraController}=await modules();const h=harness(reason==='unknown-position'?{x:0,y:0}:undefined);const c=createLyraController(h.adapter);await c.start();await flush();await flush();
    if(reason==='reject')h.reject();if(reason==='cancel')h.complete({cancelled:true});if(reason==='wrong-cell')h.complete({x:0,y:0});if(reason==='timeout')await vi.advanceTimersByTimeAsync(15000);if(reason==='room-change'){h.room('other');await vi.advanceTimersByTimeAsync(100);}
    await flush();expect(h.diagnostics.join(' ')).toMatch(/stop|unknown|failed|cancel|timeout|room|position/i);const count=h.moves.length;if(reason==='timeout'||reason==='room-change')h.complete();await flush();await vi.advanceTimersByTimeAsync(60000);expect(h.moves).toHaveLength(count);expect(vi.getTimerCount()).toBe(0);expect(h.unsubscribed).toContain('bubble');if(reason!=='unknown-position')expect(h.unsubscribed).toContain('chat');
  });
  it('rejects an incompatible map before chat or movement and disposes the early meeting subscription',async()=>{const {createLyraController}=await modules();const h=harness();h.adapter.map=async()=>({...native(),width:64});const c=createLyraController(h.adapter);await c.start();await flush();expect(h.moves).toEqual([]);expect(h.diagnostics.join()).toMatch(/map|geometry/i);c.stop();});
});

describe('startup deadline and deferred actions',()=>{
  it('applies commands after the in-flight adjacent step and keeps the reserved northward escape intact',async()=>{
    const {createLyraController}=await modules();const h=harness({x:2032,y:2128});const c=createLyraController(h.adapter);await c.start();await flush();h.join();h.chat('go lunar hall');expect(h.moves).toEqual([{x:2032,y:2096}]);h.complete();await flush();await vi.advanceTimersByTimeAsync(100);expect(h.moves[1]).toEqual({x:2032,y:2064});c.stop();h.complete();await c.done;expect(vi.getTimerCount()).toBe(0);
  });
  it('enforces a total startup deadline even when every individual move settles before its timeout',async()=>{
    const {createLyraController}=await modules();const h=harness({x:2032,y:2128});const c=createLyraController(h.adapter);await c.start();await flush();
    for(let i=0;i<7;i++){await vi.advanceTimersByTimeAsync(9000);h.complete();await flush();await vi.advanceTimersByTimeAsync(100);}
    await c.done;expect(h.diagnostics.join()).toMatch(/startup timeout/);const count=h.moves.length;await vi.advanceTimersByTimeAsync(60000);expect(h.moves).toHaveLength(count);expect(vi.getTimerCount()).toBe(0);
  });
});


describe('response throttling preserves user control',()=>{
  it('accepts the owner stop immediately while suppressing the second reply, without overlapping moves',async()=>{
    const {createLyraController}=await modules();const h=harness();const c=createLyraController(h.adapter);await c.start();await flush();h.join();h.chat('go aries');const count=h.replies.length;h.chat('stop');expect(h.replies).toHaveLength(count);expect(h.moves).toHaveLength(1);
    h.complete();await flush();await vi.advanceTimersByTimeAsync(100);expect(h.moves[1]).toEqual({x:2256,y:2448});c.stop();h.complete();await c.done;
  });
});


describe('review regressions',()=>{
  it('rechecks the room after an awaited position response before issuing movement',async()=>{
    const {createLyraController}=await modules();const h=harness();const original=h.adapter.position;let calls=0;let resolvePosition!: (point:Point)=>void;
    h.adapter.position=()=>++calls===1?original():new Promise(resolve=>{resolvePosition=resolve;});
    const c=createLyraController(h.adapter);await c.start();await flush();await flush();expect(calls).toBe(2);expect(h.moves).toEqual([]);
    h.room('different-room');resolvePosition({x:2256,y:2448});await flush();
    expect(h.moves).toEqual([]);expect(h.diagnostics.join()).toMatch(/room changed/);await c.done;expect(vi.getTimerCount()).toBe(0);
  });
  it('rests for one two-second corner interval at closing home before the next patrol circuit',async()=>{
    const {createLyraController}=await modules();const h=harness();const c=createLyraController(h.adapter);await c.start();await flush();
    for(let step=0;step<30;step++) {
      const point=h.moves.at(-1)!;
      if(point.x===2256&&point.y===2448)break;
      h.complete();await flush();await vi.advanceTimersByTimeAsync(100);
      const count=h.moves.length;await vi.advanceTimersByTimeAsync(2000);
      // No pending native move is completed here; the extra advance only expires a corner rest.
      expect(h.moves.length-count).toBeLessThanOrEqual(1);
    }
    expect(h.moves.at(-1)).toEqual({x:2256,y:2448});const count=h.moves.length;
    h.complete();await flush();await vi.advanceTimersByTimeAsync(2099);expect(h.moves).toHaveLength(count);
    await vi.advanceTimersByTimeAsync(1);expect(h.moves).toHaveLength(count+1);expect(h.moves.at(-1)).toEqual({x:2288,y:2448});c.stop();h.complete();await c.done;
  });
});

describe('audited WorkAdventure runtime object aliases',()=>{
  const historyFolder='tests/fixtures/guide-alias-history/';
  const preCanonicalNative=():TiledMap=>{
    const raw=readFileSync(historyFolder+'receipt.json');
    expect(createHash('sha256').update(raw).digest('hex')).toBe('23d0dbcdd40ffd006da667926b2adb8d0bef4137e5fcf4b877a8ec3ba42e7b9a');
    const receipt=JSON.parse(raw.toString());
    expect(Object.keys(receipt).sort()).toEqual(['schema','nativeFile','nativeBytes','nativeSha256','rawAliasedGeometrySha256','normalizedNativeGeometrySha256','objectLayer','provenance'].sort());
    expect(receipt.schema).toBe('varcamp-observed-runtime-alias-history-v1');
    expect(receipt.nativeFile).toBe('floor-garden-before-canonical.tmj');
    expect(receipt.nativeSha256).toBe('969e46ce861f5ce6d5a279f5b266717447506d1da8609cbc576a2bdabdd0bf98');
    expect(receipt.rawAliasedGeometrySha256).toBe('792a943881b117bad1246c038020f4315bbe7d29e2ee76bf311bd38ee9cb140b');
    expect(receipt.normalizedNativeGeometrySha256).toBe('f33ae42c82c3c50bc668a074e36533e4544ed0ef150d73032bc5ad61f817dc0f');
    expect(receipt.objectLayer).toEqual({id:56,name:'inspection-zones',objects:[...Array.from({length:12},(_,i)=>({id:i+2,type:'room'})),...Array.from({length:9},(_,i)=>({id:i+14,type:'landmark'}))]});
    const bytes=readFileSync(historyFolder+receipt.nativeFile);
    expect(bytes.length).toBe(receipt.nativeBytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(receipt.nativeSha256);
    return JSON.parse(bytes.toString());
  };
  const sorted=(value:unknown):unknown=>Array.isArray(value)?value.map(sorted):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,sorted(v)])):value;
  const rawGeometry=(map:TiledMap)=>({width:map.width,height:map.height,tilewidth:map.tilewidth,tileheight:map.tileheight,layers:map.layers,tilesets:map.tilesets.map(t=>Object.fromEntries(Object.entries(t).filter(([k])=>k!=='image'))),properties:map.properties!.filter(p=>p.name!=='script')});
  // Reconstruct exactly the 21 additions recorded by the complete raw-vs-WA map audit.
  const runtimeMap = () => {
    const map = native();const layer=map.layers.find(l=>l.id===56);
    if(layer?.type!=='objectgroup')throw Error('Missing inspection-zones fixture');
    expect(layer.name).toBe('inspection-zones');
    expect(layer.objects.map(o=>[o.id,o.type])).toEqual([
      ...Array.from({length:12},(_,i)=>[i+2,'room']), ...Array.from({length:9},(_,i)=>[i+14,'landmark']),
    ]);
    for(const object of layer.objects)Object.assign(object,{class:object.type});
    return map;
  };
  it('preserves all four immutable historical native/runtime alias receipts',()=>{
    // Historical raw-digest oracles stay attached to their actual immutable native epochs.
    const prior=JSON.parse(readFileSync('tests/fixtures/solid-props/before-overworld.tmj','utf8'));
    for(const object of prior.layers.find((l:any)=>l.id===56).objects)object.class=object.type;
    const priorGeometry={width:prior.width,height:prior.height,tilewidth:prior.tilewidth,tileheight:prior.tileheight,layers:prior.layers,tilesets:prior.tilesets.map((t:Record<string,unknown>)=>Object.fromEntries(Object.entries(t).filter(([k])=>k!=='image'))),properties:prior.properties.filter((p:{name:string})=>p.name!=='script')};
    expect(createHash('sha256').update(JSON.stringify(sorted(priorGeometry))).digest('hex')).toBe('4d4ac17adb4be1f3bf94bcc287978b0f11e805b6a6f958bd1ab492f902f8793c');
    const propsPublished=historicalPlaza('native');
    for(const object of propsPublished.layers.find((l:any)=>l.id===56).objects)object.class=object.type;
    const propsGeometry={width:propsPublished.width,height:propsPublished.height,tilewidth:propsPublished.tilewidth,tileheight:propsPublished.tileheight,layers:propsPublished.layers,tilesets:propsPublished.tilesets.map((t:Record<string,unknown>)=>Object.fromEntries(Object.entries(t).filter(([k])=>k!=='image'))),properties:propsPublished.properties.filter((p:{name:string})=>p.name!=='script')};
    expect(createHash('sha256').update(JSON.stringify(sorted(propsGeometry))).digest('hex')).toBe('687b7189a946a2d4c246f30e64ccd4f87e1a7da86c514557d598bff5211fe37f');
    const floorPublished=historicalFloorPlaza('native') as TiledMap;
    const oldLayer=floorPublished.layers.find(l=>l.id===56);if(oldLayer?.type!=='objectgroup')throw Error('Missing historical alias fixture');
    for(const object of oldLayer.objects)object.class=object.type;
    const floorGeometry={width:floorPublished.width,height:floorPublished.height,tilewidth:floorPublished.tilewidth,tileheight:floorPublished.tileheight,layers:floorPublished.layers,tilesets:floorPublished.tilesets.map(t=>Object.fromEntries(Object.entries(t).filter(([k])=>k!=='image'))),properties:floorPublished.properties!.filter(p=>p.name!=='script')};
    expect(createHash('sha256').update(JSON.stringify(sorted(floorGeometry))).digest('hex')).toBe('f1ac2d7ff9cc00205b425cc35736913e2fd8a4354b3b91060a0d0ba7bbbaab42');
    const preCanonical=preCanonicalNative();
    expect(createHash('sha256').update(JSON.stringify(sorted(rawGeometry(preCanonical)))).digest('hex')).toBe('f33ae42c82c3c50bc668a074e36533e4544ed0ef150d73032bc5ad61f817dc0f');
    const preLayer=preCanonical.layers.find(l=>l.id===56);if(preLayer?.type!=='objectgroup')throw Error('Missing pre-canonical alias fixture');
    expect(preLayer.objects.map(o=>[o.id,o.type])).toEqual([...Array.from({length:12},(_,i)=>[i+2,'room']),...Array.from({length:9},(_,i)=>[i+14,'landmark'])]);
    for(const object of preLayer.objects)Object.assign(object,{class:object.type});
    expect(createHash('sha256').update(JSON.stringify(sorted(rawGeometry(preCanonical)))).digest('hex')).toBe('792a943881b117bad1246c038020f4315bbe7d29e2ee76bf311bd38ee9cb140b');
  });
  it('accepts exactly the observed redundant object classes without mutating the current independently audited native/runtime map',async()=>{
    const {guardMap,ROUTES}=await modules();const source=native(),map=runtimeMap();
    expect(createHash('sha256').update(readFileSync('maps/overworld.tmj')).digest('hex')).toBe(ROUTES.provenance.sourceSha256['maps/overworld.tmj']);
    const beforeSource=JSON.stringify(source),beforeRuntime=JSON.stringify(map),restored=structuredClone(map);
    const sourceLayer=source.layers.find(l=>l.id===56),runtimeLayer=restored.layers.find(l=>l.id===56);
    if(sourceLayer?.type!=='objectgroup'||runtimeLayer?.type!=='objectgroup')throw Error('Missing current observed alias layer');
    expect(runtimeLayer.objects).toHaveLength(21);
    for(const [index,object]of runtimeLayer.objects.entries()){
      expect(Object.hasOwn(sourceLayer.objects[index],'class')).toBe(false);
      expect(object.class).toBe(sourceLayer.objects[index].type);
      Reflect.deleteProperty(object,'class');
    }
    expect(restored).toEqual(source); // Only the independently observed 21 class additions are permitted.
    await expect(guardMap(source)).resolves.toBeUndefined();
    await expect(guardMap(map)).resolves.toBeUndefined();
    expect(JSON.stringify(source)).toBe(beforeSource);expect(JSON.stringify(map)).toBe(beforeRuntime);
  });
  it('keeps contradictory/class-only objects and every geometry/collision/exit change signature-bearing',async()=>{
    const {guardMap}=await modules();
    const firstObject=(m:TiledMap)=>{const l=m.layers.find(l=>l.id===56);if(l?.type!=='objectgroup')throw Error('Missing object fixture');return l.objects[0];};
    for(const mutate of [
      (m:TiledMap)=>Object.assign(firstObject(m),{class:'contradictory'}),
      (m:TiledMap)=>Reflect.deleteProperty(firstObject(m),'type'),
      (m:TiledMap)=>Object.assign(firstObject(m),{type:'changed',class:'changed'}),
      (m:TiledMap)=>{firstObject(m).x+=32;},
      (m:TiledMap)=>Object.assign(m.layers[0],{class:'tilelayer'}),
      (m:TiledMap)=>{const l=m.layers.find(l=>l.name==='physical-collisions');if(l?.type==='tilelayer')l.data[70*128+70]=1;},
      (m:TiledMap)=>{m.layers.find(l=>l.name==='exit-solar')!.properties![0].value='different.wam';},
      (m:TiledMap)=>{m.tilesets.find(s=>s.name==='navigation-mask')!.tiles![0].properties![0].value=true;},
      (m:TiledMap)=>{const i=m.layers.findIndex(l=>l.name==='Expo / VarCamp');expect(i).toBeGreaterThanOrEqual(0);expect(i).toBeLessThan(m.layers.length-1);m.layers.push(m.layers.splice(i,1)[0]);},
    ]){const changed=runtimeMap();mutate(changed);await expect(guardMap(changed)).rejects.toThrow(/signature|geometry/i);}
  });
});
