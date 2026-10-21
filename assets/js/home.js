/* Filmmic Foundations · consolidated site behavior. No dependencies. */

/* site-features.js */
/* Filmmic Foundations: tiny progressive-enhancement helpers (no libraries). */
(() => {
  // Search, genre/year filters, sorting and four responsive layouts.
  const input = document.getElementById('article-search');
  const results = document.getElementById('article-results');
  if (input && results) {
    const cards = [...results.querySelectorAll('.archive-card')];
    const status = document.getElementById('search-status');
    const empty = document.getElementById('no-results');
    const clear = document.getElementById('clear-search');
    const genre = document.getElementById('filter-genre');
    const articleYear = document.getElementById('filter-article-year');
    const filmYear = document.getElementById('filter-film-year');
    const sort = document.getElementById('sort-articles');
    const defaultSort = document.documentElement.dataset.ffSort;
    if(sort && ['newest','oldest','az','za'].includes(defaultSort)) sort.value=defaultSort;
    const unique = (key) => [...new Set(cards.flatMap(c => (c.dataset[key] || '').split(',').map(v=>v.trim()).filter(Boolean)))];
    for (const value of unique('genre').sort()) genre?.add(new Option(value,value));
    for (const value of unique('articleYear').sort((a,b)=>b.localeCompare(a))) articleYear?.add(new Option(value,value));
    for (const value of unique('filmYear').sort((a,b)=>b.localeCompare(a))) filmYear?.add(new Option(value,value));
    const savedQuery = new URLSearchParams(location.search).get('q');
    if(savedQuery) input.value=savedQuery;
    let fullTextIndex = Object.create(null);
    fetch('search-index.json', {cache:'force-cache'}).then(response=>{if(!response.ok)throw Error('search unavailable');return response.json()}).then(data=>{fullTextIndex=data;update()}).catch(()=>{});
    function update() {
      const query = input.value.trim().toLocaleLowerCase();
      const ordered = [...cards].sort((a,b)=> {
        const byTitle=(a.dataset.title||'').localeCompare(b.dataset.title||'');
        const byDate=(a.dataset.date||a.dataset.year||'').localeCompare(b.dataset.date||b.dataset.year||'');
        return sort?.value==='az'?byTitle:sort?.value==='za'?-byTitle:sort?.value==='oldest'?byDate:-byDate;
      });
      let count=0;
      for (const card of ordered) {
        const text=[card.textContent,card.dataset.genre,card.dataset.articleYear,card.dataset.filmYear,card.dataset.tags,fullTextIndex[card.querySelector('[data-preview]')?.dataset.preview]||''].join(' ').toLocaleLowerCase();
        const matches=text.includes(query)&&(!genre?.value||(card.dataset.genre||'').split(',').includes(genre.value))&&(!articleYear?.value||card.dataset.articleYear===articleYear.value)&&(!filmYear?.value||card.dataset.filmYear===filmYear.value);
        card.hidden=!matches;if(matches)count++;
        results.append(card);
      }
      if(empty)empty.hidden=count>0;
      if(clear)clear.hidden=!query;
      if(status)status.textContent=`${count} of ${cards.length} articles`;
      refreshChips();
    }
    // Compact removable chips mirror active selections. The original form fields
    // remain the sole filtering state, so all reset, search, and sort behavior agrees.
    const chips=document.getElementById('ff-active-filter-chips');
    function refreshChips(){
      if(!chips)return;
      const active=[['Genre',genre],['Article',articleYear],['Film',filmYear]].filter(([,el])=>el?.value);
      chips.replaceChildren();chips.hidden=!active.length;
      for(const [title,select] of active){
        const chip=document.createElement('button');chip.type='button';chip.className='ff-filter-chip';
        chip.setAttribute('aria-label',`Remove ${title.toLowerCase()} filter: ${select.value}`);
        const label=document.createElement('span');label.textContent=`${title}: ${select.value}`;
        const x=document.createElement('span');x.className='ff-filter-chip-x';x.setAttribute('aria-hidden','true');x.textContent='×';
        chip.append(label,x);
        chip.addEventListener('click',()=>{
          if(chip.classList.contains('is-removing'))return;
          chip.classList.add('is-removing');chip.disabled=true;
          let dismissed=false;const finish=()=>{if(dismissed)return;dismissed=true;select.value='';select.dispatchEvent(new Event('change',{bubbles:true}));select.dispatchEvent(new Event('ff:refresh-choice'));};
          if(matchMedia('(prefers-reduced-motion: reduce)').matches)finish();
          else chip.addEventListener('transitionend',finish,{once:true});
          if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setTimeout(()=>{if(select.value)finish();},220);
        });
        chips.append(chip);
      }
    }
    // Keep filter controls tucked away, and show a small count when active.
    const activeCount=document.getElementById('active-filter-count');
    function refreshFilterCount(){
      const n=[genre,articleYear,filmYear].filter(el=>el?.value).length;
      refreshChips();
      if(activeCount){activeCount.hidden=n===0;activeCount.title=n?`${n} filter${n===1?'':'s'} active`:'';activeCount.parentElement?.classList.toggle('has-active-filters',n>0);activeCount.parentElement?.setAttribute('aria-label',n?`Show archive filters (${n} active)`:'Show archive filters')}
    }
    document.getElementById('reset-filters')?.addEventListener('click',()=>{
      [genre,articleYear,filmYear].forEach(el=>{if(el)el.value=''});
      if(sort)sort.value='newest';[genre,articleYear,filmYear,sort].forEach(el=>el?.dispatchEvent(new Event('ff:refresh-choice')));update();refreshFilterCount();
    });
    [genre,articleYear,filmYear].forEach(el=>el?.addEventListener('change',refreshFilterCount));
    refreshFilterCount();

    // Archive filter fields: one controller, one visual treatment.
    // Native selects remain the source of truth for search, reset and preferences.
    const choiceControllers=[];
    const reduceChoiceMotion=matchMedia('(prefers-reduced-motion: reduce)');
    for(const select of [genre,articleYear,filmYear,sort]){
      if(!select)continue;
      const wrapper=document.createElement('div');wrapper.className='ff-choice';
      const trigger=document.createElement('button');trigger.type='button';trigger.className='ff-choice-trigger';
      trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
      const menu=document.createElement('div');menu.className='ff-choice-menu';menu.setAttribute('role','listbox');menu.hidden=true;
      wrapper.append(trigger,menu);select.insertAdjacentElement('afterend',wrapper);select.classList.add('ff-native-select');
      const arrow=document.createElement('span');arrow.className='ff-choice-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='⌄';
      let opened=false,transition=null,closeTimer=null;
      function sync(){
        trigger.replaceChildren(document.createTextNode(select.selectedOptions[0]?.textContent||'Select'),arrow);
        for(const item of menu.querySelectorAll('[role="option"]')) item.setAttribute('aria-selected',String(item.dataset.value===select.value));
      }
      function setOpen(next){
        if(opened===next)return;opened=next;trigger.setAttribute('aria-expanded',String(next));
        clearTimeout(closeTimer);transition?.cancel();transition=null;
        if(next)menu.hidden=false;
        if(reduceChoiceMotion.matches){menu.hidden=!next;return;}
        transition=menu.animate(next?[
          {opacity:0,transform:'translateY(-5px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}
        ]:[{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(-4px) scale(.99)'}],
        {duration:next?210:125,easing:'cubic-bezier(.2,.75,.2,1)',fill:'both'});
        const current=transition;
        current.onfinish=()=>{if(transition!==current)return;transition=null;current.cancel();if(!opened)menu.hidden=true};
      }
      function close(){setOpen(false)}
      choiceControllers.push({close});
      for(const opt of select.options){
        const item=document.createElement('button');item.type='button';item.dataset.value=opt.value;
        item.setAttribute('role','option');item.textContent=opt.textContent;
        item.addEventListener('click',()=>{
          select.value=opt.value;select.dispatchEvent(new Event('change',{bubbles:true}));sync();close();trigger.focus({preventScroll:true});
        });menu.append(item);
      }
      sync();trigger.addEventListener('click',()=>{if(opened)close();else{choiceControllers.forEach(x=>x.close());setOpen(true)}});
      wrapper.addEventListener('keydown',event=>{
        if(event.key==='Escape'){close();trigger.focus({preventScroll:true});return}
        if((event.key==='ArrowDown'||event.key==='ArrowUp')&&!opened){event.preventDefault();choiceControllers.forEach(x=>x.close());setOpen(true);menu.querySelector('[aria-selected="true"]')?.focus({preventScroll:true});return}
        if(opened&&(event.key==='ArrowDown'||event.key==='ArrowUp')){
          event.preventDefault();const options=[...menu.querySelectorAll('[role="option"]')];
          const i=options.indexOf(document.activeElement);options[(i+(event.key==='ArrowDown'?1:-1)+options.length)%options.length]?.focus({preventScroll:true});
        }
      });
      document.addEventListener('pointerdown',event=>{if(opened&&!wrapper.contains(event.target))close()});
      select.addEventListener('change',sync);select.addEventListener('ff:refresh-choice',sync);
    }
    [input,genre,articleYear,filmYear,sort].forEach(el=>el?.addEventListener(el===input?'input':'change',update));
    sort?.addEventListener('change',()=>window.dispatchEvent(new CustomEvent('ff:archive-sort',{detail:sort.value})));
    window.addEventListener('ff:settings-applied',()=>{
      const value=document.documentElement.dataset.ffSort;
      if(sort && ['newest','oldest','az','za'].includes(value)){sort.value=value;sort.dispatchEvent(new Event('change',{bubbles:true}));}
      const view=document.documentElement.dataset.ffArchive;
      const btn=viewButtons.find(b=>b.dataset.view===view);
      if(btn && results.dataset.view!==view)btn.click();
    });
    clear?.addEventListener('click',()=>{input.value='';update();input.focus()});
    // Layout changes: morph archive cards and ease the container height in
    // parallel. The old implementation held height, then released it in a
    // second stage, causing the whole page to snap at the end.
    let layoutTimer = 0;
    let layoutToken = 0;
    let activeTransition = null;
    const viewButtons = [...document.querySelectorAll('.view-switch button[data-view]')];
    const initialView=document.documentElement.dataset.ffArchive;
    if(['editorial','grid','list','compact'].includes(initialView)){
      const firstButton=viewButtons.find(b=>b.dataset.view===initialView);
      if(firstButton)selectView(initialView,firstButton);
    }
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const canViewTransition = typeof document.startViewTransition === 'function';
    function selectView(view, selectedButton) {
      results.dataset.view = view;
      window.dispatchEvent(new CustomEvent('ff:archive-view',{detail:view}));
      viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button === selectedButton)));
    }
    viewButtons.forEach(button => button.addEventListener('click', () => {
      const nextView = button.dataset.view;
      if (results.dataset.view === nextView) return;
      const token = ++layoutToken;
      clearTimeout(layoutTimer);
      activeTransition?.skipTransition?.();
      activeTransition = null;
      const visible = cards.filter(card => !card.hidden);
      // Cancel any old FLIP animations if a reader taps twice rapidly.
      visible.forEach(card => card.getAnimations().forEach(animation => animation.cancel()));
      const oldRects = new Map(visible.map(card => [card, card.getBoundingClientRect()]));
      const oldHeight = results.getBoundingClientRect().height;
      const scrollBefore = window.scrollY;
      results.style.transition = 'none';
      results.style.height = `${oldHeight}px`;
      results.style.minHeight = '0';
      results.style.overflow = 'visible';
      results.classList.add('ff-view-changing');
      const useMotion = !reduceMotion.matches && document.documentElement.dataset.ffMotion !== 'off';
      const useNative = useMotion && canViewTransition;
      if (useNative) {
        visible.forEach((card, index) => {
          card.style.viewTransitionName = `ff-archive-card-${index}`;
          const image = card.querySelector('.entry img');
          if (image) image.style.viewTransitionName = `ff-archive-cover-${index}`;
        });
      }
      function updateLayout() {
        selectView(nextView, button);
        // Measure natural new content height, without briefly painting it.
        results.style.height = '';
        const newHeight = results.getBoundingClientRect().height;
        results.style.height = `${oldHeight}px`;
        // The temporary natural-height measurement can clamp scroll on a
        // shrinking layout. Restore it before the browser paints, so any
        // necessary movement happens gradually as the height animates.
        if (Math.abs(window.scrollY - scrollBefore) > 1) {
          window.scrollTo({top: scrollBefore, behavior: "instant"});
        }
        // Force the old height to become the start of the CSS transition.
        void results.offsetHeight;
        if (useMotion) {
          results.style.transition = 'height 700ms cubic-bezier(.22,.76,.2,1)';
        }
        results.style.height = `${newHeight}px`;
        if (!useNative && useMotion) {
          // Older browsers: animate position, never scale a photographic image.
          const newRects = new Map(visible.map(card => [card, card.getBoundingClientRect()]));
          for (const card of visible) {
            const before = oldRects.get(card), after = newRects.get(card);
            if (!before || !after || !after.width) continue;
            card.animate([
              {transform:`translate3d(${before.left-after.left}px,${before.top-after.top}px,0)`,opacity:.95},
              {transform:'translate3d(0,0,0)',opacity:1}
            ], {duration:700, easing:'cubic-bezier(.22,.76,.2,1)'});
          }
        }
      }
      if (useNative) {
        activeTransition = document.startViewTransition(updateLayout);
        activeTransition.finished.catch(() => {}).finally(() => {
          if (token !== layoutToken) return;
          activeTransition = null;
        });
      } else {
        updateLayout();
      }
      layoutTimer = setTimeout(() => {
        if (token !== layoutToken) return;
        results.style.transition = '';
        results.style.height = '';
        results.style.minHeight = '';
        results.style.overflow = '';
        results.classList.remove('ff-view-changing');
        visible.forEach(card => {
          card.style.viewTransitionName = '';
          const image = card.querySelector('.entry img');
          if (image) image.style.viewTransitionName = '';
        });
      }, useMotion ? 760 : 0);
    }));
    update();
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
      const toolbar = document.querySelector('.article-toolbar');
      const offset = (header?.getBoundingClientRect().height ?? 0) + (toolbar?.getBoundingClientRect().height ?? 0) + 22;
      window.scrollTo({top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth'});
      history.replaceState(null, '', `#${id}`);
      for (const menu of menus) menu.open = false;
    });
  });
})();

