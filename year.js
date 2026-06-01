const PDFJS_MODULE_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs";
const DEFAULT_PDF_FILE = "./PORTFOLIO_Zuzana-Purmova.pdf";
const ASSET_CACHE_VERSION = "2026-05-24-responsive-pdf-crops";
const DATA_CACHE_VERSION = "2026-05-24-responsive-pdf-crops";
const BACKGROUND_CACHE_VERSION = "2026-05-31-project-backgrounds";
const MAX_CANVAS_DEVICE_SCALE = 1;
const MAX_CANVAS_EDGE = 1800;
const DEFAULT_BACKGROUND_SRC = "./assets/Background/smoothed/contours.svg";
const SEMNEVICE_BACKGROUND_SRC = "./assets/Background/smoothed/contours-semnevice.svg";
const PRAGUE_BACKGROUND_SRC = "./assets/Background/smoothed/contours-Praha-stresovice.svg";
const KLADNO_BACKGROUND_SRC = "./assets/Background/smoothed/contours-kladno.svg";
const GROWING_BACKGROUND_SRC = "./assets/Background/smoothed/contours-growing.svg";
const ABSTRACT_BACKGROUND_SRC = "./assets/Background/smoothed/contours-abstract.svg";
const BACKGROUND_STORAGE_KEY = "zuz-active-background-src";
const AVAILABLE_BACKGROUND_SRCS = new Set([
  DEFAULT_BACKGROUND_SRC,
  SEMNEVICE_BACKGROUND_SRC,
  PRAGUE_BACKGROUND_SRC,
  KLADNO_BACKGROUND_SRC,
  GROWING_BACKGROUND_SRC,
  ABSTRACT_BACKGROUND_SRC,
]);

const yearHeading = document.getElementById("yearHeading");
const projectSelectorSection = document.getElementById("projectSelectorSection");
const projectPicker = document.getElementById("projectPicker");
const projectsSection = document.getElementById("projects");
const projectYearBadge = document.getElementById("projectYearBadge");
const projectTitle = document.getElementById("projectTitle");
const projectMeta = document.getElementById("projectMeta");
const projectDescription = document.getElementById("projectDescription");
const projectOverlay = document.querySelector(".project-overlay");
const visualLayers = document.getElementById("visualLayers");
const viewerStatus = document.getElementById("viewerStatus");
const scrollSteps = document.getElementById("scrollSteps");
const yearLabel = document.getElementById("year");
const backToProjects = document.getElementById("backToProjects");
const backgroundAnimation = document.querySelector(".background-animation");
let backgroundAnimationElement = document.querySelector(".background-animation-lines");

let allProjects = [];
let yearProjects = [];
let sceneTrack = [];
let layers = [];
let steps = [];
let stepPositions = [];
let projectStartStepByIndex = new Map();
let activeProjectIndex = -1;
let objectRefsByScene = new Map();
let annotationRefsByScene = new Map();
let carouselRefsByScene = new Map();
let selectedProjectIndex = -1;
let isScrollHandlerAttached = false;
let isResizeHandlerAttached = false;
let isSelectingProject = false;
let headerAnimationTimer = 0;
let activeBackgroundSrc = getStoredBackgroundSrc();
let backgroundTransitionTimer = 0;
let backgroundRedrawTimer = 0;
let backgroundDrawCompleteTimer = 0;
let backgroundTransitionId = 0;
const backgroundSvgCache = new Map();
const pdfCache = new Map();
let pdfjsLibPromise = null;
let headerContourSyncQueued = false;
let headerContourSyncUntil = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function withAssetCacheVersion(src) {
  if (!src || /^(https?:|data:|blob:)/i.test(src)) {
    return src;
  }

  const delimiter = src.includes("?") ? "&" : "?";
  return `${src}${delimiter}asset=${ASSET_CACHE_VERSION}`;
}

function withBackgroundCacheVersion(src, transitionId = 0) {
  if (!src) {
    return src;
  }

  const delimiter = src.includes("?") ? "&" : "?";
  return `${src}${delimiter}bg=${BACKGROUND_CACHE_VERSION}&draw=${transitionId}`;
}

function getStoredBackgroundSrc() {
  try {
    const storedBackgroundSrc = window.sessionStorage.getItem(BACKGROUND_STORAGE_KEY);
    return AVAILABLE_BACKGROUND_SRCS.has(storedBackgroundSrc) ? storedBackgroundSrc : DEFAULT_BACKGROUND_SRC;
  } catch {
    return DEFAULT_BACKGROUND_SRC;
  }
}

function persistActiveBackground(src) {
  try {
    window.sessionStorage.setItem(BACKGROUND_STORAGE_KEY, src);
  } catch {
    // Ignore storage failures; background switching should still work in memory.
  }
}

