const express = require('express');
const https = require('https');
const path = require('path');
const selfsigned = require('selfsigned');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { getFile, putFile } = require('./api/_lib/github');
const { encryptJson, decryptJson } = require('./api/_lib/crypto');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_env';
const DB_PATH = path.join(__dirname, 'data.sqlite');
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USER_DATA_ENC_KEY = process.env.USER_DATA_ENC_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE;

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_login TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS password_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

function issueSession(res, user) {
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const key = parts.shift().trim();
    const value = decodeURIComponent(parts.join('='));
    list[key] = value;
  });
  return list;
}

async function supabaseGetByEmail(url, key, email) {
  const q = new URLSearchParams({ select: 'id', email: `eq.${email}` }).toString();
  const resp = await fetch(`${url}/rest/v1/web_users?${q}`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  if (!resp.ok) throw new Error(`supabase_get ${resp.status}`);
  const json = await resp.json();
  return Array.isArray(json) && json[0] ? json[0] : null;
}

async function supabaseInsertUser(url, key, record) {
  const resp = await fetch(`${url}/rest/v1/web_users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(record)
  });
  if (!resp.ok) throw new Error(`supabase_insert ${resp.status}`);
  const json = await resp.json();
  return json && json[0];
}

async function supabaseGetUser(url, key, email) {
  const q = new URLSearchParams({ email: `eq.${email}`, select: '*' }).toString();
  const resp = await fetch(`${url}/rest/v1/web_users?${q}`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  if (!resp.ok) throw new Error(`supabase_get ${resp.status}`);
  const json = await resp.json();
  return Array.isArray(json) && json[0] ? json[0] : null;
}

async function supabaseUpdate(url, key, id, patch) {
  const q = new URLSearchParams({ id: `eq.${id}` }).toString();
  const resp = await fetch(`${url}/rest/v1/web_users?${q}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(patch)
  });
  if (!resp.ok) throw new Error(`supabase_update ${resp.status}`);
  const json = await resp.json();
  return Array.isArray(json) && json[0] ? json[0] : null;
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, phone } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'invalid_input' });
    }
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      console.log('register', { email, storage: 'supabase' });
      const existing = await supabaseGetByEmail(SUPABASE_URL, SUPABASE_SERVICE_KEY, email);
      if (existing) return res.status(409).json({ error: 'user_already_exists' });
      const password_hash = bcrypt.hashSync(password, 12);
      const row = await supabaseInsertUser(SUPABASE_URL, SUPABASE_SERVICE_KEY, { email, username: username || email.split('@')[0], phone: phone || '', password_hash });
      return res.json({ user: { id: row.id, email } });
    }
    if (GITHUB_OWNER && GITHUB_REPO && GITHUB_TOKEN && USER_DATA_ENC_KEY) {
      console.log('register', { email, storage: 'github' });
      const id = Buffer.from(`${email}`).toString('base64url');
      const pathGit = `users/${id}.json`;
      const existing = await getFile(GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, pathGit, GITHUB_TOKEN);
      if (existing) return res.status(409).json({ error: 'user_already_exists' });
      const now = new Date().toISOString();
      const password_hash = bcrypt.hashSync(password, 12);
      const record = { id, email, username: username || email.split('@')[0], phone: phone || '', password_hash, created_at: now, failed_login_attempts: 0, status: 'active' };
      const bundle = encryptJson(record, USER_DATA_ENC_KEY);
      const content = JSON.stringify({ enc: true, ...bundle });
      await putFile(GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, pathGit, content, `register ${email}`, GITHUB_TOKEN);
      return res.json({ user: { id, email } });
    }
    console.log('register', { email, storage: 'sqlite' });
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
      if (err) return res.status(500).json({ error: 'db_error' });
      if (row) return res.status(409).json({ error: 'user_already_exists' });
      const now = new Date().toISOString();
      const password_hash = bcrypt.hashSync(password, 12);
      db.run('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)', [email, password_hash, now], function (err2) {
        if (err2) return res.status(500).json({ error: 'db_error' });
        return res.json({ user: { id: this.lastID, email } });
      });
    });
  } catch (e) {
    console.error('register_failed', e.message);
    return res.status(500).json({ error: 'register_failed' });
  }
});

