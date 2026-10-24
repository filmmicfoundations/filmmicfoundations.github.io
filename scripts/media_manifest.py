#!/usr/bin/env python3
"""Central media catalog and deterministic validation for Filmmic Foundations.

No third-party dependencies. The generated manifest is published alongside the
articles; the build compares it against current article metadata and preview JSON.
"""
import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from html import unescape

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'media-manifest.json'


def sig(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def item(slug,name,roles,kind,source):
    p=ROOT/slug/name
    if not p.is_file():
        raise ValueError(f'{slug}: media path does not exist: {name}')
    return {'path':name,'type':kind,'roles':sorted(set(roles)),
            'source':source,'bytes':p.stat().st_size,'sha256':sig(p)}


def parse_figure(html):
    for figure in re.findall(r'<figure\b[^>]*>.*?</figure\s*>',html,flags=re.I|re.S):
        match=re.search(r'<img\b[^>]*\bsrc\s*=\s*["\']([^"\']+)["\']',figure,flags=re.I)
        if not match:continue
        path=unescape(match.group(1)).split('?')[0]
        if path.startswith(('http:','https:','//','data:')):
            raise ValueError(f'external image cannot be in media manifest: {path}')
        viewer=bool(re.search(r'\barticle-image-open\b',figure))
        diagram=bool(re.search(r'\bdiagram\b',figure.split('>',1)[0],re.I))
        if diagram and viewer:
            raise ValueError('Original diagram incorrectly opens in viewer')
        yield path, ('film_still' if viewer else 'diagram' if diagram else 'editorial_image'), viewer


def build():
    result={'schema_version':1,'archive':'Filmmic Foundations','articles':{}}
    for meta_path in sorted(ROOT.glob('*/article.json')):
        slug=meta_path.parent.name
        data=json.loads(meta_path.read_text(encoding='utf-8'))
        preview=json.loads((meta_path.parent/'preview.json').read_text(encoding='utf-8'))
        cover=data.get('image')
        images=preview.get('images',[])
        caps=preview.get('image_captions',[])
        if len(images)!=len(caps):raise ValueError(f'{slug}: preview images and captions differ in count')
        if len(images)!=len(set(images)):raise ValueError(f'{slug}: duplicate preview images')
        if cover and (not images or cover!=images[0]):raise ValueError(f'{slug}: cover must lead preview carousel')
        html=(meta_path.parent/'index.html').read_text(encoding='utf-8')
        figures=list(parse_figure(html))
        rolemap={}
        for path, kind, viewer in figures:
            entry=rolemap.setdefault(path,{'kind':kind,'roles':set()})
            if entry['kind']!=kind:raise ValueError(f'{slug}: conflicting roles for {path}')
            entry['roles'].add('article')
            if viewer: entry['roles'].add('viewer')
        for path in images:
            if 'diagram' in path.lower() or rolemap.get(path,{}).get('kind')=='diagram':
                raise ValueError(f'{slug}: diagram in preview gallery: {path}')
            entry=rolemap.setdefault(path,{'kind':'film_still','roles':set()})
            entry['roles'].add('preview')
        if cover:
            rolemap.setdefault(cover,{'kind':'film_still','roles':set()})['roles'].add('cover')
        source=('filmmaker-supplied film frame' if slug=='mindglassprocedure' else '© Blender Foundation | cloud.blender.org/spring; CC BY 4.0, extracted from source video' if slug=='spring' else 'user-supplied film frame')
        entries=[item(slug,path,entry['roles'],entry['kind'], 'original analytical diagram' if entry['kind']=='diagram' else source)
                 for path,entry in sorted(rolemap.items())]
        thumbnails=[]
        for entry in entries:
            img=Path(entry['path']); sm=img.with_name(img.stem+'-640'+img.suffix)
            p=meta_path.parent/sm
            if p.is_file():
                thumbnails.append({'path':str(sm),'derivative_of':entry['path'],'sha256':sig(p)})
        pdfs=sorted(meta_path.parent.glob('*.pdf'))
        pdf_items=[{'path':p.name,'sha256':sig(p),'bytes':p.stat().st_size} for p in pdfs]
        result['articles'][slug]={
            'cover':cover,
            'preview':[{'path':p,'caption':c} for p,c in zip(images,caps)],
            'media':entries,
            'thumbnails':thumbnails,
            'pdf':pdf_items,
            'figures':{'total_image_figures':len(figures), 'viewable_film_stills':sum(v for _,_,v in figures),
                       'original_image_diagrams':sum(t=='diagram' for _,t,_ in figures)}
        }
    return result


def serialize(x): return json.dumps(x,ensure_ascii=False,indent=2,sort_keys=True)+'\n'


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--check',action='store_true',help='fail if the current site and saved manifest disagree')
    args=parser.parse_args()
    try:
        data=build()
        rendered=serialize(data)
        if args.check:
            if not MANIFEST.exists() or MANIFEST.read_text(encoding='utf-8')!=rendered:
                print('Media manifest is missing or stale; regenerate via python3 scripts/media_manifest.py')
                return 1
        else:MANIFEST.write_text(rendered,encoding='utf-8')
        for slug,v in data['articles'].items():
            print(f'{slug}: {len(v["media"])} tracked images, {len(v["preview"])} preview frames, {len(v["pdf"])} PDF(s)')
        print('Media manifest '+('valid' if args.check else 'updated'))
        return 0
    except (ValueError,OSError,json.JSONDecodeError) as e:
        print('ERROR:',e)
        return 1

if __name__=='__main__':sys.exit(main())
