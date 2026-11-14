"""Enable each ceremony's linked native chat without altering saved editor data."""
import copy
import json
from pathlib import Path
from auditorium_spacing import same

CHAT_HALLS=('solar-hall','lunar-hall')

def hall_shared_chat_candidate(path,data):
    map_id=Path(path).stem
    if map_id not in CHAT_HALLS or path!='maps/'+map_id+'.wam':
        return None
    try:
        contract=json.loads((Path(__file__).resolve().parents[1]/'world/hall-shared-chat.json').read_text())
        if contract['version']!=1 or set(contract['maps'])!=set(CHAT_HALLS):
            return None
        rows=contract['maps'][map_id];hall=map_id[:-5]
        if [r['areaId'] for r in rows]!=[hall+'-stage',hall+'-audience']:
            return None
        result=copy.deepcopy(data);area_ids=set();property_ids=set()
        for area in result['areas']:
            if not isinstance(area['id'],str) or not area['id'] or area['id'] in area_ids:
                return None
            area_ids.add(area['id'])
            for prop in area['properties']:
                if not isinstance(prop['id'],str) or not prop['id'] or prop['id'] in property_ids:
                    return None
                property_ids.add(prop['id'])
        for row in rows:
            matches=[a for a in result['areas'] if a['id']==row['areaId']]
            if len(matches)!=1:
                return None
            area=matches[0]
            if any(not same(area.get(k),v) for k,v in row['geometry'].items()):
                return None
            native=[p for p in area['properties'] if p['id']==row['property']['id']]
            if len(native)!=1 or type(native[0].get('chatEnabled')) is not bool or not same({**native[0],'chatEnabled':True},row['property']):
                return None
            if any(p['id']!=native[0]['id'] and p.get('type') not in {'areaDescriptionProperties','lockableAreaPropertyData','highlight','restrictedRightsPropertyData'} for p in area['properties']):
                return None
            native[0]['chatEnabled']=True
        return result
    except (OSError,ValueError,KeyError,TypeError,AttributeError):
        return None

def is_hall_shared_chat_wam_change(path,before,after):
    expected=hall_shared_chat_candidate(path,json.loads(before))
    if expected is None:
        return False
    # Metadata-only migration: even the root mapUrl token must stay unchanged.
    return same(expected,json.loads(after))
