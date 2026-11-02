import copy, hashlib, json, pathlib, sys, tempfile
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from auditorium_spacing import ROOMS, auditorium_candidate, is_auditorium_spacing_wam_change
from migrate_wam_tokens import migrate
from release_upload import wam_dependencies
root=pathlib.Path(__file__).resolve().parents[2]
recipe=json.loads((root/'world/auditorium-spacing.json').read_text())
encode=lambda v:(json.dumps(v,indent=2,ensure_ascii=False)+'\n').encode()
count=0
for room in ROOMS:
 path='maps/'+room+'.wam';source=json.loads((root/path).read_text());source['mapUrl']=room+'.tmj?v='+'a'*64
 for a in source['areas']:
  old=next(x for x in recipe['maps'][room]['beforeFunctional']['areas'] if x['id']==a['id'])
  for k in ['x','y','width','height']:a[k]=old[k]*32
  a['organizer-note']={'keep':[1,True,'မြန်မာ']}
 source['entities']['organizer']={'x':27,'prefabRef':{'collectionName':'Office','id':'chair'}}
 source['metadata']['custom']=['unchanged',True];source['areas'].append({'id':'extra','name':'Extra','visible':True,'x':32,'y':32,'width':32,'height':32,'properties':[]})
 before=copy.deepcopy(source);updated=auditorium_candidate(path,source);assert updated and source==before
 assert updated['entities']==source['entities'] and updated['metadata']==source['metadata']
 for a in updated['areas']:
  original=next(v for v in source['areas'] if v['id']==a['id'])
  assert {k:v for k,v in a.items() if k not in ['x','y','width','height']}=={k:v for k,v in original.items() if k not in ['x','y','width','height']}
 assert updated['areas'][-1]==source['areas'][-1]
 assert auditorium_candidate(path,updated) is None and auditorium_candidate(path,updated,already_current=True)==updated
 assert is_auditorium_spacing_wam_change(path,encode(source),encode(updated));count+=1
 for defect in ['geometry','controls','bool-type','missing','duplicate','duplicate-owner','wrong-name']:
  bad=copy.deepcopy(source)
  if defect=='geometry':bad['areas'][0]['x']+=32
  if defect=='controls':bad['areas'][0]['properties'][0]['chatEnabled']=True
  if defect=='bool-type':bad['areas'][0]['visible']=1
  if defect=='missing':bad['areas'].pop(0)
  if defect=='duplicate':bad['areas'].append(copy.deepcopy(bad['areas'][0]))
  if defect=='duplicate-owner':bad['areas'][-1]['properties']=[{**bad['areas'][0]['properties'][0],'id':'duplicate-owner'}]
  if defect=='wrong-name':bad['areas'][0]['name']='custom stage'
  assert auditorium_candidate(path,bad) is None,defect;count+=1
 for defect in ['entities','metadata','property','extra-area','owned-note']:
  bad=copy.deepcopy(updated)
  if defect=='entities':bad['entities']={}
  if defect=='metadata':bad['metadata']['custom']=['changed']
  if defect=='property':bad['areas'][0]['properties'][0]['chatEnabled']=True
  if defect=='extra-area':bad['areas'][-1]['x']=999
  if defect=='owned-note':bad['areas'][0]['organizer-note']={}
  assert not is_auditorium_spacing_wam_change(path,encode(source),encode(bad));count+=1
 with tempfile.TemporaryDirectory() as temp:
  d=pathlib.Path(temp);(d/'maps').mkdir();tmj=b'final native map';(d/path.replace('.wam','.tmj')).write_bytes(tmj)
  live={path:encode(source)}
  default,_=migrate(live,d);assert json.loads(default[path])['areas']==source['areas']
  reviewed,_=migrate(live,d,auditorium_spacing=True);assert json.loads(reviewed[path])['areas']==updated['areas']
  deps=wam_dependencies({path:b'ignored source',path[:-4]+'.tmj':tmj},live,reviewed);assert deps[path]['migration']=='auditorium-spacing-v1'
  again,summary=migrate(reviewed,d,auditorium_spacing=True);assert not again and summary['unchanged']==[path]
  customized=copy.deepcopy(source);customized['areas'][0]['width']+=1
  try:migrate({path:encode(customized)},d,auditorium_spacing=True)
  except ValueError:pass
  else:raise AssertionError('Customized saved geometry silently accepted')
  count+=5
assert auditorium_candidate('maps/solar-hall.wam',source) is None
print(f'{count} migration checks passed across all 12 rooms')
