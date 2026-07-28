const projectGroups = {
  study: document.getElementById("studyProjects"),
  practice: document.getElementById("practiceProjects"),
};
const yearLabel = document.getElementById("year");
const personalToggle = document.getElementById("personalToggle");
const personalDetails = document.getElementById("personalDetails");
const personalPhotoFrame = document.querySelector(".personal-photo-frame");
const backgroundAnimation = document.querySelector(".background-animation");
const DATA_CACHE_VERSION = "2026-07-28-redesign-tree-interaction";
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

function initPersonalToggle() {
  let hasSeenPersonalPhoto = false;
  const photoObserver = personalPhotoFrame && "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      if (hasSeenPersonalPhoto) {
        return;
      }
      const entry = entries[0];
      if (entry?.isIntersecting) {
        hasSeenPersonalPhoto = true;
        personalPhotoFrame.classList.add("is-visible");
        photoObserver.disconnect();
      }
    }, { threshold: 0.35 })
    : null;

  if (personalPhotoFrame && !photoObserver) {
    personalPhotoFrame.classList.add("is-visible");
  }

  personalToggle?.addEventListener("click", () => {
    const isOpen = personalToggle.getAttribute("aria-expanded") === "true";
    const shouldOpen = !isOpen;
    personalToggle.setAttribute("aria-expanded", `${shouldOpen}`);
    personalDetails.hidden = !shouldOpen;
    if (shouldOpen) {
      personalDetails.classList.remove("is-open");
      void personalDetails.offsetWidth;
      personalDetails.classList.add("is-open");
      if (personalPhotoFrame && photoObserver && !hasSeenPersonalPhoto) {
        photoObserver.observe(personalPhotoFrame);
      }
    } else {
      personalDetails.classList.remove("is-open");
      if (personalPhotoFrame && photoObserver && !hasSeenPersonalPhoto) {
        photoObserver.unobserve(personalPhotoFrame);
      }
    }
  });
}

function createLocalizedText(value, locale = "en") {
  if (typeof value === "string") {
    return value;
  }
  return value?.[locale] || value?.en || "";
}

function createProjectIndexItem(project) {
  const link = document.createElement("a");
  const projectSlug = project.slug || project.selectorLabel || project.title;
  link.className = "project-index-link";
  link.href = `./year.html?year=${encodeURIComponent(project.year)}&project=${encodeURIComponent(projectSlug)}`;

  const scale = document.createElement("span");
  scale.className = "project-index-detail project-index-scale";
  scale.textContent = `[ ${createLocalizedText(project.index?.scale)} ]`;

  const title = document.createElement("span");
  title.className = "project-index-title";
  title.textContent = createLocalizedText(project.index?.title) || project.selectorLabel || project.title;

  const context = document.createElement("span");
  context.className = "project-index-detail project-index-context";
  context.textContent = `< ${createLocalizedText(project.index?.context)} >`;

  link.append(scale, title, context);
  link.setAttribute(
    "aria-label",
    `${scale.textContent} ${title.textContent} ${context.textContent}`.trim(),
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
      fragment.append(createProjectIndexItem(project));
    });
    container.append(fragment);
  });
}

async function init() {
  void renderRandomIndexBackground();
  initPersonalToggle();

  const response = await fetch(`./data/projects.json?v=${DATA_CACHE_VERSION}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load projects.");
  }

  const projects = await response.json();
  renderProjectIndex(projects);
  yearLabel.textContent = new Date().getFullYear();
}

init().catch(() => {
  Object.values(projectGroups).forEach((group) => {
    if (group) {
      group.textContent = "Could not load projects.";
    }
  });
});
