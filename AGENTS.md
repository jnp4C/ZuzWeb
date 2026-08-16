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

## Standardized redesign project-page formula

Use the `cycle-of-change` concise page as the implementation reference for every
project migrated to the redesign. New project pages should share this structure
and interaction model; vary the project content, selected media, labels, and
project-specific landscape background rather than inventing a separate layout.

### Shared page structure

1. Start with the transparent animated signature, aligned to the same responsive
   left gutter as the index. It spans the available width without distortion.
   The clean animation ends before the gray tail frames in the source MOV, then
   changes to the separate transparent static PNG. Preserve the session state so
   project navigation retains the completed signature instead of replaying it.
2. Place the project title below the signature in the primary 40pt Space
   Grotesk level. Put the index/back symbol on the left spine and paired
   previous/next project controls on the right. Previous and next controls use
   two solid CSS triangles, not textual `<<`, `>>`, `«`, or `»` glyphs.
3. Run one pitch-black 2px vertical spine down the left side. Labels interrupt
   the spine with the page background behind them; the line must not show
   through the label text or its symbols.
4. Embed vertical `info` and `annotation` labels into that spine. Their top
   positions align with the top of their corresponding text blocks. Use the
   20pt Space Grotesk level for these structural labels.
5. Keep the hero image as the outlined box adjacent to the Info/Annotation
   column on desktop. On mobile, stack Info, Annotation, and then the hero while
   retaining the spine-label relationship.

### Info and annotation

- Format every Info row as `[ LABEL ] VALUE`.
- Keep `[ LABEL ]` gray and the value bold black.
- The bold value appears first; the gray bracketed label unfolds afterward.
- Give the Info rows and Annotation the same left edge and text-block width.
  Bracketed labels align left, values align to the right edge, and flexible
  space separates both sides of the row.
- Annotation is a transparent text block, not an outlined box and not a filled
  color block. Use justified Public Sans body text with no inset padding.
- Language changes update the content in place and must not replay completed
  Info animations.

### Featured media and carousels

- Treat `Redesign/WEB PORTFOLIO real obsah (1).docx` as the authoritative
  source for each project's featured-section names and section order. Source
  carousel images only from that project's folder whose name ends in
  `_grafika` (case-insensitive). Include every image belonging to the named
  section and preserve the numeric filename order within that section. Create
  web-ready derivatives under `assets/project-pages/<slug>/`; never link the
  ignored source files directly. If the document does not specify a project or
  the mapping is ambiguous, ask the user instead of falling back to generic
  graphical-representation/masterplan/model placeholders.
- Every featured-media label leading into a graphical carousel must use the
  exact annotation-body typography: Public Sans (`--font-text`), the same
  responsive body size (`clamp(var(--type-small), 1.05vw, 0.98rem)`), regular
  weight, and 1.5 line height. Render the label in all caps. Do not use the
  Space Grotesk heading level for these labels.
- Each visible section has a horizontal 2px black branch from the main vertical
  spine to the exact center of the carousel frame's left border. The localized
  section label sits immediately above the line. Do not prepend section numbers.
- A section may contain multiple media items. Its first selected asset is the
  initial frame, and all additional assets use the same framed carousel.
- Carousels autoplay in a continuous right-to-left horizontal swipe. Manual
  previous navigation reverses the direction. Pause autoplay for pointer hover
  or keyboard interaction and disable autoplay/transitions for reduced motion.
- Keep the carousel frame monochrome and responsive. Recalculate branch
  geometry when the frame or viewport resizes so the line remains connected.

### Full presentation and animation continuity

- The bottom `+ Full presentation` control reveals the existing scene
  presentation inline. It is full viewport width/height, borderless, and the
  parent page scrolls directly to it.
- Embedded presentations omit the legacy header and introductory annotation;
  they start with the first visual scene.
- Do not remove or rebuild the existing `scenes` data. The embedded scene must
  continue the project's established animation and landscape.
- The first embedded scene uses a deterministic entrance timeline after the
  iframe becomes visible. Do not allow its initial scroll measurement to mark
  it complete before it animates.
- Keep the project-specific contour background pitch black, subtle, and
  consistent with the index transition. The stored index landscape undraws
  before the project landscape draws.

### Responsive and implementation rules

- Use the shared 10pt / 20pt / 40pt typography variables and the existing
  Public Sans / Space Grotesk families.
- Align signature, title, spine, text blocks, connectors, and frames through
  shared responsive gutters and CSS variables. Avoid viewport-specific
  hard-coded offsets when geometry can be measured or derived.
- Nothing may overlap at narrow, intermediate, or very wide viewport sizes.
  Long metadata values wrap inside their column; project controls retain their
  own lane.
- Keep project content in `data/projects.json`. Use `projectPage.info`,
  `projectPage.hero`, `projectPage.featuredSections`, and the existing
  `projectPage.fullPresentation` contract rather than hard-coding project copy
  in `project.js`.
- A project opts into this standardized page with
  `projectPage.layout: "concise"`. Until its curated first-look media is ready,
  it may remain linked to the legacy presentation, but it must stay visible in
  the index when published.

## Session handoff: index foundation

Last verified on the `redesign` branch at commit `6f2f46e`. At the beginning of
the next session, start or verify localhost and visually inspect the current
index before changing it.

Completed:

