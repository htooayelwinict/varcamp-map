"""Register unchanged licensed PNGs and native 32px sprite selections."""
import json,hashlib
from pathlib import Path
root=Path('assets/tilesets/lpc-exploration'); c=json.load(open('art/tile-catalog.json')); sprites={}
def sprite(name,sheet,x,y,w=1,h=1,blocking=(),upper=False,source=None):
 r={'sheet':sheet,'rect':dict(x=x,y=y,width=w,height=h),'blockingCells':list(blocking),'level':'belowAvatar','sourceId':source or 'lpc-exploration'}
 if upper:r['upperCells']=[[a,b] for b in range(h-1) for a in range(w)]
 sprites['exp-'+name]=r
T='assets/tilesets/lpc-garden/terrain.png'; P='assets/tilesets/lpc-garden/plants.png'
for name,x,y in [('grass',10,9),('dark-grass',7,9),('dirt',1,3),('dark-dirt',7,3),('sand',1,15),('stone',13,15)]:sprite(name,T,x,y,source='lpc-garden-terrain')
for prefix,x,y in [('path',0,2),('water',18,2),('clearing',0,8),('shadow-grass',6,8)]:
 for dy in range(3):
  for dx in range(3):sprite(prefix+f'-{dx}-{dy}',T,x+dx,y+dy,blocking=[[0,0]] if prefix=='water' else [],source='lpc-garden-terrain')
for dy in range(3):
 for dx in range(3):sprite(f'cave-rim-{dx}-{dy}',T,9+dx,2+dy,blocking=[[0,0]],source='lpc-garden-terrain')
sprite('boundary',P,13,13,blocking=[[0,0]],source='lpc-garden-plants')
for name,x,y,w,h,block,upper in [('mushrooms',0,18,2,1,[],False),('toadstools',0,22,2,1,[],False),('stump',0,24,2,2,[[0,1],[1,1]],False),('fallen-log',0,27,3,2,[[0,1],[1,1],[2,1]],False),('dead-tree',13,22,3,2,[[1,1]],True),('berry',14,24,1,1,[],False),('lilies',0,16,2,2,[],False),('fern',10,10,1,1,[],False)]:sprite(name,P,x,y,w,h,block,upper,'lpc-garden-plants')
for name,x,y,w,h,block,upper in [('cave-floor',0,0,1,1,[],False),('cave-wall',13,0,1,3,[[0,0],[0,1],[0,2]],False),('crystal-small',9,10,1,1,[[0,0]],False),('crystal-tall',10,10,1,2,[[0,1]],True),('obelisk',18,7,1,2,[[0,1]],True),('statue',17,7,1,2,[[0,1]],True),('stone-circle',6,12,3,2,[],False),('arch',9,12,5,2,[],True),('tablet',20,13,3,2,[[0,1],[1,1],[2,1]],True),('ruin',19,7,4,3,[[a,b] for b in range(3) for a in range(4)],False)]:sprite(name,str(root/'cavern.png'),x,y,w,h,block,upper)
for dy in range(3):
 for dx in range(3):sprite(f'moon-water-{dx}-{dy}',str(root/'cavern.png'),dx,5+dy,blocking=[[0,0]])
