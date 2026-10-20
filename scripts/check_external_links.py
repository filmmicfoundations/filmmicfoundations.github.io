#!/usr/bin/env python3
"""Weekly checks of third-party film and source links (Python standard library).

HTTP 404/410 are definitive broken-link signals; access controls (403/429),
blocked HEAD, DNS issues and timeouts are warnings, not proof a URL is dead.
Use --report to write a downloadable Actions report.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import argparse
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
SITE='filmmicfoundations.github.io'

class Outbound(HTMLParser):
    def __init__(self):super().__init__();self.links=set()
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=='a':candidate=d.get('href')
        elif tag=='iframe':candidate=d.get('src')
        else:return
        if not candidate:return
        uri=urlsplit(candidate)
        if uri.scheme in ('https','http') and uri.netloc.lower()!=SITE:
            self.links.add(candidate)


def check(uri):
    # Typical reference pages can reject HEAD requests, so GET with immediate
    # response-close is more reliable. Never download the whole remote page.
    headers={'User-Agent':'Mozilla/5.0 (compatible; FilmmicFoundationsLinkCheck/1.0; +https://filmmicfoundations.github.io/about/)',
             'Accept':'text/html,application/xhtml+xml,*/*;q=0.7'}
    for attempt in range(2):
        try:
            with urlopen(Request(uri,headers=headers,method='GET'),timeout=12) as response:
                status=response.status
                if status<400:return ('OK',str(status),uri)
                if status in (404,410):
                    if attempt==0:continue
                    return ('BROKEN',str(status),uri)
                return ('WARNING',str(status),uri)
        except HTTPError as e:
            if e.code in (404,410) and attempt==0:continue
            if e.code in (404,410):return ('BROKEN',str(e.code),uri)
            return ('WARNING','HTTP '+str(e.code),uri)
        except (URLError,TimeoutError,OSError) as e:
            return ('WARNING',str(e)[:120],uri)
    return ('WARNING','no result',uri)


def main():
    cli=argparse.ArgumentParser()
    cli.add_argument('--report',default='external-links-report.txt')
    cli.add_argument('--workers',type=int,default=4)
    args=cli.parse_args()
    pairs={}
    for path in sorted(ROOT.rglob('*.html')):
        if '_site' in path.parts:continue
        parser=Outbound();parser.feed(path.read_text(encoding='utf-8'))
        for uri in parser.links:pairs.setdefault(uri,set()).add(str(path.relative_to(ROOT)))
    results=[]
    with ThreadPoolExecutor(max_workers=max(1,min(6,args.workers))) as pool:
        for future in as_completed([pool.submit(check,uri) for uri in pairs]):
            results.append(future.result())
    results.sort(key=lambda r:(r[0]!='BROKEN',r[0]!='WARNING',r[2]))
    lines=['Filmmic Foundations · outbound source and film links','Access errors may indicate anti-bot restrictions rather than missing pages.','']
    for status,code,uri in results:
        lines.append(f'[{status}] {code} {uri}')
        lines.append('  Used in: '+', '.join(sorted(pairs[uri])))
    total_broken=sum(row[0]=='BROKEN' for row in results)
    total_warnings=sum(row[0]=='WARNING' for row in results)
    lines+=['',f'Total: {len(results)} unique external links; {total_broken} broken; {total_warnings} inconclusive.']
    report=ROOT/args.report
    report.parent.mkdir(parents=True,exist_ok=True)
    report.write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print('\n'.join(lines))
    return bool(total_broken)

if __name__=='__main__':sys.exit(main())
