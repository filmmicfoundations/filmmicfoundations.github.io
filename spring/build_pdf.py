#!/usr/bin/env python3
"""Rebuild Spring research PDF directly from article HTML, preserving figure sequence.
Run: python3 spring/build_pdf.py from website root.
The article HTML is authoritative: p/h2/figure order is reused in the PDF.
"""
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Tag
from PIL import Image as PILImage
from xml.sax.saxutils import escape
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Image, PageBreak, Table, TableStyle, KeepTogether
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen.canvas import Canvas
class ArchiveCanvas(Canvas):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.setCreator("Filmmic Foundations")
import re,json

ROOT=Path(__file__).resolve().parent
ASSETS=ROOT/'assets'
PDF=ROOT/'Spring_The_Landscape_That_Answers_Back_Analysis.pdf'
soup=BeautifulSoup((ROOT/'index.html').read_text(encoding='utf-8'),'html.parser')
article=soup.select_one('article.article')
media=json.loads((ROOT/'media-figure-map.json').read_text(encoding='utf-8'))
refs=json.loads((ROOT/'sources.json').read_text(encoding='utf-8'))

S=getSampleStyleSheet()
S.add(ParagraphStyle(name='FFbig',fontName='Helvetica-Bold',fontSize=33,leading=37,textColor=colors.HexColor('#162d34'),spaceAfter=7))
S.add(ParagraphStyle(name='FFsubtitle',fontName='Helvetica',fontSize=13.5,leading=18,textColor=colors.HexColor('#63767b'),spaceAfter=17))
S.add(ParagraphStyle(name='FFbody',fontName='Helvetica',fontSize=9.5,leading=14.1,spaceAfter=11,textColor=colors.HexColor('#28363a')))
S.add(ParagraphStyle(name='FFsec',fontName='Helvetica-Bold',fontSize=15,leading=19,spaceBefore=12,spaceAfter=10,textColor=colors.HexColor('#17313a')))
S.add(ParagraphStyle(name='FFtiny',fontName='Helvetica',fontSize=8.2,leading=10.9,textColor=colors.HexColor('#62747b'),spaceAfter=7))
S.add(ParagraphStyle(name='FFlabel',fontName='Helvetica-Bold',fontSize=10,leading=14,spaceAfter=7,textColor=colors.HexColor('#1a3840')))
S.add(ParagraphStyle(name='FFtcell',fontName='Helvetica',fontSize=8.45,leading=12,textColor=colors.HexColor('#273c41')))
S.add(ParagraphStyle(name='FFtkey',fontName='Helvetica-Bold',fontSize=8.5,leading=12,textColor=colors.HexColor('#233039')))
S.add(ParagraphStyle(name='FFref',fontName='Helvetica',fontSize=8.15,leading=11.6,spaceAfter=4.5,textColor=colors.HexColor('#22363d')))
PAGE_W,PAGE_H=letter; LM=0.67*inch; RM=0.67*inch; content_w=PAGE_W-LM-RM

def header_footer(cv,doc):
    cv.saveState();n=cv.getPageNumber()
    if n>1:
        cv.setFont('Helvetica-Bold',8.4);cv.setFillColor(colors.HexColor('#234148'))
        cv.drawString(LM,PAGE_H-.44*inch,'SPRING   |   FILM ANALYSIS')
        cv.setStrokeColor(colors.HexColor('#5a8587'));cv.line(LM,PAGE_H-.50*inch,PAGE_W-RM,PAGE_H-.50*inch)
    cv.setStrokeColor(colors.HexColor('#d5dfdd'));cv.line(LM,.47*inch,PAGE_W-RM,.47*inch)
    cv.setFont('Helvetica',7.6);cv.setFillColor(colors.HexColor('#708084'))
    cv.drawString(LM,.29*inch,'Critical analysis  |  research context  |  visual storytelling')
    cv.drawRightString(PAGE_W-RM,.29*inch,str(n));cv.restoreState()
