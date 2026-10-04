#!/usr/bin/env python3
"""Export compact, lazy-loadable presentation pages using Poppler and Pillow.

Run from the repository root. Requires pdftoppm, pdfinfo, and Python Pillow.
Only selected tracked presentation PDFs are read; originals remain untouched.
"""
import io
import json
import re
import subprocess
from pathlib import Path
from PIL import Image

DATA = Path('data/projects.json')
projects = json.loads(DATA.read_text())
for project in projects:
    presentation = project.get('projectPage', {}).get('fullPresentation', {})
    if not presentation.get('enabled') or presentation.get('source') not in ('scenes', 'scenes-and-image-sequence'):
        continue
    pdf = presentation.get('download', {}).get('href')
    if not pdf:
        continue
    if presentation.get('pages'):
        continue
    info = subprocess.check_output(['pdfinfo', pdf], text=True)
    count = int(re.search(r'^Pages:\s+(\d+)', info, re.M).group(1))
    folder = Path('assets/presentation-pages') / project['slug']
    folder.mkdir(parents=True, exist_ok=True)
    pages = []
    for number in range(1, count + 1):
        high = folder / f'page-{number:02d}-2400.webp'
        low = folder / f'page-{number:02d}-1000.webp'
        if not high.exists() or not low.exists():
            raw = subprocess.check_output(['pdftoppm', '-f', str(number), '-l', str(number), '-scale-to', '2400', '-singlefile', '-png', pdf])
            image = Image.open(io.BytesIO(raw)).convert('RGB')
            image.save(high, 'WEBP', quality=88)
            preview = image.copy()
            preview.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
            preview.save(low, 'WEBP', quality=84)
        with Image.open(high) as image:
            width, height = image.size
        with Image.open(low) as image:
            preview_width = image.width
        pages.append({'src': './' + str(low), 'srcset': f'./{low} {preview_width}w, ./{high} {width}w',
                      'zoomSrc': './' + str(high), 'width': width, 'height': height,
                      'alt': {'en': f"{project['title']} presentation, page {number}", 'cs': f"Prezentace, strana {number}"}})
        print(f"{project['slug']} {number}/{count}", flush=True)
    presentation['fallbackPages'] = pages
DATA.write_text(json.dumps(projects, ensure_ascii=False, indent=2) + '\n')
