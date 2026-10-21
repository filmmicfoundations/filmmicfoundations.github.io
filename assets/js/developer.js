/* Filmmic Foundations developer portal: public visual gate + GitHub authorization.
 * Token is held in this tab's sessionStorage after verification; never log or embed it.
 * The public access code is not authentication. */
(() => {
  'use strict';
  const OWNER='filmmicfoundations', REPO='filmmicfoundations.github.io', BRANCH='main';
  const API=`https://api.github.com/repos/${OWNER}/${REPO}`;
  const SESSION_TOKEN_KEY='ff-dev-github-token-v1';
  const PENDING_DEPLOY_KEY='ff-dev-pending-deploy-v1';
  const DEPLOY_COMPLETED_KEY='ff-dev-deploy-completed-v1';
  const AUTO_RETURN_KEY='ff-dev-auto-return-v1';
  const DEPLOY_POLL_MS=4500;
  const MAX_ZIP=90*1024*1024, MAX_TOTAL=200*1024*1024, MAX_ENTRIES=2500;
  const $=id=>document.getElementById(id);
  let token='', archive=null, manifest=[], changes=[], baselineSha='', baselineTree='', busy=false, versions=[], connectedUser='', lastInspectionError='', justPublished=false;
  let monitorGeneration=0, monitorActive=false, reloadTimer=0;
  let currentDeploySha='', currentDeployProbe=null;

  const setStatus=(id,msg)=>{$(id).textContent=msg;};
  const trimSha=sha=>String(sha||'').slice(0,10);
  const escapeFile=p=> p.replace(/^\/+/, '');
  // Session storage is scoped to a browser tab but some browsers restore sessions.
  function saveSessionToken(value){try{if(value)sessionStorage.setItem(SESSION_TOKEN_KEY,value);else sessionStorage.removeItem(SESSION_TOKEN_KEY);}catch{ /* storage unavailable: in-memory session still works */ }}
  function loadSessionToken(){try{return sessionStorage.getItem(SESSION_TOKEN_KEY)||'';}catch{return '';}}
  let dialogCloseTimer=0;
  let dialogReturnFocus=null;
  function openTokenGuide(expired=false){
    const guide=$('dev-token-guide');
    $('dev-token-expired').hidden=!expired;
    clearTimeout(dialogCloseTimer);guide.classList.remove('is-closing');
    dialogReturnFocus=document.activeElement;
    if(!guide.open)guide.showModal();
    $('dev-token-guide-close').focus({preventScroll:true});
  }
  function closeTokenGuide(){
    const guide=$('dev-token-guide');if(!guide.open||guide.classList.contains('is-closing'))return;
    guide.classList.add('is-closing');
    const done=()=>{guide.close();guide.classList.remove('is-closing');dialogReturnFocus?.focus?.({preventScroll:true});};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)done();
    else dialogCloseTimer=setTimeout(done,170);
  }

  function cleanPath(path) {
    if(path.startsWith('/')||path.includes('\\')||/[\x00-\x1f\x7f]/.test(path)) throw Error(`Unsafe ZIP path: ${path}`);
    const bits=path.split('/');
    if(bits.some(s=>!s||s==='.'||s==='..')) throw Error(`Invalid ZIP path: ${path}`);
    if(bits.some(s=>/^\.git$|^\.env(?:\.|$)|^node_modules$|^__pycache__$|^\.DS_Store$|^\.ssh$|^\.aws$/i.test(s))) throw Error(`Private or development files cannot be uploaded: ${path}`);
    if(/\.(?:pem|key|p12|pfx|pyc)$/i.test(path)) throw Error(`Unsafe/private extension in ZIP: ${path}`);
    if(path.length>230) throw Error(`Path too long: ${path}`);
    return path;
  }

  async function api(path,{method='GET',body=null}={}){
    const headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
    if(token) headers.Authorization=`Bearer ${token}`;
    if(body!==null) headers['Content-Type']='application/json';
    let res;
    try{res=await fetch(path.startsWith('https://')?path:API+path,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:'no-store',redirect:'follow'});}
    catch(e){throw Error('Could not reach GitHub. Check your connection, browser restrictions or content blockers. '+e.message);}
    const data=await res.json().catch(()=>({}));
    if(res.status===401 && token){
      // The token cannot be used. Do not retain rejected credentials in tab storage.
      saveSessionToken('');token='';connectedUser='';
      setStatus('dev-connection-status','GitHub rejected the token. It may be expired or revoked. Create a new token to reconnect.');
      updatePublishButton();openTokenGuide(true);
    }
    if(!res.ok)throw Error(`GitHub ${res.status}: ${data.message||'Request failed'}`);
    return data;
  }

  const bufHex=bytes=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
  const CRC_TABLE=Uint32Array.from({length:256},(_,i)=>{
    let c=i;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);
    return c>>>0;
  });
  function crc32(bytes){let c=0xffffffff;for(const byte of bytes)c=CRC_TABLE[(c^byte)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
  /* The SHA-1 digest is Git's blob object ID, not a password hash. WebCrypto is
   * preferred on HTTPS; pure JS fallback supports inspecting a ZIP offline. */
  function sha1Fallback(input){
    const length=input.length;
    const count=((length+9+63)>>6)<<6;
    const bytes=new Uint8Array(count);bytes.set(input);bytes[length]=0x80;
    const view=new DataView(bytes.buffer);
    const bits=length*8;
    view.setUint32(count-8,Math.floor(bits/4294967296),false);
    view.setUint32(count-4,bits>>>0,false);
    let h0=0x67452301,h1=0xefcdab89,h2=0x98badcfe,h3=0x10325476,h4=0xc3d2e1f0;
    const w=new Int32Array(80);
    for(let offset=0;offset<count;offset+=64){
      for(let i=0;i<16;i++)w[i]=view.getInt32(offset+i*4,false);
      for(let i=16;i<80;i++){let x=w[i-3]^w[i-8]^w[i-14]^w[i-16];w[i]=(x<<1)|(x>>>31);}
      let a=h0,b=h1,c=h2,d=h3,e=h4;
      for(let i=0;i<80;i++){
        let f,k;
        if(i<20){f=(b&c)|(~b&d);k=0x5a827999;}
        else if(i<40){f=b^c^d;k=0x6ed9eba1;}
        else if(i<60){f=(b&c)|(b&d)|(c&d);k=0x8f1bbcdc;}
        else{f=b^c^d;k=0xca62c1d6;}
        const t=(((a<<5)|(a>>>27))+f+e+k+w[i])|0;
        e=d;d=c;c=(b<<30)|(b>>>2);b=a;a=t;
      }
      h0=(h0+a)|0;h1=(h1+b)|0;h2=(h2+c)|0;h3=(h3+d)|0;h4=(h4+e)|0;
    }
    return [h0,h1,h2,h3,h4].map(n=>(n>>>0).toString(16).padStart(8,'0')).join('');
  }
  async function blobSha(bytes){
    const header=new TextEncoder().encode(`blob ${bytes.length}\0`);
    const data=new Uint8Array(header.length+bytes.length);
    data.set(header);data.set(bytes,header.length);
    if(globalThis.crypto?.subtle) return bufHex(await crypto.subtle.digest('SHA-1',data));
    return sha1Fallback(data);
  }

  const DEPLOY_STEPS=['files','commit','build','live'];
  const PUBLIC_ORIGIN='https://filmmicfoundations.github.io/';
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function showDeploymentDialog(){
    const dialog=$('dev-deploy-dialog');
    if(!dialog.open)dialog.showModal();
  }
  function closeDeploymentDialog(){
    const dialog=$('dev-deploy-dialog');
    if(!dialog.open)return;
    dialog.classList.add('is-closing');
    setTimeout(()=>{dialog.close();dialog.classList.remove('is-closing');},matchMedia('(prefers-reduced-motion: reduce)').matches?0:160);
  }
  function deploymentStage(step,title,detail,{done=false,failed=false}={}){
    showDeploymentDialog();
    const panel=$('dev-deploy-panel');panel.hidden=false;
    panel.classList.toggle('is-complete',done);panel.classList.toggle('is-failed',failed);
    $('dev-deploy-title').textContent=title;
    $('dev-deploy-badge').textContent=failed?'Needs attention':done?'Published':'In progress';
    $('dev-deploy-detail').textContent=detail;
    const index=Math.max(0,DEPLOY_STEPS.indexOf(step));
    $('dev-deploy-track').setAttribute('aria-valuenow',String(done?4:index));
    $('dev-deploy-fill').style.width=`${done?100:index*25}%`;
    document.querySelectorAll('[data-deploy-step]').forEach(el=>{
      const i=DEPLOY_STEPS.indexOf(el.dataset.deployStep);
      el.classList.toggle('is-done',done||i<index);
      el.classList.toggle('is-current',!done&&!failed&&i===index);
      el.querySelector('.dev-deploy-step-dot').textContent=(done||i<index)?'✓':String(i+1);
    });
    $('dev-deploy-reload').hidden=!(done||failed);
    $('dev-deploy-retry').hidden=!(failed||(!done&&step==='build'&&/unavailable|longer/i.test(title))); 
  }
  function readDeployState(key){try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}}
  function writeDeployState(key,value){try{if(value)sessionStorage.setItem(key,JSON.stringify(value));else sessionStorage.removeItem(key);}catch{}}
  function stopDeploymentMonitor(){monitorGeneration++;monitorActive=false;clearTimeout(reloadTimer);}
  function canProbe(path){
    if(!path || path==='index.html'||!(/^(?:assets\/|dev\/|about\/|standards\/)/.test(path)||['404.html','favicon.svg','favicon.ico','robots.txt'].includes(path)))return false;
    return !/\.(?:map|log|txt~)$/i.test(path);
  }
  function selectProbe(updatedFiles){
    const preferred=updatedFiles.filter(f=>f.bytes&&f.bytes.length<=1200000&&canProbe(f.path));
    preferred.sort((a,b)=>{
      const rank=f=>f.path.startsWith('dev/')?0:f.path.startsWith('assets/')?1:f.path.startsWith('about/')?2:3;
      return rank(a)-rank(b)||a.bytes.length-b.bytes.length;
    });
    const file=preferred[0];return file?{path:file.path,sha:file.sha}:null;
  }
  function liveUrl(path,sha){const url=new URL(path,PUBLIC_ORIGIN);url.searchParams.set('ff_release',sha.slice(0,12));url.searchParams.set('ff_check',Date.now().toString());return url.href;}
  async function checkLiveFile(probe,sha){
    const url=liveUrl(probe?.path||'dev/index.html',sha);
    try{
      const res=await fetch(url,{cache:'no-store',credentials:'omit',redirect:'follow'});
      if(!res.ok)return false;
      if(!probe)return true; // No matching package asset: confirm public site responds, without claiming exact revision verification.
      const bytes=new Uint8Array(await res.arrayBuffer());
      return await blobSha(bytes)===probe.sha;
    }catch{return false;}
  }
  function showDeploymentFailure(message,sha){
    deploymentStage('build','Deployment needs attention',message,{failed:true});
    setStatus('dev-update-status',message);
    if(sha)$('dev-deploy-actions-link').href=`https://github.com/${OWNER}/${REPO}/actions`;
    $('dev-open-progress').hidden=false;
    monitorActive=false; // Retain pending revision so retry works even after refreshing.
  }
  function refreshPortalAfterDeployment(sha,verified){
    writeDeployState(PENDING_DEPLOY_KEY,null);
    $('dev-open-progress').hidden=true;
    writeDeployState(DEPLOY_COMPLETED_KEY,{sha,verified});
    try{sessionStorage.setItem(AUTO_RETURN_KEY,'1');}catch{}
    deploymentStage('live','Website updated',verified?'The updated file is now being served. Reloading the portal…':'GitHub Pages reports a successful deployment. Reloading the portal…',{done:true});
    setStatus('dev-update-status','Deployment completed. Reloading this page to use the latest website files.');
    reloadTimer=setTimeout(()=>reloadPortal(),1700);
  }
  function reloadPortal(){
    const url=new URL(window.location.href);url.searchParams.set('ff_version',String(Date.now()));
    window.location.replace(url.href);
  }
  async function watchDeployment(sha,probe=null){
    if(!token||monitorActive)return;
    currentDeploySha=sha;currentDeployProbe=probe;
    const generation=++monitorGeneration;monitorActive=true;
    justPublished=true;updatePublishButton();
    $('dev-deploy-actions-link').href=`https://github.com/${OWNER}/${REPO}/actions`;
    deploymentStage('build','Waiting for GitHub Pages','GitHub is scheduling the website build.');
    $('dev-open-progress').hidden=false;
    let failures=0;
    const deadline=Date.now()+12*60*1000;
    try{
      while(generation===monitorGeneration&&token&&Date.now()<deadline){
        if(probe && await checkLiveFile(probe,sha)){refreshPortalAfterDeployment(sha,true);return;}
        try{
          const data=await api(`/actions/workflows/deploy.yml/runs?head_sha=${encodeURIComponent(sha)}&per_page=10`);
          const run=(data.workflow_runs||[]).find(r=>r.head_sha===sha);
          if(!run){deploymentStage('build','Waiting for workflow','The GitHub Pages workflow has not started yet. Checking again…');}
          else{
            if(run.html_url&&/^https:\/\/github\.com\//.test(run.html_url))$('dev-deploy-actions-link').href=run.html_url;
            const status=run.status||'queued';
            if(status==='completed'){
              if(run.conclusion!=='success'){
                showDeploymentFailure(`GitHub Pages finished with “${run.conclusion||'unknown'}”. The update has not been confirmed live. Open the workflow report to see why.`,sha);
                return;
              }
              deploymentStage('live','GitHub Pages published','Deployment succeeded. Checking when the updated website is available…');
              for(let n=0;n<20&&generation===monitorGeneration&&token;n++){
                if(await checkLiveFile(probe,sha)){
                  refreshPortalAfterDeployment(sha,!!probe);return;
                }
                await delay(3000);
              }
              // An older workflow might change only generated assets, or CDN propagation can lag.
              deploymentStage('live','Deployment completed','GitHub Pages reports success, but the updated public file could not yet be independently confirmed. Use Reload when ready.');
              $('dev-deploy-reload').hidden=false;
              setStatus('dev-update-status','Deployment successful on GitHub, but the public-site check timed out. You can reload manually or inspect GitHub Pages.');
              writeDeployState(PENDING_DEPLOY_KEY,null);
              return;
            }
            let label=status==='queued'||status==='waiting'||status==='pending'?'Waiting for runner':'Building and deploying';
            let detail=status==='queued'||status==='waiting'||status==='pending'?'The publication workflow is queued.':'GitHub is validating the site and deploying to Pages.';
            if(status==='in_progress' && run.id){
              try{
                const jobs=await api(`/actions/runs/${run.id}/jobs?per_page=5`);
                const active=(jobs.jobs||[]).flatMap(j=>j.steps||[]).find(x=>x.status==='in_progress');
                if(active?.name){label=active.name;detail=`GitHub Actions is running “${active.name}”.`;}
              }catch{ /* GitHub may not expose job details with minimal tokens. */ }
            }
            deploymentStage('build',label,detail);
          }
          failures=0;
        }catch(error){
          failures++;
          if(!token||generation!==monitorGeneration)return;
          if(failures>=4){
            // Read-only workflow status may be blocked even for a token with Contents access.
            // Keep trying with a slower cadence and independently verify any changed public file.
            if(probe && await checkLiveFile(probe,sha)){
              refreshPortalAfterDeployment(sha,true);
              return;
            }
            deploymentStage('build','Status temporarily unavailable','GitHub workflow status is unavailable. The update may still be deploying; checking again automatically. You can also retry now or inspect GitHub Actions.');
            $('dev-deploy-retry').hidden=false;
            await delay(9000);
            continue;
          }
          deploymentStage('build','Reconnecting to GitHub','The progress check was interrupted. Retrying…');
        }
        await delay(DEPLOY_POLL_MS);
      }
      if(generation===monitorGeneration&&token){
        deploymentStage('build','Monitoring paused','The update was submitted, but deployment could not be confirmed. Retry the status check or open GitHub Actions.',{failed:true});
      }
    }finally{if(generation===monitorGeneration)monitorActive=false;}
  }

  function base64(bytes){
    let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));
    return btoa(s);
  }
  async function readZip(file){
    if(!window.JSZip)throw Error('ZIP support did not load. Reload the page and try again.');
    if(file.size>MAX_ZIP)throw Error('ZIP exceeds 90 MB. Split or optimize the update package.');
    // Avoid JSZip's checkCRC32 option, which can stall while streaming Blobs in some browsers.
    // Each decompressed entry is checked explicitly below instead.
    const zip=await JSZip.loadAsync(file,{checkCRC32:false});
    let list=Object.values(zip.files).filter(entry=>!entry.dir && !entry.name.startsWith('__MACOSX/'));
    if(list.length>MAX_ENTRIES)throw Error('Too many files in ZIP.');
    // Accept both a source-root ZIP and a ZIP with exactly one containing folder.
    const names=list.map(x=>x.name);
    if(!names.includes('index.html')){
      const first=names[0]?.split('/')[0];
      // A ZIP containing only dev/index.html or film-slug/index.html is a PATCH,
      // not a wrapped repository. Never silently strip its folder name.
      const isWrappedRepository=first && !['dev','about','assets','standards','scripts','.github'].includes(first)
        && names.every(n=>n.startsWith(first+'/')) && names.includes(first+'/index.html')
        && (names.includes(first+'/style.css') || names.includes(first+'/404.html') || names.some(n=>n.startsWith(first+'/assets/')));
      if(isWrappedRepository){
        list=list.map(x=>({file:x,path:x.name.slice(first.length+1)}));
      }else{
        // A partial update is valid; omitted repository files are preserved.
        list=list.map(x=>({file:x,path:x.name}));
      }
    }else list=list.map(x=>({file:x,path:x.name}));
    const included=$('dev-include-workflows').checked;
    const files=[];const seen=new Set();let total=0;
    for(const entry of list){
      const path=cleanPath(entry.path);
      if(path.startsWith('.github/workflows/')&&!included){files.push({path,status:'excluded',bytes:null});continue;}
      if(path.startsWith('.github/')&&!path.startsWith('.github/workflows/'))throw Error(`Unexpected private .github path: ${path}`);
      if(seen.has(path))throw Error(`Duplicate filename in ZIP: ${path}`);
      seen.add(path);
      const sz=entry.file._data?.uncompressedSize||0;
      if(sz>MAX_ZIP)throw Error(`File too large: ${path}`);
      total+=sz;if(total>MAX_TOTAL)throw Error('ZIP uncompressed content exceeds the 200 MB limit.');
      const bytes=await entry.file.async('uint8array');
      if(entry.file._data && typeof entry.file._data.crc32==='number' && crc32(bytes)!==(entry.file._data.crc32>>>0))
        throw Error(`ZIP integrity check failed: ${path}`);
      files.push({path,bytes,sha:await blobSha(bytes),status:'included'});
    }
    if(!files.some(f=>f.bytes))throw Error('No publishable files were found in this ZIP.');
    return files;
  }
  async function headAndTree(){
    const ref=await api(`/git/ref/heads/${BRANCH}`);
    const commit=await api(`/git/commits/${ref.object.sha}`);
    const tree=await api(`/git/trees/${commit.tree.sha}?recursive=1`);
    if(tree.truncated)throw Error('GitHub returned a truncated repository tree. Publishing is disabled for safety.');
    return {sha:ref.object.sha,treeSha:commit.tree.sha,files:new Map(tree.tree.filter(x=>x.type==='blob').map(x=>[x.path,x.sha]))};
  }
  function renderFiles(){
    const active=manifest.filter(x=>x.bytes);
    const modified=active.filter(x=>x.status==='changed').length;
    const added=active.filter(x=>x.status==='new').length;
    const unchanged=active.filter(x=>x.status==='unchanged').length;
    const excluded=manifest.filter(x=>x.status==='excluded').length;
    $('dev-change-summary').textContent=`${modified} changed · ${added} new · ${unchanged} unchanged`;
    $('dev-review-hint').textContent=excluded ? `${excluded} workflow file(s) excluded. No missing repository files will be deleted.` : 'No repository files missing from the ZIP will be deleted.';
    const list=$('dev-file-list');list.replaceChildren();
    manifest.slice(0,250).forEach(f=>{
      const row=document.createElement('div');row.className='dev-file-row';
      const type=document.createElement('span');type.textContent=f.status;
      const name=document.createElement('div');name.textContent=f.path;
      row.append(type,name);list.append(row);
    });
    if(manifest.length>250){const more=document.createElement('p');more.className='dev-small';more.textContent=`…plus ${manifest.length-250} more files`;list.append(more);}
    $('dev-review').hidden=false;
    $('dev-confirm-update').checked=false;
    changes=active.filter(x=>x.status==='changed'||x.status==='new');
    updatePublishButton();
  }
  function publishBlocker(){
    if(justPublished)return 'Release submitted. Live deployment progress is displayed below.';
    if(busy)return 'Please wait for the current operation to finish.';
    if(!token)return 'Connect to GitHub above first. You will then be able to review and publish.';
    if(!archive)return 'Choose an update ZIP. You can upload a full site or just the changed files.';
    if(lastInspectionError)return `Fix the inspection issue, then try again: ${lastInspectionError}`;
    if(!baselineSha)return 'The ZIP has not been compared with GitHub. Select Inspect ZIP to compare again.';
    if(!changes.length)return 'Everything in this ZIP already matches the repository. There is nothing new to publish.';
    if(!$('dev-confirm-update').checked)return `Review the ${changes.length} new or changed file${changes.length===1?'':'s'} and tick the approval box.`;
    return '';
  }
  function updatePublishButton(){
    const reason=publishBlocker();
    const button=$('dev-publish');
    button.disabled=busy||justPublished;
    button.dataset.ready=reason?'false':'true';
    button.classList.toggle('is-ready',!reason);
    button.querySelector('span').textContent=justPublished?'✓':'↗';
    $('dev-publish-reason').textContent=reason||`Ready to publish ${changes.length} file${changes.length===1?'':'s'}. GitHub will validate before the update becomes live.`;
    const tasks={connection:!!token,file:!!archive,inspection:!!baselineSha&&changes.length>0,approved:!!$('dev-confirm-update').checked&&!!baselineSha&&changes.length>0};
    document.querySelectorAll('[data-check]').forEach(el=>{
      const complete=tasks[el.dataset.check];el.classList.toggle('is-complete',complete);
      el.querySelector('.dev-check-icon').textContent=complete?'✓':'○';
    });
    $('dev-connect-state').textContent=token?'Connected':'Not connected';
    $('dev-connect-state').classList.toggle('is-connected',!!token);
    $('dev-quick-token-form').hidden=!!token;
    $('dev-connected-info').hidden=!token;
    if(token)$('dev-connected-as').textContent=`Connected as ${connectedUser||'authorized account'}`;

  }
  function setBusy(value){
    busy=value;
    $('dev-compare').disabled=value||!archive;
    $('dev-refresh-versions').disabled=value;
    $('dev-zip-file').disabled=value;
    $('dev-quick-connect').disabled=value;
    $('dev-publish').firstChild.textContent=value?'Working… ':justPublished?'Update submitted ':'Publish update ';
    updatePublishButton();
  }
  function explainPublishBlocker(){
    const reason=publishBlocker();
    if(!reason)return false;
    setStatus('dev-update-status',reason);
    if(!token){$('dev-quick-token').focus();$('dev-connect-heading').scrollIntoView({behavior:'smooth',block:'center'});}
    else if(!archive){$('dev-zip-file').focus();$('dev-choose-heading').scrollIntoView({behavior:'smooth',block:'center'});}
    else if(!baselineSha && !lastInspectionError){compare();}
    else if(changes.length && !$('dev-confirm-update').checked){$('dev-confirm-update').focus();$('dev-review').scrollIntoView({behavior:'smooth',block:'center'});}
    return true;
  }
  async function compare(){
    if(!archive)return;
    lastInspectionError='';justPublished=false;setBusy(true);setStatus('dev-update-status','Inspecting ZIP contents and comparing files…');
    try{
      manifest=await readZip(archive);baselineSha='';baselineTree='';
      if(token){
        setStatus('dev-update-status','Comparing files with GitHub main…');
        const head=await headAndTree();baselineSha=head.sha;baselineTree=head.treeSha;
        manifest.forEach(f=>{if(f.bytes) f.status=!head.files.has(f.path)?'new':head.files.get(f.path)===f.sha?'unchanged':'changed';});
        setStatus('dev-update-status',`Comparison complete against ${trimSha(baselineSha)}. Review the changes before publishing.`);
      }else{
        manifest.forEach(f=>{if(f.bytes)f.status='included';});
        setStatus('dev-update-status','ZIP structure and CRC validated locally. Connect to GitHub above to compare files and enable publishing.');
      }
      renderFiles();
      updateReleaseSuggestion();
      if(token&&changes.length===0)setStatus('dev-update-status','This ZIP is valid, but all its files are already up to date. Choose another ZIP to publish a new change.');
    }catch(e){$('dev-review').hidden=true;changes=[];baselineSha='';lastInspectionError=e.message;setStatus('dev-update-status',`Could not inspect the ZIP: ${e.message}`);}
    finally{setBusy(false);}
  }

  function suggestedReleaseTitle(files){
    const names=files.map(f=>f.path);
    const topics=[];
    const has=p=>names.some(n=>p.test(n));
    if(has(/(^|\/)dev\/|developer\.(js|css)$/))topics.push('developer portal');
    if(has(/site-header\.|(^|\/)index\.html$|favicon/))topics.push('navigation');
    if(has(/(^|\/)standards\/|publication|PDF_DESIGN/))topics.push('publication standards');
    if(has(/mindglassprocedure|article\.(js|css)/))topics.push('article pages');
    if(has(/home\.(js|css)/))topics.push('research archive');
    if(has(/settings/))topics.push('reader settings');
    if(has(/404\.html/))topics.push('404 page');
    if(has(/\.github\//))topics.push('publishing workflow');
    const label=topics.slice(0,3);
    if(!label.length){
      const stems=names.slice(0,2).map(p=>p.split('/').pop().replace(/\.[^.]+$/,'').replace(/[-_]/g,' '));
      label.push(...stems);
    }
    return `Update ${label.join(', ')} (${files.length} file${files.length===1?'':'s'})`.slice(0,90);
  }
  function updateReleaseSuggestion(){
    const suggestion=changes.length?suggestedReleaseTitle(changes):'Upload and inspect a ZIP to generate a suggested title.';
    $('dev-release-suggestion').textContent='Suggested: '+suggestion;
    $('dev-release-title').placeholder=changes.length?suggestion:'Suggested automatically from changed files';
  }
  async function publish(){
    if(explainPublishBlocker())return;
    const confirmation=`Publish ${changes.length} new/modified file(s) to ${OWNER}/${REPO}?\n\nFiles absent from the ZIP will be preserved. GitHub Actions will validate and deploy automatically.`;
    if(!window.confirm(confirmation))return;
    setBusy(true);
    deploymentStage('files','Preparing update',`Preparing ${changes.length} modified file(s) for GitHub.`);
    try{
      const now=await headAndTree();
      if(now.sha!==baselineSha)throw Error('The repository changed since inspection. Inspect the ZIP again before publishing.');
      const treeChanges=[];
      for(let i=0;i<changes.length;i++){
        const file=changes[i];
        setStatus('dev-update-status',`Uploading ${i+1}/${changes.length}: ${file.path}`);
        deploymentStage('files','Transferring files',`Uploading ${i+1} of ${changes.length} files: ${file.path}`);
        const blob=await api('/git/blobs',{method:'POST',body:{content:base64(file.bytes),encoding:'base64'}});
        treeChanges.push({path:file.path,mode:'100644',type:'blob',sha:blob.sha});
      }
      setStatus('dev-update-status','Creating versioned publication commit…');
      deploymentStage('commit','Creating release','The changed files have been transferred. Committing the update to GitHub.');
      const tree=await api('/git/trees',{method:'POST',body:{base_tree:baselineTree,tree:treeChanges}});
      const commit=await api('/git/commits',{method:'POST',body:{message:($('dev-release-title').value.trim()||suggestedReleaseTitle(changes)),tree:tree.sha,parents:[baselineSha]}});
      await api(`/git/refs/heads/${BRANCH}`,{method:'PATCH',body:{sha:commit.sha,force:false}});
      const probe=selectProbe(changes);
      writeDeployState(PENDING_DEPLOY_KEY,{sha:commit.sha,probe,started:Date.now()});
      baselineSha='';changes=[];$('dev-confirm-update').checked=false;lastInspectionError='';justPublished=true;
      setStatus('dev-update-status',`Release ${trimSha(commit.sha)} submitted. Watching the GitHub Pages workflow…`);
      $('dev-review').hidden=true;
      $('dev-publish-section').hidden=true;
      watchDeployment(commit.sha,probe).catch(err=>showDeploymentFailure(`Unable to follow deployment: ${err.message}`,commit.sha));
      refreshVersions().catch(()=>{});
    }catch(e){deploymentStage('commit','Publication not submitted',`GitHub rejected the update: ${e.message}`,{failed:true});setStatus('dev-update-status',`Publish did not complete: ${e.message}. Check the repository status before retrying.`);}
    finally{setBusy(false);}
  }

  let historyLimit=6;
  let allHistory=[];
  function dateText(value){
    if(!value)return 'Date unavailable';
    const date=new Date(value);
    return Number.isNaN(date.getTime())?'Date unavailable':date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  }
  async function enrichLegacyTitles(){
    const older=allHistory.filter(entry=>/^Update Filmmic Foundations via developer portal \(/i.test(entry.message||'')&&!entry.autotitled).slice(0,6);
    if(!older.length)return;
    await Promise.all(older.map(async entry=>{
      entry.autotitled=true;
      try{
        const details=await api(`/commits/${entry.head_sha}`);
        const files=(details.files||[]).map(item=>({path:item.filename}));
        if(files.length){entry.message=suggestedReleaseTitle(files);entry.generatedTitle=true;}
      }catch{ /* History remains usable if commit details are unavailable. */ }
    }));
    renderVersions();
  }
  function renderVersions(){
    const list=$('dev-version-list');list.replaceChildren();
    if(!allHistory.length){list.textContent='No saved repository revisions were found.';return;}
    allHistory.slice(0,historyLimit).forEach((entry,i)=>{
      const row=document.createElement('article');row.className='dev-version';
      const information=document.createElement('div');information.className='dev-version-details';
      const badge=document.createElement('span');badge.className='dev-version-badge'+(entry.verified?' is-verified':'');
      badge.textContent=entry.verified?'Published':'Repository revision';
      const title=document.createElement('strong');title.textContent=(entry.message||'Website update').replace(/^Update Filmmic Foundations via developer portal \((\d+) files?\)$/i,(_,count)=>`Developer portal release · ${count} files`);
      const extra=document.createElement('small');extra.textContent=`${dateText(entry.date)} · ${trimSha(entry.head_sha)}`;
      information.append(badge,title,extra);
      const actions=document.createElement('div');actions.className='dev-version-actions';
      const download=document.createElement('a');download.className='dev-button outline';download.textContent='ZIP';
      download.title='Download this exact repository revision';
      download.href=`https://github.com/${OWNER}/${REPO}/archive/${encodeURIComponent(entry.head_sha)}.zip`;
      const restoreButton=document.createElement('button');restoreButton.type='button';restoreButton.className='dev-button outline';
      restoreButton.textContent='Restore';restoreButton.disabled=!token||entry.head_sha===allHistory[0].head_sha||busy;
      restoreButton.title=!token?'Connect to GitHub to restore':entry.head_sha===allHistory[0].head_sha?'Already the latest revision':'Restore this revision';
      restoreButton.addEventListener('click',()=>restore(entry));
      actions.append(download,restoreButton);row.append(information,actions);list.append(row);
    });
    const more=$('dev-history-more');more.hidden=allHistory.length<=historyLimit;
    more.textContent=`Show more (${allHistory.length-historyLimit} remaining)`;
    const newestPublished=allHistory.find(x=>x.verified);
    const chosen=newestPublished||allHistory[0];
    $('dev-download-source').href=`https://github.com/${OWNER}/${REPO}/archive/${encodeURIComponent(chosen.head_sha)}.zip`;
    $('dev-source-revision').textContent=(chosen.verified?'Latest verified deployment: ':'Latest saved revision: ')+trimSha(chosen.head_sha);
  }
  async function refreshVersions(){
    const container=$('dev-version-list');container.replaceChildren();
    container.textContent='Loading saved versions…';$('dev-history-more').hidden=true;
    let successful=[];let commits=[];let errors=[];
    try{
      const data=await api('/actions/workflows/deploy.yml/runs?status=success&per_page=100');
      successful=(data.workflow_runs||[]).filter(run=>run.head_sha).map(run=>({head_sha:run.head_sha,date:run.updated_at||run.run_started_at||run.created_at,verified:true,message:'Successful website deployment'}));
    }catch(e){errors.push(e.message);}
    try{
      const data=await api(`/commits?sha=${encodeURIComponent(BRANCH)}&per_page=100`);
      commits=(Array.isArray(data)?data:[]).filter(c=>c.sha).map(c=>({head_sha:c.sha,date:c.commit?.committer?.date||c.commit?.author?.date,message:(c.commit?.message||'Website update').split('\n')[0].slice(0,86),verified:false}));
    }catch(e){errors.push(e.message);}
    if(!successful.length&&!commits.length){
      allHistory=[];
      container.textContent=errors.length?'Unable to load version history. Connect to GitHub or check repository permissions, then refresh.':'No repository revisions found yet.';
      $('dev-history-note').textContent=errors.length?errors[0]:'';
      return;
    }
    const merged=new Map();
    for(const item of commits)merged.set(item.head_sha,item);
    for(const item of successful){const existing=merged.get(item.head_sha);merged.set(item.head_sha,{...item,...existing,verified:true});}
    allHistory=Array.from(merged.values()).sort((x,y)=>new Date(y.date||0)-new Date(x.date||0));
    const onlyCommits=!successful.length;
    $('dev-history-note').textContent=onlyCommits?'Showing saved repository revisions. GitHub did not return verified deployment history.':'Verified deployments are marked Published; other entries are saved repository revisions.';
    historyLimit=6;renderVersions();
    enrichLegacyTitles().catch(()=>{});
  }

  async function restore(run){
    if(!token||busy)return;
    if(!window.confirm(`Restore repository revision ${trimSha(run.head_sha)}?\n\n${run.verified?"This version has a confirmed successful deployment.":"This is a saved commit, not a verified deployment."}\n\nRestoring creates a new commit and republishes the site. Files changed after this revision will be replaced. Continue?`))return;
    setBusy(true);
    try{
      const current=await headAndTree();
      if(current.sha===run.head_sha)throw Error('This revision is already checked out.');
      const target=await api(`/git/commits/${run.head_sha}`);
      const rollback=await api('/git/commits',{method:'POST',body:{message:`Restore Filmmic Foundations to successful deployment ${trimSha(run.head_sha)}`,tree:target.tree.sha,parents:[current.sha]}});
      await api(`/git/refs/heads/${BRANCH}`,{method:'PATCH',body:{sha:rollback.sha,force:false}});
      const pendingRestore={sha:rollback.sha,probe:null,started:Date.now()};
      writeDeployState(PENDING_DEPLOY_KEY,pendingRestore);
      watchDeployment(rollback.sha,null).catch(e=>showDeploymentFailure(e.message,rollback.sha));
      setStatus('dev-update-status',`Restoration commit ${trimSha(rollback.sha)} submitted to GitHub.`);
      await refreshVersions();
    }catch(e){const p=document.createElement('p');p.className='dev-error';p.textContent=`Restore failed: ${e.message}`;$('dev-version-list').prepend(p);}
    finally{setBusy(false);}
  }

  function resetInspection(){
    manifest=[];changes=[];baselineSha='';baselineTree='';lastInspectionError='';justPublished=false;
    $('dev-review').hidden=true;$('dev-confirm-update').checked=false;updateReleaseSuggestion();updatePublishButton();
  }
  async function connectWith(value){
    if(!value)return;
    token=value;
    setStatus('dev-connection-status','Checking GitHub authorization…');
    try{
      const user=await api('https://api.github.com/user');
      const repo=await api('');
      if(repo.full_name?.toLowerCase()!==`${OWNER}/${REPO}`)throw Error('Connected to the wrong repository.');
      connectedUser=user.login||'authorized account';
      $('dev-quick-token').value='';
      saveSessionToken(token);
      resetInspection();
      setStatus('dev-connection-status','');
      if(archive){setStatus('dev-update-status','Connected! Comparing the selected ZIP with your GitHub repository…');await compare();}
      else setStatus('dev-update-status','GitHub connected. Choose a ZIP above to continue.');
      refreshVersions().catch(()=>{});
      const pending=readDeployState(PENDING_DEPLOY_KEY);
      if(pending?.sha&&!monitorActive){justPublished=true;watchDeployment(pending.sha,pending.probe||null).catch(err=>showDeploymentFailure(`Unable to resume deployment check: ${err.message}`,pending.sha));}
    }catch(err){token='';connectedUser='';saveSessionToken('');setStatus('dev-connection-status',`Could not connect: ${err.message}`);setStatus('dev-update-status',`GitHub connection failed: ${err.message}. Check token access and try again.`);}
    updatePublishButton();
  }
  function disconnect(){
    stopDeploymentMonitor();
    token='';connectedUser='';saveSessionToken('');resetInspection();
    $('dev-quick-token').value='';
    setStatus('dev-connection-status','Disconnected. Token cleared from this tab.');
    setStatus('dev-update-status','Disconnected. Reconnect to publish an update.');
    refreshVersions().catch(()=>{});updatePublishButton();
  }
  function chooseZip(file){
    archive=file||null;resetInspection();
    $('dev-publish-section').hidden=false;
    $('dev-upload-info').hidden=!archive;
    $('dev-filename').textContent=archive?`${archive.name} · ${(archive.size/1048576).toFixed(2)} MB`:'';
    $('dev-compare').disabled=!archive||busy;
    if(archive){setStatus('dev-update-status',token?'ZIP received. Inspecting and comparing automatically…':'ZIP received. Inspecting locally; connect to GitHub to publish.');compare();}
    else setStatus('dev-update-status','Choose an update ZIP to continue.');
    updatePublishButton();
  }
  function showTab(tab){
    if(tab==='versions'&&!allHistory.length)refreshVersions().catch(()=>{});
    document.querySelectorAll('[data-tab]').forEach(b=>{if(b.dataset.tab===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==tab);
  }
  function unlockWorkspace(){
    $('dev-access-code').value='';$('dev-login-error').textContent='';$('dev-lock').classList.remove('is-leaving');$('dev-workspace').classList.remove('is-leaving');$('dev-lock').hidden=true;$('dev-workspace').hidden=false;
    const tab=location.hash.slice(1);showTab(['updates','versions','standards'].includes(tab)?tab:'updates');
    window.scrollTo({top:0,behavior:'instant'});
    const completed=readDeployState(DEPLOY_COMPLETED_KEY);
    if(completed?.sha){
      justPublished=true;
      deploymentStage('live','Website updated',completed.verified?'The new website files are live and this portal has reloaded.':'The GitHub Pages workflow succeeded and this portal has reloaded.',{done:true});
      setStatus('dev-update-status',`Published release ${trimSha(completed.sha)}. You are viewing the refreshed portal.`);
      writeDeployState(DEPLOY_COMPLETED_KEY,null);
    }
    const saved=loadSessionToken();if(saved&&!token){
      setStatus('dev-connection-status','Restoring GitHub connection for this tab…');
      connectWith(saved).catch(()=>{});
    }
  }
  $('dev-login-form').addEventListener('submit',e=>{
    e.preventDefault();
    if($('dev-access-code').value==='123'){
      $('dev-lock').classList.add('is-leaving');
      if(matchMedia('(prefers-reduced-motion: reduce)').matches)unlockWorkspace();
      else setTimeout(unlockWorkspace,180);
    }
    else{$('dev-login-error').textContent='Incorrect access code.';$('dev-access-code').value='';}
  });
  $('dev-lock-again').addEventListener('click',()=>{
    disconnect();$('dev-access-code').value='';$('dev-workspace').classList.add('is-leaving');
    const finish=()=>{$('dev-workspace').hidden=true;$('dev-workspace').classList.remove('is-leaving');$('dev-lock').hidden=false;window.scrollTo(0,0);};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else setTimeout(finish,180);
  });
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{showTab(b.dataset.tab);history.replaceState(null,'',`#${b.dataset.tab}`);}));
  $('dev-token-help-link').addEventListener('click',()=>openTokenGuide());
  $('dev-token-guide-close').addEventListener('click',closeTokenGuide);
  $('dev-token-guide-done').addEventListener('click',closeTokenGuide);
  $('dev-token-guide').addEventListener('cancel',e=>{e.preventDefault();closeTokenGuide();});
  $('dev-token-guide').addEventListener('click',e=>{if(e.target===$('dev-token-guide'))closeTokenGuide();});
  $('dev-zip-file').addEventListener('change',e=>chooseZip(e.target.files?.[0]||null));
  $('dev-include-workflows').addEventListener('change',()=>{if(archive){resetInspection();setStatus('dev-update-status','Advanced options changed. Rechecking ZIP…');compare();}});
  $('dev-clear-zip').addEventListener('click',()=>{$('dev-zip-file').value='';chooseZip(null);});
  $('dev-compare').addEventListener('click',compare);
  $('dev-confirm-update').addEventListener('change',updatePublishButton);
  $('dev-publish').addEventListener('click',publish);
  $('dev-refresh-versions').addEventListener('click',refreshVersions);
  $('dev-history-more').addEventListener('click',()=>{historyLimit+=8;renderVersions();});
  $('dev-deploy-reload').addEventListener('click',reloadPortal);
  $('dev-quick-token-form').addEventListener('submit',async e=>{e.preventDefault();await connectWith($('dev-quick-token').value.trim());});
  $('dev-quick-disconnect').addEventListener('click',disconnect);
  const zone=$('dev-dropzone');
  zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('is-dragging');});
  zone.addEventListener('dragleave',()=>zone.classList.remove('is-dragging'));
  zone.addEventListener('drop',e=>{
    e.preventDefault();zone.classList.remove('is-dragging');
    const file=e.dataTransfer.files?.[0];
    if(!file)return;
    if(!/\.zip$/i.test(file.name)){setStatus('dev-update-status','Please choose a .zip file.');return;}
    $('dev-zip-file').value='';chooseZip(file);
  });
  $('dev-deploy-close').addEventListener('click',closeDeploymentDialog);
  $('dev-open-progress').addEventListener('click',showDeploymentDialog);
  $('dev-deploy-dialog').addEventListener('cancel',event=>{event.preventDefault();closeDeploymentDialog();});
  $('dev-deploy-retry').addEventListener('click',()=>{
    if(!currentDeploySha){const pending=readDeployState(PENDING_DEPLOY_KEY);currentDeploySha=pending?.sha||'';currentDeployProbe=pending?.probe||null;}
    if(!currentDeploySha){deploymentStage('build','No pending release','No release is available for tracking.',{failed:true});return;}
    stopDeploymentMonitor();
    watchDeployment(currentDeploySha,currentDeployProbe);
  });
  document.querySelectorAll('[data-standard-view]').forEach(button=>button.addEventListener('click',()=>{
    const value=button.dataset.standardView;
    $('dev-standards-list').classList.toggle('is-list',value==='list');
    document.querySelectorAll('[data-standard-view]').forEach(b=>{b.classList.toggle('is-selected',b===button);b.setAttribute('aria-pressed',String(b===button));});
    try{sessionStorage.setItem('ff-dev-standards-view',value);}catch{}
  }));
  try{const view=sessionStorage.getItem('ff-dev-standards-view');if(view==='list')document.querySelector('[data-standard-view="list"]').click();}catch{}
  updateReleaseSuggestion();
  updatePublishButton();
  refreshVersions();
  try{if(sessionStorage.getItem(AUTO_RETURN_KEY)==='1'){sessionStorage.removeItem(AUTO_RETURN_KEY);unlockWorkspace();}}catch{}
})();
