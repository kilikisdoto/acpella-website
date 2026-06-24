export let isAdmin = false;
export let adminToken = null;
export let currentLang = 'el';
export let lightboxImages = [];
export let lightboxIndex = 0;

export function setIsAdmin(v) { isAdmin = v; }
export function setAdminToken(v) { adminToken = v; }
export function setCurrentLang(v) { currentLang = v; }
export function setLightboxImages(v) { lightboxImages = v; }
export function setLightboxIndex(v) { lightboxIndex = v; }