async function loadBackgroundSvgElement(src, transitionId = 0) {
  const cacheKey = src;
  let svgText = backgroundSvgCache.get(cacheKey);
  if (!svgText) {
    const response = await fetch(withBackgroundCacheVersion(src, transitionId), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load background: ${src}`);
    }
    svgText = await response.text();
    backgroundSvgCache.set(cacheKey, svgText);
  }

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
  if (!svgElement?.isConnected || svgElement.classList.contains("is-undrawing")) {
    return;
  }
  svgElement.classList.add("is-static");
}

function scheduleBackgroundDrawCompletion(svgElement) {
  window.clearTimeout(backgroundDrawCompleteTimer);
  backgroundDrawCompleteTimer = window.setTimeout(() => {
    forceFinishedBackgroundDraw(svgElement);
  }, 12500);
}

async function setInitialBackgroundSvg() {
  if (!backgroundAnimation) {
    return;
  }

  const requestedBackgroundSrc = activeBackgroundSrc;
  const requestedTransitionId = backgroundTransitionId;

  try {
    const svgElement = await loadBackgroundSvgElement(requestedBackgroundSrc);
    if (requestedTransitionId !== backgroundTransitionId || requestedBackgroundSrc !== activeBackgroundSrc) {
      return;
    }
    backgroundAnimation.replaceChildren(svgElement);
    backgroundAnimationElement = svgElement;
    scheduleBackgroundDrawCompletion(svgElement);
  } catch {
    backgroundAnimationElement = document.querySelector(".background-animation-lines");
  }
}

function syncHeaderContourOverlays() {
  for (const viewport of document.querySelectorAll(".project-header-contour-viewport")) {
    const overlay = viewport.parentElement;
    if (!overlay) {
      continue;
    }
    const rect = overlay.getBoundingClientRect();
    viewport.style.setProperty("--contour-offset-x", `${-rect.left}px`);
    viewport.style.setProperty("--contour-offset-y", `${-rect.top}px`);
  }

  if (performance.now() < headerContourSyncUntil) {
    requestAnimationFrame(syncHeaderContourOverlays);
    return;
  }

  headerContourSyncQueued = false;
}

function queueHeaderContourOverlaySync() {
  if (headerContourSyncQueued) {
    return;
  }
  headerContourSyncQueued = true;
  requestAnimationFrame(syncHeaderContourOverlays);
}

function keepHeaderContourOverlaySynced(durationMs = 0) {
  headerContourSyncUntil = Math.max(headerContourSyncUntil, performance.now() + durationMs);
  queueHeaderContourOverlaySync();
}

async function appendHeaderContourOverlay(headerSheet, backgroundSrc = activeBackgroundSrc) {
  const requestedBackgroundSrc = backgroundSrc;
  let svgElement = null;
  try {
    svgElement = await loadBackgroundSvgElement(requestedBackgroundSrc, backgroundTransitionId);
  } catch {
    return;
  }

  svgElement.classList.add("project-header-contour-lines");
  svgElement.classList.remove("is-static", "is-undrawing", "is-redrawing");
  window.setTimeout(() => {
    forceFinishedBackgroundDraw(svgElement);
  }, 12500);

  const overlay = document.createElement("div");
  overlay.className = "project-header-contour-overlay";
  const viewport = document.createElement("div");
  viewport.className = "project-header-contour-viewport";
  viewport.append(svgElement);
  overlay.append(viewport);
  headerSheet.prepend(overlay);
}

function freezeBackgroundLineStates(svgElement) {
  for (const contour of svgElement.querySelectorAll("polyline, path")) {
    const computedStyle = window.getComputedStyle(contour);
    contour.style.setProperty("--frozen-opacity", `${Math.max(Number.parseFloat(computedStyle.opacity) || 0, 0.86)}`);
  }
}

function getProjectBackgroundSrc(project) {
  const slug = slugifyProject(`${project?.selectorLabel || ""} ${project?.title || ""}`);
  if (slug.includes("semnevice")) {
    return SEMNEVICE_BACKGROUND_SRC;
  }

  if (slug.includes("kladno") || slug.includes("krematorium")) {
    return KLADNO_BACKGROUND_SRC;
  }

  if (slug.includes("growing-through")) {
    return GROWING_BACKGROUND_SRC;
  }

  if (slug.includes("abstract")) {
    return ABSTRACT_BACKGROUND_SRC;
  }

  if (slug.includes("steep-garden")) {
    return PRAGUE_BACKGROUND_SRC;
  }

  return DEFAULT_BACKGROUND_SRC;
}

async function transitionProjectBackground(project) {
  if (!backgroundAnimation) {
    return;
  }

  const nextSrc = getProjectBackgroundSrc(project);
  if (nextSrc === activeBackgroundSrc) {
    persistActiveBackground(nextSrc);
    backgroundTransitionId += 1;
    const currentTransitionId = backgroundTransitionId;
    window.clearTimeout(backgroundTransitionTimer);
    window.clearTimeout(backgroundRedrawTimer);

    let redrawBackgroundElement = null;
    try {
      redrawBackgroundElement = await loadBackgroundSvgElement(nextSrc, currentTransitionId);
    } catch {
      backgroundAnimationElement?.classList.remove("is-undrawing", "is-redrawing");
      return;
    }

    if (currentTransitionId !== backgroundTransitionId) {
      return;
    }

    redrawBackgroundElement.classList.add("is-redrawing");
    backgroundAnimation.replaceChildren(redrawBackgroundElement);
    backgroundAnimationElement = redrawBackgroundElement;
    backgroundRedrawTimer = window.setTimeout(() => {
      if (currentTransitionId === backgroundTransitionId) {
        backgroundAnimationElement.classList.remove("is-redrawing");
      }
    }, 1800);
    scheduleBackgroundDrawCompletion(redrawBackgroundElement);
    return;
  }

  backgroundTransitionId += 1;
  const currentTransitionId = backgroundTransitionId;
  activeBackgroundSrc = nextSrc;
  persistActiveBackground(nextSrc);
  window.clearTimeout(backgroundTransitionTimer);
  window.clearTimeout(backgroundRedrawTimer);
  window.clearTimeout(backgroundDrawCompleteTimer);

  let nextBackgroundElement = null;
  try {
    nextBackgroundElement = await loadBackgroundSvgElement(nextSrc, currentTransitionId);
  } catch {
    return;
  }

  if (currentTransitionId !== backgroundTransitionId) {
    return;
  }

  if (!backgroundAnimationElement) {
    nextBackgroundElement.classList.add("is-redrawing");
    backgroundAnimation.replaceChildren(nextBackgroundElement);
    backgroundAnimationElement = nextBackgroundElement;
    scheduleBackgroundDrawCompletion(nextBackgroundElement);
    return;
  }

  backgroundAnimationElement.classList.remove("is-redrawing");
  freezeBackgroundLineStates(backgroundAnimationElement);
  backgroundAnimationElement.classList.remove("is-static");
  void backgroundAnimationElement.getBoundingClientRect();
  backgroundAnimationElement.classList.add("is-undrawing");

  backgroundTransitionTimer = window.setTimeout(() => {
    if (currentTransitionId !== backgroundTransitionId) {
      return;
    }

    nextBackgroundElement.classList.add("is-redrawing");
    backgroundAnimation.replaceChildren(nextBackgroundElement);
    backgroundAnimationElement = nextBackgroundElement;
    scheduleBackgroundDrawCompletion(nextBackgroundElement);

    backgroundRedrawTimer = window.setTimeout(() => {
      if (currentTransitionId !== backgroundTransitionId) {
        return;
      }
      backgroundAnimationElement.classList.remove("is-redrawing");
    }, 1800);
  }, 1160);
}

function getSelectedYear() {
  const params = new URLSearchParams(window.location.search);
  const rawYear = params.get("year");
  const parsed = Number.parseInt(rawYear || "", 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function getSelectedProjectSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("project") || "";
}

function slugifyProject(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function setProjectText(project) {
  projectYearBadge.textContent = String(project.year);
  projectTitle.textContent = project.title;
  const projectType = project.projectType || project.category;
  projectMeta.textContent = `${project.year} · ${projectType} · ${project.location}`;
  projectDescription.textContent = project.description;
}

function buildProjectHeaderText(project) {
  const projectType = project.projectType || project.category || "Project";
  const team = Array.isArray(project.projectTeam) ? project.projectTeam.filter(Boolean) : [];
  const studioName = project.studioName || "";
  const studioUrl = project.studioUrl || "";

  const lines = [
    "NAME OF PROJECT",
    project.title || "",
    "",
    "TYPE OF PROJECT",
    projectType,
  ];

  if (team.length > 0) {
    lines.push(team.join(", "));
  }

  if (studioName || studioUrl) {
    lines.push("", "STUDIO");
    if (studioName) {
      lines.push(studioName);
    }
    if (studioUrl) {
      lines.push(studioUrl);
    }
  }

  return lines.join("\n");
}

function removeProjectHeaderLabel(text) {
  return text.replace(/^PROJECT HEADER\s*\n+/i, "");
}

function appendLinkedText(element, text, linkContext = {}) {
  const studioName = linkContext.studioName || "";
  const studioUrl = linkContext.studioUrl || "";
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const lines = text.split("\n");

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      element.append(document.createTextNode("\n"));
    }

    if (studioName && studioUrl && line.trim() === studioName) {
      const link = document.createElement("a");
      link.href = studioUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = line;
      element.append(link);
      return;
    }

    if (studioUrl && line.trim() === studioUrl) {
      return;
    }

    let lastIndex = 0;
    for (const match of line.matchAll(urlPattern)) {
      if (match.index > lastIndex) {
        element.append(document.createTextNode(line.slice(lastIndex, match.index)));
      }
      const link = document.createElement("a");
      link.href = match[0];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = match[0];
      element.append(link);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
      element.append(document.createTextNode(line.slice(lastIndex)));
    }
  });
}

function getProjectHeaderActions(scene) {
  const actions = [];
  if (scene.relatedProjectLink?.href && scene.relatedProjectLink?.label) {
    actions.push(scene.relatedProjectLink);
  }
  if (Array.isArray(scene.headerActions)) {
    actions.push(...scene.headerActions.filter((action) => action?.href && action?.label));
  }
  return actions;
}

function uniquePageNumbers(pageNumbers) {
  return [...new Set(pageNumbers)];
}

function resolveProjectPages(project, totalPages, projectIndex, totalProjects) {
  if (Array.isArray(project.pdfPages) && project.pdfPages.length > 0) {
    const validatedPages = project.pdfPages
      .filter((value) => Number.isInteger(value))
      .map((value) => clamp(value, 1, totalPages));
    if (validatedPages.length > 0) {
      return uniquePageNumbers(validatedPages);
    }
  }

  let anchorPage = 1;
  if (Number.isInteger(project.pdfPage)) {
    anchorPage = clamp(project.pdfPage, 1, totalPages);
  } else if (totalProjects > 1) {
    const fraction = projectIndex / (totalProjects - 1);
    anchorPage = Math.round(1 + fraction * (totalPages - 1));
  }

  return uniquePageNumbers([
    clamp(anchorPage - 1, 1, totalPages),
    clamp(anchorPage, 1, totalPages),
    clamp(anchorPage + 1, 1, totalPages),
  ]);
}

function sceneNeedsPdf(scene) {
  if (!scene || scene.type === "annotation" || scene.type === "carousel") {
    return false;
  }

  if (scene.type === "pdf") {
    return true;
  }

  if (scene.type === "objects") {
    return Array.isArray(scene.objects) && scene.objects.some((object) => !object.src && !object.text);
  }

  return false;
}

async function loadPdfDocument(filePath) {
  if (pdfCache.has(filePath)) {
    return pdfCache.get(filePath);
  }

  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import(PDFJS_MODULE_URL);
  }
  const pdfjsLib = await pdfjsLibPromise;
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  const loadingTask = pdfjsLib.getDocument({
    url: filePath,
    disableWorker: window.location.protocol === "file:",
  });
  const pdfDocument = await loadingTask.promise;
  pdfCache.set(filePath, pdfDocument);
  return pdfDocument;
}

function createFallbackScenes(project) {
  const annotationText = buildProjectHeaderText(project);
  const supportingText = project.annotation || project.description || "";
  const pdfFile = project.pdfFile || DEFAULT_PDF_FILE;
  const scenes = [
    {
      type: "annotation",
      text: annotationText,
      supportingText,
    },
  ];

  project.pages.forEach((pageNumber) => {
    scenes.push({
      type: "objects",
      page: pageNumber,
      pdfFile,
      objects: [
        normalizeObjectDefinition(
          {
            name: `page-${pageNumber}-left`,
            crop: [0.04, 0.1, 0.42, 0.76],
            displayWidthRatio: 0.42,
            base: { x: -250, y: 70, scale: 1, opacity: 1 },
            enter: { x: -680, y: 70, scale: 1, opacity: 1 },
            exit: { x: -250, y: 70, scale: 1, opacity: 1 },
            enterDuration: 0.62,
            exitStart: 0.98,
            exitDuration: 0.01,
          },
          0,
        ),
        normalizeObjectDefinition(
          {
            name: `page-${pageNumber}-right`,
            crop: [0.54, 0.1, 0.42, 0.76],
            displayWidthRatio: 0.42,
            base: { x: 250, y: 70, scale: 1, opacity: 1 },
            enter: { x: 680, y: 70, scale: 1, opacity: 1 },
            exit: { x: 250, y: 70, scale: 1, opacity: 1 },
            enterDuration: 0.62,
            exitStart: 0.98,
            exitDuration: 0.01,
          },
          1,
        ),
      ],
    });
  });
  return scenes;
}

function normalizeObjectDefinition(rawObject, objectIndex) {
  const crop = Array.isArray(rawObject.crop) && rawObject.crop.length === 4 ? rawObject.crop : [0, 0, 1, 1];
  const base = rawObject.base || {};
  const enter = rawObject.enter || {};
  const exit = rawObject.exit || {};

  return {
    name: rawObject.name || `object-${objectIndex + 1}`,
    caption: rawObject.caption || "",
    src: rawObject.src || "",
    srcset: rawObject.srcset || "",
    sizes: rawObject.sizes || "",
    text: rawObject.text || "",
    flowOffsetY: rawObject.flowOffsetY ?? 0,
    crop: crop.map((value, index) => (index < 2 ? clamp(value, 0, 1) : clamp(value, 0.02, 1))),
    displayWidthRatio: clamp(rawObject.displayWidthRatio ?? crop[2], 0.08, 0.95),
    base: {
      x: base.x ?? 0,
      y: base.y ?? 0,
      scale: base.scale ?? 1,
      rotate: base.rotate ?? 0,
      opacity: base.opacity ?? 1,
    },
    enter: {
      x: enter.x ?? 0,
      y: enter.y ?? 0,
      scale: enter.scale ?? 1,
      rotate: enter.rotate ?? 0,
      opacity: enter.opacity ?? 0,
    },
    exit: {
      x: exit.x ?? base.x ?? 0,
      y: exit.y ?? base.y ?? 0,
      scale: exit.scale ?? base.scale ?? 1,
      rotate: exit.rotate ?? base.rotate ?? 0,
      opacity: exit.opacity ?? 0.15,
    },
    delay: rawObject.delay ?? objectIndex * 0.12,
    enterDuration: rawObject.enterDuration ?? 0.52,
    exitStart: rawObject.exitStart ?? 0.72,
    exitDuration: rawObject.exitDuration ?? 0.28,
    scrollTrigger: rawObject.scrollTrigger || "scene",
    zIndex: rawObject.zIndex ?? objectIndex + 1,
  };
}

function normalizePhotoDefinition(rawPhoto, photoIndex) {
  if (typeof rawPhoto === "string") {
    return {
      src: rawPhoto,
      alt: `Site photograph ${photoIndex + 1}`,
      caption: "",
    };
  }

  return {
    src: rawPhoto.src || "",
    alt: rawPhoto.alt || `Site photograph ${photoIndex + 1}`,
    caption: rawPhoto.caption || "",
  };
}

function buildSceneTrack(projects = yearProjects.map((project, projectIndex) => ({ project, projectIndex }))) {
  sceneTrack = [];
  projectStartStepByIndex = new Map();

  projects.forEach(({ project, projectIndex }) => {
    projectStartStepByIndex.set(projectIndex, sceneTrack.length);
    const projectScenes = Array.isArray(project.scenesResolved) && project.scenesResolved.length > 0
      ? project.scenesResolved
      : createFallbackScenes(project);

    projectScenes.forEach((scene, sceneIndex) => {
      sceneTrack.push({
        ...scene,
        projectIndex,
        sceneIndex,
      });
    });
  });
}

function renderSteps() {
  const fragment = document.createDocumentFragment();

  sceneTrack.forEach((scene, sceneIndex) => {
    const step = document.createElement("article");
    step.className = "story-step";
    step.dataset.sceneIndex = `${sceneIndex}`;
    step.id = `scene-${sceneIndex}`;
    fragment.append(step);
  });

  scrollSteps.replaceChildren(fragment);
  steps = Array.from(scrollSteps.querySelectorAll(".story-step"));
}

function recomputeStepPositions() {
  stepPositions = steps.map((step) => step.offsetTop);
}

function createLayer(sceneIndex) {
  const layer = document.createElement("div");
  layer.className = "pdf-layer";
  layer.dataset.sceneIndex = `${sceneIndex}`;
  visualLayers.append(layer);
  return layer;
}

function getSceneHandoffStart(scene) {
  if (!scene) {
    return 0.72;
  }

  if (isRealizationDelayedDownLayout(scene.layout)) {
    return 0.98;
  }

  if (
    scene.layout === "side-by-side"
    || scene.layout === "analysis"
    || scene.layout === "map-legend"
    || scene.layout === "single-text"
    || scene.layout === "stacked-map-text"
    || scene.layout === "stacked-carousel"
    || scene.layout === "vegetation"
    || scene.layout === "inner-function"
    || scene.layout === "full-width-visual"
    || scene.layout === "krematorium-site-split"
    || scene.layout === "krematorium-sirsi-vztahy"
    || scene.layout === "krematorium-navrh-cyklus"
    || scene.layout === "krematorium-koncept"
    || scene.layout === "krematorium-pohled-a"
    || scene.layout === "krematorium-dva-svety"
    || scene.layout === "krematorium-legenda"
    || scene.layout === "krematorium-pohled-b"
    || scene.layout === "krematorium-obradni-sin"
    || scene.layout === "krematorium-zed"
    || scene.layout === "abstract-start"
    || scene.layout === "abstract-two-left-one-right"
    || scene.layout === "abstract-two-top-one-down"
    || scene.layout === "abstract-three-left-one-right"
    || scene.layout === "abstract-three-horizontal"
    || scene.layout === "abstract-two-column"
    || isRealizationFlowLayout(scene.layout)
    || scene.layout === "history-kostel"
  ) {
    return 0.62;
  }

  return 0.72;
}

function applyLayerState(currentIndex, progress) {
  const safeProgress = clamp(progress, 0, 1);
  const nextIndex = Math.min(currentIndex + 1, layers.length - 1);
  const currentScene = sceneTrack[currentIndex];
  const handoffStart = getSceneHandoffStart(currentScene);
  const handoffProgress = currentIndex === nextIndex ? 0 : clamp((safeProgress - handoffStart) / (1 - handoffStart), 0, 1);
  const nextSceneProgress = clamp(handoffProgress * 0.7, 0, 1);

  layers.forEach((layer, index) => {
    if (index === currentIndex) {
      layer.classList.add("active");
      layer.style.opacity = String(1 - handoffProgress);
      layer.style.transform = `translateY(${-14 * handoffProgress}px) scale(${1 - handoffProgress * 0.008})`;
      layer.style.pointerEvents = handoffProgress < 1 ? "auto" : "none";
      return;
    }

    if (index === nextIndex && handoffProgress > 0) {
      layer.classList.add("active");
      layer.style.opacity = String(handoffProgress);
      layer.style.transform = `translateY(${14 * (1 - handoffProgress)}px) scale(${0.992 + handoffProgress * 0.008})`;
      layer.style.pointerEvents = "none";
      return;
    }

    layer.classList.remove("active");
    layer.style.opacity = "0";
    layer.style.transform = "translateY(24px) scale(0.99)";
    layer.style.pointerEvents = "none";
  });

  applyObjectSceneProgress(currentIndex, safeProgress);
  layers[currentIndex]?.classList.toggle("has-visible-objects", currentScene?.type !== "objects" || safeProgress > 0.025);
  applyAnnotationSceneProgress(currentIndex, safeProgress);
  applyCarouselSceneProgress(currentIndex, safeProgress);
  if (handoffProgress > 0) {
    const nextScene = sceneTrack[nextIndex];
    layers[nextIndex]?.classList.toggle("has-visible-objects", nextScene?.type !== "objects" || nextSceneProgress > 0.025);
    applyObjectSceneProgress(nextIndex, nextSceneProgress);
    applyAnnotationSceneProgress(nextIndex, nextSceneProgress);
    applyCarouselSceneProgress(nextIndex, nextSceneProgress);
  }
  queueHeaderContourOverlaySync();
  applyOverlayState(currentIndex, safeProgress);
}

function applyObjectSceneProgress(sceneIndex, sceneProgress) {
  const objectRefs = objectRefsByScene.get(sceneIndex);
  if (!objectRefs || objectRefs.length === 0) {
    return;
  }

  objectRefs.forEach((item) => {
    const config = item.config;
    const progress = config.scrollTrigger === "self" ? getObjectScrollProgress(item) : sceneProgress;
    const inProgress = clamp((progress - config.delay) / config.enterDuration, 0, 1);
    const outProgress = item.flowOnly ? 0 : clamp((progress - config.exitStart) / config.exitDuration, 0, 1);

    const inX = lerp(config.enter.x, config.base.x, inProgress);
    const inY = lerp(config.enter.y, config.base.y, inProgress);
    const inScale = lerp(config.enter.scale, config.base.scale, inProgress);
    const inRotate = lerp(config.enter.rotate, config.base.rotate, inProgress);
    const inOpacity = lerp(config.enter.opacity, config.base.opacity, inProgress);

    const x = lerp(inX, config.exit.x, outProgress);
    const animatedY = lerp(inY, config.exit.y, outProgress);
    const hasFlowYAnimation = config.enter.y !== config.base.y || config.exit.y !== config.base.y;
    const y = item.flowOnly ? config.flowOffsetY + (hasFlowYAnimation ? animatedY : 0) : animatedY;
    const scale = lerp(inScale, config.exit.scale, outProgress);
    const rotate = lerp(inRotate, config.exit.rotate, outProgress);
    const opacity = lerp(inOpacity, config.exit.opacity, outProgress);

    item.element.style.opacity = String(opacity);
    item.element.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`;
  });
}

