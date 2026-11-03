import {restoreStageSideAccess} from '../tools/maps/stage-side-access';
import {restoreSpeakerOfficeWings} from '../tools/maps/speaker-office-wings';
import{readFileSync}from'node:fs';import{isDeepStrictEqual}from'node:util';import{describe,it,expect}from'vitest';import data from'../world/auditorium-spacing.json';import{applyAuditoriumSpacing,restoreAuditoriumSpacing,auditoriumFunctional}from'../tools/maps/auditorium-spacing';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
describe('Twelve enlarged auditoriums',()=>{
 for(const[id,row]of Object.entries(data.maps))it(id+': exact reversible scope, saved zones and physical stage access',()=>{
 const l=read(`world/layouts/${id}.json`),auditorium=restoreSpeakerOfficeWings(l),prior=restoreStageSideAccess(auditorium),before=restoreAuditoriumSpacing(prior);
 expect(isDeepStrictEqual(applyAuditoriumSpacing(before),prior)).toBe(true);
 expect(isDeepStrictEqual(auditoriumFunctional(id,row.beforeFunctional as Parameters<typeof auditoriumFunctional>[1]),row.afterFunctional)).toBe(true);
 if(id.endsWith('-hall')){expect(Object.keys(row.fields)).toEqual(['animatedOverlays']);return;}
 expect(l.height).toBe(before.height+10);expect(l.images).toEqual(before.images);
 const wam=read(`maps/${id}.wam`);for(const a of auditorium.areas){const actual=wam.areas.find((v:any)=>v.id===a.id);expect(actual.properties).toEqual(before.areas.find((v:any)=>v.id===a.id)!.properties);for(const k of ['x','y','width','height'] as const)expect(actual[k]).toBe(a[k]*32);}
 const map=read(`maps/${id}.tmj`),mask=map.layers.find((l:any)=>l.name==='physical-collisions').data,c=auditorium.width/2;const free=(x:number,y:number)=>mask[y*l.width+x]===0;
 for(let y=14;y<16;y++)for(let x=2;x<auditorium.width-2;x++)expect(free(x,y)).toBe(true);
 for(let x=4;x<auditorium.width-4;x++)expect(free(x,12)).toBe(false);
 const start=l.entries[0].y*l.width+l.entries[0].x,seen=new Set([start]),queue=[start];for(let h=0;h<queue.length;h++){const i=queue[h],x=i%l.width,y=Math.floor(i/l.width);for(const[nx,ny]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const n=ny*l.width+nx;if(nx>=0&&nx<l.width&&ny>=0&&ny<l.height&&free(nx,ny)&&!seen.has(n)){seen.add(n);queue.push(n);}}}
 expect(seen.has(10*l.width+c-2)).toBe(true);
 for(const y of[20,21,24,25,28,29,32])for(let x=3;x<auditorium.width-3;x++)expect(seen.has(y*l.width+x)).toBe(true);
 const chairs=l.placements.filter((p:any)=>p.id.startsWith('audience-chair-'));expect(chairs).toHaveLength(48);expect([...new Set(chairs.map((p:any)=>p.y))]).toEqual([18,22,26,30]);
 });
});
