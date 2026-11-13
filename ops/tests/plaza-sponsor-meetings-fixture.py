"""The publisher must permit only the owner's three exact native-chat repairs."""
import copy,hashlib,json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from release_upload import wam_dependencies,replacement_files
root=Path(__file__).resolve().parents[2]
old=json.loads((root/'ops/tests/fixtures/plaza-sponsor-meetings-before.json').read_text())
raw=lambda v:(json.dumps(v,ensure_ascii=False)+'\n').encode()
path='maps/overworld.wam';tmj='maps/overworld.tmj';body=b'unchanged sponsor plaza tiles'
old['mapUrl']='overworld.tmj?v='+hashlib.sha256(body).hexdigest()
old['lastCommandId']='keep-owner-command';old['entities']={'owner-desk':{'x':32,'y':64,'prefabRef':{'collectionName':'Furniture','id':'desk'}}}
old['areas'].append({'id':'independent','name':'Owner quiet zone','x':32,'y':32,'width':64,'height':64,'visible':True,'properties':[{'id':'owner-silent','type':'silent'}]})
new=copy.deepcopy(old)
for a in new['areas'][:3]:
 a['properties']=[p for p in a['properties']if p['type']!='matrixRoomPropertyData']
 next(p for p in a['properties']if p['type']=='livekitRoomProperty')['livekitRoomConfig']['disableChat']=False
baseline={tmj:body,path:raw(old)};release={tmj:body,path:raw(new)}
# Fails before implementation: unrecognized WAM edit, not an import error.
deps=wam_dependencies(release,baseline,{path:raw(new)})
assert deps[path]['migration']=='plaza-sponsor-meetings-v1'
assert replacement_files(release,baseline,{path:raw(new)})[path]==raw(new)
from plaza_sponsor_meetings import plaza_sponsor_meetings_candidate
original=copy.deepcopy(old)
assert plaza_sponsor_meetings_candidate(path,old)==new
assert old==original
assert plaza_sponsor_meetings_candidate(path,new)==new
assert plaza_sponsor_meetings_candidate('maps/speaker-aries.wam',old) is None
for change in ['geometry','name','microphone','video','hands','room-name','description','entity','metadata','unrelated','matrix-left','half-enabled']:
 bad=copy.deepcopy(new);a=bad['areas'][0];meeting=next(p for p in a['properties']if p['type']=='livekitRoomProperty')
 if change=='geometry':a['width']+=1
 if change=='name':a['name']='changed'
 if change=='microphone':meeting['livekitRoomConfig']['startWithAudioMuted']=True
 if change=='video':meeting['livekitRoomConfig']['startWithVideoMuted']=True
 if change=='hands':meeting['livekitRoomConfig']['raiseHandEnabled']=False
 if change=='room-name':meeting['roomName']='newness'
 if change=='description':a['properties'][0]['description']='changed'
 if change=='entity':bad['entities']={}
 if change=='metadata':bad['lastCommandId']='changed'
 if change=='unrelated':bad['areas'][-1]['properties']=[]
 if change=='matrix-left':a['properties'].append(copy.deepcopy(old['areas'][0]['properties'][-1]))
 if change=='half-enabled':meeting['livekitRoomConfig']['disableChat']=True
 try:wam_dependencies(release,baseline,{path:raw(bad)})
 except ValueError:pass
 else:raise AssertionError('Unsafe output accepted: '+change)
for change in ['missing','duplicate-area','duplicate-property','unknown-audio','unknown-matrix','geometry','numeric-boolean','shared-room','overlap']:
 bad=copy.deepcopy(old);a=bad['areas'][0];meeting=next(p for p in a['properties']if p['type']=='livekitRoomProperty')
 if change=='missing':bad['areas'].pop(1)
 if change=='duplicate-area':bad['areas'].append(copy.deepcopy(a))
 if change=='duplicate-property':a['properties'].append(copy.deepcopy(meeting))
 if change=='unknown-audio':a['properties'].append({'id':'extra-silence','type':'silent'})
 if change=='unknown-matrix':a['properties'][-1]['id']='new-binding'
 if change=='geometry':a['x']+=1
 if change=='numeric-boolean':meeting['livekitRoomConfig']['disableChat']=1
 if change=='shared-room':bad['areas'][-1]['properties']=[{**copy.deepcopy(meeting),'id':'second-owner'}]
 if change=='overlap':bad['areas'][-1].update(x=a['x'],y=a['y'])
 assert plaza_sponsor_meetings_candidate(path,bad) is None,change
print('Three sponsor native chats: exact geometry and editor data preserved; 21 unsafe changes rejected')