function getObjectScrollProgress(item) {
  const sceneTop = item.layer.getBoundingClientRect().top;
  const objectTop = sceneTop + item.element.offsetTop;
  const startLine = window.innerHeight * 1.14;
  const travel = Math.max(window.innerHeight * 0.82, item.element.offsetHeight * 2.4);
  return clamp((startLine - objectTop) / travel, 0, 1);
}

function applyAnnotationSceneProgress(sceneIndex) {
  const refs = annotationRefsByScene.get(sceneIndex);
  if (!refs) {
    return;
  }

  refs.details.style.opacity = "1";
  refs.details.style.transform = "translateY(0)";
}

function applyCarouselSceneProgress(sceneIndex, sceneProgress) {
  const carouselRef = carouselRefsByScene.get(sceneIndex);
  if (!carouselRef) {
    return;
  }

  const carouselProgress = carouselRef.embedded ? clamp((sceneProgress - 0.02) / 0.08, 0, 1) : 1;
  carouselRef.element.style.opacity = String(carouselProgress);
  carouselRef.element.style.transform = `translateY(${lerp(12, 0, carouselProgress)}px)`;
}

function setActiveProjectFromScene(sceneIndex) {
  const scene = sceneTrack[sceneIndex];
  if (!scene) {
    return;
  }

  if (scene.projectIndex !== activeProjectIndex) {
    activeProjectIndex = scene.projectIndex;
    setProjectText(yearProjects[activeProjectIndex]);
    activateProjectButton(activeProjectIndex);
  }
}

