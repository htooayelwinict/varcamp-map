import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import recipe from '../../world/stage-side-access.json';
import {SIGN_IDS} from '../../src/world/catalog';
import type {MapLayout} from './types';
const sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
type Row={beforeSha256:string;afterSha256:string;placements:{before:MapLayout['placements'];after:MapLayout['placements']};signs:{before:MapLayout['signs'];after:MapLayout['signs']}};
const rows=recipe.maps as unknown as Record<string,Row>;
export const isStageSideAccess=(l:MapLayout)=>rows[l.id]?.afterSha256===sha(l);
/** Layout-only successor. Saved speaker/listener zones, seat counts, room
 * dimensions, animation anchors and portals remain byte-for-byte unchanged. */
function transformStageSideAccess(l:MapLayout,forward:boolean):MapLayout{
 const r=rows[l.id];if(!r)return l;
 if(recipe.version!==1||!isDeepStrictEqual(Object.keys(rows).sort(),[...SIGN_IDS.map(s=>'speaker-'+s),'solar-hall','lunar-hall'].sort()))throw Error('Stage access roster changed');
 if(sha(l)!==(forward?r.beforeSha256:r.afterSha256))throw Error('Stage side access: unreviewed room '+l.id);
 const source=forward?'before':'after',target=forward?'after':'before';
 const next={...structuredClone(l),placements:structuredClone(r.placements[target]),signs:structuredClone(r.signs[target])};
 if(sha(next)!==(forward?r.afterSha256:r.beforeSha256)||!isDeepStrictEqual(l.placements,r.placements[source])||!isDeepStrictEqual(l.signs,r.signs[source]))throw Error('Stage side access predecessor changed');
 return next;
}
export const applyStageSideAccess=(l:MapLayout)=>transformStageSideAccess(l,true);
export const restoreStageSideAccess=(l:MapLayout)=>transformStageSideAccess(l,false);
