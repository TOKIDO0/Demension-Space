# Node.js 后端极简搭建指南（可直接照做）

## 1. 新建后端项目
- 在任意目录（建议与前端同级）创建 `server` 文件夹
- 进入该目录后执行：

```
npm init -y
npm i express cors multer bcrypt dotenv better-sqlite3
```

## 2. 创建基础结构
- 新建 `.env`：

```
PORT=9999
UPLOAD_DIR=uploads
```

- 新建 `server.js`（完整后端代码）：

```
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
```

## 3. 启动后端

```
node server.js
```

访问 `http://localhost:9999/`（API 端口显示在控制台）。

## 4. 前端对接
- 将前端 `public/app.js:4` 的 `API_BASE` 设置为你的后端地址：

```
const API_BASE = 'http://localhost:9999';
```

- 前端已对接以下接口：
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/user/detail/:username`
  - `PUT /api/user`（更新昵称/手机号/头像）
  - `POST /api/user/changePassword`
  - `GET /api/user/logout`
  - `POST /files/upload`、`GET /files/:flag`

## 5. 部署建议（可选）
- 将 `server` 部署到 Render/Railway 等平台，得到公共 URL
- 在前端将 `API_BASE` 改为该公共 URL，即可云端生效

## 6. 常见问题
- 端口占用：修改 `.env` 的 `PORT`
- 上传目录无权限：修改 `.env` 的 `UPLOAD_DIR`，确保目录可写
- 密码忘记：直接在数据库中重置（`better-sqlite3` 文件为 `data.db`）

