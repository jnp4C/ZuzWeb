import {
  getLanguage,
  getLocalizedProjectText,
  getLocalizedText,
  initLanguageSwitch,
} from "./language.js";
import { applyCuratedProjectMedia } from "./project-media.js?v=2026-08-02-revodalizace-update";

const DATA_CACHE_VERSION = "2026-08-14-real-project-content-downloads";
const BACKGROUND_CACHE_VERSION = "2026-07-30-concise-project-transition";
const BACKGROUND_STORAGE_KEY = "zuz-active-background-src";
const DEFAULT_BACKGROUND_SRC = "./assets/Background/smoothed/contours.svg";
const KLADNO_BACKGROUND_SRC = "./assets/Background/smoothed/contours-kladno.svg";
const AVAILABLE_BACKGROUND_SRCS = new Set([
  DEFAULT_BACKGROUND_SRC,
  "./assets/Background/smoothed/contours-semnevice.svg",
  "./assets/Background/smoothed/contours-Praha-stresovice.svg",
  KLADNO_BACKGROUND_SRC,
  "./assets/Background/smoothed/contours-growing.svg",
  "./assets/Background/smoothed/contours-abstract.svg",
]);
const projectRoot = document.getElementById("conciseProject");
const projectLanguageSwitch = document.querySelector(".concise-project-page > .language-switch");
const backgroundAnimation = document.querySelector(".concise-project-background");
const signatureAnimation = document.querySelector(".signature-animation");
const signatureNameplate = signatureAnimation?.closest(".signature-nameplate");
const SIGNATURE_COMPLETE_STORAGE_KEY = "zuz-signature-animation-complete-v2";
let activeLanguage = getLanguage();
let activeProject = null;
let navigableProjects = [];
let carouselCleanups = [];

const COPY = {
  en: {
    back: "Back to projects",
    info: "Info",
    year: "Year",
    scale: "Scale",
    processing: "Processing",
    type: "Type",
    collaborators: "Collaborators",
    awards: "Awards",
    annotation: "Annotation",
    fullPresentation: "Full presentation",
    previousImage: "Previous image",
    nextImage: "Next image",
    openImage: "Open enlarged image",
    closeImage: "Close enlarged image",
    imageViewer: "Project image viewer",
    previousProject: "Previous project",
    nextProject: "Next project",
    unavailable: "This project page is not available.",
  },
  cs: {
    back: "Zpět na projekty",
    info: "Info",
    year: "Rok",
    scale: "Měřítko",
    processing: "Zpracování",
    type: "Typ",
    collaborators: "Spoluautoři",
    awards: "Ocenění",
    annotation: "Anotace",
    fullPresentation: "Celá prezentace",
    previousImage: "Předchozí obrázek",
    nextImage: "Další obrázek",
    openImage: "Otevřít zvětšený obrázek",
    closeImage: "Zavřít zvětšený obrázek",
    imageViewer: "Prohlížeč obrázků projektu",
    previousProject: "Předchozí projekt",
    nextProject: "Další projekt",
    unavailable: "Tato projektová stránka není dostupná.",
  },
};

function initializeSignatureAnimation() {
  if (!signatureAnimation) {
    return;
  }

  const showFinalPoster = () => {
    signatureAnimation.pause();
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

  signatureAnimation.addEventListener("ended", showFinalPoster, { once: true });
  void signatureAnimation.play().catch(() => {
    showFinalPoster();
  });
}

function getStoredBackgroundSrc() {
  try {
    const storedBackgroundSrc = window.sessionStorage.getItem(BACKGROUND_STORAGE_KEY);
    return AVAILABLE_BACKGROUND_SRCS.has(storedBackgroundSrc) ? storedBackgroundSrc : DEFAULT_BACKGROUND_SRC;
  } catch {
    return DEFAULT_BACKGROUND_SRC;
  }
}

function persistBackgroundSrc(src) {
  try {
    window.sessionStorage.setItem(BACKGROUND_STORAGE_KEY, src);
  } catch {
    // The transition remains functional when storage is unavailable.
  }
}

async function loadBackgroundSvg(src) {
  const delimiter = src.includes("?") ? "&" : "?";
  const response = await fetch(`${src}${delimiter}bg=${BACKGROUND_CACHE_VERSION}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load background: ${src}`);
  }

  const parser = new DOMParser();
  const svgDocument = parser.parseFromString(await response.text(), "image/svg+xml");
  const sourceSvg = svgDocument.documentElement;
  if (!sourceSvg || sourceSvg.nodeName.toLowerCase() !== "svg") {
    throw new Error(`Invalid background SVG: ${src}`);
  }

  const svg = document.importNode(sourceSvg, true);
  svg.querySelector("#background-contour-animation")?.remove();
  svg.querySelectorAll("polyline, path").forEach((contour, index) => {
    contour.setAttribute("pathLength", "1");
    contour.style.setProperty("--contour-delay", `${Math.min(index * 0.035, 2.4)}s`);
  });
  svg.classList.add("background-animation-lines");
  svg.style.setProperty("--contour-drift-delay", `${-(performance.now() / 1000)}s`);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  return svg;
}

