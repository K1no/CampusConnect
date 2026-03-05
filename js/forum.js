/* ===================================================
   forum.js —— 校园广场页逻辑
   =================================================== */

let allForum   = [];
let curForumId = null; // 当前打开详情的帖子 id

document.addEventListener('DOMContentLoaded', async () => {
  await loadForum();

  // 已登录时显示快速发帖框
  if (Auth.isLoggedIn()) {
    const qp = document.getElementById('quickPost');
    if (qp) qp.style.display = 'block';
  }
});

async function loadForum() {
  const res = await API.forum.list();
  allForum  = res.code === 0 ? res.data : [];
  renderForum();
}

function renderForum() {
  const container = document.getElementById('forumList');
  if (!allForum.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>还没有帖子，来发第一帖吧！</p></div>';
    return;
  }

  container.innerHTML = allForum.map(item => {
    const user    = item.nickname || item.username || item.author || '匿名用户';
    const initial = (user && user[0]) ? user[0].toUpperCase() : 'U';
    const replies = item.replies ? item.replies.length : 0;
    return `
      <div class="forum-card" onclick="openForumDetail('${item.id}')">
        <div class="forum-card-header">
          <div class="forum-avatar">${initial}</div>
          <div>
            <div class="forum-card-user">${user}</div>
            <div class="forum-card-time">${formatDate(item.createTime)}</div>
          </div>
          ${canDelete(item) ? `<button class="btn-delete-post" onclick="event.stopPropagation(); deleteForum('${item.id}')">删除</button>` : ''}
        </div>
        ${item.title ? `<div class="forum-card-title">${item.title}</div>` : ''}
        <div class="forum-card-content">${item.content}</div>
        <div class="forum-card-footer">
          <span>💬 ${replies} 条回复</span>
          <span>👤 ${user}</span>
        </div>
      </div>
    `;
  }).join('');
}

function openForumDetail(id) {
  const item = allForum.find(i => i.id === id);
  if (!item) return;
  curForumId = id;

  const user = item.nickname || item.username || item.author || '匿名用户';
  document.getElementById('forumDetailTitle').textContent = item.title || '校园广场帖子';
  document.getElementById('forumDetailBody').innerHTML = `
    <div class="detail-meta">
      <span>👤 ${user}</span>
      <span>${formatDate(item.createTime)}</span>
    </div>
    <div class="detail-content">${item.content}</div>
  `;

  // 渲染回复列表
  renderReplies(item.replies || []);
  openModal('forumDetailModal');
}

function renderReplies(replies) {
  const container = document.getElementById('replyList');
  if (!replies.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem">还没有回复，来说两句吧～</p>';
    return;
  }
  container.innerHTML = replies.map(r => `
    <div class="reply-item">
      <div class="reply-item-user">${r.nickname || r.username || r.author}</div>
      <div class="reply-item-content">${r.content}</div>
      <div class="reply-item-time">${formatDate(r.createTime)}</div>
    </div>
  `).join('');
}

/* ── 快速发帖 ─────────────────────────────────────*/
async function quickPost() {
  const content = document.getElementById('quickContent')?.value.trim();
  const title   = document.getElementById('quickTitle')?.value.trim();
  if (!content) { showToast('内容不能为空', 'error'); return; }

  const user = Auth.getUser();
  const res  = await API.forum.add({
    title: title || '',
    content,
    username: user.username,
    nickname: user.nickname || user.username
  });

  if (res.code === 0) {
    showToast('发布成功！');
    document.getElementById('quickContent').value = '';
    document.getElementById('quickTitle').value   = '';
    await loadForum();
  } else {
    showToast(res.msg || '发布失败', 'error');
  }
}

/* ── 发布帖子（弹窗版）──────────────────────────*/
async function submitForum() {
  const title   = document.getElementById('forumTitle').value.trim();
  const content = document.getElementById('forumContent').value.trim();

  let ok = true;
  if (!title)            { showFieldErr('forumTitleErr');   ok = false; }
  if (content.length < 10) { showFieldErr('forumContentErr'); ok = false; }
  if (!ok) return;

  const user = Auth.getUser();
  const res  = await API.forum.add({
    title, content, username: user.username, nickname: user.nickname || user.username
  });

  if (res.code === 0) {
    showToast('发布成功！');
    closeModal('forumPublishModal');
    document.getElementById('forumTitle').value   = '';
    document.getElementById('forumContent').value = '';
    await loadForum();
  } else {
    showToast(res.msg || '发布失败', 'error');
  }
}

/* ── 提交回复 ─────────────────────────────────────*/
async function submitReply() {
  if (!Auth.isLoggedIn()) { showToast('请先登录', 'info'); return; }
  const content = document.getElementById('replyContent').value.trim();
  if (!content) { showToast('回复内容不能为空', 'error'); return; }

  const user = Auth.getUser();
  const res  = await API.forum.reply(curForumId, {
    content, username: user.username, nickname: user.nickname || user.username
  });

  if (res.code === 0) {
    showToast('回复成功！');
    document.getElementById('replyContent').value = '';
    await loadForum();
    // 刷新详情弹窗里的回复列表
    const updated = allForum.find(i => i.id === curForumId);
    if (updated) renderReplies(updated.replies || []);
  } else {
    showToast(res.msg || '回复失败', 'error');
  }
}

/* ── 删除帖子 ─────────────────────────────────────*/
async function deleteForum(id) {
  if (!confirm('确定删除这条帖子？')) return;
  const res = await API.forum.remove(id);
  if (res.code === 0) {
    showToast('删除成功'); await loadForum();
  } else showToast(res.msg || '删除失败', 'error');
}

function canDelete(item) {
  const user = Auth.getUser();
  return user && user.username === (item.username || item.author);
}

function showFieldErr(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3000); }
}