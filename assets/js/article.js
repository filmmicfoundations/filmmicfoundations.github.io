/* Filmmic Foundations · consolidated site behavior. No dependencies. */
const closeMenu = menu => { if (!menu) return; if(window.FFDropdowns) window.FFDropdowns.close(menu); else menu.open=false; };


/* ../site-features.js */
/* Offset in-article navigation below the two sticky toolbars. */
(()=>{
  const menus=[...document.querySelectorAll('.site-nav details')];
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const id=decodeURIComponent(link.getAttribute('href').slice(1));
    const target=id&&document.getElementById(id);
    if(!target)return;
    event.preventDefault();
    const header=document.querySelector('.topbar');
    const toolbar=document.querySelector('.article-toolbar');
    const offset=(header?.getBoundingClientRect().height||0)+(toolbar?.getBoundingClientRect().height||0)+22;
    window.scrollTo({top:target.getBoundingClientRect().top+window.scrollY-offset,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    history.replaceState(null,'',`#${id}`);
    menus.forEach(menu=>{closeMenu(menu)});
  }));
})();

/* article-toolbar.js */
/* Sticky header measurement, in-paper menu, and reading position. */
(() => {
 const header=document.querySelector('.topbar');
 const toolbar=document.querySelector('.article-toolbar');
 if(!header||!toolbar)return;
 const root=document.documentElement;
 function measure(){
  root.style.setProperty('--ff-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
  root.style.setProperty('--ff-toolbar-height',Math.ceil(toolbar.getBoundingClientRect().height)+'px');
  root.style.setProperty('--ff-chrome-height',Math.ceil(header.getBoundingClientRect().height+toolbar.getBoundingClientRect().height)+'px');
 }
 measure();
 if('ResizeObserver' in window){const observer=new ResizeObserver(measure);observer.observe(header);observer.observe(toolbar)}
 window.addEventListener('resize',measure,{passive:true});
 const menu=toolbar.querySelector('.mobile-contents');
 menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{closeMenu(menu)}));
 document.addEventListener('click',event=>{if(menu?.open&&!menu.contains(event.target))closeMenu(menu)});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu?.open)closeMenu(menu)});
 const sectionLinks=[...toolbar.querySelectorAll('a[href^="#"]')];
 const headings=[...document.querySelectorAll('article h2[id]')];
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){if(entry.isIntersecting){
    sectionLinks.forEach(link=>link.setAttribute('aria-current',link.hash==='#'+entry.target.id?'location':'false'));
   }}
  },{rootMargin:'-28% 0px -60% 0px'});
  headings.forEach(h=>observer.observe(h));
 }
})();

