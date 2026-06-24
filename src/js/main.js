import { loadContentFromAPI, loadAnnouncements, loadGalleryFromAPI, loadHomeAnnouncements } from './api.js';
import { loadCMSPages } from './cms.js';
import { navigate, pages } from './router.js';
import { checkAdminHash } from './auth.js';

// Make everything global (needed for onclick in HTML)
import * as auth from './auth.js';
import * as cms from './cms.js';
import * as gallery from './gallery.js';
import * as router from './router.js';
import * as ui from './ui.js';
import * as announcements from './announcements.js';
import * as i18n from './i18n.js';
import * as api from './api.js';

// Expose to global scope for onclick handlers in HTML
Object.assign(window, auth, cms, gallery, router, ui, announcements, i18n, api);

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  loadContentFromAPI();
  loadAnnouncements();
  loadGalleryFromAPI();
  loadHomeAnnouncements();
  loadCMSPages();
  checkAdminHash();

  // Initial route from hash
  const initHash = location.hash.replace('#', '');
  if (pages.includes(initHash)) navigate(initHash);
});
