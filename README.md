# Dynamic Architecture Portfolio

Static architecture portfolio with a project index, bilingual project pages,
image carousels, and optional animated presentations.

## Final design touches on another computer

Clone the repository and check out the finishing branch:

```bash
git clone --branch design-final-touch https://github.com/jnp4C/ZuzWeb.git
cd ZuzWeb
```

For an existing clone with a clean working tree:

```bash
git fetch origin
git switch design-final-touch
git pull --ff-only origin design-final-touch
```

Open this folder in your coding agent and tell it:
“Read AGENTS.md, help me set up the local preview, and start the server.
I will describe the final design changes.”

`AGENTS.md` includes the setup workflow and existing design rules. Local source
references in `Redesign/` are ignored and are not included in the clone; the
tracked website can be previewed without them.

## Local development

No build step or npm dependencies are required. Install Python if needed, then
run from the repository root (keep the terminal open):

```bash
# macOS / Linux
python3 -m http.server 8080 --bind 127.0.0.1
```

```powershell
# Windows
py -m http.server 8080 --bind 127.0.0.1
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).
Use HTTP because project data and PDF features do not reliably work with
`file://`. Stop the server with Ctrl+C. If the port is busy, use 8081 instead.

## Presentation previews

Animated presentations scroll with the project page and use content-height
scenes separated by 12px. Abstract and Growing Through assemble their pieces
using source-page crop coordinates to preserve page proportions.

Compact mode displays complete PDF-derived pages, loads images lazily, and
preserves browser pinch zoom. It is selected for reduced motion, data saving,
reported memory of 2GB or less, or two or fewer reported logical processors.
During animation playback it also activates after sustained slow frames while
scrolling, an animation error, or a 15-second startup timeout. Browser hardware
hints are approximate; runtime checks cover browsers without memory hints.

To review compact mode directly, append `&presentation=compact` to a project URL,
for example `project.html?project=abstract&presentation=compact`.

PDF page exports are stored in `fullPresentation.fallbackPages`; hybrid projects
can reuse their existing complete `pages` sequence. Rebuild exports from the
tracked source PDFs using `python3 scripts/export-presentation-pages.py` and
`python3 scripts/export-abstract-source-crops.py` (requires Poppler and Pillow).
Do not replace the source PDFs with exported images.

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
