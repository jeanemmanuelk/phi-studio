/* ================================================
   THE SYMBOL φ STUDIO — Admin Panel JS
   ================================================ */

let db            = null;
let currentUser   = null;
let selectedFile  = null;

/* ---- Show a screen ---- */
function show(id) {
  ['screen-loading', 'screen-error', 'screen-login', 'screen-dashboard'].forEach(s => {
    const el = document.getElementById(s);
    if (!el) return;
    el.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (target) {
    target.style.display = id === 'screen-error' ? 'flex' : 'block';
  }
}

function showError(title, msg) {
  document.getElementById('errTitle').textContent = title;
  document.getElementById('errMsg').innerHTML = msg;
  show('screen-error');
}

/* ---- Boot ---- */
window.addEventListener('load', async () => {
  // 1. Check config
  if (!window.CONFIG || CONFIG.supabase.url === 'YOUR_SUPABASE_URL') {
    showError(
      'Setup Required',
      'Please open <code>js/config.js</code> and fill in your Supabase and Cloudinary details. See <strong>SETUP.md</strong> for instructions.'
    );
    return;
  }

  // 2. Check Supabase library loaded
  if (typeof supabase === 'undefined') {
    showError(
      'Could not load Supabase',
      'The Supabase library failed to load. Please check your internet connection and refresh the page.'
    );
    return;
  }

  // 3. Create client
  try {
    db = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
  } catch (e) {
    showError('Configuration Error', 'Could not connect to Supabase: ' + e.message);
    return;
  }

  // 4. Check session
  try {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;

    if (data.session) {
      currentUser = data.session.user;
      document.getElementById('adminUser').textContent = currentUser.email;
      show('screen-dashboard');
      loadItems();
    } else {
      show('screen-login');
    }
  } catch (e) {
    showError('Connection Error', 'Could not reach Supabase. Check your URL and anon key in <code>js/config.js</code>.<br><br>Error: ' + e.message);
    return;
  }

  // 5. Wire up forms
  setupLoginForm();
  setupUploadZone();
  setupAddForm();

  // Close modal on backdrop click
  document.getElementById('addModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
});

/* ── Login ── */
function setupLoginForm() {
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl    = document.getElementById('loginError');
    const btn      = e.target.querySelector('button[type="submit"]');

    errEl.style.display = 'none';
    btn.textContent = 'Signing in…';
    btn.disabled = true;

    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;

      currentUser = data.user;
      document.getElementById('adminUser').textContent = currentUser.email;
      show('screen-dashboard');
      loadItems();
    } catch (err) {
      errEl.textContent = err.message.includes('Invalid') || err.message.includes('credentials')
        ? 'Incorrect email or password.'
        : err.message;
      errEl.style.display = 'block';
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });
}

async function signOut() {
  await db.auth.signOut();
  currentUser = null;
  document.getElementById('loginForm').reset();
  show('screen-login');
}

/* ── Load items ── */
async function loadItems() {
  const tbody = document.getElementById('itemsBody');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">Loading…</td></tr>`;

  const { data, error } = await db
    .from('portfolio_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#b83232">
      Error loading items: ${error.message}.<br>Make sure you ran the SQL setup in Supabase.
    </td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
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

    const star = item.is_featured ? '★' : '☆';
    const date = new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    return `
      <tr>
        <td><img class="item-thumb" src="${thumb}" alt="${esc(item.title)}" loading="lazy"></td>
        <td style="max-width:200px">
          <strong style="font-weight:400">${esc(item.title)}</strong>
          ${item.description ? `<br><span style="font-size:12px;color:var(--text-muted)">${esc(item.description.slice(0, 60))}…</span>` : ''}
        </td>
        <td><span class="badge badge-${item.category}">${item.category}</span></td>
        <td><span class="badge">${item.media_type}</span></td>
        <td style="color:var(--text-muted);font-size:13px">${date}</td>
        <td>
          <div class="item-actions">
            <button class="star-btn" title="${item.is_featured ? 'Remove from homepage' : 'Feature on homepage'}"
                    onclick="toggleFeatured('${item.id}', ${item.is_featured})">${star}</button>
            <button class="btn-icon del" title="Delete" onclick="deleteItem('${item.id}')">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M1 1l10 10M11 1L1 11"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* ── Toggle featured ── */
async function toggleFeatured(id, current) {
  const { error } = await db
    .from('portfolio_items')
    .update({ is_featured: !current })
    .eq('id', id);

  if (error) { toast('Error: ' + error.message, true); return; }
  toast(current ? 'Removed from homepage.' : 'Starred — will appear on homepage!');
  loadItems();
}

/* ── Delete ── */
async function deleteItem(id) {
  if (!confirm('Delete this item? This cannot be undone.')) return;
  const { error } = await db.from('portfolio_items').delete().eq('id', id);
  if (error) { toast('Error: ' + error.message, true); return; }
  toast('Item deleted.');
  loadItems();
}

/* ── Modal ── */
function openModal() {
  resetForm();
  document.getElementById('addModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('addModal').classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Upload zone ── */
function setupUploadZone() {
  const zone  = document.getElementById('uploadZone');
  const input = document.getElementById('fileInput');
  if (!zone || !input) return;

  input.addEventListener('change', () => handleFile(input.files[0]));

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
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
  document.getElementById('uploadZone').classList.add('has-file');
  document.getElementById('uploadFilename').textContent = file.name;
  document.getElementById('mediaType').value = file.type.startsWith('video/') ? 'video' : 'image';
}

/* ── Upload to Cloudinary ── */
async function uploadToCloudinary(file) {
  const progressWrap = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  progressWrap.classList.add('show');
  progressFill.style.width = '0%';
  progressText.textContent = 'Uploading…';

  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
  const url = `https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CONFIG.cloudinary.uploadPreset);
  formData.append('folder', 'phi-studio');

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
        progressText.textContent = 'Upload complete!';
        resolve(JSON.parse(xhr.responseText));
      } else {
        const body = JSON.parse(xhr.responseText || '{}');
        reject(new Error(body.error?.message || `Cloudinary error (${xhr.status}). Check your cloud name and upload preset.`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
    xhr.send(formData);
  });
}

/* ── Add form submit ── */
function setupAddForm() {
  document.getElementById('addForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');

    if (!selectedFile) { toast('Please select a file first.', true); return; }

    const title    = document.getElementById('itemTitle').value.trim();
    const category = document.getElementById('itemCategory').value;
    const desc     = document.getElementById('itemDescription').value.trim();
    const type     = document.getElementById('mediaType').value;

    if (!title) { toast('Please enter a title.', true); return; }

    btn.textContent = 'Uploading…';
    btn.disabled = true;

    try {
      const result   = await uploadToCloudinary(selectedFile);
      const mediaUrl = result.secure_url;
      const thumbUrl = type === 'video' ? cloudinaryThumb(mediaUrl, 'video') : null;

      const { error } = await db.from('portfolio_items').insert([{
        title,
        category,
        description:    desc || null,
        media_type:     type,
        cloudinary_url: mediaUrl,
        thumbnail_url:  thumbUrl,
        is_featured:    false
      }]);

      if (error) throw error;

      toast('Work published successfully!');
      closeModal();
      loadItems();
    } catch (err) {
      toast(err.message || 'Something went wrong. Please try again.', true);
    } finally {
      btn.textContent = 'Publish Work';
      btn.disabled = false;
    }
  });
}

function resetForm() {
  document.getElementById('addForm')?.reset();
  selectedFile = null;
  document.getElementById('uploadZone')?.classList.remove('has-file', 'drag-over');
  document.getElementById('uploadFilename').textContent = '';
  const pw = document.getElementById('uploadProgress');
  if (pw) {
    pw.classList.remove('show');
    document.getElementById('progressFill').style.width = '0%';
  }
}

/* ── Helpers ── */
function cloudinaryThumb(url, type) {
  if (!url) return '';
  if (type === 'video') {
    return url
      .replace('/video/upload/', '/video/upload/so_1,w_400,c_fill,ar_4:3/')
      .replace(/\.(mp4|mov|webm|avi)$/i, '.jpg');
  }
  return url.replace('/image/upload/', '/image/upload/w_400,c_fill/');
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toast(msg, isError = false) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast' + (isError ? ' error' : '');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 4000);
}
