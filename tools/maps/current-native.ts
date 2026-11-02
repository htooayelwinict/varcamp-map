import {assertDeclaredMapIdentity} from './current-package';
import {assertNativeReferenceInterior} from './reference-interiors';
import {assertNativeStandingCaptions} from './standing-captions';
import {assertNativeOceanMap,readShipFloorLabels} from './beach-ship';
import {assertNativeOrganicCoast} from './organic-coast';
import {assertNativeCoastLife} from './coast-life';
import {assertTropicalCove} from './tropical-cove';
import {assertNativePlaza} from './plaza-native';
import {assertNativeWorldAmbient} from './world-ambient';
import{assertNativeAnimationSafety}from'./animated-decoration';
import {isNaturalCoastId,assertNaturalCoast} from './natural-coast';
import type {TileCatalog} from '../art/catalog';
import type {TiledMap,MapLayout,WamFile} from './types';
/** Build and release share the same unconditional current-source boundary.
 * Filename identity always precedes all domain dispatch. */
export function assertCurrentNativeMap(id:string,map:TiledMap,layout:MapLayout,wam:WamFile,catalog:TileCatalog):void{
 assertDeclaredMapIdentity(id,map,layout,wam);
 if(isNaturalCoastId(id)){
  assertNaturalCoast(map,layout,wam,catalog);
  return;
 }
 assertNativeReferenceInterior(map,layout,catalog,wam);
 assertNativeStandingCaptions(map,layout);
 assertNativeOceanMap(map,layout);
 assertNativeOrganicCoast(map,layout);
 assertNativeCoastLife(map,layout,catalog);
 assertTropicalCove(map,layout,catalog);
 assertNativePlaza(map,layout,catalog);
 assertNativeWorldAmbient(map,layout,catalog);
 readShipFloorLabels(map,layout,catalog);
 assertNativeAnimationSafety(map,layout,catalog);
}
