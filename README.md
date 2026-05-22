# Dynamic Architecture Portfolio

Minimal portfolio with:
- intro + year selection on the home page
- year-based project page with sticky text and animated PDF scenes
- optional per-year top project picker when multiple projects exist in that year

## Local development

Run on a local server (PDF.js does not reliably run from `file://`):

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

## Customize content

- Edit project text in `data/projects.json`.
- Required: set `year` on each project.
- Optional: add `"pdfPages": [2,3,4]` for exact animated scene pages.
- Optional: add `"pdfPage": 12` for single anchor page (auto-expands to nearby scenes).
- Optional: add `"pdfFile": "./another-source.pdf"` for per-project source PDF.
- Advanced: add `"scenes"` for object-level animation (annotation / objects / pdf scenes).
- Keep `PORTFOLIO_Zuzana-Purmova.pdf` in the project root.

If no page mapping is provided, pages are distributed automatically across the PDF.

## Deploy with GitHub Pages

1. Push repository to GitHub.
2. Open repository **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Set branch to `main` and folder to `/ (root)`.
5. Wait for publish and open:
   - `https://<your-username>.github.io/<repo-name>/`
