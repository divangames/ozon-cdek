import http.client
import importlib.util
import json
import os
import tempfile
import threading
import unittest
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

spec = importlib.util.spec_from_file_location('leads', Path(__file__).with_name('leads.py'))
leads = importlib.util.module_from_spec(spec)
spec.loader.exec_module(leads)


class TelegramMock(BaseHTTPRequestHandler):
    messages = []
    fail = False

    def log_message(self, *args):
        pass

    def do_POST(self):
        payload = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        if not self.fail:
            self.messages.append(payload)
        body = json.dumps({'ok': not self.fail}).encode()
        self.send_response(200)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class LeadsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory()
        leads.DB_PATH = os.path.join(cls.temporary.name, 'leads.sqlite3')
        leads.BOT_TOKEN, leads.CHAT_ID = 'test-token', 'test-chat'
        cls.telegram = ThreadingHTTPServer(('127.0.0.1', 0), TelegramMock)
        leads.TELEGRAM_BASE = f'http://127.0.0.1:{cls.telegram.server_port}'
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), leads.Handler)
        for server in [cls.telegram, cls.server]:
            threading.Thread(target=server.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        for server in [cls.telegram, cls.server]:
            server.shutdown()
            server.server_close()
        cls.temporary.cleanup()

    def setUp(self):
        TelegramMock.messages.clear()
        TelegramMock.fail = False
        leads.RATE.clear()

    def payload(self, **kwargs):
        return {'name': 'Тест <пользователь>', 'contactType': 'phone', 'contact': '+7 999 000-00-00', 'consent': True, 'website': '', 'submissionId': str(uuid.uuid4()), **kwargs}

    def post(self, payload, origin=leads.ORIGIN):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=5)
        connection.request('POST', '/api/leads', json.dumps(payload).encode(), {'Content-Type': 'application/json', 'Origin': origin})
        response = connection.getresponse()
        result = response.status, json.loads(response.read())
        self.assertEqual(response.getheader('Cache-Control'), 'no-store')
        connection.close()
        return result

    def test_three_contact_channels(self):
        for kind, value in [('phone', '+7 999 000-00-00'), ('telegram', '@example_user'), ('max', 'https://max.ru/u/example-user')]:
            status, result = self.post(self.payload(contactType=kind, contact=value))
            self.assertEqual((status, result['ok']), (200, True))
            self.assertIn(value, TelegramMock.messages[-1]['text'])
            self.assertTrue(TelegramMock.messages[-1]['text'].startswith('📩 Новая заявка'))
            self.assertIn('👤 Имя:', TelegramMock.messages[-1]['text'])
            self.assertNotIn('parse_mode', TelegramMock.messages[-1])

    def test_plan_is_stored_and_validated(self):
        payload = self.payload(plan='500')
        self.assertEqual(self.post(payload)[0], 200)
        self.assertIn('Тариф: 500', TelegramMock.messages[-1]['text'])
        with leads.database() as connection:
            self.assertEqual(connection.execute('SELECT plan FROM leads WHERE id = ?', (payload['submissionId'],)).fetchone()[0], '500')
        self.assertEqual(self.post({**payload, 'plan': '1000'})[0], 409)
        self.assertEqual(self.post(self.payload(plan='unknown'))[0], 400)

    def test_pages_preflight_allows_only_approved_origin(self):
        origin = 'https://divangames.github.io'
        leads.ORIGINS.add(origin)
        try:
            for requested, expected in [(origin, 204), ('https://untrusted.example', 403)]:
                connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=5)
                connection.request('OPTIONS', '/api/leads', headers={'Origin': requested, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type'})
                response = connection.getresponse()
                self.assertEqual(response.status, expected)
                self.assertEqual(response.getheader('Access-Control-Allow-Origin'), origin if expected == 204 else None)
                response.read()
                connection.close()
        finally:
            leads.ORIGINS.remove(origin)

    def test_idempotent_delivery_and_conflicting_reuse(self):
        payload = self.payload()
        self.assertEqual(self.post(payload)[0], 200)
        self.assertEqual(self.post(payload)[0], 200)
        self.assertEqual(len(TelegramMock.messages), 1)
        self.assertEqual(self.post({**payload, 'contact': '+7 999 000-00-01'})[0], 409)

    def test_telegram_failure_is_not_success_and_can_retry(self):
        payload = self.payload()
        TelegramMock.fail = True
        self.assertEqual(self.post(payload), (502, {'ok': False}))
        with leads.database() as connection:
            self.assertEqual(connection.execute('SELECT delivered FROM leads WHERE id=?', (payload['submissionId'],)).fetchone()[0], 0)
        TelegramMock.fail = False
        self.assertEqual(self.post(payload)[0], 200)
        self.assertEqual(len(TelegramMock.messages), 1)

    def test_validation_and_origin_rejection(self):
        self.assertEqual(self.post(self.payload(), origin='https://other.example')[0], 403)
        for changes in [{'consent': False}, {'name': ' '}, {'contact': '123'}, {'contactType': 'email'}, {'contactType': 'telegram', 'contact': 'wrong link'}, {'website': 'bot'}, {'submissionId': 'wrong'}]:
            self.assertEqual(self.post(self.payload(**changes))[0], 400)
        self.assertEqual(TelegramMock.messages, [])

    def test_rate_limit(self):
        for _ in range(8):
            self.assertEqual(self.post(self.payload())[0], 200)
        self.assertEqual(self.post(self.payload())[0], 429)


if __name__ == '__main__':
    unittest.main(verbosity=2)
