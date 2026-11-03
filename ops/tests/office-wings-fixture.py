import sys, json, copy, hashlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from office_wings import office_wings_candidate, is_office_wings_wam_change
from auditorium_spacing import ROOMS
from release_upload import wam_dependencies
root=Path(__file__).resolve().parents[2]
for room in ROOMS:
    current=json.loads((root/'maps'/f'{room}.wam').read_text())
    old=copy.deepcopy(current);old['areas']=old['areas'][:3]
    old['metadata']={'organizer':'retained'};old['entities']={'independent':{'x':64,'y':96,'prefabRef':{'collectionName':'furniture','id':'chair'}}}
    old['areas'].append({'id':'custom','name':'independent note','visible':True,'x':0,'y':0,'width':32,'height':32,'properties':[],'annotation':'keep'})
    path='maps/'+room+'.wam'
    updated=office_wings_candidate(path,old)
    assert updated is not None and len(updated['areas'])==8
    assert updated['areas'][:4]==old['areas'] and updated['entities']==old['entities'] and updated['metadata']==old['metadata']
    assert office_wings_candidate(path,updated)==updated
    assert is_office_wings_wam_change(path,json.dumps(old),json.dumps(updated))
    tmj=path[:-4]+'.tmj';body=b'office fixture map';pin=hashlib.sha256(body).hexdigest()
    saved=copy.deepcopy(old);saved['mapUrl']=room+'.tmj?v='+'0'*64
    published=copy.deepcopy(updated);published['mapUrl']=room+'.tmj?v='+pin
    raw=lambda v:(json.dumps(v,ensure_ascii=False)+'\n').encode()
    deps=wam_dependencies({tmj:body,path:raw(published)},{tmj:b'previous',path:raw(saved)},{path:raw(published)})
    assert deps[path]['migration']=='speaker-office-wings-v1'
    for mutate in [lambda v:v['areas'][0].update(width=1),lambda v:v['areas'].append(copy.deepcopy(v['areas'][0]))]:
        bad=copy.deepcopy(old);mutate(bad);assert office_wings_candidate(path,bad) is None
    partial=copy.deepcopy(old);partial['areas'].append(updated['areas'][-1]);assert office_wings_candidate(path,partial) is None
    drift=copy.deepcopy(updated);drift['areas'][-1]['width']+=32;assert office_wings_candidate(path,drift) is None
    damaged=copy.deepcopy(updated);damaged['metadata']={};assert not is_office_wings_wam_change(path,json.dumps(old),json.dumps(damaged))
    conflict=copy.deepcopy(old);quiet=updated['areas'][-3];conflict['areas'][-1].update(x=quiet['x'],y=quiet['y']);assert office_wings_candidate(path,conflict) is None
assert office_wings_candidate('maps/solar-hall.wam',old) is None
print('12 office migrations preserve editor data; drift, partial migration and quiet-area overlap rejected')
