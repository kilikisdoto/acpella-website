/* ════════════════════════════════
   ADMIN PANEL
════════════════════════════════ */
const API_URL = 'https://acpella-backend-production.up.railway.app';
let isAdmin = false;
let adminToken = null;

// Check URL hash for admin
function checkAdminHash() {
  if (window.location.hash === '#admin') {
    document.getElementById('adminOverlay').classList.add('open');
  }
}
window.addEventListener('hashchange', checkAdminHash);
window.addEventListener('load', checkAdminHash);
// Also check on DOMContentLoaded
document.addEventListener('DOMContentLoaded', checkAdminHash);

async function doAdminLogin() {
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value;
  try {
    const res = await fetch(API_URL + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();
    if (data.success) {
      adminToken = data.token;
      document.getElementById('adminOverlay').classList.remove('open');
      document.getElementById('adminError').classList.remove('show');
      enableAdminMode();
      loadContentFromAPI();
    } else {
      document.getElementById('adminError').classList.add('show');
      document.getElementById('adminPass').value = '';
      document.getElementById('adminPass').focus();
    }
  } catch(e) {
    document.getElementById('adminError').classList.add('show');
    console.error('Login error:', e);
  }
}

function enableAdminMode() {
  isAdmin = true;
  document.body.classList.add('admin-mode');
  document.getElementById('adminBar').classList.add('active');
  // Show admin-only elements
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = '';
  });
  // Re-render iso and cert lists to show delete buttons
  loadIsologismoi();
  loadCertificates();
  // Unlock cert inputs
  document.querySelectorAll('.admin-field-input').forEach(el => {
    el.removeAttribute('readonly');
  });
  // Make all contenteditable actually editable
  document.querySelectorAll('[data-editable="true"]').forEach(el => {
    el.setAttribute('contenteditable', 'true');
  });
  // Add visual hint for editable elements
  document.querySelectorAll('[data-ck]').forEach(el => {
    el.title = 'Κλικ για επεξεργασία';
  });
  // Make gallery cells replaceable on click (when admin)
  document.querySelectorAll('.gallery-cell').forEach((cell, i) => {
    cell.addEventListener('click', function adminCellClick(e) {
      if (!isAdmin) return;
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const url = URL.createObjectURL(input.files[0]);
        let img = cell.querySelector('img');
        if (!img) {
          img = document.createElement('img');
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
          cell.appendChild(img);
        }
        img.src = url;
      };
      input.click();
    }, {once: false});
  });
  // Remove previous lightbox clicks to avoid conflict
  document.querySelectorAll('.gallery-cell img').forEach(img => {
    img.onclick = null;
  });
}

function adminLogout() {
  isAdmin = false;
  document.body.classList.remove('admin-mode');
  document.getElementById('adminBar').classList.remove('active');
  // Hide admin-only elements
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = 'none';
  });
  // Lock cert inputs
  document.querySelectorAll('.admin-field-input').forEach(el => {
    el.setAttribute('readonly', true);
  });
  // Lock all contenteditable
  document.querySelectorAll('[contenteditable="true"]').forEach(el => {
    el.setAttribute('contenteditable', 'false');
  });
  // Remove admin hash
  try { history.pushState('', document.title, window.location.pathname); } catch(e) {}
}

async function adminSave() {
  const editables = document.querySelectorAll('[data-ck]');
  const items = [];
  editables.forEach(el => {
    const key = el.dataset.ck;
    const value = el.innerHTML || el.value || el.textContent;
    if (key && value) items.push({ key, value });
  });
  try {
    const res = await fetch(API_URL + '/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + adminToken
      },
      body: JSON.stringify({ items })
    });
    const data = await res.json();
    console.log('Saved:', data.saved, 'items');
  } catch(e) {
    console.error('Save error:', e);
  }
  // Show toast
  const toast = document.getElementById('saveToast');
  toast.textContent = '✅ Αποθηκεύτηκε! Θα εμφανιστεί σε όλους.';
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); toast.textContent = '✅ Αποθηκεύτηκε!'; }, 3000);
}

function adminAddPhotos(input) {
  const grid = document.getElementById('galleryGrid');
  const caption = prompt('Τίτλος φωτογραφίας (προαιρετικό):') || '';
  Array.from(input.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target.result;
      // Save to API
      try {
        await fetch(API_URL + '/api/gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + adminToken
          },
          body: JSON.stringify({ image_data: imageData, caption, category: 'egkat' })
        });
      } catch(err) {}
      // Add to grid
      const div = document.createElement('div');
      div.className = 'gallery-cell';
      div.dataset.cat = 'egkat';
      div.style.cssText = 'position:relative;overflow:hidden;cursor:pointer;';
      div.innerHTML = `<img src="${imageData}" style="width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"/>
        ${caption ? `<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.55);color:#fff;font-size:0.72rem;padding:0.4rem 0.7rem;">${caption}</div>` : ''}`;
      grid.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

// Load content from API on page load
async function loadContentFromAPI() {
  try {
    const res = await fetch(API_URL + '/api/content');
    const data = await res.json();
    Object.keys(data).forEach(key => {
      const el = document.querySelector(`[data-ck="${key}"]`);
      if (el && data[key]) {
        el.innerHTML = data[key];
      }
    });
    console.log('Content loaded from API:', Object.keys(data).length, 'items');
  } catch(e) {
    console.error('Load content error:', e);
  }
}

// Load announcements from API
async function loadAnnouncements() {
  try {
    const res = await fetch(API_URL + '/api/announcements');
    const anns = await res.json();
    const container = document.getElementById('annList') || document.getElementById('annContainer');
    if (!container) return;
    container.innerHTML = '';
    if (!anns.length) {
      container.innerHTML = '<div class="ann-empty" id="annEmpty">Δεν υπάρχουν ανακοινώσεις ακόμα.</div>';
      return;
    }
    anns.forEach(ann => {
      const card = document.createElement('div');
      card.className = 'ann-card';
      card.dataset.id = ann.id;
      const dateFormatted = new Date(ann.date).toLocaleDateString('el-GR', { day:'numeric', month:'long', year:'numeric' });
      const imgHtml = ann.image ? `<img src="${ann.image}" style="width:100%;max-height:280px;object-fit:cover;border-radius:6px;margin-top:0.8rem;"/>` : '';
      const delBtn = `<button class="btn-del-ann admin-only" onclick="deleteAnnouncement(${ann.id})" style="display:${isAdmin ? 'flex' : 'none'};position:absolute;top:1rem;right:1rem;background:#c0392b;color:#fff;border:none;border-radius:50%;width:28px;height:28px;align-items:center;justify-content:center;cursor:pointer;font-size:0.75rem;">✕</button>`;
      card.style.position = 'relative';
      card.innerHTML = `
        ${delBtn}
        <div class="ann-date">${dateFormatted}</div>
        <div class="ann-title">${ann.title}</div>
        ${ann.body ? `<div class="ann-body">${ann.body}</div>` : ''}
        ${imgHtml}
      `;
      container.appendChild(card);
    });
  } catch(e) {
    console.error('loadAnnouncements error:', e);
  }
}

