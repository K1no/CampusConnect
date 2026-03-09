/* admin.js —— 简易控制台前端逻辑 */

const ADMIN_BASE = '/admin';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loadBtn').addEventListener('click', loadModule);
  document.getElementById('refreshBtn').addEventListener('click', loadModule);
  document.getElementById('addBtn').addEventListener('click', addItem);
});

async function loadModule() {
  const mod = document.getElementById('moduleSelect').value;
  const res = await fetch(`${ADMIN_BASE}/${mod}`);
  const data = await res.json();
  if (data.code !== 0) return alert(data.msg || '加载失败');
  renderList(mod, data.data);
}

function renderList(mod, items) {
  const list = document.getElementById('adminList');
  if (!items || !items.length) { list.innerHTML = '<div class="empty-state">没有数据</div>'; return; }
  list.innerHTML = items.map(it => {
    return `<div class="admin-row">
      <div style="flex:1"><strong>#${it.id}</strong> &nbsp; <span style="color:var(--text-sub)"> ${escapeHtml(it.title||it.username||it.content||'')}</span>
        <div style="font-size:0.9rem;color:var(--text-muted)">${escapeHtml(JSON.stringify(it))}</div>
      </div>
      <div class="admin-actions">
        <button class="btn btn-ghost" onclick="editItem('${mod}', ${it.id})">编辑</button>
        <button class="btn btn-danger" onclick="deleteItem('${mod}', ${it.id})">删除</button>
      </div>
    </div>`;
  }).join('');
}

async function addItem() {
  const mod = document.getElementById('moduleSelect').value;
  const title = document.getElementById('newTitle').value.trim();
  const content = document.getElementById('newContent').value.trim();
  const extra = document.getElementById('newExtra').value.trim();
  let body = {};
  switch (mod) {
    case 'users': body = { username: title, nickname: content, password: extra || '123456' }; break;
    case 'news': body = { title, content, type: extra }; break;
    case 'trade': body = { title, content, price: extra || 0 }; break;
    case 'lost': body = { title, content, location: extra }; break;
    case 'forum': body = { title, content }; break;
  }
  const res = await fetch(`${ADMIN_BASE}/${mod}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.code === 0) { alert('新增成功'); loadModule(); } else alert(data.msg || '新增失败');
}

async function deleteItem(mod, id) {
  if (!confirm('确定删除？')) return;
  const res = await fetch(`${ADMIN_BASE}/${mod}/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.code === 0) { alert('删除成功'); loadModule(); } else alert(data.msg || '删除失败');
}

function editItem(mod, id) {
  const newVal = prompt('请输入新的 JSON 字段（例如 {"title":"新标题"}）');
  if (!newVal) return;
  let obj;
  try { obj = JSON.parse(newVal); } catch (e) { return alert('JSON 格式错误'); }
  fetch(`${ADMIN_BASE}/${mod}/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(obj) })
    .then(r => r.json()).then(data => { if (data.code === 0) { alert('更新成功'); loadModule(); } else alert(data.msg || '更新失败'); });
}

function escapeHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
