"""Private same-origin lead endpoint. Telegram credentials never reach the browser."""
import collections
import contextlib
import csv
import datetime
import json
import os
import re
import sqlite3
import sys
import threading
import time
import urllib.request
import urllib.error
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DB_PATH = os.environ.get('LEADS_DB', '/var/lib/ozon-cdek-leads/leads.sqlite3')
BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '')
TELEGRAM_BASE = os.environ.get('TELEGRAM_API_BASE', 'https://api.telegram.org')
ORIGIN = os.environ.get('LEADS_ORIGIN', 'https://cdek-ozon.ru')
ORIGINS = {value.strip() for value in ORIGIN.split(',') if value.strip()}
RATE = collections.OrderedDict()
RATE_LOCK = threading.Lock()
DELIVERY_LOCK = threading.Lock()


@contextlib.contextmanager
def database():
    connection = sqlite3.connect(DB_PATH, timeout=5)
    connection.execute("CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, name TEXT NOT NULL, contact_type TEXT NOT NULL, contact TEXT NOT NULL, plan TEXT NOT NULL DEFAULT 'consultation', delivered INTEGER NOT NULL DEFAULT 0)")
    try:
        with connection:
            yield connection
    finally:
        connection.close()


def clean_text(value, limit):
    return isinstance(value, str) and 0 < len(value.strip()) <= limit and not any(ord(c) < 32 for c in value)


def valid_contact(kind, value):
    phone = re.fullmatch(r'[+\d\s()\-]+', value) is not None and 10 <= len(re.sub(r'\D', '', value)) <= 15
    if kind == 'phone':
        return phone
    if kind == 'telegram':
        return re.fullmatch(r'@?[A-Za-z][A-Za-z0-9_]{4,31}', value) is not None or re.fullmatch(r'https?://t\.me/[A-Za-z][A-Za-z0-9_]{4,31}/?', value) is not None
    if kind == 'max':
        return phone or re.fullmatch(r'https?://max\.ru/[A-Za-z0-9_\-/]+', value) is not None
    return False


