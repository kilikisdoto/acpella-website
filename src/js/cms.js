import { API_URL } from './config.js';
import { state } from './state.js';
import { navigate } from './router.js';

    /* ════════════════════════════════
       CMS - PAGE MANAGER
    ════════════════════════════════ */
    let cmsPages = [];
    let cmsCurrentPage = null;
    let cmsCurrentImage = null;

export function openCMS() {
      document.getElementById('cmsOverlay').classList.add('open');
      loadCMSPages();
    }

export function closeCMS() {
      document.getElementById('cmsOverlay').classList.remove('open');
    }

export async function loadCMSPages() {
      try {
        const res = await fetch(API_URL + '/api/pages');
        cmsPages = await res.json();
        renderCMSTree();
        renderDynamicNav();
      } catch(e) {
        console.error('CMS load error:', e);
      }
    }

export function renderCMSTree() {
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

export async function editCMSPage(id) {
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

export function showNewPageForm(parentId) {
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

export function addSubPage(parentId) {
      showNewPageForm(parentId);
    }

export function previewCMSImg(input) {
      const file = input.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        cmsCurrentImage = e.target.result;
        const prev = document.getElementById('cmsImgPreview');
        if (prev) { prev.src = cmsCurrentImage; prev.style.display = 'block'; }
      };
      reader.readAsDataURL(file);
    }

export function cmsFormat(cmd, val) {
      document.getElementById('cmsContent').focus();
      document.execCommand(cmd, false, val || null);
    }

export function slugify(text) {
      return text.toLowerCase().trim()
        .replace(/[αά]/g,'a').replace(/[εέ]/g,'e').replace(/[ηή]/g,'i')
        .replace(/[ιί]/g,'i').replace(/[οό]/g,'o').replace(/[υύ]/g,'u')
        .replace(/[ωώ]/g,'o').replace(/[θ]/g,'th').replace(/[χ]/g,'ch')
        .replace(/[ξ]/g,'x').replace(/[ψ]/g,'ps').replace(/[σς]/g,'s')
        .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    }

export async function saveCMSPage() {
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

export async function deleteCMSPage(id) {
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
export function renderDynamicNav() {
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


