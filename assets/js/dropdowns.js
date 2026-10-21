/* Filmmic Foundations · shared, reversible disclosure motion.
   Never animate the page's scroll position, only the disclosure content. */
(() => {
  'use strict';
  const selector='details.mobile-contents, details.dev-advanced, details.dev-standard-details, details.dev-main-accordion, details.dev-version-more';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const active=new WeakMap();
  const OPEN_MS=255, CLOSE_MS=155;
  const easing='cubic-bezier(.22,.75,.22,1)';
  function panel(details){return details.querySelector(':scope > .dev-accordion-body, :scope > .dev-version-more-content')||[...details.children].find(x=>x.tagName!=='SUMMARY')}
  function toggle(details,open){
    const body=panel(details);if(!body){details.open=open;return}
    const prior=active.get(details)||{open:details.open,animation:null};
    if(prior.open===open)return;
    const overlay=details.classList.contains('mobile-contents');
    const current=prior.animation;
    if(reduce.matches){current?.cancel();body.style.removeProperty('height');body.style.removeProperty('overflow');details.open=open;active.set(details,{open});return}
    let animation=current;
    if(!animation){
      // Critical: force the closed height BEFORE toggling the details element.
      // Without this, the browser lays out the expanded panel for a frame and
      // abruptly jumps the page before the animation can start.
      const wasOpen=details.open;
      if(!wasOpen){body.style.height='0px';body.style.overflow='hidden';details.open=true}
      let height=Math.max(body.scrollHeight,body.getBoundingClientRect().height,1);
      const maxHeight=parseFloat(getComputedStyle(body).maxHeight);
      if(Number.isFinite(maxHeight)&&maxHeight>0)height=Math.min(height,maxHeight);
      if(!overlay && wasOpen){body.style.height=height+'px';body.style.overflow='hidden'}
      const first={opacity:0,transform:'translateY(-6px)'};
      const last={opacity:1,transform:'translateY(0)'};
      if(!overlay){first.height='0px';last.height=height+'px'}
      animation=body.animate([first,last],{duration:OPEN_MS,easing,fill:'both'});
      if(!open){animation.pause();animation.currentTime=OPEN_MS}
    }
    const state={open,animation};active.set(details,state);
    animation.playbackRate=open?1:-(OPEN_MS/CLOSE_MS);
    animation.play();
    animation.onfinish=()=>{
      if(active.get(details)!==state)return;
      // Avoid scroll anchoring changing the viewport after collapsing.
      animation.cancel();
      body.style.removeProperty('height');body.style.removeProperty('overflow');
      details.open=state.open;
      active.set(details,{open:state.open,animation:null});
    };
  }
  function init(details){
    if(active.has(details))return;
    active.set(details,{open:details.open,animation:null});
    const summary=details.querySelector(':scope > summary'),body=panel(details);if(!summary)return;
    summary.addEventListener('click',e=>{e.preventDefault();toggle(details,!active.get(details)?.open)});
    if(details.id){body.id=details.id+'-content';summary.setAttribute('aria-controls',body.id)}
  }
  document.querySelectorAll(selector).forEach(init);
  window.FFDropdowns={
    open:d=>toggle(d,true),close:d=>toggle(d,false),toggle:d=>toggle(d,!active.get(d)?.open),
    refresh:()=>document.querySelectorAll(selector).forEach(init)
  };
})();
