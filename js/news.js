/* ===================================================
   news.js —— 校园资讯页逻辑（已修复）
   =================================================== */

const TYPE_NAME = { notice: '📢 校园通知', activity: '🎉 校园活动', lecture: '🎓 学术讲座', news: '📰 资讯' };

let allNews  = [];
let curType  = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  await loadNews();
  initTabs('newsTabs', (type) => { curType = type; renderNews(); });
  const s = document.getElementById('news-search');
  if (s) s.addEventListener('keyup', e => { if (e.key === 'Enter') renderNews(); });
  if (typeof initNav === 'function') initNav();
});

async function loadNews() {
  const res = await API.news.list();
  allNews   = res.code === 0 ? res.data : [];
  renderNews();
}

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
    <div class="news-card" onclick="openNewsDetail(${item.id})">
      <div class="news-cover">📰</div>
      <div class="news-card-body">
        <div class="news-card-title">${item.title}</div>
        <div class="news-card-meta">
          <span class="badge badge-green">${TYPE_NAME[item.type] || item.type}</span>
          <span>${formatDate(item.create_time)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function openNewsDetail(id) {
  const item = allNews.find(i => i.id == id);
  if (!item) return;
  document.getElementById('newsDetailTitle').textContent = item.title;
  document.getElementById('newsDetailBody').innerHTML = `
    <div class="detail-meta">
      <span>${TYPE_NAME[item.type] || item.type}</span>
      <span>👤 ${item.author || '匿名'}</span>
      <span>${formatDate(item.create_time)}</span>
    </div>
    <div class="detail-content">${item.content}</div>
    ${canDelete(item) ? `<button class="btn btn-danger btn-sm" style="margin-top:16px" onclick="deleteNews(${item.id})">删除</button>` : ''}
  `;
  openModal('newsDetailModal');
}

async function submitNews() {
  const title   = document.getElementById('newsTitle').value.trim();
  const type    = document.getElementById('newsType').value;
  const content = document.getElementById('newsContent').value.trim();

  let ok = true;
  if (!title)            { showErr('newsTitleErr');   ok = false; }
  if (!type)             { showErr('newsTypeErr');    ok = false; }
  if (content.length < 10) { showErr('newsContentErr'); ok = false; }
  if (!ok) return;

  const res = await API.news.add({ title, type, content });

  if (res.code === 0) {
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

async function deleteNews(id) {
  if (!confirm('确定删除这条资讯？')) return;
  const res = await API.news.remove(id);
  if (res.code === 0) {
    showToast('删除成功');
    closeModal('newsDetailModal');
    await loadNews();
  } else {
    showToast(res.msg || '删除失败', 'error');
  }
}

function canDelete(item) {
  const user = Auth.getUser();
  return user && user.username === (item.author || item.username);
}

function showErr(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
  setTimeout(() => el && el.classList.remove('show'), 3000);
}

function initTabs(tabsId, onChange) {
  document.querySelectorAll(`#${tabsId} .tab-btn`).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${tabsId} .tab-btn`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.type || 'all');
    });
  });
}