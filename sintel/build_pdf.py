#!/usr/bin/env python3
"""Build publication-ready Sintel paper from article HTML, preserving citations and figure order."""
from pathlib import Path
from bs4 import BeautifulSoup,NavigableString,Tag
from xml.sax.saxutils import escape
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import BaseDocTemplate,PageTemplate,Frame,Paragraph,Spacer,PageBreak,Table,TableStyle,KeepTogether,Image
from reportlab.pdfgen.canvas import Canvas
from pypdf import PdfWriter
from PIL import Image as PILImage
import re,json
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'Sintel_The_Time_She_Could_Not_See_Analysis.pdf'
soup=BeautifulSoup((ROOT/'index.html').read_text(encoding='utf-8'),'html.parser')
article=soup.select_one('article.article')
sources=json.loads((ROOT/'sources.json').read_text())
W,H=letter;L=.67*inch;R=.67*inch;CW=W-L-R
S=getSampleStyleSheet()
styles={
 'title':('Helvetica-Bold',32,36,'#17343b',6),
 'subtitle':('Helvetica',13.4,19,'#567075',16),
 'sec':('Helvetica-Bold',15,19,'#17343b',10),
 'body':('Helvetica',9.45,14.15,'#2e3d3f',11),
 'caption':('Helvetica',8.3,11.3,'#687c80',9),
 'toc':('Helvetica',9.6,14,'#2f454a',6),
 'ref':('Helvetica',8.1,11.5,'#2f4244',7),
 'label':('Helvetica-Bold',9.2,13,'#173b3e',9),
}
for key,(font,fs,leading,col,space) in styles.items():
 S.add(ParagraphStyle(name='s_'+key,fontName=font,fontSize=fs,leading=leading,textColor=colors.HexColor(col),spaceAfter=space,spaceBefore=8 if key=='sec' else 0,allowWidows=0,allowOrphans=0))
S.add(ParagraphStyle(name='s_cell',fontName='Helvetica',fontSize=8.5,leading=12,textColor=colors.HexColor('#273c3f')))
S.add(ParagraphStyle(name='s_key',fontName='Helvetica-Bold',fontSize=8.5,leading=12,textColor=colors.HexColor('#273c3f')))
def draw(cv,doc):
 cv.saveState();num=cv.getPageNumber()
 if num>1:
  cv.setFont('Helvetica-Bold',8);cv.setFillColor(colors.HexColor('#234349'));cv.drawString(L,H-.44*inch,'SINTEL | FILM ANALYSIS')
  cv.setStrokeColor(colors.HexColor('#6c9998'));cv.line(L,H-.50*inch,W-R,H-.50*inch)
 cv.setStrokeColor(colors.HexColor('#d5dedc'));cv.line(L,.47*inch,W-R,.47*inch)
 cv.setFont('Helvetica',7.5);cv.setFillColor(colors.HexColor('#708185'));cv.drawString(L,.29*inch,'Filmmic Foundations · independent short-film research')
 cv.drawRightString(W-R,.29*inch,str(num));cv.restoreState()
