/* Filmmic Foundations developer portal: public visual gate + GitHub authorization.
 * Token is held in this tab's sessionStorage after verification; never log or embed it.
 * The public access code is not authentication. */
(() => {
  'use strict';
  const OWNER='filmmicfoundations', REPO='filmmicfoundations.github.io', BRANCH='main';
  const API=`https://api.github.com/repos/${OWNER}/${REPO}`;
  const SESSION_TOKEN_KEY='ff-dev-github-token-v1';
  const MAX_ZIP=90*1024*1024, MAX_TOTAL=200*1024*1024, MAX_ENTRIES=2500;
  const $=id=>document.getElementById(id);
  let token='', archive=null, manifest=[], changes=[], baselineSha='', baselineTree='', busy=false, versions=[], connectedUser='', lastInspectionError='', justPublished=false;
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
      if(first && names.every(n=>n.startsWith(first+'/')) && names.includes(first+'/index.html')){
        list=list.map(x=>({file:x,path:x.name.slice(first.length+1)}));
      }else{
        // A patch archive containing only changed paths (e.g. dev/index.html)
        // is valid. Files absent from the ZIP are never removed.
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
    if(justPublished)return 'Commit submitted. GitHub Actions is checking and deploying it. Review successful deployments under Versions & backups.';
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
        setStatus('dev-update-status','ZIP structure and CRC validated locally. Connect to GitHub (Connection tab) to compare files and enable publishing.');
      }
      renderFiles();
      if(token&&changes.length===0)setStatus('dev-update-status','This ZIP is valid, but all its files are already up to date. Choose another ZIP to publish a new change.');
    }catch(e){$('dev-review').hidden=true;changes=[];baselineSha='';lastInspectionError=e.message;setStatus('dev-update-status',`Could not inspect the ZIP: ${e.message}`);}
    finally{setBusy(false);}
  }

  async function publish(){
    if(explainPublishBlocker())return;
    const confirmation=`Publish ${changes.length} new/modified file(s) to ${OWNER}/${REPO}?\n\nFiles absent from the ZIP will be preserved. GitHub Actions will validate and deploy automatically.`;
    if(!window.confirm(confirmation))return;
    setBusy(true);
    try{
      const now=await headAndTree();
      if(now.sha!==baselineSha)throw Error('The repository changed since inspection. Inspect the ZIP again before publishing.');
      const treeChanges=[];
      for(let i=0;i<changes.length;i++){
        const file=changes[i];
        setStatus('dev-update-status',`Uploading ${i+1}/${changes.length}: ${file.path}`);
        const blob=await api('/git/blobs',{method:'POST',body:{content:base64(file.bytes),encoding:'base64'}});
        treeChanges.push({path:file.path,mode:'100644',type:'blob',sha:blob.sha});
      }
      setStatus('dev-update-status','Creating versioned publication commit…');
      const tree=await api('/git/trees',{method:'POST',body:{base_tree:baselineTree,tree:treeChanges}});
      const commit=await api('/git/commits',{method:'POST',body:{message:`Update Filmmic Foundations via developer portal (${changes.length} files)`,tree:tree.sha,parents:[baselineSha]}});
      await api(`/git/refs/heads/${BRANCH}`,{method:'PATCH',body:{sha:commit.sha,force:false}});
      baselineSha='';changes=[];$('dev-confirm-update').checked=false;lastInspectionError='';justPublished=true;
      setStatus('dev-update-status',`Update submitted successfully (${trimSha(commit.sha)}). GitHub Actions is now validating and deploying. The update will be live only after deployment succeeds.`);
      $('dev-review').hidden=true;await refreshVersions();
    }catch(e){setStatus('dev-update-status',`Publish did not complete: ${e.message}. Check the repository status before retrying.`);}
    finally{setBusy(false);}
  }

  async function refreshVersions(){
    const container=$('dev-version-list');container.replaceChildren();
    if(!token){container.textContent='Connect to GitHub to view successful deployment history.';return;}
    try{
      const data=await api('/actions/workflows/deploy.yml/runs?status=success&per_page=12');
      versions=(data.workflow_runs||[]).filter(run=>run.head_sha).slice(0,10);
      if(!versions.length){container.textContent='No successful deployment runs were found. No rollback targets can be verified.';return;}
      versions.forEach((run,i)=>{
        const row=document.createElement('div');row.className='dev-version';
        const text=document.createElement('div');const title=document.createElement('strong');title.textContent=(i===0?'Latest successful deployment · ':'Published release · ')+trimSha(run.head_sha);
        const desc=document.createElement('small');desc.textContent=(run.run_started_at||run.created_at||'').slice(0,16).replace('T',' ')+ ' UTC';text.append(title,desc);
        const buttons=document.createElement('div');buttons.style.display='flex';buttons.style.gap='8px';buttons.style.flexWrap='wrap';
        const link=document.createElement('a');link.className='dev-button outline';link.textContent='Download';link.href=`https://github.com/${OWNER}/${REPO}/archive/${encodeURIComponent(run.head_sha)}.zip`;link.setAttribute('download','');
        const button=document.createElement('button');button.type='button';button.className='dev-button outline';button.textContent='Restore';button.disabled=i===0;button.addEventListener('click',()=>restore(run));
        buttons.append(link,button);row.append(text,buttons);container.append(row);
      });
      const good=versions[0].head_sha;
      $('dev-download-source').href=`https://github.com/${OWNER}/${REPO}/archive/${encodeURIComponent(good)}.zip`;
      $('dev-source-revision').textContent=`Last successful deployment: ${trimSha(good)} · automatically updated`;
    }catch(e){container.textContent=`Unable to load verified deployment history: ${e.message}. Grant Actions read permission and try again.`;}
  }

  async function restore(run){
    if(!token||busy)return;
    if(!window.confirm(`Restore the complete repository state from successful deployment ${trimSha(run.head_sha)}?\n\nThis will create a NEW commit and start a deployment. Updates since that version will no longer be present in the working tree. Git history remains available.`))return;
    setBusy(true);
    try{
      const current=await headAndTree();
      if(current.sha===run.head_sha)throw Error('This revision is already checked out.');
      const target=await api(`/git/commits/${run.head_sha}`);
      const rollback=await api('/git/commits',{method:'POST',body:{message:`Restore Filmmic Foundations to successful deployment ${trimSha(run.head_sha)}`,tree:target.tree.sha,parents:[current.sha]}});
      await api(`/git/refs/heads/${BRANCH}`,{method:'PATCH',body:{sha:rollback.sha,force:false}});
      $('dev-version-list').insertAdjacentHTML('afterbegin','<p class="dev-small">Restore commit created. GitHub Actions is deploying; verify its status before considering restoration complete.</p>');
      setStatus('dev-update-status',`Restoration commit ${trimSha(rollback.sha)} submitted to GitHub.`);
      await refreshVersions();
    }catch(e){const p=document.createElement('p');p.className='dev-error';p.textContent=`Restore failed: ${e.message}`;$('dev-version-list').prepend(p);}
    finally{setBusy(false);}
  }

  function resetInspection(){
    manifest=[];changes=[];baselineSha='';baselineTree='';lastInspectionError='';justPublished=false;
    $('dev-review').hidden=true;$('dev-confirm-update').checked=false;updatePublishButton();
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
    }catch(err){token='';connectedUser='';saveSessionToken('');setStatus('dev-connection-status',`Could not connect: ${err.message}`);setStatus('dev-update-status',`GitHub connection failed: ${err.message}. Check token access and try again.`);}
    updatePublishButton();
  }
  function disconnect(){
    token='';connectedUser='';saveSessionToken('');resetInspection();
    $('dev-quick-token').value='';
    setStatus('dev-connection-status','Disconnected. Token cleared from this tab.');
    setStatus('dev-update-status','Disconnected. Reconnect to publish an update.');
    refreshVersions().catch(()=>{});updatePublishButton();
  }
  function chooseZip(file){
    archive=file||null;resetInspection();
    $('dev-upload-info').hidden=!archive;
    $('dev-filename').textContent=archive?`${archive.name} · ${(archive.size/1048576).toFixed(2)} MB`:'';
    $('dev-compare').disabled=!archive||busy;
    if(archive){setStatus('dev-update-status',token?'ZIP received. Inspecting and comparing automatically…':'ZIP received. Inspecting locally; connect to GitHub to publish.');compare();}
    else setStatus('dev-update-status','Choose an update ZIP to continue.');
    updatePublishButton();
  }
  function showTab(tab){
    document.querySelectorAll('[data-tab]').forEach(b=>{if(b.dataset.tab===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==tab);
  }
  $('dev-login-form').addEventListener('submit',e=>{
    e.preventDefault();
    if($('dev-access-code').value==='123'){
      $('dev-access-code').value='';$('dev-login-error').textContent='';$('dev-lock').hidden=true;$('dev-workspace').hidden=false;
      const tab=location.hash.slice(1);showTab(['updates','versions','standards'].includes(tab)?tab:'updates');
      window.scrollTo({top:0,behavior:'instant'});
      const saved=loadSessionToken();if(saved&&!token){
        setStatus('dev-connection-status','Restoring GitHub connection for this tab…');
        connectWith(saved).catch(()=>{});
      }
    }else{$('dev-login-error').textContent='Incorrect demonstration code.';$('dev-access-code').value='';}
  });
  $('dev-lock-again').addEventListener('click',()=>{
    disconnect();$('dev-access-code').value='';$('dev-lock').hidden=false;$('dev-workspace').hidden=true;window.scrollTo(0,0);
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
  updatePublishButton();
  refreshVersions();
})();