def send_telegram(record):
    labels = {'phone': 'Телефон', 'telegram': 'Telegram', 'max': 'MAX'}
    icons = {'phone': '📞', 'telegram': '✈️', 'max': '💬'}
    message = f"📩 Новая заявка · OZON × CDEK\n\n👤 Имя: {record['name']}\n{icons[record['contactType']]} Связь: {labels[record['contactType']]}\nКонтакт: {record['contact']}\nТариф: {record.get('plan', 'consultation')}\n\n🆔 Заявка: {record['submissionId']}\n🌐 Сайт: cdek-ozon.ru"
    request = urllib.request.Request(f'{TELEGRAM_BASE}/bot{BOT_TOKEN}/sendMessage', data=json.dumps({'chat_id': CHAT_ID, 'text': message, 'link_preview_options': {'is_disabled': True}}).encode(), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.load(response).get('ok') is True
    except urllib.error.HTTPError as error:
        try:
            description = json.load(error).get('description', 'request rejected')
        except Exception:
            description = 'request rejected'
        print(f'Telegram delivery rejected ({error.code}): {description}', file=sys.stderr, flush=True)
        return False
    except Exception as error:
        # Network exceptions can contain the secret URL. Never print them.
        print(f'Telegram transport failure: {type(error).__name__}', file=sys.stderr, flush=True)
        return False


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, format, *args):
        pass  # No personal data or token-bearing URLs in HTTP logs.

    def reply(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        origin = self.headers.get('Origin')
        if origin in ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_GET(self):
        if self.path == '/health':
            return self.reply(200, {'ok': bool(BOT_TOKEN and CHAT_ID)})
        self.reply(405, {'ok': False})

    def do_OPTIONS(self):
        if self.path != '/api/leads' or self.headers.get('Origin') not in ORIGINS:
            return self.reply(403, {'ok': False})
        if self.headers.get('Access-Control-Request-Method') != 'POST' or self.headers.get('Access-Control-Request-Headers', '').lower() not in ('', 'content-type'):
            return self.reply(403, {'ok': False})
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
        self.send_header('Access-Control-Allow-Methods', 'POST')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '300')
        self.send_header('Vary', 'Origin')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_POST(self):
        if self.path != '/api/leads':
            return self.reply(404, {'ok': False})
        # Browsers supply Origin for JSON POST; the public endpoint accepts only our site.
        if self.headers.get('Origin') not in ORIGINS:
            return self.reply(403, {'ok': False})
        if self.headers.get('Content-Type', '').split(';')[0].strip() != 'application/json':
            return self.reply(415, {'ok': False})
        try:
            length = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            return self.reply(400, {'ok': False})
        if not 0 < length <= 8192:
            self.close_connection = True
            return self.reply(413, {'ok': False})
        self.connection.settimeout(10)
        try:
            record = json.loads(self.rfile.read(length))
        except (ValueError, TimeoutError, OSError):
            return self.reply(400, {'ok': False})
        if not isinstance(record, dict):
            return self.reply(400, {'ok': False})
        if record.get('website'):
            return self.reply(400, {'ok': False})
        if record.get('consent') is not True or not clean_text(record.get('name'), 80) or not clean_text(record.get('contact'), 200):
            return self.reply(400, {'ok': False})
        if record.get('plan', 'consultation') not in ('consultation', '300', '500', '1000'):
            return self.reply(400, {'ok': False})
        record['name'] = record['name'].strip()
        record['contact'] = record['contact'].strip()
        if not valid_contact(record.get('contactType'), record['contact']):
            return self.reply(400, {'ok': False})
        try:
            record['submissionId'] = str(uuid.UUID(record['submissionId']))
        except (KeyError, ValueError, TypeError, AttributeError):
            return self.reply(400, {'ok': False})
        if not BOT_TOKEN or not CHAT_ID:
            return self.reply(503, {'ok': False})
        ip = self.headers.get('X-Real-IP', self.client_address[0])
        now = time.monotonic()
        with RATE_LOCK:
            hits = [at for at in RATE.get(ip, []) if at > now - 300]
            if len(hits) >= 8:
                return self.reply(429, {'ok': False})
            RATE[ip] = hits + [now]
            RATE.move_to_end(ip)
            while len(RATE) > 2048:
                RATE.popitem(last=False)
        with DELIVERY_LOCK:
            try:
                with database() as connection:
                    previous = connection.execute('SELECT name, contact_type, contact, plan, delivered FROM leads WHERE id = ?', (record['submissionId'],)).fetchone()
                    identity = (record['name'], record['contactType'], record['contact'], record.get('plan', 'consultation'))
                    if previous:
                        if previous[:4] != identity:
                            return self.reply(409, {'ok': False})
                        if previous[4]:
                            return self.reply(200, {'ok': True})
                    else:
                        created = datetime.datetime.now(datetime.timezone.utc).isoformat()
                        connection.execute('INSERT INTO leads (id, created_at, name, contact_type, contact, plan) VALUES (?, ?, ?, ?, ?, ?)', (record['submissionId'], created, *identity))
                if not send_telegram(record):
                    return self.reply(502, {'ok': False})
                with database() as connection:
                    connection.execute('UPDATE leads SET delivered = 1 WHERE id = ?', (record['submissionId'],))
                return self.reply(200, {'ok': True})
            except sqlite3.Error:
                return self.reply(503, {'ok': False})


if __name__ == '__main__':
    os.umask(0o077)
    os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
    with database():
        pass
    if '--export' in sys.argv:
        with database() as connection:
            writer = csv.writer(sys.stdout)
            writer.writerow(['id', 'created_at', 'name', 'contact_type', 'contact', 'plan', 'delivered'])
            writer.writerows(connection.execute('SELECT * FROM leads ORDER BY created_at'))
    else:
        port = int(os.environ.get('LEADS_PORT', '4193'))
        ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