sprite('arch-foot',str(root/'cavern.png'),9,14,blocking=[[0,0]])
sprite('arch-foot-right',str(root/'cavern.png'),13,14,blocking=[[0,0]])
sprite('rock',str(root/'cavern.png'),12,9,blocking=[[0,0]])
sprite('market-front',str(root/'farming_fishing.png'),5,7,3,1,[[0,0],[1,0],[2,0]])
sprite('grass-tuft',P,2,10,source='lpc-garden-plants')
sprite('ghost',str(root/'ghost.png'),0,0,source='exploration-ghost')
sprite('wall',str(root/'cottage.png'),0,0,3,3,[[a,b] for a in range(3) for b in range(3)])
sprite('wall-open',str(root/'cottage.png'),9,0,3,3,[[a,b] for a in range(3) for b in range(3)])
sprite('roof',str(root/'thatched-roof.png'),2,0,5,4,[[a,b] for a in range(1,4) for b in range(1,4)],True)
sprite('stair',str(root/'cottage.png'),0,15,3,1)
sprite('fence',str(root/'fence.png'),0,0,3,1,[[0,0],[1,0],[2,0]])
sprite('fence-post',str(root/'fence.png'),0,1,1,1,[[0,0]])
sprite('soil',str(root/'plowed_soil.png'),1,3)
sprite('crop-tomato',str(root/'plants.png'),4,7,1,2)
sprite('crop-corn',str(root/'plants.png'),6,7,1,2)
sprite('crop-herb',str(root/'plants.png'),2,5,1,1)
sprite('market',str(root/'farming_fishing.png'),5,3,3,3,[[0,2],[2,2]],True)
sprite('counter',str(root/'farming_fishing.png'),14,0,3,3,[[a,b] for a in range(3) for b in range(3)])
sprite('small-table',str(root/'farming_fishing.png'),14,3,3,3,[[a,b] for a in range(3) for b in range(1,3)])
sprite('produce',str(root/'farming_fishing.png'),8,10,7,1,[[a,0] for a in range(7)])
sprite('campfire',str(root/'farming_fishing.png'),0,0,1,2,[[0,1]])
sprite('sacks',str(root/'farming_fishing.png'),0,2,2,2,[[0,1],[1,1]])
c.update(sprites);Path('art/exploration-sprites.json').write_text(json.dumps(sprites,indent=2)+'\n');Path('art/tile-catalog.json').write_text(json.dumps(c,indent=2)+'\n')
s=json.load(open('art/sources.json'));sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
s['lpc-exploration']={'attribution':'Cottage: bluecarrot16, Sharm, HughSpectrum, Casper Nilsson. Farm: Daniel Eddeland. Cavern: Tuomo Untinen and all artists in CREDITS-cavern.txt.','url':'https://opengameart.org/content/lpc-cavern-and-ruin-tiles','license':'CC-BY-SA 3.0','licenseFile':str(root/'LICENSE-CC-BY-SA-3.0.txt'),'changes':'None. Upstream PNGs retained byte-for-byte. Native 32px tile selections only.','files':[{'path':str(p),'sha256':sha(p)} for p in sorted(root.glob('*.png')) if p.name!='ghost.png']}
s['exploration-ghost']={'attribution':'Ghost monster by ImogiaGames, remixed from Ghost and Skeleton by Balmer','url':'https://opengameart.org/content/ghost-monster','license':'CC0 1.0','licenseFile':str(root/'LICENSE-ghost.txt'),'changes':'None. Original six-frame 32px PNG retained.','files':[{'path':str(root/'ghost.png'),'sha256':sha(root/'ghost.png')}]}
Path('art/sources.json').write_text(json.dumps(s,indent=2)+'\n')
(root/'ATTRIBUTION.md').write_text('# Enchanted Exploration artwork\n\nAll PNGs are unchanged upstream files; see the adjacent credits and licenses.\n\n- [Cottage — bluecarrot16](https://lpc.opengameart.org/content/lpc-thatched-roof-cottage), CC-BY-SA 3.0.\n- [Farm — Daniel Eddeland](https://lpc.opengameart.org/content/lpc-farming-tilesets-magic-animations-and-ui-elements), CC-BY-SA 3.0.\n- [Cavern — Reemax and credited collaborators](https://opengameart.org/content/lpc-cavern-and-ruin-tiles), CC-BY-SA 3.0.\n- [Ghost — ImogiaGames / Balmer](https://opengameart.org/content/ghost-monster), CC0 1.0.\n\nTree, flower and terrain sources are credited in ../lpc-garden. Original zodiac glyphs are existing VarCamp art. These map compositions are new; no Harvest Moon game assets are copied.\n')
print('Registered',len(sprites),'unchanged native sprite selections.')