async function deleteAnnouncement(id) {
  try {
    await fetch(API_URL + '/api/announcements/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    loadAnnouncements();
  } catch(e) {}
}

// Load gallery from API
async function loadGalleryFromAPI() {
  try {
    const res = await fetch(API_URL + '/api/gallery');
    const images = await res.json();
    if (!images.length) return;
    const grid = document.getElementById('galleryGrid');
    images.forEach(img => {
      const div = document.createElement('div');
      div.className = 'gallery-cell';
      div.dataset.cat = img.category || 'egkat';
      div.dataset.dbId = img.id;
      div.style.cssText = 'position:relative;overflow:hidden;cursor:pointer;';
      div.innerHTML = `
        <img src="${img.image_data}" alt="${img.caption}" style="width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"/>
        ${img.caption ? `<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.55);color:#fff;font-size:0.72rem;padding:0.4rem 0.7rem;">${img.caption}</div>` : ''}
        <button class="admin-only" onclick="deleteGalleryImage(${img.id},this)" style="display:none;position:absolute;top:6px;right:6px;background:rgba(200,0,0,0.8);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:0.7rem;">✕</button>
      `;
      grid.appendChild(div);
    });
  } catch(e) {}
}

async function deleteGalleryImage(id, btn) {
  if (!confirm('Διαγραφή φωτογραφίας;')) return;
  try {
    await fetch(API_URL + '/api/gallery/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    btn.closest('.gallery-cell').remove();
  } catch(e) {}
}

// Load latest 3 announcements for home page + sidebar
async function loadHomeAnnouncements() {
  try {
    const res = await fetch(API_URL + '/api/announcements');
    const anns = await res.json();

    // Fill sidebar (2 latest)
    const sidebar = document.getElementById('sidebarAnnList');
    if (sidebar) {
      if (!anns.length) {
        sidebar.innerHTML = '<div style="font-size:0.78rem;color:var(--muted);">Δεν υπάρχουν ανακοινώσεις ακόμα.</div>';
      } else {
        sidebar.innerHTML = '';
        anns.slice(0, 2).forEach(ann => {
          const dateFormatted = new Date(ann.date).toLocaleDateString('el-GR', { day:'numeric', month:'short', year:'numeric' });
          const item = document.createElement('div');
          item.className = 'sidebar-ann-item';
          item.onclick = () => navigate('ann');
          item.innerHTML = `
            <div class="sidebar-ann-date">${dateFormatted}</div>
            <div class="sidebar-ann-title">${ann.title}</div>
          `;
          sidebar.appendChild(item);
        });
      }
    }

    // Fill home grid (3 latest)
    const grid = document.getElementById('homeAnnGrid');
    if (!grid) return;
    if (!anns.length) {
      grid.innerHTML = '<div class="home-ann-empty">Δεν υπάρχουν ανακοινώσεις ακόμα.</div>';
      return;
    }
    grid.innerHTML = '';
    anns.slice(0, 3).forEach(ann => {
      const dateFormatted = new Date(ann.date).toLocaleDateString('el-GR', { day:'numeric', month:'long', year:'numeric' });
      const card = document.createElement('div');
      card.className = 'home-ann-card';
      card.onclick = () => navigate('ann');
      card.innerHTML = `
        ${ann.image ? `<img class="home-ann-card-img" src="${ann.image}" alt="${ann.title}"/>` : ''}
        <div class="home-ann-card-body">
          <div class="home-ann-card-date">${dateFormatted}</div>
          <div class="home-ann-card-title">${ann.title}</div>
          ${ann.body ? `<div class="home-ann-card-excerpt">${ann.body}</div>` : ''}
        </div>
      `;
      grid.appendChild(card);
    });
  } catch(e) {}
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  loadContentFromAPI();
  loadAnnouncements();
  loadIsologismoi();
  loadCertificates();
  loadGalleryFromAPI();
  loadHomeAnnouncements();
  loadCMSPages(); // Load dynamic pages on startup
});




/* ════════════════════════════════
   ADMIN INLINE EDIT CONTROLS
════════════════════════════════ */

function renameNavItem(navId, e) {
  e.stopPropagation();
  const el = document.getElementById('nav-' + navId);
  if (!el) return;
  const current = el.textContent.trim();
  const newName = prompt('Νέο όνομα για "' + current + '":', current);
  if (!newName || newName === current) return;
  el.textContent = newName;
  el.dataset.el = newName;
  adminSave();
}

function deleteNavItem(navId, e) {
  e.stopPropagation();
  const el = document.getElementById('nav-' + navId);
  const name = el ? el.textContent.trim() : navId;
  if (!confirm('Διαγραφή "' + name + '" από το μενού;\nΠροσοχή: δεν διαγράφεται το περιεχόμενο!')) return;
  const li = el ? el.closest('li') : null;
  if (li) li.style.display = 'none';
}

function renameCat(catId, e) {
  e.stopPropagation();
  const header = document.querySelector('#page-egk .egk-overview-card .egk-overview-header[onclick*="' + catId + '"] .egk-overview-title');
  if (!header) return;
  const current = header.textContent.trim();
  const newName = prompt('Νέο όνομα:', current);
  if (!newName || newName === current) return;
  header.textContent = newName;
  // Also update dropdown
  const navA = document.querySelector('.nav-dropdown-item a[onclick*="' + catId + '"]');
  if (navA) navA.textContent = newName;
  adminSave();
}

function deleteCat(catId, e) {
  e.stopPropagation();
  if (!confirm('Διαγραφή κατηγορίας;')) return;
  // Hide in overview
  const card = document.querySelector('#page-egk .egk-overview-card:has([onclick*="' + catId + '"])');
  if (card) card.style.display = 'none';
  // Hide in dropdown
  const dropItem = document.querySelector('.nav-dropdown-item:has(a[onclick*="' + catId + '"])');
  if (dropItem) dropItem.style.display = 'none';
}

function renameSubpage(pageId, e) {
  e.stopPropagation();
  const links = document.querySelectorAll('a[onclick*="' + pageId + '"]');
  if (!links.length) return;
  const current = links[0].textContent.trim();
  const newName = prompt('Νέο όνομα:', current);
  if (!newName || newName === current) return;
  links.forEach(l => { l.textContent = newName; });
  // Update page title
  const pageTitle = document.querySelector('#page-' + pageId + ' .section-title');
  if (pageTitle) pageTitle.textContent = newName;
  adminSave();
}

function deleteSubpage(pageId, e) {
  e.stopPropagation();
  if (!confirm('Διαγραφή υποκατηγορίας;')) return;
  // Hide the li in overview
  const li = document.querySelector('.egk-overview-links li:has(a[onclick*="' + pageId + '"])');
  if (li) li.style.display = 'none';
  // Hide in dropdown
  const dropA = document.querySelector('.nav-subdropdown a[onclick*="' + pageId + '"]');
  if (dropA) dropA.style.display = 'none';
}

function addSubpage(btn, e) {
  e.stopPropagation();
  const title = prompt('Τίτλος νέας υποκατηγορίας:');
  if (!title) return;
  const ul = btn.closest('ul');
  const addLi = btn.closest('li');
  const newLi = document.createElement('li');
  const slug = 'new-' + Date.now();
  newLi.innerHTML = `
    <a onclick="navigate('cms-${slug}')">${title}</a>
    <div class="egk-link-ctrl" style="display:flex;">
      <button class="admin-ctrl-btn admin-ctrl-edit" onclick="renameSubpage('cms-${slug}',event)" title="Μετονομασία">✏️</button>
      <button class="admin-ctrl-btn admin-ctrl-del" onclick="deleteSubpage('cms-${slug}',event)" title="Διαγραφή">✕</button>
    </div>
  `;
  ul.insertBefore(newLi, addLi);
  // Create page in CMS
  fetch(API_URL + '/api/pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
    body: JSON.stringify({ title, slug, content: '', parent_id: null })
  }).then(() => loadCMSPages());
}

function addSubpageToDropdown(parentCat, e) {
  e.stopPropagation();
  const title = prompt('Τίτλος νέας υποσελίδας:');
  if (!title) return;
  const slug = parentCat + '-new-' + Date.now();
  // Add to subdropdown in nav
  const subdropdown = e.target.closest('.nav-subdropdown');
  if (subdropdown) {
    const newA = document.createElement('a');
    newA.textContent = title;
    newA.onclick = () => navigate('cms-' + slug);
    subdropdown.insertBefore(newA, e.target);
  }
  // Add to egk overview
  const overviewUl = document.querySelector('#page-egk .egk-overview-card:has([onclick*="' + parentCat + '"]) .egk-overview-links');
  if (overviewUl) {
    const addLi = overviewUl.querySelector('.admin-only');
    const newLi = document.createElement('li');
    newLi.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
    newLi.innerHTML = `<a onclick="navigate('cms-${slug}')">${title}</a>
      <div class="egk-link-ctrl" style="display:flex;gap:2px;margin-left:4px;">
        <button class="admin-ctrl-btn admin-ctrl-edit" onclick="renameSubpage('cms-${slug}',event)">✏️</button>
        <button class="admin-ctrl-btn admin-ctrl-del" onclick="deleteSubpage('cms-${slug}',event)">✕</button>
      </div>`;
    overviewUl.insertBefore(newLi, addLi);
  }
  // Save page
  fetch(API_URL + '/api/pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
    body: JSON.stringify({ title, slug: 'cms-' + slug, content: '', parent_id: null })
  }).then(() => loadCMSPages());
}

function addSubpageToNav(navId, e) {
  e.stopPropagation();
  const title = prompt('Τίτλος νέας υποσελίδας:');
  if (!title) return;
  const slug = 'sub-' + navId + '-' + Date.now();
  const dropdown = document.getElementById('dropdown-' + navId);
  if (!dropdown) return;
  const addBtn = dropdown.querySelector('.admin-only');
  const newItem = document.createElement('div');
  newItem.className = 'nav-dropdown-item';
  newItem.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;">
      <a onclick="navigate('cms-${slug}')">${title}</a>
      <div class="sub-admin-ctrl" style="display:none;">
        <button class="admin-ctrl-btn admin-ctrl-edit" onclick="renameSubpage('cms-${slug}',event)">✏️</button>
        <button class="admin-ctrl-btn admin-ctrl-del" onclick="deleteSubpage('cms-${slug}',event)">✕</button>
      </div>
    </div>
  `;
  dropdown.insertBefore(newItem, addBtn);
  // Save to CMS
  fetch(API_URL + '/api/pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
    body: JSON.stringify({ title, slug, content: '' })
  }).then(() => loadCMSPages());
}

function addCategory() {
  const title = prompt('Τίτλος νέας κατηγορίας:');
  if (!title) return;
  const icon = prompt('Εικονίδιο (emoji):', '📄') || '📄';
  const slug = 'cat-' + Date.now();
  const grid = document.querySelector('.egk-overview-grid');
  const addCard = document.querySelector('.egk-overview-grid .admin-only');
  const newCard = document.createElement('div');
  newCard.className = 'egk-overview-card';
  newCard.innerHTML = `
    <div class="egk-overview-header" onclick="navigate('cms-${slug}')">
      <span class="egk-overview-icon">${icon}</span>
      <h3 class="egk-overview-title">${title}</h3>
    </div>
    <div class="egk-admin-ctrl">
      <button class="admin-ctrl-btn admin-ctrl-edit" onclick="renameCat('cms-${slug}',event)">✏️</button>
      <button class="admin-ctrl-btn admin-ctrl-del" onclick="deleteCat('cms-${slug}',event)">✕</button>
    </div>
    <ul class="egk-overview-links">
      <li class="admin-only" style="display:flex;">
        <a onclick="addSubpage(this,event)" style="color:var(--green);font-weight:600;">➕ Νέα υποκατηγορία</a>
      </li>
    
        <li class="admin-only" style="display:none;padding:0.3rem 0;">
          <a onclick="addSubpage(this,event)" style="color:var(--green);font-weight:600;font-size:0.78rem;cursor:pointer;">➕ Νέα υποκατηγορία</a>
        </li></ul>
  `;
  grid.insertBefore(newCard, addCard);
  // Save to CMS
  fetch(API_URL + '/api/pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
    body: JSON.stringify({ title, slug, content: '' })
  }).then(() => loadCMSPages());
}


/* ════════════════════════════════
   CMS - PAGE MANAGER
════════════════════════════════ */
let cmsPages = [];
let cmsCurrentPage = null;
let cmsCurrentImage = null;

function openCMS() {
  document.getElementById('cmsOverlay').classList.add('open');
  loadCMSPages();
}

function closeCMS() {
  document.getElementById('cmsOverlay').classList.remove('open');
}

async function loadCMSPages() {
  try {
    const res = await fetch(API_URL + '/api/pages');
    cmsPages = await res.json();
    renderCMSTree();
    renderDynamicNav();
  } catch(e) {
    console.error('CMS load error:', e);
  }
}

function renderCMSTree() {
  const list = document.getElementById('cmsTreeList');
  list.innerHTML = '';
  const roots = cmsPages.filter(p => !p.parent_id);
  if (!roots.length) {
    list.innerHTML = '<li style="padding:1rem;color:var(--muted);font-size:0.8rem;">Δεν υπάρχουν σελίδες ακόμα.</li>';
    return;
  }
  roots.forEach(page => {
    const li = document.createElement('li');
    li.className = 'cms-tree-item' + (cmsCurrentPage?.id === page.id ? ' active' : '');
    li.innerHTML = `<span onclick="editCMSPage(${page.id})">📄 ${page.title}</span>
      <div style="display:flex;gap:4px;">
        <button class="cms-tb-btn cms-del-btn" onclick="event.stopPropagation();addSubPage(${page.id})" style="opacity:1;color:var(--green);font-size:0.65rem;">+sub</button>
        <button class="cms-del-btn" onclick="event.stopPropagation();deleteCMSPage(${page.id})">✕</button>
      </div>`;
    list.appendChild(li);
    // Children
    const children = cmsPages.filter(p => p.parent_id === page.id);
    children.forEach(child => {
      const cli = document.createElement('li');
      cli.className = 'cms-tree-item cms-tree-child' + (cmsCurrentPage?.id === child.id ? ' active' : '');
      cli.innerHTML = `<span onclick="editCMSPage(${child.id})">└ ${child.title}</span>
        <div style="display:flex;gap:4px;">
          <button class="cms-tb-btn cms-del-btn" onclick="event.stopPropagation();addSubPage(${child.id})" style="opacity:1;color:var(--green);font-size:0.65rem;">+sub</button>
          <button class="cms-del-btn" onclick="event.stopPropagation();deleteCMSPage(${child.id})">✕</button>
        </div>`;
      list.appendChild(cli);
      // Grandchildren
      const grandchildren = cmsPages.filter(p => p.parent_id === child.id);
      grandchildren.forEach(gc => {
        const gli = document.createElement('li');
        gli.className = 'cms-tree-item cms-tree-grandchild' + (cmsCurrentPage?.id === gc.id ? ' active' : '');
        gli.innerHTML = `<span onclick="editCMSPage(${gc.id})">└ ${gc.title}</span>
          <button class="cms-del-btn" onclick="event.stopPropagation();deleteCMSPage(${gc.id})">✕</button>`;
        list.appendChild(gli);
      });
    });
  });
}

async function editCMSPage(id) {
  try {
    const res = await fetch(API_URL + '/api/pages/' + cmsPages.find(p => p.id === id)?.slug);
    cmsCurrentPage = await res.json();
    cmsCurrentImage = cmsCurrentPage.image || null;
    const editor = document.getElementById('cmsEditor');
    const parentOptions = cmsPages.filter(p => p.id !== id).map(p => `<option value="${p.id}" ${cmsCurrentPage.parent_id === p.id ? 'selected' : ''}>${p.title}</option>`).join('');
    editor.innerHTML = `
      <div class="cms-editor-header">✏️ Επεξεργασία: ${cmsCurrentPage.title}</div>
      <div class="cms-field">
        <label>Τίτλος σελίδας</label>
        <input type="text" id="cmsTitle" value="${cmsCurrentPage.title}"/>
      </div>
      <div class="cms-field">
        <label>Γονική σελίδα (προαιρετικό)</label>
        <select id="cmsParent">
          <option value="">— Κύρια σελίδα —</option>
          ${parentOptions}
        </select>
      </div>
      <div class="cms-field">
        <label>Περιεχόμενο</label>
        <div class="cms-toolbar">
          <button class="cms-tb-btn" onclick="cmsFormat('bold')"><b>B</b></button>
          <button class="cms-tb-btn" onclick="cmsFormat('italic')"><i>I</i></button>
          <button class="cms-tb-btn" onclick="cmsFormat('insertUnorderedList')">• Λίστα</button>
          <button class="cms-tb-btn" onclick="cmsFormat('formatBlock','h3')">Τίτλος</button>
          <button class="cms-tb-btn" onclick="cmsFormat('formatBlock','p')">Κανονικό</button>
        </div>
        <div class="cms-content-editor" id="cmsContent" contenteditable="true">${cmsCurrentPage.content || ''}</div>
      </div>
      <div class="cms-field">
        <label>Φωτογραφία</label>
        <input type="file" accept="image/*" onchange="previewCMSImg(this)"/>
        <img id="cmsImgPreview" src="${cmsCurrentPage.image || ''}" class="cms-img-preview" style="display:${cmsCurrentPage.image ? 'block' : 'none'}"/>
      </div>
    `;
    document.getElementById('cmsSaveBtn').style.display = 'block';
    renderCMSTree();
  } catch(e) { console.error(e); }
}

function showNewPageForm(parentId) {
  cmsCurrentPage = null;
  cmsCurrentImage = null;
  const editor = document.getElementById('cmsEditor');
  const parentOptions = cmsPages.map(p => `<option value="${p.id}" ${parentId === p.id ? 'selected' : ''}>${p.title}</option>`).join('');
  editor.innerHTML = `
    <div class="cms-editor-header">➕ Νέα Σελίδα</div>
    <div class="cms-field">
      <label>Τίτλος σελίδας *</label>
      <input type="text" id="cmsTitle" placeholder="π.χ. Νέα Υπηρεσία"/>
    </div>
    <div class="cms-field">
      <label>Γονική σελίδα (προαιρετικό)</label>
      <select id="cmsParent">
        <option value="">— Κύρια σελίδα —</option>
        ${parentOptions}
      </select>
    </div>
    <div class="cms-field">
      <label>Περιεχόμενο</label>
      <div class="cms-toolbar">
        <button class="cms-tb-btn" onclick="cmsFormat('bold')"><b>B</b></button>
        <button class="cms-tb-btn" onclick="cmsFormat('italic')"><i>I</i></button>
        <button class="cms-tb-btn" onclick="cmsFormat('insertUnorderedList')">• Λίστα</button>
        <button class="cms-tb-btn" onclick="cmsFormat('formatBlock','h3')">Τίτλος</button>
        <button class="cms-tb-btn" onclick="cmsFormat('formatBlock','p')">Κανονικό</button>
      </div>
      <div class="cms-content-editor" id="cmsContent" contenteditable="true"></div>
    </div>
    <div class="cms-field">
      <label>Φωτογραφία (προαιρετικό)</label>
      <input type="file" accept="image/*" onchange="previewCMSImg(this)"/>
      <img id="cmsImgPreview" class="cms-img-preview"/>
    </div>
  `;
  document.getElementById('cmsSaveBtn').style.display = 'block';
}

function addSubPage(parentId) {
  showNewPageForm(parentId);
}

function previewCMSImg(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    cmsCurrentImage = e.target.result;
    const prev = document.getElementById('cmsImgPreview');
    if (prev) { prev.src = cmsCurrentImage; prev.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

function cmsFormat(cmd, val) {
  document.getElementById('cmsContent').focus();
  document.execCommand(cmd, false, val || null);
}

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[αά]/g,'a').replace(/[εέ]/g,'e').replace(/[ηή]/g,'i')
    .replace(/[ιί]/g,'i').replace(/[οό]/g,'o').replace(/[υύ]/g,'u')
    .replace(/[ωώ]/g,'o').replace(/[θ]/g,'th').replace(/[χ]/g,'ch')
    .replace(/[ξ]/g,'x').replace(/[ψ]/g,'ps').replace(/[σς]/g,'s')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

async function saveCMSPage() {
  const title = document.getElementById('cmsTitle')?.value.trim();
  const content = document.getElementById('cmsContent')?.innerHTML || '';
  const parentId = document.getElementById('cmsParent')?.value || null;
  if (!title) { alert('Βάλε τίτλο!'); return; }
  const btn = document.getElementById('cmsSaveBtn');
  btn.textContent = 'Αποθήκευση...'; btn.disabled = true;
  try {
    if (cmsCurrentPage) {
      // Update existing
      await fetch(API_URL + '/api/pages/' + cmsCurrentPage.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
        body: JSON.stringify({ title, content, image: cmsCurrentImage, parent_id: parentId || null })
      });
    } else {
      // Create new
      const slug = slugify(title) + '-' + Date.now();
      await fetch(API_URL + '/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
        body: JSON.stringify({ title, slug, content, image: cmsCurrentImage, parent_id: parentId || null })
      });
    }
    await loadCMSPages();
    const toast = document.getElementById('saveToast');
    toast.textContent = '✅ Σελίδα αποθηκεύτηκε!';
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); toast.textContent = '✅ Αποθηκεύτηκε!'; }, 2500);
  } catch(e) { alert('Σφάλμα: ' + e.message); }
  btn.textContent = '💾 Αποθήκευση'; btn.disabled = false;
}

