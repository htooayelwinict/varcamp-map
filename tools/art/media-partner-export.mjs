import sharp from 'sharp';
import {readFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url)),args=process.argv.slice(2);
if(args.length&&(args.length!==2||args[0]!=='--out'||!args[1]))throw Error('Usage: node tools/art/media-partner-export.mjs [--out <directory>]');
const input=join(root,'art/source/sponsors/media'),output=args.length?resolve(args[1]):join(root,'assets/sponsors');
const recipe=JSON.parse(await readFile(join(input,'exports.json'),'utf8'));
const verify=async(file,hash)=>{const b=await readFile(join(input,file));if(createHash('sha256').update(b).digest('hex')!==hash)throw Error('Media original changed: '+file);return b;};
const blank=(width,height)=>sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}});
await mkdir(output,{recursive:true});
for(const logo of recipe.logos){
 const mark=await sharp(await verify(logo.source,logo.sourceSha256)).extract(logo.crop).resize(logo.contentWidth,logo.contentHeight,{fit:'inside',kernel:'lanczos3'}).png().toBuffer();
 const {width,height}=await sharp(mark).metadata();
 await blank(logo.width,logo.height).composite([{input:mark,left:Math.floor((logo.width-width)/2),top:Math.floor((logo.height-height)/2)}]).png().toFile(join(output,logo.file));
}
const c=recipe.caption;await verify(c.font,c.fontSha256);
const lines=[];
for(const line of c.lines){
 const raster=await sharp({text:{text:`<span foreground="#f1d9a0">${line.text}</span>`,font:`Noto Sans Myanmar ${line.size}`,fontfile:join(input,c.font),rgba:true,dpi:72}}).png().toBuffer();
 const text=await sharp(raster).trim({background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
 const {width,height}=await sharp(text).metadata();
 if(width>c.width-8||line.y+height>c.height-2)throw Error('Caption exceeds its native panel: '+line.text);
 lines.push({input:text,left:Math.floor((c.width-width)/2),top:line.y});
}
await blank(c.width,c.height).composite(lines).png().toFile(join(output,c.file));
console.log('Exported supplied media logos and the pinned Myanmar sponsor caption.');
