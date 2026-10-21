/* About page — tiny section navigation controller; no dependencies. */
(() => {
  'use strict';
  const closeMenu = menu => { if (!menu) return; if(window.FFDropdowns) window.FFDropdowns.close(menu); else menu.open=false; };
  const nav = document.querySelector('#about-toolbar');
  const main = document.querySelector('.ff-about');
  if (!nav || !main) return;
  const anchors = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = [...main.querySelectorAll('.ff-about-content section[id]')];
  const menu = nav.querySelector('.mobile-contents');
  const progress = nav.querySelector('.ff-reading-progress');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const gap = 24;
  function offset() {
    const header = document.querySelector('.ff-site-header');
    return (header?.getBoundingClientRect().height || 70) + nav.getBoundingClientRect().height + gap;
  }
  nav.addEventListener('click', event => {
    const a = event.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    if(menu) closeMenu(menu);
    const top = target.getBoundingClientRect().top + window.scrollY - offset();
    window.scrollTo({top:Math.max(0,top),behavior:reduced.matches?'instant':'smooth'});
    history.replaceState(null,'','#'+id);
  });
  document.addEventListener('click', e => { if (menu?.open && !menu.contains(e.target)) closeMenu(menu); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu?.open) closeMenu(menu); });
  let requested = false;
  function update() {
    requested=false;
    const position=window.scrollY + offset() + 9;
    let current=null;
    for (const section of sections) {
      const start=section.getBoundingClientRect().top+window.scrollY;
      if (start<=position)current=section.id;
    }
    for (const a of anchors) {
      const isActive=a.getAttribute('href')==='#'+current;
      if (isActive) a.setAttribute('aria-current','location');
      else a.removeAttribute('aria-current');
    }
    if (progress) {
      const from=main.getBoundingClientRect().top+window.scrollY;
      const to=main.getBoundingClientRect().bottom+window.scrollY;
      const range=Math.max(1,to-from-innerHeight+offset());
      const val=Math.max(0,Math.min(1,(scrollY+offset()-from)/range));
      progress.style.transform=`scaleX(${val.toFixed(4)})`;
    }
  }
  function schedule(){if(!requested){requested=true;requestAnimationFrame(update)}}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  update();
})();
