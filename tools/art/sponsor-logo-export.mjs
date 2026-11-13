import sharp from 'sharp';
import {readFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const args=process.argv.slice(2);
if(args.length&&(args.length!==2||args[0]!=='--out'||!args[1]))throw Error('Usage: node tools/art/sponsor-logo-export.mjs [--out <directory>]');
const output=args.length?resolve(args[1]):join(root,'assets/sponsors');
const input=join(root,'art/source/sponsors/tier-logos');
const recipe=JSON.parse(await readFile(join(input,'exports.json'),'utf8'));
await mkdir(output,{recursive:true});
for(const logo of recipe.logos){
 const bytes=await readFile(join(input,logo.source));
 if(createHash('sha256').update(bytes).digest('hex')!==logo.sourceSha256)throw Error('Sponsor original changed: '+logo.source);
 const mark=await sharp(bytes).extract(logo.crop).resize(logo.contentWidth,logo.contentHeight,{fit:'inside',kernel:'lanczos3'}).png().toBuffer();
 const {width,height}=await sharp(mark).metadata();
 const canvas=await sharp({create:{width:logo.width,height:logo.height,channels:4,background:logo.background??{r:0,g:0,b:0,alpha:0}}})
  .composite([{input:mark,left:Math.floor((logo.width-width)/2),top:Math.floor((logo.height-height)/2)}]).png().toBuffer();
 for(const panel of logo.panels)await sharp(canvas).extract({left:0,top:panel.top,width:logo.width,height:64}).png().toFile(join(output,panel.file));
}
console.log('Exported official Main, Spark and Mini sponsor logos.');