function applyOverlayState(sceneIndex, sceneProgress) {
  if (!projectOverlay) {
    return;
  }

  const scene = sceneTrack[sceneIndex];
  if (!scene) {
    projectOverlay.style.opacity = "0";
    return;
  }

  if (scene.type === "annotation") {
    projectOverlay.style.opacity = "0";
    projectOverlay.style.transform = "translateY(-16px)";
    return;
  }

  projectOverlay.style.opacity = "0";
  projectOverlay.style.transform = "translateY(-16px)";
}

function getContinuousSceneProgress(layer) {
  const rect = layer.getBoundingClientRect();
  const scene = sceneTrack[Number(layer.dataset.sceneIndex)];
  const startLineRatio = scene?.startLineRatio ?? 0.96;
  const startLine = window.innerHeight * startLineRatio;
  const isFlowScene = layer.classList.contains("flow-object-scene-layer");
  const hasDelayedDownObject = isRealizationDelayedDownLayout(scene?.layout);
  const travel = isFlowScene
    ? Math.max(window.innerHeight * (scene?.travelRatio ?? (hasDelayedDownObject ? 1.25 : 0.95)), rect.height * 0.92)
    : Math.max(1, Math.min(window.innerHeight * 0.72, rect.height * 0.72));
  return clamp((startLine - rect.top) / travel, 0, 1);
}

function isRealizationDelayedDownLayout(layout) {
  return layout === "realization-top-down"
    || layout === "realization-two-top-one-down"
    || layout === "realization-two-even-top-one-down"
    || layout === "realization-custom-two-top-one-down"
    || layout === "growing-two-top-one-down"
    || /^realization-two-top-one-down-\d+$/.test(layout);
}

function isRealizationFlowLayout(layout) {
  return isRealizationDelayedDownLayout(layout)
    || layout === "realization-two-column"
    || layout === "realization-single-wide"
    || layout === "realization-single-wide-351"
    || layout === "realization-single-wide-306"
    || layout === "realization-single-wide-513"
    || layout === "realization-full-page"
    || layout === "realization-single-custom"
    || layout === "realization-custom-two-top"
    || layout === "growing-left-stack-right"
    || /^realization-two-top-\d+$/.test(layout);
}

