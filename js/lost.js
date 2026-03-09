/* ===================================================
   lost.js —— 失物招领页逻辑（已修复）
   =================================================== */

let allLost = [];
let curLostType = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  await loadLost();
  initTabs('lostTabs', (type) => { curLostType = type; renderLost(); });
  const s = document.getElementById('lost-search');
  if (s) s.addEventListener('keyup', e => { if (e.key === 'Enter') renderLost(); });
  if (typeof initNav === 'function') initNav();
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
    .filter(i => curLostType === 'all' || (curLostType === 'found' ? i.found : !i.found))
    .filter(i => !keyword || i.title.toLowerCase().includes(keyword) || (i.location || '').toLowerCase().includes(keyword));

  if (!list.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>暂无失物信息</p></div>';
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="lost-card" onclick="openLostDetail(${item.id})">
      <div class="lost-card-icon">${item.found ? '🟢' : '🔴'}</div>
      <div class="lost-card-info">
        <div class="lost-card-title">${item.title}</div>
        <div class="lost-card-meta">
          <span>📍 ${item.location || '未知地点'}</span>
          <span>${formatDate(item.create_time)}</span>
          <span class="badge ${item.found ? 'badge-green' : 'badge-orange'}">${item.found ? '已找到' : '处理中'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function openLostDetail(id) {
  const item = allLost.find(i => i.id == id);
  if (!item) return;
  document.getElementById('lostDetailTitle').textContent = item.title;
  document.getElementById('lostDetailBody').innerHTML = `
    <div class="detail-meta">
      <span>👤 ${item.author || '匿名'}</span>
      <span>📍 ${item.location || '未知地点'}</span>
      <span>${formatDate(item.create_time)}</span>
    </div>
    <div class="detail-content">${item.content}</div>
    <div class="trade-detail-info" style="margin-top:12px">
      <p><strong>状态：</strong>${item.found ? '✅ 已找到/已认领' : '🔍 处理中'}</p>
    </div>
    <div style="display:flex; gap:10px; margin-top:12px">
      ${!item.found && canDelete(item) ? `<button class="btn btn-primary btn-sm" onclick="markFound(${item.id})">✅ 标记已找到</button>` : ''}
      ${canDelete(item) ? `<button class="btn btn-danger btn-sm" onclick="deleteLost(${item.id})">删除</button>` : ''}
    </div>
  `;
  openModal('lostDetailModal');
}

async function submitLost() {
  const title    = document.getElementById('lostTitle')?.value.trim()
                || document.getElementById('lostName')?.value.trim() || '';
  const location = document.getElementById('lostPlace')?.value.trim()
                || document.getElementById('lostLocation')?.value.trim() || '';
  const content  = document.getElementById('lostDesc')?.value.trim()
                || document.getElementById('lostContent')?.value.trim() || '';

  if (!title)   { showToast('请填写物品名称', 'error'); return; }
  if (!content) { showToast('请填写描述', 'error'); return; }

  const res = await API.lost.add({ title, location, content });

  if (res.code === 0) {
    showToast('发布成功！');
    closeModal('lostPublishModal');
    // 清空表单
    ['lostTitle','lostName','lostPlace','lostLocation','lostDesc','lostContent','lostTime'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    await loadLost();
  } else {
    showToast(res.msg || '发布失败', 'error');
  }
}

async function markFound(id) {
  if (!confirm('确认标记为已找到/已认领？')) return;
  const res = await API.lost.found(id);
  if (res.code === 0) {
    showToast('已标记！');
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
  return user && user.username === (item.author || item.username);
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
      onChange(btn.dataset.type || 'all');
    });
  });
}