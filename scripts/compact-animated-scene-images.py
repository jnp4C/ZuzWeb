#!/usr/bin/env python3
"""Trim blank vertical margins from Cycle/Rewaterization animation derivatives.

Requires Pillow. Original assets and presentation PDFs are retained. Only the
animated object sources are updated; compact full-PDF pages retain page margins.
"""
import json
import re
from pathlib import Path
from PIL import Image, ImageChops

path = Path('data/projects.json')
text = path.read_text()
projects = json.loads(text)
manifest_path = Path('assets/compact-scenes/original-sources.json')
originals = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
for project in projects:
    if project['slug'] not in ('cycle-of-change', 'rewaterization'):
        continue
    for scene in project.get('scenes', []):
        for obj in scene.get('objects', []):
            source = originals.get(obj['name'], obj.get('src', ''))
            if not source or '/compact-scenes/' in source:
                continue
            image = Image.open(source).convert('RGB')
            # Retain faint marks and eight source pixels around the artwork.
            difference = ImageChops.difference(image, Image.new('RGB', image.size, 'white'))
            red, green, blue = difference.split()
            mask = ImageChops.lighter(ImageChops.lighter(red, green), blue).point(lambda v: 255 if v > 12 else 0)
            bounds = mask.getbbox()
            if bounds is None:
                continue
            top = max(0, bounds[1] - 8)
            bottom = min(image.height, bounds[3] + 8)
            if top + image.height - bottom < image.height * .025:
                continue
            output = Path('assets/compact-scenes') / project['slug']
            output.mkdir(parents=True, exist_ok=True)
            cropped = image.crop((0, top, image.width, bottom))
            name = obj['name']
            high = output / (name + '-full.webp')
            low = output / (name + '-1000.webp')
            cropped.save(high, 'WEBP', quality=92)
            preview = cropped.copy()
            if preview.width > 1000:
                preview = preview.resize((1000, round(preview.height * 1000 / preview.width)), Image.Resampling.LANCZOS)
            preview.save(low, 'WEBP', quality=88)
            originals[obj['name']] = source
            obj.update(src='./' + str(high), srcset=(f'./{low} {preview.width}w, ./{high} {cropped.width}w' if preview.width < cropped.width else ''))
            # Replace just this object, preserving the rest of the data file.
            marker = '"name": ' + json.dumps(name)
            position = text.index(marker)
            start = text.rfind('{', 0, position)
            _, end = json.JSONDecoder().raw_decode(text[start:])
            lines = json.dumps(obj, ensure_ascii=False, indent=2).splitlines()
            text = text[:start] + lines[0] + '\n' + '\n'.join('          ' + line for line in lines[1:]) + text[start + end:]
            print(f"{name}: {image.height} -> {cropped.height}")
json.loads(text)
path.write_text(text)
manifest_path.parent.mkdir(parents=True, exist_ok=True)
manifest_path.write_text(json.dumps(originals, indent=2) + '\n')
