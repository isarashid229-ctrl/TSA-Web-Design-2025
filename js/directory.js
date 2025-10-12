/* ========= Texas Resource Hub — Directory Controller (with URL fallback) ========= */
(function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function boot() {
    const dirRoot = document.getElementById('directory');
    const cardTpl = document.getElementById('resource-card');
    const filters = document.getElementById('filters');
    const resultsCount = document.getElementById('results-count');
    const resetBtn = document.getElementById('reset-filters');
    const activeFiltersEl = document.getElementById('active-filters');

    if (!dirRoot) {
      console.warn('[directory.js] #directory not found on this page.');
      return;
    }

    let DATA = [];
    let typingTimer;

    const PRESET_MAP = {
      'spanish-clinics':       { q: 'spanish clinic es', category: 'Health' },
      'spanish-hotlines':      { q: 'spanish hotline es', category: 'Mental Health' },
      'spanish-legal':         { q: 'spanish legal aid es', category: 'Legal' },
      'spanish-food':          { q: 'spanish food pantry', category: 'Food' },
      'spanish-housing':       { q: 'spanish housing', category: 'Housing' },

      'free-clinics':          { q: 'free clinic', category: 'Health', cost: 'Free' },
      'free-counseling':       { q: 'free counseling', category: 'Mental Health', cost: 'Free' },
      'free-meals':            { q: 'free meal pantry', category: 'Food', cost: 'Free' },
      'free-legal-aid':        { q: 'free legal aid', category: 'Legal', cost: 'Free' },
      'free-job-training':     { q: 'free job training', category: 'Education', cost: 'Free' },

      'north-food-banks':      { q: 'food bank', category: 'Food', city: 'North Texas' },
      'north-rent-help':       { q: 'rent help', category: 'Housing', city: 'North Texas' },
      'north-mental-health':   { q: 'counseling', category: 'Mental Health', city: 'North Texas' },
      'north-legal-aid':       { q: 'legal aid', category: 'Legal', city: 'North Texas' },
      'north-transportation':  { q: 'transport', category: 'Transportation', city: 'North Texas' },

      'central-food-banks':    { q: 'food bank', category: 'Food', city: 'Central Texas' },
      'central-rent-help':     { q: 'rent help', category: 'Housing', city: 'Central Texas' },
      'central-mental-health': { q: 'counseling', category: 'Mental Health', city: 'Central Texas' },
      'central-legal-aid':     { q: 'legal aid', category: 'Legal', city: 'Central Texas' },
      'central-transportation':{ q: 'transport', category: 'Transportation', city: 'Central Texas' },

      'south-food-banks':      { q: 'food bank', category: 'Food', city: 'South Texas' },
      'south-rent-help':       { q: 'rent help', category: 'Housing', city: 'South Texas' },
      'south-mental-health':   { q: 'counseling', category: 'Mental Health', city: 'South Texas' },
      'south-legal-aid':       { q: 'legal aid', category: 'Legal', city: 'South Texas' },
      'south-transportation':  { q: 'transport', category: 'Transportation', city: 'South Texas' },

      'austin-food':           { q: 'food', category: 'Food', city: 'Austin' },
      'austin-housing':        { q: 'housing', category: 'Housing', city: 'Austin' },
      'austin-mental-health':  { q: 'counseling', category: 'Mental Health', city: 'Austin' },
      'austin-job-centers':    { q: 'job center', category: 'Employment', city: 'Austin' },
      'austin-legal-aid':      { q: 'legal aid', category: 'Legal', city: 'Austin' },

      'dallas-food':           { q: 'food', category: 'Food', city: 'Dallas' },
      'dallas-housing':        { q: 'housing', category: 'Housing', city: 'Dallas' },
      'dallas-mental-health':  { q: 'counseling', category: 'Mental Health', city: 'Dallas' },
      'dallas-job-centers':    { q: 'job center', category: 'Employment', city: 'Dallas' },
      'dallas-legal-aid':      { q: 'legal aid', category: 'Legal', city: 'Dallas' },

      'san-antonio-food':      { q: 'food', category: 'Food', city: 'San Antonio' },
      'san-antonio-housing':   { q: 'housing', category: 'Housing', city: 'San Antonio' },
      'san-antonio-mental-health': { q: 'counseling', category: 'Mental Health', city: 'San Antonio' },
      'san-antonio-job-centers':   { q: 'job center', category: 'Employment', city: 'San Antonio' },
      'san-antonio-legal-aid': { q: 'legal aid', category: 'Legal', city: 'San Antonio' },

      'houston-food':          { q: 'food', category: 'Food', city: 'Houston' },
      'houston-housing':       { q: 'housing', category: 'Housing', city: 'Houston' },
      'houston-mental-health': { q: 'counseling', category: 'Mental Health', city: 'Houston' },
      'houston-job-centers':   { q: 'job center', category: 'Employment', city: 'Houston' },
      'houston-legal-aid':     { q: 'legal aid', category: 'Legal', city: 'Houston' },

      'fort-worth-food':       { q: 'food', category: 'Food', city: 'Fort Worth' },
      'fort-worth-housing':    { q: 'housing', category: 'Housing', city: 'Fort Worth' },
      'fort-worth-mental-health': { q: 'counseling', category: 'Mental Health', city: 'Fort Worth' },
      'fort-worth-job-centers':   { q: 'job center', category: 'Employment', city: 'Fort Worth' },
      'fort-worth-legal-aid':  { q: 'legal aid', category: 'Legal', city: 'Fort Worth' },

      'el-paso-food':          { q: 'food', category: 'Food', city: 'El Paso' },
      'el-paso-housing':       { q: 'housing', category: 'Housing', city: 'El Paso' },
      'el-paso-mental-health': { q: 'counseling', category: 'Mental Health', city: 'El Paso' },
      'el-paso-job-centers':   { q: 'job center', category: 'Employment', city: 'El Paso' },
      'el-paso-legal-aid':     { q: 'legal aid', category: 'Legal', city: 'El Paso' },

      'ged-prep':              { q: 'ged', category: 'Education' },
      'esl-classes':           { q: 'esl english', category: 'Education' },
      'job-certificates':      { q: 'certificate', category: 'Education' },
      'college-aid':           { q: 'college aid', category: 'Education' },
      'apprenticeships':       { q: 'apprentice', category: 'Education' },

      'tenant-rights':         { q: 'tenant rights', category: 'Legal' },
      'immigration-help':      { q: 'immigration', category: 'Legal' },
      'record-clearing':       { q: 'expunction record clearing', category: 'Legal' },
      'consumer-protection':   { q: 'consumer protection', category: 'Legal' },
      'family-law':            { q: 'family law', category: 'Legal' },

      'childcare':             { q: 'childcare', category: 'Family' },
      'after-school':          { q: 'after school', category: 'Family' },
      'diaper-banks':          { q: 'diaper', category: 'Family' },
      'parenting-classes':     { q: 'parenting', category: 'Family' },
      'youth-jobs':            { q: 'youth jobs', category: 'Employment' },

      'utility-bill-help':     { q: 'utility bill', category: 'Utilities' },
      'low-cost-internet':     { q: 'internet', category: 'Utilities' },
      'discount-phone':        { q: 'phone', category: 'Utilities' },
      'bus-passes':            { q: 'bus pass', category: 'Transportation' },
      'gas-vouchers':          { q: 'gas voucher', category: 'Transportation' },
    };

    (async function init() {
      try {
        const res = await fetch('data/resources.json?ts=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        try {
          DATA = JSON.parse(text);
        } catch (e) {
          return showLoadError('JSON parse error in <code>data/resources.json</code>.');
        }
        if (!Array.isArray(DATA)) {
          return showLoadError('<code>data/resources.json</code> must be an array.');
        }

        const url = new URL(window.location.href);
        const key = (url.searchParams.get('key') || '').trim();
        if (key && PRESET_MAP[key]) {
          applyPreset(key, { pushState: false });
          scrollToDirectory();
        } else {
          render();
        }
      } catch (e) {
        console.error(e);
        showLoadError('Could not load <code>data/resources.json</code>.');
      }
    })();

    /* ---------- Helpers ---------- */
    function showLoadError(msgHtml) {
      dirRoot.innerHTML = `
        <article class="card">
          <h3>Could not load resources</h3>
          <p class="card-desc">${msgHtml}</p>
        </article>`;
      if (resultsCount) resultsCount.textContent = '0 results';
    }

    function getFilters() {
      if (!filters) return { q:'', category:'', cost:'', accessibility:'', city:'', initial:'', sort:'name-asc' };
      let fd;
      try { fd = new FormData(filters); } catch { fd = new Map(); }
      const get = (n) => (fd.get ? fd.get(n) : document.querySelector(`[name="${n}"]`)?.value) || '';
      return {
        q: get('q').toLowerCase().trim(),
        category: get('category'),
        cost: get('cost'),
        accessibility: get('accessibility'),
        city: get('city'),
        initial: get('initial').toUpperCase(),
        sort: get('sort') || 'name-asc'
      };
    }

    function setFilters(partial) {
      if (!filters) return;
      const setIf = (name, val) => {
        const el = filters.querySelector(`[name="${name}"]`) || document.querySelector(`[name="${name}"]`);
        if (el != null && val !== undefined) el.value = val;
      };
      setIf('q', partial.q || '');
      setIf('category', partial.category || '');
      setIf('cost', partial.cost || '');
      setIf('accessibility', partial.accessibility || '');
      setIf('city', partial.city || '');
      setIf('initial', partial.initial || '');
      if (partial.sort !== undefined) setIf('sort', partial.sort || 'name-asc');
    }

    function showActivePills(f) {
      if (!activeFiltersEl) return;
      const esc = (s='') => s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
      const pills = [];
      if (f.q) pills.push(`<span class="pill">Search: ${esc(f.q)}</span>`);
      if (f.city) pills.push(`<span class="pill">City: ${esc(f.city)}</span>`);
      if (f.category) pills.push(`<span class="pill">Category: ${esc(f.category)}</span>`);
      if (f.cost) pills.push(`<span class="pill">Cost: ${esc(f.cost)}</span>`);
      if (f.accessibility) pills.push(`<span class="pill">Access: ${esc(f.accessibility)}</span>`);
      if (f.initial) pills.push(`<span class="pill">A–Z: ${esc(f.initial)}</span>`);
      activeFiltersEl.innerHTML = pills.join(' ');
    }

    function applyFilters(items, f) {
      let out = items.filter(r => {
        const name = (r.name || '');
        const desc = (r.description || '');
        const tags = Array.isArray(r.tags) ? r.tags.join(' ') : '';
        const rCity = (r.city || '');

        const k = f.q
          ? name.toLowerCase().includes(f.q) ||
            desc.toLowerCase().includes(f.q) ||
            tags.toLowerCase().includes(f.q)
          : true;

        const c = f.category ? (r.category || '') === f.category : true;
        const cost = f.cost ? (r.cost || '') === f.cost : true;
        const a = f.accessibility ? Array.isArray(r.accessibility) && r.accessibility.includes(f.accessibility) : true;
        const city = f.city ? rCity === f.city : true;
        const letter = f.initial ? (name[0] || '').toUpperCase() === f.initial : true;

        return k && c && cost && a && city && letter;
      });

      switch (f.sort) {
        case 'name-desc': out.sort((a,b)=>b.name.localeCompare(a.name)); break;
        case 'city-asc': out.sort((a,b)=> (a.city||'').localeCompare(b.city||'')); break;
        case 'city-desc': out.sort((a,b)=> (b.city||'').localeCompare(a.city||'')); break;
        case 'category-asc': out.sort((a,b)=> (a.category||'').localeCompare(b.category||'')); break;
        case 'updated-desc': out.sort((a,b)=> new Date(b.updated) - new Date(a.updated)); break;
        default: out.sort((a,b)=>a.name.localeCompare(b.name));
      }
      return out;
    }

    // ensure URLs always work
    function normalizeUrl(url) {
      if (!url || url === '#' || typeof url !== 'string') return '';
      const trimmed = url.trim();
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      if (/^\/\//.test(trimmed)) return 'https:' + trimmed;
      if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return 'https://' + trimmed;
      // anything else (relative etc.) treat as unusable
      return '';
    }

    function fallbackSearchUrl(r) {
      const q = [r.name, r.city, 'Texas', r.category].filter(Boolean).join(' ');
      return 'https://www.google.com/search?q=' + encodeURIComponent(q);
    }

    function externalUrlOrSearch(r) {
      const u = normalizeUrl(r.url);
      return u || fallbackSearchUrl(r);
    }

    function render() {
      const f = getFilters();
      showActivePills(f);
      const items = applyFilters(DATA, f);

      if (resultsCount) resultsCount.textContent = `${items.length} result${items.length !== 1 ? 's' : ''}`;
      dirRoot.innerHTML = '';

      if (!items.length) {
        dirRoot.innerHTML = `
          <article class="card fade-in">
            <h3>No results</h3>
            <p class="card-desc">Try clearing filters or using a different keyword.</p>
          </article>`;
        return;
      }

      for (const r of items) {
        if (!cardTpl || !cardTpl.content) {
          // safe fallback card
          const card = document.createElement('article');
          card.className = 'card';
          const name = r.name || 'Untitled';
          const url = externalUrlOrSearch(r);
          card.innerHTML = `
            <h3 class="card-title"><a class="card-link" href="${url}" target="_blank" rel="noopener noreferrer nofollow">${name}</a></h3>
            <p class="card-meta">${[r.city, r.category, r.cost].filter(Boolean).join(' • ')}</p>
            <p class="card-desc">${r.description || ''}</p>
            <a class="btn" href="${url}" target="_blank" rel="noopener">Visit</a>
          `;
          dirRoot.appendChild(card);
          continue;
        }

        const node = cardTpl.content.cloneNode(true);
        const name = r.name || 'Untitled';

        // Logo
        const logoContainer = node.querySelector('.card-logo-container');
        if (logoContainer && r.logo && String(r.logo).trim()) {
          const img = document.createElement('img');
          img.className = 'card-logo';
          img.src = r.logo;
          img.alt = `${name} logo`;
          img.loading = 'lazy';
          img.decoding = 'async';
          img.width = 96; img.height = 96;
          logoContainer.appendChild(img);
        } else {
          const wrap = logoContainer?.parentNode;
          if (wrap?.classList) wrap.classList.add('no-logo');
        }

        // Title (always points somewhere real)
        const titleEl = node.querySelector('.card-title');
        const url = externalUrlOrSearch(r);
        if (titleEl) {
          titleEl.innerHTML = `<a class="card-link" href="${url}" target="_blank" rel="noopener noreferrer nofollow" aria-label="Open ${name}">${name}</a>`;
        }

        // Meta
        const bits = [];
        if (r.city) bits.push(r.city);
        if (r.category) bits.push(r.category);
        if (r.cost) bits.push(r.cost);
        if (r.updated) {
          const d = new Date(r.updated);
          if (!isNaN(d)) bits.push('updated ' + d.toLocaleDateString());
        }
        const metaEl = node.querySelector('.card-meta');
        if (metaEl) metaEl.textContent = bits.join(' • ');

        // Desc + tags
        const descEl = node.querySelector('.card-desc'); if (descEl) descEl.textContent = r.description || '';
        const tagsEl = node.querySelector('.card-tags'); if (tagsEl) tagsEl.textContent = (r.tags || []).map(t => `#${t}`).join(' ');

        // Visit button (same URL as title)
        const btn = node.querySelector('a.btn');
        if (btn) {
          btn.href = url;
          btn.setAttribute('aria-label', `Visit ${name}`);
          btn.style.display = 'inline-flex';
        }

        dirRoot.appendChild(node);
      }
    }

    function scrollToDirectory() {
      const section = document.querySelector('#directory');
      if (!section) return;
      window.scrollTo({ top: section.getBoundingClientRect().top + window.pageYOffset - 72, behavior: 'smooth' });
    }

    function applyPreset(key, opts = { pushState: true }) {
      const preset = PRESET_MAP[key];
      if (!preset) return;
      setFilters({ q: preset.q ?? '', category: preset.category ?? '', cost: preset.cost ?? '',
                   accessibility: preset.accessibility ?? '', city: preset.city ?? '', initial: '' });
      if (opts.pushState) {
        const url = new URL(window.location.href);
        url.searchParams.set('key', key);
        try { window.history.pushState({ key }, '', url.toString()); } catch {}
      }
      render();
    }

    /* --------- Events ---------- */
    if (filters) {
      filters.addEventListener('input', (ev) => {
        clearTimeout(typingTimer);
        if (ev.target && ev.target.tagName === 'SELECT') render();
        else typingTimer = setTimeout(render, 160);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (filters && typeof filters.reset === 'function') filters.reset();
        const url = new URL(window.location.href);
        url.searchParams.delete('key');
        try { window.history.replaceState({}, '', url.toString()); } catch {}
        render();
      });
    }

    dirRoot.addEventListener('click', (ev) => {
      const card = ev.target.closest('.card');
      if (!card) return;
      const interactive = ev.target.closest('a, button, select, input, textarea, label, summary');
      if (interactive) return;
      const link = card.querySelector('.card-link');
      if (link) link.click();
    });

    dirRoot.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter') return;
      const card = ev.target.closest('.card');
      if (!card) return;
      const link = card.querySelector('.card-link');
      if (link) link.click();
    });

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href*="?key="]');
      if (!a) return;
      let u;
      try { u = new URL(a.getAttribute('href'), window.location.href); } catch { return; }
      const key = u.searchParams.get('key');
      if (key) {
        e.preventDefault();
        applyPreset(key);
        scrollToDirectory();
      }
    });

    window.addEventListener('popstate', () => {
      const url = new URL(window.location.href);
      const key = url.searchParams.get('key');
      if (key) applyPreset(key, { pushState: false });
      else render();
    });
  }
})();
