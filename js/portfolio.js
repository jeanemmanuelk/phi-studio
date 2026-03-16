/* ================================================
   THE SYMBOL φ STUDIO — Portfolio Page JS
   ================================================ */

let allItems = [];
let currentFilter = 'all';

/* ---- Init ---- */
async function initPortfolio() {
  if (!window.CONFIG?.supabase?.url || CONFIG.supabase.url === 'YOUR_SUPABASE_URL') {
    // Show placeholder grid until configured
    showEmpty('Portfolio coming soon.');
    return;
  }

  const { createClient } = supabase;
  const db = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

  showLoading();

  const { data, error } = await db
    .from('portfolio_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showEmpty('Could not load portfolio. Please try again later.');
    console.error(error);
    return;
  }

  allItems = data || [];
  renderGrid(allItems);
  setupFilters();
}

/* ---- Render ---- */
function renderGrid(items) {
  const grid = document.getElementById('portfolioGrid');

  if (!items.length) {
    grid.innerHTML = `
      <div class="portfolio-empty">
        <span class="phi-empty">φ</span>
        <p>No work in this category yet.</p>
      </div>`;
    return;
  }

  grid.innerHTML = items.map(item => {
    const thumb = item.media_type === 'video'
      ? (item.thumbnail_url || cloudinaryThumb(item.cloudinary_url, 'video'))
      : cloudinaryThumb(item.cloudinary_url, 'image');

    const playBadge = item.media_type === 'video'
      ? `<div class="play-badge">
           <svg width="12" height="14" viewBox="0 0 12 14" fill="white">
             <path d="M1 1l10 6-10 6V1z"/>
           </svg>
         </div>`
      : '';

    return `
      <div class="portfolio-item visible"
           data-id="${item.id}"
           data-category="${item.category}"
           data-type="${item.media_type}"
           data-url="${item.cloudinary_url}"
           data-title="${escHtml(item.title)}"
           data-cat="${item.category}"
           onclick="openLightbox(this)">
        <img class="v-thumb" src="${thumb}" alt="${escHtml(item.title)}" loading="lazy">
        ${playBadge}
        <div class="portfolio-item-overlay">
          <p class="p-cat">${item.category}</p>
          <p class="p-title">${escHtml(item.title)}</p>
        </div>
      </div>`;
  }).join('');
}

/* ---- Filter ---- */
function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;

      const filtered = currentFilter === 'all'
        ? allItems
        : allItems.filter(i => i.category === currentFilter);

      renderGrid(filtered);
    });
  });
}

/* ---- Loading skeleton ---- */
function showLoading() {
  const grid = document.getElementById('portfolioGrid');
  grid.innerHTML = `
    <div class="skeleton skeleton-h1"></div>
    <div class="skeleton skeleton-h2"></div>
    <div class="skeleton skeleton-h3"></div>
    <div class="skeleton skeleton-h4"></div>
    <div class="skeleton skeleton-h5"></div>
    <div class="skeleton skeleton-h6"></div>`;
  grid.style.columns = '3';
  grid.style.columnGap = '12px';
}

function showEmpty(msg) {
  const grid = document.getElementById('portfolioGrid');
  grid.style.columns = '';
  grid.innerHTML = `
    <div class="portfolio-empty">
      <span class="phi-empty">φ</span>
      <p>${msg}</p>
    </div>`;
}

/* ---- Lightbox ---- */
function openLightbox(el) {
  const url   = el.dataset.url;
  const type  = el.dataset.type;
  const title = el.dataset.title;
  const cat   = el.dataset.cat;

  const lb       = document.getElementById('lightbox');
  const lbInner  = document.getElementById('lbInner');
  const lbTitle  = document.getElementById('lbTitle');
  const lbCat    = document.getElementById('lbCat');

  lbInner.innerHTML = type === 'video'
    ? `<video controls autoplay playsinline src="${url}"></video>`
    : `<img src="${url}" alt="${escHtml(title)}">`;

  lbTitle.textContent = title;
  lbCat.textContent   = cat;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  document.getElementById('lbInner').innerHTML = '';
  document.body.style.overflow = '';
}

// Close on backdrop click
document.getElementById('lightbox')?.addEventListener('click', function(e) {
  if (e.target === this) closeLightbox();
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

/* ---- Util ---- */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---- Start ---- */
document.addEventListener('DOMContentLoaded', initPortfolio);
