#!/usr/bin/env python3
"""Render editorial manuscript into original shared site article shell."""
from pathlib import Path
from bs4 import BeautifulSoup, Tag
import json,re,html
from urllib.parse import quote
ROOT=Path(__file__).resolve().parent
SITE=ROOT.parent
source=(SITE/'spring'/'index.html').read_text(encoding='utf-8')
soup=BeautifulSoup(source,'html.parser')
manuscript=(ROOT/'manuscript.md').read_text(encoding='utf-8')
sources=json.loads((ROOT/'sources.json').read_text())
# Heading and paragraphs with regex-driven inline citations.
sections=[];current=None
for block in re.split(r'\n\s*\n',manuscript):
    block=block.strip()
    if not block:continue
    if block.startswith('# '):continue
    if block.startswith('## '):
        current={'title':block[3:].strip(),'paras':[]};sections.append(current)
    elif current:
        current['paras'].append(block.replace('\n',' '))

def slugify(s):
    return re.sub('-+','-',re.sub(r'[^a-z0-9]+','-',s.lower())).strip('-')
def inline_markup(s):
    # Apply escaping before citations / emphasis to avoid raw HTML injection.
    s=html.escape(s)
    s=re.sub(r'\*\*(.*?)\*\*',r'<strong>\1</strong>',s)
    s=re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)',r'<em>\1</em>',s)
    s=re.sub(r'\[(\d+)\]',lambda m:f'<a href="#ref-{m.group(1)}" class="cite">[{m.group(1)}]</a>',s)
    return s
# 4 static diagrams and 15 authentic frames, extracted from uploaded 2048px film.
STILL_PLAN=json.loads((ROOT/'still-placement-plan.json').read_text(encoding='utf-8'))
# 4 static diagram visual studies; preserved as non-viewer figures
DIAGRAMS={
  3:('The changing question', [('Care','Who is this injured creature?'),('Loss','Who took Scales?'),('Recognition','Who has Scales become?')], 'Analytical diagram of the film’s reframed questions. This is an interpretation, not a storyboard frame.'),
  6:('Evidence and inference', [('Observable','A mark on the weapon'),('Interpretation','The location of the captor'),('Unverified','The identity of the smaller dragon')], 'Diagram distinguishing material clues from the assumptions Sintel attaches to them.'),
  8:('The delayed recognition', [('Young Scales','Injury and dependence'),('Adult dragon','Growth and protective reaction'),('Wing scar','Continuity across change')], 'Diagram of the recurring bodily clue whose meaning changes at the climax.'),
  12:('Two histories', [('What the viewer follows','A single continuous quest'),('What the landscape records','Accumulating effort and elapsed years'),('What the ending reveals','An earlier image cannot stand still')], 'Analytical comparison of the story’s emotional continuity and its concealed chronology.'),
}
article=soup.select_one('article.article')
# Preserve generated publication meta region only for rebuild.
article.clear()
article.append(BeautifulSoup('<!-- ARTICLE META START -->\n<!-- ARTICLE META END -->','html.parser'))
lead=BeautifulSoup('''<div class="article-meta"><span>FILM ANALYSIS</span><span>14:48-MINUTE ANIMATED SHORT</span><span>2010</span></div>
<div class="article-intro"><p>How can a character recognize a lost friend if she refuses to recognize what time has changed? <em>Sintel</em> follows the consequences of a painfully fixed image of love. Genuine film frames appear beside the close readings they support; original analytical diagrams are labeled and excluded from the still-image viewer.</p></div>''','html.parser')
article.append(lead)
figs=[]
for i,sec in enumerate(sections):
    title=sec['title']; sid=slugify(title)
    h2=soup.new_tag('h2',id=sid);h2.string=title;article.append(h2)
    for pidx,paragraph in enumerate(sec['paras'],1):
        p=soup.new_tag('p');frag=BeautifulSoup(inline_markup(paragraph),'html.parser')
        p.extend(list(frag.contents));article.append(p)
        for image in STILL_PLAN.get(str(i),[]):
            if image['after_paragraph'] != pidx:continue
            n=len(figs)+1
            name=image['name']; fig=soup.new_tag('figure',id=f'figure-{n}')
            fig['class']=['film-still-local','sintel-film-still']
            fig['data-source-time']=str(image['time'])
            btn=soup.new_tag('button',type='button');btn['class']='article-image-open';btn['aria-label']='Enlarge film still: '+image['alt']
            img=soup.new_tag('img',src='assets/'+name+'.jpg',alt=image['alt'],width='2048',height='872',loading='lazy',decoding='async')
            img['srcset']=f'assets/{name}-640.jpg 640w, assets/{name}.jpg 2048w';img['sizes']='(max-width: 700px) 100vw, 850px'
            btn.append(img);hint=soup.new_tag('span');hint['class']='image-zoom-hint';hint['aria-hidden']='true';hint.string='Enlarge';btn.append(hint);fig.append(btn)
            fc=soup.new_tag('figcaption');label=soup.new_tag('strong');label.string=f'Figure {n}. ';fc.append(label);fc.append(image['caption']);fig.append(fc)
            article.append(fig);figs.append({'figure':n,'kind':'film_still','name':'assets/'+name+'.jpg','time':image['time'],'alt':image['alt'],'caption':image['caption']})
    if i+1 in DIAGRAMS:
        title2,cols,caption=DIAGRAMS[i+1]
        fig=soup.new_tag('figure',id=f'figure-{len(figs)+1}')
        fig['class']=['diagram','sintel-analysis-figure']
        titleel=soup.new_tag('strong');titleel['class']='sintel-diagram-heading';titleel.string=title2;fig.append(titleel)
        flow=soup.new_tag('div');flow['class']='sintel-diagram-row'
        for head,detail in cols:
            box=soup.new_tag('div');box['class']='sintel-diagram-cell'
            b=soup.new_tag('b');b.string=head
            span=soup.new_tag('span');span.string=detail
            box.extend([b,span]);flow.append(box)
        fig.append(flow)
        fc=soup.new_tag('figcaption');st=soup.new_tag('strong');st.string=f'Figure {len(figs)+1}. ';fc.append(st);fc.append(caption)
        fig.append(fc);article.append(fig)
        figs.append({'figure':len(figs)+1,'kind':'diagram','caption':caption})
