import {
  getLanguage,
  getLocalizedText,
  initLanguageSwitch,
} from "./language.js";

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
const cvLine = document.querySelector(".project-index-cv .cv-line");
const personalPhotoFrame = document.querySelector(".personal-photo-frame");
const backgroundAnimation = document.querySelector(".background-animation");
const indexNameAnimation = document.getElementById("indexNameAnimation");
const signatureNameplate = indexNameAnimation?.closest(".signature-nameplate");
const SIGNATURE_COMPLETE_STORAGE_KEY = "zuz-signature-animation-complete-v2";
const DATA_CACHE_VERSION = "2026-07-30-bilingual-project-copy";
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
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
let cvRopeAnimationFrame;
let cvRopeIsIntroAnimating = false;
let cvRopeLiveReactionStartedAt = 0;
let activeLanguage = getLanguage();
let indexProjects = [];

function renderCvRope(elapsed = Number.POSITIVE_INFINITY, reactiveWobble = 0) {
  if (!cvLine || !cvDetails || cvDetails.hidden) {
    return;
  }

  let rope = cvLine.querySelector(".cv-rope");
  if (!rope) {
    rope = document.createElementNS(SVG_NAMESPACE, "svg");
    rope.classList.add("cv-rope");
    rope.setAttribute("aria-hidden", "true");
    cvLine.prepend(rope);
  }

  const markers = Array.from(cvLine.querySelectorAll(".cv-marker"));
  const lineBounds = cvLine.getBoundingClientRect();
  rope.setAttribute("viewBox", `0 0 ${lineBounds.width} ${lineBounds.height}`);
  rope.replaceChildren();

  markers.slice(0, -1).forEach((marker, index) => {
    const nextMarker = markers[index + 1];
    const markerBounds = marker.getBoundingClientRect();
    const nextBounds = nextMarker.getBoundingClientRect();
    const startX = markerBounds.left + (markerBounds.width / 2) - lineBounds.left;
    const startY = markerBounds.top + (markerBounds.height / 2) - lineBounds.top;
    const endX = nextBounds.left + (nextBounds.width / 2) - lineBounds.left;
    const endY = nextBounds.top + (nextBounds.height / 2) - lineBounds.top;
    const segmentStart = 1990 + (index * 140);
    const progress = Math.min(1, Math.max(0, (elapsed - segmentStart) / 1150));
    const easedProgress = 1 - ((1 - progress) ** 3);
    const segmentLength = Math.max(0, endY - startY);
    const finalSag = Math.min(20, Math.max(8, segmentLength * 0.12));
    const wobble = progress < 1
      ? Math.sin(progress * Math.PI * 5) * 22 * (1 - easedProgress)
      : 0;
    const reactionDirection = index % 2 === 0 ? 1 : -0.7;
    const curveOffset = finalSag + wobble + (reactiveWobble * reactionDirection);
    const controlYOne = startY + ((endY - startY) * 0.34);
    const controlYTwo = startY + ((endY - startY) * 0.68);
    const path = document.createElementNS(SVG_NAMESPACE, "path");

    path.setAttribute(
      "d",
      `M ${startX} ${startY} C ${startX + curveOffset} ${controlYOne}, ${endX + curveOffset} ${controlYTwo}, ${endX} ${endY}`,
    );
    path.setAttribute("pathLength", "1");
    path.style.setProperty("--rope-reverse-order", `${markers.length - index - 2}`);
    path.style.strokeDasharray = "1";
    path.style.strokeDashoffset = `${1 - easedProgress}`;
    rope.append(path);
  });
}

function startCvRopeAnimation() {
  window.cancelAnimationFrame(cvRopeAnimationFrame);
  cvRopeLiveReactionStartedAt = 0;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cvRopeIsIntroAnimating = false;
    cvRopeAnimationFrame = window.requestAnimationFrame(() => renderCvRope());
    return;
  }

  cvRopeIsIntroAnimating = true;
  const startedAt = performance.now();

  const drawFrame = (timestamp) => {
    const elapsed = timestamp - startedAt;
    const liveReactionProgress = Math.min(1, Math.max(0, (timestamp - cvRopeLiveReactionStartedAt) / 720));
    const liveReaction = cvRopeLiveReactionStartedAt > 0 && liveReactionProgress < 1
      ? Math.sin(liveReactionProgress * Math.PI * 4) * 9 * ((1 - liveReactionProgress) ** 2)
      : 0;
    renderCvRope(elapsed, liveReaction);
    if (elapsed < 5800 && cvDetails && !cvDetails.hidden) {
      cvRopeAnimationFrame = window.requestAnimationFrame(drawFrame);
    } else {
      cvRopeIsIntroAnimating = false;
      renderCvRope();
    }
  };

  cvRopeAnimationFrame = window.requestAnimationFrame(drawFrame);
}

