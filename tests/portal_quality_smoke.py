#!/usr/bin/env python3
"""Offline, isolated Chromium regression for Developer Portal quality tools.
Requires: playwright, Chromium, and the site source. Does not contact GitHub.
Run from site root: python tests/portal_quality_smoke.py
"""
import asyncio
import re
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZipFile, ZIP_DEFLATED

ROOT=Path(__file__).resolve().parents[1]

async def run():
    from playwright.async_api import async_playwright
    with TemporaryDirectory(prefix='ff-portal-quality-') as d:
        valid=Path(d)/'new_article.zip';bad=Path(d)/'broken_article.zip'
        with ZipFile(valid,'w',ZIP_DEFLATED) as z:
            for file in (ROOT/'sintel').rglob('*'):
                if file.is_file() and '__pycache__' not in file.parts and file.suffix!='.pyc':
                    z.write(file, file.relative_to(ROOT).as_posix())
        with ZipFile(bad,'w',ZIP_DEFLATED) as z:
            z.writestr('broken/index.html','<!doctype html><article class="article"><p>Unfinished</p></article>')
            z.writestr('broken/article.json','{"title":"Broken","image":"assets/missing.jpg"}')
        source=(ROOT/'dev/index.html').read_text(encoding='utf-8')
        source=re.sub(r'<script\b[^>]*src=[^>]*></script>','',source)
        source=re.sub(r'<link\b[^>]*rel="stylesheet"[^>]*>','',source)
        async with async_playwright() as p:
            browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
            count=0
            for width,height in [(1280,900),(390,844)]:
                for theme in ['light','dark']:
                    page=await browser.new_page(viewport={'width':width,'height':height})
                    errors=[]
                    page.on('pageerror',lambda exc:errors.append(str(exc)))
                    await page.set_content(source)
                    for name in ['style.css','assets/css/developer.css','assets/css/portal-quality.css']:
                        await page.evaluate('(css)=>{const s=document.createElement("style");s.textContent=css;document.head.append(s)}',(ROOT/name).read_text())
                    for name in ['assets/js/jszip.min.js','assets/js/developer.js','assets/js/portal-quality.js']:
                        await page.evaluate('(js)=>{const s=document.createElement("script");s.textContent=js;document.body.append(s)}',(ROOT/name).read_text())
                    await page.locator('#dev-access-code').fill('123')
                    await page.locator('#dev-login-form button[type="submit"]').click()
                    await page.wait_for_selector('#dev-workspace:visible')
                    await page.evaluate('(t)=>{document.documentElement.dataset.theme=t}',theme)
                    await page.locator('#dev-zip-file').set_input_files(str(valid))
                    await page.wait_for_selector('#ffq-preflight:not([hidden])',timeout=40000)
                    assert '0 critical' in await page.locator('#ffq-status').inner_text()
                    await page.locator('#ffq-open-preview').click()
                    assert await page.locator('#ffq-preview-dialog').evaluate('(x)=>x.open')
                    await page.locator('#ffq-preview-fallback-toggle').click()
                    assert await page.locator('#ffq-preview-fallback').is_visible()
                    await page.locator('#ffq-preview-close').click()
                    await page.locator('#ffq-open-diff').click()
                    assert await page.locator('#ffq-diff-file option').count()>0
                    await page.locator('#dev-zip-file').set_input_files(str(bad))
                    await page.wait_for_function("document.querySelector('#ffq-ready-state')?.textContent==='Fix required'")
                    assert await page.locator('#ffq-ready-state').inner_text()=='Fix required'
                    assert not errors, errors
                    count+=1
                    await page.close()
            await browser.close()
            print(f'PASS {count} portal quality scenarios, plus valid/invalid ZIP, preview, and diff checks')

if __name__=='__main__':
    asyncio.run(run())
