import asyncio,re
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
base=Path('/mnt/data/sintel_work');sp=base/'sintel'
soup=BeautifulSoup((sp/'index.html').read_text(encoding='utf-8'),'html.parser')
for l in soup.select('link[rel="stylesheet"]'):
    href=l.get('href','').split('?')[0]
    p=(sp/href).resolve()
    if p.is_file():
        css=p.read_text(encoding='utf-8')
        # inline relative font declarations ignored, keep other rules
        style=soup.new_tag('style');style.string=css;l.replace_with(style)
for sc in soup.select('script[src]'):
    p=(sp/sc.get('src','').split('?')[0]).resolve()
    if p.is_file():
        src=p.read_text(encoding='utf-8')
        tag=soup.new_tag('script');tag.string=src;sc.decompose();soup.body.append(tag)
html=str(soup)
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width,height in [(1365,900),(390,844)]:
   for theme in ['light','dark']:
    page=await browser.new_page(viewport={'width':width,'height':height})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    await page.set_content(html,wait_until='domcontentloaded',timeout=45000)
    await page.evaluate('t=>document.documentElement.dataset.theme=t',theme)
    await page.wait_for_timeout(300)
    assert await page.locator('article h2').count()>=17
    assert await page.locator('article a.cite').count()>=100
    assert await page.locator('article figure.diagram').count()==4
    assert await page.locator('a[href="Sintel_The_Time_She_Could_Not_See_Analysis_DRAFT.pdf"]').count()>=1
    await page.locator('.ff-settings-toggle').click()
    await page.wait_for_timeout(300)
    assert await page.locator('.ff-settings-dialog[open]').count()==1
    assert await page.locator('#ff-pref-theme').count()==1
    await page.screenshot(path=f'/mnt/data/sintel_isolated_{width}_{theme}.png')
    print('PASS',width,theme,'error-count',len(errors),'sample',errors[:1])
    await page.close()
  await browser.close()
asyncio.run(main())
