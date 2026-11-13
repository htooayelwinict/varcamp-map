"""Exercise the real publisher with a saved split-chat fixture and protected data."""
import copy,hashlib,json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from release_upload import wam_dependencies,replacement_files
root=Path(__file__).resolve().parents[2]
path='maps/speaker-aries.wam';tmj=path[:-4]+'.tmj'
raw=lambda v:(json.dumps(v,ensure_ascii=False)+'\n').encode()
old=json.loads((root/path).read_text());old['mapUrl']='speaker-aries.tmj?v='+'0'*64
old['lastCommandId']='saved-command';old['editorMetadata']={'preserve':True}
old['entities']={'saved-desk':{'x':100,'y':200,'prefabRef':{'collectionName':'furniture','id':'desk'}}}
ids={'meeting-aries':'59d55034-e1e6-419c-b5cb-45ba1c37ed8c','aries-audience':'1df20358-7eb5-4252-aac8-25e989966b1e'}
for a in old['areas']:
 if a['id'] in ids:
  a['properties'][0]['chatEnabled']=False
  a['properties'] += [{'id':a['id']+'-description','type':'areaDescriptionProperties','description':'Keep this note','searchable':False},{'id':ids[a['id']],'resourceUrl':'https://pusher.workadventu.re/roomArea','serverData':{'matrixRoomId':'!test-'+a['id']+':example.invalid'},'type':'matrixRoomPropertyData','shouldOpenAutomatically':True,'displayName':'varcamp-aries-talk1'}]
  a['modifyProperties']=True;a['modifyServerData']=True
old['areas'].append({'id':'unrelated-chat','name':'Keep this Matrix chat','visible':True,'x':2000,'y':1200,'width':32,'height':32,'properties':[{'id':'unrelated-matrix','type':'matrixRoomPropertyData','serverData':{'matrixRoomId':'!keep:example.invalid'}}]})
new=copy.deepcopy(old)
for a in new['areas']:
 if a['id'] in ids:
  a['properties']=[p for p in a['properties'] if p['id']!=ids[a['id']]]
  a['properties'][0]['chatEnabled']=True
body=b'unchanged map geometry';new['mapUrl']='speaker-aries.tmj?v='+hashlib.sha256(body).hexdigest()
release={tmj:body,path:raw(new)};baseline={tmj:b'old bytes',path:raw(old)}
# Before the fix this fails with "preserve every byte outside the mapUrl version token".
deps=wam_dependencies(release,baseline,{path:raw(new)})
assert deps[path]['migration']=='aries-shared-chat-v1'
assert replacement_files(release,baseline,{path:raw(new)})[path]==raw(new)
# The authorization must not become a general WAM-edit escape hatch.
for change in ('geometry','microphones','hands','link','stage-name','other-area','entities','description','metadata','half-enabled','matrix-left'):
 bad=copy.deepcopy(new);stage=next(a for a in bad['areas'] if a['id']=='meeting-aries');aud=next(a for a in bad['areas'] if a['id']=='aries-audience')
 if change=='geometry':stage['width']+=32
 if change=='microphones':aud['properties'][0]['allowTalking']=True
 if change=='hands':aud['properties'][0]['raiseHandEnabled']=False
 if change=='link':aud['properties'][0]['speakerZoneName']='wrong-stage'
 if change=='stage-name':stage['properties'][0]['name']='other-talk'
 if change=='other-area':bad['areas'][-1]['properties']=[]
 if change=='entities':bad['entities']={}
 if change=='description':stage['properties'][1]['description']='lost original'
 if change=='metadata':bad['lastCommandId']='different'
 if change=='half-enabled':stage['properties'][0]['chatEnabled']=False
 if change=='matrix-left':stage['properties'].append(copy.deepcopy(old['areas'][0]['properties'][-1]))
 try:wam_dependencies(release,baseline,{path:raw(bad)})
 except ValueError:pass
 else:raise AssertionError('Unsafe migration accepted: '+change)

from aries_shared_chat import aries_shared_chat_candidate
snapshot=copy.deepcopy(old)
actual=aries_shared_chat_candidate(path,old)
assert old==snapshot,'Migration mutated the saved baseline'
actual['mapUrl']=new['mapUrl']
assert actual==new,'Migration lost independent editor content'
assert aries_shared_chat_candidate(path,new)==new,'Migration is not idempotent'
assert aries_shared_chat_candidate('maps/speaker-taurus.wam',old) is None
for change in ('missing','duplicate-area','duplicate-property','new-matrix','new-audio','geometry','wrong-type','wrong-link','changed-binding','numeric-boolean'):
 bad=copy.deepcopy(old);stage=bad['areas'][0]
 if change=='missing':bad['areas']=[a for a in bad['areas'] if a['id']!='aries-audience']
 if change=='duplicate-area':bad['areas'].append(copy.deepcopy(stage))
 if change=='duplicate-property':stage['properties'].append(copy.deepcopy(stage['properties'][0]))
 if change=='new-matrix':stage['properties'][-1]['id']='unreviewed-matrix'
 if change=='new-audio':stage['properties'].append({'id':'quiet','type':'silent'})
 if change=='geometry':stage['x']+=32
 if change=='wrong-type':stage['properties'][0]['type']='livekitRoomProperty'
 if change=='wrong-link':next(a for a in bad['areas'] if a['id']=='aries-audience')['properties'][0]['speakerZoneName']='wrong-stage'
 if change=='changed-binding':stage['properties'][-1]['displayName']='new-purpose'
 if change=='numeric-boolean':stage['properties'][0]['chatEnabled']=0
 assert aries_shared_chat_candidate(path,bad) is None,change

print('Aries shared chat migration verified')
