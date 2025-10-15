// Lightweight SW registrar for GitHub Pages subpaths
(function(){
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function(){
    var swUrl = './service-worker.js';
    navigator.serviceWorker.register(swUrl, { scope: './' }).catch(function(e){ console.error('SW register failed', e); });
  });
})();