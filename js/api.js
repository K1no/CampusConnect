/* ===================================================
   api.js —— 统一后台请求封装
   =================================================== */

const BASE_URL = '';  // Nginx 代理，不需要端口

async function request(path, method = 'GET', body = null) {
  const user = Auth.getUser();
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
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

const API = {
  user: {
    register: (data) => request('/api/register', 'POST', data),
    login:    (data) => request('/api/login',    'POST', data),
  },
  news: {
    list:   ()     => request('/api/news'),
    add:    (data) => request('/api/news',        'POST',   data),
    remove: (id)   => request('/api/news/' + id,  'DELETE'),
  },
  trade: {
    list:   ()     => request('/api/trade'),
    add:    (data) => request('/api/trade',        'POST',   data),
    remove: (id)   => request('/api/trade/' + id,  'DELETE'),
  },
  lost: {
    list:   ()     => request('/api/lost'),
    add:    (data) => request('/api/lost',          'POST', data),
    remove: (id)   => request('/api/lost/' + id,    'DELETE'),
    found:  (id)   => request('/api/lost/' + id + '/found', 'POST'),
  },
  forum: {
    list:   ()         => request('/api/forum'),
    add:    (data)     => request('/api/forum',              'POST', data),
    remove: (id)       => request('/api/forum/' + id,        'DELETE'),
    reply:  (id, data) => request('/api/forum/' + id + '/reply', 'POST', data),
  },
};