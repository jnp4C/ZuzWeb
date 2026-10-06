export function initIndexHeader() {
  const help = document.querySelector('.index-header-help');
  const toggle = document.getElementById('headerHelpToggle');
  const panel = document.getElementById('headerHelpText');
  if (!help || !toggle || !panel) return;
  const hoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let dismissed = false;
  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };
  help.addEventListener('pointerenter', () => {
    dismissed = false;
    if (hoverPointer.matches) setOpen(true);
  });
  help.addEventListener('pointerleave', () => {
    if (hoverPointer.matches && !help.contains(document.activeElement)) setOpen(false);
  });
  help.addEventListener('focusin', () => { if (!dismissed && (hoverPointer.matches || toggle.matches(":focus-visible"))) setOpen(true); });
  help.addEventListener('focusout', (event) => {
    if (!help.contains(event.relatedTarget)) { dismissed = false; setOpen(false); }
  });
  toggle.addEventListener('click', () => {
    if (!hoverPointer.matches) setOpen(panel.hidden);
    else { dismissed = false; setOpen(true); }
  });
  document.addEventListener('pointerdown', (event) => {
    if (!help.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { dismissed = true; setOpen(false); }
  });
}

export function updateSharedHeaderGeometry() {
  const header = document.querySelector(".index-layout-header");
  const title = header?.querySelector("h1");
  const contentScale = parseFloat(getComputedStyle(document.body).getPropertyValue("--index-content-scale")) || 1;
    if (header && title) {
      const fullTitle = title.querySelector(".index-header-full-title");
      const actions = header.querySelector(".index-header-actions");
      const headerStyle = getComputedStyle(header);
      const available = header.clientWidth - parseFloat(headerStyle.paddingLeft) - actions.getBoundingClientRect().width / contentScale - parseFloat(headerStyle.columnGap);
      const compact = fullTitle.getBoundingClientRect().width / contentScale > available;
      header.classList.toggle("is-compact", compact);
      fullTitle.setAttribute("aria-hidden", String(compact));
      title.querySelector(".index-header-short-title").setAttribute("aria-hidden", String(!compact));
      const headerRect = header.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      header.style.setProperty("--header-connector-mask",
        `linear-gradient(to right, #000 ${(titleRect.left - headerRect.left) / contentScale}px, transparent ${(titleRect.left - headerRect.left) / contentScale}px, transparent ${(titleRect.right - headerRect.left) / contentScale}px, #000 ${(titleRect.right - headerRect.left) / contentScale}px)`);
    }

}
export function updateHeaderLanguageToggle(language) {
  const button = document.getElementById("headerLanguageToggle");
  if (!button) return;
  const target = language === "cs" ? "en" : "cs";
  button.dataset.language = target;
  button.textContent = target === "cs" ? "CZ" : "EN";
  button.setAttribute("aria-label", target === "cs" ? "Switch to Czech" : "Přepnout do angličtiny");
  button.removeAttribute("aria-pressed");
  button.classList.remove("is-active");
}
export function initProjectHeader() {
  initIndexHeader();
  const header = document.querySelector(".index-layout-header");
  const observer = new ResizeObserver(updateSharedHeaderGeometry);
  observer.observe(header);
  observer.observe(header.querySelector("h1"));
  observer.observe(header.querySelector(".index-header-actions"));
  document.fonts?.ready.then(updateSharedHeaderGeometry);
  window.addEventListener("resize", updateSharedHeaderGeometry);
  updateSharedHeaderGeometry();
}
