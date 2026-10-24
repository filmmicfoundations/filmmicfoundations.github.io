#!/usr/bin/env python3
"""Deterministic offline browser smoke tests, not a live GitHub deployment test.

Install Playwright + Chromium, then run: python3 tests/browser_smoke.py
Uses in-memory pages because a local server may be unavailable. Inline images and
styles exercise buttons/dialogs, but real HTTP, remote APIs and video need live QA.
"""
from __future__ import annotations
import base64
import json
import mimetypes
import re
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
CHROMIUM='/usr/bin/chromium'
RESULTS=[]

def html_for(relative):
    doc=ROOT/relative
    soup=BeautifulSoup(doc.read_text(encoding='utf-8'),'html.parser')
    for link in list(soup.find_all('link', rel=lambda v:bool(v and 'stylesheet' in v))):
        href=link.get('href','').split('?')[0]
        target=(ROOT/href.lstrip('/')) if href.startswith('/') else (doc.parent/href)
        target=target.resolve()
        if target.is_file() and target.is_relative_to(ROOT):
            style=soup.new_tag('style')
            content=target.read_text(encoding='utf-8')
            content=re.sub(r'@import\s+url\([^)]*fonts\.googleapis\.com[^)]*\);?', '',content)
            style.string=content
            link.replace_with(style)
        else:link.decompose()
    deferred=[]
    for script in list(soup.find_all('script',src=True)):
        src=script.get('src','').split('?')[0]
        target=(ROOT/src.lstrip('/')) if src.startswith('/') else doc.parent/src
        if target.is_file():
            inline=soup.new_tag('script')
            inline.string=target.read_text(encoding='utf-8')
            deferred.append(inline)
        script.decompose()
    for img in soup.find_all('img',src=True):
        src=img['src'].split('?')[0]
        target=(ROOT/src.lstrip('/')) if src.startswith('/') else doc.parent/src
        if target.is_file() and target.stat().st_size<=650000:
            mimetype=mimetypes.guess_type(str(target))[0] or 'image/jpeg'
            img['src']='data:'+mimetype+';base64,'+base64.b64encode(target.read_bytes()).decode()
        img.attrs.pop('srcset',None)
    for script in deferred:soup.body.append(script)
    return str(soup)

def attempt(page,label,fun):
    try:
        fun()
        RESULTS.append({'test':label,'result':'passed'})
    except Exception as e:
        RESULTS.append({'test':label,'result':'failed','detail':str(e)[:300]})

def click_if(page,selector):
    loc=page.locator(selector).first
    if loc.count() and loc.is_visible():loc.click(timeout=1700)

