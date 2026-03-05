/* ===================================================
   后台服务器 
   使用 Express 搭建 RESTful 接口
   =================================================== */

const express = require('express');
const fs = require('fs');
const path = require('path');
// MySQL 连接池
const db = require('./db');

const app = express();
const PORT = 3000;

// ── 中间件配置 ────────────────────────────────────
// 解析 JSON 请求体
app.use(express.json());

// 允许跨域请求（前端在不同端口）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-user');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 静态文件服务：提供项目根目录下的静态资源（CSS/JS/图片等）
app.use(express.static(path.join(__dirname, '..')));

// ── 数据文件路径 ────────────────────────────────────
const dataDir = path.join(__dirname, 'data');
const files = {
  users: path.join(dataDir, 'users.json'),
  news: path.join(dataDir, 'news.json'),
  trade: path.join(dataDir, 'trade.json'),
  lost: path.join(dataDir, 'lost.json'),
  forum: path.join(dataDir, 'forum.json'),
};

// ── 工具函数 ────────────────────────────────────
// 读取 JSON 文件
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
}

// 写入 JSON 文件
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 生成唯一 ID
function generateId() {
  return Date.now().toString();
}

// ── 用户认证 ────────────────────────────────────
// 注册
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ code: 400, msg: '用户名和密码不能为空' });
  }

  let users = readJSON(files.users);

  // 检查用户是否已存在
  if (users.some(u => u.username === username)) {
    return res.json({ code: 400, msg: '用户已存在' });
  }

  // 创建新用户
  const newUser = {
    id: generateId(),
    username,
    password, 
    createTime: new Date().toLocaleString('zh-CN'),
  };

  users.push(newUser);
  writeJSON(files.users, users);

  res.json({
    code: 0,
    msg: '注册成功',
    data: { username: newUser.username }
  });
});

// 登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ code: 400, msg: '用户名和密码不能为空' });
  }

  let users = readJSON(files.users);
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.json({ code: 401, msg: '用户名或密码错误' });
  }

  res.json({
    code: 0,
    msg: '登录成功',
    data: {
      username: user.username,
      id: user.id
    }
  });
});

// ── 校园资讯模块 ────────────────────────────────────
// 获取所有资讯
app.get('/api/news', (req, res) => {
  const news = readJSON(files.news);
  res.json({
    code: 0,
    msg: 'success',
    data: news
  });
});

// 发布资讯
app.post('/api/news', (req, res) => {
  const { title, content, type } = req.body;
  const username = req.headers['x-user'];

  if (!title || !content) {
    return res.json({ code: 400, msg: '标题和内容不能为空' });
  }

  let news = readJSON(files.news);

  const newItem = {
    id: generateId(),
    title,
    content,
    type: type || 'news',
    author: username || '匿名用户',
    createTime: new Date().toLocaleString('zh-CN'),
    likes: 0
  };

  news.push(newItem);
  writeJSON(files.news, news);

  res.json({
    code: 0,
    msg: '发布成功',
    data: newItem
  });
});

// 删除资讯
app.delete('/api/news/:id', (req, res) => {
  const { id } = req.params;
  let news = readJSON(files.news);

  const index = news.findIndex(n => n.id === id);
  if (index === -1) {
    return res.json({ code: 404, msg: '资讯不存在' });
  }

  news.splice(index, 1);
  writeJSON(files.news, news);

  res.json({
    code: 0,
    msg: '删除成功'
  });
});

// ── 二手交易模块 ────────────────────────────────────
// 获取所有交易
app.get('/api/trade', (req, res) => {
  const trade = readJSON(files.trade);
  res.json({
    code: 0,
    msg: 'success',
    data: trade
  });
});

// 发布交易
app.post('/api/trade', (req, res) => {
  const { title, content, price } = req.body;
  const username = req.headers['x-user'];

  if (!title || !content || !price) {
    return res.json({ code: 400, msg: '信息不完整' });
  }

  let trade = readJSON(files.trade);

  const newItem = {
    id: generateId(),
    title,
    content,
    price,
    author: username || '匿名用户',
    createTime: new Date().toLocaleString('zh-CN'),
  };

  trade.push(newItem);
  writeJSON(files.trade, trade);

  res.json({
    code: 0,
    msg: '发布成功',
    data: newItem
  });
});