async function deleteCMSPage(id) {
  if (!confirm('Διαγραφή σελίδας; Θα διαγραφούν και οι υποσελίδες της!')) return;
  try {
    await fetch(API_URL + '/api/pages/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    cmsCurrentPage = null;
    document.getElementById('cmsEditor').innerHTML = '<div class="cms-editor-header">Επιλέξτε σελίδα</div>';
    document.getElementById('cmsSaveBtn').style.display = 'none';
    await loadCMSPages();
  } catch(e) { alert('Σφάλμα: ' + e.message); }
}

// Render dynamic pages in nav and as SPA pages
function renderDynamicNav() {
  // Remove old dynamic pages from DOM
  document.querySelectorAll('.dynamic-page').forEach(el => el.remove());
  // Add new pages as SPA pages
  cmsPages.forEach(page => {
    const div = document.createElement('div');
    div.className = 'page dynamic-page';
    div.id = 'page-cms-' + page.slug;
    div.innerHTML = `
      <div class="page-inner">
        <div class="page-breadcrumb">
          <span onclick="navigate('home')">Αρχική</span>
          ${page.parent_id ? ` › <span onclick="navigate('cms-${cmsPages.find(p=>p.id===page.parent_id)?.slug}')">${cmsPages.find(p=>p.id===page.parent_id)?.title}</span>` : ''}
          › <span>${page.title}</span>
        </div>
        <div class="page-header">
          <h2 class="section-title" data-ck="ck241" data-editable="true" contenteditable="false">${page.title}</h2>
        </div>
        ${page.image ? `<img src="${page.image}" style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;margin-bottom:1.5rem;"/>` : ''}
        <div class="subpage-content">${page.content || ''}</div>
      </div>
      <footer style="margin:0 2rem;">© 2025 <span>A.C. Pella</span> · Αγροτικός Συνεταιρισμός Πέλλας</footer>
    `;
    document.body.insertBefore(div, document.getElementById('lightbox'));
  });
  // Update pages array in router
  window.dynamicPageSlugs = cmsPages.map(p => 'cms-' + p.slug);
}


/* ════════════════════════════════
   LIGHTBOX
════════════════════════════════ */
let lightboxImages = [];
let lightboxIndex = 0;

function openLightbox(imgSrc, caption, index) {
  lightboxImages = Array.from(document.querySelectorAll('.gallery-cell img')).map(img => ({
    src: img.src, caption: img.closest('.gallery-cell').querySelector('div') ? img.closest('.gallery-cell').querySelector('div').textContent : ''
  }));
  lightboxIndex = index;
  document.getElementById('lightboxImg').src = lightboxImages[index].src;
  document.getElementById('lightboxCaption').textContent = lightboxImages[index].caption;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
  if (e && e.target !== document.getElementById('lightbox') && !e.target.classList.contains('lightbox-close')) return;
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function lightboxNav(dir) {
  lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
  document.getElementById('lightboxImg').src = lightboxImages[lightboxIndex].src;
  document.getElementById('lightboxCaption').textContent = lightboxImages[lightboxIndex].caption;
}

// Keyboard nav
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'Escape') { document.getElementById('lightbox').classList.remove('open'); document.body.style.overflow = ''; }
  if (e.key === 'ArrowRight') lightboxNav(1);
  if (e.key === 'ArrowLeft') lightboxNav(-1);
});

/* ════════════════════════════════
   SPA ROUTER
════════════════════════════════ */
const pages = ['home','egk','iso',
  'egk-konservo','egk-konservo-genika','egk-konservo-istoria','egk-konservo-ygeia','egk-konservo-perivallontiki','egk-konservo-frouta','egk-konservo-texnikes','egk-konservo-etiketes',
  'egk-ekko','egk-ekko-genika','egk-ekko-skopos','egk-ekko-paragogi','egk-ekko-dynamikotita','egk-ekko-poiotita',
  'egk-dialogi','egk-dialogi-genika','egk-dialogi-poiotita',
  'egk-kentro','egk-kentro-ypiresies',
  'egk-dimitriaka',
  'pist','gallery','ann','iso','contact'];

function navigate(id) {
  // Check if dynamic page
  if (id.startsWith('cms-')) {
    const allPages = [...pages, ...(window.dynamicPageSlugs || [])];
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + id);
    if (target) { target.classList.add('active'); window.scrollTo(0,0); return; }
  }
  pages.forEach(p => {
    document.getElementById('page-' + p).classList.remove('active');
    const navEl = document.getElementById('nav-' + p);
    if (navEl) navEl.classList.remove('active');
  });
  document.getElementById('page-' + id).classList.add('active');
  const navEl = document.getElementById('nav-' + id);
  if (navEl) navEl.classList.add('active');
  window.scrollTo(0, 0);
  try { history.pushState({page: id}, '', '#' + id); } catch(e) {}
}

window.addEventListener('popstate', e => {
  const id = (e.state && e.state.page) || 'home';
  navigate(id);
});

/* ════════════════════════════════
   EDIT BAR
════════════════════════════════ */
const editBar = document.getElementById('editBar');
const editableInputClasses = ['ann-title','ann-body','cert-name','cert-desc'];

document.addEventListener('focusin', e => {
  const isEditable = e.target.hasAttribute('contenteditable') ||
    editableInputClasses.some(c => e.target.classList.contains(c));
  if (isEditable) editBar.classList.add('visible');
});
document.addEventListener('focusout', () => {
  setTimeout(() => {
    const a = document.activeElement;
    const still = a && (a.hasAttribute('contenteditable') || editableInputClasses.some(c => a.classList.contains(c)));
    if (!still) editBar.classList.remove('visible');
  }, 120);
});

/* ════════════════════════════════
   HERO IMAGE
════════════════════════════════ */
function setHeroImage(input) {
  const f = input.files[0]; if (!f) return;
  const url = URL.createObjectURL(f);
  document.getElementById('heroImg').src = url;
  document.getElementById('heroImg').style.display = 'block';
  document.getElementById('heroPlaceholder').style.display = 'none';
  document.getElementById('heroImgWrap').classList.add('has-image');
  const btn = document.getElementById('heroUploadBtn');
  if (btn) btn.classList.add('hidden');
}

// Pre-load bundled hero image
(function() {
  const img = document.getElementById('heroImg');
  img.src = 'data:image/jpeg;base64,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';
  img.style.display = 'block';
  document.getElementById('heroPlaceholder').style.display = 'none';
  document.getElementById('heroImgWrap').classList.add('has-image');
  const btn = document.getElementById('heroUploadBtn');
  if (btn) btn.classList.add('hidden');
})();

/* ════════════════════════════════
   1. ΕΓΚΑΤΑΣΤΑΣΕΙΣ
════════════════════════════════ */
const facilities = [
  { name: 'Αίθουσα Συσκευασίας', desc: 'Σύγχρονος εξοπλισμός συσκευασίας με πιστοποιημένες γραμμές παραγωγής.', icon: '🏭', img: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MDAgNDAwIj4KICA8cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzJkNWEyNyIvPgogIDxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI2JnMSkiLz4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYmcxIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxYTNhMTUiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjM2Q3YTM1Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8IS0tIENvbnZleW9yIGJlbHQgLS0+CiAgPHJlY3QgeD0iNTAiIHk9IjIyMCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzMCIgcng9IjUiIGZpbGw9IiM1NTUiIG9wYWNpdHk9IjAuOCIvPgogIDxyZWN0IHg9IjUwIiB5PSIyNDUiIHdpZHRoPSI1MDAiIGhlaWdodD0iOCIgZmlsbD0iIzQ0NCIvPgogIDwhLS0gQmVsdCBsaW5lcyAtLT4KICA8bGluZSB4MT0iMTIwIiB5MT0iMjIwIiB4Mj0iMTIwIiB5Mj0iMjUwIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxsaW5lIHgxPSIyMDAiIHkxPSIyMjAiIHgyPSIyMDAiIHkyPSIyNTAiIHN0cm9rZT0iIzY2NiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPGxpbmUgeDE9IjI4MCIgeTE9IjIyMCIgeDI9IjI4MCIgeTI9IjI1MCIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KICA8bGluZSB4MT0iMzYwIiB5MT0iMjIwIiB4Mj0iMzYwIiB5Mj0iMjUwIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxsaW5lIHgxPSI0NDAiIHkxPSIyMjAiIHgyPSI0NDAiIHkyPSIyNTAiIHN0cm9rZT0iIzY2NiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPCEtLSBCb3hlcyAtLT4KICA8cmVjdCB4PSI3MCIgeT0iMTg1IiB3aWR0aD0iNjAiIGhlaWdodD0iMzgiIHJ4PSIzIiBmaWxsPSIjYzhhMDUwIi8+CiAgPHJlY3QgeD0iNzIiIHk9IjE4NyIgd2lkdGg9IjU2IiBoZWlnaHQ9IjM0IiByeD0iMiIgZmlsbD0iI2Q0YjA2MCIgc3Ryb2tlPSIjYjg5MDQwIiBzdHJva2Utd2lkdGg9IjEiLz4KICA8bGluZSB4MT0iMTAwIiB5MT0iMTg3IiB4Mj0iMTAwIiB5Mj0iMjIxIiBzdHJva2U9IiNiODkwNDAiIHN0cm9rZS13aWR0aD0iMS41Ii8+CiAgPHJlY3QgeD0iMTYwIiB5PSIxODgiIHdpZHRoPSI2MCIgaGVpZ2h0PSIzNSIgcng9IjMiIGZpbGw9IiNjOGEwNTAiLz4KICA8cmVjdCB4PSIxNjIiIHk9IjE5MCIgd2lkdGg9IjU2IiBoZWlnaHQ9IjMxIiByeD0iMiIgZmlsbD0iI2Q0YjA2MCIgc3Ryb2tlPSIjYjg5MDQwIiBzdHJva2Utd2lkdGg9IjEiLz4KICA8cmVjdCB4PSIyNjAiIHk9IjE4NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjM3IiByeD0iMyIgZmlsbD0iI2M4YTA1MCIvPgogIDxyZWN0IHg9IjM2MCIgeT0iMTg3IiB3aWR0aD0iNjAiIGhlaWdodD0iMzYiIHJ4PSIzIiBmaWxsPSIjYzhhMDUwIi8+CiAgPCEtLSBQZWFjaGVzIG9uIGJlbHQgLS0+CiAgPGNpcmNsZSBjeD0iMjQwIiBjeT0iMjEyIiByPSIxNiIgZmlsbD0iI2Y0YTQ2MCIvPgogIDxjaXJjbGUgY3g9IjI0MCIgY3k9IjIxMiIgcj0iMTQiIGZpbGw9IiNmZmIzNDciLz4KICA8Y2lyY2xlIGN4PSIzMTAiIGN5PSIyMTAiIHI9IjE1IiBmaWxsPSIjZjRhNDYwIi8+CiAgPGNpcmNsZSBjeD0iMzEwIiBjeT0iMjEwIiByPSIxMyIgZmlsbD0iI2ZmYjM0NyIvPgogIDxjaXJjbGUgY3g9IjQ1MCIgY3k9IjIxMSIgcj0iMTQiIGZpbGw9IiNmNGE0NjAiLz4KICA8IS0tIE1hY2hpbmUgLS0+CiAgPHJlY3QgeD0iNDgwIiB5PSIxMzAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIxMjAiIHJ4PSI1IiBmaWxsPSIjODg4IiBvcGFjaXR5PSIwLjkiLz4KICA8cmVjdCB4PSI0ODgiIHk9IjEzOCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjUwIiByeD0iMyIgZmlsbD0iI2FhYSIvPgogIDxjaXJjbGUgY3g9IjUyMCIgY3k9IjIwMCIgcj0iMTUiIGZpbGw9IiM3NzciLz4KICA8Y2lyY2xlIGN4PSI1MjAiIGN5PSIyMDAiIHI9IjEwIiBmaWxsPSIjOTk5Ii8+CiAgPCEtLSBXb3JrZXJzIHNpbGhvdWV0dGVzIC0tPgogIDxlbGxpcHNlIGN4PSIxNTAiIGN5PSIyNzAiIHJ4PSIyMCIgcnk9IjgiIGZpbGw9IiMxYTNhMTUiIG9wYWNpdHk9IjAuNCIvPgogIDxyZWN0IHg9IjE0MCIgeT0iMjQwIiB3aWR0aD0iMjAiIGhlaWdodD0iMzUiIHJ4PSI1IiBmaWxsPSIjMmQ1MDE2IiBvcGFjaXR5PSIwLjYiLz4KICA8Y2lyY2xlIGN4PSIxNTAiIGN5PSIyMzIiIHI9IjEyIiBmaWxsPSIjM2Q2MDIwIiBvcGFjaXR5PSIwLjYiLz4KICA8IS0tIENlaWxpbmcgbGlnaHRzIC0tPgogIDxsaW5lIHgxPSIxNTAiIHkxPSIwIiB4Mj0iMTUwIiB5Mj0iNTAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjMiLz4KICA8ZWxsaXBzZSBjeD0iMTUwIiBjeT0iNTUiIHJ4PSIyMCIgcnk9IjgiIGZpbGw9IiNmZmZkZTAiIG9wYWNpdHk9IjAuNiIvPgogIDxsaW5lIHgxPSIzMDAiIHkxPSIwIiB4Mj0iMzAwIiB5Mj0iNTAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjMiLz4KICA8ZWxsaXBzZSBjeD0iMzAwIiBjeT0iNTUiIHJ4PSIyMCIgcnk9IjgiIGZpbGw9IiNmZmZkZTAiIG9wYWNpdHk9IjAuNiIvPgogIDxsaW5lIHgxPSI0NTAiIHkxPSIwIiB4Mj0iNDUwIiB5Mj0iNTAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjMiLz4KICA8ZWxsaXBzZSBjeD0iNDUwIiBjeT0iNTUiIHJ4PSIyMCIgcnk9IjgiIGZpbGw9IiNmZmZkZTAiIG9wYWNpdHk9IjAuNiIvPgogIDwhLS0gTGFiZWwgLS0+CiAgPHJlY3QgeD0iMCIgeT0iMzQwIiB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwIiBmaWxsPSJyZ2JhKDAsMCwwLDAuNDUpIi8+CiAgPHRleHQgeD0iMzAwIiB5PSIzNzgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLHNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgZm9udC13ZWlnaHQ9ImJvbGQiPs6Rzq/OuM6/z4XPg86xIM6jz4XPg866zrXPhc6xz4POr86xz4I8L3RleHQ+Cjwvc3ZnPg==' },
  { name: 'Ψυκτικές Αποθήκες',  desc: 'Ελεγχόμενη θερμοκρασία για μέγιστη διατήρηση της φρεσκάδας των φρούτων.', icon: '❄️', img: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MDAgNDAwIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYmcyIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwYTFhMmUiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMWEzYTVjIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNiZzIpIi8+CiAgPCEtLSBGcm9zdCBlZmZlY3QgLS0+CiAgPHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNhOGQ4ZWEiIG9wYWNpdHk9IjAuMDgiLz4KICA8IS0tIFNoZWx2aW5nIHJhY2tzIC0tPgogIDxyZWN0IHg9IjMwIiB5PSI4MCIgd2lkdGg9IjEyIiBoZWlnaHQ9IjI4MCIgZmlsbD0iIzg4OTlhYSIvPgogIDxyZWN0IHg9IjU1OCIgeT0iODAiIHdpZHRoPSIxMiIgaGVpZ2h0PSIyODAiIGZpbGw9IiM4ODk5YWEiLz4KICA8IS0tIEhvcml6b250YWwgc2hlbHZlcyBsZWZ0IC0tPgogIDxyZWN0IHg9IjMwIiB5PSIxMTAiIHdpZHRoPSIyMDAiIGhlaWdodD0iOCIgZmlsbD0iIzk5YWFjYyIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iMzAiIHk9IjE3MCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSI4IiBmaWxsPSIjOTlhYWNjIiBvcGFjaXR5PSIwLjkiLz4KICA8cmVjdCB4PSIzMCIgeT0iMjMwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgiIGZpbGw9IiM5OWFhY2MiIG9wYWNpdHk9IjAuOSIvPgogIDxyZWN0IHg9IjMwIiB5PSIyOTAiIHdpZHRoPSIyMDAiIGhlaWdodD0iOCIgZmlsbD0iIzk5YWFjYyIgb3BhY2l0eT0iMC45Ii8+CiAgPCEtLSBIb3Jpem9udGFsIHNoZWx2ZXMgcmlnaHQgLS0+CiAgPHJlY3QgeD0iMzcwIiB5PSIxMTAiIHdpZHRoPSIyMDAiIGhlaWdodD0iOCIgZmlsbD0iIzk5YWFjYyIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iMzcwIiB5PSIxNzAiIHdpZHRoPSIyMDAiIGhlaWdodD0iOCIgZmlsbD0iIzk5YWFjYyIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iMzcwIiB5PSIyMzAiIHdpZHRoPSIyMDAiIGhlaWdodD0iOCIgZmlsbD0iIzk5YWFjYyIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iMzcwIiB5PSIyOTAiIHdpZHRoPSIyMDAiIGhlaWdodD0iOCIgZmlsbD0iIzk5YWFjYyIgb3BhY2l0eT0iMC45Ii8+CiAgPCEtLSBDcmF0ZXMgbGVmdCAtLT4KICA8cmVjdCB4PSI0MCIgeT0iODgiIHdpZHRoPSIzOCIgaGVpZ2h0PSIyMiIgcng9IjIiIGZpbGw9IiNmNGE0NjAiIG9wYWNpdHk9IjAuOSIvPgogIDxyZWN0IHg9Ijg1IiB5PSI4OCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjIyIiByeD0iMiIgZmlsbD0iI2ZmYjM0NyIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iMTMwIiB5PSI4OCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjIyIiByeD0iMiIgZmlsbD0iI2Y0YTQ2MCIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iMTc1IiB5PSI4OCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjIyIiByeD0iMiIgZmlsbD0iI2ZmYjM0NyIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iNDAiIHk9IjE0OCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjIyIiByeD0iMiIgZmlsbD0iI2ZmYjM0NyIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iODUiIHk9IjE0OCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjIyIiByeD0iMiIgZmlsbD0iI2Y0YTQ2MCIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iMTMwIiB5PSIxNDgiIHdpZHRoPSIzOCIgaGVpZ2h0PSIyMiIgcng9IjIiIGZpbGw9IiNmZmIzNDciIG9wYWNpdHk9IjAuOSIvPgogIDxyZWN0IHg9IjE3NSIgeT0iMTQ4IiB3aWR0aD0iMzgiIGhlaWdodD0iMjIiIHJ4PSIyIiBmaWxsPSIjZjRhNDYwIiBvcGFjaXR5PSIwLjkiLz4KICA8cmVjdCB4PSI0MCIgeT0iMjA4IiB3aWR0aD0iMzgiIGhlaWdodD0iMjIiIHJ4PSIyIiBmaWxsPSIjZjRhNDYwIiBvcGFjaXR5PSIwLjkiLz4KICA8cmVjdCB4PSI4NSIgeT0iMjA4IiB3aWR0aD0iMzgiIGhlaWdodD0iMjIiIHJ4PSIyIiBmaWxsPSIjZmZiMzQ3IiBvcGFjaXR5PSIwLjkiLz4KICA8cmVjdCB4PSIxMzAiIHk9IjIwOCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjIyIiByeD0iMiIgZmlsbD0iI2Y0YTQ2MCIgb3BhY2l0eT0iMC45Ii8+CiAgPCEtLSBDcmF0ZXMgcmlnaHQgLS0+CiAgPHJlY3QgeD0iMzgwIiB5PSI4OCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjIyIiByeD0iMiIgZmlsbD0iI2Y0YTQ2MCIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iNDI1IiB5PSI4OCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjIyIiByeD0iMiIgZmlsbD0iI2ZmYjM0NyIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iNDcwIiB5PSI4OCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjIyIiByeD0iMiIgZmlsbD0iI2Y0YTQ2MCIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iNTE1IiB5PSI4OCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjIyIiByeD0iMiIgZmlsbD0iI2ZmYjM0NyIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iMzgwIiB5PSIxNDgiIHdpZHRoPSIzOCIgaGVpZ2h0PSIyMiIgcng9IjIiIGZpbGw9IiNmZmIzNDciIG9wYWNpdHk9IjAuOSIvPgogIDxyZWN0IHg9IjQyNSIgeT0iMTQ4IiB3aWR0aD0iMzgiIGhlaWdodD0iMjIiIHJ4PSIyIiBmaWxsPSIjZjRhNDYwIiBvcGFjaXR5PSIwLjkiLz4KICA8cmVjdCB4PSI0NzAiIHk9IjE0OCIgd2lkdGg9IjM4IiBoZWlnaHQ9IjIyIiByeD0iMiIgZmlsbD0iI2ZmYjM0NyIgb3BhY2l0eT0iMC45Ii8+CiAgPHJlY3QgeD0iNTE1IiB5PSIxNDgiIHdpZHRoPSIzOCIgaGVpZ2h0PSIyMiIgcng9IjIiIGZpbGw9IiNmNGE0NjAiIG9wYWNpdHk9IjAuOSIvPgogIDwhLS0gU25vdy9mcm9zdCBwYXJ0aWNsZXMgLS0+CiAgPGNpcmNsZSBjeD0iMjgwIiBjeT0iMTIwIiByPSIzIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC42Ii8+CiAgPGNpcmNsZSBjeD0iMzIwIiBjeT0iODAiIHI9IjIiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjUiLz4KICA8Y2lyY2xlIGN4PSIyOTAiIGN5PSIyMDAiIHI9IjIuNSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNCIvPgogIDxjaXJjbGUgY3g9IjMxMCIgY3k9IjE2MCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNiIvPgogIDxjaXJjbGUgY3g9IjI3MCIgY3k9IjI0MCIgcj0iMyIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNSIvPgogIDwhLS0gVGVtcCBkaXNwbGF5IC0tPgogIDxyZWN0IHg9IjI0MCIgeT0iMTYwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjYwIiByeD0iOCIgZmlsbD0iIzBkMmE0YSIgc3Ryb2tlPSIjNDQ4OGJiIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSIzMDAiIHk9IjE4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMSIgZmlsbD0iIzg4Y2NmZiI+zpjOlc6hzpzOn86azqHOkc6jzpnOkTwvdGV4dD4KICA8dGV4dCB4PSIzMDAiIHk9IjIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIyMiIgZmlsbD0iIzAwZmZjYyIgZm9udC13ZWlnaHQ9ImJvbGQiPi0ywrBDPC90ZXh0PgogIDwhLS0gRmxvb3IgLS0+CiAgPHJlY3QgeD0iMCIgeT0iMzUwIiB3aWR0aD0iNjAwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMGQxYTJhIiBvcGFjaXR5PSIwLjgiLz4KICA8IS0tIExhYmVsIC0tPgogIDxyZWN0IHg9IjAiIHk9IjM0MCIgd2lkdGg9IjYwMCIgaGVpZ2h0PSI2MCIgZmlsbD0icmdiYSgwLDAsMCwwLjUpIi8+CiAgPHRleHQgeD0iMzAwIiB5PSIzNzgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLHNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgZm9udC13ZWlnaHQ9ImJvbGQiPs6oz4XOus+EzrnOus6tz4IgzpHPgM6/zrjOrs66zrXPgjwvdGV4dD4KPC9zdmc+' },
  { name: 'Αγρός & Ορχάτες',    desc: 'Πάνω από 320 στρέμματα καλλιεργούμενης γης σε όλη την περιοχή της Πέλλας.', icon: '🌳', img: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MDAgNDAwIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ic2t5IiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM4N0NFRUIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI2MCUiIHN0b3AtY29sb3I9IiNiOGUwZjciLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZDRlOGMyIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNza3kpIi8+CiAgPCEtLSBHcm91bmQgLS0+CiAgPHJlY3QgeD0iMCIgeT0iMjkwIiB3aWR0aD0iNjAwIiBoZWlnaHQ9IjExMCIgZmlsbD0iIzRhN2EyMCIvPgogIDxyZWN0IHg9IjAiIHk9IjI5MCIgd2lkdGg9IjYwMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzVhOWEyOCIvPgogIDwhLS0gUGF0aCBiZXR3ZWVuIHRyZWVzIC0tPgogIDxyZWN0IHg9IjI2MCIgeT0iMjcwIiB3aWR0aD0iODAiIGhlaWdodD0iMTMwIiBmaWxsPSIjYzhhODcwIiBvcGFjaXR5PSIwLjciLz4KICA8cmVjdCB4PSIyNzUiIHk9IjI3MCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjEzMCIgZmlsbD0iI2Q0Yjg4MCIgb3BhY2l0eT0iMC41Ii8+CiAgPCEtLSBUcmVlcyByb3cgMSAtLT4KICA8cmVjdCB4PSI2MCIgeT0iMjAwIiB3aWR0aD0iMTQiIGhlaWdodD0iMTAwIiBmaWxsPSIjNWMzYTFhIi8+CiAgPGVsbGlwc2UgY3g9IjY3IiBjeT0iMTcwIiByeD0iNTUiIHJ5PSI3MCIgZmlsbD0iIzJkN2ExOCIvPgogIDxlbGxpcHNlIGN4PSI2NyIgY3k9IjE2NSIgcng9IjQ1IiByeT0iNjAiIGZpbGw9IiMzZDlhMjIiLz4KICA8IS0tIFBlYWNoZXMgb24gdHJlZSAxIC0tPgogIDxjaXJjbGUgY3g9IjQ1IiBjeT0iMTU1IiByPSIxMCIgZmlsbD0iI2ZmYjM0NyIvPjxjaXJjbGUgY3g9IjQ1IiBjeT0iMTU1IiByPSI4IiBmaWxsPSIjZmY5MDIwIi8+CiAgPGNpcmNsZSBjeD0iODAiIGN5PSIxNDgiIHI9IjExIiBmaWxsPSIjZmZiMzQ3Ii8+PGNpcmNsZSBjeD0iODAiIGN5PSIxNDgiIHI9IjkiIGZpbGw9IiNmZjkwMjAiLz4KICA8Y2lyY2xlIGN4PSI1NSIgY3k9IjE4NSIgcj0iOSIgZmlsbD0iI2ZmYjM0NyIvPjxjaXJjbGUgY3g9IjU1IiBjeT0iMTg1IiByPSI3IiBmaWxsPSIjZmY5MDIwIi8+CiAgPGNpcmNsZSBjeD0iODUiIGN5PSIxNzUiIHI9IjEwIiBmaWxsPSIjZmZiMzQ3Ii8+PGNpcmNsZSBjeD0iODUiIGN5PSIxNzUiIHI9IjgiIGZpbGw9IiNmZjkwMjAiLz4KICA8Y2lyY2xlIGN4PSI0MCIgY3k9IjE3NSIgcj0iOCIgZmlsbD0iI2ZmYjM0NyIvPgogIDwhLS0gVHJlZSAyIC0tPgogIDxyZWN0IHg9IjE3MCIgeT0iMjA1IiB3aWR0aD0iMTQiIGhlaWdodD0iOTUiIGZpbGw9IiM1YzNhMWEiLz4KICA8ZWxsaXBzZSBjeD0iMTc3IiBjeT0iMTc1IiByeD0iNTIiIHJ5PSI2NSIgZmlsbD0iIzJkN2ExOCIvPgogIDxlbGxpcHNlIGN4PSIxNzciIGN5PSIxNzAiIHJ4PSI0MiIgcnk9IjU1IiBmaWxsPSIjM2Q5YTIyIi8+CiAgPGNpcmNsZSBjeD0iMTU4IiBjeT0iMTU4IiByPSIxMCIgZmlsbD0iI2ZmYjM0NyIvPjxjaXJjbGUgY3g9IjE1OCIgY3k9IjE1OCIgcj0iOCIgZmlsbD0iI2ZmOTAyMCIvPgogIDxjaXJjbGUgY3g9IjE5MCIgY3k9IjE1MiIgcj0iMTEiIGZpbGw9IiNmZmIzNDciLz48Y2lyY2xlIGN4PSIxOTAiIGN5PSIxNTIiIHI9IjkiIGZpbGw9IiNmZjkwMjAiLz4KICA8Y2lyY2xlIGN4PSIxNjUiIGN5PSIxODUiIHI9IjkiIGZpbGw9IiNmZmIzNDciLz4KICA8Y2lyY2xlIGN4PSIxOTIiIGN5PSIxNzgiIHI9IjEwIiBmaWxsPSIjZmZiMzQ3Ii8+CiAgPCEtLSBUcmVlIDMgKHJpZ2h0KSAtLT4KICA8cmVjdCB4PSI0MDAiIHk9IjIwMCIgd2lkdGg9IjE0IiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzVjM2ExYSIvPgogIDxlbGxpcHNlIGN4PSI0MDciIGN5PSIxNjgiIHJ4PSI1NSIgcnk9IjY4IiBmaWxsPSIjMmQ3YTE4Ii8+CiAgPGVsbGlwc2UgY3g9IjQwNyIgY3k9IjE2MyIgcng9IjQ1IiByeT0iNTgiIGZpbGw9IiMzZDlhMjIiLz4KICA8Y2lyY2xlIGN4PSIzODgiIGN5PSIxNTIiIHI9IjEwIiBmaWxsPSIjZmZiMzQ3Ii8+PGNpcmNsZSBjeD0iMzg4IiBjeT0iMTUyIiByPSI4IiBmaWxsPSIjZmY5MDIwIi8+CiAgPGNpcmNsZSBjeD0iNDIwIiBjeT0iMTQ2IiByPSIxMSIgZmlsbD0iI2ZmYjM0NyIvPjxjaXJjbGUgY3g9IjQyMCIgY3k9IjE0NiIgcj0iOSIgZmlsbD0iI2ZmOTAyMCIvPgogIDxjaXJjbGUgY3g9IjM5NSIgY3k9IjE4MCIgcj0iOSIgZmlsbD0iI2ZmYjM0NyIvPgogIDxjaXJjbGUgY3g9IjQyNSIgY3k9IjE3MiIgcj0iMTAiIGZpbGw9IiNmZmIzNDciLz4KICA8IS0tIFRyZWUgNCAtLT4KICA8cmVjdCB4PSI1MTAiIHk9IjIwOCIgd2lkdGg9IjE0IiBoZWlnaHQ9IjkyIiBmaWxsPSIjNWMzYTFhIi8+CiAgPGVsbGlwc2UgY3g9IjUxNyIgY3k9IjE3OCIgcng9IjUwIiByeT0iNjIiIGZpbGw9IiMyZDdhMTgiLz4KICA8ZWxsaXBzZSBjeD0iNTE3IiBjeT0iMTczIiByeD0iNDAiIHJ5PSI1MiIgZmlsbD0iIzNkOWEyMiIvPgogIDxjaXJjbGUgY3g9IjQ5OCIgY3k9IjE2MiIgcj0iMTAiIGZpbGw9IiNmZmIzNDciLz4KICA8Y2lyY2xlIGN4PSI1MzAiIGN5PSIxNTYiIHI9IjExIiBmaWxsPSIjZmZiMzQ3Ii8+CiAgPGNpcmNsZSBjeD0iNTA1IiBjeT0iMTg4IiByPSI5IiBmaWxsPSIjZmZiMzQ3Ii8+CiAgPCEtLSBNb3VudGFpbnMvaGlsbHMgYmcgLS0+CiAgPGVsbGlwc2UgY3g9IjMwMCIgY3k9IjI5MCIgcng9IjQwMCIgcnk9IjgwIiBmaWxsPSIjM2E2YTE4IiBvcGFjaXR5PSIwLjQiLz4KICA8IS0tIFN1biAtLT4KICA8Y2lyY2xlIGN4PSI1NDAiIGN5PSI2MCIgcj0iMzUiIGZpbGw9IiNGRkQ3MDAiIG9wYWNpdHk9IjAuOSIvPgogIDxjaXJjbGUgY3g9IjU0MCIgY3k9IjYwIiByPSIyOCIgZmlsbD0iI0ZGRTQ0RCIvPgogIDwhLS0gQ2xvdWRzIC0tPgogIDxlbGxpcHNlIGN4PSIxMjAiIGN5PSI1MCIgcng9IjUwIiByeT0iMjIiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiLz4KICA8ZWxsaXBzZSBjeD0iOTAiIGN5PSI1NSIgcng9IjMwIiByeT0iMTgiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiLz4KICA8ZWxsaXBzZSBjeD0iMTU1IiBjeT0iNTUiIHJ4PSIzNSIgcnk9IjE2IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC44Ii8+CiAgPGVsbGlwc2UgY3g9IjM1MCIgY3k9IjQwIiByeD0iNDUiIHJ5PSIxOCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNyIvPgogIDxlbGxpcHNlIGN4PSIzMjAiIGN5PSI0NCIgcng9IjI4IiByeT0iMTUiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjciLz4KICA8IS0tIExhYmVsIC0tPgogIDxyZWN0IHg9IjAiIHk9IjM0MCIgd2lkdGg9IjYwMCIgaGVpZ2h0PSI2MCIgZmlsbD0icmdiYSgwLDAsMCwwLjQpIi8+CiAgPHRleHQgeD0iMzAwIiB5PSIzNzgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLHNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgZm9udC13ZWlnaHQ9ImJvbGQiPs6RzrPPgc+Mz4IgJmFtcDsgzp/Pgc+HzqzPhM61z4I8L3RleHQ+Cjwvc3ZnPg==' },
  { name: 'Κονσερβοποιείο',     desc: 'Σύγχρονες γραμμές κονσερβοποίησης φρούτων με υψηλά πρότυπα ασφάλειας.', icon: '🏭', img: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MDAgNDAwIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYmc0IiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxYTFhMmUiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMmEyYTRlIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNiZzQpIi8+CiAgPCEtLSBTdGVhbSBwaXBlcyAtLT4KICA8cmVjdCB4PSI4MCIgeT0iMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzg4OCIgb3BhY2l0eT0iMC43Ii8+CiAgPHJlY3QgeD0iMTgwIiB5PSIwIiB3aWR0aD0iMTYiIGhlaWdodD0iOTAiIGZpbGw9IiM4ODgiIG9wYWNpdHk9IjAuNiIvPgogIDwhLS0gU3RlYW0gZWZmZWN0IC0tPgogIDxlbGxpcHNlIGN4PSI5MCIgY3k9IjExNSIgcng9IjI1IiByeT0iNDAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjE1Ii8+CiAgPGVsbGlwc2UgY3g9IjkwIiBjeT0iOTAiIHJ4PSIyMCIgcnk9IjM1IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4xIi8+CiAgPGVsbGlwc2UgY3g9IjE4OCIgY3k9Ijg1IiByeD0iMjAiIHJ5PSIzNSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMTIiLz4KICA8IS0tIEluZHVzdHJpYWwgdmF0cy90YW5rcyAtLT4KICA8ZWxsaXBzZSBjeD0iMTIwIiBjeT0iMTgwIiByeD0iNjUiIHJ5PSIyNSIgZmlsbD0iI2NjODgyMiIvPgogIDxyZWN0IHg9IjU1IiB5PSIxODAiIHdpZHRoPSIxMzAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZGQ5OTMzIi8+CiAgPGVsbGlwc2UgY3g9IjEyMCIgY3k9IjMwMCIgcng9IjY1IiByeT0iMjIiIGZpbGw9IiNiYjc3MTEiLz4KICA8cmVjdCB4PSI4MCIgeT0iMTg4IiB3aWR0aD0iMjAiIGhlaWdodD0iMTA1IiBmaWxsPSIjZWU5OTIyIiBvcGFjaXR5PSIwLjUiLz4KICA8cmVjdCB4PSIxMjAiIHk9IjE4OCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjEwNSIgZmlsbD0iI2VlOTkyMiIgb3BhY2l0eT0iMC40Ii8+CiAgPCEtLSBTZWNvbmQgdmF0IC0tPgogIDxlbGxpcHNlIGN4PSIyOTAiIGN5PSIxOTAiIHJ4PSI2MCIgcnk9IjIyIiBmaWxsPSIjYWE2NjEwIi8+CiAgPHJlY3QgeD0iMjMwIiB5PSIxOTAiIHdpZHRoPSIxMjAiIGhlaWdodD0iMTAwIiBmaWxsPSIjY2M4ODIyIi8+CiAgPGVsbGlwc2UgY3g9IjI5MCIgY3k9IjI5MCIgcng9IjYwIiByeT0iMjAiIGZpbGw9IiM5OTQ0MDAiLz4KICA8IS0tIENhbm5pbmcgbGluZSAtLT4KICA8cmVjdCB4PSIzNzAiIHk9IjIxMCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzY2NiIgb3BhY2l0eT0iMC44Ii8+CiAgPCEtLSBDYW5zIG9uIGxpbmUgLS0+CiAgPHJlY3QgeD0iMzc1IiB5PSIxNzUiIHdpZHRoPSIyOCIgaGVpZ2h0PSIzOCIgcng9IjUiIGZpbGw9IiNzaWx2ZXIiLz4KICA8ZWxsaXBzZSBjeD0iMzg5IiBjeT0iMTc1IiByeD0iMTQiIHJ5PSI2IiBmaWxsPSIjZGRkIi8+CiAgPGVsbGlwc2UgY3g9IjM4OSIgY3k9IjIxMyIgcng9IjE0IiByeT0iNSIgZmlsbD0iI2JiYiIvPgogIDxyZWN0IHg9IjM3NSIgeT0iMTc2IiB3aWR0aD0iMjgiIGhlaWdodD0iMzYiIGZpbGw9IiNlOGU4ZTgiLz4KICA8IS0tIExhYmVsIG9uIGNhbiAtLT4KICA8cmVjdCB4PSIzNzciIHk9IjE4NSIgd2lkdGg9IjI0IiBoZWlnaHQ9IjE1IiBmaWxsPSIjZDQzODBkIi8+CiAgPHRleHQgeD0iMzg5IiB5PSIxOTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI1IiBmaWxsPSJ3aGl0ZSIgZm9udC13ZWlnaHQ9ImJvbGQiPkEuQy48L3RleHQ+CiAgPCEtLSBNb3JlIGNhbnMgLS0+CiAgPHJlY3QgeD0iNDE1IiB5PSIxNzYiIHdpZHRoPSIyOCIgaGVpZ2h0PSIzNyIgcng9IjUiIGZpbGw9IiNlMGUwZTAiLz4KICA8ZWxsaXBzZSBjeD0iNDI5IiBjeT0iMTc2IiByeD0iMTQiIHJ5PSI2IiBmaWxsPSIjZWVlIi8+CiAgPHJlY3QgeD0iNDE3IiB5PSIxODUiIHdpZHRoPSIyNCIgaGVpZ2h0PSIxNSIgZmlsbD0iI2Q0MzgwZCIvPgogIDx0ZXh0IHg9IjQyOSIgeT0iMTk1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNSIgZmlsbD0id2hpdGUiIGZvbnQtd2VpZ2h0PSJib2xkIj5BLkMuPC90ZXh0PgogIDxyZWN0IHg9IjQ1NSIgeT0iMTc3IiB3aWR0aD0iMjgiIGhlaWdodD0iMzYiIHJ4PSI1IiBmaWxsPSIjZTBlMGUwIi8+CiAgPGVsbGlwc2UgY3g9IjQ2OSIgY3k9IjE3NyIgcng9IjE0IiByeT0iNiIgZmlsbD0iI2VlZSIvPgogIDxyZWN0IHg9IjQ1NyIgeT0iMTg2IiB3aWR0aD0iMjQiIGhlaWdodD0iMTUiIGZpbGw9IiNkNDM4MGQiLz4KICA8cmVjdCB4PSI1MDAiIHk9IjE3OCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjM1IiByeD0iNSIgZmlsbD0iI2UwZTBlMCIvPgogIDxlbGxpcHNlIGN4PSI1MTQiIGN5PSIxNzgiIHJ4PSIxNCIgcnk9IjYiIGZpbGw9IiNlZWUiLz4KICA8cmVjdCB4PSI1MDIiIHk9IjE4NyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjE1IiBmaWxsPSIjZDQzODBkIi8+CiAgPCEtLSBDb250cm9sIHBhbmVsIC0tPgogIDxyZWN0IHg9IjM4MCIgeT0iMjgwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjcwIiByeD0iNSIgZmlsbD0iIzMzMyIvPgogIDxyZWN0IHg9IjM4NiIgeT0iMjg2IiB3aWR0aD0iODgiIGhlaWdodD0iNTAiIHJ4PSIzIiBmaWxsPSIjMWExYTFhIi8+CiAgPGNpcmNsZSBjeD0iNDAwIiBjeT0iMzAwIiByPSI2IiBmaWxsPSIjZjAwIiBvcGFjaXR5PSIwLjgiLz4KICA8Y2lyY2xlIGN4PSI0MTgiIGN5PSIzMDAiIHI9IjYiIGZpbGw9IiMwZjAiIG9wYWNpdHk9IjAuOCIvPgogIDxjaXJjbGUgY3g9IjQzNiIgY3k9IjMwMCIgcj0iNiIgZmlsbD0iI2ZmMCIgb3BhY2l0eT0iMC44Ii8+CiAgPHJlY3QgeD0iMzkwIiB5PSIzMTQiIHdpZHRoPSI2MCIgaGVpZ2h0PSIxNCIgcng9IjMiIGZpbGw9IiMyMjU1YWEiLz4KICA8IS0tIExhYmVsIC0tPgogIDxyZWN0IHg9IjAiIHk9IjM0MCIgd2lkdGg9IjYwMCIgaGVpZ2h0PSI2MCIgZmlsbD0icmdiYSgwLDAsMCwwLjUpIi8+CiAgPHRleHQgeD0iMzAwIiB5PSIzNzgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLHNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgZm9udC13ZWlnaHQ9ImJvbGQiPs6azr/Ovc+DzrXPgc6yzr/PgM6/zrnOtc6vzr88L3RleHQ+Cjwvc3ZnPg==' },
];
const fgrid = document.getElementById('facilitiesGrid');
if (fgrid) facilities.forEach((f, i) => {
  const hasImg = f.img ? 'block' : 'none';
  const hasPlaceholder = f.img ? 'none' : 'flex';
  fgrid.innerHTML += `
    <div class="facility-card">
      <div class="facility-img">
        <input type="file" accept="image/*" onchange="setFacilityImg(this,${i})"/>
        <div class="facility-img-ph" id="fph-${i}" style="display:${hasPlaceholder}"><span class="icon">${f.icon}</span><span>Πρόσθεσε φωτογραφία</span></div>
        <img id="fimg-${i}" src="${f.img || ''}" alt="${f.name}" style="display:${hasImg}"/>
      </div>
      <div class="facility-body">
        <div class="facility-name" contenteditable="false" data-editable="true" data-ck="ck17">${f.name}</div>
        <div class="facility-desc" contenteditable="false" data-editable="true" data-ck="ck18">${f.desc}</div>
      </div>
    </div>`;
});
function setFacilityImg(input, idx) {
  const f = input.files[0]; if (!f) return;
  const url = URL.createObjectURL(f);
  document.getElementById(`fimg-${idx}`).src = url;
  document.getElementById(`fimg-${idx}`).style.display = 'block';
  document.getElementById(`fph-${idx}`).style.display = 'none';
}

/* ΠΙΣΤΟΠΟΙΗΤΙΚΑ — handled by API (see section 7) */

/* ════════════════════════════════
   3. PHOTO GALLERY
════════════════════════════════ */
const galleryCats = ['agros','agros','agros','proionta','proionta','proionta','egkat','egkat','egkat','omada','omada','omada'];
const galleryLabels = ['Αγρός','Αγρός','Αγρός','Προϊόντα','Προϊόντα','Προϊόντα','Εγκαταστάσεις','Εγκαταστάσεις','Εγκαταστάσεις','Ομάδα','Ομάδα','Ομάδα'];
const ggrid = document.getElementById('galleryGrid');
const existingCells = ggrid.querySelectorAll('.gallery-cell').length;
for (let i = existingCells; i < existingCells + 4; i++) {
  ggrid.innerHTML += `
    <div class="gallery-cell" data-cat="${galleryCats[i]}">
      <input type="file" accept="image/*" onchange="setGallImg(this,${i})"/>
      <div class="gallery-cell-empty" id="gph-${i}">
        <span style="font-size:1.2rem;opacity:0.3;">+</span>
        <span style="font-size:0.65rem;margin-top:3px;">${galleryLabels[i]}</span>
      </div>
      <img id="gimg-${i}" src="" alt="" style="display:none;position:absolute;inset:0;width:100%;height:100%;object-fit:cover"/>
    </div>`;
}
function setGallImg(input, idx) {
  const f = input.files[0]; if (!f) return;
  const url = URL.createObjectURL(f);
  const img = document.getElementById(`gimg-${idx}`);
  const ph = document.getElementById(`gph-${idx}`);
  if (img) { img.src = url; img.style.display = 'block'; }
  if (ph) ph.style.display = 'none';
}
let nextSlot = document.querySelectorAll('.gallery-cell').length;
function addToGallery(input) {
  const files = Array.from(input.files);
  const grid = document.getElementById('galleryGrid');
  files.forEach(file => {
    const url = URL.createObjectURL(file);
    const div = document.createElement('div');
    div.className = 'gallery-cell';
    div.dataset.cat = 'egkat';
    div.style.cssText = 'position:relative;overflow:hidden;cursor:pointer;';
    div.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"/>`;
    grid.appendChild(div);
  });
}

/* ════════════════════════════════
   4. ΑΝΑΚΟΙΝΩΣΕΙΣ
════════════════════════════════ */
let annCount = 0;
function addAnnouncement() {
  document.getElementById('annModalTitle').value = '';
  document.getElementById('annModalBody').value = '';
  document.getElementById('annModal').classList.add('open');
  document.getElementById('annModalTitle').focus();
}
function closeAnnModal() {
  document.getElementById('annModal').classList.remove('open');
  removeAnnImg();
}
let annImageData = null;

function previewAnnImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    annImageData = e.target.result;
    document.getElementById('annImgPreview').style.display = 'none';
    const img = document.getElementById('annImgPreviewImg');
    img.src = annImageData; img.style.display = 'block';
    document.getElementById('annRemoveImg').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function removeAnnImg() {
  annImageData = null;
  document.getElementById('annModalImg').value = '';
  document.getElementById('annImgPreviewImg').style.display = 'none';
  document.getElementById('annImgPreview').style.display = 'flex';
  document.getElementById('annRemoveImg').style.display = 'none';
}

async function submitAnnouncement() {
  const title = document.getElementById('annModalTitle').value.trim();
  const body = document.getElementById('annModalBody').value.trim();
  if (!title) { document.getElementById('annModalTitle').focus(); return; }
  const btn = document.getElementById('annModalSubmit');
  btn.disabled = true; btn.textContent = 'Αποθήκευση...';
  const today = new Date().toISOString().split('T')[0];
  try {
    const res = await fetch(API_URL + '/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + adminToken
      },
      body: JSON.stringify({ title, body, date: today, image: annImageData })
    });
    const ann = await res.json();
    if (ann.id) {
      closeAnnModal();
      annImageData = null;
      await loadAnnouncements();
      const toast = document.getElementById('saveToast');
      toast.textContent = '✅ Η ανακοίνωση δημοσιεύτηκε!';
      toast.classList.add('show');
      setTimeout(() => { toast.classList.remove('show'); toast.textContent = '✅ Αποθηκεύτηκε!'; }, 2500);
    }
  } catch(e) {
    alert('❌ Σφάλμα αποθήκευσης: ' + e.message);
  }
  btn.disabled = false; btn.textContent = '📤 Δημοσίευση';
}
function deleteAnn(id) {
  const c = document.getElementById(`ann-${id}`); if (c) c.remove();
  const list = document.getElementById('annList');
  if (!list.querySelector('.ann-card'))
    list.innerHTML = '<div class="ann-empty" id="annEmpty">Δεν υπάρχουν ανακοινώσεις ακόμα. Πάτα «Νέα ανακοίνωση» για να προσθέσεις.</div>';
}

