
(async () => {
  try {
    const res = await fetch('data/resources.json?ts=' + Date.now());
    if (!res.ok) throw new Error('Could not load resources.json');
    const data = await res.json();
    const unique = [...new Set(data.map(x => x.url).filter(Boolean))];
    const results = [];
    for (const u of unique) {
      try {
        const r = await fetch(u, { method:'HEAD', mode:'no-cors' });
        results.push({ url: u, ok: true });
      } catch (e) {
        results.push({ url: u, ok: false });
      }
    }
    const bad = results.filter(r => !r.ok);
    if (bad.length) {
      console.warn('Some URLs could not be verified from the browser due to CORS. Manually open these:');
      console.table(bad);
      alert(`${bad.length} URLs need manual check (see console).`);
    } else {
      alert(`All ${unique.length} URLs fetched OK (basic check).`);
    }
  } catch (err) {
    console.error(err);
    alert('Link check failed: ' + err.message);
  }
})();
