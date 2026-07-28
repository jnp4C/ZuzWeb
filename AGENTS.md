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
- `Redesign/WEB PORTFOLIO texty.pdf`: project metadata, links, Czech and English
  descriptions, credits, awards, and publication notes.
- `Redesign/PROJEKTY na web/`: source images, drawings, models, portfolios,
  presentations, and thumbnails for projects intended for the website.
- `Redesign/PROJEKTY na web/PROJEKTY nezveřejněné/`: unpublished projects.
  Treat this directory as private/reference-only and do not expose or copy its
  contents into the public site without explicit user approval.

When website-ready derivatives are needed, copy only the selected material into
tracked site asset directories, use web-appropriate names and formats, and
preserve the original local references unchanged. Confirm project selection,
image selection, and copy when the source material offers multiple plausible
options.

## Implementation workflow

1. Check the current branch and working tree before editing. Redesign work should
   normally happen on `redesign`.
2. Review the relevant draft area, project folder, and portfolio text before
   implementing a screen or project.
3. Distinguish published project folders from `PROJEKTY nezveřejněné`.
4. Define shared project metadata and navigation centrally rather than
   hard-coding a separate year-based path for each project.
5. Keep the index-to-project and project-to-project interactions usable with
   keyboard, touch, and pointer input, and support reduced motion.
6. Test responsive behavior at narrow mobile and wide desktop sizes.
7. Do not commit local drafts, source portfolios, lock files, or the complete
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
