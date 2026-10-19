/*
 * Article submission packaging (browser-only, no external dependencies).
 * The builder never uploads files directly. It packages them into a ZIP
 * which an authorized maintainer uploads to GitHub.
 * ZIP format: uncompressed (STORE) with CRC32, compatible with Python zipfile.
 */
(() => {
  const form = document.getElementById('submission-form');
  const pdf = document.getElementById('paper');
  const cover = document.getElementById('cover');
  const extras = document.getElementById('extras');
  const slug = document.getElementById('slug');
  const status = document.getElementById('builder-status');
  const next = document.getElementById('next-steps');
  const enc = new TextEncoder();
  const crcTable = Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=(c&1)?0xEDB88320^(c>>>1):c>>>1;return c>>>0;});
  function crc32(bytes){let c=0xFFFFFFFF;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
  function u16(v){return [v&255,(v>>>8)&255];}
  function u32(v){return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];}
  function entry(name,data,offset){
    const path=enc.encode(name),sum=crc32(data),size=data.length;
    const local=new Uint8Array(30+path.length);
    const l=new DataView(local.buffer);
    l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);
    l.setUint32(14,sum,true);l.setUint32(18,size,true);l.setUint32(22,size,true);
    l.setUint16(26,path.length,true);local.set(path,30);
    const central=new Uint8Array(46+path.length);
    const c=new DataView(central.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);
    c.setUint32(16,sum,true);c.setUint32(20,size,true);c.setUint32(24,size,true);
    c.setUint16(28,path.length,true);c.setUint32(42,offset,true);central.set(path,46);
    return {local,data,central,length:local.length+size};
  }
  async function zip(files){
    const chunks=[],central=[];let offset=0;
    for(const file of files){
      const bytes=file.bytes??new Uint8Array(await file.blob.arrayBuffer());
      const e=entry(file.name,bytes,offset);chunks.push(e.local,e.data);central.push(e.central);offset+=e.length;
    }
    const cd=new Blob(central);const trailer=new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cd.size),...u32(offset),0,0]);
    return new Blob([...chunks,...central,trailer],{type:'application/zip'});
  }
  function isImage(file){return file && ['image/jpeg','image/png','image/webp'].includes(file.type);}
  function safeName(name){return name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+/, '').slice(0,90)||'image';}
  pdf.addEventListener('change',()=>document.getElementById('paper-name').textContent=pdf.files[0]?.name||'Choose a searchable PDF');
  cover.addEventListener('change',()=>document.getElementById('cover-name').textContent=cover.files[0]?.name||'Choose JPG, PNG or WebP');
  form.addEventListener('submit',async event=>{
    event.preventDefault();next.hidden=true;
    const id=slug.value.trim();const paper=pdf.files[0];const image=cover.files[0];
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)){status.textContent='Please enter a valid lowercase article URL name.';return;}
    if(!paper||(!paper.name.toLowerCase().endsWith('.pdf')&&paper.type!=='application/pdf')){status.textContent='Choose a PDF research paper.';return;}
    if(!isImage(image)){status.textContent='Choose a JPG, PNG, or WebP cover image.';return;}
    if(paper.size>80*1024*1024){status.textContent='The PDF is too large (80 MB maximum).';return;}
    const extra=[...extras.files];if(extra.some(f=>!isImage(f))){status.textContent='Additional files must be JPG, PNG or WebP images.';return;}
    const names=new Set();
    function imageName(file){let name=safeName(file.name);let stem=name.replace(/\.[^.]*$/,'');let ext=name.match(/\.[^.]*$/)?.[0]||'.jpg';let n=1;while(names.has(name)){name=`${stem}-${n++}${ext}`;}names.add(name);return 'assets/'+name;}
    const files=[{name:'paper.pdf',blob:paper},{name:'notes.md',bytes:enc.encode(document.getElementById('notes').value||'No additional notes supplied.')}];
    files.push({name:imageName(image),blob:image});
    for(const f of extra)files.push({name:imageName(f),blob:f});
    status.textContent='Preparing your ZIP on this device…';
    try{
      const result=await zip(files);
      const url=URL.createObjectURL(result);const link=document.createElement('a');link.href=url;link.download=id+'.zip';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      status.textContent=`Prepared ${id}.zip (${(result.size/1048576).toFixed(1)} MB). Next: upload it to GitHub.`;
      next.hidden=false;next.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){status.textContent='Could not create ZIP: '+err.message;}
  });
})();
