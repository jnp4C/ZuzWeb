# Deployment Notes

`deployment-final` combines `final-static` and the latest `design-final-touch`
layout changes. It serves complete static PDF-derived presentations. The dynamic
implementation and its assets remain archived for work on `design-final-touch`.
There is no build step for local preview.

## Current site files

- `index.html`, `project.html`
- `script.js`, `project.js`, `project-media.js`, `language.js`, `shared-header.js`,
  `layout-scale.js`
- `styles.css`, `index-layout.css`, `project-layout.css`
- `data/projects.json` (use only published records in a public bundle)
- Referenced published media under `assets/`, including responsive variants,
  lightbox/zoom sources, contour backgrounds, and `assets/presentations/*.pdf`
- `.nojekyll` when deploying to GitHub Pages

The PDF downloads are part of the site. Do not exclude them with a blanket PDF
rule. Full-presentation page order, original dimensions, and responsive sources
must remain intact. Curated overrides in `project-media.js` are required.

## Archive and local files: exclude from a static public bundle

- `year.html`, `year.js`: legacy animated viewer, not used by published links
- Legacy scene-only assets, including `assets/compact-scenes/`, and unreferenced
  generated media (review references before excluding individual files)
- Unpublished project material, including `assets/2021-through-the-forest/`
  and `assets/2024-realizace-zahrada/`
- `Redesign/`, `BDWRAP/`, source portfolios, `.tmp_previews/`, `.venv/`, `zuzweb/`
- `.git/`, editor/OS files, and development scripts/docs

Do not publish the entire repository as a public folder: archived files remain
accessible by direct URL even when omitted from navigation. Visibility checks
hide unpublished project routes, but they do not protect files on a static host.
Preserve archives in Git; exclude them from the deployment bundle. The earlier
reference audit identified about 401 MiB outside the current-page asset set;
that is a conservative reference estimate, not a blanket deletion list.

## Before publishing

Preview the actual bundle through an HTTP server. Check index drawers and mobile
help text, every project and full presentation, featured-media lightboxes,
previous/next navigation, responsive layouts, and PDF downloads. Check that no
module/media requests fail and unpublished material is absent from the bundle.

The language control now uses the supplied English index and project translations.
The updated red-text source supplies English copy for all 11 projects; it still
has no English CV or detailed contact-drawer copy. Some presentation
srcsets top out below the archived zoom image resolution; preserve zoom sources
until the intended zoom quality is decided.

Verify the host's caching and compression settings. HTML, data, and modules must
revalidate when updated; immutable asset caching requires versioned URLs or
filenames. Publishing, pushing, and changing hosting require an explicit request.

## GitHub Pages bundle

Run `node scripts/build-pages.mjs` to generate the ignored `_site` directory.
The Pages workflow uploads only this directory. It filters unpublished records,
removes legacy scene metadata from deployment data, checks referenced assets,
and retains downloads and high-resolution variants. No source assets are deleted.
See [GitHub Pages setup](GITHUB_PAGES_SETUP.md) for `zuzanapurm.cz` DNS records and
activation steps. Change Pages from branch-root publishing to GitHub Actions
before pushing the workflow, so the source archive is not used as the site root.