/* article-tools-v23.js */
/* Citation helper retained; article and image sharing use one consistent tiny dialog. */
(() => {
  'use strict';
  const articleUrl = document.querySelector('link[rel="canonical"]')?.href || 'https://filmmicfoundations.github.io/mindglassprocedure/';
  // Publication metadata is generated from article.json at build time.
  // Never hard-code article titles or dates in this reusable script.
  const citationElement = document.getElementById('ff-citation-data');
  let citations = {};
  let citationHtml = {};
  if (citationElement) {
    try { citations = JSON.parse(citationElement.textContent); }
    catch (error) { console.error('Invalid article citation metadata', error); }
  }
  const citationHtmlElement = document.getElementById('ff-citation-html');
  if (citationHtmlElement) {
    try { citationHtml = JSON.parse(citationHtmlElement.textContent); }
    catch (error) { console.error('Invalid citation formatting metadata', error); }
  }
  const output = document.getElementById('ff-citation-text');
  const buttons = [...document.querySelectorAll('[data-citation-style]')];
  let style = ['mla','apa','chicago','ieee'].includes(document.documentElement.dataset.ffCitation)?document.documentElement.dataset.ffCitation:'mla';
  window.addEventListener('ff:settings-applied',()=>{
    const selected=document.documentElement.dataset.ffCitation;
    if(['mla','apa','chicago','ieee'].includes(selected)){style=selected;render();}
  });
  function render() {
    if (output) {
      if (citationHtml[style]) output.innerHTML = citationHtml[style];
      else output.textContent = citations[style] || 'Citation data unavailable. Please consult the article metadata.';
    }
    buttons.forEach(button => {
      const selected = button.dataset.citationStyle === style;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  buttons.forEach(button => button.addEventListener('click', () => { style = button.dataset.citationStyle; render();
    window.dispatchEvent(new CustomEvent('ff:citation-style',{detail:style})); }));
  render();
  document.getElementById('ff-copy-citation')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    if (!citations[style]) return;
    const ok = await copyCitation(style, output);
    button.textContent = ok ? '✓ Copied' : 'Select and copy';
    button.classList.remove('ff-copied');
    void button.offsetWidth;
    button.classList.add('ff-copied');
    setTimeout(() => { button.textContent = 'Copy citation'; button.classList.remove('ff-copied'); }, 1600);
  });
  async function copyCitation(style, fallback) {
    const plain = citations[style];
    const rich = citationHtml[style];
    // Where supported, preserve MLA / APA italics when pasting into a document.
    if (rich && navigator.clipboard?.write && typeof ClipboardItem === 'function') {
      try {
        await navigator.clipboard.write([new ClipboardItem({
          'text/html': new Blob([rich], {type: 'text/html'}),
          'text/plain': new Blob([plain], {type: 'text/plain'})
        })]);
        return true;
      } catch (_) { /* Fall back on plaintext for browsers without rich clipboard. */ }
    }
    return copyText(plain, fallback);
  }
  async function copyText(text, fallback) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) {}
    if (fallback?.select) {fallback.select();}
    else if (fallback) {
      const range = document.createRange();
      range.selectNodeContents(fallback);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
    try { return document.execCommand('copy'); } catch (_) { return false; }
  }
  function configureDialog(dialog) {
    if (!dialog) return () => {};
    const input = dialog.querySelector('input');
    const feedback = dialog.querySelector('.ffs-feedback');
    const button = dialog.querySelector('.ffs-copy');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let exitTimer, enteredBy = null;
    const nativeClose = dialog.close.bind(dialog);
    function close() {
      if (!dialog.open || dialog.classList.contains('ffs-closing')) return;
      function finish() {
        clearTimeout(exitTimer);
        nativeClose();
        dialog.classList.remove('ffs-closing');
        enteredBy?.focus?.({preventScroll:true});
      }
      if (reduced.matches) finish();
      else {dialog.classList.add('ffs-closing');exitTimer=setTimeout(finish,225);}
    }
    dialog.querySelector('.ffs-close')?.addEventListener('click', close);
    dialog.addEventListener('click', event => {if (event.target === dialog) close();});
    dialog.addEventListener('cancel', event => {event.preventDefault();close();});
    button?.addEventListener('click', async () => {
      const success = await copyText(input.value, input);
      feedback.textContent = success ? 'Link copied.' : 'Select the link to copy it.';
      button.textContent = success ? '✓ Copied' : 'Copy link';
      button.classList.toggle('ffs-copied', success);
      setTimeout(() => {button.textContent = 'Copy link';button.classList.remove('ffs-copied');},1400);
    });
    return (url) => {
      enteredBy = document.activeElement;
      input.value = url;
      feedback.textContent = '';
      button.textContent = 'Copy link';
      button.classList.remove('ffs-copied');
      dialog.classList.remove('ffs-closing');
      dialog.showModal();
      button.focus({preventScroll:true});
    };
  }
  const showArticle = configureDialog(document.getElementById('ffs-article'));
  const showImage = configureDialog(document.getElementById('ffs-image'));
  window.ffOpenLinkDialog = (type, link) => {
    if (type === 'image') showImage(link);
    else showArticle(link || articleUrl);
  };
  document.getElementById('ff-share-article')?.addEventListener('click', () => showArticle(articleUrl));
})();