async function initializeBackgroundTransition() {
  if (!backgroundAnimation) {
    return;
  }

  const previousSrc = getStoredBackgroundSrc();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  try {
    const [previousBackground, projectBackground] = await Promise.all([
      loadBackgroundSvg(previousSrc),
      loadBackgroundSvg(KLADNO_BACKGROUND_SRC),
    ]);
    persistBackgroundSrc(KLADNO_BACKGROUND_SRC);

    if (reducedMotion) {
      projectBackground.classList.add("is-static");
      backgroundAnimation.replaceChildren(projectBackground);
      return;
    }

    previousBackground.classList.add("is-static");
    backgroundAnimation.replaceChildren(previousBackground);
    void previousBackground.getBoundingClientRect();

    window.requestAnimationFrame(() => {
      previousBackground.classList.remove("is-static");
      void previousBackground.getBoundingClientRect();
      previousBackground.classList.add("is-undrawing");
    });

    window.setTimeout(() => {
      projectBackground.classList.add("is-redrawing");
      backgroundAnimation.replaceChildren(projectBackground);
      window.setTimeout(() => {
        projectBackground.classList.remove("is-redrawing");
      }, 1800);
      window.setTimeout(() => {
        if (projectBackground.isConnected && !projectBackground.classList.contains("is-undrawing")) {
          projectBackground.classList.add("is-static");
        }
      }, 12500);
    }, 1160);
  } catch {
    // Project content remains usable if a contour asset cannot be loaded.
  }
}

function createImage(media, className = "") {
  const image = document.createElement("img");
  image.className = className;
  image.src = media.src;
  if (media.srcset) {
    image.srcset = media.srcset;
  }
  image.sizes = "(max-width: 760px) 94vw, 72vw";
  image.alt = getLocalizedText(media.alt, activeLanguage);
  image.loading = "lazy";
  image.decoding = "async";
  return image;
}

