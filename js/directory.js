const dirRoot = document.getElementById('directory');
const cardTpl = document.getElementById('resource-card');
const filters = document.getElementById('filters');
const resultsCount = document.getElementById('results-count');
const resetBtn = document.getElementById('reset-filters');
const activeFiltersEl = document.getElementById('active-filters');

let DATA = [];
let typingTimer;

// Load data
(async function init(){
  try {
    const res = await fetch('data/resources.json?ts=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('resources.json must be an array');
    DATA = json;
    render();
  } catch (e) {
    console.error('Failed to load resources.json', e);
    dirRoot.innerHTML = `
      <article class="card">
        <h3>Could not load resources</h3>
        <p class="card-desc">Check that <code>data/resources.json</code> is valid JSON (no trailing commas) and that Live Server is running.</p>
      </article>`;
    resultsCount.textContent = '0 results';
  }
})();

function getFilters() {
  const fd = new FormData(filters);
  return {
    q: (fd.get('q') || '').toLowerCase().trim(),
    category: fd.get('category') || '',
    cost: fd.get('cost') || '',
    accessibility: fd.get('accessibility') || '',
    city: fd.get('city') || '',
    initial: (fd.get('initial') || '').toUpperCase(),
    sort: fd.get('sort') || 'name-asc'
  };
}

function showActivePills(f){
  const pills = [];
  if (f.city) pills.push(`<span class="pill">City: ${f.city}</span>`);
  if (f.category) pills.push(`<span class="pill">Category: ${f.category}</span>`);
  if (f.cost) pills.push(`<span class="pill">Cost: ${f.cost}</span>`);
  if (f.accessibility) pills.push(`<span class="pill">Access: ${f.accessibility}</span>`);
  if (f.initial) pills.push(`<span class="pill">A–Z: ${f.initial}</span>`);
  if (activeFiltersEl) activeFiltersEl.innerHTML = pills.join(' ');
}

function applyFilters(items, f) {
  let out = items.filter(r => {
    const name = (r.name || '');
    const desc = (r.description || '');
    const tags = (r.tags || []).join(' ');
    const rCity = (r.city || '');

    const k = f.q ? (
      name.toLowerCase().includes(f.q) ||
      desc.toLowerCase().includes(f.q) ||
      tags.toLowerCase().includes(f.q)
    ) : true;

    const c = f.category ? r.category === f.category : true;
    const cost = f.cost ? r.cost === f.cost : true;
    const a = f.accessibility ? (r.accessibility || []).includes(f.accessibility) : true;
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

function render(){
  const f = getFilters();
  showActivePills(f);
  const items = applyFilters(DATA, f);
  dirRoot.innerHTML = '';

  resultsCount.textContent = `${items.length} result${items.length !== 1 ? 's' : ''}`;

  if (items.length === 0) {
    dirRoot.innerHTML = `
      <article class="card fade-in">
        <h3>No results</h3>
        <p class="card-desc">Try clearing filters or using a different keyword.</p>
      </article>`;
    return;
  }

  for (const r of items) {
    const node = cardTpl.content.cloneNode(true);
    const name = r.name || 'Untitled';
    
    // Add logo if available
    const logoContainer = node.querySelector('.card-logo-container');
    if (r.logo && r.logo.trim()) {
      const img = document.createElement('img');
      img.className = 'card-logo';
      img.src = r.logo;
      img.alt = `${name} logo`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 96;
      img.height = 96;
      logoContainer.appendChild(img);
    } else {
      logoContainer.parentNode.classList.add('no-logo');
    }
    
    // Make title clickable if URL exists
    const titleEl = node.querySelector('.card-title');
    if (r.url && r.url !== '#') {
      titleEl.innerHTML = `<a class="card-link" href="${r.url}" target="_blank" rel="noopener noreferrer nofollow" aria-label="Open ${name} website">${name}</a>`;
    } else {
      titleEl.textContent = name;
    }

    // Build meta information
    const bits = [];
    if (r.city) bits.push(r.city);
    if (r.category) bits.push(r.category);
    if (r.cost) bits.push(r.cost);
    if (r.updated) {
      const d = new Date(r.updated);
      if (!isNaN(d)) bits.push('updated ' + d.toLocaleDateString());
    }
    node.querySelector('.card-meta').textContent = bits.join(' • ');
    node.querySelector('.card-desc').textContent = r.description || '';
    node.querySelector('.card-tags').textContent = (r.tags || []).map(t => `#${t}`).join(' ');
    
    // Handle visit button
    const link = node.querySelector('a.btn');
    if (r.url && r.url !== '#') {
      link.href = r.url;
      link.setAttribute('aria-label', `Visit ${name} website`);
      link.style.display = 'inline-flex';
    } else {
      link.style.display = 'none';
    }

    dirRoot.appendChild(node);
  }
}

filters?.addEventListener('input', (ev)=>{
  clearTimeout(typingTimer);
  if (ev.target.tagName === 'SELECT') return render();
  typingTimer = setTimeout(render, 160);
});

resetBtn?.addEventListener('click', ()=>{
  filters.reset();
  render();
});

// Make entire card clickable (delegated click handler)
dirRoot?.addEventListener('click', (ev) => {
  const card = ev.target.closest('.card');
  if (!card) return;
  
  const link = card.querySelector('.card-link');
  const interactive = ev.target.closest('a, button, select, input, textarea, label');
  
  if (link && !interactive) {
    link.click();
  }
});

// Keyboard support for card navigation
dirRoot?.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') {
    const card = ev.target.closest('.card');
    if (!card) return;
    
    const link = card.querySelector('.card-link');
    if (link) {
      link.click();
    }
  }
});