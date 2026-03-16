/* ================================================
   THE SYMBOL φ STUDIO — Shared JS
   ================================================ */

/* ---- Navigation ---- */
const nav        = document.getElementById('nav');
const navToggle  = document.getElementById('navToggle');
const navMobile  = document.getElementById('navMobile');
const navClose   = document.getElementById('navClose');

// Scroll — add 'scrolled' class after 20px
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// Mobile menu
navToggle?.addEventListener('click', () => {
  navMobile?.classList.add('open');
  document.body.style.overflow = 'hidden';
});
navClose?.addEventListener('click', closeMobileNav);
navMobile?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));

function closeMobileNav() {
  navMobile?.classList.remove('open');
  document.body.style.overflow = '';
}

// Close mobile nav on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMobileNav();
});

// Active nav link
const currentPath = window.location.pathname;
document.querySelectorAll('.nav-links a').forEach(a => {
  const href = a.getAttribute('href') || '';
  const page = href.replace('.html', '').replace('/', '');
  if (page && currentPath.includes(page)) {
    a.classList.add('active');
  }
});

/* ---- Scroll reveal ---- */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ---- Toast notification ---- */
function showToast(msg, type = 'default') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast' + (type === 'error' ? ' error' : '');
  // Force reflow
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ---- Cloudinary thumbnail helper ---- */
function cloudinaryThumb(url, type) {
  if (!url) return '';
  if (type === 'video') {
    // Generate a thumbnail from the video at 1 second
    return url
      .replace('/video/upload/', '/video/upload/so_1,w_800,c_fill,ar_4:3/')
      .replace(/\.(mp4|mov|webm|avi)$/i, '.jpg');
  }
  // For images, return a resized version
  return url.replace('/image/upload/', '/image/upload/w_800,c_fill/');
}