// 删除交易
app.delete('/api/trade/:id', (req, res) => {
  const { id } = req.params;
  let trade = readJSON(files.trade);

  const index = trade.findIndex(t => t.id === id);
  if (index === -1) {
    return res.json({ code: 404, msg: '交易不存在' });
  }

  trade.splice(index, 1);
  writeJSON(files.trade, trade);

  res.json({
    code: 0,
    msg: '删除成功'
  });
});

// ── 失物招领模块 ────────────────────────────────────
// 获取所有失物
app.get('/api/lost', (req, res) => {
  const lost = readJSON(files.lost);
  res.json({
    code: 0,
    msg: 'success',
    data: lost
  });
});

// 发布失物
app.post('/api/lost', (req, res) => {
  const { title, content, location } = req.body;
  const username = req.headers['x-user'];

  if (!title || !content) {
    return res.json({ code: 400, msg: '标题和描述不能为空' });
  }

  let lost = readJSON(files.lost);

  const newItem = {
    id: generateId(),
    title,
    content,
    location: location || '未知地点',
    author: username || '匿名用户',
    createTime: new Date().toLocaleString('zh-CN'),
    found: false
  };

  lost.push(newItem);
  writeJSON(files.lost, lost);

  res.json({
    code: 0,
    msg: '发布成功',
    data: newItem
  });
});

// 标记已找到
app.post('/api/lost/:id/found', (req, res) => {
  const { id } = req.params;
  let lost = readJSON(files.lost);

  const item = lost.find(l => l.id === id);
  if (!item) {
    return res.json({ code: 404, msg: '失物不存在' });
  }

  item.found = true;
  writeJSON(files.lost, lost);

  res.json({
    code: 0,
    msg: '已标记为拾获'
  });
});

// 删除失物
app.delete('/api/lost/:id', (req, res) => {
  const { id } = req.params;
  let lost = readJSON(files.lost);

  const index = lost.findIndex(l => l.id === id);
  if (index === -1) {
    return res.json({ code: 404, msg: '失物不存在' });
  }

  lost.splice(index, 1);
  writeJSON(files.lost, lost);

  res.json({
    code: 0,
    msg: '删除成功'
  });
});

// ── 校园广场（论坛）模块 ────────────────────────────────────
// 获取所有帖子
app.get('/api/forum', (req, res) => {
  const forum = readJSON(files.forum);
  res.json({
    code: 0,
    msg: 'success',
    data: forum
  });
});

// 发布帖子
app.post('/api/forum', (req, res) => {
  const { title, content } = req.body;
  const username = req.headers['x-user'];

  if (!title || !content) {
    return res.json({ code: 400, msg: '标题和内容不能为空' });
  }

  let forum = readJSON(files.forum);

  const newPost = {
    id: generateId(),
    title,
    content,
    author: username || '匿名用户',
    createTime: new Date().toLocaleString('zh-CN'),
    replies: [],
    likes: 0
  };

  forum.push(newPost);
  writeJSON(files.forum, forum);

  res.json({
    code: 0,
    msg: '发布成功',
    data: newPost
  });
});

// 发布回复
app.post('/api/forum/:id/reply', (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const username = req.headers['x-user'];

  if (!content) {
    return res.json({ code: 400, msg: '回复内容不能为空' });
  }

  let forum = readJSON(files.forum);
  const post = forum.find(f => f.id === id);

  if (!post) {
    return res.json({ code: 404, msg: '帖子不存在' });
  }

  const reply = {
    id: generateId(),
    content,
    author: username || '匿名用户',
    createTime: new Date().toLocaleString('zh-CN')
  };

  post.replies = post.replies || [];
  post.replies.push(reply);
  writeJSON(files.forum, forum);

  res.json({
    code: 0,
    msg: '回复成功',
    data: reply
  });
});

// 删除帖子
app.delete('/api/forum/:id', (req, res) => {
  const { id } = req.params;
  let forum = readJSON(files.forum);

  const index = forum.findIndex(f => f.id === id);
  if (index === -1) {
    return res.json({ code: 404, msg: '帖子不存在' });
  }

  forum.splice(index, 1);
  writeJSON(files.forum, forum);

  res.json({
    code: 0,
    msg: '删除成功'
  });
});

