/* ===================================================
   profile.js —— 个人中心交互逻辑
   =================================================== */

// 当前查看的发布类型（默认看资讯）
let currentTab = 'news';

// 缓存所有发布数据，避免重复请求
let myPosts = {
  news:  [],
  trade: [],
  lost:  [],
  forum: [],
};

// 每种类型对应的图标
const TAB_ICON = {
  news:  '📰',
  trade: '♻️',
  lost:  '🔍',
  forum: '💬',
};

/* ── 1. 页面初始化 ────────────────────────────────
   页面加载完成后自动执行
*/
document.addEventListener('DOMContentLoaded', () => {

  // 检查是否已登录，未登录跳转到登录页
  const user = Auth.getUser(); // Auth 在 main.js 里定义
  if (!user) {
    alert('请先登录');
    location.href = 'login.html';
    return;
  }

  // 渲染用户信息
  renderUserInfo(user);

  // 加载我发布的所有内容
  loadMyPosts(user.username);

  // 初始化 Tab 切换
  initTabs();
});

/* ── 2. 渲染用户信息 ──────────────────────────────
   把用户名、昵称填入页面对应位置
*/
function renderUserInfo(user) {
  const nickname = user.nickname || user.username;
  const initial  = nickname[0].toUpperCase(); // 取第一个字，转大写

  // 头像圆圈显示第一个字
  document.getElementById('avatarCircle').textContent   = initial;
  // 显示昵称
  document.getElementById('profileNickname').textContent = nickname;
  // 显示用户名（前面加 @）
  document.getElementById('profileUsername').textContent = '@' + user.username;

  // 把当前昵称填入编辑框，方便用户修改
  document.getElementById('newNickname').value = nickname;
}

/* ── 3. 加载我发布的内容 ──────────────────────────
   分别请求四个接口，筛选出当前用户发布的数据
*/
async function loadMyPosts(username) {
  // 同时发起四个请求（Promise.all 让四个请求并行，更快）
  const [newsRes, tradeRes, lostRes, forumRes] = await Promise.all([
    API.news.list(),
    API.trade.list(),
    API.lost.list(),
    API.forum.list(),
  ]);

  // 从返回数据中筛选出属于当前用户的内容
  // filter() 是数组方法，筛选满足条件的元素
  myPosts.news  = (newsRes.code  === 200 ? newsRes.data  : []).filter(i => i.username === username);
  myPosts.trade = (tradeRes.code === 200 ? tradeRes.data : []).filter(i => i.username === username);
  myPosts.lost  = (lostRes.code  === 200 ? lostRes.data  : []).filter(i => i.username === username);
  myPosts.forum = (forumRes.code === 200 ? forumRes.data : []).filter(i => i.username === username);

  // 更新统计数字
  document.getElementById('statNews').textContent  = myPosts.news.length;
  document.getElementById('statTrade').textContent = myPosts.trade.length;
  document.getElementById('statLost').textContent  = myPosts.lost.length;
  document.getElementById('statForum').textContent = myPosts.forum.length;

  // 渲染当前 Tab 的列表
  renderList();
}

