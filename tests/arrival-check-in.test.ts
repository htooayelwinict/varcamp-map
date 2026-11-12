import {beforeExpoRosterNative} from './helpers/expo-roster-history';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {describe,it,expect,vi} from 'vitest';
import stations from '../world/check-in-stations.json';
import {registerCheckInCounter,type CheckInApi} from '../src/check-in/counter';
import {applySponsorTiers,restoreSponsorTiers} from '../tools/maps/sponsor-tiers';
import {restoreSponsorLogos} from '../tools/maps/sponsor-logos';

const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const baseline=readFileSync('tests/fixtures/arrival-check-in/before.json.gz');
if(createHash('sha256').update(baseline).digest('hex')!=='0854c8ee37bb73d74af6fec9adf6c0b805ea2c32a1a2d70450c5368e7703efd5')throw Error('Arrival check-in baseline changed');
const before=JSON.parse(gunzipSync(baseline).toString());

describe('expanded arrival check-in',()=>{
 it('replays the reviewed expansion and rejects unrelated source edits',()=>{
  const prior=before['world/layouts/overworld.json'];
  const historic=restoreSponsorTiers(prior),expanded=applySponsorTiers(historic);
  expect(expanded.placements.filter(p=>p.sprite==='laptop'&&p.y===60&&p.x>=70&&p.x<79)).toHaveLength(3);
  expect(isDeepStrictEqual(restoreSponsorTiers(expanded),historic)).toBe(true);
  expanded.entries[0].x++;
  expect(()=>restoreSponsorTiers(expanded)).toThrow('unreviewed source layout');
 });
 it('offers three independently clickable registration stations without automatic navigation',()=>{
  let move=(_p:{x:number;y:number})=>{};
  const create=vi.fn(async()=>{}),del=vi.fn(async()=>{}),openTab=vi.fn();
  const actions:{callback:()=>void;remove:ReturnType<typeof vi.fn>}[]=[];
  const api={room:{id:'https://play.example/~/varcamp/maps/overworld.wam',website:{create,delete:del}},player:{onPlayerMove:(f:typeof move)=>{move=f;return {unsubscribe:vi.fn()};},getPosition:async()=>({x:0,y:0})},nav:{openTab},ui:{displayActionMessage:({callback}:{callback:()=>void})=>{const a={callback,remove:vi.fn(async()=>{})};actions.push(a);return a;}}} as unknown as CheckInApi;
  const dispose=registerCheckInCounter(api);
  move({x:72*32+16,y:62*32+16});
  expect(create.mock.calls).toHaveLength(3);
  const overlays=create.mock.calls.map(c=>(c as any)[0]);
  expect(new Set(overlays.map(o=>o.name)).size).toBe(3);
  expect(overlays.map(o=>o.position)).toEqual([70,73,76].map(x=>({x:x*32,y:60*32,width:96,height:64})));
  expect(overlays.every(o=>!o.url.includes('register.var.camp')&&o.allowApi===false&&o.allow==='')).toBe(true);
  expect(openTab).not.toHaveBeenCalled();
  for(const [n,x]of [71,74,77].entries()){
   move({x:x*32+16,y:62*32+16});
   const action=actions.at(-1)!;action.callback();action.callback();
   expect(openTab).toHaveBeenCalledTimes(n+1);
   expect(openTab).toHaveBeenLastCalledWith('https://register.var.camp/2026/attendee/check-in');
  }
  dispose();expect(del).toHaveBeenCalledTimes(3);
 });

 it('provides three laptops on a continuous solid counter with a clear front and both ends',()=>{
  const layout=read('world/layouts/overworld.json'),m=read('maps/overworld.tmj');
  const arrival=stations.stations.filter(s=>s.building==='overworld');
  expect(arrival).toHaveLength(3);
  const mask=m.layers.find((l:any)=>l.name==='physical-collisions').data;
  for(const s of arrival){
   expect(layout.placements.some((p:any)=>p.sprite==='laptop'&&p.x===s.desk.x+1&&p.y===60),s.id+' laptop').toBe(true);
   for(let y=60;y<62;y++)for(let x=s.desk.x;x<s.desk.x+3;x++)expect(Boolean(mask[y*128+x]),s.id+' surface').toBe(true);
  }
  for(let y=59;y<65;y++)for(let x=69;x<80;x++){
   if(y>=60&&y<62&&x>=70&&x<79)continue;
   expect(Boolean(mask[y*128+x]),`clear perimeter ${x},${y}`).toBe(false);
  }
  for(let y=62;y<64;y++)for(let x=69;x<80;x++)expect(arrival.filter(s=>x>=s.interaction.x&&x<s.interaction.x+s.interaction.width&&y>=s.interaction.y&&y<s.interaction.y+s.interaction.height)).toHaveLength(1);
  expect(layout.placements.find((p:any)=>p.id==='arrival-hospitality-reception-platform')).toMatchObject({x:70,y:59,width:9,height:5});
 });

 it('preserves all twelve door stations, controls, sponsor furnishings and collision outside reception',()=>{
  // Undo only the finite official-logo successor, independently covered by sponsor-logos.test.ts.
  const l=restoreSponsorLogos(read('world/layouts/overworld.json')),m=beforeExpoRosterNative(read('maps/overworld.tmj'));
  const prior=before['world/layouts/overworld.json'],old=before['maps/overworld.tmj'];
  expect(stations.stations.filter(s=>s.building!=='overworld')).toEqual(before['world/check-in-stations.json'].stations.filter((s:any)=>s.building!=='overworld'));
  for(const key of ['entries','exits','areas','inspectionZones','animatedOverlays','images','signs','standingSigns'] as const)expect(isDeepStrictEqual(l[key],prior[key]),key).toBe(true);
  const outside=(p:any)=>p.x+p.width<=70||p.x>=79||p.y+p.height<=57||p.y>=64;
  expect(isDeepStrictEqual(l.placements.filter(outside),prior.placements.filter(outside))).toBe(true);
  const mask=(v:any)=>v.layers.find((q:any)=>q.name==='physical-collisions').data;
  const a=mask(m),b=[...mask(old)];
  // The approved Spark table moves one tile; every other non-reception collision stays exact.
  [b[79*128+51],b[79*128+52]]=[b[79*128+52],b[79*128+51]];
  for(let i=0;i<a.length;i++)if(i%128<70||i%128>=79||Math.floor(i/128)<57||Math.floor(i/128)>=64)expect(a[i],`outside collision ${i}`).toBe(b[i]);
  expect(isDeepStrictEqual(m.tilesets.slice(0,-4),old.tilesets)).toBe(true);
  expect(isDeepStrictEqual(m.properties,old.properties)).toBe(true);
  expect(isDeepStrictEqual(m.layers.filter((q:any)=>q.type==='objectgroup'),old.layers.filter((q:any)=>q.type==='objectgroup'))).toBe(true);
  expect(read('maps/overworld.wam')).toEqual(before['maps/overworld.wam']);
 });
});
