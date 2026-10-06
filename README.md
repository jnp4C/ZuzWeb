# Dynamic Architecture Portfolio

Static architecture portfolio with a project index, bilingual project pages,
image carousels, and optional animated presentations.

## Final design touches on another computer

Clone the repository and check out the finishing branch:

```bash
git clone --branch final-static https://github.com/jnp4C/ZuzWeb.git
cd ZuzWeb
```

For an existing clone with a clean working tree:

```bash
git fetch origin
git switch final-static
git pull --ff-only origin final-static
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

## Static presentation branch

`final-static` uses complete static PDF page images for every published full
presentation. Pages load lazily, retain their original proportions, and scroll
in the main document. The PDF download remains available.

The dynamic implementation is preserved on `design-final-touch` for future
animation work. Legacy scene files are retained but are not loaded by full
presentations on this branch.

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
