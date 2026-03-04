/* ===================================================
   index.js —— 首页逻辑
   轮播图 + 各模块预览数据加载
   =================================================== */

/* ── 1. 轮播图 ────────────────────────────────────*/
let slideIndex = 0;     // 当前显示第几张
let slideTimer = null;  // 自动播放定时器
const SLIDE_COUNT = 3;  // 共几张幻灯片

// 切换到指定幻灯片
function goToSlide(idx) {
  const slides = document.getElementById('heroSlides');
  const dots   = document.querySelectorAll('.hero-dot');
  if (!slides) return;

  // 边界处理：超出范围就循环
  if (idx < 0) idx = SLIDE_COUNT - 1;
  if (idx >= SLIDE_COUNT) idx = 0;

  slideIndex = idx;

  // 移动幻灯片容器（translateX 向左移动 idx 个 100%）
  slides.style.transform = `translateX(-${slideIndex * 100}%)`;

  // 更新指示点
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === slideIndex);
  });
}

// 自动播放：每 3 秒切换下一张
function startAutoPlay() {
  slideTimer = setInterval(() => goToSlide(slideIndex + 1), 3000);
}

// 初始化轮播图
function initCarousel() {
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');
  const dots    = document.querySelectorAll('.hero-dot');

  if (prevBtn) prevBtn.onclick = () => { goToSlide(slideIndex - 1); resetTimer(); };
  if (nextBtn) nextBtn.onclick = () => { goToSlide(slideIndex + 1); resetTimer(); };

  // 点击指示点跳转
  dots.forEach((dot, i) => {
    dot.onclick = () => { goToSlide(i); resetTimer(); };
  });

  startAutoPlay();
}

// 手动切换后重置定时器（防止切完马上又自动切）
function resetTimer() {
  clearInterval(slideTimer);
  startAutoPlay();
}

/* ── 2. 加载预览数据 ──────────────────────────────
   从后台拉取各模块最新3条数据，展示在首页
*/
async function loadPreviews() {
  // 并行请求四个接口，速度更快
  const [newsRes, tradeRes, lostRes, forumRes] = await Promise.all([
    API.news.list(),
    API.trade.list(),
    API.lost.list(),
    API.forum.list(),
  ]);

  renderNewsPreview(newsRes.code  === 200 ? newsRes.data  : []);
  renderTradePreview(tradeRes.code === 200 ? tradeRes.data : []);
  renderLostPreview(lostRes.code  === 200 ? lostRes.data  : []);
  renderForumPreview(forumRes.code === 200 ? forumRes.data : []);
}

/* 渲染资讯预览 */
function renderNewsPreview(list) {
  const el = document.getElementById('news-preview');
  if (!el) return;

  // slice(0, 3)：只取前3条
  const items = list.slice(0, 3);
  if (!items.length) {
    el.innerHTML = '<div class="loading-tip">暂无资讯</div>';
    return;
  }

  el.innerHTML = items.map(item => `
    <a href="news.html" class="preview-card">
      <div class="preview-card-title">${item.title}</div>
      <div class="preview-card-meta">
        <span>${item.typeName || item.type}</span>
        <span>${formatDate(item.createdAt)}</span>
      </div>
    </a>
  `).join('');
}

/* 渲染二手预览 */
function renderTradePreview(list) {
  const el = document.getElementById('trade-preview');
  if (!el) return;

  const items = list.slice(0, 3);
  if (!items.length) {
    el.innerHTML = '<div class="loading-tip">暂无商品</div>';
    return;
  }

  el.innerHTML = items.map(item => `
    <a href="trade.html" class="preview-card">
      <div class="preview-card-title">${item.title}</div>
      <div class="preview-price">¥${parseFloat(item.price).toFixed(2)}</div>
      <div class="preview-card-meta">${formatDate(item.createdAt)}</div>
    </a>
  `).join('');
}

/* 渲染失物预览 */
function renderLostPreview(list) {
  const el = document.getElementById('lost-preview');
  if (!el) return;

  const items = list.slice(0, 3);
  if (!items.length) {
    el.innerHTML = '<div class="loading-tip">暂无失物信息</div>';
    return;
  }

  el.innerHTML = items.map(item => `
    <a href="lost.html" class="preview-card">
      <div class="preview-card-title">${item.type === 'lost' ? '🔴' : '🟢'} ${item.name}</div>
      <div class="preview-card-meta">
        <span>📍 ${item.place}</span>
        <span>${formatDate(item.createdAt)}</span>
      </div>
    </a>
  `).join('');
}

/* 渲染广场预览 */
function renderForumPreview(list) {
  const el = document.getElementById('forum-preview');
  if (!el) return;

  const items = list.slice(0, 3);
  if (!items.length) {
    el.innerHTML = '<div class="loading-tip">暂无帖子</div>';
    return;
  }

  el.innerHTML = items.map(item => `
    <a href="forum.html" class="preview-card">
      <div class="preview-card-title">${item.title || item.content}</div>
      <div class="preview-card-meta">
        <span>💬 ${item.replies ? item.replies.length : 0} 条回复</span>
        <span>${formatDate(item.createdAt)}</span>
      </div>
    </a>
  `).join('');
}

/* ── 页面加载完成后初始化 ─────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  loadPreviews();
});