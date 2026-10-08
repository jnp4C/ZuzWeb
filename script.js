import { SITE_SCALE, layoutRect } from "./layout-scale.js?v=2026-10-08-site-scale";
import { initIndexHeader, updateSharedHeaderGeometry, updateHeaderLanguageToggle } from "./shared-header.js?v=2026-10-08-site-scale";
import {
  getLanguage,
  getLocalizedText,
  initLanguageSwitch,
} from "./language.js?v=2026-10-06-inherited-language";
import { applyCuratedProjectMedia } from "./project-media.js?v=2026-08-16-updated-index-images";

const projectGroups = {
  study: document.getElementById("studyProjects"),
  practice: document.getElementById("practiceProjects"),
};
const yearLabel = document.getElementById("year");
const projectIndex = document.querySelector(".project-index");
const projectsToggle = document.getElementById("projectsToggle");
const projectsPanel = document.getElementById("projectsPanel");
const infoToggle = document.getElementById("infoToggle");
const infoDetails = document.getElementById("infoDetails");
const cvToggle = document.getElementById("cvToggle");
const cvDetails = document.getElementById("cvDetails");
const personalPhotoFrame = document.querySelector(".personal-photo-frame");
const backgroundAnimation = document.querySelector(".background-animation");
const INDEX_OPENING_SPEED = 0.6;
const PROJECTS_CLOSING_DURATION = 900;
const NESTED_DRAWER_CLOSING_DURATION = 700;
const DATA_CACHE_VERSION = "2026-10-08-redesign-media";
const BACKGROUND_CACHE_VERSION = "2026-05-31-project-backgrounds";
const BACKGROUND_STORAGE_KEY = "zuz-active-background-src";
const DEFAULT_BACKGROUND_SRC = "./assets/Background/smoothed/contours.svg";
const AVAILABLE_BACKGROUND_SRCS = new Set([
  DEFAULT_BACKGROUND_SRC,
  "./assets/Background/smoothed/contours-semnevice.svg",
  "./assets/Background/smoothed/contours-Praha-stresovice.svg",
  "./assets/Background/smoothed/contours-kladno.svg",
  "./assets/Background/smoothed/contours-growing.svg",
  "./assets/Background/smoothed/contours-abstract.svg",
]);
const RANDOM_INDEX_BACKGROUND_SRCS = Array.from(AVAILABLE_BACKGROUND_SRCS);
let activeLanguage = getLanguage();
let indexProjects = [];
let setProjectsOpen = () => {};
let setInfoOpen = () => {};
let setCvOpen = () => {};

function withBackgroundCacheVersion(src) {
  const delimiter = src.includes("?") ? "&" : "?";
  return `${src}${delimiter}bg=${BACKGROUND_CACHE_VERSION}`;
}

