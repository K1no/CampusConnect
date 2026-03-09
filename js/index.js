/* ===================================================
   index.js —— 首页逻辑：轮播图 + 各模块预览
   =================================================== */

/* ── 1. 轮播图 ────────────────────────────────────*/
let slideIndex = 0;
let slideTimer = null;
const SLIDE_COUNT = 3;

function goToSlide(idx) {
  const slides = document.getElementById('heroSlides');
  const dots   = document.querySelectorAll('.hero-dot');
  if (!slides) return;
  if (idx < 0) idx = SLIDE_COUNT - 1;
  if (idx >= SLIDE_COUNT) idx = 0;
  slideIndex = idx;
  slides.style.transform = `translateX(-${slideIndex * 100}%)`;
  dots.forEach((dot, i) => dot.classList.toggle('active', i === slideIndex));
}

function startAutoPlay() {
  slideTimer = setInterval(() => goToSlide(slideIndex + 1), 3000);
}

function initCarousel() {
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');
  const dots    = document.querySelectorAll('.hero-dot');
  if (prevBtn) prevBtn.onclick = () => { goToSlide(slideIndex - 1); resetTimer(); };
  if (nextBtn) nextBtn.onclick = () => { goToSlide(slideIndex + 1); resetTimer(); };
  dots.forEach((dot, i) => { dot.onclick = () => { goToSlide(i); resetTimer(); }; });
  startAutoPlay();
}

function resetTimer() {
  clearInterval(slideTimer);
  startAutoPlay();
}

/* ── 2. 加载预览数据 ──────────────────────────────*/
async function loadPreviews() {
  const [newsRes, tradeRes, lostRes, forumRes] = await Promise.all([
    API.news.list(),
    API.trade.list(),
    API.lost.list(),
    API.forum.list(),
  ]);

  // 后端返回 code:0 表示成功
  renderNewsPreview(newsRes.code   === 0 ? newsRes.data   : []);
  renderTradePreview(tradeRes.code === 0 ? tradeRes.data  : []);
  renderLostPreview(lostRes.code   === 0 ? lostRes.data   : []);
  renderForumPreview(forumRes.code === 0 ? forumRes.data  : []);
}

/* 渲染资讯预览 */
function renderNewsPreview(list) {
  const el = document.getElementById('news-preview');
  if (!el) return;
  const items = list.slice(0, 3);
  if (!items.length) { el.innerHTML = '<div class="loading-tip">暂无资讯</div>'; return; }
  el.innerHTML = items.map(item => `
    <a href="news.html" class="preview-card">
      <div class="preview-card-title">${item.title}</div>
      <div class="preview-card-meta">
        <span>${item.type || '资讯'}</span>
        <span>${formatDate(item.create_time)}</span>
      </div>
    </a>
  `).join('');
}

/* 渲染二手预览 */
function renderTradePreview(list) {
  const el = document.getElementById('trade-preview');
  if (!el) return;
  const items = list.slice(0, 3);
  if (!items.length) { el.innerHTML = '<div class="loading-tip">暂无商品</div>'; return; }
  el.innerHTML = items.map(item => `
    <a href="trade.html" class="preview-card">
      <div class="preview-card-title">${item.title}</div>
      <div class="preview-price">¥${parseFloat(item.price || 0).toFixed(2)}</div>
      <div class="preview-card-meta">${formatDate(item.create_time)}</div>
    </a>
  `).join('');
}

/* 渲染失物预览 */
function renderLostPreview(list) {
  const el = document.getElementById('lost-preview');
  if (!el) return;
  const items = list.slice(0, 3);
  if (!items.length) { el.innerHTML = '<div class="loading-tip">暂无失物信息</div>'; return; }
  el.innerHTML = items.map(item => `
    <a href="lost.html" class="preview-card">
      <div class="preview-card-title">${item.found ? '🟢' : '🔴'} ${item.title}</div>
      <div class="preview-card-meta">
        <span>📍 ${item.location || '未知地点'}</span>
        <span>${formatDate(item.create_time)}</span>
      </div>
    </a>
  `).join('');
}

/* 渲染广场预览 */
function renderForumPreview(list) {
  const el = document.getElementById('forum-preview');
  if (!el) return;
  const items = list.slice(0, 3);
  if (!items.length) { el.innerHTML = '<div class="loading-tip">暂无帖子</div>'; return; }
  el.innerHTML = items.map(item => `
    <a href="forum.html" class="preview-card">
      <div class="preview-card-title">${item.title || item.content}</div>
      <div class="preview-card-meta">
        <span>💬 ${item.replies ? item.replies.length : 0} 条回复</span>
        <span>${formatDate(item.create_time)}</span>
      </div>
    </a>
  `).join('');
}

/* ── 3. 页面初始化 ────────────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  loadPreviews();
  // 导航用户状态（main.js 里的 initNav）
  if (typeof initNav === 'function') initNav();
});