import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type {LayoutAnimatedOverlay} from '../maps/types';

export const SHORE_PLANE_META='art/source/shore-plane.json';
export const SHORE_PLANE_EAST_META='art/source/shore-plane-east.json';
/** Reuse the approved aircraft pixels and clocks above the open shoreline sand. */
export function shorePlaneMetadata(){
 const chunks=[
  {parentPath:'art/source/harbour-plane.json',metadataPath:SHORE_PLANE_META},
  {parentPath:'art/source/harbour-plane-east.json',metadataPath:SHORE_PLANE_EAST_META}
 ].map(({parentPath,metadataPath})=>{
  const parent=JSON.parse(readFileSync(parentPath,'utf8'));
  const inputs=[...parent.inputs,...[parentPath,'tools/art/shore-plane.ts'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}))];
  const overlay:LayoutAnimatedOverlay={...structuredClone(parent.overlay),y:23,
   provenance:{...parent.overlay.provenance,metadataPath,inputs}};
  return {version:2,description:'Approved DigiSec Lab flag aircraft above the Constellation Shore open shoreline sand; shared original pixels and synchronized full-width clocks.',inputs,overlay};
 });
 return {...chunks[0],overlays:chunks.map(chunk=>chunk.overlay),chunks};
}
export function writeShorePlane(){const meta=shorePlaneMetadata();for(const chunk of meta.chunks)writeFileSync(chunk.overlay.provenance!.metadataPath,JSON.stringify(chunk,null,2)+'\n');return meta.overlay;}
