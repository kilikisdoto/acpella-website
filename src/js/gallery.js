import { state } from './state.js';

    /* ════════════════════════════════
       LIGHTBOX
    ════════════════════════════════ */
export let lightboxImages = [];
export let lightboxIndex = 0;

export function openLightbox(imgSrc, caption, index) {
      lightboxImages = Array.from(document.querySelectorAll('.gallery-cell img')).map(img => ({
        src: img.src, caption: img.closest('.gallery-cell').querySelector('div') ? img.closest('.gallery-cell').querySelector('div').textContent : ''
      }));
      lightboxIndex = index;
      document.getElementById('lightboxImg').src = lightboxImages[index].src;
      document.getElementById('lightboxCaption').textContent = lightboxImages[index].caption;
      document.getElementById('lightbox').classList.add('open');
      document.body.style.overflow = 'hidden';
    }

export function closeLightbox(e) {
      if (e && e.target !== document.getElementById('lightbox') && !e.target.classList.contains('lightbox-close')) return;
      document.getElementById('lightbox').classList.remove('open');
      document.body.style.overflow = '';
    }

export function lightboxNav(dir) {
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
export function setGallImg(input, idx) {
      const f = input.files[0]; if (!f) return;
      const url = URL.createObjectURL(f);
      const img = document.getElementById(`gimg-${idx}`);
      const ph = document.getElementById(`gph-${idx}`);
      if (img) { img.src = url; img.style.display = 'block'; }
      if (ph) ph.style.display = 'none';
    }
    let nextSlot = document.querySelectorAll('.gallery-cell').length;
export function addToGallery(input) {
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

