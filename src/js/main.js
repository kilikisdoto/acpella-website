import * as auth from './auth.js';
import * as cms from './cms.js';
import * as gallery from './gallery.js';
import * as router from './router.js';
import * as ui from './ui.js';
import * as announcements from './announcements.js';
import * as i18n from './i18n.js';
import * as api from './api.js';

Object.assign(window, auth, cms, gallery, router, ui, announcements, i18n, api);

api.loadContentFromAPI();
api.loadAnnouncements();
api.loadGalleryFromAPI();
api.loadHomeAnnouncements();
cms.loadCMSPages();
auth.checkAdminHash();

const initHash = location.hash.replace('#', '');
if (router.pages && router.pages.includes(initHash)) router.navigate(initHash);
