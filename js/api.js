/* ===================================================
   api.js —— 统一后台请求封装
   所有页面通过这里的方法调用后台接口
   =================================================== */

const BASE_URL = 'http://localhost:3000';

/* ── 基础请求函数 ──────────────────────────────────
   封装 fetch，统一处理请求头和错误
*/
async function request(path, method = 'GET', body = null) {
  const user = Auth.getUser();
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // 把当前用户名放在请求头，后台用来识别是谁在操作
      'x-user': user ? user.username : ''
    }
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res  = await fetch(BASE_URL + path, options);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('请求失败:', path, err);
    return { code: 500, msg: '网络错误，请检查后台是否启动' };
  }
}

/* ── API 方法集合 ──────────────────────────────────
   用法示例：
     const res = await API.news.list();
     const res = await API.news.add({ title, content, type });
     const res = await API.news.remove(id);
*/
const API = {

  // 用户相关
  user: {
    register: (data)   => request('/api/register', 'POST', data),
    login:    (data)   => request('/api/login',    'POST', data),
  },

  // 校园资讯
  news: {
    list:   ()     => request('/api/news'),
    add:    (data) => request('/api/news',    'POST',   data),
    remove: (id)   => request('/api/news/' + id, 'DELETE'),
  },

  // 二手交易
  trade: {
    list:   ()     => request('/api/trade'),
    add:    (data) => request('/api/trade',    'POST',   data),
    remove: (id)   => request('/api/trade/' + id, 'DELETE'),
  },

  // 失物招领
  lost: {
    list:    ()     => request('/api/lost'),
    add:     (data) => request('/api/lost',           'POST', data),
    remove:  (id)   => request('/api/lost/' + id,     'DELETE'),
    // 标记已找到
    found:   (id)   => request('/api/lost/' + id + '/found', 'POST'),
  },

  // 校园广场
  forum: {
    list:    ()          => request('/api/forum'),
    add:     (data)      => request('/api/forum',              'POST', data),
    remove:  (id)        => request('/api/forum/' + id,        'DELETE'),
    // 发布回复
    reply:   (id, data)  => request('/api/forum/' + id + '/reply', 'POST', data),
  },
};