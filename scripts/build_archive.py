#!/usr/bin/env python3
"""Build Filmmic Foundations' static archive, search, RSS, SEO and related readings.

Use only Python's standard library; GitHub Actions needs no package installs.
The archive uses publication-level attribution without personal researcher bylines.
To add an article, create /slug/index.html and /slug/article.json. Optional
/slug/preview.json supplies the gallery/abstract for homepage previews.
"""
from pathlib import Path
from datetime import datetime, timezone
from email.utils import format_datetime
from html import escape
from html.parser import HTMLParser
import json
import math
import re
import xml.etree.ElementTree as ET
from citations import make_citations, make_citation_html

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / 'index.html'
BASE_URL = 'https://filmmicfoundations.github.io/'
START = '<!-- ARTICLES START:'
END = '<!-- ARTICLES END -->'
META_START = '<!-- ARTICLE META START -->'
META_END = '<!-- ARTICLE META END -->'
RELATED_START = '<!-- RELATED START -->'
RELATED_END = '<!-- RELATED END -->'


def j(text):
    return json.dumps(text, ensure_ascii=False, separators=(',', ':')).replace('</','<\\/')


def terms(value):
    values = [value] if isinstance(value, str) else (value or [])
    return {str(x).strip().casefold() for x in values if str(x).strip()}


def read_articles():
    articles = []
    for folder in ROOT.iterdir():
        if not folder.is_dir() or folder.name.startswith('.'):
            continue
        metadata = folder / 'article.json'
        if not metadata.is_file():
            continue
        if not (folder / 'index.html').is_file():
            raise ValueError(f'{folder.name}: missing index.html')
        data = json.loads(metadata.read_text(encoding='utf-8'))
        for field in ('title', 'description'):
            if not isinstance(data.get(field), str) or not data[field].strip():
                raise ValueError(f'{metadata}: missing {field}')
        data['slug'] = folder.name
        if not re.fullmatch(r'[a-z0-9][a-z0-9_-]*', folder.name):
            raise ValueError(f'{metadata}: slug must use a-z, 0-9, underscores or dashes')
        image = data.get('image') or ''
        if image and not (folder / image).is_file():
            raise ValueError(f'{metadata}: image {image} does not exist')
        for field in ('article_date','updated_date'):
            if data.get(field):
                datetime.strptime(str(data[field]),'%Y-%m-%d')
        articles.append(data)
    return sorted(articles, key=lambda a:(a.get('order',9999),a['title'].casefold()))


