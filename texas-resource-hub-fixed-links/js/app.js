
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
navToggle?.addEventListener('click', ()=>nav.classList.toggle('open'));
document.querySelectorAll('[data-scroll]').forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href'); if(id && id.startsWith('#')){ e.preventDefault();
    const el=document.querySelector(id); if(el){ window.scrollTo({top:el.getBoundingClientRect().top+window.pageYOffset-72,behavior:'smooth'}); nav?.classList.remove('open'); }
  }
}));
let deferredPrompt=null;
const installBtn=document.getElementById('install-btn');
window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; installBtn.style.display='inline-flex'; });
installBtn?.addEventListener('click', async (e)=>{ e.preventDefault(); if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; installBtn.style.display='none'; });
if('serviceWorker' in navigator){ window.addEventListener('load', ()=>navigator.serviceWorker.register('service-worker.js')); }
