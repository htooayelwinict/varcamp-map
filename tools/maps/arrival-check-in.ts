import {createHash} from 'node:crypto';
import data from '../../world/arrival-check-in-expansion.json';
import type {MapLayout,Placement} from './types';

const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const isExpandedArrivalCheckIn=(layout:MapLayout)=>layout.id===data.mapId&&sha(layout)===data.afterLayoutSha256;

/** Exact reception-only successor; other map controls and historical recipes stay intact. */
function transform(input:MapLayout,forward:boolean):MapLayout{
 if(input.id!==data.mapId)return input;
 const before=forward?data.beforeLayoutSha256:data.afterLayoutSha256;
 const after=forward?data.afterLayoutSha256:data.beforeLayoutSha256;
 if(data.version!==1||sha(input)!==before)throw Error('Arrival check-in: unreviewed source layout');
 const layout=structuredClone(input);
 for(const row of data.changes)layout.placements[row.index]=structuredClone(forward?row.after:row.before) as Placement;
 if(forward)layout.placements.push(...structuredClone(data.added) as Placement[]);
 else layout.placements.splice(-data.added.length);
 if(sha(layout)!==after)throw Error('Arrival check-in: unexpected source delta');
 return layout;
}
export const applyArrivalCheckIn=(layout:MapLayout)=>transform(layout,true);
export const restoreArrivalCheckIn=(layout:MapLayout)=>transform(layout,false);
