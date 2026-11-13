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

async function entrancePlaque(logo,mark,width,height){
 if(logo.presentation.kind!=='entrance-plaque'||logo.width!==192||logo.height!==64||width>56||height>50)throw Error('Invalid entrance plaque geometry');
 const bytes=await readFile(join(root,'art/source/hub-nameplates.json'));
 if(createHash('sha256').update(bytes).digest('hex')!==logo.presentation.glyphSha256)throw Error('Entrance lettering source changed');
 const {glyphs}=JSON.parse(bytes),lines=logo.presentation.lines;
 if(JSON.stringify(lines)!==JSON.stringify(['DIGITAL SAFETY','PARTNER']))throw Error('Unapproved entrance sponsor title');
 const shapes=['<rect x="6" y="58" width="180" height="2" fill="#0c1d30" opacity=".3"/>','<rect x="6" y="6" width="180" height="52" fill="#a48b5c"/>','<rect x="7" y="7" width="178" height="50" fill="#132536"/>'];
 for(const [line,text]of lines.entries()){
  let x=82;
  for(const char of text){
   if(char===' '){x+=3;continue;}
   const glyph=glyphs[char];if(!glyph)throw Error('Missing entrance glyph '+char);
   glyph.forEach((row,y)=>[...row].forEach((bit,dx)=>{if(bit==='1')shapes.push(`<rect x="${x+dx}" y="${22+line*13+y}" width="1" height="1" fill="#e1cb9d"/>`);}));
   x+=6;
  }
 }
 const frame=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="64">${shapes.join('')}</svg>`);
 return sharp(frame).composite([{input:mark,left:14,top:Math.floor((64-height)/2)}]).png().toBuffer();
}

await mkdir(output,{recursive:true});
for(const logo of recipe.logos){
 const bytes=await readFile(join(input,logo.source));
 if(createHash('sha256').update(bytes).digest('hex')!==logo.sourceSha256)throw Error('Sponsor original changed: '+logo.source);
 const mark=await sharp(bytes).extract(logo.crop).resize(logo.contentWidth,logo.contentHeight,{fit:'inside',kernel:'lanczos3'}).png().toBuffer();
 const {width,height}=await sharp(mark).metadata();
 const canvas=logo.presentation?await entrancePlaque(logo,mark,width,height):await sharp({create:{width:logo.width,height:logo.height,channels:4,background:logo.background??{r:0,g:0,b:0,alpha:0}}})
  .composite([{input:mark,left:Math.floor((logo.width-width)/2),top:Math.floor((logo.height-height)/2)}]).png().toBuffer();
 for(const panel of logo.panels)await sharp(canvas).extract({left:0,top:panel.top,width:logo.width,height:64}).png().toFile(join(output,panel.file));
}
console.log('Exported official Main, Spark and Mini sponsor logos.');
