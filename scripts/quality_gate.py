#!/usr/bin/env python3
"""Pre-publication gate. Run after build_archive.py (stdlib only).

Checks the deployable site, not claims of scholarly factual accuracy.
Local links and publication integrity block deployment; accessibility and
cross-browser recommendations are reported separately.
"""
from __future__ import annotations
from collections import Counter
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from citations import make_citations
SITE = 'filmmicfoundations.github.io'
ERRORS=[]
WARNINGS=[]


def error(m):ERRORS.append(m)
def warn(m):WARNINGS.append(m)


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids=[];self.links=[];self.images=[];self.buttons=[];self.inputs=[]
        self.tags=Counter();self.lang='';self.titles=0;self.h1=0;self.outbound=[];self.meta=[]
        self.in_title=False;self.title_text=[];self.dialogs=[]
        self.button_depth=0;self.nested_buttons=0
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        self.tags[tag]+=1
        if attrs.get('id'):self.ids.append(attrs['id'])
        if tag=='html':self.lang=attrs.get('lang','')
        if tag=='title':self.in_title=True;self.titles+=1
        if tag=='h1':self.h1+=1
        if tag=='dialog':self.dialogs.append(attrs)
        if tag=='meta':self.meta.append(attrs)
        if tag=='a':self.links.append(('href',attrs.get('href',''),attrs))
        if tag in ('img','script','iframe','source'):
            attr='src'
            if attrs.get(attr):self.links.append((attr,attrs[attr],attrs))
        if tag=='link' and attrs.get('href'):
            self.links.append(('href',attrs['href'],attrs))
        if tag=='img':self.images.append(attrs)
        if tag=='button':
            if self.button_depth:self.nested_buttons+=1
            self.button_depth+=1
            self.buttons.append(attrs)
        if tag=='input':self.inputs.append(attrs)
        if tag in ('img','source') and attrs.get('srcset'):
            for entry in attrs['srcset'].split(','):
                uri=entry.strip().split(' ')[0]
                if uri:self.links.append(('srcset',uri,attrs))
    def handle_endtag(self,tag):
        if tag=='title':self.in_title=False
        if tag=='button' and self.button_depth:self.button_depth-=1
    def handle_data(self,data):
        if self.in_title:self.title_text.append(data)


def load_html(path):
    p=Document()
    try:p.feed(path.read_text(encoding='utf-8'))
    except Exception as e:error(f'{path.relative_to(ROOT)}: invalid HTML encoding: {e}')
    return p


PAGES={}

def collect_pages():
    for path in sorted(ROOT.rglob('*.html')):
        if '_site' in path.parts:continue
        PAGES[path.resolve()]=load_html(path)


def locate(source,href):
    s=urlsplit(href.strip())
    if s.scheme in ('data','mailto','tel','javascript','blob'):return None,None
    if s.netloc and s.netloc.lower()!=SITE:return None,None
    if s.scheme and s.scheme not in ('http','https'):return None,None
    path=unquote(s.path)
    if not path:target=source
    elif path.startswith('/'):target=ROOT/path.lstrip('/')
    else:target=source.parent/path
    if target.is_dir() or (not target.suffix and not target.exists()):target=target/'index.html'
    try:resolved=target.resolve()
    except Exception:return target,s.fragment
    if resolved!=ROOT.resolve() and ROOT.resolve() not in resolved.parents:
        error(f'{source.relative_to(ROOT)}: unsafe path escapes repository: {href}')
        return None,None
    return resolved,unquote(s.fragment)


