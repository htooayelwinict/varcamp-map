import {createHash} from 'node:crypto';
import data from '../../world/sponsor-logos.json';
import type {MapLayout,LayoutImage,Placement} from './types';
import {applyExpoRoster,restoreExpoRoster,isExpoRoster} from './expo-roster';

const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const isSponsorLogos=(layout:MapLayout)=>isExpoRoster(layout)||(layout.id===data.mapId&&sha(layout)===data.afterLayoutSha256);

/** Add only the supplied tier logos and move the small Spark table clear of its mark. */
function transform(input:MapLayout,forward:boolean):MapLayout{
 if(input.id!==data.mapId)return input;
 if(data.version!==1||sha(input)!==(forward?data.beforeLayoutSha256:data.afterLayoutSha256))throw Error('Sponsor logos: unreviewed source layout');
 const layout=structuredClone(input);
 for(const row of data.changes)layout.placements[row.index]=structuredClone(forward?row.after:row.before) as Placement;
 if(forward)layout.images!.push(...structuredClone(data.added) as LayoutImage[]);
 else layout.images!.splice(-data.added.length);
 if(sha(layout)!==(forward?data.afterLayoutSha256:data.beforeLayoutSha256))throw Error('Sponsor logos: unexpected source delta');
 return layout;
}
export const applySponsorLogos=(layout:MapLayout)=>applyExpoRoster(transform(layout,true));
export const restoreSponsorLogos=(layout:MapLayout)=>transform(isExpoRoster(layout)?restoreExpoRoster(layout):layout,false);
