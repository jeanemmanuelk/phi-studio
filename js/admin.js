/* ================================================
   THE SYMBOL φ STUDIO — Admin Panel JS
   ================================================ */

let db = null;
let currentUser = null;
let selectedFile = null;
let uploadedMediaUrl = null;
let uploadedMediaType = null;

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  if (!window.CONFIG?.supabase?.url || CONFIG.supabase.url === 'YOUR_SUPABASE_URL') {
    showPanel('setup-warning');
    return;
  }

  const { createClient } = supabase;
  db = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

  checkSession();
  setupLoginForm();
  setupUploadZone();
  setupAddForm();
  setupModal();
});

/* ---- Auth ---- */
async function checkSession() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    currentUser = session.user;
    showPanel('dashboard');
    loadItems();
  } else {
    showPanel('login');
  }
}

function setupLoginForm() {
  document.getElementById('loginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl    = document.getElementById('loginError');
    const btn      = e.target.querySelector('button[type="submit"]');

    errEl.classList.remove('show');
    btn.textContent = 'Signing in…';
    btn.disabled = true;

    const { data, error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
      errEl.textContent = 'Incorrect email or password.';
      errEl.classList.add('show');
      btn.textContent = 'Sign In';
      btn.disabled = false;
      return;
    }

    currentUser = data.user;
    showPanel('dashboard');
    loadItems();
  });
}

async function signOut() {
  await db.auth.signOut();
  currentUser = null;
  showPanel('login');
  document.getElementById('loginForm')?.reset();
}

/* ---- Panel switching ---- */
function showPanel(name) {
  ['login', 'dashboard', 'setup-warning'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === name ? '' : 'none';
  });
}

