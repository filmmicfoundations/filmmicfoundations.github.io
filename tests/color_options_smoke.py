#!/usr/bin/env python3
"""Targeted theme-color regression on every page using offline Chromium."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).parent))
from browser_smoke import html_for
pages=['index.html','spring/index.html','alike/index.html','mindglassprocedure/index.html','the-black-hole/index.html','about/index.html']
errors=[];tested=0
with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  for path in pages:
    for width in (390,1365):
      ctx=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce')
      page=ctx.new_page()
      js=[]
      page.on('pageerror',lambda e: js.append(str(e)))
      page.set_content(html_for(path),wait_until='domcontentloaded',timeout=40000)
      dialog=page.locator('#ff-settings-dialog')
      try:
        page.locator('.ff-settings-toggle').first.click(timeout=3500)
        assert dialog.evaluate('(e)=>e.open'), 'dialog did not open'
        label=page.locator('label[for="ff-pref-color-button"]')
        assert label.count()==1 and label.inner_text().strip()=='Theme color', f'label incorrect {label.all_inner_texts()}'
        control=page.locator('#ff-pref-color-button')
        assert control.is_visible(), 'Theme color dropdown not visible'
        control.click(timeout=3000)
        for choice in ('Teal','Amber','Violet','Rose','Forest'):
          item=page.locator('#ff-pref-color-button + .ff-pref-choice-list [role=option]',has_text=choice)
          assert item.count()>=1, f'option missing: {choice}'
        # choose violet, CSS computed accent changes; then forest; retain light/dark.
        page.locator('#ff-pref-color-button + .ff-pref-choice-list [data-value="violet"]').click(timeout=3500)
        assert page.locator('html').get_attribute('data-ff-color')=='violet','violet not applied'
        computed=page.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--ff-accent").trim()')
        assert computed=='#6d63b7', f'wrong violet accent {computed}'
        page.locator('#ff-pref-color-button').click(timeout=3000)
        page.locator('#ff-pref-color-button + .ff-pref-choice-list [data-value="forest"]').click(timeout=3000)
        assert page.locator('html').get_attribute('data-ff-color')=='forest','forest not applied'
        assert not js, js
        tested+=1
      except Exception as e:
        errors.append((path,width,repr(e)[:450],js))
      ctx.close()
  browser.close()
print('Color theme smoke passed',tested,'/',len(pages)*2,'checks')
if errors:
  for e in errors: print('FAIL',e)
  raise SystemExit(1)
