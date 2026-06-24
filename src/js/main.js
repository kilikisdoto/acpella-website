import * as auth from './auth.js';
import * as cms from './cms.js';
import * as gallery from './gallery.js';
import * as router from './router.js';
import * as ui from './ui.js';
import * as announcements from './announcements.js';
import * as i18n from './i18n.js';
import * as api from './api.js';

window._auth = auth;
window._cms = cms;
window._gallery = gallery;
window._router = router;
window._ui = ui;
window._announcements = announcements;
window._i18n = i18n;
window._api = api;

Object.assign(window, auth, cms, gallery, router, ui, announcements, i18n, api);

api.loadContentFromAPI();
api.loadAnnouncements();
api.loadGalleryFromAPI();
api.loadHomeAnnouncements();
cms.loadCMSPages();
auth.checkAdminHash();

const initHash = location.hash.replace('#', '');
if (router.pages && router.pages.includes(initHash)) router.navigate(initHash);