/* ---- Load items ---- */
async function loadItems() {
  const tbody = document.getElementById('itemsBody');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">Loading…</td></tr>`;

  const { data, error } = await db
    .from('portfolio_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data?.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="admin-empty">
          <span class="phi-empty">φ</span>
          <p>No work uploaded yet. Add your first piece!</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(item => {
    const thumb = item.media_type === 'video'
      ? (item.thumbnail_url || cloudinaryThumb(item.cloudinary_url, 'video'))
      : cloudinaryThumb(item.cloudinary_url, 'image');

    const catBadge = `<span class="badge badge-${item.category}">${item.category}</span>`;
    const typeBadge = `<span class="badge badge-video">${item.media_type}</span>`;
    const star = item.is_featured ? '★' : '☆';
    const date = new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    return `
      <tr>
        <td><img class="item-thumb" src="${thumb}" alt="${escHtml(item.title)}" loading="lazy"></td>
        <td style="max-width:200px">
          <strong style="font-weight:400">${escHtml(item.title)}</strong>
          ${item.description ? `<br><span style="font-size:12px;color:var(--text-muted)">${escHtml(item.description.substring(0, 60))}…</span>` : ''}
        </td>
        <td>${catBadge}</td>
        <td>${typeBadge}</td>
        <td style="color:var(--text-muted);font-size:13px">${date}</td>
        <td>
          <div class="item-actions">
            <button class="star-btn" title="${item.is_featured ? 'Remove from homepage' : 'Feature on homepage'}"
                    onclick="toggleFeatured('${item.id}', ${item.is_featured})">${star}</button>
            <button class="btn-icon del" title="Delete" onclick="deleteItem('${item.id}')">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M1 1l11 11M12 1L1 12"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* ---- Toggle featured ---- */
async function toggleFeatured(id, current) {
  const { error } = await db
    .from('portfolio_items')
    .update({ is_featured: !current })
    .eq('id', id);

  if (error) { showToast('Error updating item.', 'error'); return; }
  showToast(current ? 'Removed from homepage.' : 'Featured on homepage! ★');
  loadItems();
}

/* ---- Delete item ---- */
async function deleteItem(id) {
  if (!confirm('Delete this item? This cannot be undone.')) return;

  const { error } = await db
    .from('portfolio_items')
    .delete()
    .eq('id', id);

  if (error) { showToast('Error deleting item.', 'error'); return; }
  showToast('Item deleted.');
  loadItems();
}

/* ---- Modal ---- */
function openModal() {
  resetForm();
  document.getElementById('addModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('addModal').classList.remove('open');
  document.body.style.overflow = '';
}

function setupModal() {
  document.getElementById('addModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
}

/* ---- File upload zone ---- */
function setupUploadZone() {
  const zone    = document.getElementById('uploadZone');
  const input   = document.getElementById('fileInput');
  const nameEl  = document.getElementById('uploadFilename');

  if (!zone || !input) return;

  input.addEventListener('change', () => {
    handleFile(input.files[0]);
  });

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
  });
}

function handleFile(file) {
  if (!file) return;
  selectedFile = file;
  uploadedMediaUrl = null;

  const zone   = document.getElementById('uploadZone');
  const nameEl = document.getElementById('uploadFilename');

  zone.classList.add('has-file');
  nameEl.textContent = file.name;

  // Auto-detect type
  const type = file.type.startsWith('video/') ? 'video' : 'image';
  document.getElementById('mediaType').value = type;
}

/* ---- Upload to Cloudinary ---- */
async function uploadToCloudinary(file) {
  if (!window.CONFIG?.cloudinary?.cloudName || CONFIG.cloudinary.cloudName === 'YOUR_CLOUD_NAME') {
    throw new Error('Cloudinary not configured. Please update js/config.js');
  }

  const progressBar  = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const progressWrap = document.getElementById('uploadProgress');

  progressWrap.classList.add('show');
  progressFill.style.width = '0%';
  progressText.textContent = 'Uploading…';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CONFIG.cloudinary.uploadPreset);
  formData.append('folder', 'phi-studio');

  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
  const url = `https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        progressFill.style.width = pct + '%';
        progressText.textContent = `Uploading… ${pct}%`;
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        progressText.textContent = 'Upload complete!';
        resolve(res);
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.send(formData);
  });
}

/* ---- Add item form ---- */
function setupAddForm() {
  document.getElementById('addForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');

    if (!selectedFile) {
      showToast('Please select a file to upload.', 'error');
      return;
    }

    const title    = document.getElementById('itemTitle').value.trim();
    const category = document.getElementById('itemCategory').value;
    const desc     = document.getElementById('itemDescription').value.trim();
    const type     = document.getElementById('mediaType').value;

    if (!title) { showToast('Please enter a title.', 'error'); return; }

    btn.textContent = 'Uploading…';
    btn.disabled = true;

    try {
      // 1. Upload to Cloudinary
      const result = await uploadToCloudinary(selectedFile);
      const mediaUrl = result.secure_url;

      // 2. Generate thumbnail URL for videos
      let thumbUrl = null;
      if (type === 'video') {
        thumbUrl = cloudinaryThumb(mediaUrl, 'video');
      }

      // 3. Save metadata to Supabase
      const { error } = await db.from('portfolio_items').insert([{
        title,
        category,
        description: desc || null,
        media_type:  type,
        cloudinary_url: mediaUrl,
        thumbnail_url:  thumbUrl,
        is_featured: false
      }]);

      if (error) throw error;

      showToast('Work added successfully!');
      closeModal();
      loadItems();

    } catch (err) {
      console.error(err);
      showToast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      btn.textContent = 'Publish Work';
      btn.disabled = false;
    }
  });
}

/* ---- Reset form ---- */
function resetForm() {
  document.getElementById('addForm')?.reset();
  selectedFile = null;
  uploadedMediaUrl = null;

  const zone = document.getElementById('uploadZone');
  zone?.classList.remove('has-file', 'drag-over');

  const nameEl = document.getElementById('uploadFilename');
  if (nameEl) nameEl.textContent = '';

  const progressWrap = document.getElementById('uploadProgress');
  if (progressWrap) {
    progressWrap.classList.remove('show');
    document.getElementById('progressFill').style.width = '0%';
  }
}

/* ---- Util ---- */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cloudinaryThumb(url, type) {
  if (!url) return '';
  if (type === 'video') {
    return url
      .replace('/video/upload/', '/video/upload/so_1,w_400,c_fill,ar_4:3/')
      .replace(/\.(mp4|mov|webm|avi)$/i, '.jpg');
  }
  return url.replace('/image/upload/', '/image/upload/w_400,c_fill/');
}

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
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}