def check_local_assets():
    for path,doc in PAGES.items():
        label=path.relative_to(ROOT)
        if doc.lang!='en':warn(f'{label}: specify lang="en" for assistive technology')
        if doc.titles!=1 or not ''.join(doc.title_text).strip():error(f'{label}: must have one nonempty <title>')
        if doc.h1!=1:warn(f'{label}: expected one top-level h1 (found {doc.h1})')
        if doc.tags['main']==0:error(f'{label}: missing main landmark')
        if doc.nested_buttons:error(f'{label}: nested buttons found ({doc.nested_buttons}); image viewers need one trigger per figure')
        duplicates=[k for k,v in Counter(doc.ids).items() if v>1]
        if duplicates:error(f'{label}: duplicate ids: {", ".join(duplicates[:8])}')
        # Same property with attribute order swapped silently duplicated article dates in prior releases.
        if '/article.json' not in str(label):
            raw=path.read_text(encoding='utf-8')
            for property_name in ('article:published_time','article:modified_time'):
                tags=re.findall(r'<meta\b[^>]*>',raw,flags=re.I)
                count=sum(bool(re.search(r'\bproperty\s*=\s*["\']'+re.escape(property_name)+r'["\']',tag,flags=re.I)) for tag in tags)
                if count>1:error(f'{label}: duplicate {property_name} metadata ({count})')
        for image in doc.images:
            if 'alt' not in image:error(f'{label}: img lacks alt text: {image.get("src","")}')
        for button in doc.buttons:
            # Static label check is advisory; button text is also an accessible name.
            if not (button.get('aria-label') or button.get('title') or button.get('id') or button.get('class') or button.get('data-citation-style')):
                warn(f'{label}: check accessible button name')
        for dialog in doc.dialogs:
            if not (dialog.get('aria-label') or dialog.get('aria-labelledby')):
                error(f'{label}: dialog needs an accessible label')
        for kind,href,attrs in doc.links:
            if not href or href=='#':continue  # JS-driven placeholders
            if href.startswith('//'):continue
            target,fragment=locate(path,href)
            if target is None:continue
            if not target.is_file():error(f'{label}: broken {kind} link: {href}')
            elif fragment and target in PAGES and fragment not in PAGES[target].ids:
                error(f'{label}: missing fragment #{fragment} in {target.relative_to(ROOT)}')
        for link in doc.links:
            kind,href,attrs=link
            if kind=='href' and attrs.get('target')=='_blank':
                if 'noopener' not in attrs.get('rel','').split():warn(f'{label}: external new-tab link missing rel=noopener: {href}')
    # Local CSS image assets, same lookup semantics relative to the CSS location.
    for css in sorted((ROOT/'assets/css').glob('*.css'))+[ROOT/'style.css',ROOT/'mindglassprocedure/style.css']:
        content=css.read_text(encoding='utf-8')
        for href in re.findall(r'url\(\s*[\"\']?([^\)\"\']+)[\"\']?\s*\)',content):
            href=href.strip()
            if href.startswith(('#','data:','https:','http:','//')):continue
            dest,_=locate(css,href)
            if dest and not dest.is_file():error(f'{css.relative_to(ROOT)}: missing CSS asset {href}')


def validate_article(article_json):
    slug=article_json.parent.name
    label=str(article_json.relative_to(ROOT))
    try:a=json.loads(article_json.read_text(encoding='utf-8'))
    except Exception as e:error(f'{label}: invalid JSON: {e}');return
    a['slug']=slug
    for field in ['title','citation_title','description','article_date','film_year','abstract']:
        if not isinstance(a.get(field),str) or not a[field].strip():error(f'{label}: required {field} is missing')
    for field in ['themes','techniques','tags','genre']:
        value=a.get(field)
        if not isinstance(value,list) or not all(isinstance(x,str) and x.strip() for x in value):
            error(f'{label}: {field} should be a list of nonempty terms')
    try:
        published=date.fromisoformat(a['article_date'])
        revised=date.fromisoformat(a.get('updated_date') or a['article_date'])
        if revised<published:error(f'{label}: updated_date is earlier than article_date')
        film_year=int(a['film_year'])
        if not 1880<=film_year<=published.year+1:warn(f'{label}: verify film_year ({film_year})')
    except (KeyError,TypeError,ValueError) as e:error(f'{label}: invalid date/year: {e}')
    page=(article_json.parent/'index.html').resolve()
    if page not in PAGES:error(f'{label}: article index.html missing')
    else:
        html=page.read_text(encoding='utf-8')
        refs=len(re.findall(r'id="ref-\d+"',html))
        if refs==0:error(f'{label}: article needs a traceable reference list (id="ref-N")')
        if '<article' not in html:error(f'{label}: research text missing article element')
        if not re.search(r'assets/js/site-settings(?:-colors-v2)?\.js',html) or not re.search(r'assets/css/site-settings(?:-colors-v2)?\.css',html):
            error(f'{label}: shared settings not installed; run build_archive.py')
        if 'id="ff-citation-data"' not in html:error(f'{label}: generated citation data missing; run build_archive.py')
        else:
            match=re.search(r'<script id="ff-citation-data" type="application/json">(.*?)</script>',html,re.S)
            if not match:error(f'{label}: citation data format invalid')
            else:
                try:
                    from citations import make_citations, make_citation_html
                    generated=json.loads(match.group(1))
                    expected=make_citations(a)
                    if generated!=expected:error(f'{label}: citation formats are stale or inconsistent with article.json')
                    rich_match=re.search(r'<script id="ff-citation-html" type="application/json">(.*?)</script>',html,re.S)
                    if not rich_match or json.loads(rich_match.group(1)) != make_citation_html(a):
                        error(f'{label}: formatted citation markup is stale or inconsistent with article.json')
                except Exception as e:error(f'{label}: broken citation JSON: {e}')
        meta=re.search(r'<script id="ff-article-schema" type="application/ld\+json">(.*?)</script>',html,re.S)
        if not meta:error(f'{label}: missing article structured data')
        else:
            try:
                schema=json.loads(meta.group(1))
                if schema.get('author',{}).get('name')!='Filmmic Foundations':error(f'{label}: article attribution is not publication-level')
                if schema.get('datePublished')!=a.get('article_date'):error(f'{label}: structured publication date mismatch')
            except Exception as e:error(f'{label}: invalid scholarly schema: {e}')
    for field in ['image']:
        if a.get(field) and not (article_json.parent/a[field]).is_file():error(f'{label}: missing {field} {a[field]}')
    preview=article_json.parent/'preview.json'
    if preview.is_file():
        try:
            p=json.loads(preview.read_text(encoding='utf-8'))
            for img in p.get('images',[]):
                if not (article_json.parent/img).is_file():error(f'{preview.relative_to(ROOT)}: missing preview image {img}')
        except Exception as e:error(f'{preview.relative_to(ROOT)}: invalid preview manifest: {e}')


