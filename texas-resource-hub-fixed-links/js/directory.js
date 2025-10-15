
const dirRoot = document.getElementById('directory-results');
const cardTpl = document.getElementById('resource-card');
const filters = document.getElementById('filters');
const resultsCount = document.getElementById('results-count');
const resetBtn = document.getElementById('reset-filters');
const activeFiltersEl = document.getElementById('active-filters');

let DATA = [];
let typingTimer;

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
    dirRoot.innerHTML = `<article class="card"><h3>Could not load resources</h3><p>Check data/resources.json.</p></article>`;
    resultsCount.textContent = '0 results';
  }
})();

function getFilters() {
  const fd = new FormData(filters);
  return {
    q: (fd.get('q') || '').toLowerCase().trim(),
    category: fd.get('category') || '',
    city: fd.get('city') || '',
    cost: fd.get('cost') || '',
    accessibility: fd.get('accessibility') || '',
    initial: (fd.get('initial') || '').toUpperCase(),
    sort: fd.get('sort') || 'name-asc'
  };
}
function showActivePills(f){
  const esc=s=>String(s).replace(/[&<>"]/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));
  const pills=[];
  if (f.q) pills.push(`<span class="pill">Search: ${esc(f.q)}</span>`);
  if (f.category) pills.push(`<span class="pill">Category: ${esc(f.category)}</span>`);
  if (f.city) pills.push(`<span class="pill">Region: ${esc(f.city)}</span>`);
  if (f.cost) pills.push(`<span class="pill">Cost: ${esc(f.cost)}</span>`);
  if (f.accessibility) pills.push(`<span class="pill">Access: ${esc(f.accessibility)}</span>`);
  if (f.initial) pills.push(`<span class="pill">A–Z: ${esc(f.initial)}</span>`);
  activeFiltersEl.innerHTML = pills.join(' ');
}
function applyFilters(items, f) {
  let out = items.filter(r => {
    const name = (r.name || '');
    const desc = (r.description || '');
    const tags = (r.tags || []).join(' ');
    const rCity = (r.city || '');

    const k = f.q ? (name.toLowerCase().includes(f.q) || desc.toLowerCase().includes(f.q) || tags.toLowerCase().includes(f.q)) : true;
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
    dirRoot.innerHTML = `<article class="card fade-in"><h3>No results</h3><p>Try clearing filters or another keyword.</p></article>`;
    return;
  }
  for (const r of items) {
    const node = cardTpl.content.cloneNode(true);
    const name = r.name || 'Untitled';
    node.querySelector('.card-logo-container').innerHTML = `<div class="placeholder-logo">${name.slice(0,2).toUpperCase()}</div>`;
    const title = node.querySelector('.card-title');
    title.innerHTML = r.url ? `<a class="card-link" href="${r.url}" target="_blank" rel="noopener noreferrer">${name}</a>` : name;
    const metaBits = [r.city||'Statewide', r.category||'', r.cost||''];
    if(r.updated) metaBits.push('updated '+new Date(r.updated).toLocaleDateString());
    node.querySelector('.card-meta').textContent = metaBits.filter(Boolean).join(' • ');
    node.querySelector('.card-desc').textContent = r.description || '';
    node.querySelector('.card-tags').textContent = (r.tags||[]).map(t=>`#${t}`).join(' ');
    const link = node.querySelector('a.btn'); if (r.url) { link.href = r.url; link.setAttribute('aria-label', `Visit ${name}`); }
    dirRoot.appendChild(node);
  }
}
filters?.addEventListener('input', (ev)=>{ clearTimeout(typingTimer); if (ev.target.tagName === 'SELECT') return render(); typingTimer = setTimeout(render, 160); });
resetBtn?.addEventListener('click', ()=>{ filters.reset(); render(); });
document.querySelectorAll('.az .chip').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const hidden = document.createElement('input'); hidden.type='hidden'; hidden.name='initial'; hidden.value = btn.dataset.initial || '';
    const old = filters.querySelector('input[name="initial"]'); old?.remove(); filters.appendChild(hidden); render();
  });
});
dirRoot?.addEventListener('click',(ev)=>{ const card=ev.target.closest('.card'); if(!card) return; const link=card.querySelector('.card-link'); const interactive=ev.target.closest('a,button,select,input,textarea,label'); if(link && !interactive) link.click(); });
dirRoot?.addEventListener('keydown',(ev)=>{ if(ev.key==='Enter'){ const card=ev.target.closest('.card'); if(!card) return; const link=card.querySelector('.card-link'); link?.click(); } });
