import copy,hashlib,json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from release_upload import wam_dependencies,replacement_files
from speaker_shared_chat import speaker_shared_chat_candidate
root=Path(__file__).resolve().parents[2]
raw=lambda v:(json.dumps(v,ensure_ascii=False)+'\n').encode()
signs=('taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces')
for sign in signs:
 path='maps/speaker-'+sign+'.wam';tmj=path[:-4]+'.tmj'
 old=json.loads((root/path).read_text());old['mapUrl']='speaker-'+sign+'.tmj?v='+'0'*64
 old['lastCommandId']='keep-command';old['metadata']={'owner':'keep'}
 old['entities']={'manual-object':{'x':96,'y':64,'prefabRef':{'collectionName':'Office','id':'desk'}}}
 ids=('meeting-'+sign,sign+'-audience')
 for a in old['areas']:
  if a['id'] in ids:
   a['properties'][0]['chatEnabled']=False
   a['properties'].append({'id':a['id']+'-description','type':'areaDescriptionProperties','description':'Keep manual note','searchable':False})
   a['modifyProperties']=True
 old['areas'].append({'id':'independent-chat','name':'Other chat','visible':True,'x':2200,'y':1300,'width':32,'height':32,'properties':[{'id':'matrix-elsewhere','type':'matrixRoomPropertyData','serverData':{'matrixRoomId':'!keep:example.invalid'}}]})
 new=copy.deepcopy(old)
 for a in new['areas']:
  if a['id'] in ids:a['properties'][0]['chatEnabled']=True
 body=b'same physical map';new['mapUrl']='speaker-'+sign+'.tmj?v='+hashlib.sha256(body).hexdigest()
 release={tmj:body,path:raw(new)};baseline={tmj:b'old',path:raw(old)}
 deps=wam_dependencies(release,baseline,{path:raw(new)})
 assert deps[path]['migration']=='speaker-shared-chat-v1'
 assert replacement_files(release,baseline,{path:raw(new)})[path]==raw(new)
 for change in ('geometry','microphones','hands','link','channel','other-area','entity','description','metadata','half-enabled'):
  bad=copy.deepcopy(new);stage=next(a for a in bad['areas'] if a['id']==ids[0]);aud=next(a for a in bad['areas'] if a['id']==ids[1])
  if change=='geometry':stage['width']+=32
  if change=='microphones':aud['properties'][0]['allowTalking']=True
  if change=='hands':aud['properties'][0]['raiseHandEnabled']=False
  if change=='link':aud['properties'][0]['speakerZoneName']='wrong-stage'
  if change=='channel':stage['properties'][0]['name']='varcamp-aries-talk'
  if change=='other-area':bad['areas'][-1]['properties']=[]
  if change=='entity':bad['entities']={}
  if change=='description':stage['properties'][1]['description']='changed'
  if change=='metadata':bad['lastCommandId']='wrong-command'
  if change=='half-enabled':stage['properties'][0]['chatEnabled']=False
  try:wam_dependencies(release,baseline,{path:raw(bad)})
  except ValueError:pass
  else:raise AssertionError(sign+': accepted off-scope '+change)
 snapshot=copy.deepcopy(old)
 actual=speaker_shared_chat_candidate(path,old)
 assert old==snapshot,sign+': mutated baseline'
 actual['mapUrl']=new['mapUrl'];assert actual==new,sign+': lost saved data'
 assert speaker_shared_chat_candidate(path,new)==new,sign+': not idempotent'
 for change in ('missing','duplicate-area','duplicate-property','matrix','audio','geometry','type','link','numeric-boolean'):
  bad=copy.deepcopy(old);stage=next(a for a in bad['areas'] if a['id']==ids[0])
  if change=='missing':bad['areas']=[a for a in bad['areas'] if a['id']!=ids[1]]
  if change=='duplicate-area':bad['areas'].append(copy.deepcopy(stage))
  if change=='duplicate-property':stage['properties'].append(copy.deepcopy(stage['properties'][0]))
  if change=='matrix':stage['properties'].append({'id':'manual-stage-chat','type':'matrixRoomPropertyData','serverData':{'matrixRoomId':'!keep:example.invalid'}})
  if change=='audio':stage['properties'].append({'id':'manual-quiet','type':'silent'})
  if change=='geometry':stage['x']+=32
  if change=='type':stage['properties'][0]['type']='livekitRoomProperty'
  if change=='link':next(a for a in bad['areas'] if a['id']==ids[1])['properties'][0]['speakerZoneName']='wrong-stage'
  if change=='numeric-boolean':stage['properties'][0]['chatEnabled']=1
  assert speaker_shared_chat_candidate(path,bad) is None,sign+': accepted drift '+change
for excluded in ('speaker-aries','solar-hall','lunar-hall','overworld'):
 assert speaker_shared_chat_candidate('maps/'+excluded+'.wam',old) is None,excluded
print('11 native shared chats preserve saved data')
