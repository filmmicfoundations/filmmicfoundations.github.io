#!/usr/bin/env python3
"""Offline developer ZIP validation tests: no GitHub token or deployment."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import io,json,zipfile,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from browser_smoke import html_for

def build_zip(names):
    bio=io.BytesIO()
    with zipfile.ZipFile(bio,'w',zipfile.ZIP_DEFLATED) as archive:
        for name,payload in names.items():archive.writestr(name,payload)
    return bio.getvalue()

GOOD=build_zip({'sample-film/index.html':'<!doctype html><html><title>Sample</title><main><article>Test</article></main></html>', 'sample-film/article.json':json.dumps({'title':'Sample Film','film_year':'2025','article_date':'2026-10-21','citation_title':'Sample Film','description':'Sample description'})})
BAD=build_zip({'sample-film/index.html':'test','sample-film/__pycache__/secrets.pyc':'test'})
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1365,'height':840},reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html_for('dev/index.html'))
    page.locator('#dev-access-code').fill('123')
    page.locator('#dev-login-form button[type="submit"]').click()
    assert page.locator('#dev-workspace').is_visible()
    page.locator('#dev-zip-file').set_input_files({'name':'sample-film.zip','mimeType':'application/zip','buffer':GOOD})
    page.wait_for_function("document.querySelector('#dev-update-status').textContent.includes('ZIP structure and CRC validated locally')",timeout=30000)
    assert page.locator('#dev-publish').get_attribute('data-ready')=='false'
    assert page.locator('#dev-zip-inspection').get_attribute('hidden') is not None
    assert page.locator('#dev-file-list').locator('.dev-file-row').count()==2
    results.append('Valid article-only ZIP automatically inspected; button guarded, progress settled')
    page.locator('#dev-clear-zip').click()
    assert page.locator('#dev-upload-info').get_attribute('hidden') is not None
    results.append('Remove ZIP resets selection without stale preview')
    page.locator('#dev-zip-file').set_input_files({'name':'unsafe.zip','mimeType':'application/zip','buffer':BAD})
    page.wait_for_function("document.querySelector('#dev-update-status').textContent.includes('cannot be uploaded')",timeout=30000)
    assert page.locator('#dev-publish').get_attribute('data-ready')=='false'
    assert not errors,errors
    results.append('Unsafe cache-file ZIP blocked; no runtime JavaScript errors')
    browser.close()
print('PASS',len(results),'offline developer ZIP tests')
for r in results:print('-',r)
