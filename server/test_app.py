import copy
import io
import json
import os
from pathlib import Path
import tempfile
import time
import unittest

TEMP = tempfile.TemporaryDirectory()
os.environ['MARKINA_DATA'] = TEMP.name
os.environ['MARKINA_ORIGIN'] = 'http://localhost:8320'
import app as cms
from PIL import Image


class CMSTest(unittest.TestCase):
    def setUp(self):
        self.client = cms.app.test_client()
        self.seed = json.loads((cms.PUBLIC / 'content.json').read_text(encoding='utf-8'))
        self.origin = {'Origin': cms.ORIGIN}
        with cms.connect() as db:
            for table in ('owner', 'sessions', 'setup', 'attempts', 'revisions'):
                db.execute('DELETE FROM ' + table)
            db.execute("DELETE FROM sqlite_sequence WHERE name='revisions'")
            db.execute('INSERT INTO revisions(document) VALUES (?)', (json.dumps(self.seed),))
            db.execute('INSERT INTO setup VALUES (1,?,?)', (cms.digest('private-test-token'), int(time.time())+60))

    def login(self):
        result = self.client.post('/api/setup', json={'token':'private-test-token','password':'local-test-password'}, headers=self.origin)
        self.assertEqual(result.status_code, 200, result.json)
        self.csrf = {**self.origin, 'X-CSRF-Token':result.json['csrf']}
        return result

    def save(self, document, revision=1):
        return self.client.put('/api/admin/content', json={'revision':revision,'content':document}, headers=self.csrf)

    def test_first_setup_requires_secret_and_is_single_use(self):
        self.assertFalse(self.client.get('/api/session').json['initialized'])
        result = self.client.post('/api/setup', json={'token':'wrong','password':'local-test-password'}, headers=self.origin)
        self.assertEqual(result.status_code, 403)
        response = self.login()
        self.assertIn('HttpOnly', response.headers['Set-Cookie'])
        self.assertIn('SameSite=Strict', response.headers['Set-Cookie'])
        self.assertIn('Path=/api/', response.headers['Set-Cookie'])
        self.assertTrue(self.client.get('/api/session').json['authenticated'])
        result = self.client.post('/api/setup', json={'token':'private-test-token','password':'local-test-password'}, headers=self.origin)
        self.assertEqual(result.status_code, 403)

    def test_auth_origin_csrf_and_expiry(self):
        self.assertEqual(self.client.get('/api/admin/content').status_code,401)
        self.assertEqual(self.client.get('/api/admin/history').status_code,401)
        self.assertEqual(self.client.get('/api/admin/media').status_code,401)
        self.login()
        payload = {'revision':1,'content':self.seed}
        self.assertEqual(self.client.put('/api/admin/content',json=payload,headers=self.origin).status_code,403)
        self.assertEqual(self.client.put('/api/admin/content',json=payload,headers={**self.csrf,'Origin':'https://evil.test'}).status_code,403)
        with cms.connect() as db: db.execute('UPDATE sessions SET expires=0')
        self.assertEqual(self.client.get('/api/admin/content').status_code,401)

    def test_create_edit_hide_reorder_delete_and_history(self):
        self.login()
        doc = copy.deepcopy(self.seed)
        product = {**doc['products'][0], 'id':'test-product','name':'Новая работа','visible':False}
        doc['products'].insert(0, product)
        doc['sections']['heroTitle'] = 'Новый заголовок\nВторая строка'
        doc['faq'].append({'question':'Новый вопрос','answer':'Ответ'})
        response = self.save(doc)
        self.assertEqual(response.status_code,200,response.json)
        self.assertEqual(len(self.client.get('/api/content').json['content']['products']),6)
        self.assertEqual(len(self.client.get('/api/admin/content').json['content']['products']),7)
        product['visible'] = True
        product['description'] = 'Новое описание'
        self.assertEqual(self.save(doc,2).status_code,200)
        self.assertEqual(self.client.get('/api/content').json['content']['products'][0]['description'],'Новое описание')
        doc['products'].reverse()
        self.assertEqual(self.save(doc,3).status_code,200)
        doc['products'] = [p for p in doc['products'] if p['id'] != 'test-product']
        self.assertEqual(self.save(doc,4).status_code,200)
        self.assertEqual(len(self.client.get('/api/admin/history').json),5)
        self.assertEqual(self.client.get('/api/admin/history/1').json['content'],self.seed)
        self.assertEqual(self.client.get('/api/content').json['content']['sections']['heroTitle'],'Новый заголовок\nВторая строка')

    def test_concurrent_edit_does_not_overwrite(self):
        self.login()
        self.assertEqual(self.save(self.seed).status_code,200)
        result = self.save(self.seed)
        self.assertEqual(result.status_code,409)
        self.assertEqual(self.client.get('/api/content').json['revision'],2)

    def test_validation_blocks_active_links_paths_and_invalid_schema(self):
        self.login()
        variants = []
        for key, value in [('source','javascript:alert(1)'),('image','/uploads/../../server/app.py'),('types',[]),('visible','true')]:
            doc = copy.deepcopy(self.seed); doc['products'][0][key] = value; variants.append(doc)
        doc = copy.deepcopy(self.seed); doc['products'].append(doc['products'][0]); variants.append(doc)
        doc = copy.deepcopy(self.seed); doc['sections']['telegram']='http://example.test'; variants.append(doc)
        doc = copy.deepcopy(self.seed); doc['stories']=[]; variants.append(doc)
        for doc in variants:
            self.assertEqual(self.save(doc).status_code,400)
        self.assertEqual(self.client.get('/api/content').json['revision'],1)

    def test_upload_reencodes_and_rejects_non_image_and_private_paths(self):
        self.login()
        picture = Image.new('RGB',(60,80),(220,190,210)); stream=io.BytesIO(); picture.save(stream,'PNG'); stream.seek(0)
        result = self.client.post('/api/admin/upload',data={'file':(stream,'photo.png')},headers=self.csrf)
        self.assertEqual(result.status_code,201,result.json)
        self.assertTrue(result.json['url'].endswith('.webp'))
        response = self.client.get(result.json['url'])
        self.assertEqual(response.status_code,200)
        self.assertEqual(Image.open(io.BytesIO(response.data)).format,'WEBP')
        response.close()
        doc = copy.deepcopy(self.seed); doc['products'][0]['image']=result.json['url']
        self.assertEqual(self.save(doc).status_code,200)
        result = self.client.post('/api/admin/upload',data={'file':(io.BytesIO(b'<svg onload="alert(1)"></svg>'),'bad.svg')},headers=self.csrf)
        self.assertEqual(result.status_code,400)
        self.assertEqual(self.client.get('/uploads/cms.sqlite3').status_code,404)
        self.assertEqual(self.client.get('/.env').status_code,404)
        self.assertEqual(self.client.get('/server/app.py').status_code,404)

    def test_password_change_revokes_other_sessions_and_logout(self):
        self.login()
        other = cms.app.test_client()
        login = other.post('/api/login',json={'password':'local-test-password'},headers=self.origin)
        self.assertEqual(login.status_code,200)
        result = self.client.post('/api/password',json={'current':'local-test-password','password':'replacement-password'},headers=self.csrf)
        self.assertEqual(result.status_code,200)
        self.assertEqual(other.get('/api/admin/content').status_code,401)
        self.assertEqual(self.client.get('/api/admin/content').status_code,200)
        self.csrf['X-CSRF-Token'] = result.json['csrf']
        self.assertEqual(self.client.post('/api/logout',json={},headers=self.csrf).status_code,200)
        self.assertEqual(self.client.get('/api/admin/content').status_code,401)

    def test_login_throttling(self):
        for _ in range(8):
            self.assertEqual(self.client.post('/api/login',json={'password':'wrong'},headers=self.origin).status_code,403)
        self.assertEqual(self.client.post('/api/login',json={'password':'wrong'},headers=self.origin).status_code,429)


if __name__ == '__main__':
    unittest.main()