function openImageLightbox(mediaItems, initialIndex) {
  let activeIndex = initialIndex;
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let pinchDistance = 0;
  let pinchScale = 1;
  const pointers = new Map();

  const dialog = document.createElement("dialog");
  dialog.className = "project-image-lightbox";
  dialog.setAttribute("aria-label", COPY[activeLanguage].imageViewer);
  const stage = document.createElement("div");
  stage.className = "project-image-lightbox-stage";
  const image = document.createElement("img");
  image.draggable = false;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "project-image-lightbox-close";
  close.textContent = "×";
  close.setAttribute("aria-label", COPY[activeLanguage].closeImage);
  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "project-image-lightbox-nav project-image-lightbox-nav--previous";
  previous.textContent = "‹";
  previous.setAttribute("aria-label", COPY[activeLanguage].previousImage);
  const next = document.createElement("button");
  next.type = "button";
  next.className = "project-image-lightbox-nav project-image-lightbox-nav--next";
  next.textContent = "›";
  next.setAttribute("aria-label", COPY[activeLanguage].nextImage);
  previous.hidden = mediaItems.length < 2;
  next.hidden = mediaItems.length < 2;
  const counter = document.createElement("span");
  counter.className = "project-image-lightbox-counter";
  counter.setAttribute("aria-live", "polite");

  const applyTransform = () => {
    image.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
  };
  const resetTransform = () => {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  };
  const renderMedia = () => {
    const media = mediaItems[activeIndex];
    image.src = media.src;
    image.srcset = media.srcset || "";
    image.alt = getLocalizedText(media.alt, activeLanguage);
    counter.textContent = `${activeIndex + 1} / ${mediaItems.length}`;
    resetTransform();
  };
  const changeMedia = (direction) => {
    activeIndex = (activeIndex + direction + mediaItems.length) % mediaItems.length;
    renderMedia();
  };
  const closeLightbox = () => dialog.close();
  const onKeydown = (event) => {
    if (event.key === "ArrowLeft") changeMedia(-1);
    if (event.key === "ArrowRight") changeMedia(1);
  };

  close.addEventListener("click", closeLightbox);
  previous.addEventListener("click", () => changeMedia(-1));
  next.addEventListener("click", () => changeMedia(1));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeLightbox();
  });
  dialog.addEventListener("close", () => {
    document.removeEventListener("keydown", onKeydown);
    dialog.remove();
  });
  document.addEventListener("keydown", onKeydown);

  image.addEventListener("dblclick", resetTransform);
  image.addEventListener("wheel", (event) => {
    event.preventDefault();
    scale = Math.min(5, Math.max(1, scale * (event.deltaY < 0 ? 1.15 : 0.87)));
    if (scale === 1) {
      translateX = 0;
      translateY = 0;
    }
    applyTransform();
  }, { passive: false });
  image.addEventListener("pointerdown", (event) => {
    image.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [first, second] = Array.from(pointers.values());
      pinchDistance = Math.hypot(second.x - first.x, second.y - first.y);
      pinchScale = scale;
    }
  });
  image.addEventListener("pointermove", (event) => {
    const previousPoint = pointers.get(event.pointerId);
    if (!previousPoint) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [first, second] = Array.from(pointers.values());
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      scale = Math.min(5, Math.max(1, pinchScale * (distance / Math.max(1, pinchDistance))));
    } else if (scale > 1) {
      translateX += event.clientX - previousPoint.x;
      translateY += event.clientY - previousPoint.y;
    }
    applyTransform();
  });
  const releasePointer = (event) => pointers.delete(event.pointerId);
  image.addEventListener("pointerup", releasePointer);
  image.addEventListener("pointercancel", releasePointer);

  stage.append(image);
  dialog.append(stage, close, previous, next, counter);
  document.body.append(dialog);
  renderMedia();
  dialog.showModal();
  close.focus();
}

