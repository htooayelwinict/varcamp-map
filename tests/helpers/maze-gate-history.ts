import {beforeMazeInteriorLayout,beforeMazeInteriorMap,mazeInteriorSuccessorSha} from './maze-interiors-history';
import {beforeExpoChairCatalog} from '../../tools/maps/expo-chair-physics';
import {expoChairSuccessorSha} from './expo-chair-history';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import refresh from '../../art/source/maze-gate-refresh.json';
const raw=readFileSync('tests/fixtures/maze-gates/before.json.gz');
assert.equal(createHash('sha256').update(raw).digest('hex'),'21c78da230741c5b61082f51c321e37688255ccbb24aaf9ea9733dded4f738e5');
const snapshot=JSON.parse(gunzipSync(raw).toString()),before=snapshot.components;
assert.equal(snapshot.base,'71405c9a9c4fbd780b5f94c174dd06144b4c0b2a');
export function mazeGateSuccessorSha(path:string,pin:string):string{const t=JSON.parse(readFileSync('tests/fixtures/maze-gates/transitions.json','utf8'));assert.equal(t.base,snapshot.base);const pair=t.transitions[path];if(!pair||pair[0]!==pin)return mazeInteriorSuccessorSha(path,expoChairSuccessorSha(path,pin));assert.equal(pair[0],snapshot.pins[path]);return mazeInteriorSuccessorSha(path,expoChairSuccessorSha(path,pair[1]));}
/** Historical ambient assertions retain their original baseline. Only this
 * exact reviewed successor may be undone; current mutation tests check it too. */
export function beforeMazeGateLayout(input:any):any{
 input=beforeMazeInteriorLayout(input);
 const row=(refresh.maps as any)[input.id];if(!row)return input;
 const layout=structuredClone(input);delete layout.animatedOverlays;
 assert.deepEqual(layout,row.layoutAfter);
 const prior=JSON.parse(before[`world/layouts/${input.id}.json`]);
 assert.deepEqual((({animatedOverlays,...rest})=>rest)(prior),row.layoutBefore);
 prior.animatedOverlays=input.animatedOverlays;
 return prior;
}
export function beforeMazeGateMap(input:any):any{
 input=beforeMazeInteriorMap(input);
 const id=input.properties.find((p:any)=>p.name==='worldMapId').value,row=(refresh.maps as any)[id];if(!row)return input;
 const prior=JSON.parse(before[`maps/${id}.tmj`]),map=structuredClone(input);
 for(const change of row.layers){
  const at=map.layers.findIndex((l:any)=>l.name===change.after.name);assert.ok(at>=0);assert.deepEqual(map.layers[at],change.after);
  const old=prior.layers.find((l:any)=>l.name===change.after.name);
  if(change.beforeSha256===null){assert.equal(old,undefined);map.layers.splice(at,1);}
  else{assert.equal(createHash('sha256').update(JSON.stringify(old)).digest('hex'),change.beforeSha256);map.layers[at]=old;}
 }
 return map;
}
export function advanceMazeGateLayout(input:any):any{
 let layout=structuredClone(input);const row=(refresh.maps as any)[layout.id];
 if(row){const old=structuredClone(layout);delete old.animatedOverlays;assert.deepEqual(old,row.layoutBefore);layout={...structuredClone(row.layoutAfter),animatedOverlays:layout.animatedOverlays};}
 for(const o of layout.animatedOverlays??[]){
  if(!o.name.startsWith('world-ambient-'))continue;
  const inputs=o.provenance.inputs,at=inputs.findIndex((p:any)=>p.path==='art/source/cafe-arrival-refresh.json');assert.ok(at>=0);
  for(const p of ['tools/maps/maze-gate-context.ts','art/source/maze-gate-refresh.json'])assert.ok(!inputs.some((v:any)=>v.path===p));
  inputs.splice(at+1,0,...['tools/maps/maze-gate-context.ts','art/source/maze-gate-refresh.json'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})));
 }
 return layout;
}

/** Undo only the eight exact additive crops for historical catalog assertions. */
export function beforeMazeGateCatalog(input:any):any{
 const catalog=structuredClone(beforeExpoChairCatalog(input));
 const additions={
  "maze-solid": {
    "sheet": "assets/tilesets/original/magic.png",
    "rect": {
      "x": 14,
      "y": 0,
      "width": 1,
      "height": 1
    },
    "blockingCells": [
      [
        0,
        0
      ]
    ],
    "level": "belowAvatar",
    "sourceId": "original"
  },
  "maze-wall-rim": {
    "sheet": "assets/tilesets/original/magic.png",
    "rect": {
      "x": 0,
      "y": 1,
      "width": 1,
      "height": 1
    },
    "blockingCells": [],
    "level": "belowAvatar",
    "sourceId": "original"
  },
  "gate-post-west": {
    "sheet": "assets/tilesets/original/magic.png",
    "rect": {
      "x": 1,
      "y": 0,
      "width": 1,
      "height": 2
    },
    "blockingCells": [
      [
        0,
        1
      ]
    ],
    "level": "aboveAvatar",
    "sourceId": "original"
  },
  "gate-post-east": {
    "sheet": "assets/tilesets/original/magic.png",
    "rect": {
      "x": 4,
      "y": 0,
      "width": 1,
      "height": 2
    },
    "blockingCells": [
      [
        0,
        1
      ]
    ],
    "level": "aboveAvatar",
    "sourceId": "original"
  },
  "gate-beam": {
    "sheet": "assets/tilesets/original/magic.png",
    "rect": {
      "x": 2,
      "y": 0,
      "width": 1,
      "height": 1
    },
    "blockingCells": [],
    "level": "aboveAvatar",
    "sourceId": "original"
  },
  "gate-window-left": {
    "sheet": "assets/tilesets/original/magic.png",
    "rect": {
      "x": 9,
      "y": 0,
      "width": 1,
      "height": 2
    },
    "blockingCells": [
      [
        0,
        1
      ]
    ],
    "level": "aboveAvatar",
    "sourceId": "original"
  },
  "gate-window-right": {
    "sheet": "assets/tilesets/original/magic.png",
    "rect": {
      "x": 11,
      "y": 0,
      "width": 1,
      "height": 2
    },
    "blockingCells": [
      [
        0,
        1
      ]
    ],
    "level": "aboveAvatar",
    "sourceId": "original"
  },
  "gate-header-face": {
    "sheet": "assets/tilesets/original/wayfinding.png",
    "rect": {
      "x": 0,
      "y": 0,
      "width": 1,
      "height": 1
    },
    "blockingCells": [],
    "level": "belowAvatar",
    "sourceId": "original"
  }
};
 for(const [name,cell] of Object.entries(additions)){assert.deepEqual(catalog[name],cell);delete catalog[name];}
 assert.equal(createHash("sha256").update(JSON.stringify(catalog,null,2)+"\n").digest("hex"),snapshot.pins["art/tile-catalog.json"]);return catalog;
}
