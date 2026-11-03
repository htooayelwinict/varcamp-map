import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
export const ARCADE_SCREEN='assets/tilesets/original/arcade-screen.png';
/** Native pixel extraction, without scaling or repainting. A dedicated small
 * sheet keeps the existing bounded alpha proof independent of magic.png. */
export async function renderArcadeScreen():Promise<Buffer>{
 const s=JSON.parse(readFileSync('art/tile-catalog.json','utf8'))['screen-presentation'];
 return sharp(s.sheet).extract({left:s.rect.x*32,top:s.rect.y*32,width:s.rect.width*32,height:s.rect.height*32}).ensureAlpha().png().toBuffer();
}
export async function checkArcadeScreenArt():Promise<void>{
 if(!readFileSync(ARCADE_SCREEN).equals(await renderArcadeScreen()))throw Error('Arcade screen differs from original native pixels');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)writeFileSync(ARCADE_SCREEN,await renderArcadeScreen());
