import {beforeAll,expect,it} from 'vitest';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {renderHarbourPlane} from '../tools/art/harbour-plane';
import {shorePlaneMetadata} from '../tools/art/shore-plane';
import type {LayoutAnimatedOverlay} from '../tools/maps/types';

const WIDTH=3072,HEIGHT=96,ART_WIDTH=352,PERIOD=42800;
type Chunk={png:Buffer;overlay:LayoutAnimatedOverlay};
type Decoded={overlay:LayoutAnimatedOverlay;pixels:Buffer;atlasWidth:number;columns:number};
let harbour:Decoded[],shore:Decoded[],art:Buffer;

// Read carrier IDs and their actual native frame clocks, not the compiler's samples.
function frame(chunks:Decoded[],time:number){
 const output=Buffer.alloc(WIDTH*HEIGHT*4);
 for(const {overlay,pixels,atlasWidth,columns} of chunks){
  const clocks=new Map(overlay.animations.map(animation=>[animation.id,animation.frames]));
  for(const [cell,carrier] of overlay.carrierTileIds.entries()){
   const frames=clocks.get(carrier)!;
   let t=time%frames.reduce((sum,current)=>sum+current.duration,0),id=-1;
   for(const current of frames){if(t<current.duration){id=current.tileid;break;}t-=current.duration;}
   if(id<0)throw Error('Native clock has no frame');
   for(let row=0;row<32;row++){
    const source=((Math.floor(id/columns)*32+row)*atlasWidth+id%columns*32)*4;
    const target=((Math.floor(cell/overlay.width)*32+row)*WIDTH+overlay.x*32+(cell%overlay.width)*32)*4;
    pixels.copy(output,target,source,source+128);
   }
  }
 }
 return output;
}

function uncutReference(x:number){
 const output=Buffer.alloc(WIDTH*HEIGHT*4),left=Math.max(0,x),right=Math.min(WIDTH,x+ART_WIDTH);
 if(right>left)for(let y=0;y<HEIGHT;y++)art.copy(output,(y*WIDTH+left)*4,(y*ART_WIDTH+left-x)*4,(y*ART_WIDTH+right-x)*4);
 return output;
}

beforeAll(async()=>{
 const rendered=await renderHarbourPlane();
 const chunks=('chunks' in rendered?rendered.chunks:[rendered]) as Chunk[];
 harbour=await Promise.all(chunks.map(async chunk=>{
  const decoded=await sharp(chunk.png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  return {overlay:chunk.overlay,pixels:decoded.data,atlasWidth:decoded.info.width,columns:decoded.info.width/32};
 }));
 const metadata=shorePlaneMetadata();
 const overlays=(metadata.overlays) as LayoutAnimatedOverlay[];
 shore=overlays.map(overlay=>({...harbour.find(chunk=>chunk.overlay.image===overlay.image)!,overlay}));
 const initial=frame(harbour,0);
 art=Buffer.alloc(ART_WIDTH*HEIGHT*4);
 for(let y=0;y<HEIGHT;y++)initial.copy(art,y*ART_WIDTH*4,(y*WIDTH+160)*4,(y*WIDTH+512)*4);
 // Approved pre-fix uncut native composite; protects every original RGBA pixel.
 expect(createHash('sha256').update(art).digest('hex')).toBe('d0b905649a9ee0ed045ecbbbcc1f1bd147890eba7d3b559177ac925ddccaa474');
});

for(const location of ['harbour','shore'] as const){
 it(`keeps the untouched plane and flag continuous through every ${location} phase, midpoint and true outer edge`,()=>{
  const chunks=location==='harbour'?harbour:shore;
  for(let phase=0;phase<=428;phase++){
   // Hand-derived world route: initial left160, eight pixels every100ms,
   // with wrapping only after the complete3072px map plus352px artwork.
   const x=((160+phase*8+352)%3424)-352;
   expect(frame(chunks,phase*100).equals(uncutReference(x)),`${location}: phase${phase}, world x${x}; clip only at0/3072, never1536`).toBe(true);
  }
  expect(frame(chunks,PERIOD).equals(frame(chunks,0))).toBe(true);
 });

 it(`uses two bounded ${location} carriers with one full-route clock`,()=>{
  const chunks=location==='harbour'?harbour:shore,y=location==='harbour'?5:23;
  expect(chunks.map(chunk=>[chunk.overlay.name,chunk.overlay.x,chunk.overlay.y,chunk.overlay.width,chunk.overlay.height])).toEqual([
   ['coastal-flight',0,y,48,3],['coastal-flight-east',48,y,48,3]
  ]);
  for(const {overlay,pixels} of chunks){
   expect(overlay.level).toBe('aboveScenery');
   expect(overlay.carrierTileIds).toHaveLength(144);
   expect(pixels.length).toBeLessThanOrEqual(4*1024*1024);
   expect(new Set(overlay.animations.map(animation=>animation.frames.reduce((sum,current)=>sum+current.duration,0)))).toEqual(new Set([PERIOD]));
  }
 });
}
