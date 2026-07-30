const LANGUAGE_STORAGE_KEY = "zuz-portfolio-language";
const SUPPORTED_LANGUAGES = new Set(["en", "cs"]);

export function getLanguage() {
  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return SUPPORTED_LANGUAGES.has(storedLanguage) ? storedLanguage : "en";
  } catch {
    return "en";
  }
}

export function getLocalizedText(value, language = getLanguage()) {
  if (typeof value === "string") {
    return value;
  }
  return value?.[language] || value?.en || value?.cs || "";
}

export function getLocalizedProjectText(project, field, language = getLanguage()) {
  if (language === "cs") {
    return project?.translations?.cs?.[field] || project?.[field] || "";
  }
  return project?.[field] || project?.translations?.cs?.[field] || "";
}

export function applyDocumentLanguage(language) {
  document.documentElement.lang = language === "cs" ? "cs" : "en";

  document.querySelectorAll("[data-en][data-cs]").forEach((element) => {
    element.textContent = element.dataset[language] || element.dataset.en || "";
  });

  document.querySelectorAll("[data-language-switch] button").forEach((button) => {
    const isActive = button.dataset.language === language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

export function initLanguageSwitch(onChange) {
  let language = getLanguage();

  const selectLanguage = (nextLanguage, persist = true) => {
    if (!SUPPORTED_LANGUAGES.has(nextLanguage)) {
      return;
    }

    language = nextLanguage;
    if (persist) {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      } catch {
        // The language still changes when storage is unavailable.
      }
    }
    applyDocumentLanguage(language);
    onChange?.(language);
  };

  document.querySelectorAll("[data-language-switch] button").forEach((button) => {
    button.addEventListener("click", () => selectLanguage(button.dataset.language));
  });

  selectLanguage(language, false);
  return () => language;
}
