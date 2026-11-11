import {arrivalSponsorSpaceSuccessorSha} from './helpers/arrival-sponsor-space-history';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {it, expect} from 'vitest';
import sharp from 'sharp';
import {renderEventIdentity, checkEventIdentityArt, EVENT_MARK} from '../tools/art/event-identity';
import {renderArrivalRefresh} from '../tools/art/arrival-refresh';
import {renderHallBuildings} from '../tools/art/hall-buildings';
import {SIGN_IDS} from '../src/world/catalog';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

it('retains the exact supplied transparent logo and reproduces every current native export',async()=>{
  expect(sha(readFileSync(EVENT_MARK))).toBe('ffb579d7e977790707d29abaf7f86c0451703973a6f2ff1805f31aa4442a1aa2');
  const r=await renderEventIdentity();
  expect(r.metadata.crop).toEqual({left:96,top:31,width:864,height:987});
  expect(r.outputs.map(o=>o.path)).toEqual(['varcamp-2026','varcamp-horizontal','varcamp-arrival-nw','varcamp-arrival-ne','varcamp-arrival-sw','varcamp-arrival-se'].map(n=>'assets/sponsors/'+n+'.png'));
  for(const row of r.outputs) expect(readFileSync(row.path).equals(row.png),row.path).toBe(true);
  expect(await checkEventIdentityArt()).toEqual([]);
});

it('keeps the arrival subtitle pixel-exact and the four panels seamless',async()=>{
  const [current,previous]=await Promise.all([renderEventIdentity(),renderArrivalRefresh()]);
  const old=await sharp(previous.panel).ensureAlpha().raw().toBuffer();
  const now=await sharp(current.panel).ensureAlpha().raw().toBuffer();
  let pink=0;
  for(let y=0;y<128;y++) for(let x=0;x<384;x++) {
    const i=(y*384+x)*4;
    if(y>=106) expect(now.subarray(i,i+4).equals(old.subarray(i,i+4)),`retained subtitle at ${x},${y}`).toBe(true);
    if(now[i]>110 && now[i+1]<80 && now[i+2]>50 && now[i+3]>=192) pink++;
  }
  expect(pink).toBeGreaterThan(1000);
  const joined=Buffer.alloc(now.length);
  for(const [i,row] of current.logos.entries()) {
    const {data,info}=await sharp(row.png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    expect([info.width,info.height]).toEqual([192,64]);
    for(let y=0;y<64;y++) data.copy(joined,((Math.floor(i/2)*64+y)*384+i%2*192)*4,y*192*4,(y+1)*192*4);
  }
  expect(joined.equals(now)).toBe(true);
});

it('covers every existing VarCamp placement without changing any map, saved room, collision or layout',()=>{
  const receipt=read('tests/fixtures/event-identity/transitions.json');
  expect(Object.keys(receipt.unchanged)).toHaveLength(103);
  for(const [path,pin] of Object.entries(receipt.unchanged)) expect(sha(readFileSync(path)),path).toBe(arrivalSponsorSpaceSuccessorSha(path,pin as string));
  const paths=new Set<string>(),maps=new Set<string>();let placements=0;
  for(const name of readdirSync('world/layouts').filter(n=>n.endsWith('.json'))) {
    for(const image of read('world/layouts/'+name).images??[]) if(image.image.includes('/varcamp-')) {
      paths.add(image.image);maps.add(name);placements++;
    }
  }
  expect([...paths].sort()).toEqual(['varcamp-2026','varcamp-horizontal','varcamp-arrival-nw','varcamp-arrival-ne','varcamp-arrival-sw','varcamp-arrival-se'].map(n=>'assets/sponsors/'+n+'.png').sort());
  expect(placements).toBe(21);expect(maps.size).toBe(17);
});

it('renders R1 through R12 with the correct zodiac names on all entrance floor stamps',async()=>{
  const r=await renderHallBuildings(),glyphs=read('art/source/hub-nameplates.json').glyphs;
  const {data,info}=await sharp(r.names).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  expect([info.width,info.height]).toEqual([384,768]);
  expect(r.metadata.labels.map(l=>l.room+' '+l.zodiac)).toEqual(['R1 ARIES','R2 TAURUS','R3 GEMINI','R4 CANCER','R5 LEO','R6 VIRGO','R7 LIBRA','R8 SCORPIO','R9 SAGITTARIUS','R10 CAPRICORN','R11 AQUARIUS','R12 PISCES']);
  for(const [index,sign] of SIGN_IDS.entries()) {
    const text=`R${index+1} ${sign.toUpperCase()}`,left=Math.round(192-(text.length*6-1)*3/2);
    for(const [i,c] of [...text].entries()) for(let y=0;y<7;y++) for(let x=0;x<5;x++) {
      const offset=((index*64+7+y*3)*384+left+i*18+x*3)*4;
      expect(data[offset+3],`${text} glyph ${i}/${x}/${y}`).toBe(glyphs[c][y][x]==='1'?155:0);
    }
  }
  expect(readFileSync('assets/tilesets/original/zodiac-ground-names.png').equals(r.names)).toBe(true);
});