F=Frame(L,.62*inch,CW,H-1.26*inch,id='normal',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
D=BaseDocTemplate(str(OUT),pagesize=letter,leftMargin=L,rightMargin=R,bottomMargin=.62*inch,topMargin=.62*inch,title='Sintel: The Time She Could Not See',author='Filmmic Foundations')
D.addPageTemplates([PageTemplate(id='page',frames=[F],onPage=draw)])
def divider():
 t=Table([['']],colWidths=[CW],rowHeights=[1]);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#6a9b9d'))]));return t
def fmt(element):
 # Convert HTML markup into supported ReportLab inline tags, keeping citation target hyperlink.
 chunks=[]
 def walk(e):
  if isinstance(e,NavigableString):chunks.append(escape(str(e)));return
  if not isinstance(e,Tag):return
  if e.name=='a' and e.get('class') and 'cite' in e['class']:
   val=e.get_text(' ',strip=True)
   chunks.append(f'<link href="#{escape(e.get("href", "").lstrip("#"))}" color="#2d777d">{escape(val)}</link>')
   return
  start,end=('<i>','</i>') if e.name=='em' else (('<b>','</b>') if e.name in ('strong','b') else ('',''))
  chunks.append(start)
  for c in e.children:walk(c)
  chunks.append(end)
 for c in element.children:walk(c)
 return ''.join(chunks)
def make_still(fig):
 img=fig.find('img')
 src=ROOT/img['src']
 assert src.is_file(),f'Missing film still: {src}'
 with PILImage.open(src) as raster: iw,ih=raster.size
 mw,mh=CW-7,3.10*inch
 k=min(mw/iw,mh/ih)
 picture=Image(str(src),width=iw*k,height=ih*k)
 caption=fig.select_one('figcaption')
 return KeepTogether([picture,Spacer(1,5),Paragraph(escape(caption.get_text(' ',strip=True)),S['s_caption']),Spacer(1,6)])

def make_diagram(fig):
 cells=[]
 for cell in fig.select('.sintel-diagram-cell'):
  cells.append((cell.select_one('b').get_text(' ',strip=True),cell.select_one('span').get_text(' ',strip=True)))
 t=Table([[Paragraph(escape(a),S['s_key']) for a,b in cells],[Paragraph(escape(b),S['s_cell']) for a,b in cells]],colWidths=[CW/len(cells)]*len(cells))
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e1eae9')),('BACKGROUND',(0,1),(-1,-1),colors.HexColor('#f4f7f6')),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#cbd7d6')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
 caption=fig.select_one('figcaption')
 return KeepTogether([t,Spacer(1,6),Paragraph(escape(caption.get_text(' ',strip=True)),S['s_caption']),Spacer(1,6)])
story=[]
# Cover aligned with Mindglass publication design, authentic film still included.
story.extend([Spacer(1,.11*inch),Paragraph('SINTEL',S['s_title']),Paragraph('The Time She Could Not See',S['s_subtitle']),divider(),Spacer(1,.18*inch)])
cover=ROOT/'assets/sintel-comforts-young-scales.jpg'
with PILImage.open(cover) as im: cover_w,cover_h=im.size
story.append(Image(str(cover),width=CW,height=CW*cover_h/cover_w))
story.append(Spacer(1,5))
story.append(Paragraph('Cover image. Sintel comforting young Scales, film still. © Blender Foundation, 2010; CC BY 3.0.',S['s_caption']))
story.append(Spacer(1,.11*inch))
story.append(Paragraph('An in-depth critical analysis',S['s_label']))
story.append(Paragraph('Narrative time, dramatic irony, Scales’s wing mark, restricted knowledge, visual performance, music and open production practice. Film frames are integrated at the points where they support the analysis.',S['s_body']))
info=[('Film','Sintel (2010), 14 min 48 sec'),('Director / screenplay','Colin Levy / Esther Wouda; story concept by Martin Lodewijk'),('Production / design','Blender Foundation; art direction David Revoy; score Jan Morgenstern'),('Research approach','20 documented sources; original film, primary records, criticism and scholarship')]
mt=Table([[Paragraph(escape(k),S['s_key']),Paragraph(escape(v),S['s_cell'])] for k,v in info],colWidths=[118,CW-118]);mt.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#edf3f2')),('GRID',(0,0),(-1,-1),.3,colors.HexColor('#c8d9d6')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
story.append(mt);story.append(PageBreak())
story.append(Paragraph('Contents &amp; research method',S['s_sec']))
heads=[h for h in article.find_all('h2',recursive=False) if h.get('id')!='references-and-further-viewing']
for h in heads:story.append(Paragraph(escape(h.get_text(' ',strip=True)),S['s_toc']))
story.extend([Spacer(1,10),Paragraph('Method: the film and first-hand production accounts establish scenes and credits. Secondary film research informs close reading; tertiary sources are used for limited cross-checks. Interpretations are distinguished from claims of filmmaker intention. Contents entries are deliberately unlinked.',S['s_caption']),PageBreak()])
figs=0
for node in article.children:
 if isinstance(node,NavigableString) or not isinstance(node,Tag):continue
 if node.name=='h2':
  if node.get('id')=='references-and-further-viewing':break
  story.append(Paragraph(escape(node.get_text(' ',strip=True)),S['s_sec']))
 elif node.name=='p':
  story.append(Paragraph(fmt(node),S['s_body']))
 elif node.name=='figure':
  figs+=1;story.append(make_still(node) if node.find('img') else make_diagram(node))
story.append(PageBreak())
story.append(Paragraph('References and further viewing',S['s_sec']))
story.append(Paragraph('The source category describes each reference’s role. Bracketed in-text citations link to entries here; outward URLs remain clickable.',S['s_caption']))
for i,src in enumerate(sources,1):
 url=src['url'];lab=escape(f"[{i}] {src['author']}. {src['title']}. {src['venue']}, {src['date']}.")
 s=f'<a name="ref-{i}"/>{lab} <link href="{escape(url)}" color="#2d777d">{escape(url)}</link><br/><i>{escape(src["kind"])}</i> — {escape(src["note"])}'
 story.append(Paragraph(s,S['s_ref']))
D.build(story)
Wri=PdfWriter(clone_from=str(OUT));Wri.add_metadata({'/Title':'Sintel: The Time She Could Not See','/Author':'Filmmic Foundations','/Creator':'Filmmic Foundations','/Subject':'Independent film research analysis with original stills and diagrams'})
with open(str(OUT)+'.tmp','wb') as f:Wri.write(f)
Path(str(OUT)+'.tmp').replace(OUT)
print('PDF created',OUT,'diagrams',figs,'bytes',OUT.stat().st_size)
