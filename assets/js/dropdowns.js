/* Filmmic Foundations · shared dropdown motion for in-flow and mobile section menus.
   All native <details> elements remain keyboard-usable without JavaScript. */
(() => {
  'use strict';
  const selectors='details.mobile-contents, details.dev-advanced, details.dev-standard-details';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const state=new WeakMap();
  const OPEN=260, CLOSE=155;

  function contents(details){return Array.from(details.children).find(el=>el.tagName!=='SUMMARY')||null;}
  function set(details,expanded){
    if(!details || !details.matches(selectors))return;
    const el=contents(details);
    if(!el){details.open=expanded;return;}
    const previous=state.get(details)||{};
    if(previous.expanded===expanded && (previous.animation || details.open===expanded))return;
    const isOverlay=details.classList.contains('mobile-contents');
    if(expanded)details.open=true;
    if(reduced.matches){previous.animation?.cancel();el.style.removeProperty('overflow');details.open=expanded;state.set(details,{expanded});return;}
    let animation=previous.animation;
    if(!animation){
      const height=Math.max(el.scrollHeight,el.getBoundingClientRect().height);
      const start={opacity:0,transform:'translateY(-7px)'};
      const end={opacity:1,transform:'translateY(0)'};
      if(!isOverlay){start.height='0px';end.height=`${height}px`;el.style.overflow='hidden';}
      animation=el.animate([start,end],{duration:OPEN,easing:'cubic-bezier(.22,.77,.24,1)',fill:'both'});
      if(!expanded){animation.pause();animation.currentTime=OPEN;}
    }
    const item={expanded,animation};state.set(details,item);
    animation.playbackRate=expanded?1:-(OPEN/CLOSE);
    animation.play();
    animation.onfinish=()=>{
      if(state.get(details)!==item)return;
      details.open=item.expanded;
      animation.cancel();
      el.style.removeProperty('overflow');
      state.set(details,{expanded:item.expanded,animation:null});
    };
  }
  function init(details){
    if(state.has(details))return;
    state.set(details,{expanded:details.open,animation:null});
    const summary=details.querySelector(':scope > summary');
    if(!summary)return;
    summary.addEventListener('click',event=>{event.preventDefault();set(details,!(state.get(details)?.expanded));});
  }
  document.querySelectorAll(selectors).forEach(init);
  window.FFDropdowns={open:details=>set(details,true),close:details=>set(details,false),toggle:details=>set(details,!(state.get(details)?.expanded)),refresh:()=>document.querySelectorAll(selectors).forEach(init)};
})();
