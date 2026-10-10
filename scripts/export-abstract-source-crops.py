#!/usr/bin/env python3
"""Rebuild Abstract's source-coordinate crops with Poppler and Pillow."""
import io
import json
import subprocess
from pathlib import Path
from PIL import Image

project = next(p for p in json.loads(Path('data/projects.json').read_text()) if p['slug'] == 'abstract')
for scene in project['scenes']:
    objects = [o for o in scene.get('objects', []) if o.get('src', '').endswith('-source.webp')]
    if not objects:
        continue
    raw = subprocess.check_output(['pdftoppm', '-f', str(scene['page']), '-l', str(scene['page']),
                                   '-scale-to', '2400', '-singlefile', '-png',
                                   project['projectPage']['fullPresentation']['download']['href']])
    image = Image.open(io.BytesIO(raw)).convert('RGB')
    for obj in objects:
        x, y, width, height = obj['crop']
        crop = image.crop((round(x * image.width), round(y * image.height),
                           round((x + width) * image.width), round((y + height) * image.height)))
        crop.save(obj['src'], 'WEBP', quality=92)
