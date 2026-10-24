#!/usr/bin/env python3
"""Rebuild the Alike PDF from the canonical article, with inline source citations.
Preserves the Mindglass-format cover, film information table, figure sequence,
source links, and an unlinked contents/research-method page.
"""
from pathlib import Path
from bs4 import BeautifulSoup, Tag, NavigableString
from xml.sax.saxutils import escape
from PIL import Image as PILImage
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Image, PageBreak, Table, TableStyle, KeepTogether
from reportlab.pdfgen.canvas import Canvas
from pypdf import PdfWriter
import re

ROOT=Path(__file__).resolve().parent
PDF=ROOT/'Alike_Color_Conformity_and_Attention_Film_Analysis.pdf'
soup=BeautifulSoup((ROOT/'index.html').read_text(encoding='utf-8'),'html.parser')
article=soup.select_one('article.article')
figures=[ch for ch in article.children if isinstance(ch,Tag) and ch.name=='figure']
assert len(figures)==10, f'Unexpected figure count: {len(figures)}'
S=getSampleStyleSheet()
S.add(ParagraphStyle(name='FFTitle',fontName='Helvetica-Bold',fontSize=30,leading=34,textColor=colors.HexColor('#18343b'),spaceAfter=7))
S.add(ParagraphStyle(name='FFsubtitle',fontName='Helvetica',fontSize=13.5,leading=18,textColor=colors.HexColor('#64767c'),spaceAfter=16))
S.add(ParagraphStyle(name='FFbody',fontName='Helvetica',fontSize=9.65,leading=14.4,spaceAfter=10,textColor=colors.HexColor('#29383d')))
S.add(ParagraphStyle(name='FFsection',fontName='Helvetica-Bold',fontSize=15.8,leading=20,spaceBefore=11,spaceAfter=10,textColor=colors.HexColor('#18343c')))
S.add(ParagraphStyle(name='FFsmall',fontName='Helvetica',fontSize=8.2,leading=11,spaceAfter=7,textColor=colors.HexColor('#687b80')))
S.add(ParagraphStyle(name='FFstrong',fontName='Helvetica-Bold',fontSize=10,leading=14,spaceAfter=7,textColor=colors.HexColor('#18343c')))
S.add(ParagraphStyle(name='FFkey',fontName='Helvetica-Bold',fontSize=8.4,leading=11.8,textColor=colors.HexColor('#233b41')))
S.add(ParagraphStyle(name='FFvalue',fontName='Helvetica',fontSize=8.3,leading=11.8,textColor=colors.HexColor('#293b41')))
S.add(ParagraphStyle(name='FFref',fontName='Helvetica',fontSize=8.25,leading=12.2,spaceAfter=6,textColor=colors.HexColor('#2e4147')))
W,H=letter; LM=.68*inch; RM=.68*inch; CW=W-LM-RM
class ArchiveCanvas(Canvas):
    def __init__(self,*a,**kw):super().__init__(*a,**kw);self.setCreator('Filmmic Foundations')
def header_footer(cv,doc):
    cv.saveState();n=cv.getPageNumber()
    if n>1:
        cv.setFillColor(colors.HexColor('#23454d'));cv.setFont('Helvetica-Bold',8.25);cv.drawString(LM,H-.44*inch,'ALIKE   |   FILM ANALYSIS')
        cv.setStrokeColor(colors.HexColor('#699ea0'));cv.setLineWidth(.7);cv.line(LM,H-.50*inch,W-RM,H-.50*inch)
    cv.setStrokeColor(colors.HexColor('#d1dbda'));cv.line(LM,.48*inch,W-RM,.48*inch)
    cv.setFillColor(colors.HexColor('#728185'));cv.setFont('Helvetica',7.4)
    cv.drawString(LM,.29*inch,'Critical analysis   •   animation   •   attention and education')
    cv.drawRightString(W-RM,.29*inch,str(n));cv.restoreState()