function createMediaCarousel(mediaItems, label) {
  const figure = document.createElement("figure");
  figure.className = "concise-project-carousel";
  const viewport = document.createElement("div");
  viewport.className = "concise-project-carousel-viewport";
  figure.append(viewport);

  const slides = mediaItems.map((media, index) => {
    const image = createImage(media, "concise-project-carousel-slide");
    if (index === 0) {
      image.loading = "eager";
    }
    image.classList.toggle("is-active", index === 0);
    image.setAttribute("aria-hidden", String(index !== 0));
    viewport.append(image);
    return image;
  });
  const setInitialViewportRatio = (image) => {
    const applyRatio = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        viewport.style.aspectRatio = `${image.naturalWidth} / ${image.naturalHeight}`;
      }
    };
    if (image.complete) {
      applyRatio();
    } else {
      image.addEventListener("load", applyRatio, { once: true });
    }
  };
  setInitialViewportRatio(slides[0]);
  let activeIndex = 0;
  let isAnimating = false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const moveToSlide = (nextIndex, direction = 1) => {
    if (isAnimating || nextIndex === activeIndex) {
      return;
    }
    const outgoingSlide = slides[activeIndex];
    const incomingSlide = slides[nextIndex];
    const incomingOffset = direction > 0 ? "100%" : "-100%";
    const outgoingOffset = direction > 0 ? "-100%" : "100%";
    const duration = reducedMotion ? 0 : 850;

    isAnimating = true;
    incomingSlide.classList.add("is-active");
    incomingSlide.setAttribute("aria-hidden", "false");
    const outgoingAnimation = outgoingSlide.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(${outgoingOffset})` }],
      { duration, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" },
    );
    incomingSlide.animate(
      [{ transform: `translateX(${incomingOffset})` }, { transform: "translateX(0)" }],
      { duration, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" },
    );

    activeIndex = nextIndex;
    counter.textContent = `${activeIndex + 1} / ${mediaItems.length}`;
    outgoingAnimation.finished.finally(() => {
      outgoingSlide.classList.remove("is-active");
      outgoingSlide.setAttribute("aria-hidden", "true");
      slides.forEach((slide) => slide.getAnimations().forEach((animation) => animation.cancel()));
      isAnimating = false;
    });
  };

  const controls = document.createElement("div");
  controls.className = "concise-project-carousel-controls";
  const previous = document.createElement("button");
  previous.type = "button";
  previous.textContent = "‹";
  previous.setAttribute("aria-label", COPY[activeLanguage].previousImage);
  const counter = document.createElement("span");
  counter.setAttribute("aria-live", "polite");
  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "›";
  next.setAttribute("aria-label", COPY[activeLanguage].nextImage);

  previous.addEventListener("click", () => {
    moveToSlide((activeIndex - 1 + mediaItems.length) % mediaItems.length, -1);
  });
  next.addEventListener("click", () => {
    moveToSlide((activeIndex + 1) % mediaItems.length, 1);
  });

  controls.append(previous, counter, next);
  if (mediaItems.length > 1) {
    figure.append(controls);
    figure.setAttribute("aria-label", label);
    viewport.classList.add("is-clickable");
    viewport.tabIndex = 0;
    viewport.setAttribute("role", "button");
    viewport.setAttribute("aria-label", COPY[activeLanguage].openImage);
    viewport.addEventListener("click", () => {
      openImageLightbox(mediaItems, activeIndex);
    });
    viewport.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openImageLightbox(mediaItems, activeIndex);
      }
    });
  } else {
    viewport.classList.add("is-clickable");
    viewport.tabIndex = 0;
    viewport.setAttribute("role", "button");
    viewport.setAttribute("aria-label", COPY[activeLanguage].openImage);
    viewport.addEventListener("click", () => openImageLightbox(mediaItems, 0));
    viewport.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openImageLightbox(mediaItems, 0);
      }
    });
  }
  counter.textContent = `1 / ${mediaItems.length}`;
  return figure;
}

function connectSectionToFrame(section, figure) {
  const updateConnector = () => {
    if (!section.isConnected || !figure.isConnected) {
      return;
    }
    const sectionRect = section.getBoundingClientRect();
    const figureRect = figure.getBoundingClientRect();
    const heading = section.querySelector("h2");
    const headingWidth = heading?.getBoundingClientRect().width || 0;
    const project = section.closest(".concise-project");
    const spineX = project
      ? Number.parseFloat(getComputedStyle(project).getPropertyValue("--project-spine-x")) || 0
      : 0;
    section.style.setProperty(
      "--feature-label-clearance",
      `${headingWidth + Math.max(16, spineX * 0.45)}px`,
    );
    const connectorMeetsTop = window.matchMedia("(max-width: 760px)").matches;
    section.style.setProperty(
      "--feature-connector-top",
      `${figureRect.top - sectionRect.top + (connectorMeetsTop ? 0 : figureRect.height / 2)}px`,
    );
    section.style.setProperty(
      "--feature-connector-width",
      `${Math.max(0, figureRect.left - sectionRect.left - spineX + 2)}px`,
    );
  };

  const observer = new ResizeObserver(updateConnector);
  observer.observe(section);
  observer.observe(figure);
  carouselCleanups.push(() => observer.disconnect());
  window.requestAnimationFrame(updateConnector);
}

function createFact(label, value, placement = "left", order = 0) {
  const row = document.createElement("div");
  row.className = `concise-project-fact concise-project-fact--${placement}`;
  row.style.setProperty("--fact-order", `${order}`);
  const term = document.createElement("dt");
  term.textContent = `[ ${label} ]`;
  const description = document.createElement("dd");
  description.textContent = value;
  row.append(term, description);
  return row;
}

function createReferenceFact(reference, language, order) {
  const row = createFact(
    getLocalizedText(reference.label, language),
    getLocalizedText(reference.text, language),
    "left",
    order,
  );
  row.classList.add("concise-project-fact--reference");
  if (reference.href) {
    const description = row.querySelector("dd");
    const link = document.createElement("a");
    link.href = reference.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = description.textContent;
    description.replaceChildren(link);
  }
  return row;
}

function getProjectUrl(project) {
  if (project.projectPage?.layout === "concise") {
    return `./project.html?project=${encodeURIComponent(project.slug)}`;
  }
  return `./year.html?year=${encodeURIComponent(project.year)}&project=${encodeURIComponent(project.slug)}`;
}

function createProjectNavigationLink(project, direction, label) {
  const link = document.createElement("a");
  link.className = `concise-project-symbol concise-project-nav-link concise-project-nav-link--${direction}`;
  link.href = getProjectUrl(project);
  link.setAttribute("aria-label", label);
  const triangles = document.createElement("span");
  triangles.className = "concise-project-nav-triangles";
  triangles.setAttribute("aria-hidden", "true");
  triangles.append(document.createElement("i"), document.createElement("i"));
  link.append(triangles);
  return link;
}

function getMigratedMedia(project) {
  const seenSources = new Set();
  return (project.scenes || []).flatMap((scene) => scene.objects || [])
    .filter((item) => {
      if (!item.src || seenSources.has(item.src)) {
        return false;
      }
      seenSources.add(item.src);
      return true;
    })
    .map((item) => ({
      src: item.src,
      srcset: item.srcset || "",
      alt: {
        en: `${getLocalizedProjectText(project, "title", "en")} — selected project view`,
        cs: `${getLocalizedProjectText(project, "title", "cs")} — vybraný pohled na projekt`,
      },
    }));
}

function getConcisePage(project) {
  const page = project.projectPage;
  const hasCuratedHero = Boolean(page.hero?.media?.src);
  const hasCuratedSections = (page.featuredSections || [])
    .some((section) => (section.media || []).length > 0);
  if (hasCuratedHero || hasCuratedSections) {
    return page;
  }

  const media = getMigratedMedia(project);
  if (media.length === 0) {
    return page;
  }

  const sectionLabels = [
    { en: "Selected views I", cs: "Vybrané pohledy I" },
    { en: "Selected views II", cs: "Vybrané pohledy II" },
    { en: "Selected views III", cs: "Vybrané pohledy III" },
  ];
  const remainingMedia = media.slice(1, 7);
  return {
    ...page,
    hero: { ...page.hero, media: media[0] },
    featuredSections: sectionLabels.map((label, index) => ({
      id: `migrated-selection-${index + 1}`,
      kind: "graphic",
      label,
      media: remainingMedia.slice(index * 2, (index * 2) + 2),
    })),
  };
}

function getMediaIdentity(media) {
  const source = media?.src || "";
  if (!source) return "";
  return source
    .split("?")[0]
    .split("/")
    .pop()
    .replace(/-(?:\d{3,4}|small|medium|large)(?=\.[^.]+$)/i, "")
    .toLowerCase();
}

function moveCoverDuplicatesBehindCarouselStart(page, project) {
  const coverIdentities = new Set([
    getMediaIdentity(page.hero?.media),
    getMediaIdentity(project.index?.image),
  ].filter(Boolean));

  if (coverIdentities.size === 0) return page;

  return {
    ...page,
    featuredSections: (page.featuredSections || []).map((section) => {
      const media = [...(section.media || [])];
      if (media.length === 0 || !coverIdentities.has(getMediaIdentity(media[0]))) {
        return section;
      }
      return {
        ...section,
        media: media.length > 1 ? [...media.slice(1), media[0]] : [],
      };
    }),
  };
}

function renderProject(animateFacts = false) {
  if (!activeProject || !projectRoot) {
    return;
  }

  carouselCleanups.forEach((cleanup) => cleanup());
  carouselCleanups = [];

  const copy = COPY[activeLanguage];
  const title = getLocalizedProjectText(activeProject, "title", activeLanguage);
  const annotation = getLocalizedProjectText(activeProject, "annotation", activeLanguage);
  const page = moveCoverDuplicatesBehindCarouselStart(
    getConcisePage(activeProject),
    activeProject,
  );
  const info = page.info;
  const hero = page.hero?.media;
  const fullPresentationUrl = `./year.html?year=${encodeURIComponent(activeProject.year)}&project=${encodeURIComponent(activeProject.slug)}`;

  document.title = `${title} | Zuzana Purmová`;
  projectRoot.replaceChildren();

  const article = document.createElement("article");
  article.className = "concise-project";
  article.classList.toggle("skip-fact-intro", !animateFacts);

  const heading = document.createElement("header");
  heading.className = "concise-project-heading";
  const back = document.createElement("a");
  back.className = "concise-project-symbol concise-project-symbol--star concise-project-back";
  back.href = "./index.html";
  back.textContent = "∗";
  back.setAttribute("aria-label", copy.back);
  back.addEventListener("click", () => {
    try {
      window.sessionStorage.setItem(SIGNATURE_COMPLETE_STORAGE_KEY, "1");
    } catch {
      // Navigation still works when storage is unavailable.
    }
  });
  const name = document.createElement("h1");
  name.textContent = title;
  const activeNavigationIndex = navigableProjects.findIndex((project) => project.slug === activeProject.slug);
  const previousProject = navigableProjects[
    (activeNavigationIndex - 1 + navigableProjects.length) % navigableProjects.length
  ];
  const nextProject = navigableProjects[(activeNavigationIndex + 1) % navigableProjects.length];
  const projectNavigation = document.createElement("nav");
  projectNavigation.className = "concise-project-nav";
  projectNavigation.setAttribute("aria-label", `${copy.previousProject} / ${copy.nextProject}`);
  if (projectLanguageSwitch) {
    projectNavigation.append(projectLanguageSwitch);
  }
  projectNavigation.append(
    createProjectNavigationLink(previousProject, "previous", copy.previousProject),
    createProjectNavigationLink(nextProject, "next", copy.nextProject),
  );
  heading.append(back, name, projectNavigation);

  let navigationFrame;
  const updateFloatingNavigation = () => {
    window.cancelAnimationFrame(navigationFrame);
    navigationFrame = window.requestAnimationFrame(() => {
      const floatingTop = Math.max(14, window.innerWidth * 0.025);
      const articleBounds = article.getBoundingClientRect();
      const spineX = Number.parseFloat(
        window.getComputedStyle(article).getPropertyValue("--project-spine-x"),
      ) || 0;
      const backWidth = back.getBoundingClientRect().width;
      article.style.setProperty(
        "--project-floating-star-left",
        `${articleBounds.left + spineX - (backWidth / 2)}px`,
      );
      article.classList.toggle(
        "is-project-nav-floating",
        heading.getBoundingClientRect().bottom <= floatingTop,
      );
    });
  };
  window.addEventListener("scroll", updateFloatingNavigation, { passive: true });
  window.addEventListener("resize", updateFloatingNavigation);
  carouselCleanups.push(() => {
    window.cancelAnimationFrame(navigationFrame);
    window.removeEventListener("scroll", updateFloatingNavigation);
    window.removeEventListener("resize", updateFloatingNavigation);
  });
  updateFloatingNavigation();

  const intro = document.createElement("div");
  intro.className = "concise-project-intro";
  const textColumn = document.createElement("div");
  textColumn.className = "concise-project-intro-copy";
  const facts = document.createElement("dl");
  facts.className = "concise-project-facts";
  facts.append(
    createFact(copy.year, String(info.year), "left", 0),
    createFact(copy.scale, getLocalizedText(info.scale, activeLanguage), "left", 1),
    createFact(copy.processing, getLocalizedText(info.processing, activeLanguage), "left", 2),
    createFact(copy.type, getLocalizedText(info.type, activeLanguage), "left", 3),
  );
  if (Array.isArray(info.collaborators) && info.collaborators.length > 0) {
    facts.append(createFact(copy.collaborators, info.collaborators.join(", "), "left", 4));
  }
  if (Array.isArray(page.references)) {
    page.references.forEach((reference, index) => {
      facts.append(createReferenceFact(reference, activeLanguage, 5 + index));
    });
  }
  if (Array.isArray(page.awards) && page.awards.length > 0) {
    const awards = page.awards
      .map((award) => getLocalizedText(award.detail || award, activeLanguage))
      .filter(Boolean);
    if (awards.length > 0) {
      const referenceCount = Array.isArray(page.references) ? page.references.length : 0;
      const awardsFact = createFact(copy.awards, awards.join(" · "), "left", 5 + referenceCount);
      awardsFact.classList.add("concise-project-fact--awards");
      awardsFact.querySelector("dt").textContent = copy.awards;
      facts.append(awardsFact);
    }
  }
  const infoBlock = document.createElement("section");
  infoBlock.className = "concise-project-info-block";
  const infoHeading = document.createElement("h2");
  infoHeading.className = "concise-project-spine-label";
  infoHeading.textContent = copy.info;
  infoBlock.append(infoHeading, facts);

  const annotationBlock = document.createElement("section");
  annotationBlock.className = "concise-project-annotation";
  const annotationHeading = document.createElement("h2");
  annotationHeading.className = "concise-project-spine-label";
  annotationHeading.textContent = copy.annotation;
  const annotationText = document.createElement("p");
  annotationText.textContent = annotation;
  annotationBlock.append(annotationHeading, annotationText);
  textColumn.append(infoBlock);
  if (annotation || page.intro?.showAnnotation !== false) {
    textColumn.append(annotationBlock);
  }

  const heroFigure = document.createElement("figure");
  heroFigure.className = "concise-project-hero";
  if (hero) {
    const heroImage = createImage(hero);
    heroImage.loading = "eager";
    heroFigure.append(heroImage);
    heroFigure.classList.add("is-clickable");
    heroFigure.tabIndex = 0;
    heroFigure.setAttribute("role", "button");
    heroFigure.setAttribute("aria-label", copy.openImage);
    heroFigure.addEventListener("click", () => openImageLightbox([hero], 0));
    heroFigure.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openImageLightbox([hero], 0);
      }
    });
  }
  intro.append(textColumn);
  if (hero) {
    intro.append(heroFigure);
  } else {
    intro.classList.add("concise-project-intro--without-hero");
  }

  const featured = document.createElement("div");
  featured.className = "concise-project-featured";
  page.featuredSections.forEach((section, index) => {
    const mediaItems = section.media || [];
    if (mediaItems.length === 0) {
      return;
    }
    const block = document.createElement("section");
    block.className = `concise-project-section concise-project-section--${section.kind}`;
    block.style.setProperty("--section-order", `${index}`);
    const sectionHeading = document.createElement("h2");
    const localizedSectionLabel = getLocalizedText(section.label, activeLanguage);
    sectionHeading.textContent = localizedSectionLabel;
    const figure = createMediaCarousel(mediaItems, localizedSectionLabel);
    block.append(sectionHeading, figure);
    featured.append(block);
    connectSectionToFrame(block, figure);
  });

  const footer = document.createElement("footer");
  footer.className = "concise-project-footer";
  const hasEmbeddedPresentation = page.fullPresentation?.enabled
    && (activeProject.scenes || []).length > 0;
  const presentationDownload = page.fullPresentation?.download;
  const hasPresentationContent = page.fullPresentation?.enabled
    && (hasEmbeddedPresentation || Boolean(presentationDownload?.href));
  footer.hidden = !hasPresentationContent;
  const presentation = document.createElement("button");
  presentation.type = "button";
  presentation.setAttribute("aria-expanded", "false");
  presentation.setAttribute("aria-controls", "embeddedFullPresentation");
  const plus = document.createElement("span");
  plus.className = "concise-project-symbol";
  plus.setAttribute("aria-hidden", "true");
  plus.textContent = "+";
  const presentationLabel = document.createElement("span");
  presentationLabel.textContent = getLocalizedText(page.fullPresentation?.label, activeLanguage)
    || copy.fullPresentation;
  presentation.append(plus, presentationLabel);
  if (hasPresentationContent) {
    footer.append(presentation);
  }

  if (presentationDownload?.href) {
    const download = document.createElement("a");
    download.className = "concise-project-pdf-download";
    download.href = presentationDownload.href;
    download.download = "";
    download.textContent = getLocalizedText(presentationDownload.label, activeLanguage)
      || "Download PDF";
    download.setAttribute("aria-hidden", "true");
    download.tabIndex = -1;
    footer.append(download);
  }

  const fullPresentation = document.createElement("section");
  fullPresentation.id = "embeddedFullPresentation";
  fullPresentation.className = "concise-project-full-presentation";
  fullPresentation.hidden = true;
  let presentationFrame = null;
  if (hasEmbeddedPresentation) {
    presentationFrame = document.createElement("iframe");
    presentationFrame.title = copy.fullPresentation;
    presentationFrame.loading = "lazy";
    presentationFrame.dataset.src = `${fullPresentationUrl}&embedded=1`;
    fullPresentation.append(presentationFrame);
  } else {
    fullPresentation.classList.add("concise-project-full-presentation--download-only");
  }

  const scrollToPresentation = () => {
    fullPresentation.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  presentationFrame?.addEventListener("load", () => {
    if (presentation.getAttribute("aria-expanded") === "true") {
      presentationFrame.contentWindow?.postMessage(
        { type: "restart-embedded-first-scene" },
        window.location.origin,
      );
      scrollToPresentation();
    }
  });

  let presentationCloseTimer;
  presentation.addEventListener("click", () => {
    const shouldOpen = presentation.getAttribute("aria-expanded") !== "true";
    presentation.setAttribute("aria-expanded", String(shouldOpen));
    plus.textContent = shouldOpen ? "−" : "+";
    window.clearTimeout(presentationCloseTimer);
    if (shouldOpen) {
      footer.classList.add("is-presentation-open");
      const download = footer.querySelector(".concise-project-pdf-download");
      download?.setAttribute("aria-hidden", "false");
      if (download) download.tabIndex = 0;
      fullPresentation.hidden = false;
      fullPresentation.classList.remove("is-closing");
      window.requestAnimationFrame(() => fullPresentation.classList.add("is-open"));
    } else {
      footer.classList.remove("is-presentation-open");
      const download = footer.querySelector(".concise-project-pdf-download");
      download?.setAttribute("aria-hidden", "true");
      if (download) download.tabIndex = -1;
      fullPresentation.classList.remove("is-open");
      fullPresentation.classList.add("is-closing");
      presentationCloseTimer = window.setTimeout(() => {
        fullPresentation.hidden = true;
        fullPresentation.classList.remove("is-closing");
      }, 460);
    }
    if (shouldOpen && presentationFrame && !presentationFrame.hasAttribute("src")) {
      presentationFrame.src = presentationFrame.dataset.src;
    }
    if (shouldOpen) {
      window.requestAnimationFrame(scrollToPresentation);
    }
  });

  article.append(heading, intro, featured, footer, fullPresentation);
  projectRoot.append(article);
}

async function initializeProject() {
  const slug = new URLSearchParams(window.location.search).get("project") || "";
  const response = await fetch(`./data/projects.json?v=${DATA_CACHE_VERSION}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load project data.");
  }
  const projects = applyCuratedProjectMedia(await response.json());
  navigableProjects = projects
    .filter((project) => project.visibility !== "unpublished")
    .sort((left, right) => {
      const sectionDifference = (left.portfolioSection === "study" ? 0 : 1)
        - (right.portfolioSection === "study" ? 0 : 1);
      return sectionDifference || (left.index?.order ?? 999) - (right.index?.order ?? 999);
    });
  activeProject = projects.find((project) => project.slug === slug && project.projectPage?.layout === "concise");
  if (!activeProject) {
    projectRoot.textContent = COPY[activeLanguage].unavailable;
    return;
  }
  renderProject(true);
}

initLanguageSwitch((language) => {
  activeLanguage = language;
  if (activeProject) {
    renderProject(false);
  }
});

void initializeBackgroundTransition();
initializeSignatureAnimation();

initializeProject().catch(() => {
  projectRoot.textContent = COPY[activeLanguage].unavailable;
});