- `data/projects.json` contains redesign metadata for all nine existing
  projects: seven in `study` and two in `practice`.
- The index renders projects directly from JSON instead of rendering year
  buttons. Direct links still open the matching project in the existing
  `year.html` presentation.
- Desktop rows initially emphasize the project name; scale, context, and
  highlights unfold on hover or keyboard focus. Touch layouts keep this
  information visible because touch has no dependable hover.
- The tree contains `Study`, `Practice`, `INFO`, and `CV`. Clicking `INFO`
  reveals the existing introduction and personal-information content. `CV` is
  intentionally still a placeholder.
- `PROJECTS`, `INFO`, and `CV` use the same Space Grotesk display treatment.
  Small project metadata uses Public Sans.
- The vertical spine is intentionally interrupted by the `Study` and
  `Practice` words. Each word sits directly on the spine axis, not offset to the
  right. The line ends immediately above the word and resumes below it. Do not
  add horizontal connector lines.
- Do not blur, soften, reduce the opacity of, or otherwise degrade `Study` or
  `Practice` during project interaction. A blur experiment was explicitly
  rejected because it reduced text quality.
- The latest desktop layout was visually checked with a 1440px-wide Firefox
  localhost screenshot after commit `6f2f46e`.

Next recommended work:

1. Keep the index stable unless the user requests another visual adjustment.
2. Build the concise project-page layout from
   `Redesign/web draftprojectscheme.pdf` using the existing project header.
3. Render `projectPage.info`, awards, and annotation first.
4. Leave `projectPage.hero` and each featured section's `media` empty until the
   user selects the graphical representation, masterplan, and model assets for
   that project.
5. Place the existing animated `scenes` behind the final `+ Full presentation`
   control rather than deleting or rebuilding those scenes.

Known local-only state: `BDWRAP/` remains untracked and unrelated. `Redesign/`
is ignored intentionally and contains the current design/source references.

## Session handoff: full-page animated index (2026-07-29)

The homepage redesign now uses a full-page PROJECTS / INFO / CV index over the
animated contour landscape. All three controls start closed and open only when
clicked. Their content rows share a Public Sans type treatment, responsive size,
horizontal label baseline, staged reveal, temporary detail wave, and persistent
hover/focus preview.

- PROJECTS renders the existing study and practice data as single-line rows.
  Bracketed scale information unfolds to the left of the title; context and
  highlights unfold to the right.
- INFO contains only email, year of birth, alma mater, and the portrait. The
  bracketed values unfold to the left of their labels. Do not restore the
  removed introduction copy or add a phone number.
- CV is a five-row interactive timeline. Its bracketed dates unfold to the left,
  supplementary context unfolds to the right, and an SVG rope connects the
  markers with animated sag and hover reactions.
- PROJECTS and CV have reverse closing sequences. A closed control outline is
  hidden unless hovered or keyboard-focused. During a closing sequence, a
  hovered outline must follow the perimeter animation instead of flashing into
  its completed state.
- The animated name header uses `assets/Header/name-writing.mp4` with
  `name-writing-final.webp` as its persistent poster.

Keep `BDWRAP/` untracked and leave the ignored `Redesign/` source folder
untouched. The redesign commit preceding this handoff is `2b28218`; inspect the
current branch log for the follow-up interaction commit.

## Session handoff: full concise migration and responsive interaction (2026-08-01)

All ten published projects now route to `project.html` with
`projectPage.layout: "concise"`. WATERSCAPE, CYKLUS PROMĚNY, SEMNĚVIZE, and
REVODALIZACE have curated concise media. Other projects reuse a bounded
selection of their existing scene assets when curated media is absent;
MEZI VŠÍM and THE NEW LANDSCAPE OF HIGH-SPEED RAILWAYS render clean text-only
concise pages until imagery is supplied. Unpublished projects remain excluded.

- Project and index pages share the same signature dimensions, responsive
  gutters, 2.25rem black controls, heading scale, and left spine axis.
- The project home star begins on the title row and becomes viewport-fixed only
  after that row scrolls away. Its center stays aligned with the vertical spine;
  previous/next controls float at the opposite gutter at the same threshold.
- Returning to the index through the star keeps the completed signature static.
  Reloading the index intentionally replays it.
- Featured images are frameless. Desktop image widths reserve space for their
  connector labels; phone layouts use the full width between page gutters and
  connect labels to the image top edge without overlapping the label text.
- Carousels do not autoplay. Their arrows remain available, and selecting any
  hero or featured image opens a blurred-backdrop lightbox with previous/next,
  keyboard controls, wheel zoom, double-click reset, and touch pinch/pan.
- Award metadata renders as a full-width black band with white text.
- Index project previews use existing index, hero, or scene media. They are
  overlays and never move subsequent rows; they open beside text when space is
  available, otherwise below it, and close as soon as the pointer leaves text.
- PROJECTS, INFO, and CV openings run at 60% of their earlier timeline (40%
  faster); closing sequences retain their prior speed. Drawer state is mutually
  exclusive and clears stale timers/classes during rapid switching.
- Mobile CV is a persistent, wrapped vertical timeline with dates and supporting
  context always visible and markers kept inside the content width.

`assets/project-pages/waterscape/` contains the selected web-ready derivatives
used by the concise WATERSCAPE page. Continue to leave `BDWRAP/` untracked and
the ignored `Redesign/` source tree unchanged.
