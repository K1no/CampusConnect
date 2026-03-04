/* ===================================================
   lost.js —— 失物招领页逻辑
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
  allLost   = res.code === 200 ? res.data : [];
  renderLost();
}

function renderLost() {
  const container = document.getElementById('lostList');
  const keyword   = (document.getElementById('lost-search')?.value || '').trim().toLowerCase();

  let list = allLost
    .filter(i => curLType === 'all' || i.type === curLType)
    .filter(i => !keyword || i.name.toLowerCase().includes(keyword) || i.place.toLowerCase().includes(keyword));

  if (!list.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>暂无失物信息</p></div>';
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="lost-card" onclick="openLostDetail(${item.id})">
      <div class="lost-type-icon ${item.type}">${item.type === 'lost' ? '😢' : '✅'}</div>
      <div class="lost-card-info">
        <div class="lost-card-title">${item.name}</div>
        <div class="lost-card-meta">
          <span>📍 ${item.place}</span>
          <span>📅 ${item.time || ''}</span>
          <span>👤 ${item.nickname || item.username}</span>
          <span>${formatDate(item.createdAt)}</span>
        </div>
      </div>
      <div class="lost-card-status">
        ${item.found
          ? '<span class="badge badge-green">已找到</span>'
          : (item.type === 'lost'
              ? '<span class="badge badge-red">寻找中</span>'
              : '<span class="badge badge-orange">等待认领</span>')}
      </div>
    </div>
  `).join('');
}

function openLostDetail(id) {
  const item = allLost.find(i => i.id === id);
  if (!item) return;
  document.getElementById('lostDetailTitle').textContent = (item.type === 'lost' ? '😢 丢失：' : '✅ 拾到：') + item.name;
  document.getElementById('lostDetailBody').innerHTML = `
    <div class="trade-detail-info">
      <p><strong>类型：</strong>${item.type === 'lost' ? '丢失物品' : '拾到物品'}</p>
      <p><strong>地点：</strong>${item.place}</p>
      <p><strong>时间：</strong>${item.time || '未填写'}</p>
      <p><strong>描述：</strong>${item.desc}</p>
      <p><strong>发布人：</strong>${item.nickname || item.username}</p>
      <p><strong>状态：</strong>${item.found ? '已找到/已认领' : '处理中'}</p>
    </div>
    <div style="display:flex; gap:10px; margin-top:12px">
      ${!item.found && canDelete(item) ? `<button class="btn-found" onclick="markFound(${item.id})">✅ 标记已找到</button>` : ''}
      ${canDelete(item) ? `<button class="btn btn-danger btn-sm" onclick="deleteLost(${item.id})">删除</button>` : ''}
    </div>
  `;
  openModal('lostDetailModal');
}

async function submitLost() {
  const type  = document.getElementById('lostType').value;
  const name  = document.getElementById('lostName').value.trim();
  const place = document.getElementById('lostPlace').value.trim();
  const time  = document.getElementById('lostTime').value;
  const desc  = document.getElementById('lostDesc').value.trim();

  let ok = true;
  if (!name)  { showFieldErr('lostNameErr');  ok = false; }
  if (!place) { showFieldErr('lostPlaceErr'); ok = false; }
  if (!time)  { showFieldErr('lostTimeErr');  ok = false; }
  if (!desc)  { showFieldErr('lostDescErr');  ok = false; }
  if (!ok) return;

  const user = Auth.getUser();
  const res  = await API.lost.add({ type, name, place, time, desc, username: user.username, nickname: user.nickname || user.username });

  if (res.code === 200) {
    showToast('发布成功！');
    closeModal('lostPublishModal');
    ['lostName','lostPlace','lostTime','lostDesc'].forEach(id => {
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
  if (res.code === 200) {
    showToast('已标记！'); closeModal('lostDetailModal'); await loadLost();
  } else showToast(res.msg || '操作失败', 'error');
}

async function deleteLost(id) {
  if (!confirm('确定删除？')) return;
  const res = await API.lost.remove(id);
  if (res.code === 200) {
    showToast('删除成功'); closeModal('lostDetailModal'); await loadLost();
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
      onChange(btn.dataset.type || 'all');
    });
  });
}