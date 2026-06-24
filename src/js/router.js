import { state } from './state.js';

    /* ════════════════════════════════
       SPA ROUTER
    ════════════════════════════════ */
export const pages = ['home','egk',
      'egk-konservo','egk-konservo-genika','egk-konservo-istoria','egk-konservo-ygeia','egk-konservo-perivallontiki','egk-konservo-frouta','egk-konservo-texnikes','egk-konservo-etiketes',
      'egk-ekko','egk-ekko-genika','egk-ekko-skopos','egk-ekko-paragogi','egk-ekko-dynamikotita','egk-ekko-poiotita',
      'egk-dialogi','egk-dialogi-genika','egk-dialogi-poiotita',
      'egk-kentro','egk-kentro-ypiresies',
      'egk-dimitriaka',
      'pist','gallery','ann','contact'];

export function navigate(id) {
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

