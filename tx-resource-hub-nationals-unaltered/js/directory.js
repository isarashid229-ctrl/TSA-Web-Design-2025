
const dirRoot = document.getElementById('directory');
const cardTpl = document.getElementById('resource-card');
const filters = document.getElementById('filters');
const resultsCount = document.getElementById('results-count');
const resetBtn = document.getElementById('reset-filters');
const activeFiltersEl = document.getElementById('active-filters');
const azEl = document.getElementById('az');

let DATA = [];
let typingTimer;

// load data
(async function init(){
  try {
    const res = await fetch('data/resources.json?ts=' + Date.now(), {cache:'no-store'});
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('resources.json must be an array');
    DATA = json;
    render();
  } catch (e) {
    console.error('Failed to load resources.json', e);
    dirRoot.innerHTML = `<article class="card"><h3>Could not load resources</h3><p class="muted">Check that <code>data/resources.json</code> is valid JSON and this site is served over HTTP(S).</p></article>`;
    resultsCount.textContent = '0 results';
  }
})();

function getFilters(){
  const fd = new FormData(filters);
  return {
    q: (fd.get('q')||'').toLowerCase().trim(),
    category: fd.get('category')||'',
    city: fd.get('city')||'',
    cost: fd.get('cost')||'',
    accessibility: fd.get('accessibility')||'',
    initial: (fd.get('initial')||'').toUpperCase(),
    sort: fd.get('sort')||'name-asc'
  };
}

function showActivePills(f){
  const esc=s=>String(s).replace(/[<>&"']/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[m]));
  const pills=[];
  if (f.q) pills.push(`<span class="pill">Search: ${esc(f.q)}</span>`);
  if (f.category) pills.push(`<span class="pill">Category: ${esc(f.category)}</span>`);
  if (f.city) pills.push(`<span class="pill">Region: ${esc(f.city)}</span>`);
  if (f.cost) pills.push(`<span class="pill">Cost: ${esc(f.cost)}</span>`);
  if (f.accessibility) pills.push(`<span class="pill">Access: ${esc(f.accessibility)}</span>`);
  if (f.initial) pills.push(`<span class="pill">A–Z: ${esc(f.initial)}</span>`);
  activeFiltersEl.innerHTML = pills.join(' ');
}

function applyFilters(items,f){
  let out = items.filter(r=>{
    const name=(r.name||''); const desc=(r.description||''); const tags=Array.isArray(r.tags)?r.tags.join(' '):'';
    const rCity=(r.city||'');
    const k = f.q ? (name.toLowerCase().includes(f.q) || desc.toLowerCase().includes(f.q) || tags.toLowerCase().includes(f.q)) : true;
    const c = f.category ? r.category === f.category : true;
    const cost = f.cost ? r.cost === f.cost : true;
    const a = f.accessibility ? (r.accessibility||[]).includes(f.accessibility) : true;
    const city = f.city ? rCity === f.city : true;
    const letter = f.initial ? (name[0]||'').toUpperCase() === f.initial : true;
    return k && c && cost && a && city && letter;
  });
  switch (f.sort){
    case 'name-desc': out.sort((a,b)=>b.name.localeCompare(a.name));break;
    case 'city-asc': out.sort((a,b)=> (a.city||'').localeCompare(b.city||''));break;
    case 'city-desc': out.sort((a,b)=> (b.city||'').localeCompare(a.city||''));break;
    case 'category-asc': out.sort((a,b)=> (a.category||'').localeCompare(b.category||''));break;
    case 'updated-desc': out.sort((a,b)=> new Date(b.updated) - new Date(a.updated));break;
    default: out.sort((a,b)=>a.name.localeCompare(b.name));
  }
  return out;
}

function render(){
  const f=getFilters();
  showActivePills(f);
  const items=applyFilters(DATA,f);
  dirRoot.innerHTML='';
  resultsCount.textContent = `${items.length} result${items.length!==1?'s':''}`;

  if(items.length===0){
    dirRoot.innerHTML=`<article class="card"><h3>No results</h3><p class="muted">Try clearing filters or using a different keyword.</p></article>`;
    return;
  }

  for(const r of items){
    const node=cardTpl.content.cloneNode(true);
    const name=r.name||'Untitled';
    const logoWrap=node.querySelector('.rc-logo-wrap');
    if(r.logo){
      const img=new Image(); img.className='rc-logo'; img.src=r.logo; img.alt=name+' logo'; img.loading='lazy'; logoWrap.appendChild(img);
    }
    const titleEl=node.querySelector('.rc-title');
    if(r.url && r.url!=='#') titleEl.innerHTML=`<a class="card-link" href="${r.url}" target="_blank" rel="noopener noreferrer nofollow">${name}</a>`;
    else titleEl.textContent=name;
    const bits=[]; if(r.city) bits.push(r.city); if(r.category) bits.push(r.category); if(r.cost) bits.push(r.cost);
    if(r.updated){const d=new Date(r.updated); if(!isNaN(d)) bits.push('updated '+d.toLocaleDateString())}
    node.querySelector('.rc-meta').textContent=bits.join(' • ');
    node.querySelector('.rc-desc').textContent=r.description||'';
    node.querySelector('.rc-tags').textContent=(r.tags||[]).map(t=>`#${t}`).join(' ');
    const link=node.querySelector('a.btn');
    if(r.url && r.url!=='#'){ link.href=r.url; link.style.display='inline-flex'; } else { link.style.display='none'; }
    dirRoot.appendChild(node);
  }
}

filters?.addEventListener('input',(ev)=>{ clearTimeout(typingTimer); if(ev.target.tagName==='SELECT') return render(); typingTimer=setTimeout(render,160); });
resetBtn?.addEventListener('click',()=>{ filters.reset(); document.getElementById('initial').value=''; document.querySelectorAll('#az button').forEach(b=>b.classList.toggle('active',!b.dataset.initial)); render(); });
document.getElementById('az')?.addEventListener('click',(ev)=>{ const b=ev.target.closest('button[data-initial]'); if(!b) return; document.querySelectorAll('#az button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); filters.querySelector('[name="initial"]').value=b.dataset.initial||''; render(); });
document.addEventListener('click',(e)=>{ const a=e.target.closest('a[href^="http"]'); if(!a) return; a.setAttribute('target','_blank'); a.setAttribute('rel','noopener'); });
