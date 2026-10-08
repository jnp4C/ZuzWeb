# Deployment merge review

`deployment-final` combines `design-final-touch` at `4238638` with `final-static`
at `759211e`. Both source branches remain unchanged. The design branch's newer
solutions take precedence wherever the two branches overlap, while full
presentations remain static.

## Retained from the latest design branch

All 18 newer design commits are included: static fitted mobile footer credits,
heading box overhang, mobile CV inset correction, index scroll-to-top control,
day/night slider arrowheads, uniform 110% scaling, birth-year-only info,
responsive page/control boundaries, annotation and fact widths, consolidated
layout rules, viewport-contained lightbox close control, and sequential
lightbox navigation through every image across sections without lightbox dots.
The latest layout stylesheets, scale helper, and shared header are unchanged.

## Retained from the static branch

Complete PDF-derived page sequences, original dimensions, responsive sources,
lazy loading, parent-page scrolling, and PDF downloads replace animated full
presentations. No presentation iframe or performance/capability detection is
used. Projects and CV retain their opening-animation fixes. Unused signature
and scene functions remain removed, and unpublished project routes are filtered.
Legacy scene data, media, and tools remain archived for dynamic work. The merge
restores 222 presentation asset files absent from the newer design branch.

## Overlap and conflicts

- No exact duplicate commit patches were found by Git's cherry comparison.
- Both branches corrected the mobile CV padding. Keep the design stylesheet's
  single correction; do not add the static branch's redundant override.
- The mobile bottom ticker conflicts with the newer static footer credits.
  Keep the design footer solution, as requested.
- The presentation-renderer conflict is resolved with static page rendering,
  while retaining the newer design's zoom-aware layout measurements elsewhere.
- HTML cache-version conflicts use fresh versions for the merged files.
- Source PDFs, static page order, and current published project metadata are
  preserved; there are no duplicated presentation page sequences.

## Validation

66 project checks passed across 390, 900, and 1440 pixel widths and both language
URL settings. No JavaScript exceptions, failed HTTP requests, broken loaded
images, missing referenced published media, or horizontal overflow were found.
All 10 PDF downloads passed. Drawer opening/closing, rapid reopening, reduced
motion, fitted mobile footer, 81-page presentation opening, updated lightbox
navigation, Escape closing, and unpublished route filtering passed. JavaScript
syntax, HTML parsing, and Git whitespace checks passed.

Checks used local headless Chromium with mobile emulation, not a physical
phone/Safari. This merge does not publish or push the website. Follow
DEPLOYMENT_NOTES.md to exclude archived/unpublished files from the public bundle.
