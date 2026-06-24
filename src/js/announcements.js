import { API_URL } from './config.js';
import { state } from './state.js';

    /* ════════════════════════════════
       4. ΑΝΑΚΟΙΝΩΣΕΙΣ
    ════════════════════════════════ */
    let annCount = 0;
export function addAnnouncement() {
      document.getElementById('annModalTitle').value = '';
      document.getElementById('annModalBody').value = '';
      document.getElementById('annModal').classList.add('open');
      document.getElementById('annModalTitle').focus();
    }
export function closeAnnModal() {
      document.getElementById('annModal').classList.remove('open');
      removeAnnImg();
    }
    let annImageData = null;

export function previewAnnImg(input) {
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

export function removeAnnImg() {
      annImageData = null;
      document.getElementById('annModalImg').value = '';
      document.getElementById('annImgPreviewImg').style.display = 'none';
      document.getElementById('annImgPreview').style.display = 'flex';
      document.getElementById('annRemoveImg').style.display = 'none';
    }

export async function submitAnnouncement() {
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
export function deleteAnn(id) {
      const c = document.getElementById(`ann-${id}`); if (c) c.remove();
      const list = document.getElementById('annList');
      if (!list.querySelector('.ann-card'))
        list.innerHTML = '<div class="ann-empty" id="annEmpty">Δεν υπάρχουν ανακοινώσεις ακόμα. Πάτα «Νέα ανακοίνωση» για να προσθέσεις.</div>';
    }

