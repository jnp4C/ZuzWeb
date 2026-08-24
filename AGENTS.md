# ZuzWeb Agent Guide

## Current direction

Work on the full-site redesign belongs on the `redesign` branch. This branch was
created from `deployment-prep` and intentionally does not include the birthday
wrapping feature from `BDwrapping`.

The redesign is a new working version of the site, not a small visual refresh of
the existing year-based navigation. Preserve the deployed site as a reference,
but do not assume its page structure or interaction model must remain.

## Redesign goals

- Make the project index the main way to discover and open every published
  project.
- Replace the current year-by-year project selection with the project tree
  shown in `Redesign/web draft 01.pdf`.
- Design direct, understandable movement between the index and individual
  project pages.
- Keep each project directly accessible from the index instead of requiring the
  visitor to navigate through year pages.
- Treat the draft as the visual and information-architecture reference. Clarify
  ambiguities with the user rather than silently reverting to the old layout.
- Build the redesign as a coherent new page/system while retaining useful
  content and assets from the current site where appropriate.

The draft groups work broadly under `studium` and `praxe`, with separate `INFO`
and `CV` destinations. Project labels can communicate scale/type, title,
context, collaboration, awards, publication, or realization where relevant.
These are meaningful content fields, not decorative placeholder text.

## Local reference material

`Redesign/` is an ignored, local-only working folder. Read it as source material,
but never force-add or commit anything from it. Do not rename, reorganize,
delete, optimize, or overwrite its contents unless the user explicitly asks.

Key references:

- `Redesign/web draft 01.pdf`: graphic design and interaction concept for the
  new project index/tree.
- `Redesign/web draftprojectscheme.pdf`: project-page layout scheme and reading
  order.
- `Redesign/WEB PORTFOLIO texty.pdf`: project metadata, links, Czech and English
  descriptions, credits, awards, publication notes, and typography direction.
- `Redesign/WEB PORTFOLIO Zuz sdileni/PROJEKTY na web/`: newest source images,
  drawings, models, presentations, and thumbnails for projects intended for
  the website. Prefer it over older duplicated project collections.
- Do not use any `WEB PORTFOLIO podklady*.docx` file as a content source. The
  author has marked those documents as confusing and superseded.
- Any folder identified as unpublished or `nezveřejněné`, plus every
  `*_nepouzito`/`*_nepouzite` folder, is private/reference-only. Do not expose
  or copy its contents into the public site without explicit user approval.

When website-ready derivatives are needed, copy only the selected material into
tracked site asset directories, use web-appropriate names and formats, and
preserve the original local references unchanged. Confirm project selection,
image selection, and copy when the source material offers multiple plausible
options.

## Typography

Use the three-level type system specified at the start of
`Redesign/WEB PORTFOLIO texty.pdf`: approximately 10pt, 20pt, and 40pt, with
each level doubling. Use Public Sans for small body copy and Space Grotesk for
the two larger, mainly heading levels. Both uppercase and lowercase headings are
valid when the hierarchy calls for them. Use the CSS variables `--type-small`,
`--type-medium`, `--type-large`, `--font-text`, and `--font-heading` instead of
introducing unrelated type sizes or families without user approval.

## Implementation workflow

1. Check the current branch and working tree before editing. Redesign work should
   normally happen on `redesign`.
2. At the start of every coding session, serve the repository through a local
   HTTP server and verify that the site loads over HTTP. Reuse an already
   running suitable server when possible; otherwise start one (for example,
   `python3 -m http.server 8000`). Report the local URL and do not rely on
   opening the HTML through a `file://` URL. If the server cannot be started,
   diagnose and report that before making site changes.
3. Review the relevant draft area, project folder, and portfolio text before
   implementing a screen or project.
4. Distinguish published project folders from `PROJEKTY nezveřejněné`.
5. Define shared project metadata and navigation centrally rather than
   hard-coding a separate year-based path for each project.
6. Keep the index-to-project and project-to-project interactions usable with
   keyboard, touch, and pointer input, and support reduced motion.
7. Test responsive behavior at narrow mobile and wide desktop sizes.
8. Do not commit local drafts, source portfolios, lock files, or the complete
   contents of `Redesign/`.

## Repository notes

The current site is a static HTML/CSS/JavaScript project. Its primary files are
`index.html`, `styles.css`, `script.js`, `year.html`, `year.js`, and
`data/projects.json`. Existing generated/site-ready assets live under `assets/`.
Before replacing or removing current behavior, trace its use in these files and
keep unrelated deployed functionality working until the redesign has an
intentional replacement.

