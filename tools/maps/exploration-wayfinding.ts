import type {MapLayout,Exit} from './types';

export function explorationExitLabelName(layout:Pick<MapLayout,'id'>,exit:Pick<Exit,'name'>):string {
 if(exit.name==='branch-return')return 'branch-return-label';
 if(exit.name==='plaza-return')return layout.id==='campus-exploration'?'plaza-label':'plaza-return-label';
 if(exit.name==='trail-west')return 'west-trail-label';
 if(exit.name==='trail-east')return 'east-trail-label';
 return exit.name+'-label';
}

/** Added after planting so clearer signs cannot reshuffle the forest or physics.
 * Arrows sit on the actual transition and the last tile of its approach. */
export function markExplorationExits(layout:MapLayout):void {
 for(const exit of layout.exits){
  const sign=layout.signs?.find(s=>s.name===explorationExitLabelName(layout,exit));
  if(!sign)throw Error(`${layout.id}: missing exit caption for ${exit.name}`);
  const destination=exit.destination==='overworld'?'ZODIAC PLAZA':exit.destination==='campus-exploration'?'EXPLORATION':exit.destination.replace(/-district$/,'').replaceAll('-',' ').toUpperCase();
  // This hub caption has eight tiles; 18px Arial would wrap its final word.
  const fontSize=layout.id==='campus-exploration'&&exit.name==='stargazer-terrace'?17:18;
  Object.assign(sign,{text:'EXIT: '+destination,fontSize,color:'#fff1c4',padding:6});
  for(const [part,sprite]of [['face','sign-board-face'],['top','sign-board-north'],['bottom','sign-board-south']]){
   layout.placements.push({id:`exit-guide-${exit.name}-${part}`,sprite,layer:'props',x:sign.x,y:sign.y,width:sign.width,height:1});
  }
  const direction=exit.name==='trail-west'?'west':exit.name==='trail-east'?'east':exit.name.endsWith('return')?'south':'north';
  const x=exit.x+Math.floor(exit.width/2),y=exit.y+Math.floor(exit.height/2);
  const dx=direction==='west'?1:direction==='east'?-1:0,dy=direction==='north'?1:direction==='south'?-1:0;
  for(const [part,px,py]of [['trigger',x,y],['approach',x+dx,y+dy]] as const){
   layout.placements.push({id:`exit-guide-${exit.name}-${part}`,sprite:'arrow-'+direction,layer:'props',x:px,y:py,width:1,height:1});
  }
 }
}