function updateFromScroll() {
  if (layers.length === 0) {
    return;
  }

  const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  const isAtPageBottom = window.scrollY + window.innerHeight >= documentHeight - 2;
  let activeSceneIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  layers.forEach((layer, sceneIndex) => {
    const rect = layer.getBoundingClientRect();
    const distance = Math.abs(rect.top - window.innerHeight * 0.18);
    if (rect.bottom > 0 && rect.top < window.innerHeight && distance < closestDistance) {
      closestDistance = distance;
      activeSceneIndex = sceneIndex;
    }

    layer.classList.add("active");
    layer.style.opacity = "1";
    layer.style.transform = "none";
    layer.style.pointerEvents = "auto";

    const rawProgress = getContinuousSceneProgress(layer);
    const progress = sceneIndex === layers.length - 1 && isAtPageBottom ? 1 : rawProgress;
    const scene = sceneTrack[sceneIndex];
    layer.classList.toggle("has-visible-objects", scene?.type !== "objects" || progress > 0.025);
    applyObjectSceneProgress(sceneIndex, progress);
    applyAnnotationSceneProgress(sceneIndex, progress);
    applyCarouselSceneProgress(sceneIndex, progress);
  });

  queueHeaderContourOverlaySync();
  setActiveProjectFromScene(activeSceneIndex);
  applyOverlayState(activeSceneIndex, 1);
}

async function renderFullPageCanvas(pdfDocument, pageNumber, canvas) {
  const page = await pdfDocument.getPage(pageNumber);
  const containerWidth = visualLayers.clientWidth;
  const containerHeight = visualLayers.clientHeight;
  const baseViewport = page.getViewport({ scale: 1 });
  const fitScale = Math.max(containerWidth / baseViewport.width, containerHeight / baseViewport.height);
  const deviceScale = Math.min(MAX_CANVAS_DEVICE_SCALE, Math.max(1, window.devicePixelRatio || 1));
  const viewport = page.getViewport({ scale: fitScale });

  const edgeScale = Math.min(1, MAX_CANVAS_EDGE / Math.max(containerWidth, containerHeight));
  canvas.width = Math.round(containerWidth * deviceScale * edgeScale);
  canvas.height = Math.round(containerHeight * deviceScale * edgeScale);
  canvas.style.width = `${containerWidth}px`;
  canvas.style.height = `${containerHeight}px`;

  const context = canvas.getContext("2d", { alpha: false });
  context.setTransform(deviceScale * edgeScale, 0, 0, deviceScale * edgeScale, 0, 0);
  context.clearRect(0, 0, containerWidth, containerHeight);

  const offsetX = (containerWidth - viewport.width) / 2;
  const offsetY = (containerHeight - viewport.height) / 2;
  await page.render({
    canvasContext: context,
    viewport,
    transform: [1, 0, 0, 1, offsetX, offsetY],
  }).promise;
}

async function renderObjectCrop(pdfDocument, pageNumber, objectConfig, canvas) {
  const page = await pdfDocument.getPage(pageNumber);
  const pageViewport = page.getViewport({ scale: 1 });

  const stageWidth = visualLayers.clientWidth;
  const targetWidth = stageWidth * objectConfig.displayWidthRatio;

  const cropWidth = objectConfig.crop[2] * pageViewport.width;
  const cropHeight = objectConfig.crop[3] * pageViewport.height;
  const aspect = cropHeight / cropWidth;
  const targetHeight = targetWidth * aspect;

  const scale = targetWidth / cropWidth;
  const deviceScale = Math.min(MAX_CANVAS_DEVICE_SCALE, Math.max(1, window.devicePixelRatio || 1));
  const edgeScale = Math.min(1, MAX_CANVAS_EDGE / Math.max(targetWidth, targetHeight));
  const renderViewport = page.getViewport({ scale: scale * deviceScale * edgeScale });

  canvas.width = Math.max(1, Math.round(targetWidth * deviceScale * edgeScale));
  canvas.height = Math.max(1, Math.round(targetHeight * deviceScale * edgeScale));
  canvas.style.width = `${targetWidth}px`;
  canvas.style.height = `${targetHeight}px`;

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = Math.ceil(renderViewport.width);
  sourceCanvas.height = Math.ceil(renderViewport.height);

  const sourceContext = sourceCanvas.getContext("2d", { alpha: false });
  await page.render({
    canvasContext: sourceContext,
    viewport: renderViewport,
  }).promise;

  const renderedCropX = objectConfig.crop[0] * sourceCanvas.width;
  const renderedCropY = objectConfig.crop[1] * sourceCanvas.height;
  const renderedCropWidth = objectConfig.crop[2] * sourceCanvas.width;
  const renderedCropHeight = objectConfig.crop[3] * sourceCanvas.height;

  const context = canvas.getContext("2d", { alpha: true });
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    sourceCanvas,
    renderedCropX,
    renderedCropY,
    renderedCropWidth,
    renderedCropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  sourceCanvas.width = 0;
  sourceCanvas.height = 0;
}