/* ════════════════════════════════
   5. ΕΠΙΚΟΙΝΩΝΙΑ
════════════════════════════════ */
/* ── ΓΛΩΣΣΑ ── */
let currentLang = 'el';

const translations = {
  el: {
    'nav-home': 'Αρχική',
    'nav-egk': 'Εγκαταστάσεις',
    'nav-pist': 'Πιστοποιητικά &amp; Διακρίσεις',
    'nav-gallery': 'Photo Gallery',
    'nav-ann': 'Ανακοινώσεις',
    'nav-iso': 'Ισολογισμοί',
    'nav-contact': 'Επικοινωνία',
    heroEyebrow: 'Αγροτικός Συνεταιρισμός · Πέλλα',
    heroTitle: 'Φρέσκα <em>φρούτα</em><br>απ\' την πηγή',
    sidebarProducts: 'Προϊόντα',
    sidebarFresh: 'Νωπά φρούτα',
    sidebarCanned: 'Κονσερβοποιημένα Ροδάκινα',
    sidebarPuree: 'Πουρές Ροδάκινου',
    sidebarNews: 'Νέα',
    sidebarNewsLink: 'Δείτε όλες τις ανακοινώσεις →',
    p1: 'Ο Αγροτικός Συνεταιρισμός Πέλλας ιδρύθηκε στην Πέλλα, την καρδιά της Μακεδονίας, την πατρίδα του Μεγάλου Αλεξάνδρου, μιας από τις πιο παραγωγικές περιοχές στην Ελλάδα. Ο Συνεταιρισμός ιδρύθηκε το 1928 με την τότε ονομασία <em>«Ένωση Γεωργικών Συνεταιρισμών Γιαννιτσών»</em> και μετονομάστηκε σε <em>«Αγροτικό Συνεταιρισμό Πέλλας»</em> μετά από την αλλαγή της νομοθεσίας το 2012.',
    p2: 'Ο Αγροτικός Συνεταιρισμός Πέλλας περιλαμβάνει τώρα τουλάχιστον <strong>600 ενεργά μέλη</strong> και διατηρεί μία από τις πρώτες θέσεις των Αγροτικών Συνεταιριστικών Οργανώσεων στην Ελλάδα.',
    p3: 'Σημαντικές λειτουργίες του Συνεταιρισμού είναι η συλλογή, η μεταφορά και η προώθηση προς τις εγχώριες και ξένες αγορές όλων των αγροτικών προϊόντων της περιοχής.',
    p4: 'Ο κύριος ρόλος του Συνεταιρισμού είναι να υποστηρίξει την παραγωγική διαδικασία εξοπλισμένος με το κατάλληλο προσωπικό και την κατάλληλη υλικοτεχνική υποδομή. Η ευελιξία και η ταχύτητα είναι η κύρια φιλοσοφία και πρακτική του Αγροτικού Συνεταιρισμού Πέλλας.',
    reg: 'Αρ. Μητρώου: 0204017',
    highlightsTitle: '🌿 Εποχικά Προϊόντα',
    newsletterTitle: 'Μείνετε ενημερωμένοι',
    newsletterSub: 'Εγγραφείτε για νέα, εποχικά προϊόντα και ανακοινώσεις.',
    newsletterPlaceholder: 'Το email σας...',
    newsletterBtn: 'Εγγραφή',
    footerText: 'Αγροτικός Συνεταιρισμός Πέλλας',
    editBar: 'Κλικ σε οποιοδήποτε κείμενο για να το αλλάξεις',
    egkLabel: 'Οι χώροι μας',
    egkTitle: 'Εγκαταστάσεις',
    egkIntro: 'Σύγχρονες εγκαταστάσεις συσκευασίας και αποθήκευσης στην καρδιά της Πέλλας.',
    pistLabel: 'Αναγνώριση',
    pistTitle: 'Πιστοποιητικά & Διακρίσεις',
    pistIntro: 'Πιστοποιήσεις που εγγυώνται ασφαλή και υπεύθυνη παραγωγή.',
    pistBtn: '+ Προσθήκη πιστοποιητικού',
    gallLabel: 'Εικόνες',
    gallTitle: 'Photo Gallery',
    gallIntro: 'Κλικ σε οποιοδήποτε κελί για να ανεβάσεις φωτογραφία.',
    gallBtn: '+ Προσθήκη',
    annLabel: 'Νέα & Ενημερώσεις',
    annTitle: 'Ανακοινώσεις',
    annBtn: '+ Νέα ανακοίνωση',
    annEmpty: 'Δεν υπάρχουν ανακοινώσεις ακόμα.',
    contactLabel: 'Επικοινωνία',
    contactTitle: 'Μιλήστε μαζί μας',
    contactIntro: 'Για παραγγελίες, συνεργασίες ή οποιαδήποτε ερώτηση, είμαστε εδώ.',
    contactAddr: 'Γιαννιτσά, Πέλλα 58100',
    contactPhone: '+30 23820 00000',
    contactEmail: 'info@acpella.gr',
    contactHours: 'Δευτ–Παρ, 08:00–16:00',
    contactNameLabel: 'Όνομα', contactNamePh: 'Το όνομά σας',
    contactEmailLabel: 'Email', contactEmailPh: 'email@example.com',
    contactMsgLabel: 'Μήνυμα', contactMsgPh: 'Πώς μπορούμε να σας βοηθήσουμε;',
    contactSend: 'Αποστολή',
    whyLabel: 'Γιατί να μας επιλέξετε',
    whyTitle: 'Η διαφορά μας',
    whyC1Title: '95 Χρόνια Εμπειρίας', whyC1Desc: 'Από το 1928 στο πλευρό του αγρότη. Γνωρίζουμε τη γη, τα προϊόντα και τις ανάγκες της αγοράς.',
    whyC2Title: 'Πιστοποιημένη Ποιότητα', whyC2Desc: 'Διαθέτουμε IFS Food, FSSC 22000 και ISO 22000 — οι πιο αυστηρές διεθνείς πιστοποιήσεις ασφάλειας τροφίμων.',
    whyC3Title: '600+ Ενεργά Μέλη', whyC3Desc: 'Ενωμένοι παραγωγοί, μεγαλύτερη δύναμη. Ο συνεταιρισμός εξασφαλίζει δίκαιες τιμές και καλύτερες συνθήκες.',
    whyC4Title: 'Άμεση Διανομή', whyC4Desc: 'Από τον αγρό στην αγορά χωρίς ενδιάμεσους. Φρέσκα προϊόντα σε εγχώριες και διεθνείς αγορές.',
    labelAddr: 'Διεύθυνση', labelPhone: 'Τηλέφωνο', labelHours: 'Ώρες',
    seasonals: [
      { name: 'Ροδάκινα', season: 'Ιούλιος – Αύγουστος', desc: 'Ζουμερά, απευθείας από τον αγρό' },
      { name: 'Κεράσια', season: 'Μάιος – Ιούνιος', desc: 'Γλυκόξινα, μαζεμένα χειρωνακτικά' },
      { name: 'Μήλα', season: 'Σεπτέμβριος – Νοέμβριος', desc: 'Fuji & Golden, τραγανά' },
      { name: 'Φράουλες', season: 'Απρίλιος – Μάιος', desc: 'Αρωματικές, φυσική καλλιέργεια' },
      { name: 'Αχλάδια', season: 'Αύγουστος – Οκτώβριος', desc: 'Μελωμένα, ωριμάζουν στο χέρι' },
    ],
  },
  en: {
    'nav-home': 'Home',
    'nav-egk': 'Facilities',
    'nav-pist': 'Certifications',
    'nav-gallery': 'Photo Gallery',
    'nav-ann': 'News',
    'nav-iso': 'Financial Reports',
    'nav-contact': 'Contact',
    heroEyebrow: 'Agricultural Cooperative · Pella',
    heroTitle: 'Fresh <em>fruits</em><br>from the source',
    sidebarProducts: 'Products',
    sidebarFresh: 'Fresh fruits',
    sidebarCanned: 'Canned Peaches',
    sidebarPuree: 'Peach Puree',
    sidebarNews: 'News',
    sidebarNewsLink: 'View all announcements →',
    p1: 'The Agricultural Cooperative of Pella was founded in Pella, the heart of Macedonia, birthplace of Alexander the Great, one of the most productive regions in Greece. The Cooperative was founded in 1928 under the name <em>"Union of Agricultural Cooperatives of Giannitsa"</em> and was renamed <em>"Agricultural Cooperative of Pella"</em> following a change in legislation in 2012.',
    p2: 'The Agricultural Cooperative of Pella now includes at least <strong>600 active members</strong> and holds one of the leading positions among Agricultural Cooperative Organizations in Greece.',
    p3: 'Key functions of the Cooperative include the collection, transport and promotion to domestic and foreign markets of all agricultural products of the region.',
    p4: 'The primary role of the Cooperative is to support the production process, equipped with the right personnel and technical infrastructure. Flexibility and speed are the core philosophy and practice of the Agricultural Cooperative of Pella.',
    reg: 'Registry No.: 0204017',
    highlightsTitle: '🌿 Seasonal Products',
    newsletterTitle: 'Stay informed',
    newsletterSub: 'Subscribe for news, seasonal products and announcements.',
    newsletterPlaceholder: 'Your email...',
    newsletterBtn: 'Subscribe',
    footerText: 'Agricultural Cooperative of Pella',
    editBar: 'Click any text to edit it',
    egkLabel: 'Our facilities',
    egkTitle: 'Facilities',
    egkIntro: 'Modern packaging and storage facilities in the heart of Pella.',
    pistLabel: 'Recognition',
    pistTitle: 'Certifications & Awards',
    pistIntro: 'Certifications guaranteeing safe and responsible production.',
    pistBtn: '+ Add certification',
    gallLabel: 'Images',
    gallTitle: 'Photo Gallery',
    gallIntro: 'Click any cell to upload a photo.',
    gallBtn: '+ Add photo',
    annLabel: 'News & Updates',
    annTitle: 'Announcements',
    annBtn: '+ New announcement',
    annEmpty: 'No announcements yet.',
    contactLabel: 'Contact',
    contactTitle: 'Get in touch',
    contactIntro: 'For orders, partnerships or any question, we are here.',
    contactAddr: 'Giannitsa, Pella 58100',
    contactPhone: '+30 23820 00000',
    contactEmail: 'info@acpella.gr',
    contactHours: 'Mon–Fri, 08:00–16:00',
    contactNameLabel: 'Name', contactNamePh: 'Your name',
    contactEmailLabel: 'Email', contactEmailPh: 'email@example.com',
    contactMsgLabel: 'Message', contactMsgPh: 'How can we help you?',
    contactSend: 'Send',
    whyLabel: 'Why choose us',
    whyTitle: 'Our difference',
    whyC1Title: '95 Years of Experience', whyC1Desc: 'Since 1928 at the farmer\'s side. We know the land, the products and the market needs.',
    whyC2Title: 'Certified Quality', whyC2Desc: 'We hold IFS Food, FSSC 22000 and ISO 22000 — the strictest international food safety certifications.',
    whyC3Title: '600+ Active Members', whyC3Desc: 'United producers, greater strength. The cooperative ensures fair prices and better conditions.',
    whyC4Title: 'Direct Distribution', whyC4Desc: 'From field to market without intermediaries. Fresh products to domestic and international markets.',
    labelAddr: 'Address', labelPhone: 'Phone', labelHours: 'Hours',
    seasonals: [
      { name: 'Peaches', season: 'July – August', desc: 'Juicy, straight from the orchard' },
      { name: 'Cherries', season: 'May – June', desc: 'Sweet-sour, hand-picked' },
      { name: 'Apples', season: 'September – November', desc: 'Fuji & Golden, crispy' },
      { name: 'Strawberries', season: 'April – May', desc: 'Aromatic, natural cultivation' },
      { name: 'Pears', season: 'August – October', desc: 'Honey-sweet, tree-ripened' },
    ],
  }
};