def test_page(browser,relative,width,theme):
    context=browser.new_context(viewport={'width':width,'height':820},reduced_motion='reduce')
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html_for(relative),wait_until='domcontentloaded',timeout=30000)
    page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
    short=relative+' '+str(width)+' '+theme
    attempt(page,short+' title/landmark',lambda: (page.title() and page.locator('main').count()>0) or (_ for _ in ()).throw(AssertionError('landmark missing')))
    attempt(page,short+' no horizontal overflow',lambda: page.evaluate('document.documentElement.scrollWidth <= innerWidth + 5') or (_ for _ in ()).throw(AssertionError('horizontal scroll overflow')))
    if relative!='dev/index.html':
        attempt(page,short+' settings open',lambda: (click_if(page,'.ff-settings-toggle'), page.locator('#ff-settings-dialog').evaluate('(e)=>e.open') or (_ for _ in ()).throw(AssertionError('not open'))))
        if page.locator('#ff-settings-dialog').count() and page.locator('#ff-settings-dialog').evaluate('(e)=>e.open'):
            attempt(page,short+' backdrop dims navbar',lambda: (page.locator('#ff-settings-dialog').evaluate('(el)=>getComputedStyle(el,"::backdrop").backgroundColor') not in ('rgba(0, 0, 0, 0)','transparent')) or (_ for _ in ()).throw(AssertionError('no backdrop')))
            attempt(page,short+' tabs',lambda: [click_if(page, f'#ff-tab-{key}') for key in ['appearance','reading','research','general']])
            attempt(page,short+' settings close',lambda: click_if(page,'.ff-settings-done'))
    if relative=='index.html':
        attempt(page,short+' cards',lambda: page.locator('.archive-card').count()==4 or (_ for _ in ()).throw(AssertionError('article count')))
        attempt(page,short+' search',lambda: (page.locator('#article-search').fill('spring'),page.locator('#article-search').input_value()=='spring') or (_ for _ in ()).throw(AssertionError('search input')))
        attempt(page,short+' clear',lambda: click_if(page,'#clear-search'))
        attempt(page,short+' filter open/close',lambda: (click_if(page,'#ff-filter-toggle'),click_if(page,'#reset-filters'),click_if(page,'#ff-filter-toggle')))
        attempt(page,short+' sort all',lambda: (click_if(page,'#ff-sort-toggle'),[click_if(page,'[data-sort="'+m+'"]') for m in ['oldest','az','za','newest']]))
        attempt(page,short+' layouts',lambda: [click_if(page,'[data-view="'+v+'"]') for v in ['grid','list','compact','editorial']])
        attempt(page,short+' preview',lambda: (click_if(page,'.archive-preview-trigger'),page.locator('#archive-preview').evaluate('(e)=>e.open') or (_ for _ in ()).throw(AssertionError('preview closed'))))
        if page.locator('#archive-preview').count() and page.locator('#archive-preview').evaluate('(e)=>e.open'):
            attempt(page,short+' preview dismissal',lambda: page.keyboard.press('Escape'))
    if relative in ['alike/index.html','mindglassprocedure/index.html','the-black-hole/index.html','spring/index.html']:
        attempt(page,short+' article structure',lambda: page.locator('article h2').count()>=5 or (_ for _ in ()).throw(AssertionError('sections missing')))
        attempt(page,short+' visual figures',lambda: page.locator('article figure button.article-image-open').count()>=5 or (_ for _ in ()).throw(AssertionError('image viewer buttons missing')))
        attempt(page,short+' diagram exclusions',lambda: page.locator('article figure.diagram button.article-image-open').count()==0 or (_ for _ in ()).throw(AssertionError('diagram linked')))
        attempt(page,short+' viewer opens',lambda: (click_if(page,'article figure .article-image-open'),page.locator('#ffv-dialog').evaluate('(e)=>e.open') or (_ for _ in ()).throw(AssertionError('viewer failed'))))
        if page.locator('#ffv-dialog').count() and page.locator('#ffv-dialog').evaluate('(e)=>e.open'):
            attempt(page,short+' viewer controls',lambda: [click_if(page,'#'+b) for b in ['ffv-next','ffv-prev','ffv-plus','ffv-minus','ffv-fit','ffv-toggle','ffv-toggle']])
            attempt(page,short+' viewer escape',lambda: page.keyboard.press('Escape'))
        # Every still opens with a local source, then closes; diagrams are excluded.
        for still_i in range(page.locator('article figure button.article-image-open').count() if (width,theme)==(1365,'dark') else 0):
            def open_and_close(i=still_i):
                button=page.locator('article figure button.article-image-open').nth(i)
                button.evaluate('(e)=>e.click()')
                assert page.locator('#ffv-dialog').evaluate('(e)=>e.open'),'viewer not open'
                page.locator('#ffv-dialog').evaluate('(e)=>e.close()')
            attempt(page,short+f' every still viewer {still_i+1}',open_and_close)
        attempt(page,short+' cite styles',lambda: [click_if(page,'[data-citation-style="'+v+'"]') for v in ['apa','chicago','ieee','mla']])
        attempt(page,short+' suggested ordering',lambda: (page.locator('#watch').count() and page.locator('#suggested-articles').count() and page.evaluate('document.querySelector("#suggested-articles").compareDocumentPosition(document.querySelector("#watch")) & Node.DOCUMENT_POSITION_PRECEDING')>0) or (_ for _ in ()).throw(AssertionError('ordering')))
    if relative=='dev/index.html':
        attempt(page,short+' portal unlock',lambda: (page.locator('#dev-access-code').fill('123'),click_if(page,'#dev-login-form button[type="submit"]')))
        page.wait_for_timeout(100)
        attempt(page,short+' version/update accordions',lambda: [click_if(page,'#dev-section-'+x+'>summary') for x in ['versions','guides','updates']])
        attempt(page,short+' token help',lambda: click_if(page,'#dev-token-help-link'))
        if page.locator('#dev-token-guide').count() and page.locator('#dev-token-guide').evaluate('(e)=>e.open'):
            attempt(page,short+' token help close',lambda: click_if(page,'#dev-token-guide-close'))
        attempt(page,short+' publication guarded',lambda: page.locator('#dev-publish').get_attribute('data-ready')=='false' or (_ for _ in ()).throw(AssertionError('publication unlocked unexpectedly')))
    RESULTS.append({'test':short+' JavaScript','result':'passed' if not errors else 'failed','detail':';'.join(errors[:4])})
    context.close()

def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=CHROMIUM,headless=True,args=['--no-sandbox'])
        for rel in ['index.html','about/index.html','alike/index.html','mindglassprocedure/index.html','the-black-hole/index.html','spring/index.html','dev/index.html','404.html']:
            for width in (390,1365):
                for theme in ('light','dark'):
                    test_page(browser,rel,width,theme)
        browser.close()
    counts={key:sum(r['result']==key for r in RESULTS) for key in ('passed','failed')}
    print('UI SMOKE',counts)
    for r in RESULTS:
        if r['result']=='failed':print('FAIL',r['test'],r.get('detail'))
    out=ROOT/'tests'/'ui-smoke-results.json'
    out.write_text(json.dumps({'scope':'Offline in-memory Chromium smoke; not live GitHub or remote services','counts':counts,'tests':RESULTS},indent=2))
    return 1 if counts['failed'] else 0

if __name__=='__main__':raise SystemExit(main())
