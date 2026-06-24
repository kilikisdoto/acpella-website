import { state } from './state.js';
import { navigate } from './router.js';

    /* ════════════════════════════════
       5. ΕΠΙΚΟΙΝΩΝΙΑ
    ════════════════════════════════ */
    /* ── ΓΛΩΣΣΑ ── */
export let currentLang = 'el';

    const translations = {
      el: {
        'nav-home': 'Αρχική',
        'nav-egk': 'Εγκαταστάσεις',
        'nav-pist': 'Πιστοποιητικά &amp; Διακρίσεις',
        'nav-gallery': 'Photo Gallery',
        'nav-ann': 'Ανακοινώσεις',
        'nav-contact': 'Επικοινωνία',
        heroEyebrow: 'Αγροτικός Συνεταιρισμός · Πέλλα',
        heroTitle: 'Φρέσκα <em>φρούτα</em><br>απ\' την πηγή',
        sidebarProducts: 'Προϊόντα',
        sidebarFresh: 'Νωπά φρούτα',
        sidebarCanned: 'Κονσερβοποιημένα Ροδάκινα',
        sidebarPuree: 'Πουρές Ροδάκινου',
        sidebarNews: 'Νέα',
        sidebarNewsLink: 'Δείτε όλες τις ανακοινώσεις →',
        p1: 'Ο Αγροτικός Συνεταιρισμός Πέλλας ιδρύθηκε στην Πέλλα, την καρδιά της Μακεδονίας, την πατρίδα του Μεγάλου Αλεξάνδρου, μιας από τις πιο παραγωγικές περιοχές στην Ελλάδα. Ο Συνεταιρισμός ιδρύθηκε το 1928 με την τότε ονομασία <em>«Ένωση Γεωργικών Συνεταιρισμών Γιαννιτσών»</em> και μετονομάστηκε σε <em>«Αγροτικό Συνεταιρισμό Πέλλας»</em> μετά από την αλλαγή της νομοθεσίας το 2012.',
        p2: 'Ο Αγροτικός Συνεταιρισμός Πέλλας περιλαμβάνει τώρα τουλάχιστον <strong>600 ενεργά μέλη</strong> και διατηρεί μία από τις πρώτες θέσεις των Αγροτικών Συνεταιριστικών Οργανώσεων στην Ελλάδα.',
        p3: 'Σημαντικές λειτουργίες του Συνεταιρισμού είναι η συλλογή, η μεταφορά και η προώθηση προς τις εγχώριες και ξένες αγορές όλων των αγροτικών προϊόντων της περιοχής.',
        p4: 'Ο κύριος ρόλος του Συνεταιρισμού είναι να υποστηρίξει την παραγωγική διαδικασία εξοπλισμένος με το κατάλληλο προσωπικό και την κατάλληλη υλικοτεχνική υποδομή. Η ευελιξία και η ταχύτητα είναι η κύρια φιλοσοφία και πρακτική του Αγροτικού Συνεταιρισμού Πέλλας.',
        reg: 'Αρ. Μητρώου: 0204017',
        highlightsTitle: '🌿 Εποχικά Προϊόντα',
        newsletterTitle: 'Μείνετε ενημερωμένοι',
        newsletterSub: 'Εγγραφείτε για νέα, εποχικά προϊόντα και ανακοινώσεις.',
        newsletterPlaceholder: 'Το email σας...',
        newsletterBtn: 'Εγγραφή',
        footerText: 'Αγροτικός Συνεταιρισμός Πέλλας',
        editBar: 'Κλικ σε οποιοδήποτε κείμενο για να το αλλάξεις',
        egkLabel: 'Οι χώροι μας',
        egkTitle: 'Εγκαταστάσεις',
        egkIntro: 'Σύγχρονες εγκαταστάσεις συσκευασίας και αποθήκευσης στην καρδιά της Πέλλας.',
        pistLabel: 'Αναγνώριση',
        pistTitle: 'Πιστοποιητικά & Διακρίσεις',
        pistIntro: 'Πιστοποιήσεις που εγγυώνται ασφαλή και υπεύθυνη παραγωγή.',
        pistBtn: '+ Προσθήκη πιστοποιητικού',
        gallLabel: 'Εικόνες',
        gallTitle: 'Photo Gallery',
        gallIntro: 'Κλικ σε οποιοδήποτε κελί για να ανεβάσεις φωτογραφία.',
        gallBtn: '+ Προσθήκη',
        annLabel: 'Νέα & Ενημερώσεις',
        annTitle: 'Ανακοινώσεις',
        annBtn: '+ Νέα ανακοίνωση',
        annEmpty: 'Δεν υπάρχουν ανακοινώσεις ακόμα.',
        contactLabel: 'Επικοινωνία',
        contactTitle: 'Μιλήστε μαζί μας',
        contactIntro: 'Για παραγγελίες, συνεργασίες ή οποιαδήποτε ερώτηση, είμαστε εδώ.',
        contactAddr: 'Γιαννιτσά, Πέλλα 58100',
        contactPhone: '+30 23820 00000',
        contactEmail: 'info@acpella.gr',
        contactHours: 'Δευτ–Παρ, 08:00–16:00',
        contactNameLabel: 'Όνομα', contactNamePh: 'Το όνομά σας',
        contactEmailLabel: 'Email', contactEmailPh: 'email@example.com',
        contactMsgLabel: 'Μήνυμα', contactMsgPh: 'Πώς μπορούμε να σας βοηθήσουμε;',
        contactSend: 'Αποστολή',
        whyLabel: 'Γιατί να μας επιλέξετε',
        whyTitle: 'Η διαφορά μας',
        whyC1Title: '95 Χρόνια Εμπειρίας', whyC1Desc: 'Από το 1928 στο πλευρό του αγρότη. Γνωρίζουμε τη γη, τα προϊόντα και τις ανάγκες της αγοράς.',
        whyC2Title: 'Πιστοποιημένη Ποιότητα', whyC2Desc: 'Διαθέτουμε IFS Food, FSSC 22000 και ISO 22000 — οι πιο αυστηρές διεθνείς πιστοποιήσεις ασφάλειας τροφίμων.',
        whyC3Title: '600+ Ενεργά Μέλη', whyC3Desc: 'Ενωμένοι παραγωγοί, μεγαλύτερη δύναμη. Ο συνεταιρισμός εξασφαλίζει δίκαιες τιμές και καλύτερες συνθήκες.',
        whyC4Title: 'Άμεση Διανομή', whyC4Desc: 'Από τον αγρό στην αγορά χωρίς ενδιάμεσους. Φρέσκα προϊόντα σε εγχώριες και διεθνείς αγορές.',
        labelAddr: 'Διεύθυνση', labelPhone: 'Τηλέφωνο', labelHours: 'Ώρες',
        seasonals: [
          { name: 'Ροδάκινα', season: 'Ιούλιος – Αύγουστος', desc: 'Ζουμερά, απευθείας από τον αγρό' },
          { name: 'Κεράσια', season: 'Μάιος – Ιούνιος', desc: 'Γλυκόξινα, μαζεμένα χειρωνακτικά' },
          { name: 'Μήλα', season: 'Σεπτέμβριος – Νοέμβριος', desc: 'Fuji & Golden, τραγανά' },
          { name: 'Φράουλες', season: 'Απρίλιος – Μάιος', desc: 'Αρωματικές, φυσική καλλιέργεια' },
          { name: 'Αχλάδια', season: 'Αύγουστος – Οκτώβριος', desc: 'Μελωμένα, ωριμάζουν στο χέρι' },
        ],
      },
      en: {
        'nav-home': 'Home',
        'nav-egk': 'Facilities',
        'nav-pist': 'Certifications',
        'nav-gallery': 'Photo Gallery',
        'nav-ann': 'News',
        'nav-contact': 'Contact',
        heroEyebrow: 'Agricultural Cooperative · Pella',
        heroTitle: 'Fresh <em>fruits</em><br>from the source',
        sidebarProducts: 'Products',
        sidebarFresh: 'Fresh fruits',
        sidebarCanned: 'Canned Peaches',
        sidebarPuree: 'Peach Puree',
        sidebarNews: 'News',
        sidebarNewsLink: 'View all announcements →',
        p1: 'The Agricultural Cooperative of Pella was founded in Pella, the heart of Macedonia, birthplace of Alexander the Great, one of the most productive regions in Greece. The Cooperative was founded in 1928 under the name <em>"Union of Agricultural Cooperatives of Giannitsa"</em> and was renamed <em>"Agricultural Cooperative of Pella"</em> following a change in legislation in 2012.',
        p2: 'The Agricultural Cooperative of Pella now includes at least <strong>600 active members</strong> and holds one of the leading positions among Agricultural Cooperative Organizations in Greece.',
        p3: 'Key functions of the Cooperative include the collection, transport and promotion to domestic and foreign markets of all agricultural products of the region.',
        p4: 'The primary role of the Cooperative is to support the production process, equipped with the right personnel and technical infrastructure. Flexibility and speed are the core philosophy and practice of the Agricultural Cooperative of Pella.',
        reg: 'Registry No.: 0204017',
        highlightsTitle: '🌿 Seasonal Products',
        newsletterTitle: 'Stay informed',
        newsletterSub: 'Subscribe for news, seasonal products and announcements.',
        newsletterPlaceholder: 'Your email...',
        newsletterBtn: 'Subscribe',
        footerText: 'Agricultural Cooperative of Pella',
        editBar: 'Click any text to edit it',
        egkLabel: 'Our facilities',
        egkTitle: 'Facilities',
        egkIntro: 'Modern packaging and storage facilities in the heart of Pella.',
        pistLabel: 'Recognition',
        pistTitle: 'Certifications & Awards',
        pistIntro: 'Certifications guaranteeing safe and responsible production.',
        pistBtn: '+ Add certification',
        gallLabel: 'Images',
        gallTitle: 'Photo Gallery',
        gallIntro: 'Click any cell to upload a photo.',
        gallBtn: '+ Add photo',
        annLabel: 'News & Updates',
        annTitle: 'Announcements',
        annBtn: '+ New announcement',
        annEmpty: 'No announcements yet.',
        contactLabel: 'Contact',
        contactTitle: 'Get in touch',
        contactIntro: 'For orders, partnerships or any question, we are here.',
        contactAddr: 'Giannitsa, Pella 58100',
        contactPhone: '+30 23820 00000',
        contactEmail: 'info@acpella.gr',
        contactHours: 'Mon–Fri, 08:00–16:00',
        contactNameLabel: 'Name', contactNamePh: 'Your name',
        contactEmailLabel: 'Email', contactEmailPh: 'email@example.com',
        contactMsgLabel: 'Message', contactMsgPh: 'How can we help you?',
        contactSend: 'Send',
        whyLabel: 'Why choose us',
        whyTitle: 'Our difference',
        whyC1Title: '95 Years of Experience', whyC1Desc: 'Since 1928 at the farmer\'s side. We know the land, the products and the market needs.',
        whyC2Title: 'Certified Quality', whyC2Desc: 'We hold IFS Food, FSSC 22000 and ISO 22000 — the strictest international food safety certifications.',
        whyC3Title: '600+ Active Members', whyC3Desc: 'United producers, greater strength. The cooperative ensures fair prices and better conditions.',
        whyC4Title: 'Direct Distribution', whyC4Desc: 'From field to market without intermediaries. Fresh products to domestic and international markets.',
        labelAddr: 'Address', labelPhone: 'Phone', labelHours: 'Hours',
        seasonals: [
          { name: 'Peaches', season: 'July – August', desc: 'Juicy, straight from the orchard' },
          { name: 'Cherries', season: 'May – June', desc: 'Sweet-sour, hand-picked' },
          { name: 'Apples', season: 'September – November', desc: 'Fuji & Golden, crispy' },
          { name: 'Strawberries', season: 'April – May', desc: 'Aromatic, natural cultivation' },
          { name: 'Pears', season: 'August – October', desc: 'Honey-sweet, tree-ripened' },
        ],
      }
    };