function setLang(lang) {
  currentLang = lang;
  const t = translations[lang];

  document.getElementById('btn-el').classList.toggle('active', lang === 'el');
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');


  // Universal translator - all elements with data-el/data-en
  document.querySelectorAll('[data-el]').forEach(el => {
    el.innerHTML = lang === 'en' ? (el.dataset.en || el.dataset.el) : el.dataset.el;
  });
  // Translate placeholders
  document.querySelectorAll('[data-ph-el]').forEach(el => {
    el.placeholder = lang === 'en' ? (el.dataset.phEn || el.dataset.phEl) : el.dataset.phEl;
  });

  // Nav
  ['egk','pist','gallery','ann','iso','contact'].forEach(id => {
    const el = document.getElementById('nav-' + id);
    if (el) el.innerHTML = t['nav-' + id];
  });

  // Hero
  const eyebrow = document.querySelector('.hero-eyebrow');
  if (eyebrow) eyebrow.textContent = t.heroEyebrow;
  const title = document.querySelector('.hero-title');
  if (title) title.innerHTML = t.heroTitle;

  // Sidebar
  const sHeadings = document.querySelectorAll('.sidebar-heading');
  if (sHeadings[0]) sHeadings[0].textContent = t.sidebarProducts;
  if (sHeadings[1]) sHeadings[1].textContent = t.sidebarNews;
  const sLinks = document.querySelectorAll('.sidebar-list:not(.sidebar-news) li a');
  if (sLinks[0]) sLinks[0].textContent = t.sidebarFresh;
  if (sLinks[1]) sLinks[1].textContent = t.sidebarCanned;
  if (sLinks[2]) sLinks[2].textContent = t.sidebarPuree;
  const newsLink = document.querySelector('.sidebar-news li a');
  if (newsLink) newsLink.textContent = t.sidebarNewsLink;

  // Home paragraphs
  const paras = document.querySelectorAll('.home-text p:not(.home-reg)');
  if (paras[0]) paras[0].innerHTML = t.p1;
  if (paras[1]) paras[1].innerHTML = t.p2;
  if (paras[2]) paras[2].innerHTML = t.p3;
  if (paras[3]) paras[3].innerHTML = t.p4;
  const reg = document.querySelector('.home-reg');
  if (reg) reg.textContent = t.reg;

  // Highlights
  const hTitle = document.querySelector('.highlights-heading');
  if (hTitle) hTitle.textContent = t.highlightsTitle;

  // Newsletter
  const nTitle = document.querySelector('.newsletter-title');
  if (nTitle) nTitle.textContent = t.newsletterTitle;
  const nSub = document.querySelector('.newsletter-sub');
  if (nSub) nSub.textContent = t.newsletterSub;
  const ni = document.getElementById('newsletterEmail');
  if (ni) ni.placeholder = t.newsletterPlaceholder;
  const nBtn = document.querySelector('.newsletter-btn');
  if (nBtn) nBtn.textContent = t.newsletterBtn;

  // Footer
  const fSpan = document.querySelector('.home-footer footer span:last-child');
  if (fSpan) fSpan.textContent = t.footerText;

  // Edit bar
  const eb = document.getElementById('editBar');
  if (eb) {
    const dot = eb.querySelector('.edit-dot').outerHTML;
    eb.innerHTML = dot + ' ' + t.editBar;
  }

  // Inner pages
  const egkLabel = document.querySelector('#page-egk .section-label');
  const egkTitle = document.querySelector('#page-egk .section-title');
  const egkIntro = document.querySelector('#page-egk .section-intro');
  if (egkLabel) egkLabel.textContent = t.egkLabel;
  if (egkTitle) egkTitle.textContent = t.egkTitle;
  if (egkIntro) egkIntro.textContent = t.egkIntro;

  const pistLabel = document.querySelector('#page-pist .section-label');
  const pistTitle = document.querySelector('#page-pist .section-title');
  const pistIntro = document.querySelector('#page-pist .section-intro');
  if (pistLabel) pistLabel.textContent = t.pistLabel;
  if (pistTitle) pistTitle.textContent = t.pistTitle;
  if (pistIntro) pistIntro.textContent = t.pistIntro;

  const gallLabel = document.querySelector('#page-gallery .section-label');
  const gallTitle = document.querySelector('#page-gallery .section-title');
  const gallIntro = document.querySelector('#page-gallery .section-intro');
  if (gallLabel) gallLabel.textContent = t.gallLabel;
  if (gallTitle) gallTitle.textContent = t.gallTitle;
  if (gallIntro) gallIntro.textContent = t.gallIntro;

  const annLabel = document.querySelector('#page-ann .section-label');
  const annTitle = document.querySelector('#page-ann .section-title');
  const annBtn = document.querySelector('#page-ann .btn-primary');
  if (annLabel) annLabel.textContent = t.annLabel;
  if (annTitle) annTitle.textContent = t.annTitle;
  if (annBtn) annBtn.textContent = t.annBtn;
  const annEmpty = document.getElementById('annEmpty');
  if (annEmpty) annEmpty.textContent = t.annEmpty;

  const contactLabel = document.querySelector('#page-contact .section-label');
  const contactTitle = document.querySelector('#page-contact .section-title');
  if (contactLabel) contactLabel.textContent = t.contactLabel;
  if (contactTitle) contactTitle.textContent = t.contactTitle;
  const contactIntro = document.querySelector('.contact-info > p');
  if (contactIntro) contactIntro.textContent = t.contactIntro;

  const labels = document.querySelectorAll('.contact-row .label');
  const values = document.querySelectorAll('.contact-row span:last-child');
  if (labels[0]) labels[0].textContent = t.labelAddr;
  if (labels[1]) labels[1].textContent = t.labelPhone;
  if (labels[2]) labels[2].textContent = 'Email';
  if (labels[3]) labels[3].textContent = t.labelHours;
  if (values[0]) values[0].textContent = t.contactAddr;
  if (values[1]) values[1].textContent = t.contactPhone;
  if (values[2]) values[2].textContent = t.contactEmail;
  if (values[3]) values[3].textContent = t.contactHours;

  const formLabels = document.querySelectorAll('.contact-form .form-field label');
  const formInputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
  if (formLabels[0]) formLabels[0].textContent = t.contactNameLabel;
  if (formLabels[1]) formLabels[1].textContent = t.contactEmailLabel;
  if (formLabels[2]) formLabels[2].textContent = t.contactMsgLabel;
  if (formInputs[0]) formInputs[0].placeholder = t.contactNamePh;
  if (formInputs[1]) formInputs[1].placeholder = t.contactEmailPh;
  if (formInputs[2]) formInputs[2].placeholder = t.contactMsgPh;
  const sendBtn = document.querySelector('.contact-form .btn-primary');
  if (sendBtn) sendBtn.textContent = t.contactSend;

  // Seasonal products
  t.seasonals.forEach((s, i) => {
    const n = i + 1;
    const nameEl = document.getElementById(`s${n}-name`);
    const seasonEl = document.getElementById(`s${n}-season`);
    const descEl = document.getElementById(`s${n}-desc`);
    if (nameEl) nameEl.textContent = s.name;
    if (seasonEl) seasonEl.textContent = s.season;
    if (descEl) descEl.textContent = s.desc;
  });

  // Why us section
  const whyLabel = document.getElementById('why-label');
  const whyTitle = document.getElementById('why-title');
  if (whyLabel) whyLabel.textContent = t.whyLabel;
  if (whyTitle) whyTitle.textContent = t.whyTitle;
  [['why-c1','whyC1'],['why-c2','whyC2'],['why-c3','whyC3'],['why-c4','whyC4']].forEach(([id, key]) => {
    const titleEl = document.getElementById(id + '-title');
    const descEl = document.getElementById(id + '-desc');
    if (titleEl) titleEl.textContent = t[key + 'Title'];
    if (descEl) descEl.textContent = t[key + 'Desc'];
  });

  // All footers
  document.querySelectorAll('footer').forEach(f => {
    const span = f.querySelector('span:last-child');
    if (span && span.textContent !== 'A.C. Pella') span.textContent = t.footerText;
  });
}

