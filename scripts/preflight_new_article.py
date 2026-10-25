#!/usr/bin/env python3
"""Strict *technical* preflight for new Filmmic Foundations articles (Edition 3.0).
Usage: python3 scripts/preflight_new_article.py film-slug
Needs beautifulsoup4 and pypdf; scholarly/source truth must also be verified by a human/AI researcher.
Does not publish. Existing articles that predate v3 are not forced through this tool.
"""
import json, re, sys
from pathlib import Path
from urllib.parse import urlparse
from collections import Counter

try:
    from bs4 import BeautifulSoup
except ImportError:
    raise SystemExit('Install beautifulsoup4 for Edition 3.0 preflight.')
try:
    from pypdf import PdfReader
except ImportError:
    raise SystemExit('Install pypdf for Edition 3.0 PDF preflight.')

ROOT=Path(__file__).resolve().parents[1]

def main():
    if len(sys.argv)!=2:
        raise SystemExit('Usage: python3 scripts/preflight_new_article.py film-slug')
    slug=sys.argv[1]
    folder=ROOT/slug
    errors=[];warn=[]
    def err(x):errors.append(x)
    def warning(x):warn.append(x)
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug):err('Slug must be lowercase and hyphenated')
    if not folder.is_dir():raise SystemExit('Missing article directory: '+str(folder))
    def load_json(path):
        if not path.is_file():err('Missing '+str(path.relative_to(ROOT)));return {}
        try:return json.loads(path.read_text(encoding='utf-8'))
        except Exception as e:err('Invalid JSON '+str(path)+': '+str(e));return {}
    meta=load_json(folder/'article.json');preview=load_json(folder/'preview.json')
    source_ledger=load_json(folder/'research/sources-ledger.json')
    scene_ledger=load_json(folder/'research/scene-log.json')
    figures=load_json(folder/'research/figure-plan.json')
    sources=source_ledger.get('sources',[]) if isinstance(source_ledger,dict) else []
    if not isinstance(sources,list):sources=[];err('Source ledger must have a sources array')
    kinds=Counter()
    ids=[]
    for ref in sources:
        typ=str(ref.get('type',ref.get('kind',''))).strip().lower()
        if typ not in ('primary','secondary','tertiary'):err('Invalid source type at '+str(ref.get('id')))
        else:kinds[typ]+=1
        ids.append(ref.get('id'))
        url=str(ref.get('url',''))
        if not urlparse(url).scheme in ('https','http') or not urlparse(url).netloc:err('Source '+str(ref.get('id'))+' lacks real URL')
        for k in ('author','title','venue','date','supports'):
            if not ref.get(k):err('Source '+str(ref.get('id'))+' lacks '+k)
        if str(ref.get('verified','')).lower() not in ('yes','verified','true'):
            err('Source '+str(ref.get('id'))+' not marked verified; do not assume validity')
        if 'example.org' in url or any('replace' in str(v).lower() for v in ref.values() if isinstance(v,str)):
            err('Template placeholders in source '+str(ref.get('id')))
    if len(sources)<10:err('At least 10 verified distinct bibliography sources required; found '+str(len(sources)))
    if len(set(ids))!=len(ids):err('Duplicate source IDs in ledger')
    for kind in ('primary','secondary','tertiary'):
        if not kinds[kind]:err('Missing required source class '+kind)
    if not scene_ledger.get('scenes'):err('Scene log missing actual watched-film observations')

    html_path=folder/'index.html'
    if not html_path.is_file():err('Missing index.html');html=''
    else:html=html_path.read_text(encoding='utf-8')
    soup=BeautifulSoup(html,'html.parser')
    article=soup.select_one('article.article')
    if article is None:err('HTML missing article.article');article=soup
    body=BeautifulSoup(str(article),'html.parser')
    for el in body.select('ol.references,ul.references,.ff-cite-section,nav,aside,script,style,button,figcaption'):
        el.decompose()
    words=len(re.findall(r"\b[\w'-]+\b",body.get_text(' ',strip=True)))
    minutes=words/225
    if not 20<=minutes<=30:err(f'Actual body estimated {minutes:.1f} min ({words} words), expected 20–30 min at 225 wpm')
    stills=article.select('figure.film-still-local, figure.spring-film-still, figure.ff-film-still')
    # Filter uniquely by figure tag, exclude analytical diagrams accidentally sharing classes.
    stills=[f for f in dict.fromkeys(stills) if f.find('img') and not 'diagram' in f.get('class',[])]
    if not 7<=len(stills)<=15:err(f'Article has {len(stills)} still figures, expected 7–15')
    names=[]
    for f in stills:
        im=f.find('img');src=im.get('src','')
        names.append(src)
        if not src.startswith('assets/') or src.startswith('http'):err('Figure uses nonlocal path '+src)
        if not (folder/src).is_file():err('Missing figure image '+src)
        if not (folder/Path(src).with_name(Path(src).stem+'-640'+Path(src).suffix)).is_file():err('Missing responsive -640 image for '+src)
        if not im.get('width') or not im.get('height'):err('Missing intrinsic dimensions: '+src)
        if not im.get('alt'):err('Missing alt text: '+src)
        buttons=f.select('button.article-image-open')
        if len(buttons)!=1:err('Film still must have exactly one article-image-open button: '+src)
        if not f.find('figcaption'):err('Missing figure caption: '+src)
    if len(set(names))!=len(names):err('Duplicate stills in body')
    diagrams=article.select('figure.diagram,figure.spring-analysis-figure')
    for f in set(diagrams):
        if f.select_one('.article-image-open'):err('Diagram must NOT open in viewer')
    figs=article.select('figure[id^="figure-"]')
    nums=[]
    for f in figs:
        m=re.fullmatch(r'figure-(\d+)',str(f.get('id','')))
        if m:nums.append(int(m.group(1)))
    if nums!=list(range(1,len(nums)+1)):err('Figure numbers/IDs not sequential')
    prev_images=preview.get('images',[]) if isinstance(preview,dict) else []
    if len(prev_images)!=6 or len(set(prev_images))!=6:err('Preview must have EXACTLY six UNIQUE images')
    cover=meta.get('image','')
    if not cover or not (folder/cover).is_file():err('Missing current local cover '+str(cover))
    if prev_images and prev_images[0]!=cover:err('First preview image is not the cover from article.json')
    for p in prev_images:
        if not (folder/p).is_file():err('Missing local preview image '+p)
        if 'diagram' in p.lower():err('Diagram included in preview '+p)
    if len(preview.get('image_captions',[]))!=6:err('Preview needs six meaningful captions')
    if cover and cover not in html and Path(cover).name not in (folder/'style.css').read_text(encoding='utf-8') if (folder/'style.css').is_file() else cover not in html:
        warning('Cover not obvious in article markup/style; manually inspect hero')
    if 'ff-settings-toggle' not in html:err('Shared settings toggle missing')
    if 'data-ff-color' in html or 'Accent color' in html:err('Selectable accent theme reintroduced; prohibited')
    if not article.select('a.cite[href^="#ref-"]'):err('No clickable inline citation markers')
    cite_ids={a['href'][1:] for a in article.select('a.cite[href^="#ref-"]')}
    ids_in_page={x.get('id') for x in article.select('[id^="ref-"]')}
    if cite_ids-ids_in_page:err('Dangling in-text source links '+str(sorted(cite_ids-ids_in_page)))
    if len(ids_in_page)<10:err('Fewer than 10 bibliography entries in article HTML')
    pdfs=list(folder.glob('*.pdf'))
    if len(pdfs)!=1:err(f'Expected one article research PDF, found {len(pdfs)}')
    else:
        try:
            pdf=PdfReader(str(pdfs[0]))
            text=' '.join(p.extract_text() or '' for p in pdf.pages)
            refs=len(re.findall(r'\bReferences and further viewing\b',text,re.I))
            if not refs:err('PDF missing References and further viewing')
            if len(pdf.pages)<8:warning('Very short PDF page count: check full-text parity')
            if len([m for m in re.finditer(r'Figure\s+\d+\.',text)])<len(figs):err('PDF contains fewer figure labels than HTML')
            if len(set(re.findall(r'\b(?:\d+\.\s*)?(?:abstract|conclusion|references)\b',text,re.I)))==0:warning('PDF headings not recognized; inspect manually')
            if not any(p.get('/Annots') for p in pdf.pages[2:]):err('No PDF annotations in body/references; verify citation links')
        except Exception as e:err('PDF could not be read: '+str(e))
    if not figures.get('still_figures'):err('Figure-plan ledger missing still_figures')
    if len(figures.get('still_figures',[]))!=len(stills):err('Figure-plan and HTML still counts differ')
    if any(part in html for part in ('example.org','PLACEHOLDER','REPLACE THIS')):err('Placeholder text remains in HTML')
    print('NEW ARTICLE EDITION 3 PREFLIGHT')
    print('slug',slug,'words',words,'minutes',round(minutes,1),'sources',len(sources),'mix',dict(kinds),'stills',len(stills),'figures',len(figs))
    for m in errors:print('ERROR:',m)
    for m in warn:print('REVIEW:',m)
    print('RESULT:', 'FAIL' if errors else 'PASS (technical only; factual and UI review still mandatory)')
    sys.exit(1 if errors else 0)
if __name__=='__main__':main()