frame=Frame(LM,.64*inch,CW,H-1.28*inch,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
doc=BaseDocTemplate(str(PDF),pagesize=letter,leftMargin=LM,rightMargin=RM,topMargin=.64*inch,bottomMargin=.64*inch,title='Alike: Color, Conformity, and the Practice of Attention',author='Filmmic Foundations')
doc.addPageTemplates([PageTemplate(id='main',frames=[frame],onPage=header_footer)])
def sep_rule():
    t=Table([['']],colWidths=[CW],rowHeights=[1])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#559395'))]));return t

def img_element(path,maxh=3.4*inch,maxw=CW):
    with PILImage.open(path) as im:iw,ih=im.size
    scale=min(maxw/iw,maxh/ih)
    return Image(str(path),width=iw*scale,height=ih*scale)

def markup_children(node):
    """Keep the inline source anchors and emphasized text, rather than flattening citations into endnotes."""
    if isinstance(node,NavigableString):return escape(str(node))
    if not isinstance(node,Tag):return ''
    inside=''.join(map(markup_children,node.children))
    if node.name in ('em','i'):return '<i>'+inside+'</i>'
    if node.name in ('b','strong'):return '<b>'+inside+'</b>'
    if node.name=='a':
        href=node.get('href','')
        if href.startswith('#ref-'):
            return f'<link href="{escape(href)}" color="#2d777d">{inside}</link>'
        elif href.startswith('https://'):
            return f'<link href="{escape(href)}" color="#2d777d">{inside}</link>'
        return inside
    if node.name=='br':return '<br/>'
    return inside

def fig_element(fig,num):
    cap=fig.find('figcaption')
    caption=Paragraph(escape(cap.get_text(' ',strip=True)),S['FFsmall']) if cap else Spacer(1,4)
    im=fig.find('img')
    if im:
        path=ROOT/im['src']
        assert path.is_file(), path
        return KeepTogether([img_element(path,maxh=3.2*inch),Spacer(1,4),caption,Spacer(1,6)])
    special={1:'alike-diagram-color-arc-pdf.png',3:'alike-diagram-space-comparison-pdf.png',4:'alike-diagram-repetition-pdf.png'}
    path=ROOT/'assets'/special[num]
    return KeepTogether([img_element(path,maxh=4.1*inch),Spacer(1,4),caption,Spacer(1,7)])

story=[]
# Cover, emulating Mindglass and the previous Alike paper
story+=[Spacer(1,.20*inch),Paragraph('ALIKE',S['FFTitle']),Paragraph('Color, Conformity, and the Practice of Attention',S['FFsubtitle']),sep_rule(),Spacer(1,.20*inch)]
cover=ROOT/'assets/alike-paste-reacts-to-monochrome-city-cover.jpg'
story.append(img_element(cover,maxh=4.1*inch,maxw=CW))
story.append(Spacer(1,5))
story.append(Paragraph('Cover image. Film still of Paste reacting to the colorless city in <i>Alike</i> (2015).',S['FFsmall']))
story.append(Spacer(1,.12*inch))
story.append(Paragraph('An in-depth critical analysis',S['FFstrong']))
story.append(Paragraph('A close reading of animation, color, editing, urban repetition, music, and the parent-child relationship, with production evidence, cultural reception, and contextual educational research.',S['FFbody']))
info=[('Film','Alike (2015), animated short, about 8 minutes'),('Directors / writers','Daniel Martínez Lara and Rafa Cano Méndez'),('Production','Spain; film produced with Blender on Linux'),('Approach','Close visual analysis; verified sources distinguished from interpretation')]
t=Table([[Paragraph(a,S['FFkey']),Paragraph(b,S['FFvalue'])] for a,b in info],colWidths=[123,CW-123]);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#f0f4f3')),('BACKGROUND',(0,0),(0,-1),colors.HexColor('#e8efee')),('GRID',(0,0),(-1,-1),.3,colors.HexColor('#c9d6d5')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LEFTPADDING',(0,0),(-1,-1),9)]))
story += [t,PageBreak()]
# Contents unlinked by design
story.append(Paragraph('Contents &amp; research method',S['FFsection']))
story.append(Paragraph('This paper treats the animation as its primary text; official credits and a filmmakers’ interview supply production testimony; research on education and motivation supplies conceptual context; and publicly available commentary documents selected interpretive responses. None of these sources substitutes for observing the film.',S['FFbody']))
story.append(Paragraph('Figures identified as original analytical diagrams are schematic interpretations, not production imagery. Genuine film frames are embedded near the scenes and techniques discussed, with separate captions.',S['FFsmall']))
for h2 in article.find_all('h2',recursive=False):
    if h2.get_text(' ',strip=True) in ['References and further viewing','Cite this article']:continue
    story.append(Paragraph(escape(h2.get_text(' ',strip=True)),S['FFbody']))
story+=[Paragraph('References and further viewing',S['FFbody']),PageBreak()]

fig_num=0
for c in article.children:
    if not isinstance(c,Tag): continue
    if c.name=='h2':
        if c.get_text(' ',strip=True)=='References and further viewing':break
        story.append(Paragraph(escape(c.get_text(' ',strip=True)),S['FFsection']))
    elif c.name=='p':
        raw=''.join(markup_children(x) for x in c.children)
        if raw.strip():story.append(Paragraph(raw,S['FFbody']))
    elif c.name=='figure':
        fig_num+=1;story.append(fig_element(c,fig_num))
assert fig_num==10
story.append(PageBreak())
story.append(Paragraph('References and further viewing',S['FFsection']))
story.append(Paragraph('Sources are credited with their intended role: original film and filmmakers’ documentation, formal criticism, educational research, and tertiary reception references.',S['FFsmall']))
for n,li in enumerate(soup.select('ol.references li'),1):
    parts=[]
    for child in li.children:
        parts.append(markup_children(child))
    # avoid duplicate footnote numbers; explicit ID for internal links
    body=''.join(parts)
    body=re.sub(r'^\s*\[\d+\]\s*','',body)
    story.append(Paragraph(f'<a name="ref-{n}"/><b>[{n}]</b> {body}',S['FFref']))
doc.build(story,canvasmaker=ArchiveCanvas)
_w=PdfWriter(clone_from=str(PDF));_w.add_metadata({'/Author':'Filmmic Foundations','/Creator':'Filmmic Foundations','/Title':'Alike: Color, Conformity, and the Practice of Attention'})
tmp=PDF.with_suffix('.tmp.pdf')
with open(tmp,'wb') as f:_w.write(f)
tmp.replace(PDF)
print('PDF:',PDF, 'bytes',PDF.stat().st_size, 'figures',fig_num)