/* ── NEWSLETTER ── */
/* ── GALLERY FILTER ── */
function filterGallery(cat, btn) {
  document.querySelectorAll('.gallery-tag').forEach(t => t.classList.remove('active-tag'));
  btn.classList.add('active-tag');
  document.querySelectorAll('.gallery-cell').forEach(cell => {
    if (cat === 'all' || cell.dataset.cat === cat) {
      cell.style.display = '';
    } else {
      cell.style.display = 'none';
    }
  });
}

function addLabel(input) {
  const f = input.files[0]; if (!f) return;
  const url = URL.createObjectURL(f);
  const grid = document.querySelector('.label-grid');
  const empty = document.querySelector('.label-card-empty');
  const newCard = document.createElement('div');
  newCard.className = 'label-card';
  newCard.innerHTML = `
    <div class="label-img-wrap"><img src="${url}" style="width:100%;height:auto;display:block;border-radius:4px;"/></div>
    <div class="label-info">
      <h4 class="label-name" contenteditable="false" data-editable="true" data-ck="ck20">Νέα Ετικέτα</h4>
      <p class="label-desc" contenteditable="false" data-editable="true" data-ck="ck21">Κλικ για επεξεργασία περιγραφής...</p>
    </div>`;
  grid.insertBefore(newCard, empty);
}
function handleNewsletter(e) {
  e.preventDefault();
  const email = document.getElementById('newsletterEmail').value;
  alert(currentLang === 'el'
    ? `Ευχαριστούμε! Το ${email} προστέθηκε στη λίστα μας.`
    : `Thank you! ${email} has been added to our list.`);
  e.target.reset();
}

