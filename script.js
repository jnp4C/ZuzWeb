import {
  getLanguage,
  getLocalizedText,
  initLanguageSwitch,
} from "./language.js";
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
const indexNameAnimation = document.getElementById("indexNameAnimation");
const signatureNameplate = indexNameAnimation?.closest(".signature-nameplate");
const SIGNATURE_COMPLETE_STORAGE_KEY = "zuz-signature-animation-complete-v2";
const INDEX_OPENING_SPEED = 0.6;
const DATA_CACHE_VERSION = "2026-08-14-real-project-content-downloads";
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
  infoRows.forEach((row) => {
    const holdDetailsOpen = () => row.classList.add("has-user-previewed");
    row.addEventListener("pointerenter", holdDetailsOpen);
    row.addEventListener("focusin", holdDetailsOpen);
  });

  setInfoOpen = (shouldOpen, immediate = false) => {
    if (!infoToggle || !infoDetails) {
      return;
    }

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
    infoDetails.classList.add("is-closing");
    projectIndex?.classList.remove("is-info-open");
    projectIndex?.classList.add("is-info-closing");
    const closingDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 3700;
    infoClosingTimer = window.setTimeout(() => {
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

  setProjectsOpen = (shouldOpen, immediate = false) => {
    projectsToggle.setAttribute("aria-expanded", `${shouldOpen}`);
    window.clearTimeout(closingTimer);
    window.clearTimeout(introTimer);

    if (shouldOpen) {
      projectsPanel.hidden = false;
      projectIndex.querySelectorAll(".project-index-link").forEach((link) => {
        link.classList.remove("has-user-previewed", "skip-language-reveal");
      });
      projectIndex.classList.remove("is-projects-closing");
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
    projectIndex.classList.add("is-projects-closing");
    const closingDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 3300;
    closingTimer = window.setTimeout(() => {
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

  setCvOpen = (shouldOpen, immediate = false) => {
    if (!cvToggle || !cvDetails) {
      return;
    }
    cvToggle.setAttribute("aria-expanded", `${shouldOpen}`);
    window.clearTimeout(cvClosingTimer);

    if (shouldOpen) {
      cvDetails.hidden = false;
      cvDetails.classList.remove("is-closing");
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
    cvDetails.classList.add("is-closing");
    projectIndex?.classList.remove("is-cv-open");
    projectIndex?.classList.add("is-cv-closing");
    const closingDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 4000;
    cvClosingTimer = window.setTimeout(() => {
      cvDetails.hidden = true;
      cvDetails.classList.remove("is-closing");
      projectIndex?.classList.remove("is-cv-closing");
    }, closingDuration);
  };

  cvToggle?.addEventListener("click", () => {
    setCvOpen(cvToggle.getAttribute("aria-expanded") !== "true");
  });
}

function initIndexNameAnimation() {
  if (!indexNameAnimation) {
    return;
  }

  const showFinalPoster = () => {
    indexNameAnimation.pause();
    signatureNameplate?.classList.add("is-signature-static");
    document.documentElement.classList.add("signature-complete");
    try {
      window.sessionStorage.setItem(SIGNATURE_COMPLETE_STORAGE_KEY, "1");
    } catch {
      // The static transparent image still works when storage is unavailable.
    }
  };

  const isPageReload = window.performance
    ?.getEntriesByType("navigation")
    .some((entry) => entry.type === "reload");
  let hasCompleted = false;
  try {
    hasCompleted = !isPageReload
      && window.sessionStorage.getItem(SIGNATURE_COMPLETE_STORAGE_KEY) === "1";
  } catch {
    hasCompleted = false;
  }
  if (hasCompleted || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showFinalPoster();
    return;
  }

  document.documentElement.classList.remove("signature-complete");
  signatureNameplate?.classList.remove("is-signature-static");
  indexNameAnimation.currentTime = 0;
  indexNameAnimation.addEventListener("ended", showFinalPoster, { once: true });
  void indexNameAnimation.play().catch(() => {
    showFinalPoster();
  });
}

function createLocalizedText(value, locale = activeLanguage) {
  return getLocalizedText(value, locale);
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

function updateProjectPreviewPlacements() {
  document.querySelectorAll(".project-index-link:has(.project-index-link-preview)").forEach((link) => {
    const textParts = Array.from(link.children)
      .filter((child) => !child.classList.contains("project-index-link-preview"));
    const textRight = Math.max(...textParts.map((part) => part.getBoundingClientRect().right));
    const availableRight = window.innerWidth - textRight - 24;
    const linkRect = link.getBoundingClientRect();
    const linkCenterY = linkRect.top + (linkRect.height / 2);
    const availableHalfHeight = Math.max(
      0,
      Math.min(linkCenterY - 24, window.innerHeight - linkCenterY - 24),
    );
    link.style.setProperty("--project-preview-side-width", `${Math.max(0, availableRight)}px`);
    link.style.setProperty("--project-preview-side-height", `${availableHalfHeight * 2}px`);
    link.classList.toggle(
      "has-side-preview",
      window.innerWidth > 720 && availableRight > 0,
    );
  });
}

function createProjectIndexItem(project, order) {
  const link = document.createElement("a");
  const projectSlug = project.slug || project.selectorLabel || project.title;
  link.className = "project-index-link";
  link.style.setProperty("--project-order", `${order}`);
  link.href = project.projectPage?.layout === "concise"
    ? `./project.html?project=${encodeURIComponent(projectSlug)}`
    : `./year.html?year=${encodeURIComponent(project.year)}&project=${encodeURIComponent(projectSlug)}`;
  link.addEventListener("pointerenter", () => {
    updateProjectPreviewPlacements();
    if (projectIndex?.classList.contains("is-projects-intro-active")) {
      link.classList.add("has-user-previewed");
    }
  });
  link.addEventListener("focus", () => {
    if (projectIndex?.classList.contains("is-projects-intro-active")) {
      link.classList.add("has-user-previewed");
    }
  });

  const scale = document.createElement("span");
  scale.className = "project-index-detail project-index-scale";
  scale.textContent = `[ ${createLocalizedText(project.index?.scale)} ]`;

  const title = document.createElement("span");
  title.className = "project-index-title";
  title.textContent = createLocalizedText(project.index?.title) || project.selectorLabel || project.title;

  const context = document.createElement("span");
  context.className = "project-index-detail project-index-context";
  context.textContent = `< ${createLocalizedText(project.index?.context)} >`;

  link.append(title, scale, context);
  link.setAttribute(
    "aria-label",
    `${title.textContent} ${scale.textContent} ${context.textContent}`.trim(),
  );

  (project.index?.highlights || []).forEach((highlight) => {
    const badge = document.createElement("span");
    badge.className = `project-index-detail project-index-highlight project-index-highlight--${highlight.type || "note"}`;
    badge.textContent = createLocalizedText(highlight.label || highlight);
    link.append(badge);
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

async function init() {
  void renderRandomIndexBackground();
  initIndexNameAnimation();
  initProjectsToggle();
  initInfoToggle();
  initCvToggle();
  window.addEventListener("resize", updateProjectPreviewPlacements);

  const response = await fetch(`./data/projects.json?v=${DATA_CACHE_VERSION}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load projects.");
  }

  indexProjects = applyCuratedProjectMedia(await response.json());
  renderProjectIndex(indexProjects);
  yearLabel.textContent = new Date().getFullYear();
}

initLanguageSwitch((language) => {
  activeLanguage = language;
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