export function setLang(lang) {
      currentLang = lang;
      const t = translations[lang];

      document.getElementById('btn-el').classList.toggle('active', lang === 'el');
      document.getElementById('btn-en').classList.toggle('active', lang === 'en');


      // Universal translator - all elements with data-el/data-en
      document.querySelectorAll('[data-el]').forEach(el => {
        el.innerHTML = lang === 'en' ? (el.dataset.en || el.dataset.el) : el.dataset.el;
      });
      // Translate placeholders
      document.querySelectorAll('[data-ph-el]').forEach(el => {
        el.placeholder = lang === 'en' ? (el.dataset.phEn || el.dataset.phEl) : el.dataset.phEl;
      });

      // Nav
      ['egk','pist','gallery','ann','contact'].forEach(id => {
        const el = document.getElementById('nav-' + id);
        if (el) el.innerHTML = t['nav-' + id];
      });

      // Hero
      const eyebrow = document.querySelector('.hero-eyebrow');
      if (eyebrow) eyebrow.textContent = t.heroEyebrow;
      const title = document.querySelector('.hero-title');
      if (title) title.innerHTML = t.heroTitle;

      // Sidebar
      const sHeadings = document.querySelectorAll('.sidebar-heading');
      if (sHeadings[0]) sHeadings[0].textContent = t.sidebarProducts;
      if (sHeadings[1]) sHeadings[1].textContent = t.sidebarNews;
      const sLinks = document.querySelectorAll('.sidebar-list:not(.sidebar-news) li a');
      if (sLinks[0]) sLinks[0].textContent = t.sidebarFresh;
      if (sLinks[1]) sLinks[1].textContent = t.sidebarCanned;
      if (sLinks[2]) sLinks[2].textContent = t.sidebarPuree;
      const newsLink = document.querySelector('.sidebar-news li a');
      if (newsLink) newsLink.textContent = t.sidebarNewsLink;

      // Home paragraphs
      const paras = document.querySelectorAll('.home-text p:not(.home-reg)');
      if (paras[0]) paras[0].innerHTML = t.p1;
      if (paras[1]) paras[1].innerHTML = t.p2;
      if (paras[2]) paras[2].innerHTML = t.p3;
      if (paras[3]) paras[3].innerHTML = t.p4;
      const reg = document.querySelector('.home-reg');
      if (reg) reg.textContent = t.reg;

      // Highlights
      const hTitle = document.querySelector('.highlights-heading');
      if (hTitle) hTitle.textContent = t.highlightsTitle;

      // Newsletter
      const nTitle = document.querySelector('.newsletter-title');
      if (nTitle) nTitle.textContent = t.newsletterTitle;
      const nSub = document.querySelector('.newsletter-sub');
      if (nSub) nSub.textContent = t.newsletterSub;
      const ni = document.getElementById('newsletterEmail');
      if (ni) ni.placeholder = t.newsletterPlaceholder;
      const nBtn = document.querySelector('.newsletter-btn');
      if (nBtn) nBtn.textContent = t.newsletterBtn;

      // Footer
      const fSpan = document.querySelector('.home-footer footer span:last-child');
      if (fSpan) fSpan.textContent = t.footerText;

      // Edit bar
      const eb = document.getElementById('editBar');
      if (eb) {
        const dot = eb.querySelector('.edit-dot').outerHTML;
        eb.innerHTML = dot + ' ' + t.editBar;
      }

      // Inner pages
      const egkLabel = document.querySelector('#page-egk .section-label');
      const egkTitle = document.querySelector('#page-egk .section-title');
      const egkIntro = document.querySelector('#page-egk .section-intro');
      if (egkLabel) egkLabel.textContent = t.egkLabel;
      if (egkTitle) egkTitle.textContent = t.egkTitle;
      if (egkIntro) egkIntro.textContent = t.egkIntro;

      const pistLabel = document.querySelector('#page-pist .section-label');
      const pistTitle = document.querySelector('#page-pist .section-title');
      const pistIntro = document.querySelector('#page-pist .section-intro');
      if (pistLabel) pistLabel.textContent = t.pistLabel;
      if (pistTitle) pistTitle.textContent = t.pistTitle;
      if (pistIntro) pistIntro.textContent = t.pistIntro;

      const gallLabel = document.querySelector('#page-gallery .section-label');
      const gallTitle = document.querySelector('#page-gallery .section-title');
      const gallIntro = document.querySelector('#page-gallery .section-intro');
      if (gallLabel) gallLabel.textContent = t.gallLabel;
      if (gallTitle) gallTitle.textContent = t.gallTitle;
      if (gallIntro) gallIntro.textContent = t.gallIntro;

      const annLabel = document.querySelector('#page-ann .section-label');
      const annTitle = document.querySelector('#page-ann .section-title');
      const annBtn = document.querySelector('#page-ann .btn-primary');
      if (annLabel) annLabel.textContent = t.annLabel;
      if (annTitle) annTitle.textContent = t.annTitle;
      if (annBtn) annBtn.textContent = t.annBtn;
      const annEmpty = document.getElementById('annEmpty');
      if (annEmpty) annEmpty.textContent = t.annEmpty;

      const contactLabel = document.querySelector('#page-contact .section-label');
      const contactTitle = document.querySelector('#page-contact .section-title');
      if (contactLabel) contactLabel.textContent = t.contactLabel;
      if (contactTitle) contactTitle.textContent = t.contactTitle;
      const contactIntro = document.querySelector('.contact-info > p');
      if (contactIntro) contactIntro.textContent = t.contactIntro;

      const labels = document.querySelectorAll('.contact-row .label');
      const values = document.querySelectorAll('.contact-row span:last-child');
      if (labels[0]) labels[0].textContent = t.labelAddr;
      if (labels[1]) labels[1].textContent = t.labelPhone;
      if (labels[2]) labels[2].textContent = 'Email';
      if (labels[3]) labels[3].textContent = t.labelHours;
      if (values[0]) values[0].textContent = t.contactAddr;
      if (values[1]) values[1].textContent = t.contactPhone;
      if (values[2]) values[2].textContent = t.contactEmail;
      if (values[3]) values[3].textContent = t.contactHours;

      const formLabels = document.querySelectorAll('.contact-form .form-field label');
      const formInputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
      if (formLabels[0]) formLabels[0].textContent = t.contactNameLabel;
      if (formLabels[1]) formLabels[1].textContent = t.contactEmailLabel;
      if (formLabels[2]) formLabels[2].textContent = t.contactMsgLabel;
      if (formInputs[0]) formInputs[0].placeholder = t.contactNamePh;
      if (formInputs[1]) formInputs[1].placeholder = t.contactEmailPh;
      if (formInputs[2]) formInputs[2].placeholder = t.contactMsgPh;
      const sendBtn = document.querySelector('.contact-form .btn-primary');
      if (sendBtn) sendBtn.textContent = t.contactSend;

      // Seasonal products
      t.seasonals.forEach((s, i) => {
        const n = i + 1;
        const nameEl = document.getElementById(`s${n}-name`);
        const seasonEl = document.getElementById(`s${n}-season`);
        const descEl = document.getElementById(`s${n}-desc`);
        if (nameEl) nameEl.textContent = s.name;
        if (seasonEl) seasonEl.textContent = s.season;
        if (descEl) descEl.textContent = s.desc;
      });

      // Why us section
      const whyLabel = document.getElementById('why-label');
      const whyTitle = document.getElementById('why-title');
      if (whyLabel) whyLabel.textContent = t.whyLabel;
      if (whyTitle) whyTitle.textContent = t.whyTitle;
      [['why-c1','whyC1'],['why-c2','whyC2'],['why-c3','whyC3'],['why-c4','whyC4']].forEach(([id, key]) => {
        const titleEl = document.getElementById(id + '-title');
        const descEl = document.getElementById(id + '-desc');
        if (titleEl) titleEl.textContent = t[key + 'Title'];
        if (descEl) descEl.textContent = t[key + 'Desc'];
      });

      // All footers
      document.querySelectorAll('footer').forEach(f => {
        const span = f.querySelector('span:last-child');
        if (span && span.textContent !== 'A.C. Pella') span.textContent = t.footerText;
      });
    }

    /* ── NEWSLETTER ── */
    /* ── GALLERY FILTER ── */
