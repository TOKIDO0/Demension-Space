const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const Database = require('better-sqlite3');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

const PORT = process.env.PORT || 9999;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(__dirname, 'data.db'));
db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  password_hash TEXT,
  avatar TEXT,
  nickName TEXT
)`).run();

function getUserByEmail(email){ return db.prepare('SELECT * FROM users WHERE email = ?').get(email); }
function getUserByUsername(username){ return db.prepare('SELECT * FROM users WHERE username = ?').get(username); }
function getUserById(id){ return db.prepare('SELECT * FROM users WHERE id = ?').get(id); }
function insertUser(u){ return db.prepare('INSERT INTO users (username,email,phone,password_hash,avatar,nickName) VALUES (?,?,?,?,?,?)').run(u.username,u.email,u.phone,u.password_hash,u.avatar||'',u.nickName||u.username); }
function updateUser(u){ return db.prepare('UPDATE users SET username=?, phone=?, avatar=?, nickName=? WHERE email=?').run(u.username,u.phone,u.avatar,u.nickName,u.email); }
function updatePassword(email, hash){ return db.prepare('UPDATE users SET password_hash=? WHERE email=?').run(hash,email); }

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const name = `${Date.now()}-${file.originalname}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// 注册
app.post('/api/auth/register', async (req, res) => {
  const { email, password, username, phone } = req.body || {};
  if (!email || !password || !username) return res.status(400).json({ error: 'invalid_params' });
  if (getUserByEmail(email)) return res.status(409).json({ error: 'user_already_exists' });
  const password_hash = await bcrypt.hash(password, 10);
  insertUser({ email, password_hash, username, phone, avatar: '', nickName: username });
  res.json({ ok: true });
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const u = getUserByEmail(email);
  if (!u) return res.status(404).json({ error: 'not_found' });
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: 'bad_password' });
  res.json({ user: { id: u.id, email: u.email } });
});

// 用户详情（按用户名）
app.get('/api/user/detail/:username', (req, res) => {
  const u = getUserByUsername(req.params.username);
  if (!u) return res.status(404).json({ code: '-1', msg: 'not_found' });
  res.json({ code: '0', data: u });
});

// 更新资料（nickName/phone/avatar）
app.put('/api/user', (req, res) => {
  const { email, username, phone, avatar, nickName } = req.body || {};
  if (!email) return res.json({ code: '-1', msg: 'missing_email' });
  const u = getUserByEmail(email);
  if (!u) return res.json({ code: '-1', msg: 'not_found' });
  updateUser({ email, username: username || u.username, phone: phone ?? u.phone, avatar: avatar ?? u.avatar, nickName: nickName ?? u.nickName });
  res.json({ code: '0', msg: '成功' });
});

// 修改密码
app.post('/api/user/changePassword', async (req, res) => {
  const { username, password, newPassword } = req.body || {};
  const u = getUserByUsername(username);
  if (!u) return res.json({ code: '-1', msg: 'not_found' });
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.json({ code: '-1', msg: '密码错误' });
  const hash = await bcrypt.hash(newPassword, 10);
  updatePassword(u.email, hash);
  res.json({ code: '0', msg: '成功' });
});

// 登出（占位）
app.get('/api/user/logout', (_, res) => res.json({ code: '0', msg: '成功' }));

// 文件上传与获取
app.post('/files/upload', upload.single('file'), (req, res) => {
  const name = req.file.filename;
  const flag = name.split('-')[0];
  res.json({ code: '0', data: flag });
});
app.get('/files/:flag', (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR);
  const file = files.find(f => f.startsWith(req.params.flag + '-'));
  if (!file) return res.status(404).end();
  res.sendFile(path.resolve(UPLOAD_DIR, file));
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));