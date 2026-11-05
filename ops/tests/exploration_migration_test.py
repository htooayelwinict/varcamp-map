import copy
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from enchanted_exploration import MAPS, ROOT, exploration_candidate, is_exploration_wam_change


class MigrationTest(unittest.TestCase):
    def test_preserve_and_fail_closed(self):
        recipe = json.loads((ROOT / 'world/exploration-predecessors.json').read_text())
        for map_id in MAPS:
            with self.subTest(map=map_id):
                old = recipe['maps'][map_id]['areas']
                data = {'mapUrl': 'old', 'entities': {'editor-piano': {'name': 'Retain me'}}, 'settings': {'megaphone': True}, 'areas': [{**a, 'visible': True, **{k: a[k]*32 for k in ('x','y','width','height')}} for a in old]}
                extra = {'id':'independent', 'name':'independent','x':0,'y':0,'width':32,'height':32,'properties':[]}
                data['areas'].append(extra)
                path = f'maps/{map_id}.wam'
                out = exploration_candidate(path,data)
                self.assertIsNotNone(out)
                self.assertEqual(out['entities'], data['entities'])
                self.assertEqual(out['settings'], data['settings'])
                self.assertIn(extra,out['areas'])
                self.assertEqual(exploration_candidate(path,out),out)
                self.assertTrue(is_exploration_wam_change(path,json.dumps(data),json.dumps(out)))
                for mutate in ('geometry','controls','extra-field','duplicate','partial'):
                    bad=copy.deepcopy(data)
                    if mutate=='geometry':bad['areas'][0]['x']+=32
                    elif mutate=='controls':bad['areas'][0]['properties']=[{'id':'live-control','type':'silent'}]
                    elif mutate=='extra-field':bad['areas'][0]['editor-note']='keep this'
                    elif mutate=='duplicate':bad['areas'].append(copy.deepcopy(bad['areas'][0]))
                    else:bad['areas']=bad['areas'][1:]
                    self.assertIsNone(exploration_candidate(path,bad),mutate)
                broken=copy.deepcopy(out);broken['entities']={}
                self.assertFalse(is_exploration_wam_change(path,json.dumps(data),json.dumps(broken)))

if __name__=='__main__':unittest.main()