/* archive-experience.js */
/* Article previews use images listed in the local archive manifest. */
(()=>{
 const dialog=document.getElementById('archive-preview');if(!dialog)return;
 const gallery=document.getElementById('preview-gallery');
 let lastFocus=null;
 document.querySelectorAll('.archive-preview-trigger').forEach(button=>button.addEventListener('click',async()=>{
  const card=button.closest('.archive-card');if(!card)return;
  lastFocus=document.activeElement;
  const link=card.querySelector('.entry');const slug=button.dataset.preview;
  document.getElementById('preview-title').textContent=card.dataset.title||'';
  document.getElementById('preview-description').textContent=card.querySelector('.entry-body p')?.textContent||'';
  document.getElementById('preview-kicker').textContent=card.querySelector('.tag')?.textContent||'FILM ANALYSIS';
  document.getElementById('preview-meta').replaceChildren(...[
   card.dataset.filmYear&&`Film · ${card.dataset.filmYear}`,
   card.dataset.articleYear&&`Published · ${card.dataset.articleYear}`,
   card.dataset.genre&&`Genre · ${card.dataset.genre.replaceAll(',',', ')}`
  ].filter(Boolean).map(value=>{const span=document.createElement('span');span.textContent=value;return span}));
  document.getElementById('preview-read').href=link.href;
  gallery.replaceChildren();
  let images=[card.querySelector('img')?.getAttribute('src')].filter(Boolean); let captions=[];let abstract='';
  const embedded=JSON.parse(document.getElementById('preview-manifest')?.textContent||'{}')[slug];
  try{const res=embedded?null:await fetch(`${slug}/preview.json`);if(embedded||res?.ok){const data=embedded||await res.json();if(Array.isArray(data.images))images=data.images.map(name=>`${slug}/${name}`); if(Array.isArray(data.image_captions))captions=data.image_captions; abstract=typeof data.abstract==='string'?data.abstract:''}}catch(_){}
  images.slice(0,6).forEach((url,i)=>{const img=document.createElement('img');img.src=url;img.alt=captions[i]||`Article preview image ${i+1}`;img.loading='lazy';img.decoding='async';gallery.append(img)}); const abstractSection=document.getElementById('preview-abstract-section');if(abstractSection){abstractSection.hidden=!abstract;document.getElementById('preview-abstract').textContent=abstract;}
  gallery.style.gridTemplateColumns='';
  document.getElementById('preview-feedback').textContent='';dialog.showModal();dialog.querySelector('.preview-close').focus();
 }));
 dialog.querySelector('.preview-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 dialog.addEventListener('close',()=>lastFocus?.focus?.({preventScroll:true}));
 document.getElementById('preview-copy-link').addEventListener('click',async()=>{
  const url=document.getElementById('preview-read').href;const feedback=document.getElementById('preview-feedback');
  try{await navigator.clipboard.writeText(url);feedback.textContent='Article link copied.'}
  catch(_){feedback.textContent=`Copy this link: ${url}`}
 });
})();

/* v9-effects.js */
/* V9: animate filter open/close and lock page scrolling behind dialogs. */
(()=>{
 const details=document.getElementById('archive-filter-dropdown');
 if(details){
  const summary=details.querySelector('summary');
  const panel=details.querySelector('.archive-filter-panel');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const frames=[
    {opacity:0,transform:'translate3d(0,-10px,0) scale(.985)'},
    {opacity:1,transform:'translate3d(0,0,0) scale(1)'}
  ];
  let expanded = details.open;
  let motion = null;
  const OPEN_MS = 360;
  const CLOSE_MS = 175;
  // One WAAPI timeline handles both directions; changing its playback rate
  // preserves the current visual state even during rapid repeated clicks.
  function setExpanded(next) {
    if (next === expanded) return;
    expanded = next;
    if (next) details.open = true;
    if (reduced.matches) {
      motion?.cancel();
      motion = null;
      details.open = next;
      return;
    }
    if (!motion) {
      motion = panel.animate(frames, {
        duration: OPEN_MS,
        easing: 'cubic-bezier(.22,.8,.22,1)',
        fill: 'both',
        // Prevent the panel from restarting its entrance on the first close.
      });
      if (!next) motion.currentTime = OPEN_MS;
    }
    const current = motion;
    // Closing at ~2x speed removes the sluggish fade-out; reopening retains
    // the gentler entrance speed. Reversal never resets opacity/position.
    current.playbackRate = next ? 1 : -(OPEN_MS / CLOSE_MS);
    current.play();
    current.onfinish = () => {
      if (current !== motion) return;
      details.open = expanded;
      current.cancel();
      motion = null;
    };
  }
  summary?.addEventListener('click',event=>{event.preventDefault();setExpanded(!expanded)});
  document.addEventListener('click',event=>{if(expanded&&!details.contains(event.target))setExpanded(false)});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&expanded){event.stopPropagation();setExpanded(false);summary.focus()}
  },true);
 }
 // <dialog> traps focus, but explicitly lock the document scroll behind it.
 const dialogs=[...document.querySelectorAll('dialog')];
 function syncLock(){{const open=dialogs.some(d=>d.open);document.documentElement.classList.toggle('ff-modal-open',open);document.documentElement.classList.toggle('ff-v11-modal-open',open)}}
 dialogs.forEach(d=>{d.addEventListener('close',syncLock);d.addEventListener('cancel',()=>requestAnimationFrame(syncLock));});
 const observer=new MutationObserver(syncLock);
 dialogs.forEach(d=>observer.observe(d,{attributes:true,attributeFilter:['open']}));
 syncLock();
})();

/* v14-dialogs.js */
/* Animate dialog exits, including Escape, close buttons and backdrop clicks. */
(()=>{
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 for(const dialog of document.querySelectorAll('.archive-preview,.image-lightbox')){
   let closing=false,timer;
   const nativeClose=dialog.close.bind(dialog);
   function finish(){clearTimeout(timer);nativeClose();dialog.classList.remove('ff-dialog-closing');closing=false}
   function requestClose(){
     if(!dialog.open||closing)return;
     if(reduced.matches){nativeClose();return}
     closing=true;dialog.classList.add('ff-dialog-closing');
     timer=setTimeout(finish,260);
   }
   // Existing scripts call dialog.close() for all their dismissal routes.
   dialog.close=requestClose;
   dialog.addEventListener('cancel',event=>{event.preventDefault();requestClose()});
   dialog.addEventListener('close',()=>{clearTimeout(timer);closing=false;dialog.classList.remove('ff-dialog-closing')});
 }
})();
