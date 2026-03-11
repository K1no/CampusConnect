/* ===================================================
   news.js —— 校园资讯页逻辑（修复+样式优化版）
   修复：code===0，create_time字段
   =================================================== */

const TYPE_NAME = { notice: '校园通知', activity: '校园活动', lecture: '学术讲座' };
const TYPE_ICON = { notice: '📢', activity: '🎉', lecture: '🎓' };
const TYPE_COLOR = { notice: '#3b82f6', activity: '#10b981', lecture: '#8b5cf6' };

let allNews = [];
let curType = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  await loadNews();
  initTabs('newsTabs', (type) => { curType = type; renderNews(); });
  const s = document.getElementById('news-search');
  if (s) s.addEventListener('keyup', e => { if (e.key === 'Enter') renderNews(); });
});

async function loadNews() {
  const res = await API.news.list();
  allNews = res.code === 0 ? res.data : [];
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

  container.innerHTML = list.map(item => {
    const color = TYPE_COLOR[item.type] || '#6b7280';
    const icon  = TYPE_ICON[item.type]  || '📰';
    const name  = TYPE_NAME[item.type]  || item.type || '资讯';
    return `
      <div class="news-card" onclick="openDetail(${item.id})">
        <div class="news-cover" style="background: linear-gradient(135deg, ${color}22, ${color}11);">
          <span class="news-cover-icon">${icon}</span>
          <span class="news-type-badge" style="background:${color}">${name}</span>
        </div>
        <div class="news-card-body">
          <div class="news-card-title">${item.title}</div>
          <div class="news-card-excerpt">${(item.content || '').slice(0, 60)}${item.content && item.content.length > 60 ? '…' : ''}</div>
          <div class="news-card-meta">
            <span class="news-author">👤 ${item.author || '匿名'}</span>
            <span class="news-time">🕐 ${formatDate(item.create_time)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openDetail(id) {
  const item = allNews.find(i => i.id === id);
  if (!item) return;
  const color = TYPE_COLOR[item.type] || '#6b7280';
  document.getElementById('detailTitle').textContent = item.title;
  document.getElementById('detailBody').innerHTML = `
    <div class="detail-meta">
      <span class="detail-badge" style="background:${color}22;color:${color}">${TYPE_ICON[item.type]||'📰'} ${TYPE_NAME[item.type]||item.type}</span>
      <span>👤 ${item.author || '匿名'}</span>
      <span>🕐 ${formatDate(item.create_time)}</span>
    </div>
    <div class="detail-content">${item.content}</div>
    ${canDelete(item) ? `<button class="btn btn-danger btn-sm" style="margin-top:16px" onclick="deleteNews(${item.id})">删除</button>` : ''}
  `;
  openModal('newsDetailModal');
}

async function submitNews() {
  const title   = (document.getElementById('newsTitle')?.value   || '').trim();
  const type    = (document.getElementById('newsType')?.value    || '').trim();
  const content = (document.getElementById('newsContent')?.value || '').trim();

  if (!title)   { showFormErr('newsTitleErr');   return; }
  if (!type)    { showFormErr('newsTypeErr');    return; }
  if (!content) { showFormErr('newsContentErr'); return; }

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
  if (!confirm('确定删除？')) return;
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
  return user && (user.username === item.author || user.role === 'admin');
}

function showFormErr(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3000); }
}

function initTabs(tabsId, onChange) {
  document.querySelectorAll(`#${tabsId} .tab-btn`).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${tabsId} .tab-btn`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.type || btn.dataset.cat || 'all');
    });
  });
}