#!/usr/bin/env python3
"""Unpack a browser-created submission ZIP from submissions/inbox/<slug>.zip.

The ZIP is uploaded by a repository maintainer. We reject unsafe paths and
large archives before extracting anything. Existing submission folders are
never overwritten.
"""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile
import re, sys
ROOT=Path(__file__).resolve().parents[1]
slug=sys.argv[1]
if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug):
    raise ValueError('Invalid slug; use lowercase letters, digits and hyphens.')
source=ROOT/'submissions'/'inbox'/f'{slug}.zip'
folder=ROOT/'submissions'/slug
if not source.is_file():
    # Backwards-compatible manual folder workflow.
    if (folder/'paper.pdf').is_file():
        print('Using pre-existing submission folder:',folder)
        sys.exit(0)
    raise FileNotFoundError(f'Upload submissions/inbox/{slug}.zip before running this workflow.')
if folder.exists(): raise FileExistsError(f'{folder} already exists; use a new slug or remove the old folder.')
with ZipFile(source) as z:
    files=z.infolist()
    if len(files)>70: raise ValueError('Too many files in submission ZIP.')
    if sum(f.file_size for f in files)>150*1024*1024: raise ValueError('Submission uncompressed size exceeds 150 MB.')
    for f in files:
        name=PurePosixPath(f.filename)
        if f.is_dir():continue
        if name.is_absolute() or '..' in name.parts or '\\' in f.filename:
            raise ValueError('Unsafe ZIP path.')
        if f.filename not in ('paper.pdf','notes.md') and not (len(name.parts)==2 and name.parts[0]=='assets' and name.suffix.lower() in ('.jpg','.jpeg','.png','.webp')):
            raise ValueError('Unexpected file in ZIP: '+f.filename)
    if 'paper.pdf' not in z.namelist():raise ValueError('Missing paper.pdf')
    if not any(x.startswith('assets/') for x in z.namelist()):raise ValueError('Missing cover image')
    folder.mkdir()
    try:
        for f in files:
            if f.is_dir():continue
            target=folder/f.filename;target.parent.mkdir(parents=True,exist_ok=True)
            with z.open(f) as src,target.open('wb') as dst:
                import shutil;shutil.copyfileobj(src,dst)
    except Exception:
        import shutil;shutil.rmtree(folder,ignore_errors=True);raise
print('Prepared:',folder.relative_to(ROOT))
