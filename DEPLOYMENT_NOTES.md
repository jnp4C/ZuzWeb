# Deployment Notes

This branch is prepared as a compact static deployment branch.

## Ship

- `index.html`
- `year.html`
- `styles.css`
- `script.js`
- `year.js`
- `data/projects.json`
- `assets/`
- `.nojekyll` when deploying to GitHub Pages

## Do Not Ship

- Source PDFs used for crop generation
- `.tmp_previews/`
- `.venv/`
- `zuzweb/`
- `.DS_Store`

## Current Asset Notes

- The live project scenes are generated image/object scenes, not browser-rendered PDF pages.
- Root source PDF references were removed from `data/projects.json` on this deployment branch.
- The largest deployed raster assets are currently older `assets/2021-through-the-forest/*.png` files.
- The smoothed contour SVGs are larger than the originals but compress well with gzip or Brotli.

## Recommended Hosting

- GitHub Pages is acceptable for a simple static deployment.
- Netlify or Cloudflare Pages are better if you want automatic gzip/Brotli compression and cache headers.
- Enable long-lived cache headers for `assets/` when the host supports it.
