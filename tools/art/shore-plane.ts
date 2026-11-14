import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type {LayoutAnimatedOverlay} from '../maps/types';

export const SHORE_PLANE_META='art/source/shore-plane.json';
/** Reuse the approved aircraft pixels and clocks above the open shoreline sand. */
export function shorePlaneMetadata(){
 const parentPath='art/source/harbour-plane.json';
 const parent=JSON.parse(readFileSync(parentPath,'utf8'));
 const inputs=[...parent.inputs,...[parentPath,'tools/art/shore-plane.ts'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}))];
 const overlay:LayoutAnimatedOverlay={...structuredClone(parent.overlay),y:23,
  provenance:{...parent.overlay.provenance,metadataPath:SHORE_PLANE_META,inputs}};
 return {version:1,description:'Approved DigiSec Lab flag aircraft above the Constellation Shore open shoreline sand; shared original pixels and clocks.',inputs,overlay};
}
export function writeShorePlane(){const meta=shorePlaneMetadata();writeFileSync(SHORE_PLANE_META,JSON.stringify(meta,null,2)+'\n');return meta.overlay;}
