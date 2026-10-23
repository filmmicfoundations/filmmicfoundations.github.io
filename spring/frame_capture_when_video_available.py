#!/usr/bin/env python3
"""Create a non-published contact sheet from a locally available CC-BY Spring film.

Usage: python frame_capture_when_video_available.py /path/to/Spring_-_Blender_Open_Movie.webm

This does NOT choose shots, assign article figures, or publish the article.
Images generated here are editorial CANDIDATES, not a claim of verified film-still placement.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import subprocess, sys, math
if len(sys.argv)!=2: raise SystemExit('Pass path to an actual local movie file')
film=Path(sys.argv[1]);assert film.is_file(),film
out=Path(__file__).resolve().parent/'_candidate_frames'
out.mkdir(exist_ok=True)
raw=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(film)])
duration=float(raw.strip()); times=[(i+.5)*duration/18 for i in range(18)]
paths=[]
for i,t in enumerate(times):
 p=out/f'candidate_{i+1:02d}.jpg'
 subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',str(film),'-frames:v','1','-q:v','2','-y',str(p)],check=True)
 paths.append(p)
thumbs=[]
for i,p in enumerate(paths):
 im=Image.open(p).convert('RGB');im.thumbnail((300,170))
 c=Image.new('RGB',(322,207),'#fff');c.paste(im,((322-im.width)//2,10));ImageDraw.Draw(c).text((12,185),f'candidate {i+1:02d}  /  {times[i]:.1f}s',fill='#111');thumbs.append(c)
cols=3;rows=math.ceil(len(thumbs)/cols)
sheet=Image.new('RGB',(cols*322,rows*207),'#eee')
for i,t in enumerate(thumbs):sheet.paste(t,((i%cols)*322,(i//cols)*207))
sheet.save(out/'contact-sheet.jpg',quality=90)
print('Created candidate contact sheet:',out/'contact-sheet.jpg')
