#!/usr/bin/env python3
"""Build a publication-ready single-article ZIP without altering the live site.

Usage: python3 scripts/package_article.py path/to/film-slug [output.zip]

The resulting ZIP contains only /film-slug/*; the GitHub Pages workflow
regenerates homepage, search, RSS, sitemap, citations and recommendations.
This packaging step is not a substitute for researching or writing the article.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ('index.html', 'article.json')


def fail(reason: str):
    raise SystemExit('Article package rejected: ' + reason)


def collect_article(folder: Path) -> list[Path]:
    if not folder.is_dir():fail('Article folder not found.')
    slug=folder.name
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug):
        fail('Folder name must be a lowercase, hyphen-separated article slug.')
    for name in REQUIRED:
        if not (folder/name).is_file():fail('Missing '+name)
    try:data=json.loads((folder/'article.json').read_text(encoding='utf-8'))
    except Exception as e:fail('Invalid article.json: '+str(e))
    for key in ('title','description','film_year','article_date','citation_title'):
        if not data.get(key):fail('Missing article metadata field '+key)
    if '<article' not in (folder/'index.html').read_text(encoding='utf-8'):
        fail('index.html is missing an article element.')
    files=[];digests={}
    for path in folder.rglob('*'):
        if path.is_symlink():fail('Symlinks are not permitted.')
        if not path.is_file():continue
        if any(x in path.parts for x in ('__pycache__','__MACOSX','.git','node_modules')):continue
        if path.suffix.lower() in ('.pyc','.key','.pem','.p12','.pfx') or path.name=='.DS_Store':continue
        if len(path.read_bytes())>90*1024*1024:fail('Individual file exceeds 90 MB: '+path.name)
        if path.suffix.lower() in ('.jpg','.jpeg','.png','.webp') and not path.stem.endswith('-640'):
            digest=hashlib.sha256(path.read_bytes()).hexdigest()
            if digest in digests:fail('Duplicate image bytes: '+str(path.relative_to(folder))+' duplicates '+digests[digest])
            digests[digest]=str(path.relative_to(folder))
        files.append(path)
    if len(files)>800:fail('Unexpectedly large article file count; review generated assets.')
    if sum(x.stat().st_size for x in files)>110*1024*1024:fail('Uncompressed article exceeds 110 MB.')
    return sorted(files)


def check_site_package(folder:Path)->Path:
    with tempfile.TemporaryDirectory(prefix='ff-article-validation-') as temp:
        stage=Path(temp)/'site'
        # Reuse established, complete website locally. Never mutate existing release files.
        shutil.copytree(ROOT, stage, ignore=shutil.ignore_patterns('_site','__pycache__','.git','.DS_Store'))
        if folder.resolve()!= (ROOT/folder.name).resolve():
            shutil.copytree(folder,stage/folder.name,dirs_exist_ok=True)
        for script in ('build_archive.py','quality_gate.py'):
            outcome=subprocess.run([sys.executable,str(stage/'scripts'/script)],cwd=stage,capture_output=True,text=True,timeout=100)
            if outcome.returncode:fail(script+' failed:\n'+(outcome.stdout+'\n'+outcome.stderr).strip()[:4000])
        validated=stage/folder.name
        out=ROOT/'_article_package_last_validation'/folder.name
        if out.parent.exists():shutil.rmtree(out.parent)
        out.parent.mkdir(parents=True,exist_ok=True)
        shutil.copytree(validated,out,ignore=shutil.ignore_patterns('__pycache__'))
    return out


def main():
    if len(sys.argv) not in (2,3):
        fail('Usage: package_article.py path/to/slug [output.zip]')
    folder=Path(sys.argv[1]).expanduser().resolve()
    collect_article(folder)
    validated=check_site_package(folder)
    try:
        files=collect_article(validated)
        output=Path(sys.argv[2]).expanduser().resolve() if len(sys.argv)==3 else Path.cwd()/f'{folder.name}-article-update.zip'
        with ZipFile(output,'w',ZIP_DEFLATED,compresslevel=8) as z:
            for p in files:z.write(p,folder.name+'/'+str(p.relative_to(validated)))
        print(f'Package ready: {output} ({len(files)} files)')
        print('Upload this ZIP in Developer Portal; GitHub Pages rebuilds archive metadata automatically.')
    finally:shutil.rmtree(validated.parent,ignore_errors=True)

if __name__=='__main__':main()
