#!/usr/bin/env python3
"""Targeted QA for citation placement/linking and restored fixed teal theme."""
import sys
from pathlib import Path
from bs4 import BeautifulSoup
import fitz
from playwright.sync_api import sync_playwright
from browser_smoke import html_for
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def ok(label,pass_bool):
    checks.append((label,bool(pass_bool)))
    if not pass_bool:raise AssertionError(label)
for slug,expected in [('alike',11),('spring',118)]:
    s=BeautifulSoup((ROOT/slug/'index.html').read_text(),'html.parser')
    links=s.select('article.article a.cite')
    ok(slug+' citation count',len(links)==expected)
    ok(slug+' destinations exist',all(s.select_one(a['href']) for a in links))
    ok(slug+' citations throughout',all(not p.get_text(' ',strip=True).endswith(links[-1].get_text(strip=True)) for p in s.select('article.article p') if p.select('a.cite')))
    d=fitz.open(ROOT/slug/('Alike_Color_Conformity_and_Attention_Film_Analysis.pdf' if slug=='alike' else 'Spring_The_Landscape_That_Answers_Back_Analysis.pdf'))
    allinks=[x for page in d for x in page.get_links()]
    ok(slug+' PDF clickable internal cites',sum(x.get('kind')==1 for x in allinks)==expected)
    ok(slug+' PDF contents unlinked',len(d[1].get_links())==0)
    ok(slug+' PDF source references preserved',sum(x.get('kind')==2 for x in allinks)>=10)
js=(ROOT/'assets/js/site-settings.js').read_text()
ok('no palette configuration',"color:['teal'" not in js and "['color','Theme color'" not in js)
for path in ROOT.rglob('*.html'):
    text=path.read_text()
    ok('no palette script '+str(path.relative_to(ROOT)), 'site-settings-colors-v2' not in text and 'accent-system' not in text)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    for rel in ['index.html','alike/index.html','spring/index.html']:
        page=browser.new_page(viewport={'width':1365,'height':900},reduced_motion='reduce')
        errs=[]
        page.on('pageerror',lambda err:errs.append(str(err)))
        page.set_content(html_for(rel),wait_until='domcontentloaded',timeout=30000)
        page.locator('.ff-settings-toggle').first.click(timeout=3000)
        ok(rel+' opens Settings',page.locator('#ff-settings-dialog').evaluate('(d)=>d.open'))
        ok(rel+' no theme-color choice',page.locator('#ff-pref-color').count()==0)
        ok(rel+' Light/Dark/System present',page.locator('#ff-pref-theme option').count()==3)
        ok(rel+' stable teal header',page.evaluate('getComputedStyle(document.querySelector(".ff-site-header")).getPropertyValue("--ff-header-accent").trim()') in ('#2d777d','#8fcac6',''))
        page.locator('.ff-settings-done').click(timeout=3000)
        if rel!='index.html':
            first=page.locator('article.article a.cite').first
            ok(rel+' citation clickable',first.count()>0 and first.get_attribute('href').startswith('#ref-'))
            first.click(timeout=3000)
            ok(rel+' reference anchor navigates',page.evaluate('location.hash').startswith('#ref-'))
        ok(rel+' no browser errors',len(errs)==0)
        page.close()
    browser.close()
print('PASSED',len(checks),'targeted checks')
