/* Filmmic Foundations — pre-publication review & published-site media inspector.
   This module is read-only. It never receives a GitHub token and cannot publish.
   The existing developer.js retains sole control of repository changes. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const PUBLIC='https://filmmicfoundations.github.io/';
  const MAX_TEXT=180000;
  const decoder=new TextDecoder();
  let files=[], byPath=new Map(), compared=false, baselineSha='', generation=0;
  let liveManifest=null;
  const urls=[];
  const dataUrlFor=(f)=>{
    const ext=f.path.split('.').pop().toLowerCase();
    const mime=({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',svg:'image/svg+xml',gif:'image/gif',ico:'image/x-icon',woff:'font/woff',woff2:'font/woff2'})[ext]||'application/octet-stream';
    const url=URL.createObjectURL(new Blob([f.bytes],{type:mime}));urls.push(url);return url;
  };
  const assetURLs=new Map();
  const resolvePath=(relative,parent)=>{
    if(!relative||relative.startsWith('#')||/^(?:data:|blob:|javascript:|mailto:)/i.test(relative))return null;
    try{const url=new URL(relative,new URL(parent,PUBLIC));return url.origin===new URL(PUBLIC).origin?decodeURIComponent(url.pathname.replace(/^\//,'')):null;}catch{return null;}
  };
  const findAsset=(path)=>{
    const entry=byPath.get(path);
    if(!entry?.bytes)return PUBLIC+path;
    if(!assetURLs.has(path))assetURLs.set(path,dataUrlFor(entry));
    return assetURLs.get(path);
  };
  const getText=path=>{const f=byPath.get(path);return f?.bytes?decoder.decode(f.bytes):null;};
  const parseHTML=html=>new DOMParser().parseFromString(html,'text/html');
  function clearUrls(){for(const url of urls)URL.revokeObjectURL(url);urls.length=0;assetURLs.clear();}
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};

  // Bootstrap-safe visual upgrade. A patch changing dev/index.html cannot be published
  // through older readiness checks (they mistake dev/ for a film article). Instead,
  // upgrade the existing markup here; the release can contain JS/CSS only.
  function enhanceHealthLayout(){
    const panel=document.querySelector('.ffq-health-panel');
    if(!panel || panel.querySelector('.ffq-section-stack'))return;
    const results=$('ffq-health-results'),metrics=$('ffq-health-metrics'),inspector=$('ffq-article-result');
    const select=$('ffq-article-select'),healthTitle=$('ffq-health-heading');
    if(!results||!metrics||!inspector||!select||!healthTitle)return;
    const oldNodes=[...panel.children];
    const eyebrow=panel.querySelector('.dev-eyebrow');
    const lead=panel.querySelector('.dev-lead');
    const actions=panel.querySelector('.ffq-actions');
    const mediaKicker=oldNodes.find(n=>n.classList?.contains('dev-eyebrow')&&n!==eyebrow);
    const mediaTitle=oldNodes.find(n=>n.tagName==='H3'&&n.textContent.includes('Article'));
    const mediaDesc=oldNodes.find(n=>n.matches?.('p.ffq-muted'));
    const mediaLabel=panel.querySelector('label[for="ffq-article-select"]');
    const stack=el('div','ffq-section-stack');
    const health=el('div','ffq-surface ffq-surface-health');
    const healthHead=el('div','ffq-surface-head');
    const intro=el('div');
    [eyebrow,healthTitle,lead].filter(Boolean).forEach(n=>intro.append(n));
    healthHead.append(intro);
    if(actions)healthHead.append(actions);
    health.append(healthHead,metrics,results);
    const library=el('div','ffq-surface ffq-surface-inspector');
    const libraryHead=el('div','ffq-surface-head ffq-surface-head-inline');
    const libraryIntro=el('div');
    [mediaKicker,mediaTitle,mediaDesc].filter(Boolean).forEach(n=>libraryIntro.append(n));
    libraryHead.append(libraryIntro);
    const controls=el('div','ffq-inspector-controls');
    if(mediaLabel)controls.append(mediaLabel);
    controls.append(select);
    library.append(libraryHead,controls,inspector);
    if(!inspector.textContent.trim())inspector.append(el('p','ffq-empty-state','Run a health check or choose an article once the live media manifest is available.'));
    stack.append(health,library);
    panel.replaceChildren(stack);
  }
  enhanceHealthLayout();

  function check(state,label,detail){return {state,label,detail};}
  function sourceClasses(doc){const refs=[...doc.querySelectorAll('li[id^="ref-"]')];const counts={primary:0,secondary:0,tertiary:0};for(const ref of refs){const text=ref.textContent.toLowerCase();for(const key of Object.keys(counts))if(new RegExp('\\b'+key+'\\b').test(text))counts[key]++;}return {refs,counts};}
  function reviewArticle(slug,articleHtml,meta,preview){
    const checks=[];const doc=parseHTML(articleHtml);
    const figures=[...doc.querySelectorAll('article figure')];
    const images=figures.filter(f=>f.querySelector('img') && !f.classList.contains('diagram'));
    const diagrams=figures.filter(f=>f.classList.contains('diagram'));
    const observed=sourceClasses(doc);
    const isNew=byPath.get(`${slug}/index.html`)?.status==='new';
    const err=label=>checks.push(check('error',label,`Article: ${slug}. Fix before publishing.`));
    if(!doc.querySelector('article.article'))err('Article body is missing');
    if(observed.refs.length<10)err(`Only ${observed.refs.length} sources found (minimum 10)`);
    else checks.push(check('pass',`${observed.refs.length} references`, 'In-text reference quality still requires editorial review.'));
    if(Object.values(observed.counts).some(v=>v===0))checks.push(check(isNew?'error':'warn','Source categories not all identifiable','A new article needs documented primary, secondary and tertiary sources.'));
    else checks.push(check('pass','All three source categories represented',`${observed.counts.primary} primary · ${observed.counts.secondary} secondary · ${observed.counts.tertiary} tertiary`));
    if(images.length<7||images.length>15)err(`${images.length} figure stills (standard: 7–15)`);
    else checks.push(check('pass',`${images.length} article stills`,`${diagrams.length} analytical diagrams excluded from viewer counts`));
    if(!meta){if(isNew)err('Article metadata missing');else checks.push(check('warn','Article metadata not included in patch','Current published metadata must be checked.'));}
    if(!preview){if(isNew)err('Preview manifest missing');else checks.push(check('warn','Preview not included in ZIP','The existing preview must be checked after deployment.'));}
    else{
      if(!Array.isArray(preview.images)||preview.images.length!==6)err('Preview must contain exactly six stills');
      else{
        const uniq=new Set(preview.images);
        const bad=preview.images.filter(s=>/diagram|\.svg(?:\?|$)/i.test(s));
        if(uniq.size!==6||bad.length)err('Preview contains duplicate frames or diagrams');
        else checks.push(check('pass','Six unique preview image paths','Files are named as images rather than diagrams; authenticity needs editorial verification.'));
        for(const img of preview.images){
          const path=`${slug}/${img}`;
          if(!byPath.has(path)&&isNew)err(`Missing new preview asset: ${img}`);
          else if(!byPath.has(path))checks.push(check('warn',`Preview asset not in patch: ${img}`,'May already exist on the published site.'));
        }
      }
    }
    const pdfLinks=[...doc.querySelectorAll('a[href$=".pdf"]')].map(a=>resolvePath(a.getAttribute('href'),`${slug}/index.html`)).filter(Boolean);
    const pdf=pdfLinks.find(p=>byPath.has(p));
    if(!pdf){if(isNew)err('New article PDF missing from ZIP');else checks.push(check('warn','PDF not included in update','PDF contents and figure parity need visual inspection.'));}
    else checks.push(check('pass','PDF packaged','PDF existence verified; figure placement must still be inspected visually.'));
    const broken=[...doc.querySelectorAll('a.cite[href^="#ref-"]')].filter(a=>!doc.querySelector(`li[id="${CSS.escape(a.getAttribute('href').slice(1))}"]`));
    if(broken.length)err(`${broken.length} citation links have no reference target`);
    else checks.push(check('pass','In-text citation anchors resolve', 'This does not fact-check their claims.'));
    const figureIds=figures.map(f=>Number((f.id||'').replace('figure-',''))).filter(Number.isFinite);
    if(figureIds.length && figureIds.some((n,i)=>n!==i+1))err('Figure numbers out of sequence');
    else checks.push(check('pass','Sequential article figures',`${figures.length} total figures`));
    if(meta?.image && isNew&&!byPath.has(`${slug}/${meta.image}`))err(`New cover is missing: ${meta.image}`);
    return checks;
  }
  function makePreflight(){
    const checks=[];
    // Reserved site sections are not film articles. In particular, dev/index.html
    // must NEVER enter article preflight or it will block publishing this portal itself.
    const reserved=new Set(['dev','about','assets','standards','scripts','tests']);
    const articleIndexes=files.filter(f=>f.bytes&&/^[a-z0-9_-]+\/index\.html$/.test(f.path)&&!reserved.has(f.path.split('/')[0]));
    checks.push(check('pass','ZIP paths and file integrity','Verified by the Developer Portal’s existing CRC and safe-path checks.'));
    const rootIndex=files.find(f=>f.bytes&&f.path==='index.html');
    if(rootIndex)checks.push(check('warn','Homepage included in update','Review this file carefully: it will replace the live homepage.'));
    for(const f of files.filter(f=>f.bytes&&/(?:\.github\/workflows\/|assets\/js\/|assets\/css\/)/.test(f.path))){
      if(f.status!=='unchanged'&&f.path.endsWith('.yml'))checks.push(check('warn','GitHub workflow file',`Advanced permission required: ${f.path}`));
    }
    for(const f of articleIndexes){
      const slug=f.path.split('/')[0];
      let meta=null,preview=null;
      try{meta=JSON.parse(getText(`${slug}/article.json`)||'null');}catch{checks.push(check('error','Invalid article.json',slug));}
      try{preview=JSON.parse(getText(`${slug}/preview.json`)||'null');}catch{checks.push(check('error','Invalid preview.json',slug));}
      checks.push(...reviewArticle(slug,getText(f.path),meta,preview));
    }
    if(!articleIndexes.length)checks.push(check('pass','No article content changed','Article-specific checks do not apply to this package.'));
    checks.push(check('unknown','Film-still authenticity and analytical placement','Verify that every frame comes from the film and supports the surrounding discussion.'));
    checks.push(check('unknown','External links and film playback','Browser-side access restrictions prevent reliable third-party verification.'));
    checks.push(check('unknown','PDF visual parity and native mobile','Compare the rendered PDF with its web article and test on the deployed site.'));
    return checks;
  }
  function renderChecks(target,checks){target.replaceChildren();for(const c of checks){const row=el('div',`ffq-check ffq-${c.state}`);const mark=el('span','ffq-check-mark',({pass:'✓',error:'!',warn:'!',unknown:'–'})[c.state]);mark.setAttribute('aria-hidden','true');const body=el('div','ffq-check-text');body.append(el('strong','',c.label),el('small','',c.detail));const badge=el('span','ffq-state',({pass:'Pass',error:'Fix required',warn:'Warning',unknown:'Manual review'})[c.state]||c.state);badge.dataset.state=c.state;row.append(mark,body,badge);target.append(row);}}
  function setReadiness(checks){
    const critical=checks.filter(x=>x.state==='error');const warnings=checks.filter(x=>x.state==='warn');
    window.ffPortalReadiness={blocked:critical.length>0};
    $('ffq-preflight').hidden=false;$('ffq-review-actions').hidden=false;
    $('ffq-ready-state').textContent=critical.length?'Fix required':warnings.length?'Review warnings':'Checks passed';
    $('ffq-ready-state').dataset.state=critical.length?'error':warnings.length?'warn':'pass';
    $('ffq-status').textContent=`${checks.filter(x=>x.state==='pass').length} passed · ${critical.length} critical · ${warnings.length} warnings · ${checks.filter(x=>x.state==='unknown').length} not verified`;
    renderChecks($('ffq-checks'),checks);
    window.dispatchEvent(new Event('ff:portal-readiness'));
  }
  function reset(){generation++;files=[];byPath.clear();compared=false;baselineSha='';clearUrls();window.ffPortalReadiness={blocked:false};$('ffq-preflight').hidden=true;$('ffq-review-actions').hidden=true;$('ffq-diff-panel').hidden=true;if($('ffq-preview-dialog').open)$('ffq-preview-dialog').close();window.dispatchEvent(new Event('ff:portal-readiness'));}
  window.addEventListener('ff:portal-reset',reset);
  window.addEventListener('ff:portal-inspected',e=>{
    clearUrls();files=e.detail.files.filter(f=>f.bytes);byPath=new Map(files.map(f=>[f.path,f]));compared=!!e.detail.compared;baselineSha=e.detail.baselineSha||'';
    setReadiness(makePreflight());prepareDiff();preparePreview();
  });

  // Staged visual preview: sandbox disables all scripts and form submission.
  // Existing site assets are used only when not included in the ZIP.
  async function getPreviewHtml(path){
    const packaged=getText(path);if(packaged!==null)return packaged;
    const response=await fetch(new URL(path,PUBLIC),{cache:'no-store'});
    if(!response.ok)throw Error(`${path} is not in the update and could not be fetched from the current site (${response.status}).`);
    return response.text();
  }
  function stylesheetContents(css,filename){
    return css.replace(/url\(\s*(['"]?)([^'"()]+)\1\s*\)/gi,(whole,quote,url)=>{
      if(/^(?:data:|https?:|blob:|#)/i.test(url))return whole;
      const path=resolvePath(url,filename);return path?`url("${findAsset(path)}")`:whole;
    });
  }
  async function renderPreview(){
    const id=++generation;const path=$('ffq-preview-page').value;const frame=$('ffq-preview-frame');if(!path)return;
    $('ffq-preview-note').textContent=`Preparing ${path}…`;
    const stage=$('ffq-preview-width').value;
    frame.style.width=stage==='mobile'?'390px':'100%';
    try{
      const source=await getPreviewHtml(path);if(id!==generation)return;
      const doc=parseHTML(source);const theme=$('ffq-preview-theme').value;
      doc.documentElement.setAttribute('data-theme',theme);
      doc.querySelectorAll('script,meta[http-equiv="refresh"],form').forEach(n=>n.remove());
      // Base supports site-relative links; own ZIP assets are swapped for local blob URLs.
      const base=doc.createElement('base');base.href=new URL(path,PUBLIC).href;doc.head.prepend(base);
      for(const link of [...doc.querySelectorAll('link[rel="stylesheet"][href]')]){
        const raw=link.getAttribute('href'),local=resolvePath(raw,path);
        const own=local && getText(local);
        if(own!==null && own!==undefined){const style=doc.createElement('style');style.textContent=stylesheetContents(own,local);link.replaceWith(style);}
        else if(local)link.href=PUBLIC+local;
      }
      for(const node of [...doc.querySelectorAll('[src],[srcset],[poster]')]){
        for(const attr of ['src','poster'])if(node.hasAttribute(attr)){
          const local=resolvePath(node.getAttribute(attr),path);if(local)node.setAttribute(attr,findAsset(local));
        }
        if(node.hasAttribute('srcset'))node.removeAttribute('srcset'); // correct full-res src is used for deterministic preview
      }
      for(const node of [...doc.querySelectorAll('[style]')])node.setAttribute('style',stylesheetContents(node.getAttribute('style'),path));
      // Sandbox still blocks scripts, popups, forms and top-level navigation.
      doc.head.append(Object.assign(doc.createElement('style'),{textContent:'html{scroll-behavior:auto!important}body{min-width:0!important}'}));
      renderQuickPreview(path,doc);
      frame.srcdoc='<!doctype html>\n'+doc.documentElement.outerHTML;
      $('ffq-preview-note').textContent=`${path} · ${theme} · ${stage}. Visual approximation only; interaction testing still required.`;
    }catch(err){$('ffq-preview-note').textContent=`Preview unavailable: ${err.message}`;frame.removeAttribute('srcdoc');}
  }
  function renderQuickPreview(path,doc){
    const area=$('ffq-preview-fallback');area.replaceChildren();
    area.append(el('p','ffq-fallback-kicker','FILMMIC FOUNDATIONS · UNPUBLISHED VISUAL SUMMARY'));
    const headline=doc.querySelector('.hero h1, .masthead h1, h1')?.textContent?.trim()||path;
    area.append(el('h2','ffq-fallback-title',headline));
    const summary=doc.querySelector('.hero .dek,.masthead p,.article-intro p')?.textContent?.trim()||'No article introduction found.';
    area.append(el('p','ffq-fallback-summary',summary));
    let image=null;
    if(path==='index.html')image=doc.querySelector('#article-results img, .archive-card img');
    else{
      const slug=path.split('/')[0];
      try{const meta=JSON.parse(getText(`${slug}/article.json`)||'null');if(meta?.image)image={src:PUBLIC+slug+'/'+meta.image};}catch{}
      if(!image)image=doc.querySelector('article img');
    }
    if(image){const im=el('img','ffq-fallback-image');const val=image.getAttribute?.('src')||image.src;const local=resolvePath(val,path);im.src=local?findAsset(local):val;im.alt='Cover image preview';area.append(im);}
    const excerpt=doc.querySelector('article p')?.textContent?.trim();if(excerpt)area.append(el('p','ffq-fallback-summary',excerpt.slice(0,600)));
    area.append(el('p','ffq-muted','Quick preview shows cover and text only. Full layout and popup interactions need browser regression testing.'));
  }
  $('ffq-preview-fallback-toggle').addEventListener('click',()=>{
    const fallback=$('ffq-preview-fallback'),frame=$('ffq-preview-frame');
    fallback.hidden=!fallback.hidden;frame.hidden=!fallback.hidden;
    $('ffq-preview-fallback-toggle').textContent=fallback.hidden?'Show quick preview if the page is blank':'Show full page preview';
  });

  function preparePreview(){
    const pages=new Set(['index.html']);for(const file of files)if(/^[\w-]+\/index\.html$/.test(file.path))pages.add(file.path);
    const select=$('ffq-preview-page');select.replaceChildren();for(const p of pages){const op=document.createElement('option');op.value=p;op.textContent=p==='index.html'?'Homepage':p.replace('/index.html','').replace(/-/g,' ');select.append(op);}
    select.value=[...pages].find(p=>p!=='index.html')||'index.html';
  }
  $('ffq-open-preview').addEventListener('click',()=>{
    $('ffq-preview-theme').value=document.documentElement.dataset.theme==='dark'?'dark':'light';
    $('ffq-preview-width').value=innerWidth<720?'mobile':'desktop';
    $('ffq-preview-dialog').showModal();renderPreview();
  });
  $('ffq-preview-close').addEventListener('click',()=>{$('ffq-preview-dialog').close();$('ffq-preview-frame').removeAttribute('srcdoc');});
  $('ffq-preview-dialog').addEventListener('click',e=>{if(e.target===$('ffq-preview-dialog'))$('ffq-preview-dialog').close();});
  for(const id of ['ffq-preview-page','ffq-preview-width','ffq-preview-theme'])$(id).addEventListener('change',renderPreview);

  // Focused textual diff against an immutable compared Git revision, when available.
  const textExt=/\.(?:html|css|js|json|md|txt|xml|yml|yaml|svg)$/i;
  function prepareDiff(){const select=$('ffq-diff-file');select.replaceChildren();const choices=files.filter(f=>textExt.test(f.path)&&f.bytes.length<MAX_TEXT&&f.status!=='unchanged');
    for(const f of choices){const opt=document.createElement('option');opt.value=f.path;opt.textContent=`${f.status}: ${f.path}`;select.append(opt);}
    $('ffq-diff-note').textContent=choices.length?`${choices.length} readable text file(s). Binary files are listed in the standard review above.`:'No changed text files found.';
  }
  function readableLines(text){return text.replace(/></g,'>\n<').replace(/;(?=\S)/g,';\n').split(/\r?\n/).filter(Boolean);}
  async function showDiff(){
    const path=$('ffq-diff-file').value;if(!path)return;
    const out=$('ffq-diff-output');out.textContent='Loading comparison…';
    const newest=getText(path)||'';let previous='';let compareNote='';
    if(compared&&baselineSha&&byPath.get(path)?.status==='changed'){
      try{const url=`https://raw.githubusercontent.com/filmmicfoundations/filmmicfoundations.github.io/${encodeURIComponent(baselineSha)}/${path.split('/').map(encodeURIComponent).join('/')}`;
        const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(`HTTP ${r.status}`);previous=await r.text();
        if(previous.length>MAX_TEXT)throw Error('Previous version too large.');
      }catch(e){compareNote=`Previous revision unavailable (${e.message}). Showing the ZIP version only.`;}
    }else compareNote='Previous revision is unavailable until GitHub comparison completes, or this file is new.';
    $('ffq-diff-note').textContent=compareNote||`Comparing with GitHub revision ${baselineSha.slice(0,10)}.`;
    if(!previous){out.textContent=readableLines(newest).slice(0,90).map(l=>'+ '+l).join('\n')+'\n…';return;}
    const oldLines=readableLines(previous),newLines=readableLines(newest);
    // Bounded, non-quadratic focused diff: shared prefix and suffix plus changed center.
    let first=0;while(first<oldLines.length&&first<newLines.length&&oldLines[first]===newLines[first])first++;
    let a=oldLines.length-1,b=newLines.length-1;while(a>=first&&b>=first&&oldLines[a]===newLines[b]){a--;b--;}
    const prefix=oldLines.slice(Math.max(0,first-5),first).map(l=>'  '+l);
    const removed=oldLines.slice(first,Math.min(a+1,first+120)).map(l=>'- '+l);
    const added=newLines.slice(first,Math.min(b+1,first+120)).map(l=>'+ '+l);
    const suffix=newLines.slice(b+1,b+7).map(l=>'  '+l);
    out.textContent=[`Focused difference near line ${first+1} (showing up to 120 lines of each changed region).`,...prefix,...removed,...added,...suffix].join('\n')||'Identical text';
  }
  $('ffq-open-diff').addEventListener('click',()=>{$('ffq-diff-panel').hidden=false;$('ffq-diff-panel').open=true;showDiff();$('ffq-diff-panel').scrollIntoView({behavior:'smooth',block:'nearest'});});
  $('ffq-diff-file').addEventListener('change',showDiff);

  // Read-only health checks of the currently published site (not the uploaded ZIP).
  // Progress advances only after a network request actually completes. The number
  // of sampled assets becomes known after the media manifest has loaded.
  const healthButton=$('ffq-refresh-health');
  const healthPanel=document.querySelector('.ffq-surface-health');
  const healthProgress=el('div','ffq-health-progress');
  healthProgress.id='ffq-health-progress';healthProgress.hidden=true;
  const progressHeading=el('div','ffq-health-progress-head');
  const progressHeadingMain=el('div','ffq-health-progress-title');
  const progressDot=el('span','ffq-health-progress-dot');progressDot.setAttribute('aria-hidden','true');
  const progressTitle=el('strong','','Checking published website');
  progressHeadingMain.append(progressDot,progressTitle);
  const progressCount=el('span','ffq-health-progress-count','Preparing…');
  progressHeading.append(progressHeadingMain,progressCount);
  const progressTrack=el('div','ffq-health-progress-track');
  progressTrack.setAttribute('role','progressbar');progressTrack.setAttribute('aria-label','Published website health check');
  progressTrack.setAttribute('aria-valuemin','0');progressTrack.setAttribute('aria-valuemax','100');
  const progressFill=el('span','ffq-health-progress-fill');progressTrack.append(progressFill);
  const progressDetail=el('p','ffq-health-progress-detail','Loading published media inventory…');
  progressDetail.setAttribute('role','status');progressDetail.setAttribute('aria-live','polite');
  healthProgress.append(progressHeading,progressTrack,progressDetail);
  healthPanel?.insertBefore(healthProgress,$('ffq-health-results'));
  let healthRunning=false;
  function setHealthProgress(detail,done,total){
    progressDetail.textContent=detail;
    if(!total){
      healthProgress.classList.add('is-indeterminate');
      progressTrack.removeAttribute('aria-valuenow');
      progressCount.textContent='Connecting…';
      progressFill.style.width='28%';
      return;
    }
    healthProgress.classList.remove('is-indeterminate');
    const percent=Math.round(100*done/total);
    progressFill.style.width=percent+'%';
    progressTrack.setAttribute('aria-valuenow',String(percent));
    progressCount.textContent=`${done} of ${total} requests`;
  }
  async function fetchLive(path,method='GET'){
    const root=location.origin==='null'?PUBLIC:location.origin+'/';
    const url=new URL(path,root);url.searchParams.set('ff_check',Date.now());
    const r=await fetch(url,{cache:'no-store',method,signal:AbortSignal.timeout(9000)});
    if(!r.ok)throw Error(`${path}: HTTP ${r.status}`);return r;
  }
  async function refreshHealth(){
    if(healthRunning)return;
    healthRunning=true;healthButton.disabled=true;healthButton.setAttribute('aria-busy','true');
    const originalButtonLabel=healthButton.textContent;
    healthButton.textContent='Checking…';
    healthProgress.hidden=false;
    healthProgress.classList.remove('is-complete','is-warning');
    progressTitle.textContent='Checking published website';
    $('ffq-health-results').replaceChildren();
    let completed=0,total=0;
    setHealthProgress('Loading published media inventory…',0,0);
    const checks=[];let articleCount=0,assetsTested=0,liveStatus='Unverified';
    try{
      try{
        const json=await (await fetchLive('media-manifest.json')).json();
        if(!json||!json.articles)throw Error('No media inventory found.');
        liveManifest=json;articleCount=Object.keys(json.articles).length;
        checks.push(check('pass','Media manifest available',`${articleCount} article records returned from the published site.`));
        const assets=[];
        for(const [slug,data] of Object.entries(json.articles)){
          if(data.cover)assets.push(`${slug}/${data.cover}`);
          if(data.pdf?.[0]?.path)assets.push(`${slug}/${data.pdf[0].path}`);
          for(const im of (data.preview||[]).slice(0,2))assets.push(`${slug}/${im.path}`);
        }
        // Manifest, each sampled asset, the homepage and GitHub Actions.
        total=assets.length+3;completed++;
        setHealthProgress(assets.length?`Verifying media files (0 of ${assets.length})…`:'Checking homepage availability…',completed,total);
        const failures=[];
        for(const path of assets){
          try{await fetchLive(path,'HEAD');assetsTested++;}
          catch(e){failures.push(path);}
          completed++;
          setHealthProgress(`Verifying media files (${completed-1} of ${assets.length})…`,completed,total);
        }
        checks.push(check(failures.length?'error':'pass',failures.length?`${failures.length} missing sampled assets`:`${assetsTested} sampled assets reachable`,failures.length?failures.slice(0,5).join(', '):'Verified on the live website; full image inventory was not downloaded.'));
        populateInspector(json);
      }catch(e){
        // The manifest request was attempted, but prevented an accurate asset count.
        total=3;completed=1;
        checks.push(check('unknown','Media manifest unavailable',e.message+' This may indicate an older deployment or a network restriction.'));
      }
      setHealthProgress('Checking published homepage…',completed,total);
      try{
        await fetchLive('index.html','HEAD');checks.push(check('pass','Homepage reachable','Published homepage returned successfully.'));
      }catch(e){checks.push(check('error','Homepage unreachable',e.message));}
      completed++;setHealthProgress('Checking latest GitHub deployment…',completed,total);
      try{
        const r=await fetch('https://api.github.com/repos/filmmicfoundations/filmmicfoundations.github.io/actions/runs?per_page=8',{cache:'no-store',headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(9000)});
        if(!r.ok)throw Error(`GitHub API HTTP ${r.status}`);
        const data=await r.json();const run=(data.workflow_runs||[]).find(x=>x.name?.toLowerCase().includes('deploy')||x.path?.includes('deploy'))||(data.workflow_runs||[])[0];
        if(run){liveStatus=run.status==='completed'&&run.conclusion==='success'?'Passed':run.status==='completed'?'Failed':'In progress';
          checks.push(check(liveStatus==='Passed'?'pass':liveStatus==='Failed'?'error':'warn',`Latest workflow: ${liveStatus}`,`${run.name||'Workflow'} · ${run.html_url||'GitHub Actions'} · ${run.created_at||''}`));}
        else checks.push(check('unknown','GitHub deployment','No recent workflow run returned.'));
      }catch(e){checks.push(check('unknown','GitHub Actions status unavailable',e.message));}
      completed++;
      checks.push(check('unknown','Off-site links and video','Browser cannot reliably validate external media due to third-party restrictions.'));
      checks.push(check('unknown','PDF layout parity','Rendered figure alignment requires a PDF/browser regression run.'));
      const metrics=$('ffq-health-metrics').children;
      metrics[0].querySelector('strong').textContent=articleCount||'—';
      metrics[1].querySelector('strong').textContent=assetsTested||'—';
      metrics[2].querySelector('strong').textContent=liveStatus;
      renderChecks($('ffq-health-results'),checks);
      healthProgress.classList.add('is-complete');
      const errors=checks.filter(x=>x.state==='error').length;
      if(errors)healthProgress.classList.add('is-warning');
      progressTitle.textContent=errors?'Health check found issues':'Health check complete';
      setHealthProgress(errors?`${errors} check${errors===1?'':'s'} need attention. See results below.`:`Finished ${total} network checks. See results below.`,completed,total);
    }finally{
      healthRunning=false;healthButton.disabled=false;healthButton.removeAttribute('aria-busy');
      healthButton.textContent=originalButtonLabel;
    }
  }
  healthButton.addEventListener('click',refreshHealth);
  $('dev-section-health').addEventListener('toggle',()=>{if($('dev-section-health').open&&!liveManifest)refreshHealth();});

  // Share the archive filter's choice/menu visual language. Keep the native
  // select as the data source so the media inspector still uses change events.
  const inspectorSelect=$('ffq-article-select');
  const inspectorControl=inspectorSelect?.closest('.ffq-inspector-controls');
  const inspectorChoices=el('div','ff-choice ffq-inspector-choice');
  const inspectorTrigger=el('button','ff-choice-trigger');
  inspectorTrigger.type='button';inspectorTrigger.id='ffq-article-trigger';
  inspectorTrigger.setAttribute('aria-haspopup','listbox');inspectorTrigger.setAttribute('aria-expanded','false');
  inspectorTrigger.setAttribute('aria-label','Choose an article');
  const inspectorValue=el('span','ffq-inspector-choice-value','Choose an article');
  const inspectorArrow=el('span','ff-choice-arrow','⌄');inspectorArrow.setAttribute('aria-hidden','true');
  inspectorTrigger.append(inspectorValue,inspectorArrow);
  const inspectorMenu=el('div','ff-choice-menu');inspectorMenu.id='ffq-article-menu';
  inspectorMenu.setAttribute('role','listbox');inspectorMenu.setAttribute('aria-label','Articles');
  inspectorMenu.hidden=true;
  inspectorTrigger.setAttribute('aria-controls',inspectorMenu.id);
  inspectorChoices.append(inspectorTrigger,inspectorMenu);
  inspectorControl?.append(inspectorChoices);
  inspectorSelect.classList.add('ffq-inspector-native-select');
  inspectorSelect.tabIndex=-1;inspectorSelect.setAttribute('aria-hidden','true');
  const inspectorLabel=inspectorControl?.querySelector('label[for="ffq-article-select"]');
  inspectorValue.id='ffq-article-current';
  if(inspectorLabel){
    inspectorLabel.id='ffq-article-label';
    inspectorTrigger.setAttribute('aria-labelledby',inspectorLabel.id+' '+inspectorValue.id);
  }
  const reduceInspectorMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let inspectorOpen=false,inspectorAnimation=null;
  function syncInspectorChoice(){
    inspectorValue.textContent=inspectorSelect.selectedOptions[0]?.textContent||'Choose an article';
    for(const item of inspectorMenu.querySelectorAll('[role="option"]'))
      item.setAttribute('aria-selected',String(item.dataset.value===inspectorSelect.value));
  }
  function openInspectorChoice(next){
    if(inspectorOpen===next)return;
    inspectorOpen=next;
    inspectorTrigger.setAttribute('aria-expanded',String(next));
    inspectorAnimation?.cancel();inspectorAnimation=null;
    if(next)inspectorMenu.hidden=false;
    if(reduceInspectorMotion.matches){inspectorMenu.hidden=!next;return;}
    const animation=inspectorMenu.animate(next?[
      {opacity:0,transform:'translateY(-5px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}
    ]:[{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(-4px) scale(.99)'}],
    {duration:next?210:125,easing:'cubic-bezier(.2,.75,.2,1)',fill:'both'});
    inspectorAnimation=animation;
    animation.onfinish=()=>{if(inspectorAnimation!==animation)return;inspectorAnimation=null;animation.cancel();if(!inspectorOpen)inspectorMenu.hidden=true;};
  }
  function rebuildInspectorChoices(){
    openInspectorChoice(false);
    inspectorMenu.replaceChildren();
    for(const option of inspectorSelect.options){
      const item=el('button','',option.textContent);item.type='button';
      item.dataset.value=option.value;item.setAttribute('role','option');
      item.addEventListener('click',()=>{
        inspectorSelect.value=option.value;
        inspectorSelect.dispatchEvent(new Event('change',{bubbles:true}));
        openInspectorChoice(false);inspectorTrigger.focus({preventScroll:true});
      });
      inspectorMenu.append(item);
    }
    syncInspectorChoice();
  }
  inspectorTrigger.addEventListener('click',()=>openInspectorChoice(!inspectorOpen));
  inspectorLabel?.addEventListener('click',event=>{event.preventDefault();inspectorTrigger.focus({preventScroll:true});openInspectorChoice(true);});
  inspectorSelect.addEventListener('change',syncInspectorChoice);
  inspectorChoices.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&inspectorOpen){event.preventDefault();openInspectorChoice(false);inspectorTrigger.focus({preventScroll:true});return;}
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();
    if(!inspectorOpen)openInspectorChoice(true);
    const items=[...inspectorMenu.querySelectorAll('[role="option"]')];
    if(!items.length)return;
    const current=items.indexOf(document.activeElement);
    const selected=items.findIndex(i=>i.dataset.value===inspectorSelect.value);
    let target=current<0?Math.max(selected,0):current;
    if(event.key==='Home')target=0;
    else if(event.key==='End')target=items.length-1;
    else if(current>=0)target=(current+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;
    else if(target===0 && items.length>1)target=1;
    items[target].focus({preventScroll:true});
  });
  document.addEventListener('pointerdown',event=>{if(inspectorOpen&&!inspectorChoices.contains(event.target)&&event.target!==inspectorLabel)openInspectorChoice(false);});
  rebuildInspectorChoices();

  // Media inspector: one click to inspect the source/preview/PDF asset manifest.
  function populateInspector(data){
    const select=$('ffq-article-select');const prior=select.value;select.replaceChildren();
    const prompt=el('option','','Choose an article');prompt.value='';select.append(prompt);
    for(const slug of Object.keys(data.articles).sort()){
      const opt=el('option','',slug.replaceAll('-',' '));opt.value=slug;select.append(opt);
    }
    if(data.articles[prior])select.value=prior;
    rebuildInspectorChoices();
    showArticle();
  }
  function showArticle(){
    const slug=$('ffq-article-select').value;
    const area=$('ffq-article-result');area.replaceChildren();
    if(!slug){area.append(el('p','ffq-empty-state','Choose an article to preview its cover, PDFs, figure counts, and documented media.'));return;}
    if(!liveManifest?.articles[slug]){area.append(el('p','ffq-empty-state','That article is not available in the current live media manifest. Run the health check again to refresh the inventory.'));return;}
    const data=liveManifest.articles[slug];
    const stats=el('div','ffq-article-stats');
    for(const [name,val] of [['Media assets',data.media?.length??0],['Preview stills',data.preview?.length??0],['Viewable figures',data.figures?.viewable_film_stills??'—'],['PDFs',data.pdf?.length??0]]){
      const n=el('div');n.append(el('strong','',String(val)),el('small','',name));stats.append(n);
    }
    area.append(stats);
    const actions=el('div','ffq-actions');
    const visit=el('a','dev-button outline','Open article ↗');visit.href=PUBLIC+slug+'/';visit.target='_blank';visit.rel='noopener noreferrer';actions.append(visit);
    for(const pdf of data.pdf||[]){const a=el('a','dev-button outline','Open PDF ↗');a.href=PUBLIC+slug+'/'+pdf.path;a.target='_blank';a.rel='noopener noreferrer';actions.append(a);}
    area.append(actions);
    const caption=el('p','ffq-muted','Preview images are shown below. Original analytical diagrams are not used as previews.');area.append(caption);
    const gallery=el('div','ffq-media-gallery');
    const views=data.preview?.length?data.preview:[{path:data.cover,caption:'Cover'}];
    const dup=views.map(v=>v.path).filter((v,i,arr)=>arr.indexOf(v)!==i);
    if(dup.length)area.append(el('p','ffq-warning',`Repeated preview paths: ${[...new Set(dup)].join(', ')}`));
    for(const item of views){const card=el('figure','ffq-media-card');const image=el('img');image.src=PUBLIC+slug+'/'+item.path;image.loading='lazy';image.alt=item.caption||'Film still';const fc=el('figcaption','',item.caption||item.path);card.append(image,fc);gallery.append(card);}
    area.append(gallery);
    const note=el('p','ffq-muted',`${data.media?.length??0} documented stills/assets; ${data.figures?.original_image_diagrams??0} original image diagrams. Media inventory records paths and hashes; it cannot confirm a particular still supports its neighboring paragraph or that PDF placement matches.`);area.append(note);
  }
  $('ffq-article-select').addEventListener('change',showArticle);
})();
