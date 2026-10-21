/* Filmmic Foundations · shared, anonymous reading preferences.
   No cookies, no remote calls, no framework, no user identifiers.
   Preferences and optional reading positions stay in this browser only. */
(() => {
  'use strict';
  const root = document.documentElement;
  const STORE = 'filmmic-foundations-settings';
  const LEGACY_THEME = 'filmmic-foundations-theme';
  const POSITIONS = 'filmmic-foundations-reading-positions';
  const values = {
    theme:['light','dark','system'], text:['small','default','large','extra'],
    width:['narrow','standard','wide'], leading:['compact','standard','relaxed'],
    contrast:['off','on'], motion:['off','subtle','full'],
    focus:['off','on'], progress:['off','on'], captions:['off','on'],
    remember:['off','on'], contents:['collapsed','expanded'], related:['off','on'],
    citation:['mla','apa','chicago','ieee'], pdf:['new-tab','download'],
    sort:['newest','oldest','az','za'], archive:['editorial','grid','list','compact'],
    viewer:['single','gallery'], galleryMotion:['off','on'], slideshow:['off','on'], markers:['off','on'],
    media:['ask','auto'], shortcuts:['off','on'], external:['direct','confirm']
  };
  const DEFAULT = Object.freeze({
    theme:'light', text:'default', width:'standard', leading:'standard',
    contrast:'off', motion:'subtle', focus:'off', progress:'on', captions:'on',
    remember:'off', contents:'collapsed', related:'on', citation:'mla',
    pdf:'new-tab', sort:'newest', archive:'editorial', viewer:'single',
    galleryMotion:'on', slideshow:'off', markers:'on', media:'auto', shortcuts:'on', external:'direct'
  });
  const sections = [
    {id:'appearance',label:'Appearance',symbol:'appearance',groups:[
      {name:'Color & typography',fields:[
        ['theme','Color theme','Light is the default; System follows your device.',[['light','Light'],['dark','Dark'],['system','System']]],
        ['text','Text size','Adjust article and editorial text.',[['small','Small'],['default','Standard'],['large','Large'],['extra','Extra large']]],
        ['width','Reading width','Change the maximum width of long-form papers.',[['narrow','Narrow'],['standard','Standard'],['wide','Wide']]],
        ['leading','Line spacing','Fine-tune the space between lines.',[['compact','Compact'],['standard','Standard'],['relaxed','Relaxed']]]
      ]},
      {name:'Comfort & motion',fields:[
        ['contrast','High contrast','Increase text contrast and underline research links.'],
        ['motion','Animation intensity','Off follows accessibility needs; Subtle retains the site design.',[['off','Off'],['subtle','Subtle'],['full','Full']]]
      ]}
    ]},
    {id:'reading',label:'Reading',symbol:'book',groups:[
      {name:'Distraction-free reading',fields:[
        ['focus','Focus mode','Hide the research sidebar and related-reading cards.'],
        ['progress','Reading progress','Show the thin progress indicator on papers and About.'],
        ['captions','Image captions','Show the descriptive captions beneath article stills.']
      ]},
      {name:'Navigation & progress',fields:[
        ['remember','Remember my place','Optional local bookmark; offers Resume when you return.'],
        ['contents','Mobile contents menu','Choose whether “In this paper” starts expanded.',[['collapsed','Collapsed'],['expanded','Expanded']]],
        ['related','Related research','Show automatic recommendations when similar papers exist.']
      ]}
    ]},
    {id:'research',label:'Research',symbol:'research',groups:[
      {name:'Academic tools',fields:[
        ['citation','Preferred citation style','Default style shown in article citation tools.',[['mla','MLA 9'],['apa','APA 7'],['chicago','Chicago'],['ieee','IEEE']]],
        ['pdf','PDF behavior','Open in a new tab or save the PDF to your device.',[['new-tab','Open new tab'],['download','Download file']]],
        ['markers','Inline citation markers','Show source numbers within articles; references remain available.']
      ]},
      {name:'Article discovery',fields:[
        ['archive','Archive layout','Preferred display when visiting the homepage.',[['editorial','Editorial'],['grid','Gallery'],['list','List'],['compact','Compact']]],
        ['sort','Archive sorting','Default order for the research archive.',[['newest','Newest first'],['oldest','Oldest first'],['az','Title A–Z'],['za','Title Z–A']]]
      ]}
    ]},
    {id:'general',label:'General',symbol:'controls',groups:[
      {name:'Images & media',fields:[
        ['viewer','Image viewer opens in','Start with a single image or the full thumbnail gallery.',[['single','Single image'],['gallery','Gallery']]],
        ['galleryMotion','Photo transitions','Animate movement between stills in the image viewer.'],
        ['slideshow','Automatic slideshow','Advance through single images every five seconds (off by default).'],
        ['media','Embedded video','Load YouTube automatically (shares your request with YouTube), or ask first.',[['auto','Load automatically'],['ask','Ask first']]]
      ]},
      {name:'Navigation & privacy',fields:[
        ['shortcuts','Keyboard shortcut','Allow Alt+S or ? to open Reading Preferences.'],
        ['external','External links','Optionally confirm before opening third-party websites.',[['direct','Open normally'],['confirm','Ask first']]]
      ]}
    ]}
  ];
  function safeGet(key){try{return localStorage.getItem(key)}catch(_){return null}}
  function safeSet(key,value){try{localStorage.setItem(key,value)}catch(_){}}
  function safeRemove(key){try{localStorage.removeItem(key)}catch(_){}}
  function parseJSON(raw, fallback){try{return JSON.parse(raw)||fallback}catch(_){return fallback}}
  function normalize(source){
    const normalized={...DEFAULT};
    if(source && typeof source==='object'){
      for(const key of Object.keys(DEFAULT)){
        const value=source[key];
        if(values[key].includes(value)) normalized[key]=value;
      }
    }
    return normalized;
  }
  const stored=parseJSON(safeGet(STORE),{});
  if(!stored.theme){const old=safeGet(LEGACY_THEME);if(old==='dark'||old==='light')stored.theme=old}
  let settings=normalize(stored);
  const systemDark=matchMedia('(prefers-color-scheme: dark)');
  const systemReduce=matchMedia('(prefers-reduced-motion: reduce)');
  const isReduced=()=>systemReduce.matches || settings.motion==='off';
  function effectiveTheme(){return settings.theme==='system'?(systemDark.matches?'dark':'light'):settings.theme}
  function publish(){window.ffPreferences={...settings};window.dispatchEvent(new CustomEvent('ff:settings-applied',{detail:{...settings}}))}
  let lastContents=null;
  function apply(){
    root.dataset.theme=effectiveTheme();
    for(const key of Object.keys(DEFAULT).filter(k=>k!=='theme')){
      root.dataset['ff'+key[0].toUpperCase()+key.slice(1)]=settings[key];
    }
    document.querySelectorAll('.mobile-contents').forEach(menu=>{
      if(lastContents!==settings.contents){menu.open=settings.contents==='expanded'}
    });
    lastContents=settings.contents;
    applyPdf();
    applyMedia();
    publish();
  }
  let statusTimeout;
  function notice(text){const el=document.getElementById('ff-settings-status');if(!el)return;el.textContent=text;clearTimeout(statusTimeout);statusTimeout=setTimeout(()=>{el.textContent='Changes saved locally';},2000)}
  function save(next){
    const normalized=normalize(next);
    if(Object.keys(DEFAULT).every(k=>settings[k]===normalized[k]))return;
    const themeChanged=settings.theme!==normalized.theme;
    if(themeChanged && !isReduced()){root.classList.add('ff-theme-animating');setTimeout(()=>root.classList.remove('ff-theme-animating'),540)}
    settings=normalized;
    safeSet(STORE,JSON.stringify(settings));
    safeSet(LEGACY_THEME,effectiveTheme());
    apply();notice('Preference saved');
  }
  const srcIcons={close:'<path d="M5 5l14 14M19 5 5 19"/>',gear:'<circle cx="12" cy="12" r="3"/>'};
  const dialog=document.createElement('dialog');
  dialog.className='ff-settings-dialog';dialog.id='ff-settings-dialog';
  dialog.setAttribute('aria-labelledby','ff-settings-heading');
  const panels=sections.map((section,index)=>`<section class="ff-settings-panel" id="ff-settings-${section.id}" role="tabpanel" aria-labelledby="ff-tab-${section.id}" ${index?'hidden':''}>${section.groups.map(group=>`<div class="ff-settings-section"><h3>${group.name}</h3>${group.fields.map(([key,title,desc,choices])=>`<div class="ff-pref-row"><div class="ff-pref-text"><label for="ff-pref-${key}">${title}</label><p id="ff-pref-help-${key}">${desc}</p></div>${choices?`<select id="ff-pref-${key}" name="${key}" aria-describedby="ff-pref-help-${key}">${choices.map(([v,label])=>`<option value="${v}">${label}</option>`).join('')}</select>`:`<input type="checkbox" id="ff-pref-${key}" name="${key}" aria-describedby="ff-pref-help-${key}">`}</div>`).join('')}</div>`).join('')}${section.id==='general'?`<div class="ff-pref-information"><strong>Privacy by design</strong>Preferences and optional reading positions are stored only in your browser. No account is required, and the settings panel does not transmit them to Filmmic Foundations. External video services may receive requests when you choose to load them.</div><div class="ff-pref-actions"><button type="button" class="ff-pref-action" id="ff-clear-positions">Clear saved reading positions</button><button type="button" class="ff-pref-action ff-danger" id="ff-reset-settings">Reset all preferences</button></div>`:''}</section>`).join('');
  const tabIcons={appearance:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18Z"/>',book:'<path d="M12 6c-3.5-2-7-2-10-1v14c3-1 6.5-1 10 1 3.5-2 7-2 10-1V5c-3-1-6.5-1-10 1Zm0 0v14"/>',research:'<path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/>',controls:'<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="var(--ff-cream,#fcfcfa)"/><circle cx="16" cy="12" r="2" fill="var(--ff-cream,#fcfcfa)"/><circle cx="10" cy="17" r="2" fill="var(--ff-cream,#fcfcfa)"/>'};
  dialog.innerHTML=`<div class="ff-settings-shell"><div class="ff-settings-top"><div><span class="ff-settings-kicker">FILMMIC FOUNDATIONS / READER SETTINGS</span><h2 id="ff-settings-heading">Settings</h2><p class="ff-settings-intro">Adjust the reading and research experience. Preferences save automatically.</p></div><button type="button" class="ff-settings-dismiss" aria-label="Close settings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">${srcIcons.close}</svg></button></div><div class="ff-settings-main"><div class="ff-settings-tabs" role="tablist" aria-label="Settings categories">${sections.map((section,index)=>`<button type="button" role="tab" id="ff-tab-${section.id}" class="ff-settings-tab" aria-controls="ff-settings-${section.id}" aria-selected="${index===0}" tabindex="${index===0?0:-1}"><svg class="ff-settings-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${tabIcons[section.symbol]}</svg>${section.label}</button>`).join('')}</div><div class="ff-settings-scroll">${panels}</div></div><div class="ff-settings-bottom"><span class="ff-settings-saved" id="ff-settings-status" role="status" aria-live="polite">Changes saved locally</span><button class="ff-settings-done" type="button">Done</button></div></div>`;
  document.body.append(dialog);

  // Uniform animated choice popovers; original selects remain the form's source of truth.
  // Popovers float above the panel so changing an option never shifts page layout.
  const choiceMenus=[];
  for(const select of dialog.querySelectorAll('.ff-pref-row select')){
    const wrap=document.createElement('div');wrap.className='ff-pref-choice';
    const trigger=document.createElement('button');trigger.type='button';trigger.className='ff-pref-choice-button';
    trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
    trigger.id=select.id+'-button';
    const prefLabel=select.closest('.ff-pref-row')?.querySelector('label');
    if(prefLabel)prefLabel.htmlFor=trigger.id;
    trigger.setAttribute('aria-label',prefLabel?.textContent||'Choose preference');
    const menu=document.createElement('div');menu.className='ff-pref-choice-list';menu.setAttribute('role','listbox');menu.hidden=true;
    for(const option of select.options){
      const item=document.createElement('button');item.type='button';item.dataset.value=option.value;
      item.setAttribute('role','option');item.textContent=option.textContent;
      item.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));close();trigger.focus({preventScroll:true})});
      menu.appendChild(item);
    }
    let opened=false,anim=null;const DURATION=210;
    const frames=[{opacity:0,transform:'translateY(-5px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}];
    function sync(){trigger.textContent=select.selectedOptions[0]?.textContent||'Choose';menu.querySelectorAll('[role=option]').forEach(item=>item.setAttribute('aria-selected',String(item.dataset.value===select.value)))}
    function setOpen(next){
      if(next===opened)return;opened=next;trigger.setAttribute('aria-expanded',String(next));
      if(next)menu.hidden=false;menu.style.pointerEvents=next?'auto':'none';
      if(isReduced()){anim?.cancel();anim=null;menu.hidden=!next;return}
      if(!anim){anim=menu.animate(frames,{duration:DURATION,easing:'cubic-bezier(.22,.8,.22,1)',fill:'both'});if(!next){anim.pause();anim.currentTime=DURATION}}
      const current=anim;current.playbackRate=next?1:-(DURATION/125);current.play();
      current.onfinish=()=>{if(anim!==current)return;menu.hidden=!opened;current.cancel();anim=null};
    }
    function close(){setOpen(false)}
    choiceMenus.push({close,trigger,menu});
    trigger.addEventListener('click',()=>{if(opened)close();else{choiceMenus.forEach(other=>other.close());wrap.classList.toggle('ff-choice-above',trigger.getBoundingClientRect().bottom>dialog.getBoundingClientRect().bottom-240);setOpen(true);menu.querySelector('[aria-selected=true]')?.focus({preventScroll:true})}});
    wrap.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close();trigger.focus({preventScroll:true})}
      if(!opened)return;
      const items=[...menu.querySelectorAll('[role=option]')],index=items.indexOf(document.activeElement);
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();items[(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus({preventScroll:true})}
    });
    select.classList.add('ff-pref-native-select');select.insertAdjacentElement('afterend',wrap);wrap.append(trigger,menu);
    select.addEventListener('change',sync);sync();

  }
  dialog.addEventListener('click',event=>{if(!event.target.closest('.ff-pref-choice'))choiceMenus.forEach(item=>item.close())});
  dialog.querySelectorAll('.ff-settings-tab').forEach(tab=>tab.addEventListener('click',()=>choiceMenus.forEach(item=>item.close())));

  let lastTrigger=null,closing=false,closeTimer=0;
  function open(){
    if(dialog.open)return;
    lastTrigger=document.activeElement;
    closing=false;dialog.classList.remove('ff-pref-closing');
    dialog.showModal();
    dialog.querySelector('.ff-settings-dismiss').focus({preventScroll:true});
  }
  function close(){
    if(!dialog.open||closing)return;
    choiceMenus.forEach(item=>item.close());
    closing=true;
    const finish=()=>{
      clearTimeout(closeTimer);dialog.close();dialog.classList.remove('ff-pref-closing');closing=false;
      lastTrigger?.focus?.({preventScroll:true});
    };
    if(isReduced())finish();
    else{dialog.classList.add('ff-pref-closing');closeTimer=setTimeout(finish,185)}
  }
  document.querySelector('.ff-settings-toggle')?.addEventListener('click',open);
  dialog.querySelector('.ff-settings-dismiss').addEventListener('click',close);
  dialog.querySelector('.ff-settings-done').addEventListener('click',close);
  dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
  dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
  const tabs=[...dialog.querySelectorAll('[role="tab"]')];
  function setTab(id,focus=false){
    tabs.forEach(tab=>{const selected=tab.id==='ff-tab-'+id;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;if(selected&&focus)tab.focus()});
    const scroller=dialog.querySelector('.ff-settings-scroll');
    const panels=[...dialog.querySelectorAll('[role="tabpanel"]')];
    const outgoing=panels.find(el=>!el.hidden);
    const incoming=panels.find(el=>el.id==='ff-settings-'+id);
    if(outgoing===incoming)return;
    // Dialog dimensions remain stable. Only inner content crossfades; no page reflow.
    scroller.getAnimations().forEach(a=>a.cancel());
    panels.forEach(el=>el.hidden=el!==incoming);
    scroller.scrollTop=0;
    if(!isReduced())scroller.animate([{opacity:.65,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:215,easing:'cubic-bezier(.2,.75,.2,1)'});
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>setTab(tab.id.substring(7)));
    tab.addEventListener('keydown',e=>{
      if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
      e.preventDefault();let next=i;
      if(e.key==='ArrowRight')next=(i+1)%tabs.length;
      if(e.key==='ArrowLeft')next=(i-1+tabs.length)%tabs.length;
      if(e.key==='Home')next=0;
      if(e.key==='End')next=tabs.length-1;
      setTab(tabs[next].id.substring(7),true);
    });
  });
  function reflect(){
    for(const key of Object.keys(DEFAULT)){
      const input=dialog.querySelector('#ff-pref-'+key);if(!input)continue;
      if(input.type==='checkbox')input.checked=settings[key]==='on';
      else {input.value=settings[key];input.dispatchEvent(new Event('change'));}
    }
  }
  dialog.addEventListener('change',e=>{
    const input=e.target;if(!input.matches('select[name],input[name]'))return;
    const key=input.name;if(!Object.hasOwn(DEFAULT,key))return;
    const value=input.type==='checkbox'?(input.checked?'on':'off'):input.value;
    save({...settings,[key]:value});
  });
  dialog.querySelector('#ff-reset-settings').addEventListener('click',()=>{
    settings={...DEFAULT};safeSet(STORE,JSON.stringify(settings));safeSet(LEGACY_THEME,'light');
    apply();reflect();dialog.querySelectorAll('.ff-pref-native-select').forEach(input=>input.dispatchEvent(new Event('change')));notice('Defaults restored');
  });
  dialog.querySelector('#ff-clear-positions').addEventListener('click',()=>{
    safeRemove(POSITIONS);document.querySelector('.ff-resume-prompt')?.remove();notice('Reading positions cleared');
  });
  let manuallyLoadedVideo=false;
  reflect();apply();
  systemDark.addEventListener?.('change',()=>{if(settings.theme==='system'){root.dataset.theme=effectiveTheme();publish()}});
  window.addEventListener('storage',e=>{
    if(e.key===STORE){settings=normalize(parseJSON(e.newValue,{}));reflect();apply();}
    if(e.key===LEGACY_THEME && !safeGet(STORE) && ['dark','light'].includes(e.newValue)){
      settings.theme=e.newValue;reflect();apply();
    }
  });
  window.addEventListener('ff:archive-view',e=>{if(values.archive.includes(e.detail))save({...settings,archive:e.detail})});
  window.addEventListener('ff:archive-sort',e=>{if(values.sort.includes(e.detail))save({...settings,sort:e.detail})});
  window.addEventListener('ff:citation-style',e=>{if(values.citation.includes(e.detail))save({...settings,citation:e.detail})});
  document.addEventListener('keydown',e=>{
    if(settings.shortcuts!=='on'||e.defaultPrevented||e.target.closest('input,textarea,select,[contenteditable]'))return;
    if((e.altKey&&e.key.toLowerCase()==='s')||(!e.altKey&&!e.ctrlKey&&!e.metaKey&&e.key==='?')){
      e.preventDefault();if(dialog.open)close();else open();
    }
  });
  function applyPdf(){
    document.querySelectorAll('a[href]').forEach(link=>{
      const href=link.getAttribute('href');if(!href||!(/\.pdf(?:[?#]|$)/i).test(href))return;
      let url;try{url=new URL(href,location.href)}catch(_){return}
      if(url.origin!==location.origin)return;
      if(settings.pdf==='download'){
        link.removeAttribute('target');link.setAttribute('download',url.pathname.split('/').pop());
      }else{
        link.removeAttribute('download');link.setAttribute('target','_blank');link.setAttribute('rel','noopener noreferrer');
      }
    });
  }
  function applyMedia(){
    document.querySelectorAll('iframe[data-ff-embed-url]').forEach(frame=>{
      const holder=frame.closest('.video');if(!holder)return;
      let button=holder.querySelector('.ff-video-load');
      if(!button){
        button=document.createElement('button');button.type='button';button.className='ff-video-load';
        button.innerHTML='<span class="ff-video-play" aria-hidden="true">▶</span><strong>Load film from YouTube</strong><small>External media loads only when requested.</small>';
        button.addEventListener('click',()=>{manuallyLoadedVideo=true;frame.src=frame.dataset.ffEmbedUrl;holder.classList.add('ff-video-loaded')});
        holder.append(button);
      }
      const load=settings.media==='auto'||manuallyLoadedVideo;
      if(load){if(frame.getAttribute('src')!==frame.dataset.ffEmbedUrl)frame.src=frame.dataset.ffEmbedUrl;holder.classList.add('ff-video-loaded')}
      else{frame.removeAttribute('src');holder.classList.remove('ff-video-loaded')}
    });
  }
  // Optional warning, not a tracking mechanism. Never intercept links to this same site.
  const externalDialog=document.createElement('dialog');
  externalDialog.className='ff-external-dialog';externalDialog.setAttribute('aria-labelledby','ff-external-title');
  externalDialog.innerHTML='<h2 id="ff-external-title">Leaving the archive</h2><p>Open this external website?</p><p class="ff-external-host"></p><footer><button type="button" class="ff-external-cancel">Cancel</button><a class="ff-external-proceed" target="_blank" rel="noopener noreferrer">Open link ↗</a></footer>';
  document.body.append(externalDialog);
  externalDialog.querySelector('.ff-external-cancel').addEventListener('click',()=>externalDialog.close());
  externalDialog.addEventListener('click',e=>{if(e.target===externalDialog)externalDialog.close()});
  externalDialog.querySelector('.ff-external-proceed').addEventListener('click',()=>externalDialog.close());
  document.addEventListener('click',e=>{
    if(settings.external!=='confirm'||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const link=e.target.closest('a[href^="http"]');if(!link||link.closest('dialog'))return;
    let url;try{url=new URL(link.href)}catch(_){return}
    if(url.origin===location.origin||!['http:','https:'].includes(url.protocol))return;
    e.preventDefault();externalDialog.querySelector('.ff-external-host').textContent=url.hostname;
    externalDialog.querySelector('.ff-external-proceed').href=url.href;externalDialog.showModal();
  });
  // Reading positions: opt-in, stored per pathname; show a Resume button, never jump unexpectedly.
  const article=document.querySelector('article.article');
  const about=document.querySelector('.ff-about-content');
  const content=article||about;
  if(content){
    const key=location.pathname;
    const existing=parseJSON(safeGet(POSITIONS),{});
    if(settings.remember==='on'&&Number(existing[key])>250&&Number(existing[key])<document.documentElement.scrollHeight-innerHeight-150&&scrollY<100){
      const prompt=document.createElement('aside');prompt.className='ff-resume-prompt';
      prompt.innerHTML='<p>Continue where you left off in this reading?</p><button type="button" data-choice="resume">Resume</button><button type="button" data-choice="dismiss">Dismiss</button>';
      document.body.append(prompt);
      prompt.addEventListener('click',e=>{
        if(!e.target.matches('button'))return;
        if(e.target.dataset.choice==='resume')scrollTo({top:Math.min(Number(existing[key]),document.documentElement.scrollHeight-innerHeight),behavior:isReduced()?'instant':'smooth'});
        prompt.remove();
      });
    }
    let lastSaved=0;
    function storePosition(){
      if(settings.remember!=='on'||scrollY<0)return;
      const now=Date.now();if(now-lastSaved<1800)return;lastSaved=now;
      const data=parseJSON(safeGet(POSITIONS),{});data[key]=Math.round(scrollY);
      const keys=Object.keys(data);if(keys.length>60)for(const old of keys.slice(0,keys.length-60))delete data[old];
      safeSet(POSITIONS,JSON.stringify(data));
    }
    addEventListener('scroll',storePosition,{passive:true});
    addEventListener('pagehide',()=>{lastSaved=0;storePosition()});
  }
})();

/* The same floating Back to Top control on article and editorial pages.
   Never inserts into the main menu, and never appears on Home or 404. */
(() => {
  'use strict';
  const toolbar=document.querySelector('.ff-section-toolbar');
  const developer=document.body.classList.contains('ff-dev-page');
  if(!toolbar || developer)return;
  // Future articles that copied an earlier menu should also get the clean layout.
  toolbar?.querySelectorAll('.reading-tool[href="#top"],.ff-about-to-top').forEach(link=>link.remove());
  const button=document.createElement('button');
  button.type='button';
  button.className='ff-back-to-top';
  button.setAttribute('aria-label','Back to top of page');
  button.setAttribute('title','Back to top');
  button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg><span>Top</span>';
  document.body.append(button);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let scheduled=false;
  function update(){
    scheduled=false;
    const cutoff=Math.max(550,Math.floor(window.innerHeight*.82));
    const visible=window.scrollY>cutoff;
    const footer=document.querySelector('body > footer, main + footer, .site-footer');
    const safeBottom=window.innerWidth<=600?16:20;
    const footerTop=footer?.getBoundingClientRect().top ?? window.innerHeight+100;
    const neededBottom=Math.max(safeBottom,Math.round(window.innerHeight-footerTop+18));
    button.style.setProperty('--ff-floating-bottom',neededBottom+'px');
    button.classList.toggle('ff-back-to-top--visible',visible);
    button.tabIndex=visible?0:-1;
    button.setAttribute('aria-hidden',visible?'false':'true');
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update)}}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  button.addEventListener('click',()=>{
    const noMotion=motion.matches||document.documentElement.dataset.ffMotion==='off';
    window.scrollTo({top:0,behavior:noMotion?'instant':'smooth'});
  });
  update();
})();