def editorial_consistency():
    """All published long-form analyses must satisfy the promised reading range.

    The archive builder computes the label from the actual article content at
    225 words/minute, so checking the generated label cannot make a short
    article appear longer through manually edited metadata.
    """
    for path in ROOT.glob('*/article.json'):
        name=path.parent.name
        page=(path.parent/'index.html').read_text(encoding='utf-8')
        m=re.search(r'<strong>Reading time</strong>\s*(\d+)\s*min',page)
        if not m:error(f'{name}: reading-time metadata is missing')
        elif not 20 <= int(m.group(1)) <= 30:
            error(f'{name}: long-form articles must have a genuine 20–30 minute reading time; found {m.group(1)} min')
        positions=[page.find('id="watch"'),page.find('id="suggested-articles"'),page.rfind('<footer')]
        if not (positions[0]>=0 and positions[1]>positions[0] and positions[2]>positions[1]):
            error(f'{name}: Suggested Articles must follow Watch the Film and precede the footer')
        if any('article-image-open' in figure.group(0) for figure in re.finditer(r'<figure\b[^>]*class="[^"]*diagram[^"]*"[^>]*>.*?</figure>',page,re.S)):
            error(f'{name}: diagrams must not register as lightbox items')
        # Figure numbers must run in article reading order, including original diagrams.
        # Do not let rearranged stills silently leave Figure 10 before Figure 9.
        figure_numbers=[]
        for figure in re.findall(r'<figure\b[^>]*>.*?</figure>',page,flags=re.S):
            caption=re.search(r'<figcaption\b[^>]*>(.*?)</figcaption>',figure,re.S)
            if not caption:continue
            plain=re.sub(r'<[^>]*>','',caption.group(1))
            n=re.search(r'Figure\s+(\d+)\.',plain)
            if n:figure_numbers.append(int(n.group(1)))
        if figure_numbers and figure_numbers!=list(range(1,len(figure_numbers)+1)):
            error(f'{name}: figure numbering is not sequential in reading order: {figure_numbers}')
        # A mistake in Alike used duplicate crops and remote-hosted gallery assets.
        viewer_paths=[]
        for fig in re.finditer(r'<figure\b[^>]*>.*?</figure>',page,re.S):
            raw=fig.group(0)
            if 'article-image-open' not in raw:continue
            tags=re.findall(r'<img\b[^>]*>',raw,re.I)
            if len(tags)!=1:error(f'{name}: each viewer figure must contain exactly one image')
            for tag in tags:
                match=re.search(r'\bsrc\s*=\s*["\']([^"\']+)',tag,re.I)
                if not match:continue
                img=match.group(1)
                if img.startswith(('https:','http:','//')):
                    # Specific, documented emergency exceptions are allowed with a visible warning.
                    # All future articles still require local stills by default. Never implicitly
                    # whitelist an arbitrary third-party URL.
                    exception_file=path.parent/'EXTERNAL_IMAGE_EXCEPTION.json'
                    try:
                        exception=json.loads(exception_file.read_text(encoding='utf-8'))
                        allowed=(exception.get('status')=='temporary_exception'
                                 and exception.get('article')==name
                                 and img in exception.get('sources',[])
                                 and 'Image source' in raw)
                    except (OSError,ValueError):
                        allowed=False
                    if allowed:
                        warn(f'{name}: TEMPORARY nonlocal film still requires verified JPEG replacement: {img}')
                    else:
                        error(f'{name}: viewer must use locally archived film stills: {img}')
                if not all(re.search(r'\b'+attr+r'\s*=',tag,re.I) for attr in ('width','height')):
                    error(f'{name}: viewer image missing intrinsic width/height: {img}')
                viewer_paths.append(img)
        if len(set(viewer_paths))!=len(viewer_paths) and name!='mindglassprocedure':
            error(f'{name}: repeated stills used as separate gallery images')
        # Mindglass repeats two narrative stills in later analysis; shared JS
        # deduplicates their viewer tiles without changing the article's prose.