export function filterGallery(cat, btn) {
      document.querySelectorAll('.gallery-tag').forEach(t => t.classList.remove('active-tag'));
      btn.classList.add('active-tag');
      document.querySelectorAll('.gallery-cell').forEach(cell => {
        if (cat === 'all' || cell.dataset.cat === cat) {
          cell.style.display = '';
        } else {
          cell.style.display = 'none';
        }
      });
    }

export function addLabel(input) {
      const f = input.files[0]; if (!f) return;
      const url = URL.createObjectURL(f);
      const grid = document.querySelector('.label-grid');
      const empty = document.querySelector('.label-card-empty');
      const newCard = document.createElement('div');
      newCard.className = 'label-card';
      newCard.innerHTML = `
        <div class="label-img-wrap"><img src="${url}" style="width:100%;height:auto;display:block;border-radius:4px;"/></div>
        <div class="label-info">
          <h4 class="label-name" contenteditable="false" data-editable="true" data-ck="ck20">Νέα Ετικέτα</h4>
          <p class="label-desc" contenteditable="false" data-editable="true" data-ck="ck21">Κλικ για επεξεργασία περιγραφής...</p>
        </div>`;
      grid.insertBefore(newCard, empty);
    }
export function handleNewsletter(e) {
      e.preventDefault();
      const email = document.getElementById('newsletterEmail').value;
      alert(currentLang === 'el'
        ? `Ευχαριστούμε! Το ${email} προστέθηκε στη λίστα μας.`
        : `Thank you! ${email} has been added to our list.`);
      e.target.reset();
    }

export function handleSubmit(e) {
      e.preventDefault();
      alert('Το μήνυμά σας στάλθηκε! Θα επικοινωνήσουμε σύντομα.');
      e.target.reset();
    }

    /* Initial route from hash */
    const initHash = location.hash.replace('#','');
    if (pages.includes(initHash)) navigate(initHash);
  
  
  
  