/* Image viewer: one controller, no competing lightbox dependencies. */
(() => {
  'use strict';
  const dialog = document.getElementById('ffv-dialog');
  const triggers = [...document.querySelectorAll('article figure .article-image-open')];
  if (!dialog || !triggers.length) return;
  const el = id => document.getElementById(id);
  const canvas = el('ffv-canvas');
  const image = el('ffv-image');
  const gallery = el('ffv-gallery');
  const viewport = el('ffv-viewport');
  const toggle = el('ffv-toggle');
  const zoomOutput = el('ffv-percent');
  const status = el('ffv-status');
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canonicalBase = new URL(document.querySelector('link[rel="canonical"]')?.href || 'https://filmmicfoundations.github.io/mindglassprocedure/');
  const items = triggers.map(button => {
    const still = button.querySelector('img');
    const relative = still.getAttribute('src');
    return {
      src: new URL(relative, location.href).href,
      shareUrl: new URL(relative, canonicalBase).href,
      // Unlike Mindglass, Alike uses externally hosted authentic film stills.
      // Honor their no-referrer policy in every image context, including preloads.
      external: new URL(relative, location.href).origin !== location.origin,
      alt: still.alt || 'Film still',
      caption: button.closest('figure')?.querySelector('figcaption')?.textContent?.trim() || still.alt || 'Film still',
      filename: decodeURIComponent(relative.split('/').pop()?.split('?')[0] || 'filmmic-foundations-image.webp')
    };
  });
  let index = 0, zoom = 1, panX = 0, panY = 0, drag = null;
  let transitionId = 0, transitionTimer = 0, messageTimer = 0;
  let focusReturn = null;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const galleryButtons = [];
  // A failed third-party source must not leave an empty or unresponsive modal.
  // The fallback is intentionally absent for ordinary, working local film stills.
  const imageFailure = document.createElement('div');
  imageFailure.className = 'ffv-image-failure';
  imageFailure.hidden = true;
  const failureText = document.createElement('p');
  failureText.textContent = 'This film still could not be loaded from its source.';
  const failureLink = document.createElement('a');
  failureLink.target = '_blank';
  failureLink.rel = 'noopener noreferrer';
  failureLink.textContent = 'Open the original image';
  imageFailure.append(failureText, failureLink);
  canvas.append(imageFailure);
  let slideshowTimer=0;
  function syncSlideshow(){
    clearInterval(slideshowTimer);slideshowTimer=0;
    if(dialog.open && viewport.dataset.mode==='single' && document.documentElement.dataset.ffSlideshow==='on' && !prefersReduced.matches){
      slideshowTimer=setInterval(()=>setItem(index+1,document.documentElement.dataset.ffGalleryMotion!=='off'),5200);
    }
  }
  window.addEventListener('ff:settings-applied',syncSlideshow);

  function message(text) {
    status.textContent = text;
    status.classList.add('ffv-show');
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => status.classList.remove('ffv-show'), 3500);
  }
  function repositionArrows() {
    if (!image.naturalWidth || !canvas.clientWidth) return;
    // Keep arrows near the *fitted* picture, including portrait-oriented stills.
    const width = image.offsetWidth;
    const maxOffset = Math.max(0, (canvas.clientWidth - 36) / 2);
    const offset = clamp((canvas.clientWidth - width) / 2 - 12, -5, maxOffset);
    el('ffv-single').style.setProperty('--ffv-arrow-offset', `${Math.max(4, offset)}px`);
  }
  function applyZoom() {
    if (!image.isConnected) return;
    const viewportWidth = canvas.clientWidth, viewportHeight = canvas.clientHeight;
    const effectiveWidth = image.offsetWidth * zoom, effectiveHeight = image.offsetHeight * zoom;
    const maxX = Math.max(0, (effectiveWidth - viewportWidth) / 2);
    const maxY = Math.max(0, (effectiveHeight - viewportHeight) / 2);
    panX = clamp(panX, -maxX, maxX);
    panY = clamp(panY, -maxY, maxY);
    image.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
    zoomOutput.textContent = `${Math.round((zoom - 1) / 3 * 500)}%`;
    canvas.classList.toggle('ffv-can-pan', maxX > 0 || maxY > 0);
    el('ffv-minus').disabled = zoom <= 1;
    el('ffv-plus').disabled = zoom >= 4;
  }
  function setZoom(value) {
    zoom = clamp(Number(value), 1, 4);
    if (zoom === 1) panX = panY = 0;
    applyZoom();
  }
  function resetSlide() {
    clearTimeout(transitionTimer);
    canvas.classList.remove('ffv-sliding');
    canvas.querySelector('.ffv-ghost')?.remove();
    // Drop the animation class before resetting zoom, to keep transforms predictable.
  }
  function setItem(next, animate = false) {
    const requested = (next + items.length) % items.length;
    const token = ++transitionId;
    const item = items[requested];
    const previous = index;
    const oldSrc = image.getAttribute('src');
    let committed = false;
    function commit() {
      if (committed || token !== transitionId) return;
      committed = true;
      resetSlide();
      const slide = animate && oldSrc && previous !== requested && !prefersReduced.matches && document.documentElement.dataset.ffMotion !== 'off' && document.documentElement.dataset.ffGalleryMotion !== 'off';
      if (slide) {
        const ghost = document.createElement('div');
        ghost.className = 'ffv-ghost';
        const oldImage = document.createElement('img');
        oldImage.src = oldSrc;
        oldImage.alt = '';
        ghost.append(oldImage);
        canvas.append(ghost);
        let distance = requested - previous;
        if (Math.abs(distance) > items.length / 2) distance = -Math.sign(distance);
        canvas.style.setProperty('--ffv-direction', `${Math.sign(distance) || 1}`);
      }
      index = requested;
      imageFailure.hidden = true;
      failureLink.href = item.src;
      image.referrerPolicy = item.external ? 'no-referrer' : '';
      image.alt = item.alt;
      // Reset the old image state before changing sources. Do not wait for
      // external preloads to resolve before making the viewer responsive.
      image.src = item.src;
      const downloadLink = el('ffv-download');
      downloadLink.href = item.src;
      downloadLink.download = item.filename;
      el('ffv-caption').textContent = item.caption;
      el('ffv-count').textContent = `${index + 1} / ${items.length}`;
      galleryButtons.forEach((b, n) => b.classList.toggle('ffv-current', n === index));
      zoom = 1; panX = panY = 0;
      applyZoom();
      if (slide) {
        // Restart keyframes only after the new image is installed.
        void canvas.offsetWidth;
        canvas.classList.add('ffv-sliding');
        transitionTimer = setTimeout(resetSlide, 350);
      }
      requestAnimationFrame(repositionArrows);
    }
    if (item.src === image.src && image.complete) { commit(); return; }
    // External hosts may block image preloads or leave them unresolved. Show
    // the dialog immediately and let the actual image report success/failure.
    if (item.external || !animate) { commit(); return; }
    // Retain the smooth pre-decode transition for reliable local film stills.
    const preload = new Image();
    preload.onload = commit;
    preload.onerror = commit;
    preload.src = item.src;
    if (preload.complete && preload.naturalWidth) commit();
  }
  function setMode(mode) {
    const galleryMode = mode === 'gallery';
    viewport.dataset.mode = galleryMode ? 'gallery' : 'single';
    dialog.dataset.gallery = galleryMode ? 'true' : 'false';
    gallery.setAttribute('aria-hidden', String(!galleryMode));
    toggle.setAttribute('aria-expanded', String(galleryMode));
    toggle.setAttribute('aria-label', galleryMode ? 'Show single image' : 'Show gallery');
    el('ffv-toggle-label').textContent = galleryMode ? 'Single' : 'Gallery';
    zoomOutput.classList.toggle('is-disabled',galleryMode);
    zoomOutput.setAttribute('aria-disabled',String(galleryMode));
    for (const id of ['ffv-minus', 'ffv-plus', 'ffv-fit']) {
      el(id).disabled = galleryMode;
    }
    if (!galleryMode) {
      applyZoom();
      requestAnimationFrame(repositionArrows);
    }
    for (const tile of galleryButtons) tile.tabIndex = galleryMode ? 0 : -1;
    syncSlideshow();
  }
  items.forEach((item, i) => {
    const tile = document.createElement('button');
    tile.className = 'ffv-tile';
    tile.type = 'button';
    tile.tabIndex = -1;
    tile.setAttribute('aria-label', `View image ${i + 1}: ${item.alt}`);
    const thumb = document.createElement('img');
    thumb.referrerPolicy = item.external ? 'no-referrer' : '';
    thumb.src = item.src;
    thumb.alt = item.alt;
    thumb.loading = 'lazy';
    thumb.addEventListener('error', () => tile.classList.add('ffv-tile-unavailable'));
    tile.append(thumb);
    const number = document.createElement('span');
    number.className = 'ffv-tile-number';
    number.textContent = `${i + 1} / ${items.length}`;
    tile.append(number);
    tile.addEventListener('click', () => {
      setItem(i);
      setMode('single');
      toggle.focus({ preventScroll: true });
    });
    gallery.append(tile);
    galleryButtons.push(tile);
  });

  // Closing retains modal state for the exit animation, and restores keyboard focus.
  let closing = false, closeTimer = 0;
  function closeViewer() {
    if (!dialog.open || closing) return;
    clearInterval(slideshowTimer);slideshowTimer=0;
    closing = true;
    const finish = () => {
      clearTimeout(closeTimer);
      dialog.close();
      dialog.classList.remove('ffv-closing');
      closing = false;
    };
    if (prefersReduced.matches) finish();
    else {
      dialog.classList.add('ffv-closing');
      closeTimer = setTimeout(finish, 235);
    }
  }
  triggers.forEach((button, i) => button.addEventListener('click', () => {
    focusReturn = button;
    ++transitionId;
    resetSlide();
    setItem(i);
    setMode(document.documentElement.dataset.ffViewer === 'gallery' ? 'gallery' : 'single');
    dialog.showModal();
    syncSlideshow();
    dialog.querySelector('.ffv-close').focus({ preventScroll: true });
    requestAnimationFrame(repositionArrows);
  }));
  dialog.querySelector('.ffv-close').addEventListener('click', closeViewer);
  dialog.querySelector('.ffv-prev').addEventListener('click', () => setItem(index - 1, true));
  dialog.querySelector('.ffv-next').addEventListener('click', () => setItem(index + 1, true));
  toggle.addEventListener('click', () => setMode(viewport.dataset.mode === 'single' ? 'gallery' : 'single'));
  el('ffv-minus').addEventListener('click', () => setZoom(zoom - 0.3));
  el('ffv-plus').addEventListener('click', () => setZoom(zoom + 0.3));
  el('ffv-fit').addEventListener('click', () => setZoom(1));
  image.addEventListener('load', () => {
    imageFailure.hidden = true;
    applyZoom();repositionArrows();
  });
  image.addEventListener('error', () => {
    imageFailure.hidden = false;
    image.style.transform = '';
    message('The image host is unavailable. You can open the original source.');
  });
  window.addEventListener('resize', () => {applyZoom();repositionArrows();}, {passive:true});
  dialog.addEventListener('click', event => { if (event.target === dialog) closeViewer(); });
  dialog.addEventListener('cancel', event => {event.preventDefault();closeViewer();});
  dialog.addEventListener('close', () => {
    clearInterval(slideshowTimer);slideshowTimer=0;
    clearTimeout(closeTimer);
    dialog.classList.remove('ffv-closing');
    closing = false;
    ++transitionId;
    resetSlide();
    setZoom(1);
    setMode('single');
    focusReturn?.focus({ preventScroll: true });
  });
  dialog.addEventListener('keydown', event => {
    if (event.target.matches('input,textarea')) return;
    if (event.key === 'ArrowRight' && viewport.dataset.mode === 'single') {event.preventDefault();setItem(index + 1, true);}
    if (event.key === 'ArrowLeft' && viewport.dataset.mode === 'single') {event.preventDefault();setItem(index - 1, true);}
    if (event.key === '+' || event.key === '=') {event.preventDefault();setZoom(zoom + 0.3);}
    if (event.key === '-') {event.preventDefault();setZoom(zoom - 0.3);}
  });
  canvas.addEventListener('pointerdown', event => {
    if (zoom <= 1 || event.button !== 0) return;
    drag = { id: event.pointerId, clientX: event.clientX, clientY: event.clientY, panX, panY };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('ffv-dragging');
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    panX = drag.panX + (event.clientX - drag.clientX);
    panY = drag.panY + (event.clientY - drag.clientY);
    applyZoom();
  });
  function stopDrag() {drag = null;canvas.classList.remove('ffv-dragging');}
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('lostpointercapture', stopDrag);

  // Download the actual image bytes rather than depending on the browser's
  // treatment of an <a download> link. Blob URLs are same-origin and reliably
  // trigger Save as File for GitHub Pages' static images. No extra libraries.
  const downloadButton = el('ffv-download');
  let downloading = false;
  downloadButton.addEventListener('click', async event => {
    event.preventDefault();
    if (downloading) return;
    const item = items[index];
    downloading = true;
    downloadButton.setAttribute('aria-busy', 'true');
    downloadButton.setAttribute('aria-disabled', 'true');
    try {
      // Fetching file:// URLs is restricted in many browsers. For local
      // previews, use a native hyperlink instead; the fully hosted site uses
      // the verified blob-download path below.
      if (item.src.startsWith('file:')) throw new Error('local-file');
      const response = await fetch(item.src, { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Image request returned HTTP ' + response.status);
      const blob = await response.blob();
      if (!blob.size || (!blob.type.startsWith('image/') && blob.type !== 'application/octet-stream')) {
        throw new Error('Unexpected image response');
      }
      const objectUrl = URL.createObjectURL(blob);
      const saveLink = document.createElement('a');
      saveLink.href = objectUrl;
      saveLink.download = item.filename;
      saveLink.style.display = 'none';
      document.body.appendChild(saveLink);
      saveLink.click();
      saveLink.remove();
      // Do not revoke synchronously: Safari and Firefox may still be saving.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      message('Image download started.');
    } catch (error) {
      // Best-effort native fallback for local-file previews or restrictive
      // browsers. It points to the original image, never the page itself.
      const fallback = document.createElement('a');
      fallback.href = item.src;
      fallback.download = item.filename;
      fallback.style.display = 'none';
      document.body.appendChild(fallback);
      fallback.click();
      fallback.remove();
      message(location.protocol === 'file:'
        ? 'Local preview: if the image opens instead, use Save Image As or try the published website.'
        : 'If the image opens rather than downloading, use Save Image As.');
    } finally {
      downloading = false;
      downloadButton.removeAttribute('aria-busy');
      downloadButton.removeAttribute('aria-disabled');
    }
  });
  el('ffv-share').addEventListener('click', () => {
    window.ffOpenLinkDialog?.('image', items[index].shareUrl);
  });
})();


/* v31 — lightweight cover parallax. One passive scroll listener, one rAF
   at most per frame, and no work after the cover leaves the viewport. */
(()=>{
  const hero=document.querySelector('.hero');
  const image=hero?.querySelector('.hero-image');
  if(!hero||!image)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0;
  function update(){
    frame=0;
    if(reduced.matches||document.documentElement.dataset.ffMotion==='off'){image.style.removeProperty('--ff-cover-shift');return}
    const bounds=hero.getBoundingClientRect();
    if(bounds.bottom<0||bounds.top>innerHeight)return;
    const progress=Math.max(0,Math.min(1,-bounds.top/Math.max(bounds.height,1)));
    const intensity=document.documentElement.dataset.ffMotion==='full'?1.35:1;
    const shift=Math.min(46,bounds.height*.068)*progress*intensity;
    image.style.setProperty('--ff-cover-shift',`${shift.toFixed(2)}px`);
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update)}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  reduced.addEventListener?.('change',schedule);
  window.addEventListener('ff:settings-applied',schedule);
  schedule();
})();

/* Reading progress: anonymous, purely on-device and reduced-motion safe. */
(()=>{
 const article=document.querySelector('article.article');
 const progress=document.querySelector('.ff-reading-progress');
 if(!article||!progress)return;
 let raf=0,last=-1;
 function frame(){
  raf=0;
  const start=article.getBoundingClientRect().top+scrollY;
  const end=start+article.offsetHeight;
  const header=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ff-chrome-height'))||120;
  const distance=Math.max(1,end-start-header);
  const fraction=Math.max(0,Math.min(1,(scrollY+header-start)/distance));
  if(Math.abs(fraction-last)>.001){progress.style.transform=`scaleX(${fraction.toFixed(4)})`;last=fraction}
 }
 function schedule(){if(!raf)raf=requestAnimationFrame(frame)}
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule,{passive:true});
 schedule();
})();