// ── 服务器启动 ────────────────────────────────────
// 根路由：返回项目根目录的 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log('可用的 API 端点：');
  console.log('✓ POST  /api/register  - 用户注册');
  console.log('✓ POST  /api/login     - 用户登录');
  console.log('✓ GET   /api/news      - 获取资讯');
  console.log('✓ POST  /api/news      - 发布资讯');
  console.log('✓ POST  /api/trade     - 发布交易');
  console.log('✓ POST  /api/lost      - 发布失物');
  console.log('✓ POST  /api/forum     - 发布帖子');
  console.log('✓ POST  /api/forum/:id/reply - 发布回复');
});

/* ── 管理控制台通用 CRUD 路由（用于 admin.html） ───────────────────────── */
const allowedModules = {
  users: 'users',
  news: 'news',
  trade: 'trade',
  lost: 'lost',
  forum: 'forum'
};

// 列表（支持分页 & 简单搜索）
app.get('/admin/:module', async (req, res) => {
  const mod = req.params.module;
  if (!allowedModules[mod]) return res.json({ code: 400, msg: '未知模块' });
  try {
    const table = allowedModules[mod];
    const [rows] = await db.query(`SELECT * FROM \`${table}\` ORDER BY create_time DESC LIMIT 100`);
    // 小调整字段名一致性（后端统一用 create_time）
    const data = rows.map(r => ({ ...r }));
    res.json({ code: 0, msg: 'success', data });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 新增
app.post('/admin/:module', async (req, res) => {
  const mod = req.params.module;
  if (!allowedModules[mod]) return res.json({ code: 400, msg: '未知模块' });
  try {
    const table = allowedModules[mod];
    const body = req.body || {};
    let sql, params;
    switch (mod) {
      case 'users':
        sql = 'INSERT INTO users (username, nickname, password) VALUES (?, ?, ?)';
        params = [body.username || '', body.nickname || '', body.password || ''];
        break;
      case 'news':
        sql = 'INSERT INTO news (title, content, type, author) VALUES (?, ?, ?, ?)';
        params = [body.title || '', body.content || '', body.type || '', body.author || ''];
        break;
      case 'trade':
        sql = 'INSERT INTO trade (title, content, price, author) VALUES (?, ?, ?, ?)';
        params = [body.title || '', body.content || '', body.price || 0, body.author || ''];
        break;
      case 'lost':
        sql = 'INSERT INTO lost (title, content, location, author, found) VALUES (?, ?, ?, ?, ?)';
        params = [body.title || '', body.content || '', body.location || '', body.author || '', !!body.found];
        break;
      case 'forum':
        sql = 'INSERT INTO forum (title, content, author) VALUES (?, ?, ?)';
        params = [body.title || '', body.content || '', body.author || ''];
        break;
      default:
        return res.json({ code: 400, msg: '不支持的模块' });
    }
    const [result] = await db.execute(sql, params);
    res.json({ code: 0, msg: '新增成功', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 更新
app.put('/admin/:module/:id', async (req, res) => {
  const mod = req.params.module;
  const id = req.params.id;
  if (!allowedModules[mod]) return res.json({ code: 400, msg: '未知模块' });
  try {
    const body = req.body || {};
    let sql, params;
    switch (mod) {
      case 'users':
        sql = 'UPDATE users SET username=?, nickname=? WHERE id=?';
        params = [body.username || '', body.nickname || '', id];
        break;
      case 'news':
        sql = 'UPDATE news SET title=?, content=?, type=? WHERE id=?';
        params = [body.title || '', body.content || '', body.type || '', id];
        break;
      case 'trade':
        sql = 'UPDATE trade SET title=?, content=?, price=? WHERE id=?';
        params = [body.title || '', body.content || '', body.price || 0, id];
        break;
      case 'lost':
        sql = 'UPDATE lost SET title=?, content=?, location=?, found=? WHERE id=?';
        params = [body.title || '', body.content || '', body.location || '', !!body.found, id];
        break;
      case 'forum':
        sql = 'UPDATE forum SET title=?, content=? WHERE id=?';
        params = [body.title || '', body.content || '', id];
        break;
      default:
        return res.json({ code: 400, msg: '不支持的模块' });
    }
    await db.execute(sql, params);
    res.json({ code: 0, msg: '更新成功' });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 删除
app.delete('/admin/:module/:id', async (req, res) => {
  const mod = req.params.module;
  const id = req.params.id;
  if (!allowedModules[mod]) return res.json({ code: 400, msg: '未知模块' });
  try {
    const table = allowedModules[mod];
    await db.execute(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
    res.json({ code: 0, msg: '删除成功' });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

