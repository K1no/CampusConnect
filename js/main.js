/* ===================================================
   main.js —— 全站公共逻辑
   每个页面都引入这个文件
   包含：Auth登录状态、弹窗控制、Toast提示、导航高亮
   =================================================== */

/* ── 1. Auth：登录状态管理 ────────────────────────
   用 localStorage 存储登录信息
   key: 'cc_user'，value: JSON字符串
*/
const Auth = {
  // 获取当前登录用户，未登录返回 null
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('cc_user'));
    } catch {
      return null;
    }
  },
  // 保存用户信息（登录成功后调用）
  setUser(user) {
    localStorage.setItem('cc_user', JSON.stringify(user));
  },
  // 退出登录（清除本地存储）
  logout() {
    localStorage.removeItem('cc_user');
  },
  // 是否已登录
  isLoggedIn() {
    return !!this.getUser();
  }
};

/* ── 2. requireLogin：需要登录才能操作 ────────────
   用法：requireLogin(() => openModal('publishModal'))
   未登录时跳转登录页，已登录时执行回调函数
*/
function requireLogin(callback) {
  if (!Auth.isLoggedIn()) {
    showToast('请先登录', 'info');
    setTimeout(() => { location.href = 'login.html'; }, 800);
    return;
  }
  if (typeof callback === 'function') callback();
}

/* ── 3. 弹窗控制 ──────────────────────────────────
   openModal('modalId')  打开弹窗
   closeModal('modalId') 关闭弹窗
*/
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

// 点击遮罩层关闭弹窗
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('show');
  }
});

/* ── 4. Toast 轻提示 ──────────────────────────────
   showToast('操作成功')           绿色提示（默认）
   showToast('操作失败', 'error')  红色提示
   showToast('请先登录', 'info')   蓝色提示
*/
function showToast(msg, type = 'success', duration = 2500) {
  // 确保容器存在
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);

  // 到时间自动消失
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ── 5. 格式化时间 ────────────────────────────────
   把 ISO 时间字符串转成"x分钟前"、"x小时前"等
   用法：formatDate('2026-03-01T10:00:00') → "3天前"
*/
function formatDate(dateStr) {
  if (!dateStr) return '';
  const now  = Date.now();
  const past = new Date(dateStr).getTime();
  const diff = Math.floor((now - past) / 1000); // 秒数差

  if (diff < 60)     return '刚刚';
  if (diff < 3600)   return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400)  return Math.floor(diff / 3600) + '小时前';
  if (diff < 604800) return Math.floor(diff / 86400) + '天前';

  // 超过7天显示具体日期
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

/* ── 6. 渲染导航栏用户区域 ────────────────────────
   未登录：显示"登录/注册"按钮
   已登录：显示头像 + 昵称 + 个人中心链接
*/
function renderNavUser() {
  const area = document.getElementById('nav-user-area');
  if (!area) return;

  const user = Auth.getUser();
  if (!user) {
    area.innerHTML = `
      <a href="login.html" class="btn btn-outline btn-sm">登录 / 注册</a>
    `;
  } else {
    const nickname = user.nickname || user.username;
    const initial  = nickname[0].toUpperCase();
    area.innerHTML = `
      <a href="profile.html" class="nav-user">
        <div class="nav-avatar">${initial}</div>
        <span>${nickname}</span>
      </a>
    `;
  }
}

/* ── 7. 导航链接高亮 ──────────────────────────────
   根据当前页面 URL 给对应导航链接加 active 样式
*/
function highlightNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });
}

/* ── 8. 页面加载完成后执行 ────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {
  renderNavUser();
  highlightNav();
});