async function renderObjectsIntoLayer(layer, scene, sceneIndex) {
  layer.classList.add("object-scene-layer");
  if (
    scene.layout === "side-by-side"
    || scene.layout === "analysis"
    || scene.layout === "map-legend"
    || scene.layout === "single-text"
    || scene.layout === "stacked-map-text"
    || scene.layout === "stacked-carousel"
    || scene.layout === "vegetation"
    || scene.layout === "inner-function"
    || scene.layout === "full-width-visual"
    || scene.layout === "krematorium-site-split"
    || scene.layout === "krematorium-sirsi-vztahy"
    || scene.layout === "krematorium-navrh-cyklus"
    || scene.layout === "krematorium-koncept"
    || scene.layout === "krematorium-pohled-a"
    || scene.layout === "krematorium-dva-svety"
    || scene.layout === "krematorium-legenda"
    || scene.layout === "krematorium-pohled-b"
    || scene.layout === "krematorium-obradni-sin"
    || scene.layout === "krematorium-zed"
    || scene.layout === "zahrada-two-column"
    || scene.layout === "zahrada-documentation"
    || scene.layout === "zahrada-four-grid"
    || scene.layout === "zahrada-left-stack"
  ) {
    layer.classList.add("flow-object-scene-layer");
  }
  const objectScene = document.createElement("div");
  objectScene.className = "object-scene";
  if (scene.type === "annotation") {
    objectScene.classList.add("annotation-object-scene");
  }
  if (scene.layout === "side-by-side") {
    objectScene.classList.add("side-by-side-object-scene");
  }
  if (scene.layout === "analysis") {
    objectScene.classList.add("analysis-object-scene");
  }
  if (scene.layout === "map-legend") {
    objectScene.classList.add("map-legend-object-scene");
  }
  if (scene.layout === "single-text") {
    objectScene.classList.add("single-text-object-scene");
  }
  if (scene.layout === "stacked-map-text") {
    objectScene.classList.add("stacked-map-text-object-scene");
  }
  if (scene.layout === "stacked-carousel") {
    objectScene.classList.add("stacked-carousel-object-scene");
  }
  if (scene.layout === "vegetation") {
    objectScene.classList.add("vegetation-object-scene");
  }
  if (scene.layout === "inner-function") {
    objectScene.classList.add("inner-function-object-scene");
  }
  if (scene.layout === "full-width-visual") {
    objectScene.classList.add("full-width-visual-object-scene");
  }
  if (scene.layout === "krematorium-site-split") {
    objectScene.classList.add("krematorium-site-split-object-scene");
  }
  if (scene.layout === "krematorium-sirsi-vztahy") {
    objectScene.classList.add("krematorium-sirsi-vztahy-object-scene");
  }
  if (scene.layout === "krematorium-navrh-cyklus") {
    objectScene.classList.add("krematorium-navrh-cyklus-object-scene");
  }
  if (scene.layout === "krematorium-koncept") {
    objectScene.classList.add("krematorium-koncept-object-scene");
  }
  if (scene.layout === "krematorium-pohled-a") {
    objectScene.classList.add("krematorium-pohled-a-object-scene");
  }
  if (scene.layout === "krematorium-dva-svety") {
    objectScene.classList.add("krematorium-dva-svety-object-scene");
  }
  if (scene.layout === "krematorium-legenda") {
    objectScene.classList.add("krematorium-legenda-object-scene");
  }
  if (scene.layout === "krematorium-pohled-b") {
    objectScene.classList.add("krematorium-pohled-b-object-scene");
  }
  if (scene.layout === "krematorium-obradni-sin") {
    objectScene.classList.add("krematorium-obradni-sin-object-scene");
  }
  if (scene.layout === "krematorium-zed") {
    objectScene.classList.add("krematorium-zed-object-scene");
  }
  if (scene.layout === "zahrada-documentation") {
    objectScene.classList.add("zahrada-documentation-object-scene");
  }
  if (scene.layout === "zahrada-two-column") {
    objectScene.classList.add("zahrada-two-column-object-scene");
  }
  if (scene.layout === "zahrada-four-grid") {
    objectScene.classList.add("zahrada-four-grid-object-scene");
  }
  if (scene.layout === "zahrada-left-stack") {
    objectScene.classList.add("zahrada-left-stack-object-scene");
  }
  if (scene.layout === "history-kostel") {
    objectScene.classList.add("history-kostel-object-scene");
  }
  if (scene.layout === "abstract-start") {
    objectScene.classList.add("abstract-start-object-scene");
  }
  if (scene.layout === "abstract-two-left-one-right") {
    objectScene.classList.add("abstract-two-left-one-right-object-scene");
  }
  if (scene.layout === "abstract-two-top-one-down") {
    objectScene.classList.add("abstract-two-top-one-down-object-scene");
  }
  if (scene.layout === "abstract-three-left-one-right") {
    objectScene.classList.add("abstract-three-left-one-right-object-scene");
  }
  if (scene.layout === "abstract-three-horizontal") {
    objectScene.classList.add("abstract-three-horizontal-object-scene");
  }
  if (scene.layout === "abstract-two-column") {
    objectScene.classList.add("abstract-two-column-object-scene");
  }
  if (scene.layout === "realization-two-column") {
    objectScene.classList.add("realization-two-column-object-scene");
  }
  if (scene.layout === "realization-single-wide") {
    objectScene.classList.add("realization-single-wide-object-scene");
  }
  if (scene.layout === "realization-single-wide-351") {
    objectScene.classList.add("realization-single-wide-351-object-scene");
  }
  if (scene.layout === "realization-single-wide-306") {
    objectScene.classList.add("realization-single-wide-306-object-scene");
  }
  if (scene.layout === "realization-single-wide-513") {
    objectScene.classList.add("realization-single-wide-513-object-scene");
  }
  if (scene.layout === "realization-top-down") {
    objectScene.classList.add("realization-top-down-object-scene");
  }
  if (scene.layout === "realization-two-top-one-down") {
    objectScene.classList.add("realization-two-top-one-down-object-scene");
  }
  if (scene.layout === "realization-two-even-top-one-down") {
    objectScene.classList.add("realization-two-even-top-one-down-object-scene");
  }
  if (scene.layout === "realization-two-top-one-down-26") {
    objectScene.classList.add("realization-two-top-one-down-26-object-scene");
  }
  if (scene.layout === "realization-two-top-one-down-27") {
    objectScene.classList.add("realization-two-top-one-down-27-object-scene");
  }
  if (scene.layout === "realization-two-top-28") {
    objectScene.classList.add("realization-two-top-28-object-scene");
  }
  if (scene.layout === "realization-full-page") {
    objectScene.classList.add("realization-full-page-object-scene");
  }
  if (scene.layout === "realization-custom-two-top-one-down") {
    objectScene.classList.add("realization-custom-two-top-one-down-object-scene");
  }
  if (scene.layout === "realization-custom-two-top") {
    objectScene.classList.add("realization-custom-two-top-object-scene");
  }
  if (scene.layout === "realization-single-custom") {
    objectScene.classList.add("realization-single-custom-object-scene");
  }
  if (scene.layout === "growing-left-stack-right") {
    objectScene.classList.add("growing-left-stack-right-object-scene");
  }
  if (scene.layout === "growing-two-top-one-down") {
    objectScene.classList.add("growing-two-top-one-down-object-scene");
  }
  if (scene.layoutConfig?.columns) {
    objectScene.style.setProperty("--realization-columns", scene.layoutConfig.columns);
  }
  if (scene.layoutConfig?.rows) {
    objectScene.style.setProperty("--realization-rows", scene.layoutConfig.rows);
  }
  if (scene.layoutConfig?.aspect) {
    objectScene.style.setProperty("--realization-aspect", scene.layoutConfig.aspect);
  }
  if (Array.isArray(scene.photos) && scene.photos.length > 0) {
    objectScene.classList.add("has-carousel");
  }
  layer.append(objectScene);
  const objectContainer = objectScene.classList.contains("has-carousel") ? document.createElement("div") : objectScene;
  if (objectContainer !== objectScene) {
    objectContainer.className = "object-row";
    objectScene.append(objectContainer);
  }

  const refs = [];
  for (let objectIndex = 0; objectIndex < scene.objects.length; objectIndex += 1) {
    const objectConfig = scene.objects[objectIndex];
    const objectNode = document.createElement("figure");
    objectNode.className = "scene-object";
    objectNode.dataset.objectName = objectConfig.name;
    objectNode.style.zIndex = `${objectConfig.zIndex}`;
    objectNode.style.opacity = "0";
    objectNode.style.transform = "translate(0, 0) scale(1)";
    objectNode.style.width = `${visualLayers.clientWidth * objectConfig.displayWidthRatio}px`;

    if (objectConfig.text) {
      const textNode = document.createElement("article");
      textNode.className = "scene-object-text";
      textNode.textContent = objectConfig.text;
      objectNode.append(textNode);
    } else if (objectConfig.src) {
      const image = document.createElement("img");
      image.className = "scene-object-image";
      image.src = withAssetCacheVersion(objectConfig.src);
      if (objectConfig.srcset) {
        image.srcset = objectConfig.srcset
          .split(",")
          .map((entry) => {
            const trimmedEntry = entry.trim();
            const firstSpaceIndex = trimmedEntry.indexOf(" ");
            if (firstSpaceIndex < 0) {
              return withAssetCacheVersion(trimmedEntry);
            }
            const src = trimmedEntry.slice(0, firstSpaceIndex);
            const descriptor = trimmedEntry.slice(firstSpaceIndex + 1);
            return `${withAssetCacheVersion(src)} ${descriptor}`;
          })
          .join(", ");
      }
      if (objectConfig.sizes) {
        image.sizes = objectConfig.sizes;
      }
      image.alt = objectConfig.caption || objectConfig.name;
      image.loading = "eager";
      image.decoding = "async";
      objectNode.append(image);
    } else {
      const canvas = document.createElement("canvas");
      canvas.className = "scene-object-canvas";
      objectNode.append(canvas);
      const pdfDocument = await loadPdfDocument(scene.pdfFile);
      await renderObjectCrop(pdfDocument, scene.page, objectConfig, canvas);
    }

    if (objectConfig.caption) {
      const captionNode = document.createElement("figcaption");
      captionNode.className = "scene-object-caption";
      captionNode.textContent = objectConfig.caption;
      objectNode.append(captionNode);
    }

    objectContainer.append(objectNode);

    refs.push({
      layer,
      element: objectNode,
      config: objectConfig,
      flowOnly: scene.type === "annotation"
        || scene.layout === "side-by-side"
        || scene.layout === "analysis"
        || scene.layout === "map-legend"
        || scene.layout === "single-text"
        || scene.layout === "stacked-map-text"
        || scene.layout === "stacked-carousel"
        || scene.layout === "vegetation"
        || scene.layout === "inner-function"
        || scene.layout === "full-width-visual"
        || scene.layout === "krematorium-site-split"
        || scene.layout === "krematorium-sirsi-vztahy"
        || scene.layout === "krematorium-navrh-cyklus"
        || scene.layout === "krematorium-koncept"
        || scene.layout === "krematorium-pohled-a"
        || scene.layout === "krematorium-dva-svety"
        || scene.layout === "krematorium-legenda"
        || scene.layout === "krematorium-pohled-b"
        || scene.layout === "krematorium-obradni-sin"
        || scene.layout === "krematorium-zed"
        || scene.layout === "abstract-start"
        || scene.layout === "abstract-two-left-one-right"
        || scene.layout === "abstract-two-top-one-down"
        || scene.layout === "abstract-three-left-one-right"
        || scene.layout === "abstract-three-horizontal"
        || scene.layout === "abstract-two-column"
        || isRealizationFlowLayout(scene.layout)
        || scene.layout === "zahrada-two-column"
        || scene.layout === "zahrada-documentation"
        || scene.layout === "zahrada-four-grid"
        || scene.layout === "zahrada-left-stack"
        || scene.layout === "history-kostel",
    });
  }
  if (Array.isArray(scene.photos) && scene.photos.length > 0) {
    const carouselElement = appendCarouselTrack(objectScene, scene.photos, true);
    carouselRefsByScene.set(sceneIndex, {
      element: carouselElement,
      embedded: true,
    });
  }
  objectRefsByScene.set(sceneIndex, refs);
}