function handleSubmit(e) {
  e.preventDefault();
  alert('Το μήνυμά σας στάλθηκε! Θα επικοινωνήσουμε σύντομα.');
  e.target.reset();
}

/* Initial route from hash */
const initHash = location.hash.replace('#','');
if (pages.includes(initHash)) navigate(initHash);
  
  
  
  


/* ════════════════════════════════
   6. ΙΣΟΛΟΓΙΣΜΟΙ
════════════════════════════════ */
let isoPdfData = null;

async function loadIsologismoi() {
  try {
    const res = await fetch(API_URL + '/api/isologismoi');
    const items = await res.json();
    const grid = document.getElementById('isoGrid');
    const empty = document.getElementById('isoEmpty');
    if (!grid) return;
    grid.querySelectorAll('.iso-row').forEach(c => c.remove());
    if (!items.length) {
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'iso-row';
      row.onclick = (e) => { if (!e.target.classList.contains('iso-del-btn')) downloadIso(item.id, e); };
      row.innerHTML = '<div class="iso-row-icon">📄</div><div class="iso-row-info"><div class="iso-row-year">' + item.year + '</div><div class="iso-row-title">' + item.title + '</div></div><a class="iso-row-btn" href="#" onclick="downloadIso(' + item.id + ', event)">⬇ Λήψη PDF</a>' + (isAdmin ? '<button class="iso-del-btn" onclick="deleteIso(' + item.id + ')" title="Διαγραφή">✕</button>' : '');
      grid.appendChild(row);
    });
  } catch(e) { console.error('loadIsologismoi error:', e); }
}

