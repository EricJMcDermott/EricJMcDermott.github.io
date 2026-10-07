#!/usr/bin/env python3
"""Optional: regenerate lightweight gallery thumbnails (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageOps
import json
ROOT=Path(__file__).resolve().parent.parent
DATA=json.loads((ROOT/'content/collections.json').read_text())
out=ROOT/'assets/gallery';out.mkdir(parents=True,exist_ok=True)
count=0
for directory in ['portfolio','writings','woodworking','stringart','stainedglass']:
 items=DATA[directory]
 sources=[i['src'] for i in items] if directory in ['portfolio','writings'] else [src for group in items for src in group]
 for src in sources:
  name=(directory+'-'+src).replace('/','-').rsplit('.',1)[0]+'.webp'
  target=out/name
  if target.exists():continue
  with Image.open(ROOT/directory/src) as im:
   im=ImageOps.exif_transpose(im).convert('RGB')
   im.thumbnail((640,850),Image.Resampling.LANCZOS)
   im.save(target,'WEBP',quality=81,method=4)
  count+=1
for source,stem in [('portfolio/images/newImage-52.jpg','photograph-76'),('stainedglass/ducks/ducks-16.jpg','ducks-in-flight-final'),('woodworking/Inlay1.png','inlay-detail')]:
 with Image.open(ROOT/source) as im:
  im=ImageOps.exif_transpose(im).convert('RGB')
  for width in (600,1200):
   target=ROOT/'assets/home'/f'{stem}-{width}.webp'
   if target.exists(): continue
   resized=im.copy();resized.thumbnail((width,width),Image.Resampling.LANCZOS)
   resized.save(target,'WEBP',quality=84,method=4)
   count+=1
print(f'Created {count} gallery thumbnails.')
