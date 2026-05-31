const yearPicker = document.getElementById("yearPicker");
const yearLabel = document.getElementById("year");
const personalToggle = document.getElementById("personalToggle");
const personalDetails = document.getElementById("personalDetails");
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
  importedSvg.classList.add("background-animation-lines");
  importedSvg.setAttribute("aria-hidden", "true");
  importedSvg.setAttribute("focusable", "false");
  return importedSvg;
}

async function restoreSavedBackground() {
  if (!backgroundAnimation) {
    return;
  }

  try {
    const storedBackgroundSrc = window.sessionStorage.getItem(BACKGROUND_STORAGE_KEY);
    const backgroundSrc = AVAILABLE_BACKGROUND_SRCS.has(storedBackgroundSrc)
      ? storedBackgroundSrc
      : DEFAULT_BACKGROUND_SRC;
    const svgElement = await loadBackgroundSvgElement(backgroundSrc);
    if (AVAILABLE_BACKGROUND_SRCS.has(storedBackgroundSrc)) {
      svgElement.classList.add("is-static");
    }
    backgroundAnimation.replaceChildren(svgElement);
  } catch {
    // Ignore storage failures; the default background remains usable.
  }
}

function initPersonalToggle() {
  personalToggle?.addEventListener("click", () => {
    const isOpen = personalToggle.getAttribute("aria-expanded") === "true";
    const shouldOpen = !isOpen;
    personalToggle.setAttribute("aria-expanded", `${shouldOpen}`);
    personalDetails.hidden = !shouldOpen;
    if (shouldOpen) {
      personalDetails.classList.remove("is-open");
      void personalDetails.offsetWidth;
      personalDetails.classList.add("is-open");
    } else {
      personalDetails.classList.remove("is-open");
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
  void restoreSavedBackground();
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
