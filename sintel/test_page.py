import asyncio,threading,http.server,socketserver,json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=str(Path(__file__).resolve().parent.parent)
class H(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw): super().__init__(*a,directory=ROOT,**kw)
 def log_message(self,*a):pass
async def main():
 server=socketserver.TCPServer(('127.0.0.1',8907),H)
 threading.Thread(target=server.serve_forever,daemon=True).start()
 try:
  async with async_playwright() as p:
   browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
   for w,h in [(1365,900),(390,844)]:
    for theme in ('light','dark'):
     page=await browser.new_page(viewport={'width':w,'height':h})
     await page.goto('http://127.0.0.1:8907/sintel/',wait_until='domcontentloaded',timeout=35000)
     await page.evaluate('t=>document.documentElement.dataset.theme=t',theme)
     await page.wait_for_timeout(200)
     fname=f'/mnt/data/sintel_{w}_{theme}.png'
     await page.screenshot(path=fname,full_page=False)
     count=await page.locator('article.article h2').count()
     assert count>=17,('headings',count)
     citations=await page.locator('article.article a.cite').count()
     assert citations>100,('citations',citations)
     assert await page.locator('article figure.diagram').count()==4
     assert not await page.locator('article img').count()
     assert await page.locator('a[href="Sintel_The_Time_She_Could_Not_See_Analysis_DRAFT.pdf"]').count()>0
     assert await page.locator('a[href="https://www.youtube.com/watch?v=eRsGyueVLvQ"]').count()==1
     assert await page.locator('.ff-settings-toggle').count()==1
     await page.locator('.ff-settings-toggle').click()
     await page.wait_for_timeout(200)
     assert await page.locator('.ff-settings-dialog[open]').count()==1
     assert await page.locator('#ff-pref-theme').count()==1
     await page.locator('.ff-settings-dismiss').click()
     await page.close()
     print('PASS',w,theme,'citations',citations)
   await browser.close()
 finally:server.shutdown()
asyncio.run(main())
