import { API_URL } from './config.js';
import { state } from './state.js';

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       ADMIN PANEL
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */



export let isAdmin = false;
export let adminToken = null;

    // Check URL hash for admin
export function checkAdminHash() {
      if (window.location.hash === '#admin') {
        document.getElementById('adminOverlay').classList.add('open');
      }
    }
    window.addEventListener('hashchange', checkAdminHash);
    window.addEventListener('load', checkAdminHash);
    // Also check on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', checkAdminHash);

export async function doAdminLogin() {
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
        // Fallback to local check if API down
        if (user === ADMIN_USER && pass === ADMIN_PASS) {
          adminToken = 'acpella-admin-2025';
          document.getElementById('adminOverlay').classList.remove('open');
          enableAdminMode();
        } else {
          document.getElementById('adminError').classList.add('show');
        }
      }
    }

export function enableAdminMode() {
      isAdmin = true;
      document.body.classList.add('admin-mode');
      document.getElementById('adminBar').classList.add('active');
      // Show admin-only elements
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = '';
      });
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
        el.title = 'ÎšÎ»Î¹Îº Î³Î¹Î± ÎµÏ€ÎµÎ¾ÎµÏÎ³Î±ÏƒÎ¯Î±';
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

export function adminLogout() {
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

export async function adminSave() {
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
      toast.textContent = 'âœ… Î‘Ï€Î¿Î¸Î·ÎºÎµÏÏ„Î·ÎºÎµ! Î˜Î± ÎµÎ¼Ï†Î±Î½Î¹ÏƒÏ„ÎµÎ¯ ÏƒÎµ ÏŒÎ»Î¿Ï…Ï‚.';
      toast.classList.add('show');
      setTimeout(() => { toast.classList.remove('show'); toast.textContent = 'âœ… Î‘Ï€Î¿Î¸Î·ÎºÎµÏÏ„Î·ÎºÎµ!'; }, 3000);
    }

export function adminAddPhotos(input) {
      const grid = document.getElementById('galleryGrid');
      const caption = prompt('Î¤Î¯Ï„Î»Î¿Ï‚ Ï†Ï‰Ï„Î¿Î³ÏÎ±Ï†Î¯Î±Ï‚ (Ï€ÏÎ¿Î±Î¹ÏÎµÏ„Î¹ÎºÏŒ):') || '';
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

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       ADMIN INLINE EDIT CONTROLS
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function renameNavItem(navId, e) {
      e.stopPropagation();
      const el = document.getElementById('nav-' + navId);
      if (!el) return;
      const current = el.textContent.trim();
      const newName = prompt('ÎÎ­Î¿ ÏŒÎ½Î¿Î¼Î± Î³Î¹Î± "' + current + '":', current);
      if (!newName || newName === current) return;
      el.textContent = newName;
      el.dataset.el = newName;
      adminSave();
    }

export function deleteNavItem(navId, e) {
      e.stopPropagation();
      const el = document.getElementById('nav-' + navId);
      const name = el ? el.textContent.trim() : navId;
      if (!confirm('Î”Î¹Î±Î³ÏÎ±Ï†Î® "' + name + '" Î±Ï€ÏŒ Ï„Î¿ Î¼ÎµÎ½Î¿Ï;\nÎ ÏÎ¿ÏƒÎ¿Ï‡Î®: Î´ÎµÎ½ Î´Î¹Î±Î³ÏÎ¬Ï†ÎµÏ„Î±Î¹ Ï„Î¿ Ï€ÎµÏÎ¹ÎµÏ‡ÏŒÎ¼ÎµÎ½Î¿!')) return;
      const li = el ? el.closest('li') : null;
      if (li) li.style.display = 'none';
    }

export function renameCat(catId, e) {
      e.stopPropagation();
      const header = document.querySelector('#page-egk .egk-overview-card .egk-overview-header[onclick*="' + catId + '"] .egk-overview-title');
      if (!header) return;
      const current = header.textContent.trim();
      const newName = prompt('ÎÎ­Î¿ ÏŒÎ½Î¿Î¼Î±:', current);
      if (!newName || newName === current) return;
      header.textContent = newName;
      // Also update dropdown
      const navA = document.querySelector('.nav-dropdown-item a[onclick*="' + catId + '"]');
      if (navA) navA.textContent = newName;
      adminSave();
    }

export function deleteCat(catId, e) {
      e.stopPropagation();
      if (!confirm('Î”Î¹Î±Î³ÏÎ±Ï†Î® ÎºÎ±Ï„Î·Î³Î¿ÏÎ¯Î±Ï‚;')) return;
      // Hide in overview
      const card = document.querySelector('#page-egk .egk-overview-card:has([onclick*="' + catId + '"])');
      if (card) card.style.display = 'none';
      // Hide in dropdown
      const dropItem = document.querySelector('.nav-dropdown-item:has(a[onclick*="' + catId + '"])');
      if (dropItem) dropItem.style.display = 'none';
    }

export function renameSubpage(pageId, e) {
      e.stopPropagation();
      const links = document.querySelectorAll('a[onclick*="' + pageId + '"]');
      if (!links.length) return;
      const current = links[0].textContent.trim();
      const newName = prompt('ÎÎ­Î¿ ÏŒÎ½Î¿Î¼Î±:', current);
      if (!newName || newName === current) return;
      links.forEach(l => { l.textContent = newName; });
      // Update page title
      const pageTitle = document.querySelector('#page-' + pageId + ' .section-title');
      if (pageTitle) pageTitle.textContent = newName;
      adminSave();
    }

export function deleteSubpage(pageId, e) {
      e.stopPropagation();
      if (!confirm('Î”Î¹Î±Î³ÏÎ±Ï†Î® Ï…Ï€Î¿ÎºÎ±Ï„Î·Î³Î¿ÏÎ¯Î±Ï‚;')) return;
      // Hide the li in overview
      const li = document.querySelector('.egk-overview-links li:has(a[onclick*="' + pageId + '"])');
      if (li) li.style.display = 'none';
      // Hide in dropdown
      const dropA = document.querySelector('.nav-subdropdown a[onclick*="' + pageId + '"]');
      if (dropA) dropA.style.display = 'none';
    }

export function addSubpage(btn, e) {
      e.stopPropagation();
      const title = prompt('Î¤Î¯Ï„Î»Î¿Ï‚ Î½Î­Î±Ï‚ Ï…Ï€Î¿ÎºÎ±Ï„Î·Î³Î¿ÏÎ¯Î±Ï‚:');
      if (!title) return;
      const ul = btn.closest('ul');
      const addLi = btn.closest('li');
      const newLi = document.createElement('li');
      const slug = 'new-' + Date.now();
      newLi.innerHTML = `
        <a onclick="navigate('cms-${slug}')">${title}</a>
        <div class="egk-link-ctrl" style="display:flex;">
          <button class="admin-ctrl-btn admin-ctrl-edit" onclick="renameSubpage('cms-${slug}',event)" title="ÎœÎµÏ„Î¿Î½Î¿Î¼Î±ÏƒÎ¯Î±">âœï¸</button>
          <button class="admin-ctrl-btn admin-ctrl-del" onclick="deleteSubpage('cms-${slug}',event)" title="Î”Î¹Î±Î³ÏÎ±Ï†Î®">âœ•</button>
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

export function addSubpageToDropdown(parentCat, e) {
      e.stopPropagation();
      const title = prompt('Î¤Î¯Ï„Î»Î¿Ï‚ Î½Î­Î±Ï‚ Ï…Ï€Î¿ÏƒÎµÎ»Î¯Î´Î±Ï‚:');
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
            <button class="admin-ctrl-btn admin-ctrl-edit" onclick="renameSubpage('cms-${slug}',event)">âœï¸</button>
            <button class="admin-ctrl-btn admin-ctrl-del" onclick="deleteSubpage('cms-${slug}',event)">âœ•</button>
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

export function addSubpageToNav(navId, e) {
      e.stopPropagation();
      const title = prompt('Î¤Î¯Ï„Î»Î¿Ï‚ Î½Î­Î±Ï‚ Ï…Ï€Î¿ÏƒÎµÎ»Î¯Î´Î±Ï‚:');
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
            <button class="admin-ctrl-btn admin-ctrl-edit" onclick="renameSubpage('cms-${slug}',event)">âœï¸</button>
            <button class="admin-ctrl-btn admin-ctrl-del" onclick="deleteSubpage('cms-${slug}',event)">âœ•</button>
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

export function addCategory() {
      const title = prompt('Î¤Î¯Ï„Î»Î¿Ï‚ Î½Î­Î±Ï‚ ÎºÎ±Ï„Î·Î³Î¿ÏÎ¯Î±Ï‚:');
      if (!title) return;
      const icon = prompt('Î•Î¹ÎºÎ¿Î½Î¯Î´Î¹Î¿ (emoji):', 'ðŸ“„') || 'ðŸ“„';
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
          <button class="admin-ctrl-btn admin-ctrl-edit" onclick="renameCat('cms-${slug}',event)">âœï¸</button>
          <button class="admin-ctrl-btn admin-ctrl-del" onclick="deleteCat('cms-${slug}',event)">âœ•</button>
        </div>
        <ul class="egk-overview-links">
          <li class="admin-only" style="display:flex;">
            <a onclick="addSubpage(this,event)" style="color:var(--green);font-weight:600;">âž• ÎÎ­Î± Ï…Ï€Î¿ÎºÎ±Ï„Î·Î³Î¿ÏÎ¯Î±</a>
          </li>
        
            <li class="admin-only" style="display:none;padding:0.3rem 0;">
              <a onclick="addSubpage(this,event)" style="color:var(--green);font-weight:600;font-size:0.78rem;cursor:pointer;">âž• ÎÎ­Î± Ï…Ï€Î¿ÎºÎ±Ï„Î·Î³Î¿ÏÎ¯Î±</a>
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


