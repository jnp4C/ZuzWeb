export const SITE_SCALE = 1.1;
// DOM rectangles include root zoom; layout calculations need unzoomed coordinates.
export function layoutRect(element) {
  const rect = element.getBoundingClientRect();
  return Object.fromEntries(["x", "y", "left", "right", "top", "bottom", "width", "height"].map(key => [key, rect[key] / SITE_SCALE]));
}
