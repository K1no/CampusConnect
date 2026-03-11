/* ===================================================
   profile.js —— 个人中心交互逻辑（完整修复版）
   修复：code===0、i.author匹配、create_time字段
   =================================================== */

let currentTab = 'news';

let myPosts = {
  news:  [],
  trade: [],
  lost:  [],
  forum: [],
};

const TAB_ICON = {
  news:  '📰',
  trade: '♻️',
  lost:  '🔍',
  forum: '💬',
};

const TAB_COLOR = {
  news:  '#3b82f6',
  trade: '#10b981',
  lost:  '#f59e0b',
  forum: '#8b5cf6',
};

document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.getUser();
  if (!user) {
    alert('请先登录');
    location.href = 'login.html';
    return;
  }
  renderUserInfo(user);
  loadMyPosts(user.username);
  initTabs();
});

function renderUserInfo(user) {
  const nickname = user.nickname || user.username;
  const initial  = nickname[0].toUpperCase();
  document.getElementById('avatarCircle').textContent    = initial;
  document.getElementById('profileNickname').textContent = nickname;
  document.getElementById('profileUsername').textContent = '@' + user.username;
  document.getElementById('newNickname').value           = nickname;
}

async function loadMyPosts(username) {
  const list = document.getElementById('myPostsList');
  list.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>加载中...</p></div>';

  const [newsRes, tradeRes, lostRes, forumRes] = await Promise.all([
    API.news.list(),
    API.trade.list(),
    API.lost.list(),
    API.forum.list(),
  ]);

  // ✅ 修复：code===0，字段用 author
  myPosts.news  = (newsRes.code  === 0 ? newsRes.data  : []).filter(i => i.author === username);
  myPosts.trade = (tradeRes.code === 0 ? tradeRes.data : []).filter(i => i.author === username);
  myPosts.lost  = (lostRes.code  === 0 ? lostRes.data  : []).filter(i => i.author === username);
  myPosts.forum = (forumRes.code === 0 ? forumRes.data : []).filter(i => i.author === username);

  document.getElementById('statNews').textContent  = myPosts.news.length;
  document.getElementById('statTrade').textContent = myPosts.trade.length;
  document.getElementById('statLost').textContent  = myPosts.lost.length;
  document.getElementById('statForum').textContent = myPosts.forum.length;

  renderList();
}

function renderList() {
  const container = document.getElementById('myPostsList');
  const list = myPosts[currentTab];

  if (!list || !list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${TAB_ICON[currentTab]}</div>
        <p>还没有发布过${getTabName(currentTab)}内容</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => {
    // 副标题根据类型显示不同信息
    let sub = '';
    if (currentTab === 'trade') sub = `<span class="post-price">¥${parseFloat(item.price||0).toFixed(2)}</span>`;
    if (currentTab === 'lost')  sub = item.found
      ? '<span class="post-badge found">已找到</span>'
      : '<span class="post-badge seeking">寻找中</span>';
    if (currentTab === 'forum') sub = `<span class="post-reply">💬 ${(item.replies||[]).length} 条回复</span>`;

    return `
      <div class="post-item">
        <div class="post-icon-wrap" style="background:${TAB_COLOR[currentTab]}22; color:${TAB_COLOR[currentTab]}">
          ${TAB_ICON[currentTab]}
        </div>
        <div class="post-info">
          <div class="post-title">${item.title || item.content || '无标题'}</div>
          <div class="post-meta-row">
            <span class="post-time">🕐 ${formatDate(item.create_time)}</span>
            ${sub}
          </div>
        </div>
        <button class="post-delete-btn" onclick="deletePost(${item.id}, '${currentTab}')">删除</button>
      </div>
    `;
  }).join('');
}

function getTabName(type) {
  return { news: '资讯', trade: '交易', lost: '失物', forum: '广场' }[type] || '';
}

function initTabs() {
  document.querySelectorAll('#profileTabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#profileTabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.type;
      renderList();
    });
  });
}

async function deletePost(id, type) {
  if (!confirm('确定要删除这条内容吗？')) return;
  let res;
  if (type === 'news')  res = await API.news.remove(id);
  if (type === 'trade') res = await API.trade.remove(id);
  if (type === 'lost')  res = await API.lost.remove(id);
  if (type === 'forum') res = await API.forum.remove(id);

  if (res && res.code === 0) {
    showToast('删除成功');
    myPosts[type] = myPosts[type].filter(i => i.id !== id);
    const key = 'stat' + type.charAt(0).toUpperCase() + type.slice(1);
    document.getElementById(key).textContent = myPosts[type].length;
    renderList();
  } else {
    showToast((res && res.msg) || '删除失败', 'error');
  }
}

function updateNickname() {
  const newNickname = document.getElementById('newNickname').value.trim();
  const tip = document.getElementById('nicknameTip');
  if (!newNickname) {
    tip.textContent = '昵称不能为空';
    tip.className = 'edit-tip error';
    return;
  }
  if (newNickname.length > 10) {
    tip.textContent = '昵称不能超过 10 个字';
    tip.className = 'edit-tip error';
    return;
  }
  const user = Auth.getUser();
  user.nickname = newNickname;
  Auth.setUser(user);
  document.getElementById('profileNickname').textContent = newNickname;
  document.getElementById('avatarCircle').textContent    = newNickname[0].toUpperCase();
  tip.textContent = '修改成功！';
  tip.className = 'edit-tip success';
  setTimeout(() => { tip.textContent = ''; }, 2000);
  showToast('昵称修改成功');
}

function logout() {
  if (!confirm('确定要退出登录吗？')) return;
  Auth.logout();
  location.href = 'login.html';
}