class ArticleText(HTMLParser):
    """Extract user-visible paper text only, not scripts, menus or navigation."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth=0
        self.skip=0
        self.words=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='article' and ('article' in attrs.get('class','').split()):
            self.depth+=1
        elif tag=='article' and self.depth:self.depth+=1
        if self.depth and tag in ('script','style','nav','aside'):
            self.skip+=1
    def handle_endtag(self,tag):
        if self.depth and tag in ('script','style','nav','aside') and self.skip:self.skip-=1
        if tag=='article' and self.depth:self.depth-=1
    def handle_data(self,data):
        if self.depth and not self.skip:self.words.append(data)


def extract_text(path):
    parser=ArticleText()
    parser.feed(path.read_text(encoding='utf-8'))
    return re.sub(r'\s+',' ',' '.join(parser.words)).strip()


def to_list(value):
    return [value] if isinstance(value,str) else list(value or [])


def thumbnail(image):
    if not image:return ''
    smaller = str(Path(image).with_name(Path(image).stem+'-640'+Path(image).suffix))
    return smaller if smaller!='' else image


def card(article):
    slug=escape(article['slug'],quote=True)
    cover=article.get('image') or ''
    alt=escape(article.get('image_alt',article['title']),quote=True)
    kind=escape(article.get('type','FILM ANALYSIS'))
    publish=article.get('article_date') or article.get('date') or str(article.get('year',''))
    year=escape(str(publish)[:4])
    film_year=escape(str(article.get('film_year','')),quote=True)
    title=escape(article['title'])
    desc=escape(article['description'])
    genres=article.get('genre',[])
    if isinstance(genres,str):genres=[genres]
    genre=escape(','.join(genres),quote=True)
    tags=to_list(article.get('tags')) + to_list(article.get('themes')) + to_list(article.get('techniques'))
    taglist=escape(','.join(tags),quote=True)
    date=escape(str(publish),quote=True)
    image_html=''
    if cover:
        base=f'{slug}/{escape(cover,quote=True)}'
        thumb_path=ROOT / article['slug'] / thumbnail(cover)
        srcset=f' srcset="{slug}/{escape(thumbnail(cover),quote=True)} 640w, {base} 1500w" sizes="(max-width: 700px) 100vw, (max-width: 1100px) 48vw, 600px"' if thumb_path.is_file() else ''
        image_html=f'<img src="{base}"{srcset} alt="{alt}" loading="lazy" decoding="async">'
    else:
        image_html='<div class="entry-placeholder" aria-hidden="true">FILMMIC FOUNDATIONS</div>'
    return f'''<div class="archive-card" data-title="{escape(article['title'],quote=True)}" data-year="{year}" data-article-year="{year}" data-film-year="{film_year}" data-date="{date}" data-genre="{genre}" data-tags="{taglist}"><a class="entry" href="{slug}/">
  {image_html}
  <div class="entry-body"><div class="tag">{kind} · {year}</div><h3>{title}</h3>
    <p>{desc}</p><span class="read">Read full research article <span class="css-arrow" aria-hidden="true"></span></span>
  </div></a><button type="button" class="archive-preview-trigger" data-preview="{slug}" aria-label="Preview {title}">Preview <span aria-hidden="true">↗</span></button></div>'''


def overlap(a,b):
    """Require a theme / technique relationship, not just the same genre."""
    theme=terms(a.get('themes')) & terms(b.get('themes'))
    technique=terms(a.get('techniques')) & terms(b.get('techniques'))
    tags=terms(a.get('tags')) & terms(b.get('tags'))
    score=len(theme)*4 + len(technique)*3 + len(tags)*2 + len(terms(a.get('genre')) & terms(b.get('genre')))*.5
    if not (theme or technique or len(tags)>=2):return 0
    return score if score>=3 else 0


def related_markup(article,others):
    matches=[]
    for candidate in others:
        if candidate['slug']==article['slug']:continue
        score=overlap(article,candidate)
        if score:matches.append((score,candidate))
    matches=sorted(matches,key=lambda pair:(-pair[0],pair[1]['title'].casefold()))[:3]
    if not matches:return ''
    cards=[]
    for score,match in matches:
        slug=escape(match['slug'],quote=True)
        cover=match.get('image') or ''
        img=(f'<img alt="{escape(match.get("image_alt",match["title"]),quote=True)}" loading="lazy" decoding="async" src="../{slug}/{escape(cover,quote=True)}">') if cover else ''
        cards.append(f'<a class="ff-related-card" href="../{slug}/">{img}<div class="ff-related-content"><small>{escape(match.get("type","FILM ANALYSIS"))}</small><h3>{escape(match["title"])}</h3><p>{escape(match["description"])}</p></div></a>')
    return ('<section class="ff-related-section" id="suggested-articles" aria-labelledby="ff-related-heading"><div class="ff-related-inner">'
            '<span class="ff-related-kicker">READ NEXT</span><h2 id="ff-related-heading">Suggested articles</h2>'
            '<p class="ff-related-intro">Further analyses with overlapping themes or filmmaking techniques. Suggestions are selected automatically from this archive.</p>'
            '<div class="ff-related-grid">'+''.join(cards)+'</div></div></section>')


def patch_region(text,start,end,payload):
    pattern=re.compile(re.escape(start)+'.*?'+re.escape(end),re.S)
    return pattern.sub(lambda _:start+'\n'+payload+'\n'+end,text,count=1)


def article_metadata(article,word_count):
    published=article.get('article_date') or article.get('date') or ''
    updated=article.get('updated_date') or published
    def timestamp(s):return f'<time datetime="{escape(s,quote=True)}">{escape(datetime.strptime(s,"%Y-%m-%d").strftime("%B %-d, %Y"))}</time>' if s else 'Date not specified'
    parts=[f'<span><strong>Published</strong> {timestamp(published)}</span>']
    if updated and published and updated>published:
        parts.append(f'<span><strong>Updated</strong> {timestamp(updated)}</span>')
    parts.append(f'<span><strong>Reading time</strong> {max(1,math.ceil(word_count/225))} min</span>')
    parts.append('<span><strong>Research</strong> Filmmic Foundations</span>')
    if article.get('film_year'):
        parts.append(f'<span><strong>Film</strong> {escape(str(article["film_year"]))}</span>')
    return '<div class="ff-publication-meta" aria-label="Publication information">'+''.join(parts)+'</div>'


def ensure_shared_settings(page):
    """Apply the shared header/settings UI to new articles at publishing time.

    This avoids future pages silently reverting to separate theme controls.
    Existing pages are left alone unless the shared stylesheet or script is missing.
    """
    home=HOME.read_text(encoding='utf-8')
    # Keep the shared icon-only Home link consistent in newly generated articles.
    icon=re.search(r'<a class="nav-link ff-home-link".*?</a>',home,re.S)
    if icon and 'ff-home-link' not in page:
        page=re.sub(r'<a class="nav-link"(\s+href="[^"]+"[^>]*)>Home</a>',
                    lambda m: '<a class="nav-link ff-home-link"'+m.group(1)+' aria-label="Home" title="Home">'+re.search(r'<svg.*?</svg>',icon.group(0),re.S).group(0)+'</a>',page,count=1)
    gear=re.search(r'<button class="ff-settings-toggle".*?</button>', home, flags=re.S)
    if not gear:raise ValueError('Homepage shared settings control is missing')
    if 'class="ff-settings-toggle"' not in page:
        page,count=re.subn(r'<button class="ff-theme-toggle".*?</button>',lambda _:gear.group(0),page,count=1,flags=re.S)
        if not count:
            page=page.replace('</nav></header>',gear.group(0)+'</nav></header>',1)
    page=re.sub(r'<script[^>]+src="\.\./assets/js/site-header\.js"[^>]*></script>', '',page)
    if 'assets/css/site-settings.css' not in page:
        page=page.replace('</head>','<link rel="stylesheet" href="../assets/css/site-settings.css"></head>',1)
    if 'assets/css/dropdowns.css' not in page:
        page=page.replace('</head>','<link rel="stylesheet" href="../assets/css/dropdowns.css"></head>',1)
    if 'assets/js/dropdowns.js' not in page:
        page=page.replace('</body>','<script defer src="../assets/js/dropdowns.js"></script></body>',1)
    if 'assets/js/site-settings.js' not in page:
        page=page.replace('</body>','<script defer src="../assets/js/site-settings.js"></script></body>',1)
    return page


def patch_articles(articles,full_text):
    for article in articles:
        slug=article['slug'];path=ROOT/slug/'index.html';page=ensure_shared_settings(path.read_text(encoding='utf-8'))
        if META_START not in page:
            page=re.sub(r'<article\b[^>]*>',lambda m:m.group(0)+META_START+'\n'+META_END,page,count=1)
        page=patch_region(page,META_START,META_END,article_metadata(article,len(full_text[slug].split())))
        if RELATED_START not in page:
            # Existing research pages have a watch section. Other article templates
            # can use the closing main/footer as an insertion point instead.
            marker='\n'+RELATED_START+'\n'+RELATED_END+'\n'
            if '<section class="watch"' in page:
                page=page.replace('</main>',marker+'</main>',1)
            elif '<footer' in page:
                page=page.replace('<footer',marker+'<footer',1)
            elif '</main>' in page:
                page=page.replace('</main>',marker+'</main>',1)
        page=patch_region(page,RELATED_START,RELATED_END,related_markup(article,articles))
        # Stable machine-readable source metadata; organization author is not a researcher profile.
        published=article.get('article_date') or article.get('date')
        updated=article.get('updated_date') or published
        image=article.get('image')
        schema={
            '@context':'https://schema.org','@type':'ScholarlyArticle',
            'headline':article['title']+' — critical short-film analysis',
            'name':article['title'],'description':article['description'],
            'abstract':article.get('abstract',article['description']),
            'url':BASE_URL+slug+'/','mainEntityOfPage':BASE_URL+slug+'/',
            'isAccessibleForFree':True,'inLanguage':article.get('language','en'),
            'genre':'Film studies','author':{'@type':'Organization','name':'Filmmic Foundations','url':BASE_URL},
            'publisher':{'@type':'Organization','name':'Filmmic Foundations','url':BASE_URL},
            'keywords':sorted(terms(article.get('tags'))|terms(article.get('themes'))|terms(article.get('techniques'))),
            'datePublished':published,'dateModified':updated,
            'about':{'@type':'Movie','name':article['title'], 'datePublished':str(article.get('film_year',''))}
        }
        if image:schema['image']=BASE_URL+slug+'/'+image
        schema={k:v for k,v in schema.items() if v is not None}
        citation_data='<script id="ff-citation-data" type="application/json">'+j(make_citations(article))+'</script>'
        citation_rich='<script id="ff-citation-html" type="application/json">'+j(make_citation_html(article))+'</script>'
        page=re.sub(r'<script id="ff-citation-data" type="application/json">.*?</script>', '', page,flags=re.S)
        page=re.sub(r'<script id="ff-citation-html" type="application/json">.*?</script>', '', page,flags=re.S)
        page=page.replace('</head>',citation_data+citation_rich+'</head>',1)
        jsonld='<script id="ff-article-schema" type="application/ld+json">'+j(schema)+'</script>'
        page=re.sub(r'<script id="ff-article-schema" type="application/ld\+json">.*?</script>', '', page,flags=re.S)
        page=page.replace('</head>',jsonld+'</head>',1)
        # Update OG publication dates without duplicating tags.
        page=re.sub(r'<meta\b(?=[^>]*\bproperty\s*=\s*[\"\']article:(?:published_time|modified_time)[\"\'])[^>]*>', '', page, flags=re.I)
        page=page.replace('</head>',f'<meta property="article:published_time" content="{escape(str(published or ""),quote=True)}"><meta property="article:modified_time" content="{escape(str(updated or ""),quote=True)}"></head>',1)
        # Shared developer portal link follows each future article automatically.
        if 'ff-dev-footer-link' not in page:
            footer_end=page.find('</footer>',page.find('<footer'))
            if footer_end>=0:
                page=page[:footer_end]+'<a class="ff-dev-footer-link" href="../dev/" rel="nofollow">Developer portal</a>'+page[footer_end:]
        path.write_text(page,encoding='utf-8')


def sitemap(articles):
    # Accessible landing/about pages are indexed, while machine feeds are linked via rel=alternate.
    root=ET.Element('urlset',xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')
    for link in [('',None),('about/',None)]+[(a['slug']+'/',a.get('updated_date') or a.get('article_date') or a.get('date')) for a in articles]:
        node=ET.SubElement(root,'url')
        ET.SubElement(node,'loc').text=BASE_URL+link[0]
        if link[1]: ET.SubElement(node,'lastmod').text=str(link[1])
    ET.indent(root,space='  ')
    ET.ElementTree(root).write(ROOT/'sitemap.xml',encoding='unicode',xml_declaration=True)


def feed(articles):
    ET.register_namespace('atom','http://www.w3.org/2005/Atom')
    rss=ET.Element('rss',{'version':'2.0'})
    channel=ET.SubElement(rss,'channel')
    def node(name,value):ET.SubElement(channel,name).text=value
    node('title','Filmmic Foundations — Short-Film Research')
    node('link',BASE_URL)
    node('description','New educational and critical research on short cinema, without individual author bylines.')
    node('language','en-US')
    ET.SubElement(channel,'{http://www.w3.org/2005/Atom}link',{'href':BASE_URL+'feed.xml','rel':'self','type':'application/rss+xml'})
    ordered=sorted(articles,key=lambda a:(a.get('updated_date') or a.get('article_date') or a.get('date') or ''),reverse=True)
    for article in ordered[:30]:
        item=ET.SubElement(channel,'item')
        for name,value in [('title',article['title']),('link',BASE_URL+article['slug']+'/'),('description',article['description']),('guid',BASE_URL+article['slug']+'/')]:ET.SubElement(item,name).text=value
        pub=article.get('updated_date') or article.get('article_date') or article.get('date')
        if pub:
            date=datetime.strptime(pub,'%Y-%m-%d').replace(tzinfo=timezone.utc)
            ET.SubElement(item,'pubDate').text=format_datetime(date)
        for tag in sorted(terms(article.get('themes'))|terms(article.get('tags'))):
            ET.SubElement(item,'category').text=tag
    ET.indent(rss,space='  ')
    ET.ElementTree(rss).write(ROOT/'feed.xml',encoding='unicode',xml_declaration=True)


def main():
    articles=read_articles()
    if not articles:raise ValueError('No articles found')
    fulltext={a['slug']:extract_text(ROOT/a['slug']/'index.html') for a in articles}
    html=HOME.read_text(encoding='utf-8')
    pattern=re.compile(r'<!-- ARTICLES START:.*?<!-- ARTICLES END -->',re.S)
    replacement=START+' generated by scripts/build_archive.py; do not edit this block manually. -->\n'+'\n'.join(card(a) for a in articles)+'\n'+END
    if not pattern.search(html):raise ValueError('Missing archive markers')
    html=pattern.sub(lambda _:replacement,html,count=1)
    html=re.sub(r'<small>\d+ PUBLICATION(?:S)?</small>',f'<small>{len(articles):02d} PUBLICATION{"S" if len(articles)!=1 else ""}</small>',html)
    site_schema={
      '@context':'https://schema.org','@graph':[
        {'@type':'WebSite','name':'Filmmic Foundations','url':BASE_URL,'description':'Anonymous educational analysis of short films.','potentialAction':{'@type':'SearchAction','target':{'@type':'EntryPoint','urlTemplate':BASE_URL+'?q={search_term_string}'},'query-input':'required name=search_term_string'}},
        {'@type':'CollectionPage','name':'Film Research Archive','url':BASE_URL,'isPartOf':{'@id':BASE_URL},'about':'Short-film research, cinematic techniques, and close visual analysis'},
        {'@type':'Organization','name':'Filmmic Foundations','url':BASE_URL}
      ]}
    jsonld='<script id="ff-site-schema" type="application/ld+json">'+j(site_schema)+'</script>'
    html=re.sub(r'<script id="ff-site-schema" type="application/ld\+json">.*?</script>', '',html,flags=re.S)
    html=html.replace('</head>',jsonld+'</head>',1)
    # Embed preview manifests for every article. This avoids a fragile per-card
    # network fetch and makes article previews work in local/offline QA too.
    previews = {}
    for article in articles:
        manifest = ROOT / article['slug'] / 'preview.json'
        if manifest.is_file():
            previews[article['slug']] = json.loads(manifest.read_text(encoding='utf-8'))
    preview_json = '<script id="preview-manifest" type="application/json">'+j(previews)+'</script>'
    html = re.sub(r'<script id="preview-manifest" type="application/json">.*?</script>',
                  lambda _: preview_json, html, flags=re.S)
    if 'id="preview-manifest"' not in html:
        html = html.replace('</body>', preview_json + '</body>', 1)
    HOME.write_text(html,encoding='utf-8')
    # Build compact full-text search index: it contains only publicly visible research text.
    (ROOT/'search-index.json').write_text(j({slug:text[:70000] for slug,text in fulltext.items()})+'\n',encoding='utf-8')
    patch_articles(articles,fulltext)
    sitemap(articles)
    feed(articles)
    print(f'Built {len(articles)} short-film article(s), full-text search, related articles, RSS, sitemap and schema.')

if __name__=='__main__':main()