`BDWRAP/` contains untracked local assets from the birthday wrapping work and is
not part of the redesign. Leave it untouched unless the user explicitly brings
that feature into scope.

## Current design rules

- `Redesign/web draft 02.pdf` is the visual reference for the current INFO and
  CV drawers. `Redesign/web_draft_rozmery.pdf` defines page dimensions, and the
  newest `ikony_schema_rozmeru.pdf` inside the dated Drive download defines
  control and pictogram geometry. Red measurements are pixels.
- PROJECTS, INFO, and Curriculum vitae are independent drawers. Visitors may
  keep all three open at once. Do not reintroduce mutually exclusive behavior.
- Closed drawer controls are static black boxes with centered white text and a
  white plus. Only the plus rotates 90 degrees when opened; the box itself must
  never rotate or resize. The 2px connector/spine begins below the box, remains
  continuous, and must not cross either box edge during opening or closing.
- A hover connector runs from the drawer control to its destination. It is
  consumed as the vertical opening spine grows and appears again only when the
  closing control is hovered. Closing must clear all content deterministically;
  lower headings settle continuously rather than snapping after a timeout.
- PROJECTS, INFO, and Curriculum vitae use the same 50px control geometry,
  vertical-label typography, spine, and 25px content offset. Vertical labels
  must be sized by their text, never cropped to the content height.
- Use the index signature as the size and centering reference everywhere. It is
  20 percent smaller than the original draft version and must not change the
  starting position of the page content.
- All black controls, including project titles, presentation, download,
  previous/next, home, and lightbox controls, follow the icon schema. White text
  and pictograms keep the specified 10px optical clearance. Reuse the existing
  plus/cross and double-triangle shapes; do not substitute font glyphs.
- Project and presentation labels use the same Space Grotesk size and weight as
  index text. Featured-media labels use annotation typography in all caps.
- Tablet layouts (721–1024px) keep equal visible screen margins without moving
  the internal project spine. Preserve the fixed optical distance from the Home
  control to the project title and use that same clearance before the right
  previous/next controls. Long tablet titles use the existing text carousel.
- On tablet project intros, text remains in a flexible left column and the hero
  remains in a flexible right column. Both tracks must use zero minimum widths;
  long URLs and metadata wrap inside the text track, and hero media is contained
  so neither column can paint across their gap.
- Highlighted awards, publications, conferences, and realizations render as
  individually marked black text fragments, not a full-width solid rectangle.
  Copy their wording and punctuation exactly from the authoritative content
  document.
- Author names use normal capitalization and omit academic titles everywhere.
- Index previews are desktop/tablet pointer affordances only. They remain to the
  right of their row and scale down to fit the available viewport without
  cropping or overlapping text. Do not render previews on mobile/touch layouts.
- Mobile project titles must wrap without overlapping the controls. Project
  Info, Annotation, highlighted copy, and media align to the shared content
  start derived from the title/header label.

## Authoritative project sources

For new or updated projects, use the newest matching files rather than an older
duplicate:

1. `Redesign/WEB PORTFOLIO Zuz sdileni/WEB PORTFOLIO real obsah.docx` defines
   project text, exact highlighted passages, featured-section names, and
   carousel order. Check newer copies if their modified date shows that they
   supersede it.
2. `Redesign/WEB PORTFOLIO Zuz sdileni/PROJEKTY na web/` is the current project asset
   collection. A project's `*_index` directory supplies its index preview,
   `*_grafika` supplies concise-page carousel media, and `*_prezentace` supplies
   a downloadable/full presentation when one exists. Never source published
   media from `*_nepouzito`, `*_nepouzite`, or unpublished-project folders.
3. Preserve the exact filename/numeric order stated by the content document.
   Do not infer images from a similarly named old directory when properly
   labelled files exist in the current project folder.
4. Copy only chosen web derivatives to `assets/project-pages/<slug>/` and PDFs
   to `assets/presentations/`. Never link into or commit `Redesign/`.

## Adding a project

Use an existing current concise project as a structural template, but copy no
project-specific text or media. Complete this checklist for every addition:

1. Add one object to `data/projects.json` with a stable lowercase kebab-case
   `slug`, `visibility`, and `portfolioSection` (`study` or `practice`). Use
   `visibility: "unpublished"` until all content and media have been approved.