app.post('/api/auth/login/start', async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string') return res.status(400).json({ error: 'invalid_input' });
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      console.log('login_start', { email, storage: 'supabase' });
      const existing = await supabaseGetByEmail(SUPABASE_URL, SUPABASE_SERVICE_KEY, email);
      if (!existing) return res.status(404).json({ error: 'not_found', message: '您还没有账户，请先注册' });
      return res.json({ ok: true });
    }
    if (GITHUB_OWNER && GITHUB_REPO && GITHUB_TOKEN) {
      console.log('login_start', { email, storage: 'github' });
      const id = Buffer.from(`${email}`).toString('base64url');
      const pathGit = `users/${id}.json`;
      const existing = await getFile(GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, pathGit, GITHUB_TOKEN);
      if (!existing) return res.status(404).json({ error: 'not_found', message: '您还没有账户，请先注册' });
      return res.json({ ok: true });
    }
    console.log('login_start', { email, storage: 'sqlite' });
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
      if (err) return res.status(500).json({ error: 'db_error' });
      if (!row) return res.status(404).json({ error: 'not_found', message: '您还没有账户，请先注册' });
      return res.json({ ok: true });
    });
  } catch (e) {
    console.error('login_start_failed', e.message);
    return res.status(500).json({ error: 'login_start_failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'invalid_input' });
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      console.log('login', { email, storage: 'supabase' });
      const row = await supabaseGetUser(SUPABASE_URL, SUPABASE_SERVICE_KEY, email);
      if (!row) return res.status(404).json({ error: 'not_found', message: '您还没有账户，请先注册' });
      const ok = bcrypt.compareSync(password, row.password_hash);
      if (!ok) {
        await supabaseUpdate(SUPABASE_URL, SUPABASE_SERVICE_KEY, row.id, { failed_login_attempts: (row.failed_login_attempts || 0) + 1 });
        return res.status(401).json({ error: 'invalid_credentials' });
      }
      const now = new Date().toISOString();
      await supabaseUpdate(SUPABASE_URL, SUPABASE_SERVICE_KEY, row.id, { failed_login_attempts: 0, last_login: now });
      issueSession(res, { id: row.id, email: row.email });
      return res.json({ user: { id: row.id, email: row.email } });
    }
    if (GITHUB_OWNER && GITHUB_REPO && GITHUB_TOKEN && USER_DATA_ENC_KEY) {
      console.log('login', { email, storage: 'github' });
      const id = Buffer.from(`${email}`).toString('base64url');
      const pathGit = `users/${id}.json`;
      const existing = await getFile(GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, pathGit, GITHUB_TOKEN);
      if (!existing) return res.status(404).json({ error: 'not_found', message: '您还没有账户，请先注册' });
      const dataText = Buffer.from(existing.content, 'base64').toString();
      const dataJson = JSON.parse(dataText);
      const record = decryptJson(dataJson, USER_DATA_ENC_KEY);
      if (!bcrypt.compareSync(password, record.password_hash)) {
        record.failed_login_attempts = (record.failed_login_attempts || 0) + 1;
        const contentNew = JSON.stringify(encryptJson(record, USER_DATA_ENC_KEY));
        await putFile(GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, pathGit, contentNew, `login_fail ${email}`, GITHUB_TOKEN, existing.sha);
        return res.status(401).json({ error: 'invalid_credentials' });
      }
      record.failed_login_attempts = 0;
      const now = new Date().toISOString();
      record.last_login = now;
      const contentNew = JSON.stringify(encryptJson(record, USER_DATA_ENC_KEY));
      await putFile(GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, pathGit, contentNew, `login_ok ${email}`, GITHUB_TOKEN, existing.sha);
      issueSession(res, { id: record.id, email: record.email });
      return res.json({ user: { id: record.id, email: record.email } });
    }
    console.log('login', { email, storage: 'sqlite' });
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: 'db_error' });
      if (!user) return res.status(404).json({ error: 'not_found', message: '您还没有账户，请先注册' });
      const ok = bcrypt.compareSync(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
      const now = new Date().toISOString();
      db.run('UPDATE users SET last_login = ? WHERE id = ?', [now, user.id]);
      issueSession(res, user);
      return res.json({ user: { id: user.id, email: user.email } });
    });
  } catch (e) {
    console.error('login_failed', e.message);
    return res.status(500).json({ error: 'login_failed' });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies['session'];
    if (!token) return res.status(401).json({ error: 'no_session' });
    const payload = jwt.verify(token, JWT_SECRET);
    db.get('SELECT id, email, last_login, created_at FROM users WHERE id = ?', [payload.sub], (err, user) => {
      if (err) return res.status(500).json({ error: 'db_error' });
      if (!user) return res.status(404).json({ error: 'not_found' });
      return res.json({ user });
    });
  } catch (e) {
    return res.status(401).json({ error: 'invalid_session' });
  }
});

