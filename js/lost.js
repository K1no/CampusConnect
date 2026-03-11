/* ===================================================
   lost.js —— 失物招领页逻辑（修复+样式优化版）
   修复：code===0，字段名 title/content/location，create_time
   =================================================== */

let allLost  = [];
let curLType = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  await loadLost();
  initTabs('lostTabs', (type) => { curLType = type; renderLost(); });
  const s = document.getElementById('lost-search');
  if (s) s.addEventListener('keyup', e => { if (e.key === 'Enter') renderLost(); });
});

async function loadLost() {
  const res = await API.lost.list();
  allLost   = res.code === 0 ? res.data : [];
  renderLost();
}

function renderLost() {
  const container = document.getElementById('lostList');
  const keyword   = (document.getElementById('lost-search')?.value || '').trim().toLowerCase();

  let list = allLost
    .filter(i => curLType === 'all' || i.type === curLType)
    .filter(i => !keyword ||
      (i.title   || '').toLowerCase().includes(keyword) ||
      (i.location|| '').toLowerCase().includes(keyword));

  if (!list.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>暂无失物信息</p></div>';
    return;
  }

  container.innerHTML = list.map(item => {
    const isLost  = item.type === 'lost';
    const typeLabel = isLost ? '丢失物品' : '拾到物品';
    const typeColor = isLost ? '#ef4444' : '#10b981';
    const typeIcon  = isLost ? '😢' : '✅';

    let statusBadge = '';
    if (item.found) {
      statusBadge = '<span class="lost-badge lost-badge-done">已找到</span>';
    } else if (isLost) {
      statusBadge = '<span class="lost-badge lost-badge-lost">寻找中</span>';
    } else {
      statusBadge = '<span class="lost-badge lost-badge-found">等待认领</span>';
    }

    return `
      <div class="lost-card" onclick="openLostDetail(${item.id})">
        <div class="lost-card-left" style="background:${typeColor}18; border-left: 4px solid ${typeColor}">
          <div class="lost-type-emoji">${typeIcon}</div>
          <div class="lost-type-label" style="color:${typeColor}">${typeLabel}</div>
        </div>
        <div class="lost-card-body">
          <div class="lost-card-title">${item.title || '未命名'}</div>
          <div class="lost-card-desc">${(item.content || '').slice(0, 50)}${item.content && item.content.length > 50 ? '…' : ''}</div>
          <div class="lost-card-meta">
            <span>📍 ${item.location || '未知地点'}</span>
            <span>👤 ${item.author || '匿名'}</span>
            <span>🕐 ${formatDate(item.create_time)}</span>
          </div>
        </div>
        <div class="lost-card-right">
          ${statusBadge}
        </div>
      </div>
    `;
  }).join('');
}

function openLostDetail(id) {
  const item = allLost.find(i => i.id == id);
  if (!item) return;
  const isLost = item.type === 'lost';
  document.getElementById('lostDetailTitle').textContent =
    (isLost ? '😢 丢失：' : '✅ 拾到：') + (item.title || '未命名');

  document.getElementById('lostDetailBody').innerHTML = `
    <div class="trade-detail-info">
      <p><strong>类型：</strong>${isLost ? '丢失物品' : '拾到物品'}</p>
      <p><strong>地点：</strong>${item.location || '未填写'}</p>
      <p><strong>描述：</strong>${item.content || '无'}</p>
      <p><strong>发布人：</strong>${item.author || '匿名'}</p>
      <p><strong>发布时间：</strong>${formatDate(item.create_time)}</p>
      <p><strong>状态：</strong>${item.found ? '✅ 已找到/已认领' : '⏳ 处理中'}</p>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
      ${!item.found && canDelete(item) ? `<button class="btn btn-primary btn-sm" onclick="markFound(${item.id})">✅ 标记已找到</button>` : ''}
      ${canDelete(item) ? `<button class="btn btn-danger btn-sm" onclick="deleteLost(${item.id})">删除</button>` : ''}
    </div>
  `;
  openModal('lostDetailModal');
}

async function submitLost() {
  const type     = (document.getElementById('lostType')?.value     || '').trim();
  const title    = (document.getElementById('lostName')?.value     || '').trim();
  const location = (document.getElementById('lostLocation')?.value || '').trim();
  const content  = (document.getElementById('lostDesc')?.value     || '').trim();

  if (!title)    { showFormErr('lostNameErr');     return; }
  if (!location) { showFormErr('lostLocationErr'); return; }
  if (!content)  { showFormErr('lostDescErr');     return; }

  const res = await API.lost.add({ type, title, location, content });
  if (res.code === 0) {
    showToast('发布成功！');
    closeModal('lostPublishModal');
    ['lostName','lostLocation','lostDesc'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    await loadLost();
  } else {
    showToast(res.msg || '发布失败', 'error');
  }
}

async function markFound(id) {
  const res = await API.lost.found(id);
  if (res.code === 0) {
    showToast('已标记为找到！');
    closeModal('lostDetailModal');
    await loadLost();
  } else {
    showToast(res.msg || '操作失败', 'error');
  }
}

async function deleteLost(id) {
  if (!confirm('确定删除？')) return;
  const res = await API.lost.remove(id);
  if (res.code === 0) {
    showToast('删除成功');
    closeModal('lostDetailModal');
    await loadLost();
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