async function loadBackgroundSvgElement(src) {
  const response = await fetch(withBackgroundCacheVersion(src), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load background: ${src}`);
  }

  const svgText = await response.text();
  const documentParser = new DOMParser();
  const svgDocument = documentParser.parseFromString(svgText, "image/svg+xml");
  const svgElement = svgDocument.documentElement;
  if (!svgElement || svgElement.nodeName.toLowerCase() !== "svg") {
    throw new Error(`Invalid background SVG: ${src}`);
  }

  const importedSvg = document.importNode(svgElement, true);
  prepareBackgroundSvgElement(importedSvg);
  importedSvg.classList.add("background-animation-lines");
  importedSvg.style.setProperty("--contour-drift-delay", `${-(performance.now() / 1000)}s`);
  importedSvg.setAttribute("aria-hidden", "true");
  importedSvg.setAttribute("focusable", "false");
  return importedSvg;
}

function prepareBackgroundSvgElement(svgElement) {
  svgElement.querySelector("#background-contour-animation")?.remove();
  const contours = Array.from(svgElement.querySelectorAll("polyline, path"));
  contours.forEach((contour, index) => {
    contour.setAttribute("pathLength", "1");
    if (!contour.style.getPropertyValue("--contour-delay")) {
      contour.style.setProperty("--contour-delay", `${Math.min(index * 0.035, 2.4)}s`);
    }
  });
}

function forceFinishedBackgroundDraw(svgElement) {
  if (!svgElement?.isConnected) {
    return;
  }
  svgElement.classList.add("is-static");
}

function scheduleBackgroundDrawCompletion(svgElement) {
  window.setTimeout(() => {
    forceFinishedBackgroundDraw(svgElement);
  }, 12500);
}

function persistActiveBackground(src) {
  try {
    window.sessionStorage.setItem(BACKGROUND_STORAGE_KEY, src);
  } catch {
    // Ignore storage failures; background switching should still work in memory.
  }
}

function getRandomIndexBackgroundSrc() {
  return RANDOM_INDEX_BACKGROUND_SRCS[Math.floor(Math.random() * RANDOM_INDEX_BACKGROUND_SRCS.length)] || DEFAULT_BACKGROUND_SRC;
}

async function renderRandomIndexBackground() {
  if (!backgroundAnimation) {
    return;
  }

  try {
    const backgroundSrc = getRandomIndexBackgroundSrc();
    persistActiveBackground(backgroundSrc);
    const svgElement = await loadBackgroundSvgElement(backgroundSrc);
    backgroundAnimation.replaceChildren(svgElement);
    scheduleBackgroundDrawCompletion(svgElement);
  } catch {
    // Ignore storage failures; the default background remains usable.
  }
}

function initInfoToggle() {
  const infoRows = Array.from(infoDetails?.querySelectorAll(".project-index-info-row") || []);
  let infoClosingTimer;
  let infoTransitionId = 0;
  infoRows.forEach((row) => {
    const holdDetailsOpen = () => row.classList.add("has-user-previewed");
    row.addEventListener("pointerenter", holdDetailsOpen);
    row.addEventListener("focusin", holdDetailsOpen);
  });

  setInfoOpen = (shouldOpen, immediate = false) => {
    if (!infoToggle || !infoDetails) {
      return;
    }

    const transitionId = ++infoTransitionId;
    infoToggle.setAttribute("aria-expanded", `${shouldOpen}`);
    window.clearTimeout(infoClosingTimer);
    if (shouldOpen) {
      infoDetails.hidden = false;
      infoRows.forEach((row) => row.classList.remove("has-user-previewed"));
      infoDetails.classList.remove("is-open", "is-closing");
      void infoDetails.offsetWidth;
      infoDetails.classList.add("is-open");
      personalPhotoFrame?.classList.add("is-visible");
      projectIndex?.classList.remove("is-info-closing");
      projectIndex?.classList.add("is-info-open");
      return;
    }

    if (immediate) {
      infoDetails.hidden = true;
      infoDetails.classList.remove("is-open", "is-closing");
      personalPhotoFrame?.classList.remove("is-visible");
      projectIndex?.classList.remove("is-info-open", "is-info-closing");
      return;
    }

    infoDetails.classList.remove("is-open");
    void infoDetails.offsetWidth;
    infoDetails.classList.add("is-closing");
    projectIndex?.classList.remove("is-info-open");
    projectIndex?.classList.add("is-info-closing");
    const closingDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : NESTED_DRAWER_CLOSING_DURATION;
    infoClosingTimer = window.setTimeout(() => {
      if (transitionId !== infoTransitionId) return;
      infoDetails.hidden = true;
      infoDetails.classList.remove("is-closing");
      personalPhotoFrame?.classList.remove("is-visible");
      projectIndex?.classList.remove("is-info-closing");
    }, closingDuration);
  };

  infoToggle?.addEventListener("click", () => {
    setInfoOpen(infoToggle.getAttribute("aria-expanded") !== "true");
  });
}

function initProjectsToggle() {
  if (!projectIndex || !projectsToggle || !projectsPanel) {
    return;
  }

  let closingTimer;
  let introTimer;
  let projectsTransitionId = 0;

  setProjectsOpen = (shouldOpen, immediate = false) => {
    const transitionId = ++projectsTransitionId;
    projectsToggle.setAttribute("aria-expanded", `${shouldOpen}`);
    window.clearTimeout(closingTimer);
    window.clearTimeout(introTimer);

    if (shouldOpen) {
      projectsPanel.hidden = false;
      projectIndex.querySelectorAll(".project-index-link").forEach((link) => {
        link.classList.remove("has-user-previewed", "skip-language-reveal");
      });
      projectIndex.classList.remove("is-projects-open", "is-projects-closing");
      // Establish the collapsed layout after unhiding before starting the transition.
      void projectsPanel.offsetWidth;
      projectIndex.classList.add("is-projects-open");
      projectIndex.classList.add("is-projects-intro-active");
      introTimer = window.setTimeout(() => {
        projectIndex.classList.remove("is-projects-intro-active");
      }, 6200 * INDEX_OPENING_SPEED);
      return;
    }

    if (immediate) {
      projectsPanel.hidden = true;
      projectIndex.classList.remove(
        "is-projects-open",
        "is-projects-closing",
        "is-projects-intro-active",
      );
      return;
    }

    projectIndex.classList.remove("is-projects-intro-active");
    projectIndex.classList.remove("is-projects-open");
    void projectsPanel.offsetWidth;
    projectIndex.classList.add("is-projects-closing");
    const closingDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : PROJECTS_CLOSING_DURATION;
    closingTimer = window.setTimeout(() => {
      if (transitionId !== projectsTransitionId) return;
      projectsPanel.hidden = true;
      projectIndex.classList.remove("is-projects-closing");
    }, closingDuration);
  };

  projectsToggle.addEventListener("click", () => {
    setProjectsOpen(projectsToggle.getAttribute("aria-expanded") !== "true");
  });
}

function initCvToggle() {
  let cvClosingTimer;
  let cvTransitionId = 0;

  setCvOpen = (shouldOpen, immediate = false) => {
    if (!cvToggle || !cvDetails) {
      return;
    }
    const transitionId = ++cvTransitionId;
    cvToggle.setAttribute("aria-expanded", `${shouldOpen}`);
    window.clearTimeout(cvClosingTimer);

    if (shouldOpen) {
      cvDetails.hidden = false;
      cvDetails.classList.remove("is-open", "is-closing");
      // Commit the collapsed layout after unhiding, as the INFO drawer does.
      void cvDetails.offsetWidth;
      cvDetails.classList.add("is-open");
      projectIndex?.classList.remove("is-cv-closing");
      projectIndex?.classList.add("is-cv-open");
      return;
    }

    if (immediate) {
      cvDetails.hidden = true;
      cvDetails.classList.remove("is-open", "is-closing");
      projectIndex?.classList.remove("is-cv-open", "is-cv-closing");
      return;
    }
    cvDetails.classList.remove("is-open");
    void cvDetails.offsetWidth;
    cvDetails.classList.add("is-closing");
    projectIndex?.classList.remove("is-cv-open");
    projectIndex?.classList.add("is-cv-closing");
    const closingDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : NESTED_DRAWER_CLOSING_DURATION;
    cvClosingTimer = window.setTimeout(() => {
      if (transitionId !== cvTransitionId) return;
      cvDetails.hidden = true;
      cvDetails.classList.remove("is-closing");
      projectIndex?.classList.remove("is-cv-closing");
    }, closingDuration);
  };

  cvToggle?.addEventListener("click", () => {
    setCvOpen(cvToggle.getAttribute("aria-expanded") !== "true");
  });
}


function createLocalizedText(value) {
  return getLocalizedText(value, activeLanguage);
}

function getProjectIndexMedia(project) {
  const media = project.index?.image || project.projectPage?.hero?.media;
  if (media?.src) {
    return media;
  }
  const sceneMedia = (project.scenes || [])
    .flatMap((scene) => scene.objects || [])
    .find((item) => item.src);
  if (!sceneMedia) {
    return null;
  }
  const title = createLocalizedText(project.index?.title) || project.title;
  return {
    src: sceneMedia.src,
    srcset: sceneMedia.srcset || "",
    alt: { en: `${title} project preview`, cs: `Náhled projektu ${title}` },
  };
}

function getIndexContentScale() {
  return parseFloat(getComputedStyle(document.body).getPropertyValue("--index-content-scale")) || 1;
}

function updateProjectPreviewPlacements() {
  const contentScale = getIndexContentScale();
  const links = Array.from(document.querySelectorAll(".project-index-link:has(.project-index-link-preview)"));
  const inline = window.matchMedia("(width < 700px)").matches || window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const textRects = links.map((link) => Array.from(link.children)
    .filter((child) => !child.classList.contains("project-index-link-preview"))
    .map((part) => layoutRect(part)));
  // Reserve the entire text column so a tall preview cannot cover another row.
  const columnRight = Math.max(0, ...textRects.flat().map((rect) => rect.right));
  links.forEach((link, index) => {
    const rects = textRects[index];
    const rowCenterY = (Math.min(...rects.map((rect) => rect.top)) + Math.max(...rects.map((rect) => rect.bottom))) / 2;
    const left = columnRight + 30 * contentScale;
    const viewportHeight = window.innerHeight / SITE_SCALE;
    const topInset = 75 * contentScale;
    const bottomInset = 24 * contentScale;
    // Fit to the viewport, then shift at its edges instead of shrinking by row position.
    const heightLimit = Math.max(0, Math.min(520 * contentScale, viewportHeight - topInset - bottomInset));
    const widthLimit = Math.max(0, Math.min(720 * contentScale, (window.innerWidth / SITE_SCALE) * 0.48, (window.innerWidth / SITE_SCALE) - left - 24 * contentScale));
    const image = link.querySelector(".project-index-link-preview img");
    const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 1;
    const width = Math.min(widthLimit, heightLimit * ratio);
    const height = width / ratio;
    const centerY = Math.max(topInset + height / 2, Math.min(rowCenterY, viewportHeight - bottomInset - height / 2));
    const linkRect = layoutRect(link);
    link.style.setProperty("--project-preview-left", `${(left - linkRect.left) / contentScale}px`);
    link.style.setProperty("--project-preview-center", `${(centerY - linkRect.top) / contentScale}px`);
    link.style.setProperty("--project-preview-width", `${width / contentScale}px`);
    link.style.setProperty("--project-preview-height", `${height / contentScale}px`);
    link.classList.toggle("has-side-preview", !inline && width > 0);
  });
}

function createProjectIndexItem(project, order) {
  const link = document.createElement("a");
  const projectSlug = project.slug || project.selectorLabel || project.title;
  link.className = "project-index-link";
  link.style.setProperty("--project-order", `${order}`);
  link.href = project.projectPage?.layout === "concise"
    ? `./project.html?project=${encodeURIComponent(projectSlug)}&lang=${activeLanguage}`
    : `./year.html?year=${encodeURIComponent(project.year)}&project=${encodeURIComponent(projectSlug)}&lang=${activeLanguage}`;
  link.addEventListener("pointerenter", () => {
    if (projectIndex?.classList.contains("is-projects-intro-active")) {
      link.classList.add("has-user-previewed");
    }
    updateProjectPreviewPlacements();
  });
  link.addEventListener("focus", () => {
    if (projectIndex?.classList.contains("is-projects-intro-active")) {
      link.classList.add("has-user-previewed");
    }
    updateProjectPreviewPlacements();
  });

  const scale = document.createElement("span");
  scale.className = "project-index-detail project-index-scale";
  scale.textContent = `[ ${createLocalizedText(project.index?.scale)} ]`;

  const title = document.createElement("span");
  title.className = "project-index-title";
  const mobileTitle = window.matchMedia("(max-width: 720px)").matches
    ? createLocalizedText(project.mobileTitle)
    : "";
  title.textContent = mobileTitle
    || createLocalizedText(project.index?.title)
    || project.selectorLabel
    || project.title;

  const context = document.createElement("span");
  context.className = "project-index-detail project-index-context";
  context.textContent = createLocalizedText(project.index?.context);

  const metadata = document.createElement("span");
  metadata.className = "project-index-metadata";
  metadata.append(context);
  link.append(title, scale, metadata);
  link.setAttribute(
    "aria-label",
    `${title.textContent} ${scale.textContent} ${context.textContent}`.trim(),
  );

  (project.index?.highlights || []).forEach((highlight) => {
    const badge = document.createElement("span");
    badge.className = `project-index-highlight project-index-highlight--${highlight.type || "note"}`;
    badge.textContent = createLocalizedText(highlight.label || highlight);
    metadata.append(badge);
  });

  const media = getProjectIndexMedia(project);
  if (media?.src) {
    const preview = document.createElement("figure");
    preview.className = "project-index-link-preview";
    preview.setAttribute("aria-hidden", "true");
    const previewImage = document.createElement("img");
    previewImage.src = media.src;
    previewImage.srcset = media.srcset || "";
    previewImage.sizes = "(max-width: 760px) 90vw, min(70vw, 46rem)";
    previewImage.alt = "";
    previewImage.loading = "lazy";
    previewImage.addEventListener("load", updateProjectPreviewPlacements);
    preview.append(previewImage);
    link.append(preview);
  }

  return link;
}

function renderProjectIndex(projects) {
  Object.values(projectGroups).forEach((group) => group?.replaceChildren());
  const fragment = document.createDocumentFragment();
  let projectOrder = 0;

  Object.entries(projectGroups).forEach(([section, container]) => {
    if (!container) {
      return;
    }

    const sectionProjects = projects
      .filter((project) => (
        project.visibility !== "unpublished"
        && project.portfolioSection === section
      ))
      .sort((left, right) => (left.index?.order ?? 999) - (right.index?.order ?? 999));

    sectionProjects.forEach((project) => {
      const projectLink = createProjectIndexItem(project, projectOrder);
      if (projectIndex?.classList.contains("is-projects-open")) {
        projectLink.classList.add("skip-language-reveal", "has-user-previewed");
      }
      fragment.append(projectLink);
      projectOrder += 1;
    });
    container.append(fragment);
  });

  const projectLinks = Array.from(document.querySelectorAll(".project-index-link"));
  projectLinks.forEach((link, order) => {
    link.style.setProperty("--project-reverse-order", `${projectLinks.length - order - 1}`);
  });
  window.requestAnimationFrame(updateProjectPreviewPlacements);
  document.fonts?.ready.then(updateProjectPreviewPlacements);
}

// Cut only the connector lines; labels stay transparent over the terrain.
function initConnectorGaps() {
  const header = document.querySelector(".index-layout-header");
  const title = header?.querySelector("h1");
  const labels = Array.from(document.querySelectorAll(".project-index-group h2, .cv-section > h3"));
  function update() {
    const contentScale = getIndexContentScale();
    const pixelRatio = window.devicePixelRatio || 1;
    // Align every connector edge to the same device pixel grid after content zoom.
    [header, projectIndex, projectsToggle, infoToggle, cvToggle].filter(Boolean).forEach((element) => {
      const rect = layoutRect(element);
      const control = element.matches("button");
      const x = rect.left + (control ? 15 * contentScale : 0);
      const y = rect.top + 15 * contentScale;
      element.style.setProperty("--connector-x-adjust", `${(Math.round(x * pixelRatio) / pixelRatio - x) / contentScale}px`);
      element.style.setProperty("--connector-y-adjust", `${(Math.round(y * pixelRatio) / pixelRatio - y) / contentScale}px`);
    });
    updateSharedHeaderGeometry();
    if (!projectIndex) return;
    const spineTop = layoutRect(projectIndex).top + 30 * contentScale;
    const gaps = labels.flatMap((label) => {
      const panel = label.closest(".project-index-projects-panel, .project-index-cv-content");
      if (!panel || panel.hidden) return [];
      const rect = layoutRect(label);
      const clip = layoutRect(panel);
      const start = (Math.max(rect.top - 3 * contentScale, clip.top, spineTop) - spineTop) / contentScale;
      const end = (Math.min(rect.bottom + 3 * contentScale, clip.bottom) - spineTop) / contentScale;
      return end > start ? [[start, end, label.id === "cvExperienceTitle"]] : [];
    }).sort((a, b) => a[0] - b[0]);
    const stops = ["#000 0px"];
    let end = 0;
    let spineEnded = false;
    for (const gap of gaps) {
      const start = Math.max(end, gap[0]);
      if (gap[1] <= start) continue;
      if (gap[2]) {
        stops.push(`#000 ${start}px`, `transparent ${start}px`, "transparent 100%");
        spineEnded = true;
        break;
      }
      stops.push(`#000 ${start}px`, `transparent ${start}px`, `transparent ${gap[1]}px`, `#000 ${gap[1]}px`);
      end = gap[1];
    }
    if (!spineEnded) stops.push("#000 100%");
    projectIndex.style.setProperty("--subsection-connector-mask", `linear-gradient(to bottom, ${stops.join(", ")})`);
  }
  const observer = new ResizeObserver(update);
  [header, title, projectIndex, projectsPanel, cvDetails, ...labels].filter(Boolean).forEach((element) => observer.observe(element));
  window.addEventListener("resize", update);
  document.fonts?.ready.then(update);
  update();
}