function appendCarouselTrack(parent, photos, isEmbedded = false) {
  const carouselScene = document.createElement("section");
  carouselScene.className = isEmbedded ? "carousel-scene embedded-carousel-scene" : "carousel-scene";
  const carouselTrack = document.createElement("div");
  carouselTrack.className = "carousel-track";
  const repeatedPhotos = [...photos, ...photos, ...photos];

  repeatedPhotos.forEach((photo) => {
    const figure = document.createElement("figure");
    figure.className = "carousel-photo";
    const image = document.createElement("img");
    image.src = withAssetCacheVersion(photo.src);
    image.alt = photo.alt;
    figure.append(image);
    if (photo.caption) {
      const caption = document.createElement("figcaption");
      caption.textContent = photo.caption;
      figure.append(caption);
    }
    carouselTrack.append(figure);
  });

  carouselScene.append(carouselTrack);
  parent.append(carouselScene);
  return carouselScene;
}

async function renderSceneLayer(scene, sceneIndex) {
  const layer = createLayer(sceneIndex);

  if (scene.type === "annotation") {
    layer.classList.add("annotation-layer");
    const annotationBox = document.createElement("article");
    annotationBox.className = "annotation-box annotation-intro";
    appendLinkedText(annotationBox, removeProjectHeaderLabel(scene.text), scene);
    const headerActions = getProjectHeaderActions(scene);
    if (headerActions.length > 0) {
      const actionsWrap = document.createElement("div");
      actionsWrap.className = "project-header-actions";
      annotationBox.append(actionsWrap);
      headerActions.forEach((headerAction) => {
        const actionItem = document.createElement("div");
        actionItem.className = `project-header-action-item${headerAction.variant ? ` is-${headerAction.variant}` : ""}`;
        const action = document.createElement("a");
        action.className = `project-header-action${headerAction.variant ? ` is-${headerAction.variant}` : ""}`;
        action.href = headerAction.href;
        action.textContent = headerAction.label;
        if (headerAction.target === "_blank" || /^https?:\/\//i.test(headerAction.href)) {
          action.target = "_blank";
          action.rel = "noopener noreferrer";
        }
        if (headerAction.tooltip) {
          action.dataset.tooltip = headerAction.tooltip;
          action.setAttribute("aria-label", `${headerAction.label}: ${headerAction.tooltip.replace(/\s+/g, " ")}`);
          const tooltip = document.createElement("span");
          tooltip.className = "project-header-tooltip";
          tooltip.setAttribute("aria-hidden", "true");
          tooltip.textContent = headerAction.tooltip;
          actionItem.append(tooltip);
        }
        if (headerAction.variant === "award") {
          action.addEventListener("pointermove", (event) => {
            const rect = action.getBoundingClientRect();
            action.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
            action.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
          });
        }
        actionItem.prepend(action);
        actionsWrap.append(actionItem);
      });
    }
    annotationBox.classList.add("project-header-sheet");
    await appendHeaderContourOverlay(annotationBox, getProjectBackgroundSrc(yearProjects[scene.projectIndex]));
    layer.append(annotationBox);
    keepHeaderContourOverlaySynced(1900);
    if (Array.isArray(scene.objects) && scene.objects.length > 0) {
      await renderObjectsIntoLayer(layer, scene, sceneIndex);
    }
    if (scene.supportingText) {
      const supportingBox = document.createElement("article");
      supportingBox.className = "annotation-box annotation-details";
      supportingBox.textContent = scene.supportingText;
      layer.append(supportingBox);
      annotationRefsByScene.set(sceneIndex, {
        intro: annotationBox,
        details: supportingBox,
      });
    }
    return layer;
  }

  if (scene.type === "objects") {
    await renderObjectsIntoLayer(layer, scene, sceneIndex);
    return layer;
  }

  if (scene.type === "carousel") {
    layer.classList.add("carousel-layer");
    if (scene.compact) {
      layer.classList.add("compact-carousel-layer");
    }
    appendCarouselTrack(layer, scene.photos);
    return layer;
  }

  const canvas = document.createElement("canvas");
  layer.append(canvas);
  const pdfDocument = await loadPdfDocument(scene.pdfFile);
  await renderFullPageCanvas(pdfDocument, scene.page, canvas);
  return layer;
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
}

async function renderAllLayers(options = {}) {
  visualLayers.replaceChildren();
  layers = [];
  objectRefsByScene = new Map();
  annotationRefsByScene = new Map();
  carouselRefsByScene = new Map();

  for (let sceneIndex = 0; sceneIndex < sceneTrack.length; sceneIndex += 1) {
    const scene = sceneTrack[sceneIndex];
    const layer = await renderSceneLayer(scene, sceneIndex);
    layers.push(layer);
    if (sceneIndex === 0 && typeof options.afterFirstLayer === "function") {
      options.afterFirstLayer();
      await waitForNextFrame();
    }
  }
}

function activateProjectButton(projectIndex) {
  for (const button of projectPicker.querySelectorAll(".project-button")) {
    button.classList.toggle("is-active", Number(button.dataset.projectIndex) === projectIndex);
  }
}

function setProjectLoadingState(isLoading) {
  viewerStatus.classList.toggle("is-visible", isLoading);
  viewerStatus.textContent = isLoading ? "Loading selected project…" : "";
}

function updateBackToProjectsVisibility() {
  if (!backToProjects) {
    return;
  }

  if (selectedProjectIndex < 0) {
    backToProjects.classList.add("is-hidden");
    return;
  }

  const selectorBottom = projectSelectorSection.getBoundingClientRect().bottom;
  backToProjects.classList.toggle("is-hidden", selectorBottom > 0);
}

function scrollToProject(projectIndex) {
  const startStepIndex = projectStartStepByIndex.get(projectIndex);
  if (!Number.isInteger(startStepIndex)) {
    return;
  }

  const targetLayer = layers[startStepIndex] || document.getElementById(`scene-${startStepIndex}`);
  if (!targetLayer) {
    return;
  }

  const targetTop = targetLayer.getBoundingClientRect().top + window.scrollY - 8;
  window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
}

