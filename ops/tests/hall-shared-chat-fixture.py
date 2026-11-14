import copy,hashlib,json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from release_upload import wam_dependencies,replacement_files
root=Path(__file__).resolve().parents[2]
raw=lambda value:(json.dumps(value,ensure_ascii=False)+'\n').encode()
for hall in ('solar','lunar'):
 path='maps/'+hall+'-hall.wam';tmj=path[:-4]+'.tmj';body=b'unchanged physical map'
 old=json.loads((root/path).read_text());old['mapUrl']=hall+'-hall.tmj?v='+hashlib.sha256(body).hexdigest()
 old['lastCommandId']='retain-editor-command';old['metadata']={'owner':'retain'}
 old['entities']={'manual-object':{'x':96,'y':64,'prefabRef':{'collectionName':'Office','id':'desk'}}}
 ids=(hall+'-stage',hall+'-audience')
 for a in old['areas']:
  if a['id'] in ids:
   a['properties'][0]['chatEnabled']=False
   a['properties'].append({'id':a['id']+'-description','type':'areaDescriptionProperties','description':'Keep manual note','searchable':False})
   a['modifyProperties']=True
 new=copy.deepcopy(old)
 for a in new['areas']:
  if a['id'] in ids:a['properties'][0]['chatEnabled']=True
 baseline={tmj:body,path:raw(old)};release=dict(baseline)
 deps=wam_dependencies(release,baseline,{path:raw(new)})
 assert deps[path]['migration']=='hall-shared-chat-v1'
 assert replacement_files(release,baseline,{path:raw(new)})[path]==raw(new)
 for change in ('geometry','microphones','hands','link','channel','rights','entity','description','metadata','half-enabled','prep'):
  bad=copy.deepcopy(new);stage=next(a for a in bad['areas'] if a['id']==ids[0]);aud=next(a for a in bad['areas'] if a['id']==ids[1])
  if change=='geometry':stage['width']+=32
  if change=='microphones':aud['properties'][0]['allowTalking']=True
  if change=='hands':aud['properties'][0]['raiseHandEnabled']=False
  if change=='link':aud['properties'][0]['speakerZoneName']='wrong-stage'
  if change=='channel':stage['properties'][0]['name']='wrong-channel'
  if change=='rights':next(p for p in stage['properties'] if p['type']=='restrictedRightsPropertyData')['readTags']=[]
  if change=='entity':bad['entities']={}
  if change=='description':stage['properties'][-1]['description']='changed'
  if change=='metadata':bad['lastCommandId']='wrong-command'
  if change=='half-enabled':stage['properties'][0]['chatEnabled']=False
  if change=='prep':next(a for a in bad['areas'] if a['id']==hall+'-prep')['properties']=[]
  try:wam_dependencies(release,baseline,{path:raw(bad)})
  except ValueError:pass
  else:raise AssertionError(hall+': accepted off-scope '+change)
print('Two hall shared chats preserve saved data')