frame=Frame(LM,.62*inch,content_w,PAGE_H-1.24*inch,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
D=BaseDocTemplate(str(PDF),pagesize=letter,leftMargin=LM,rightMargin=RM,topMargin=.62*inch,bottomMargin=.62*inch,title='Spring: The Landscape That Answers Back',author='Filmmic Foundations',subject='Independent research analysis')
D.addPageTemplates([PageTemplate(id='p',frames=[frame],onPage=header_footer)])

def strip_cite_markup(el):
    # Strip URL markup but preserve linked in-text citations and italics.
    return escape(el.get_text(' ',strip=True))

def body_as_html(text):
    val=escape(text)
    return re.sub(r'\[(\d+)\]',lambda m:f'<link href="#ref-{m.group(1)}" color="#2d777d">[{m.group(1)}]</link>',val)

def rule():
    r=Table([['']],colWidths=[content_w],rowHeights=[1]);r.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#6a9b9d'))]));return r

def film_figure(fig):
    num=int(fig['id'].replace('figure-',''))
    img=fig.select_one('img'); path=ROOT/img['src']
    assert path.is_file(), str(path)
    with PILImage.open(path) as im: iw,ih=im.size
    max_w,max_h=content_w-10,3.18*inch
    k=min(max_w/iw,max_h/ih)
    picture=Image(str(path),width=iw*k,height=ih*k)
    caption=Paragraph(escape(fig.find('figcaption').get_text(' ',strip=True)),S['FFtiny'])
    return KeepTogether([picture,Spacer(1,5),caption,Spacer(1,6)])

def diagram_figure(fig):
    num=int(fig['id'].replace('figure-',''))
    # Derive content from the actual HTML diagram structure instead of a separate figure list.
    cells=[]
    if fig.select_one('.diagram-row'):
        for block in fig.select('.diagram-row > div'):
            head=block.select_one('b')
            rest=[x.get_text(' ',strip=True) for x in block.select('span')]
            cells.append([head.get_text(' ',strip=True) if head else '', *rest])
    elif fig.select_one('.spring-process'):
        for block in fig.select('.spring-step'):
            cells.append([x.get_text(' ',strip=True) for x in [block.select_one('strong'),block.select_one('span')] if x])
    elif fig.select_one('.spring-scale-row'):
        for block in fig.select('.spring-scale-box'):
            cells.append([x.get_text(' ',strip=True) for x in [block.select_one('b'),block.select_one('p')] if x])
    else:
        cells=[['ANALYTICAL','ILLUSTRATION'],['Original diagram','See web article']]
    columns=len(cells);rows=max(len(c) for c in cells)
    # For tiny type keep a reasonable stacked table even when columns > 4.
    grid=[]
    for r in range(rows):
        grid.append([Paragraph(escape(c[r] if r<len(c) else ''),S['FFtkey'] if r==0 else S['FFtcell']) for c in cells])
    table=Table(grid,colWidths=[content_w/columns]*columns,hAlign='LEFT')
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dce9e6')),('BACKGROUND',(0,1),(-1,-1),colors.HexColor('#f4f7f6')),('GRID',(0,0),(-1,-1),.35,colors.HexColor('#c9d8d5')),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('VALIGN',(0,0),(-1,-1),'TOP')]))
    caption=Paragraph(escape(fig.find('figcaption').get_text(' ',strip=True)),S['FFtiny'])
    return KeepTogether([table,Spacer(1,6),caption,Spacer(1,7)])

story=[]
# Cover: same Mindglass template as before, but with authentic film still.
story.append(Paragraph('SPRING',S['FFbig']))
story.append(Paragraph('The Landscape That Answers Back',S['FFsubtitle']))
story.append(rule());story.append(Spacer(1,.18*inch))
cover=ROOT/media['cover'];assert cover.is_file()
with PILImage.open(cover) as im:iw,ih=im.size
story.append(Image(str(cover),width=content_w,height=content_w*ih/iw))
story.append(Spacer(1,5))
story.append(Paragraph('Cover image. Spring examining a glowing blue shard inside the cavern. Film still, © Blender Foundation | cloud.blender.org/spring (CC BY 4.0).',S['FFtiny']))
story.append(Spacer(1,.13*inch))
story.append(Paragraph('An in-depth critical analysis',S['FFlabel']))
story.append(Paragraph('A study of seasonal ritual, landscape, character animation, music, visual scale, production practice, and interpretive uncertainty.',S['FFbody']))
info=[('Film','Spring (2019), short animated film, 7 minutes 44 seconds'),('Director / writer','Andy Goralczyk'),('Production','Blender Animation Studio / Blender Foundation · CC BY 4.0'),('Research','18 sources: original film, production records, criticism, scholarship, catalogs')]
T=Table([[Paragraph(a,S['FFtkey']),Paragraph(b,S['FFtcell'])] for a,b in info],colWidths=[123,content_w-123]);T.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#ecf1f0')),('GRID',(0,0),(-1,-1),.3,colors.HexColor('#c8d5d3')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
story.append(T);story.append(PageBreak())

# Intentionally unlinked contents/method, consistent with Mindglass.
story.append(Paragraph('Contents &amp; research method',S['FFsec']))
for h in article.find_all('h2',recursive=False):
    if h.get('id') in ('references-and-further-viewing','ff-cite-heading'):continue
    story.append(Paragraph(escape(h.get_text(' ',strip=True)),S['FFbody']))
story.append(Paragraph('References and further viewing',S['FFbody']))
story.append(Spacer(1,10))
story.append(Paragraph('The original film is the primary text. Firsthand production records support verified credits and technical details; independent criticism and scholarship provide interpretation and conceptual context. These are not substitutes for on-screen evidence.',S['FFtiny']))
story.append(PageBreak())

fig_count=0
for c in article.children:
    if isinstance(c,NavigableString) or not isinstance(c,Tag): continue
    if c.name=='h2':
        if c.get('id')=='references-and-further-viewing':break
        story.append(Paragraph(escape(c.get_text(' ',strip=True)),S['FFsec']))
    elif c.name=='p':
        story.append(Paragraph(body_as_html(c.get_text(' ',strip=True)),S['FFbody']))
    elif c.name=='figure':
        fig_count+=1
        story.append(film_figure(c) if c.find('img') else diagram_figure(c))

story.append(PageBreak());story.append(Paragraph('References and further viewing',S['FFsec']))
story.append(Paragraph('The film remains the primary text. Source categories below identify the role of each reference. In-text bracketed citations link directly to the relevant entry.',S['FFtiny']))
for n,ref in enumerate(refs,1):
    url=ref['url']
    text=f'<a name="ref-{n}"/><b>[{n}] {escape(ref["author"])}.</b> {escape(ref["title"])}. {escape(ref["venue"])} ({escape(ref["date"])}). <link href="{escape(url)}" color="#2d777d">{escape(url)}</link><br/><i>{escape(ref["kind"])}.</i> {escape(ref["note"])}'
    story.append(Paragraph(text,S['FFref']))
D.build(story, canvasmaker=ArchiveCanvas)
# ReportLab may mark Creator as '(unspecified)' despite Canvas override;
# normalize via pypdf while preserving the PDF's annotations and named destinations.
from pypdf import PdfWriter
_w=PdfWriter(clone_from=str(PDF))
_w.add_metadata({'/Author':'Filmmic Foundations','/Creator':'Filmmic Foundations','/Title':'Spring: The Landscape That Answers Back','/Subject':'Independent research analysis'})
_tmp=PDF.with_suffix('.tmp.pdf')
with open(_tmp,'wb') as _f: _w.write(_f)
_tmp.replace(PDF)
print('PDF',PDF,'size',PDF.stat().st_size,'embedded figure count',fig_count)
