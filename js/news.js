/* ===================================================
   news.js —— 校园资讯页逻辑
   =================================================== */

const TYPE_NAME = { notice: '校园通知', activity: '校园活动', lecture: '学术讲座' };
const TYPE_ICON = { notice: '📢', activity: '🎉', lecture: '🎓' };

let allNews   = [];  // 全部数据缓存
let curType   = 'all';

/* ── 初始化 ───────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', async () => {
  await loadNews();
  initTabs('newsTabs', (type) => { curType = type; renderNews(); });

  // 搜索框回车触发
  const searchInput = document.getElementById('news-search');
  if (searchInput) searchInput.addEventListener('keyup', e => { if (e.key === 'Enter') renderNews(); });
});

/* ── 加载数据 ─────────────────────────────────────*/
async function loadNews() {
  const res = await API.news.list();
  allNews = res.code === 200 ? res.data : [];
  renderNews();
}

/* ── 渲染列表 ─────────────────────────────────────*/
function renderNews() {
  const container = document.getElementById('newsList');
  const keyword   = (document.getElementById('news-search')?.value || '').trim().toLowerCase();

  let list = allNews
    .filter(i => curType === 'all' || i.type === curType)
    .filter(i => !keyword || i.title.toLowerCase().includes(keyword));

  if (!list.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📰</div><p>暂无资讯</p></div>';
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="news-card" onclick="openDetail(${item.id})">
      <div class="news-cover">${TYPE_ICON[item.type] || '📰'}</div>
      <div class="news-card-body">
        <div class="news-card-title">${item.title}</div>
        <div class="news-card-meta">
          <span class="badge badge-green">${TYPE_NAME[item.type] || item.type}</span>
          <span>${formatDate(item.createdAt)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/* ── 打开详情 ─────────────────────────────────────*/
function openDetail(id) {
  const item = allNews.find(i => i.id === id);
  if (!item) return;

  document.getElementById('detailTitle').textContent = item.title;
  document.getElementById('detailBody').innerHTML = `
    <div class="detail-meta">
      <span class="badge badge-green">${TYPE_NAME[item.type] || item.type}</span>
      <span>发布人：${item.nickname || item.username}</span>
      <span>${formatDate(item.createdAt)}</span>
    </div>
    <div class="detail-content">${item.content}</div>
    ${canDelete(item) ? `<button class="btn btn-danger btn-sm" style="margin-top:16px" onclick="deleteNews(${item.id})">删除</button>` : ''}
  `;
  openModal('newsDetailModal');
}

/* ── 发布资讯 ─────────────────────────────────────*/
async function submitNews() {
  const title   = document.getElementById('newsTitle').value.trim();
  const type    = document.getElementById('newsType').value;
  const content = document.getElementById('newsContent').value.trim();

  // 验证
  let ok = true;
  if (!title)          { showErr('newsTitleErr');   ok = false; }
  if (!type)           { showErr('newsTypeErr');    ok = false; }
  if (content.length < 10) { showErr('newsContentErr'); ok = false; }
  if (!ok) return;

  const user = Auth.getUser();
  const res  = await API.news.add({ title, type, content, username: user.username, nickname: user.nickname || user.username });

  if (res.code === 200) {
    showToast('发布成功！');
    closeModal('newsPublishModal');
    document.getElementById('newsTitle').value   = '';
    document.getElementById('newsType').value    = '';
    document.getElementById('newsContent').value = '';
    await loadNews();
  } else {
    showToast(res.msg || '发布失败', 'error');
  }
}

/* ── 删除资讯 ─────────────────────────────────────*/
async function deleteNews(id) {
  if (!confirm('确定删除这条资讯？')) return;
  const res = await API.news.remove(id);
  if (res.code === 200) {
    showToast('删除成功');
    closeModal('newsDetailModal');
    await loadNews();
  } else {
    showToast(res.msg || '删除失败', 'error');
  }
}

/* ── 工具函数 ─────────────────────────────────────*/
// 判断当前用户是否可以删除（自己发的才能删）
function canDelete(item) {
  const user = Auth.getUser();
  return user && user.username === item.username;
}

function showErr(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
  setTimeout(() => el && el.classList.remove('show'), 3000);
}

// 通用 Tab 初始化
function initTabs(tabsId, onChange) {
  document.querySelectorAll(`#${tabsId} .tab-btn`).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${tabsId} .tab-btn`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.type || btn.dataset.cat || 'all';
      onChange(type);
    });
  });
}