2. Add `index.order`, localized `index.scale`, `index.title`, `index.context`,
   `index.highlights`, and `index.image`. The index image must come from the
   project's current index folder and include meaningful Czech and English alt
   text plus responsive `srcset` where derivatives exist.
3. Add the primary English `title`, `description`, and `annotation`, with exact
   Czech equivalents in `translations.cs`. Preserve the source's spelling,
   capitalization, punctuation, and paragraph meaning. Do not invent missing
   translations or editorially rewrite valid copy.
4. Set `projectPage.layout` to `"concise"`. Fill `projectPage.info` in the
   content-document order, plus the intro visibility settings and hero media
   when required. Keep long values wrap-safe. Normalize collaborators/authors
   to names without titles and without forced uppercase.
5. Put marked content in `projectPage.awards`, `projectPage.references`, or
   `projectPage.highlightedText` as appropriate. Store the exact localized label
   and detail separately; add `href` only when the source supplies a link.
6. Build `projectPage.featuredSections` in the exact order defined by the
   content document. Each section needs a stable `id`, `kind`, bilingual
   `label`, and ordered `media`. Each media entry needs `src`, optional `srcset`,
   and descriptive bilingual `alt` text.
7. A normal carousel uses centered pagination dots below the image; the selected
   dot is solid and the others outlined. There are no carousel arrows or text
   counters. The all-caps label and dots share one centered row, and the 2px
   horizontal connector remains continuous above it.
8. For a day/night comparison, set `presentation: "day-night-fade"` and supply
   exactly the ordered day/night pair. It renders one image with the existing
   compact slider, not two separate visualizations.
9. Add `projectPage.fullPresentation` only when a real presentation is supplied.
   Set `enabled: true`, the correct source, and `download.href` only for an
   existing tracked PDF. If there is no presentation, disable/omit this data so
   neither Presentation nor download control is rendered. The visible control
   text is only `PRESENTATION`/`PREZENTACE`; opening rotates only its plus.
10. Preserve any legacy `scenes`/`pdfPages` data unless the task explicitly
    replaces it. Do not use legacy scene assets as a silent fallback for a new
    project's curated concise page.
11. Ensure previous/next navigation includes the project in the correct
    published order and the direct URL is
    `project.html?project=<slug>`. Confirm both languages, image lightbox,
    presentation scroll position, and download behavior.

## Project-page invariants

- Reading order is title; Info and Annotation; exact marked content; hero and
  ordered featured carousels; optional Presentation and download controls.
- The signature, title control, 2px spine, vertical labels, body content, and
  media all use the established shared alignment variables. Do not add
  project-specific offsets to repair a shared-layout issue.
- Annotation and featured labels use Public Sans body sizing. Vertical labels,
  index controls, project title controls, and Presentation use the established
  Space Grotesk display sizing.
- Carousel images are fully contained and responsive. Their click target opens
  the current lightbox, whose previous/next controls reuse double triangles and
  whose close control reuses the rotating plus/cross with 10px clearance.
- Presentation auto-scroll stops with the Presentation label and download
  control still visible. The download control is a square aligned with the
  orientation controls and uses the existing triangle-plus-rectangle icon.
- Scene-based full presentations are one continuous parent-page document. Each
  animated scene occupies its own viewport-sized normal-flow section and
  appears after the previous scene as the main page scrolls. Do not restore a
  sticky single-stage iframe, nested presentation scrolling, artificial scroll
  scaling, or simultaneous crossfading/overlap between adjacent scene layers.
- Hybrid presentations retain their animated scenes first and extracted source
  pages afterward. Extracted pages remain part of the parent page, preserve
  high-resolution pinch zoom, and must not become individually clickable image
  links or a nested PDF viewer.
- Support keyboard, touch, pointer input, and `prefers-reduced-motion`.

## Validation and commit checklist

1. Validate JSON parsing and run `node --check` for every changed JavaScript
   file. Run `xmllint --html --noout` for changed HTML and `git diff --check`.
2. Serve the site over localhost and inspect index plus the new direct project
   URL at desktop, tablet, and mobile widths. Check long titles and wrapped
   metadata as well as a short project.
3. Verify every tracked media path exists, every carousel count/order matches
   the content document, and no `Redesign/`, office lock file, or `BDWRAP/`
   content is staged.
4. Confirm drawer opening/closing under rapid repeated clicks and with multiple
   drawers open. No text may remain after closing and no spine may cross a box.
5. Each requested change gets its own commit. Review `git status` immediately
   before and after committing; leave unrelated user files untouched.