hr=soup.new_tag('h2',id='references-and-further-viewing');hr.string='References and further viewing';article.append(hr)
intro=soup.new_tag('p');intro['class']='source-note';intro.string='Source categories identify each reference’s role. Production records establish credits and context; film theory informs but does not prove specific authorial intentions.';article.append(intro)
refs=soup.new_tag('ol');refs['class']='references'
for ix,s in enumerate(sources,1):
    li=soup.new_tag('li',id=f'ref-{ix}')
    nr=soup.new_tag('span');nr['class']='ref-num';nr.string=f'[{ix}]';li.append(nr)
    li.append(f' {s["author"]}. {s["title"]}. {s["venue"]}, {s["date"]}. ')
    link=soup.new_tag('a',href=s['url'],target='_blank',rel='noopener noreferrer');link.string=s['url'];li.append(link)
    small=soup.new_tag('small');small.string=f' — {s["kind"]}: {s["note"]}';li.append(small);refs.append(li)
article.append(refs)
for extra in ['Film stills were extracted from the Blender Foundation’s Sintel (2010) and archived as local JPEGs. © Blender Foundation, CC BY 3.0; analytical diagrams are original interpretive artwork.','Interpretations of mental states, memory and identity concern the fictional narration; they are not clinical claims or verified statements of authorial intention.']:
    p=soup.new_tag('p');p['class']='source-note';p.string=extra;article.append(p)
# Reuse citing section from Spring
orig=BeautifulSoup(source,'html.parser').select_one('#cite-this-article')
if orig: article.append(BeautifulSoup(str(orig),'html.parser'))
# replace side TOCs with new headings
for toc in [soup.select_one('.sidebar .toc'),soup.select_one('.mobile-contents-list')]:
    if toc:
        toc.clear()
        for sec in sections:
            a=soup.new_tag('a',href='#'+slugify(sec['title']));a.string=sec['title'];toc.append(a)
        for label,anchor in [('References and further viewing','references-and-further-viewing')]:
            a=soup.new_tag('a',href='#'+anchor);a.string=label;toc.append(a)
