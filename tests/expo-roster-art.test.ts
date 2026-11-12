import {existsSync,readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe,it,expect} from 'vitest';
import sharp from 'sharp';

const sha=(v:Buffer)=>createHash('sha256').update(v).digest('hex');
describe('supplied media artwork and readable Myanmar title',()=>{
 it('publishes transparent native panels with the corrected name from a bundled Myanmar font',async()=>{
  for(const [file,width]of [['partner-duwun',192],['partner-open-taxi',192],['expo-lokal-name',192]] as const){
   const path=`assets/sponsors/${file}.png`;expect(existsSync(path),path).toBe(true);
   expect(await sharp(path).metadata()).toMatchObject({width,height:64,hasAlpha:true});
   const {data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   for(const [x,y]of [[0,0],[width-1,0],[0,63],[width-1,63]])expect(data[(y*info.width+x)*4+3],file+' background card').toBe(0);
  }
  const recipe=JSON.parse(readFileSync('art/source/sponsors/media/exports.json','utf8'));
  expect(recipe.caption.lines.map((r:{text:string})=>r.text)).toEqual(['Mini Sponsor','Lokal Zaytann','ဒေသစျေးတန်း']);
  expect(sha(readFileSync('art/source/sponsors/media/NotoSansMyanmar-Regular.ttf'))).toBe('9dd2bc76a822a974efce803a4b07302d14d01d5c1fa9e33a258d15a9cb513a7d');
 });
 it('reproduces all three panels without modifying the organizer originals',()=>{
  expect(existsSync('tools/art/media-partner-export.mjs')).toBe(true);
  const dir=mkdtempSync(join(tmpdir(),'varcamp-media-'));
  try{
   execFileSync(process.execPath,['tools/art/media-partner-export.mjs','--out',dir],{stdio:'pipe',timeout:30000});
   for(const file of ['partner-duwun','partner-open-taxi','expo-lokal-name'])expect(readFileSync(join(dir,file+'.png')).equals(readFileSync(`assets/sponsors/${file}.png`))).toBe(true);
   const recipe=JSON.parse(readFileSync('art/source/sponsors/media/exports.json','utf8'));
   for(const logo of recipe.logos)expect(sha(readFileSync('art/source/sponsors/media/'+logo.source))).toBe(logo.sourceSha256);
  }finally{rmSync(dir,{recursive:true,force:true});}
 });
});
