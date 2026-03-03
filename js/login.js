/* ===================================================
   login.js —— 登录/注册页的交互逻辑
   JS 的作用：让页面"动"起来
   =================================================== */

// 后台服务地址，和 server.js 里的端口一致
const BASE_URL = 'http://localhost:3000';

/* ── 1. Tab 切换 ──────────────────────────────────
   点击"登录"或"注册"时调用这个函数
   tab 参数：'login' 或 'register'
*/
function switchTab(tab) {
  // 通过 id 找到对应的表单和按钮
  const formLogin    = document.getElementById('formLogin');
  const formRegister = document.getElementById('formRegister');
  const tabLogin     = document.getElementById('tabLogin');
  const tabRegister  = document.getElementById('tabRegister');

  if (tab === 'login') {
    // 显示登录表单，隐藏注册表单
    formLogin.style.display    = 'block';
    formRegister.style.display = 'none';
    // 登录按钮加 active 样式，注册按钮去掉
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    // 显示注册表单，隐藏登录表单
    formLogin.style.display    = 'none';
    formRegister.style.display = 'block';
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
}

/* ── 2. 显示/清除错误提示 ─────────────────────────
   把重复的操作封装成函数，避免写很多重复代码
*/
function showErr(id, msg) {
  document.getElementById(id).textContent = msg;
}
function clearErr(id) {
  document.getElementById(id).textContent = '';
}

/* ── 3. 登录逻辑 ──────────────────────────────────
   点击登录按钮时调用
*/
async function handleLogin() {
  // 获取输入框的值，trim() 去掉首尾空格
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  // 先清空所有错误提示
  clearErr('usernameErr');
  clearErr('passwordErr');

  // 表单验证：检查是否填写了必填项
  let valid = true;

  if (!username) {
    showErr('usernameErr', '用户名不能为空');
    valid = false;
  }
  if (!password) {
    showErr('passwordErr', '密码不能为空');
    valid = false;
  }
  if (password.length > 0 && password.length < 6) {
    showErr('passwordErr', '密码至少 6 位');
    valid = false;
  }

  // 验证不通过，停止执行
  if (!valid) return;

  // 验证通过，向后台发送登录请求
  try {
    // fetch 是浏览器内置的请求方法
    const response = await fetch(BASE_URL + '/api/login', {
      method: 'POST',                              // POST 请求
      headers: { 'Content-Type': 'application/json' }, // 告诉后台发的是 JSON 数据
      body: JSON.stringify({ username, password }) // 把数据转成 JSON 字符串发送
    });

    // 把后台返回的数据解析成 JS 对象
    const result = await response.json();

    if (result.code === 200) {
      // 登录成功：把用户信息保存到 localStorage（浏览器本地存储）
      // 这样其他页面也能读到登录状态
      localStorage.setItem('cc_user', JSON.stringify(result.data));

      // 跳转到首页
      location.href = 'index.html';
    } else {
      // 登录失败：显示后台返回的错误信息
      showErr('passwordErr', result.msg || '用户名或密码错误');
    }

  } catch (error) {
    // 网络请求失败（比如后台没启动）
    showErr('passwordErr', '网络错误，请检查后台是否启动');
    console.error('登录请求失败:', error);
  }
}

/* ── 4. 注册逻辑 ──────────────────────────────────
   点击注册按钮时调用
*/
async function handleRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const nickname = document.getElementById('regNickname').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const confirm  = document.getElementById('regConfirm').value.trim();

  // 清空所有错误提示
  clearErr('regUsernameErr');
  clearErr('regNicknameErr');
  clearErr('regPasswordErr');
  clearErr('regConfirmErr');

  // 表单验证
  let valid = true;

  if (!username) {
    showErr('regUsernameErr', '用户名不能为空');
    valid = false;
  } else if (username.length < 2 || username.length > 10) {
    showErr('regUsernameErr', '用户名长度 2-10 个字符');
    valid = false;
  }

  if (!nickname) {
    showErr('regNicknameErr', '昵称不能为空');
    valid = false;
  }

  if (!password) {
    showErr('regPasswordErr', '密码不能为空');
    valid = false;
  } else if (password.length < 6) {
    showErr('regPasswordErr', '密码至少 6 位');
    valid = false;
  }

  if (!confirm) {
    showErr('regConfirmErr', '请再输入一次密码');
    valid = false;
  } else if (confirm !== password) {
    // 两次密码不一致
    showErr('regConfirmErr', '两次密码不一致');
    valid = false;
  }

  if (!valid) return;

  // 发送注册请求
  try {
    const response = await fetch(BASE_URL + '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, nickname, password })
    });

    const result = await response.json();

    if (result.code === 200) {
      // 注册成功，切换到登录 Tab，提示用户去登录
      alert('注册成功！请登录');
      switchTab('login');
      // 把刚注册的用户名填到登录框，方便用户
      document.getElementById('username').value = username;
    } else {
      showErr('regUsernameErr', result.msg || '注册失败');
    }

  } catch (error) {
    showErr('regUsernameErr', '网络错误，请检查后台是否启动');
    console.error('注册请求失败:', error);
  }
}

/* ── 5. 页面加载时检查是否已登录 ─────────────────
   如果已经登录了，直接跳转首页，不用再登录
*/
window.onload = function () {
  const user = localStorage.getItem('cc_user');
  if (user) {
    location.href = 'index.html';
  }

  // 检查 URL 参数，如果带了 ?tab=register 就自动切到注册
  // 例如：login.html?tab=register
  const params = new URLSearchParams(location.search);
  if (params.get('tab') === 'register') {
    switchTab('register');
  }
};