function initMobileCredits() {
  const source = document.getElementById("headerHelpText");
  if (!source) return;
  const text = source.textContent.match(/\[[^\]]*\]/)?.[0];
  if (!text) return;
  const footer = document.createElement("footer");
  footer.className = "index-mobile-credits";
  const copy = document.createElement("span");
  copy.textContent = text;
  const credits = source.querySelector('p[data-en] + p[data-en]');
  if (credits) {
    copy.dataset.en = credits.dataset.en;
    copy.dataset.cs = credits.dataset.cs;
  }
  footer.append(copy);
  document.body.append(footer);
  const fitCredits = () => {
    if (!footer.clientWidth) return;
    copy.style.fontSize = "13px";
    const available = footer.clientWidth - 16;
    const natural = layoutRect(copy).width;
    copy.style.fontSize = `${Math.min(13, 13 * available / Math.max(1, natural))}px`;
  };
  const creditsObserver = new ResizeObserver(fitCredits);
  creditsObserver.observe(footer);
  creditsObserver.observe(copy);
  document.fonts.ready.then(fitCredits);
  fitCredits();
}

function initIndexScrollTop() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "concise-project-symbol concise-project-scroll-top index-scroll-top";
  button.setAttribute("aria-label", "Posunout nahoru");
  const triangles = document.createElement("span");
  triangles.className = "concise-project-scroll-top-triangles";
  triangles.setAttribute("aria-hidden", "true");
  triangles.append(document.createElement("i"), document.createElement("i"));
  button.append(triangles);
  document.body.append(button);
  button.addEventListener("click", () => window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  }));
  const heading = document.getElementById("projectsToggle");
  const update = () => button.classList.toggle("is-visible",
    layoutRect(heading).bottom <= Math.max(14, (window.innerWidth / SITE_SCALE) * 0.025));
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

async function init() {
  initConnectorGaps();
  renderRandomIndexBackground();
  initIndexHeader();
  initMobileCredits();
  initIndexScrollTop();
  initProjectsToggle();
  initInfoToggle();
  initCvToggle();
  window.addEventListener("resize", updateProjectPreviewPlacements);
  window.addEventListener("scroll", updateProjectPreviewPlacements, { passive: true });

  const response = await fetch(`./data/projects.json?v=${DATA_CACHE_VERSION}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load projects.");
  }

  indexProjects = applyCuratedProjectMedia(await response.json());
  renderProjectIndex(indexProjects);
  if (new URLSearchParams(window.location.search).get("projects") === "open") {
    setProjectsOpen(true);
  }
  yearLabel.textContent = new Date().getFullYear();
}

initLanguageSwitch((language) => {
  activeLanguage = language;
  updateHeaderLanguageToggle(language);
  if (indexProjects.length > 0) {
    renderProjectIndex(indexProjects);
  }
});

init().catch(() => {
  Object.values(projectGroups).forEach((group) => {
    if (group) {
      group.textContent = "Could not load projects.";
    }
  });
});
