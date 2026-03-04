/* ===================================================
   trade.js —— 二手交易页逻辑
   =================================================== */

const CAT_NAME = { book: '📚 书籍', electronics: '💻 电子', daily: '🛋️ 生活', other: '📦 其他' };
const CAT_ICON = { book: '📚', electronics: '💻', daily: '🛋️', other: '📦' };

let allTrade = [];
let curCat   = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  await loadTrade();
  initTabs('tradeTabs', (cat) => { curCat = cat; renderTrade(); });
  const s = document.getElementById('trade-search');
  if (s) s.addEventListener('keyup', e => { if (e.key === 'Enter') renderTrade(); });
});

async function loadTrade() {
  const res = await API.trade.list();
  allTrade  = res.code === 200 ? res.data : [];
  renderTrade();
}

function renderTrade() {
  const container = document.getElementById('tradeList');
  const keyword   = (document.getElementById('trade-search')?.value || '').trim().toLowerCase();
  const minP      = parseFloat(document.getElementById('minPrice')?.value) || 0;
  const maxP      = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;

  let list = allTrade
    .filter(i => curCat === 'all' || i.category === curCat)
    .filter(i => !keyword || i.title.toLowerCase().includes(keyword))
    .filter(i => parseFloat(i.price) >= minP && parseFloat(i.price) <= maxP);

  if (!list.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">♻️</div><p>暂无商品</p></div>';
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="trade-card" onclick="openTradeDetail(${item.id})">
      <div class="trade-cover">${CAT_ICON[item.category] || '📦'}</div>
      <div class="trade-card-body">
        <div class="trade-card-name">${item.title}</div>
        <div class="trade-card-price">¥${parseFloat(item.price).toFixed(2)}</div>
        <div class="trade-card-meta">
          <span class="badge badge-gray">${CAT_NAME[item.category] || item.category}</span>
          <span>${formatDate(item.createdAt)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function openTradeDetail(id) {
  const item = allTrade.find(i => i.id === id);
  if (!item) return;
  document.getElementById('tradeDetailTitle').textContent = item.title;
  document.getElementById('tradeDetailBody').innerHTML = `
    <div class="trade-detail-price">¥${parseFloat(item.price).toFixed(2)}</div>
    <div class="trade-detail-info">
      <p><strong>品类：</strong>${CAT_NAME[item.category] || item.category}</p>
      <p><strong>描述：</strong>${item.desc}</p>
      <p><strong>联系方式：</strong>${item.contact}</p>
      <p><strong>发布人：</strong>${item.nickname || item.username}</p>
      <p><strong>发布时间：</strong>${formatDate(item.createdAt)}</p>
    </div>
    ${canDelete(item) ? `<button class="btn btn-danger btn-sm" onclick="deleteTrade(${item.id})">删除</button>` : ''}
  `;
  openModal('tradeDetailModal');
}

async function submitTrade() {
  const title   = document.getElementById('tradeTitle').value.trim();
  const cat     = document.getElementById('tradeCat').value;
  const price   = document.getElementById('tradePrice').value;
  const desc    = document.getElementById('tradeDesc').value.trim();
  const contact = document.getElementById('tradeContact').value.trim();

  let ok = true;
  if (!title)   { showFieldErr('tradeTitleErr');   ok = false; }
  if (!cat)     { showFieldErr('tradeCatErr');     ok = false; }
  if (!price || parseFloat(price) < 0) { showFieldErr('tradePriceErr'); ok = false; }
  if (!desc)    { showFieldErr('tradeDescErr');    ok = false; }
  if (!contact) { showFieldErr('tradeContactErr'); ok = false; }
  if (!ok) return;

  const user = Auth.getUser();
  const res  = await API.trade.add({
    title, category: cat, price: parseFloat(price),
    desc, contact, username: user.username, nickname: user.nickname || user.username
  });

  if (res.code === 200) {
    showToast('发布成功！');
    closeModal('tradePublishModal');
    ['tradeTitle','tradeCat','tradePrice','tradeDesc','tradeContact'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    await loadTrade();
  } else {
    showToast(res.msg || '发布失败', 'error');
  }
}

async function deleteTrade(id) {
  if (!confirm('确定删除？')) return;
  const res = await API.trade.remove(id);
  if (res.code === 200) {
    showToast('删除成功'); closeModal('tradeDetailModal'); await loadTrade();
  } else showToast(res.msg || '删除失败', 'error');
}

function canDelete(item) {
  const user = Auth.getUser();
  return user && user.username === item.username;
}

function showFieldErr(id) {
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