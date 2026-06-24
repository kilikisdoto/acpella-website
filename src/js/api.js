import { API_URL } from './config.js';
import { state } from './state.js';

export async function loadContentFromAPI() {
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
export async function loadAnnouncements() {
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

export async function deleteAnnouncement(id) {
      try {
        await fetch(API_URL + '/api/announcements/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        loadAnnouncements();
      } catch(e) {}
    }

    // Load gallery from API
export async function loadGalleryFromAPI() {
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

export async function deleteGalleryImage(id, btn) {
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
export async function loadHomeAnnouncements() {
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