def privacy_assets():
    # Publication pages may contain factual filmmaker credits; do not confuse
    # them with the identity of the publication's owner.
    for path in ROOT.rglob('*.pdf'):
        if '_site' in path.parts:continue
        raw=path.read_bytes()
        for key in [b'Author',b'Creator',b'LastModifiedBy']:
            hits=re.findall(rb'/' + key + rb'\s*\(([^)]*)\)',raw)
            for hit in hits:
                val=hit.decode('latin-1',errors='replace').strip()
                if val and val not in ('Filmmic Foundations','anonymous') and key!=b'Creator':
                    error(f'{path.relative_to(ROOT)}: PDF {key.decode()} metadata may reveal publisher identity: {val[:70]}')
                if val and key==b'Creator' and val not in ('Filmmic Foundations','ReportLab PDF Library - (opensource)'):
                    warn(f'{path.relative_to(ROOT)}: review PDF Creator metadata: {val[:70]}')
        if not raw.startswith(b'%PDF-'):error(f'{path.relative_to(ROOT)}: PDF signature invalid')
    for path in ROOT.rglob('*'):
        if not path.is_file() or '_site' in path.parts:continue
        suffix=path.suffix.lower()
        if suffix=='.webp':
            raw=path.read_bytes()
            if not raw.startswith(b'RIFF') or raw[8:12]!=b'WEBP':error(f'{path.relative_to(ROOT)}: invalid WebP')
            pos=12
            while pos+8<=len(raw):
                typ=raw[pos:pos+4];size=int.from_bytes(raw[pos+4:pos+8],'little')
                if typ in (b'EXIF',b'XMP '):error(f'{path.relative_to(ROOT)}: WebP contains {typ.decode().strip()} metadata; strip before publishing')
                pos+=8+size+(size%2)
        elif suffix in ('.jpg','.jpeg'):
            if b'Exif\x00\x00' in path.read_bytes():error(f'{path.relative_to(ROOT)}: JPEG EXIF should be stripped before publishing')
        elif suffix=='.png':
            if b'eXIf' in path.read_bytes():error(f'{path.relative_to(ROOT)}: PNG EXIF should be stripped before publishing')


def generated_assets():
    for name in ['sitemap.xml','feed.xml']:
        try:ET.parse(ROOT/name)
        except Exception as e:error(f'{name}: invalid XML: {e}')
    try:
        search=json.loads((ROOT/'search-index.json').read_text(encoding='utf-8'))
        for meta in ROOT.glob('*/article.json'):
            if meta.parent.name not in search:error(f'search-index.json: missing {meta.parent.name}')
    except Exception as e:error(f'search-index.json: invalid search index: {e}')
    for asset in ['404.html','favicon.svg','favicon.ico','assets/css/print.css','assets/css/site-settings.css','assets/js/site-settings.js','assets/images/apple-touch-icon.png']:
        if not (ROOT/asset).is_file():error(f'missing essential asset: {asset}')
    for source in ['index.html','404.html','about/index.html']:
        html=(ROOT/source).read_text(encoding='utf-8')
        if not re.search(r'assets/js/site-settings(?:-colors-v2)?\.js',html):error(f'{source}: shared settings / header script missing')
    # Regression guard: an article-only ZIP must never publish its index.html at the site root.
    portal=(ROOT/'assets/js/developer.js').read_text(encoding='utf-8')
    if not all(marker in portal for marker in (
        "names.includes(first+'/404.html')",
        "names.includes(first+'/scripts/build_archive.py')",
        "!names.includes(first+'/article.json')")):
        error('Developer Portal ZIP unwrapping guard is missing: article uploads could replace the homepage')


def main():
    import subprocess
    test=subprocess.run([sys.executable,str(ROOT/'scripts/media_manifest.py'),'--check'],cwd=ROOT,capture_output=True,text=True)
    if test.returncode:
        error('Media manifest validation failed: '+test.stdout.strip()[:400])
    collect_pages()
    check_local_assets()
    articles=list(ROOT.glob('*/article.json'))
    if not articles:error('No published articles')
    for a in articles:validate_article(a)
    editorial_consistency()
    generated_assets()
    privacy_assets()
    for m in WARNINGS:print('WARNING:',m)
    for m in ERRORS:print('ERROR:',m)
    print(f'Quality gate: {len(PAGES)} pages, {len(articles)} articles, {len(ERRORS)} errors, {len(WARNINGS)} warnings.')
    return int(bool(ERRORS))


if __name__=='__main__':sys.exit(main())
