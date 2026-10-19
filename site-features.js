/* Filmmic Foundations: tiny progressive-enhancement helpers (no libraries). */
(() => {
  // Search article cards by their visible title, description, and tags.
  const input = document.getElementById('article-search');
  if (input) {
    const cards = [...document.querySelectorAll('#article-results .entry')];
    const status = document.getElementById('search-status');
    const empty = document.getElementById('no-results');
    const clear = document.getElementById('clear-search');
    function filter() {
      const query = input.value.trim().toLocaleLowerCase();
      let shown = 0;
      for (const card of cards) {
        const matches = card.textContent.toLocaleLowerCase().includes(query);
        card.hidden = !matches;
        if (matches) shown++;
      }
      if (empty) empty.hidden = shown !== 0;
      if (clear) clear.hidden = !query;
      if (status) status.textContent = query ? `${shown} of ${cards.length} articles shown` : '';
    }
    input.addEventListener('input', filter);
    clear?.addEventListener('click', () => { input.value = ''; filter(); input.focus(); });
    filter();
  }
  // Close open menus when the user clicks outside or presses Escape.
  const menus = [...document.querySelectorAll('.site-nav details')];
  document.addEventListener('click', (event) => {
    for (const menu of menus) if (!menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') for (const menu of menus) menu.open = false;
  });
  // Account for the sticky header when following a local anchor link.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (event) => {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      const header = document.querySelector('.topbar');
      const offset = (header?.getBoundingClientRect().height ?? 0) + 18;
      window.scrollTo({top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth'});
      history.replaceState(null, '', `#${id}`);
      for (const menu of menus) menu.open = false;
    });
  });
})();