function reactCvRopeToRowChange() {
  if (!cvDetails || cvDetails.hidden) {
    return;
  }

  if (cvRopeIsIntroAnimating) {
    cvRopeLiveReactionStartedAt = performance.now();
    return;
  }

  window.cancelAnimationFrame(cvRopeAnimationFrame);
  const startedAt = performance.now();
  const reactionDuration = 720;

  const drawReaction = (timestamp) => {
    const progress = Math.min(1, (timestamp - startedAt) / reactionDuration);
    const reactiveWobble = Math.sin(progress * Math.PI * 4) * 9 * ((1 - progress) ** 2);
    renderCvRope(Number.POSITIVE_INFINITY, reactiveWobble);
    if (progress < 1 && cvDetails && !cvDetails.hidden) {
      cvRopeAnimationFrame = window.requestAnimationFrame(drawReaction);
    } else {
      renderCvRope();
    }
  };

  cvRopeAnimationFrame = window.requestAnimationFrame(drawReaction);
}

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

  const setInfoOpen = (shouldOpen) => {
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

  const setProjectsOpen = (shouldOpen) => {
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
      }, 6200);
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
  const cvItems = Array.from(cvLine?.querySelectorAll(".cv-item") || []);
  let cvClosingTimer;
  cvItems.forEach((item) => {
    const holdDetailsOpen = () => {
      item.classList.add("has-user-previewed");
      reactCvRopeToRowChange();
    };
    item.addEventListener("pointerenter", holdDetailsOpen);
    item.addEventListener("pointerleave", reactCvRopeToRowChange);
    item.addEventListener("focus", holdDetailsOpen);
    item.addEventListener("blur", reactCvRopeToRowChange);
  });

  cvToggle?.addEventListener("click", () => {
    const shouldOpen = cvToggle.getAttribute("aria-expanded") !== "true";
    cvToggle.setAttribute("aria-expanded", `${shouldOpen}`);
    window.clearTimeout(cvClosingTimer);

    if (shouldOpen) {
      cvItems.forEach((item) => item.classList.remove("has-user-previewed"));
      if (cvDetails) {
        cvDetails.hidden = false;
        cvDetails.classList.remove("is-closing");
        cvDetails.classList.add("is-open");
      }
      projectIndex?.classList.remove("is-cv-closing");
      projectIndex?.classList.add("is-cv-open");
      startCvRopeAnimation();
    } else {
      window.cancelAnimationFrame(cvRopeAnimationFrame);
      cvRopeIsIntroAnimating = false;
      cvRopeLiveReactionStartedAt = 0;
      cvDetails?.classList.remove("is-open");
      cvDetails?.classList.add("is-closing");
      projectIndex?.classList.remove("is-cv-open");
      projectIndex?.classList.add("is-cv-closing");
      const closingDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 4000;
      cvClosingTimer = window.setTimeout(() => {
        if (cvDetails) {
          cvDetails.hidden = true;
          cvDetails.classList.remove("is-closing");
        }
        projectIndex?.classList.remove("is-cv-closing");
        cvLine?.querySelector(".cv-rope")?.remove();
      }, closingDuration);
    }
  });

  window.addEventListener("resize", () => {
    if (cvDetails && !cvDetails.hidden) {
      renderCvRope();
    }
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

  let hasCompleted = false;
  try {
    hasCompleted = window.sessionStorage.getItem(SIGNATURE_COMPLETE_STORAGE_KEY) === "1";
  } catch {
    hasCompleted = false;
  }
  if (hasCompleted || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showFinalPoster();
    return;
  }

  indexNameAnimation.currentTime = 0;
  indexNameAnimation.addEventListener("ended", showFinalPoster, { once: true });
  void indexNameAnimation.play().catch(() => {
    showFinalPoster();
  });
}

function createLocalizedText(value, locale = activeLanguage) {
  return getLocalizedText(value, locale);
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
    badge.textContent = createLocalizedText(highlight.label);
    link.append(badge);
  });

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
}

async function init() {
  void renderRandomIndexBackground();
  initIndexNameAnimation();
  initProjectsToggle();
  initInfoToggle();
  initCvToggle();

  const response = await fetch(`./data/projects.json?v=${DATA_CACHE_VERSION}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load projects.");
  }

  indexProjects = await response.json();
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