function openIsoUpload() {
  document.getElementById('isoModal').style.display = 'flex';
  document.getElementById('isoTitle').value = '';
  document.getElementById('isoYear').value = new Date().getFullYear();
  document.getElementById('isoPdfLabel').textContent = 'Κλικ για επιλογη PDF';
  isoPdfData = null;
}

function closeIsoModal() {
  document.getElementById('isoModal').style.display = 'none';
}

function handleIsoPdf(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    isoPdfData = e.target.result;
    document.getElementById('isoPdfLabel').textContent = '✓ ' + file.name;
  };
  reader.readAsDataURL(file);
}

async function submitIso() {
  const title = document.getElementById('isoTitle').value.trim();
  const year = document.getElementById('isoYear').value;
  if (!title || !year || !isoPdfData) {
    alert('Συμπληρωσε τιτλο, ετος και αρχειο PDF!');
    return;
  }
  const btn = document.getElementById('isoSubmitBtn');
  btn.textContent = 'Αποθηκευση...';
  btn.disabled = true;
  try {
    const res = await fetch(API_URL + '/api/isologismoi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
      body: JSON.stringify({ title, year: parseInt(year), pdf_data: isoPdfData })
    });
    if (res.ok) {
      closeIsoModal();
      loadIsologismoi();
  loadCertificates();
    } else {
      alert('Σφαλμα αποθηκευσης!');
    }
  } catch(e) {
    alert('Σφαλμα: ' + e.message);
  }
  btn.textContent = 'Αποθηκευση';
  btn.disabled = false;
}

async function deleteIso(id) {
  if (!confirm('Διαγραφη ισολογισμου;')) return;
  try {
    await fetch(API_URL + '/api/isologismoi/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    loadIsologismoi();
  loadCertificates();
  } catch(e) {}
}


/* ════════════════════════════════
   7. ΠΙΣΤΟΠΟΙΗΤΙΚΑ
════════════════════════════════ */
let certPdfData = null;

async function loadCertificates() {
  try {
    const res = await fetch(API_URL + '/api/certificates');
    const items = await res.json();
    const grid = document.getElementById('certNewGrid');
    const empty = document.getElementById('certEmpty');
    if (!grid) return;
    grid.querySelectorAll('.cert-new-card').forEach(c => c.remove());
    if (!items.length) {
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'cert-new-card';
      const icon = item.icon || 'ti-certificate';
      card.innerHTML = '<div class="cert-new-header"><i class="ti ' + icon + '"></i></div><div class="cert-new-body">' + (isAdmin ? '<button class="cert-new-del" onclick="deleteCert(' + item.id + ')">✕</button>' : '') + '<div class="cert-new-title">' + item.title + '</div><div class="cert-new-desc">' + (item.description || '') + '</div><button class="cert-new-btn" onclick="downloadCert(' + item.id + ', event)"><i class="ti ti-download" style="font-size:0.9rem;"></i> PDF</button></div>';
      grid.appendChild(card);
    });
  } catch(e) { console.error('loadCertificates error:', e); }
}

function openCertUpload() {
  document.getElementById('certModal').style.display = 'flex';
  document.getElementById('certTitle').value = '';
  document.getElementById('certDesc').value = '';
  document.getElementById('certPdfLabel').textContent = 'Κλικ για επιλογη PDF';
  certPdfData = null;
  document.getElementById('certIcon').value = 'ti-certificate';
  document.querySelectorAll('.cert-icon-btn').forEach((b,i) => { b.style.border = i===0 ? '1px solid var(--green)' : '1px solid #ddd'; b.style.background = i===0 ? 'var(--green-lt)' : '#fff'; });
}

function closeCertModal() {
  document.getElementById('certModal').style.display = 'none';
}

function handleCertPdf(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    certPdfData = e.target.result;
    document.getElementById('certPdfLabel').textContent = '✓ ' + file.name;
  };
  reader.readAsDataURL(file);
}

function selectCertIcon(btn, icon) {
  document.querySelectorAll('.cert-icon-btn').forEach(b => {
    b.style.border = '1px solid #ddd';
    b.style.background = '#fff';
  });
  btn.style.border = '1px solid var(--green)';
  btn.style.background = 'var(--green-lt)';
  document.getElementById('certIcon').value = icon;
}

async function submitCert() {
  const title = document.getElementById('certTitle').value.trim();
  const description = document.getElementById('certDesc').value.trim();
  if (!title) { alert('Συμπληρωσε τιτλο!'); return; }
  const btn = document.getElementById('certSubmitBtn');
  btn.textContent = 'Αποθηκευση...';
  btn.disabled = true;
  try {
    const res = await fetch(API_URL + '/api/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
      body: JSON.stringify({ title, description, pdf_data: certPdfData, icon: document.getElementById('certIcon').value })
    });
    if (res.ok) {
      closeCertModal();
      loadCertificates();
    } else {
      alert('Σφαλμα αποθηκευσης!');
    }
  } catch(e) { alert('Σφαλμα: ' + e.message); }
  btn.textContent = 'Αποθηκευση';
  btn.disabled = false;
}

async function deleteCert(id) {
  if (!confirm('Διαγραφη πιστοποιητικου;')) return;
  try {
    await fetch(API_URL + '/api/certificates/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    loadCertificates();
  } catch(e) {}
}

async function downloadCert(id, e) {
  if (e) e.preventDefault();
  try {
    const res = await fetch(API_URL + '/api/certificates/' + id);
    const data = await res.json();
    if (!data.pdf_data) return;
    const base64 = data.pdf_data.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = data.title + '.pdf'; a.click();
    URL.revokeObjectURL(url);
  } catch(err) { alert('Σφαλμα ληψης PDF!'); }
}

async function downloadIso(id, e) {
  e.preventDefault();
  try {
    const res = await fetch(API_URL + '/api/isologismoi/' + id);
    const data = await res.json();
    const base64 = data.pdf_data.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.title + '.pdf';
    a.click();
    URL.revokeObjectURL(url);
  } catch(err) {
    alert('Σφάλμα ληψης PDF!');
  }
}


/* ════════════════════════════════
   MOBILE NAV
════════════════════════════════ */
function toggleMobileNav() {
  var nav = document.getElementById('mobileNav');
  var overlay = document.getElementById('mobileNavOverlay');
  var burger = document.getElementById('navBurger');
  if (nav.classList.contains('open')) {
    closeMobileNav();
  } else {
    var desktopLogo = document.querySelector('.nav-logo-img img');
    if (desktopLogo) document.getElementById('mobileNavLogo').src = desktopLogo.src;
    buildMobileNav();
    nav.classList.add('open');
    overlay.classList.add('open');
    burger.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileNav() {
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('mobileNavOverlay').classList.remove('open');
  document.getElementById('navBurger').classList.remove('open');
  document.body.style.overflow = '';
}

function buildMobileNav() {
  var container = document.getElementById('mobileNavItems');
  container.innerHTML = '';
  var lang = (typeof currentLang !== 'undefined') ? currentLang : 'el';

  var navStructure = [
    { id: 'home', el: 'Αρχική', en: 'Home' },
    { id: 'egk', el: 'Εγκαταστάσεις', en: 'Facilities', children: [
      { id: 'egk-konservo', el: 'Κονσερβοποιείο', children: [
        { id: 'egk-konservo-genika', el: 'Γενικά' },
        { id: 'egk-konservo-istoria', el: 'Ιστορία' },
        { id: 'egk-konservo-ygeia', el: 'Υγεία & Ασφάλεια' },
        { id: 'egk-konservo-perivallontiki', el: 'Περιβαλλοντική Πολιτική' },
        { id: 'egk-konservo-frouta', el: 'Φρούτα' },
        { id: 'egk-konservo-texnikes', el: 'Τεχνικές Προδιαγραφές' },
        { id: 'egk-konservo-etiketes', el: 'Ετικέτες' }
      ]},
      { id: 'egk-ekko', el: 'Εκκοκιστήριο', children: [
        { id: 'egk-ekko-genika', el: 'Γενικά' },
        { id: 'egk-ekko-skopos', el: 'Σκοπός & Όραμα' },
        { id: 'egk-ekko-paragogi', el: 'Παραγωγική Διαδικασία' },
        { id: 'egk-ekko-dynamikotita', el: 'Δυναμικότητα' },
        { id: 'egk-ekko-poiotita', el: 'Ποιότητα' }
      ]},
      { id: 'egk-dialogi', el: 'Διαλογητήριο Ψυγεία', children: [
        { id: 'egk-dialogi-genika', el: 'Γενικά' },
        { id: 'egk-dialogi-poiotita', el: 'Ποιότητα' }
      ]},
      { id: 'egk-kentro', el: 'Κέντρο Εξυπηρέτησης Αγροτών', children: [
        { id: 'egk-kentro-ypiresies', el: 'Υπηρεσίες' }
      ]},
      { id: 'egk-dimitriaka', el: 'Δημητριακά Ζωοτροφές' }
    ]},
    { id: 'pist', el: 'Πιστοποιητικά Διακρίσεις', en: 'Certifications' },
    { id: 'gallery', el: 'Photo Gallery', en: 'Photo Gallery' },
    { id: 'ann', el: 'Ανακοινώσεις', en: 'News' },
    { id: 'iso', el: 'Ισολογισμοί', en: 'Financial Reports' },
    { id: 'contact', el: 'Επικοινωνία', en: 'Contact' }
  ];

  function makeRow(label, hasChildren, depth, onClickFn) {
    var row = document.createElement('div');
    var pad = depth === 0 ? '1.2rem' : (depth === 1 ? '2rem' : '2.8rem');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:0.8rem ' + pad + ';border-bottom:1px solid var(--bg);cursor:pointer;transition:background 0.15s;';
    row.onmouseover = function() { this.style.background = 'var(--green-lt)'; };
    row.onmouseout = function() { this.style.background = ''; };
    var span = document.createElement('span');
    span.style.cssText = 'font-size:' + (depth === 0 ? '0.92rem' : '0.83rem') + ';font-weight:' + (depth === 0 ? '500' : '400') + ';color:var(--ink);';
    span.textContent = label;
    row.appendChild(span);
    if (hasChildren) {
      var arrow = document.createElement('span');
      arrow.textContent = '›';
      arrow.style.cssText = 'font-size:1.1rem;color:var(--muted);transition:transform 0.2s;display:inline-block;';
      row.appendChild(arrow);
      row.onclick = function() {
        var sub = this.nextSibling;
        if (sub) {
          var open = sub.style.display !== 'none';
          sub.style.display = open ? 'none' : 'block';
          arrow.style.transform = open ? '' : 'rotate(90deg)';
        }
      };
    } else {
      row.onclick = onClickFn;
    }
    return row;
  }

  function renderItems(items, parent, depth) {
    items.forEach(function(item) {
      var label = (lang === 'en' && item.en) ? item.en : item.el;
      if (item.children) {
        var row = makeRow(label, true, depth, null);
        parent.appendChild(row);
        var sub = document.createElement('div');
        sub.style.display = 'none';
        sub.style.background = 'var(--bg)';
        renderItems(item.children, sub, depth + 1);
        parent.appendChild(sub);
      } else {
        var row = makeRow(label, false, depth, (function(id) {
          return function() { navigate(id); closeMobileNav(); };
        })(item.id));
        parent.appendChild(row);
      }
    });
  }

  renderItems(navStructure, container, 0);
}
