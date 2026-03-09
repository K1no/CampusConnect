/* ===================================================
   后台服务器（完整修复版）
   修复：trade 接口支持 category / contact 字段
   =================================================== */

const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

// ── 中间件 ────────────────────────────────────────
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-user');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static(path.join(__dirname, '..')));

// ── 用户认证 ──────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({ code: 400, msg: '用户名和密码不能为空' });
  try {
    const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length > 0)
      return res.json({ code: 400, msg: '用户已存在' });
    await db.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
    res.json({ code: 0, msg: '注册成功', data: { username } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({ code: 400, msg: '用户名和密码不能为空' });
  try {
    const [rows] = await db.query(
      'SELECT id, username FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    if (rows.length === 0)
      return res.json({ code: 401, msg: '用户名或密码错误' });
    res.json({ code: 0, msg: '登录成功', data: { username: rows[0].username, id: rows[0].id } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ── 校园资讯 ──────────────────────────────────────
app.get('/api/news', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM news ORDER BY create_time DESC');
    res.json({ code: 0, msg: 'success', data: rows });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.post('/api/news', async (req, res) => {
  const { title, content, type } = req.body;
  const username = req.headers['x-user'] || '匿名用户';
  if (!title || !content)
    return res.json({ code: 400, msg: '标题和内容不能为空' });
  try {
    const [result] = await db.execute(
      'INSERT INTO news (title, content, type, author) VALUES (?, ?, ?, ?)',
      [title, content, type || 'news', username]
    );
    res.json({ code: 0, msg: '发布成功', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM news WHERE id = ?', [req.params.id]);
    res.json({ code: 0, msg: '删除成功' });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ── 二手交易（支持 category / contact）──────────
app.get('/api/trade', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM trade ORDER BY create_time DESC');
    res.json({ code: 0, msg: 'success', data: rows });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.post('/api/trade', async (req, res) => {
  const { title, content, price, category, contact } = req.body;
  const username = req.headers['x-user'] || '匿名用户';
  if (!title || !price)
    return res.json({ code: 400, msg: '商品名称和价格不能为空' });
  try {
    const [result] = await db.execute(
      'INSERT INTO trade (title, content, price, category, contact, author) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content || '', price, category || 'other', contact || '', username]
    );
    res.json({ code: 0, msg: '发布成功', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.delete('/api/trade/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM trade WHERE id = ?', [req.params.id]);
    res.json({ code: 0, msg: '删除成功' });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ── 失物招领 ──────────────────────────────────────
app.get('/api/lost', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lost ORDER BY create_time DESC');
    res.json({ code: 0, msg: 'success', data: rows });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.post('/api/lost', async (req, res) => {
  const { title, content, location } = req.body;
  const username = req.headers['x-user'] || '匿名用户';
  if (!title || !content)
    return res.json({ code: 400, msg: '标题和描述不能为空' });
  try {
    const [result] = await db.execute(
      'INSERT INTO lost (title, content, location, author) VALUES (?, ?, ?, ?)',
      [title, content, location || '未知地点', username]
    );
    res.json({ code: 0, msg: '发布成功', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.post('/api/lost/:id/found', async (req, res) => {
  try {
    await db.execute('UPDATE lost SET found = 1 WHERE id = ?', [req.params.id]);
    res.json({ code: 0, msg: '已标记为拾获' });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.delete('/api/lost/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM lost WHERE id = ?', [req.params.id]);
    res.json({ code: 0, msg: '删除成功' });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ── 校园广场 ──────────────────────────────────────
app.get('/api/forum', async (req, res) => {
  try {
    const [posts]   = await db.query('SELECT * FROM forum ORDER BY create_time DESC');
    const [replies] = await db.query('SELECT * FROM forum_replies ORDER BY create_time ASC');
    const data = posts.map(post => ({
      ...post,
      replies: replies.filter(r => r.post_id === post.id)
    }));
    res.json({ code: 0, msg: 'success', data });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.post('/api/forum', async (req, res) => {
  const { title, content } = req.body;
  const username = req.headers['x-user'] || '匿名用户';
  if (!title || !content)
    return res.json({ code: 400, msg: '标题和内容不能为空' });
  try {
    const [result] = await db.execute(
      'INSERT INTO forum (title, content, author) VALUES (?, ?, ?)',
      [title, content, username]
    );
    res.json({ code: 0, msg: '发布成功', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.post('/api/forum/:id/reply', async (req, res) => {
  const { content } = req.body;
  const username = req.headers['x-user'] || '匿名用户';
  if (!content)
    return res.json({ code: 400, msg: '回复内容不能为空' });
  try {
    const [result] = await db.execute(
      'INSERT INTO forum_replies (post_id, content, author) VALUES (?, ?, ?)',
      [req.params.id, content, username]
    );
    res.json({ code: 0, msg: '回复成功', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.delete('/api/forum/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM forum WHERE id = ?', [req.params.id]);
    res.json({ code: 0, msg: '删除成功' });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ── 管理后台 CRUD ─────────────────────────────────
const allowedModules = { users: 1, news: 1, trade: 1, lost: 1, forum: 1 };

app.get('/admin/:module', async (req, res) => {
  const mod = req.params.module;
  if (!allowedModules[mod]) return res.json({ code: 400, msg: '未知模块' });
  try {
    const [rows] = await db.query(`SELECT * FROM \`${mod}\` ORDER BY create_time DESC LIMIT 100`);
    res.json({ code: 0, msg: 'success', data: rows });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.post('/admin/:module', async (req, res) => {
  const mod = req.params.module;
  if (!allowedModules[mod]) return res.json({ code: 400, msg: '未知模块' });
  const body = req.body || {};
  try {
    let sql, params;
    switch (mod) {
      case 'users':  sql = 'INSERT INTO users (username, password) VALUES (?, ?)'; params = [body.username||'', body.password||'']; break;
      case 'news':   sql = 'INSERT INTO news (title, content, type, author) VALUES (?, ?, ?, ?)'; params = [body.title||'', body.content||'', body.type||'', body.author||'']; break;
      case 'trade':  sql = 'INSERT INTO trade (title, content, price, category, contact, author) VALUES (?, ?, ?, ?, ?, ?)'; params = [body.title||'', body.content||'', body.price||0, body.category||'other', body.contact||'', body.author||'']; break;
      case 'lost':   sql = 'INSERT INTO lost (title, content, location, author, found) VALUES (?, ?, ?, ?, ?)'; params = [body.title||'', body.content||'', body.location||'', body.author||'', !!body.found]; break;
      case 'forum':  sql = 'INSERT INTO forum (title, content, author) VALUES (?, ?, ?)'; params = [body.title||'', body.content||'', body.author||'']; break;
    }
    const [result] = await db.execute(sql, params);
    res.json({ code: 0, msg: '新增成功', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.put('/admin/:module/:id', async (req, res) => {
  const mod = req.params.module;
  const id  = req.params.id;
  if (!allowedModules[mod]) return res.json({ code: 400, msg: '未知模块' });
  const body = req.body || {};
  try {
    let sql, params;
    switch (mod) {
      case 'users':  sql = 'UPDATE users SET username=?, password=? WHERE id=?'; params = [body.username||'', body.password||'', id]; break;
      case 'news':   sql = 'UPDATE news SET title=?, content=?, type=? WHERE id=?'; params = [body.title||'', body.content||'', body.type||'', id]; break;
      case 'trade':  sql = 'UPDATE trade SET title=?, content=?, price=?, category=?, contact=? WHERE id=?'; params = [body.title||'', body.content||'', body.price||0, body.category||'other', body.contact||'', id]; break;
      case 'lost':   sql = 'UPDATE lost SET title=?, content=?, location=?, found=? WHERE id=?'; params = [body.title||'', body.content||'', body.location||'', !!body.found, id]; break;
      case 'forum':  sql = 'UPDATE forum SET title=?, content=? WHERE id=?'; params = [body.title||'', body.content||'', id]; break;
    }
    await db.execute(sql, params);
    res.json({ code: 0, msg: '更新成功' });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误' });
  }
});

app.delete('/admin/:module/:id', async (req, res) => {
  const mod = req.params.module;
  if (!allowedModules[mod]) return res.json({ code: 400, msg: '未知模块' });
  try {
    await db.execute(`DELETE FROM \`${mod}\` WHERE id = ?`, [req.params.id]);
    res.json({ code: 0, msg: '删除成功' });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ── 启动 ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});