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

## Project data contract

`data/projects.json` supports the redesign alongside the legacy animated
presentation. When adding or migrating a project:

1. Give it a unique, stable `slug`, set `visibility`, and assign
   `portfolioSection` as `study` or `practice`.
2. Fill `index.order`, bilingual `index.scale`, `index.title`, and
   `index.context`. Add only meaningful `index.highlights`, such as an award or
   publication.
3. Treat the existing top-level English `title`, `description`, and `annotation`
   as the primary copy. Put Czech copy in `translations.cs`; `null` means that
   the translation still needs user-approved text.
4. Put normalized award information in `projectPage.awards`. Keep useful
   top-level legacy fields while the existing project header still consumes
   them.
5. Fill `projectPage.info` for the scheme's year, scale, processing, type, and
   collaborator rows. Use `projectPage.hero` for the main first-look image; it
   can expand to landscape and moves below the annotation on mobile.
6. Use `projectPage.featuredSections` for the selected tree sequence: a
   user-named graphical representation, masterplan, and model. Its `media`
   arrays intentionally stay empty until the user chooses project source
   material. Never guess the final image selection.
7. Keep the current `scenes` array unchanged as the complete animated document.
   `projectPage.fullPresentation` exposes it as the optional `+ Full
   presentation` section after the concise first-look content.
8. Confirm that the project appears in the intended index group and that its
   direct URL selects the correct project before committing.

The intended project-page reading order is: project name; core information;
awards; annotation beside the main image; selected graphical representation;
masterplan; model; then the bottom `+` control for the full animated
presentation. On mobile the main image follows the annotation. The first-look
content should convey the project clearly without requiring visitors to open
the full document.
