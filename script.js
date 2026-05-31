const yearPicker = document.getElementById("yearPicker");
const yearLabel = document.getElementById("year");
const personalToggle = document.getElementById("personalToggle");
const personalDetails = document.getElementById("personalDetails");
const DATA_CACHE_VERSION = "2026-05-23-abstract-scenes";

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
