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
const personalPhotoFrame = document.querySelector(".personal-photo-frame");
const backgroundAnimation = document.querySelector(".background-animation");
const indexNameAnimation = document.getElementById("indexNameAnimation");
const DATA_CACHE_VERSION = "2026-07-28-redesign-spine-label-position";
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

function initInfoToggle() {
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

  const setInfoOpen = (shouldOpen) => {
    if (!infoToggle || !infoDetails) {
      return;
    }

    infoToggle.setAttribute("aria-expanded", `${shouldOpen}`);
    infoDetails.hidden = !shouldOpen;
    projectIndex?.classList.toggle("is-info-open", shouldOpen);
    if (shouldOpen) {
      infoDetails.classList.remove("is-open");
      void infoDetails.offsetWidth;
      infoDetails.classList.add("is-open");
      if (personalPhotoFrame && photoObserver && !hasSeenPersonalPhoto) {
        photoObserver.observe(personalPhotoFrame);
      }
    } else {
      infoDetails.classList.remove("is-open");
      if (personalPhotoFrame && photoObserver && !hasSeenPersonalPhoto) {
        photoObserver.unobserve(personalPhotoFrame);
      }
    }
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
        link.classList.remove("has-user-previewed");
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
  cvToggle?.addEventListener("click", () => {
    const shouldOpen = cvToggle.getAttribute("aria-expanded") !== "true";
    cvToggle.setAttribute("aria-expanded", `${shouldOpen}`);
    projectIndex?.classList.toggle("is-cv-open", shouldOpen);
  });
}

function initIndexNameAnimation() {
  if (!indexNameAnimation) {
    return;
  }

  const holdFinalFrame = () => {
    if (Number.isFinite(indexNameAnimation.duration)) {
      indexNameAnimation.currentTime = Math.max(0, indexNameAnimation.duration - 0.04);
    }
    indexNameAnimation.pause();
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (indexNameAnimation.readyState >= HTMLMediaElement.HAVE_METADATA) {
      holdFinalFrame();
    } else {
      indexNameAnimation.addEventListener("loadedmetadata", holdFinalFrame, { once: true });
    }
    return;
  }

  indexNameAnimation.currentTime = 0;
  indexNameAnimation.addEventListener("ended", () => indexNameAnimation.pause(), { once: true });
  void indexNameAnimation.play().catch(() => {
    // Muted inline autoplay is broadly supported; retain the first frame if blocked.
  });
}

function createLocalizedText(value, locale = "en") {
  if (typeof value === "string") {
    return value;
  }
  return value?.[locale] || value?.en || "";
}

function createProjectIndexItem(project, order) {
  const link = document.createElement("a");
  const projectSlug = project.slug || project.selectorLabel || project.title;
  link.className = "project-index-link";
  link.style.setProperty("--project-order", `${order}`);
  link.href = `./year.html?year=${encodeURIComponent(project.year)}&project=${encodeURIComponent(projectSlug)}`;
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
      fragment.append(createProjectIndexItem(project, projectOrder));
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
