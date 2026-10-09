#!/usr/bin/env python3
"""Check generated HTML, local media, and navigation without a web server."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
ROOT=Path(__file__).resolve().parent.parent
PAGES=[ROOT/'index.htm',*ROOT.glob('*/index.htm'),*ROOT.glob('*/index.html'),ROOT/'business/babybaby/index.htm',*ROOT.glob('work/*/index.htm')]
errors=[]
entries={}
def exact_case(path):
 try: parts=path.relative_to(ROOT).parts
 except ValueError: return True
 current=ROOT
 for part in parts:
  if current not in entries: entries[current]={p.name for p in current.iterdir()} if current.is_dir() else set()
  if part not in entries[current]: return False
  current=current/part
 return True
class Page(HTMLParser):
 def __init__(self,path):
  super().__init__();self.path=path;self.refs=[];self.ids=set();self.headings=0;self.local_count=0
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if 'id' in d:
   if d['id'] in self.ids:errors.append(f'{self.path}: duplicate id {d["id"]}')
   self.ids.add(d['id'])
  if tag=='h1':self.headings+=1
  if tag=='img' and 'alt' not in d:errors.append(f'{self.path}: missing image alt')
  for key in ['href','src']:
   if d.get(key):self.refs.append(d[key])
  for item in d.get('srcset','').split(','):
   if item.strip():self.refs.append(item.strip().split()[0])
 def check(self):
  if self.headings!=1:errors.append(f'{self.path}: expected one h1, got {self.headings}')
  for ref in self.refs:
   u=urlsplit(ref)
   if u.scheme or u.netloc:continue
   if not u.path:
    if u.fragment and u.fragment not in self.ids:errors.append(f'{self.path}: missing anchor {ref}')
    continue
   dest=ROOT/unquote(u.path.lstrip('/')) if u.path.startswith('/') else (self.path.parent/unquote(u.path)).resolve()
   if not exact_case(dest):errors.append(f'{self.path.relative_to(ROOT)}: path case mismatch or missing file: {ref}')
   if not dest.exists():errors.append(f'{self.path.relative_to(ROOT)}: missing {ref}')
   elif dest.is_dir() and not any((dest/i).exists() for i in ['index.htm','index.html']):errors.append(f'{self.path.relative_to(ROOT)}: no index at {ref}')
   self.local_count+=1
count=0
for path in PAGES:
 parser=Page(path);parser.feed(path.read_text());parser.check();count+=parser.local_count
if errors:
 print('\n'.join(errors));raise SystemExit(1)
print(f'PASS: {len(PAGES)} pages, {count} local references, headings, anchors, image alternatives.')