app.post('/api/auth/request-reset', async (req, res) => {
  const { email } = req.body;
  if (typeof email !== 'string') return res.status(400).json({ error: 'invalid_input' });
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    if (!user) return res.status(404).json({ error: 'not_found' });
    const token = cryptoRandom();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.run('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, token, expires], async (err2) => {
      if (err2) return res.status(500).json({ error: 'db_error' });
      try {
        const transporter = nodemailer.createTransport(process.env.SMTP_URL || { jsonTransport: true });
        const resetLink = `https://localhost:3443/reset?token=${encodeURIComponent(token)}`;
        await transporter.sendMail({
          from: process.env.MAIL_FROM || 'no-reply@example.com',
          to: email,
          subject: '密码重置',
          text: `点击以下链接在1小时内重置密码：${resetLink}`
        });
      } catch (e) {}
      return res.json({ ok: true });
    });
  });
});

app.post('/api/auth/reset', (req, res) => {
  const { token, password } = req.body;
  if (typeof token !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'invalid_input' });
  db.get('SELECT * FROM password_resets WHERE token = ?', [token], (err, pr) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    if (!pr) return res.status(404).json({ error: 'invalid_token' });
    if (new Date(pr.expires_at).getTime() < Date.now()) return res.status(410).json({ error: 'token_expired' });
    db.all('SELECT password_hash FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 3', [pr.user_id], (err2, rows) => {
      if (err2) return res.status(500).json({ error: 'db_error' });
      for (const r of rows) {
        if (bcrypt.compareSync(password, r.password_hash)) {
          return res.status(400).json({ error: 'password_recently_used' });
        }
      }
      db.get('SELECT * FROM users WHERE id = ?', [pr.user_id], (err3, user) => {
        if (err3 || !user) return res.status(500).json({ error: 'db_error' });
        const newHash = bcrypt.hashSync(password, 12);
        const now = new Date().toISOString();
        db.run('INSERT INTO password_history (user_id, password_hash, created_at) VALUES (?, ?, ?)', [user.id, user.password_hash, now]);
        db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id], (err4) => {
          if (err4) return res.status(500).json({ error: 'db_error' });
          db.run('DELETE FROM password_resets WHERE id = ?', [pr.id]);
          return res.json({ ok: true });
        });
      });
    });
  });
});

function cryptoRandom() {
  return (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 48);
}

const pems = selfsigned.generate(null, { days: 365 });
const server = https.createServer({ key: pems.private, cert: pems.cert }, app);

const PORT = 3443;
server.listen(PORT, () => {
  console.log(`HTTPS server listening on https://localhost:${PORT}`);
});