function renderProjectPicker() {
  const fragment = document.createDocumentFragment();

  yearProjects.forEach((project, projectIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "year-button project-button";
    button.dataset.projectIndex = `${projectIndex}`;
    button.textContent = project.selectorLabel || project.title;
    button.addEventListener("click", async () => {
      await selectProject(projectIndex);
    });
    fragment.append(button);
  });

  projectPicker.replaceChildren(fragment);
  projectSelectorSection.classList.remove("is-hidden");
}

function attachScrollHandler() {
  if (isScrollHandlerAttached) {
    return;
  }
  isScrollHandlerAttached = true;
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) {
        return;
      }
      ticking = true;
      requestAnimationFrame(() => {
        updateFromScroll();
        updateBackToProjectsVisibility();
        queueHeaderContourOverlaySync();
        ticking = false;
      });
    },
    { passive: true },
  );
}

function attachResizeHandler() {
  if (isResizeHandlerAttached) {
    return;
  }
  isResizeHandlerAttached = true;
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    if (window.visualViewport && Math.abs(window.visualViewport.scale - 1) > 0.01) {
      return;
    }
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(async () => {
      if (selectedProjectIndex < 0 || isSelectingProject) {
        return;
      }
      const previousScrollY = window.scrollY;
      await renderAllLayers();
      recomputeStepPositions();
      window.scrollTo({ top: previousScrollY, behavior: "instant" });
      updateFromScroll();
      updateBackToProjectsVisibility();
      queueHeaderContourOverlaySync();
    }, 160);
  });
}

async function selectProject(projectIndex) {
  const project = yearProjects[projectIndex];
  if (!project) {
    return;
  }

  isSelectingProject = true;
  selectedProjectIndex = projectIndex;
  activeProjectIndex = projectIndex;
  activateProjectButton(projectIndex);
  void transitionProjectBackground(project);
  setProjectText(project);
  setProjectLoadingState(true);
  projectsSection.classList.remove("is-hidden", "is-project-loaded", "has-played-header-animation");

  try {
    if (!Array.isArray(project.scenesResolved)) {
      await resolveProjectScenes(project, projectIndex, yearProjects.length);
    }

    buildSceneTrack([{ project, projectIndex }]);
    renderSteps();
    await renderAllLayers({
      afterFirstLayer: () => {
        recomputeStepPositions();
        updateFromScroll();
        setProjectLoadingState(false);
        projectsSection.classList.add("is-project-loaded");
        clearTimeout(headerAnimationTimer);
        headerAnimationTimer = window.setTimeout(() => {
          projectsSection.classList.add("has-played-header-animation");
        }, 1700);
        updateBackToProjectsVisibility();
      },
    });
    recomputeStepPositions();
    updateFromScroll();
    setProjectLoadingState(false);
    projectsSection.classList.add("is-project-loaded");
    clearTimeout(headerAnimationTimer);
    headerAnimationTimer = window.setTimeout(() => {
      projectsSection.classList.add("has-played-header-animation");
    }, 1700);
    attachScrollHandler();
    attachResizeHandler();
    updateBackToProjectsVisibility();
  } catch (error) {
    setProjectLoadingState(false);
    viewerStatus.classList.add("is-visible");
    viewerStatus.textContent = "Error loading selected project";
    projectDescription.textContent = error.message;
  } finally {
    isSelectingProject = false;
  }
}

async function resolveProjectScenes(project, projectIndex, totalProjects) {
  const pdfFile = project.pdfFile || DEFAULT_PDF_FILE;
  const scenes = Array.isArray(project.scenes) ? project.scenes : [];
  const needsPdf = scenes.length === 0;
  const pdfDocument = needsPdf ? await loadPdfDocument(pdfFile) : null;
  const fallbackTotalPages = Array.isArray(project.pdfPages) && project.pdfPages.length > 0
    ? Math.max(...project.pdfPages.filter((value) => Number.isInteger(value)))
    : totalProjects;
  project.pages = resolveProjectPages(project, pdfDocument?.numPages ?? fallbackTotalPages, projectIndex, totalProjects);

  if (scenes.length === 0) {
    project.scenesResolved = [];
    return;
  }

  project.scenesResolved = scenes.map((scene, sceneIndex) => {
    if (scene.type === "annotation") {
      const page = clamp(scene.page ?? project.pages[0] ?? 1, 1, pdfDocument?.numPages ?? fallbackTotalPages);
      const objects = Array.isArray(scene.objects) ? scene.objects.map(normalizeObjectDefinition) : [];
      return {
        type: "annotation",
        text: scene.text || buildProjectHeaderText(project),
        supportingText: scene.supportingText || project.annotation || project.description || "",
        relatedProjectLink: scene.relatedProjectLink || project.relatedProjectLink || null,
        headerActions: Array.isArray(scene.headerActions) ? scene.headerActions : (Array.isArray(project.headerActions) ? project.headerActions : []),
        studioName: scene.studioName || project.studioName || "",
        studioUrl: scene.studioUrl || project.studioUrl || "",
        page,
        pdfFile,
        objects,
        sceneIndex,
      };
    }

    if (scene.type === "objects") {
      const page = clamp(scene.page ?? project.pages[0] ?? 1, 1, pdfDocument?.numPages ?? fallbackTotalPages);
      const objects = Array.isArray(scene.objects) ? scene.objects.map(normalizeObjectDefinition) : [];
      return {
        type: "objects",
        page,
        pdfFile,
        objects,
        caption: scene.caption || "",
        layout: scene.layout || "",
        layoutConfig: scene.layoutConfig || null,
        startLineRatio: scene.startLineRatio,
        travelRatio: scene.travelRatio,
        photos: Array.isArray(scene.photos) ? scene.photos.map(normalizePhotoDefinition).filter((photo) => photo.src) : [],
        sceneIndex,
      };
    }

    if (scene.type === "carousel") {
      const photos = Array.isArray(scene.photos) ? scene.photos.map(normalizePhotoDefinition).filter((photo) => photo.src) : [];
      return {
        type: "carousel",
        photos,
        compact: Boolean(scene.compact),
        sceneIndex,
      };
    }

    const page = clamp(scene.page ?? project.pages[0] ?? 1, 1, pdfDocument?.numPages ?? fallbackTotalPages);
    return {
      type: "pdf",
      page,
      pdfFile,
      sceneIndex,
    };
  });
}

async function initializeYearPage() {
  const selectedYear = getSelectedYear();
  if (!selectedYear) {
    window.location.replace("./index.html");
    return;
  }

  void setInitialBackgroundSvg();

  const response = await fetch(`./data/projects.json?v=${DATA_CACHE_VERSION}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load projects.");
  }

  allProjects = await response.json();
  yearProjects = allProjects.filter((project) => project.year === selectedYear);

  if (yearProjects.length === 0) {
    throw new Error(`No projects found for year ${selectedYear}.`);
  }

  renderProjectPicker();

  yearHeading.textContent = `${selectedYear}`;
  yearLabel.textContent = new Date().getFullYear();

  attachScrollHandler();
  attachResizeHandler();
  if (backToProjects) {
    backToProjects.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  updateBackToProjectsVisibility();

  const selectedProjectSlug = getSelectedProjectSlug();
  if (selectedProjectSlug) {
    const projectIndex = yearProjects.findIndex((project) => (
      slugifyProject(project.selectorLabel) === selectedProjectSlug
      || slugifyProject(project.title) === selectedProjectSlug
    ));
    if (projectIndex >= 0) {
      await selectProject(projectIndex);
    }
  }
}

initializeYearPage().catch((error) => {
  projectsSection.classList.remove("is-hidden");
  viewerStatus.classList.add("is-visible");
  viewerStatus.textContent = "Error loading year view";
  projectTitle.textContent = "Could not load year";
  projectMeta.textContent = "";
  projectDescription.textContent = error.message;
});
