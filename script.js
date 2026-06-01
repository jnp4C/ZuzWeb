const yearPicker = document.getElementById("yearPicker");
const yearLabel = document.getElementById("year");
const personalToggle = document.getElementById("personalToggle");
const personalDetails = document.getElementById("personalDetails");
const personalPhotoFrame = document.querySelector(".personal-photo-frame");
const backgroundAnimation = document.querySelector(".background-animation");
const DATA_CACHE_VERSION = "2026-05-23-abstract-scenes";
const BACKGROUND_CACHE_VERSION = "2026-05-31-project-backgrounds";
const BACKGROUND_STORAGE_KEY = "zuz-active-background-src";
const DEFAULT_BACKGROUND_SRC = "./assets/Background/contours.svg";
const AVAILABLE_BACKGROUND_SRCS = new Set([
  DEFAULT_BACKGROUND_SRC,
  "./assets/Background/contours-semnevice.svg",
  "./assets/Background/contours-Praha-stresovice.svg",
  "./assets/Background/contours-kladno.svg",
  "./assets/Background/contours-growing.svg",
  "./assets/Background/contours-abstract.svg",
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
  const polylines = Array.from(svgElement.querySelectorAll("polyline"));
  polylines.forEach((polyline, index) => {
    polyline.setAttribute("pathLength", "1");
    if (!polyline.style.getPropertyValue("--contour-delay")) {
      polyline.style.setProperty("--contour-delay", `${Math.min(index * 0.035, 2.4)}s`);
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

function renderYearButtons(projects) {
  const years = [...new Set(projects.map((project) => project.year))].sort((left, right) => right - left);
  const fragment = document.createDocumentFragment();

  years.forEach((year) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "year-button";
    button.textContent = `${year}`;
    button.addEventListener("click", () => {
      window.location.href = `./year.html?year=${encodeURIComponent(year)}`;
    });
    fragment.append(button);
  });

  yearPicker.replaceChildren(fragment);
}

async function init() {
  void renderRandomIndexBackground();
  initPersonalToggle();

  const response = await fetch(`./data/projects.json?v=${DATA_CACHE_VERSION}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load projects.");
  }

  const projects = await response.json();
  renderYearButtons(projects);
  yearLabel.textContent = new Date().getFullYear();
}

init().catch(() => {
  yearPicker.textContent = "Could not load project years.";
});