/* ── 4. 渲染发布记录列表 ──────────────────────────
   根据 currentTab 显示对应类型的内容
*/
function renderList() {
  const container = document.getElementById('myPostsList');
  const list = myPosts[currentTab]; // 取当前 Tab 的数据

  // 没有数据时显示空状态
  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${TAB_ICON[currentTab]}</div>
        <p>还没有发布过${getTabName(currentTab)}内容</p>
      </div>
    `;
    return;
  }

  // 用 map() 把数据数组转换成 HTML 字符串数组，再用 join('') 拼接
  container.innerHTML = list.map(item => `
    <div class="post-item">
      <!-- 左边图标 -->
      <div class="post-icon">${TAB_ICON[currentTab]}</div>

      <!-- 中间文字信息 -->
      <div class="post-info">
        <div class="post-title">${item.title || item.content || '无标题'}</div>
        <div class="post-meta">
          <!-- formatDate 在 main.js 里定义，把时间格式化成"x分钟前"等 -->
          发布于 ${formatDate(item.createdAt)}
          <!-- 失物招领额外显示是否已找到 -->
          ${currentTab === 'lost' ? (item.found ? ' · <span style="color:#10b981">已找到</span>' : ' · <span style="color:#f59e0b">寻找中</span>') : ''}
        </div>
      </div>

      <!-- 右边删除按钮 -->
      <!-- 把 id 传给删除函数，这样知道要删哪一条 -->
      <button class="post-delete" onclick="deletePost(${item.id}, '${currentTab}')">删除</button>
    </div>
  `).join('');
}

/* ── 5. Tab 名称映射 ──────────────────────────────*/
function getTabName(type) {
  const names = { news: '资讯', trade: '交易', lost: '失物', forum: '广场' };
  return names[type] || '';
}

/* ── 6. 初始化 Tab 切换 ───────────────────────────
   给每个 Tab 按钮绑定点击事件
*/
function initTabs() {
  // querySelectorAll 找到所有 class 包含 tab-btn 的元素
  document.querySelectorAll('#profileTabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // 移除所有按钮的 active 样式
      document.querySelectorAll('#profileTabs .tab-btn').forEach(b => b.classList.remove('active'));
      // 给当前点击的按钮加上 active 样式
      btn.classList.add('active');
      // 更新当前 Tab，data-type 是 HTML 里自定义的属性
      currentTab = btn.dataset.type;
      // 重新渲染列表
      renderList();
    });
  });
}

/* ── 7. 删除发布内容 ──────────────────────────────
   id：要删除的内容 id
   type：类型（news / trade / lost / forum）
*/
async function deletePost(id, type) {
  // confirm() 弹出确认框，用户点取消则 return 不执行
  if (!confirm('确定要删除这条内容吗？')) return;

  // 根据类型调用对应的删除接口
  let res;
  if (type === 'news')  res = await API.news.remove(id);
  if (type === 'trade') res = await API.trade.remove(id);
  if (type === 'lost')  res = await API.lost.remove(id);
  if (type === 'forum') res = await API.forum.remove(id);

  if (res.code === 200) {
    showToast('删除成功');
    // 从本地缓存中也删掉这条数据（filter 返回不等于 id 的所有元素）
    myPosts[type] = myPosts[type].filter(i => i.id !== id);
    // 更新统计数字
    document.getElementById(`stat${capitalize(type)}`).textContent = myPosts[type].length;
    // 重新渲染列表
    renderList();
  } else {
    showToast(res.msg || '删除失败', 'error');
  }
}

// 首字母大写（news → News，用于拼接 statNews 等 id）
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ── 8. 修改昵称 ──────────────────────────────────*/
function updateNickname() {
  const newNickname = document.getElementById('newNickname').value.trim();
  const tip = document.getElementById('nicknameTip');

  // 验证
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

  // 从 localStorage 取出用户信息，修改昵称后重新存回去
  const user = Auth.getUser();
  user.nickname = newNickname;
  Auth.setUser(user); // Auth.setUser 在 main.js 里定义

  // 更新页面显示
  document.getElementById('profileNickname').textContent = newNickname;
  document.getElementById('avatarCircle').textContent    = newNickname[0].toUpperCase();

  // 显示成功提示
  tip.textContent = '修改成功！';
  tip.className = 'edit-tip success';

  // 2 秒后清空提示
  setTimeout(() => { tip.textContent = ''; }, 2000);

  showToast('昵称修改成功');
}

/* ── 9. 退出登录 ──────────────────────────────────*/
function logout() {
  if (!confirm('确定要退出登录吗？')) return;
  Auth.logout();           // 清除 localStorage 里的用户信息
  location.href = 'login.html'; // 跳转到登录页
}