# customize title/head
soup.title.string='Sintel: The Time She Could Not See | Filmmic Foundations'
for t in soup.select('meta[name="twitter:title"]'): t['content']='Sintel: The Time She Could Not See'
for key,val in [('og:title','Sintel: The Time She Could Not See'),('og:description','A 25-minute film analysis of time, emotional alignment and tragic recognition in Colin Levy’s Sintel (2010).')]:
    tag=soup.find('meta',attrs={'property':key})
    if tag:tag['content']=val
for prop in ['og:image','twitter:image']:
    t=soup.find('meta',attrs={'property':prop}) or soup.find('meta',attrs={'name':prop})
    if t:t['content']='https://filmmicfoundations.github.io/sintel/assets/sintel-comforts-young-scales.jpg'
meta=soup.find('meta',attrs={'name':'description'})
if meta: meta['content']='A research analysis of Sintel (2010): memory, temporal narration, performance, color, and open-source animation.'
can=soup.find('link',rel='canonical')
if can: can['href']='https://filmmicfoundations.github.io/sintel/'
header=soup.select_one('.hero');heroimage=header.select_one('.hero-image')
heroimage['aria-label']='Film still of Sintel caring for the small dragon Scales in a warmly lit room.'
inner=header.select_one('.hero-inner')
inner.select_one('h1').string='SINTEL'
inner.select_one('.dek').string='The Time She Could Not See'
inner.select_one('.hero-caption').string='Colin Levy · Blender Foundation · 2010 · Genuine film still © Blender Foundation · CC BY 3.0'
inner.select_one('.eyebrow').string='INDEPENDENT FILM STUDIES · FANTASY ANIMATION · 2026'
inner.select_one('.ff-pdf-button')['href']='Sintel_The_Time_She_Could_Not_See_Analysis.pdf'
for btn in soup.select('a[href="Spring_The_Landscape_That_Answers_Back_Analysis.pdf"]'):btn['href']='Sintel_The_Time_She_Could_Not_See_Analysis.pdf'
# update watch
watch=soup.select_one('.watch')
watch.select_one('p').string='Watch the official Blender Foundation release of Sintel, then revisit the journey, Scales’s scar and the ending’s change of perspective.'
a=watch.select_one('a[href]');a['href']='https://www.youtube.com/watch?v=eRsGyueVLvQ';a.string='Watch official film on YouTube'
frame=watch.select_one('iframe');frame['src']='https://www.youtube-nocookie.com/embed/eRsGyueVLvQ';frame['data-ff-embed-url']=frame['src'];frame['title']='Sintel (2010), Blender Foundation open movie'
# replace old related suggestions with empty marker so archive builder can fill
related=soup.select_one('#suggested-articles')
if related: related.replace_with(BeautifulSoup('<!-- RELATED START -->\n<!-- RELATED END -->','html.parser'))
# citations and schema generated by archive builder later; strip stale inherited JSON blocks
for id in ['ff-citation-data','ff-citation-html','ff-article-schema']:
    tag=soup.find(id=id)
    if tag:tag.decompose()
# No user-visible old film references in site-specific article title/description.
for selector in ['.sidebar-note']:
    e=soup.select_one(selector)
    if e:e.string='Primary text: Sintel (2010). Method: film-based close reading supported by production records, criticism and scholarship; film frames archived locally under CC BY 3.0.'
# Remove old publication metadata; regenerated by build script.
for sel in ['.ff-publication-meta']:
    for t in article.select(sel):t.decompose()
# Clean film-specific css reference.
with open(ROOT/'index.html','w',encoding='utf-8') as f:f.write(str(soup))
print('sections',len(sections),'figures',len(figs),'source citations',len(article.select('a.cite')))
(ROOT/'media-figure-map.json').write_text(json.dumps({'film':'Sintel (2010)','cover':'assets/sintel-comforts-young-scales.jpg','film_stills':[x for x in figs if x['kind']=='film_still'],'figures':figs,'status':'complete','license':'https://creativecommons.org/licenses/by/3.0/','film_source':'https://durian.blender.org/about/'},indent=2,ensure_ascii=False),encoding='utf-8')
