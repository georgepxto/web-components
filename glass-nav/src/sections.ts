export const sectionId = (href: string, base: string): string | null => {
  let url: URL;
  let page: URL;
  try {
    url = new URL(href, base);
    page = new URL(base);
  } catch {
    return null;
  }
  if (url.origin !== page.origin || url.pathname !== page.pathname || url.search !== page.search) return null;
  if (url.hash.length < 2) return null;
  try {
    return decodeURIComponent(url.hash.slice(1));
  } catch {
    return null;
  }
};

export const pickActive = (ordered: string[], intersecting: ReadonlySet<string>, atEnd: boolean): string | null => {
  if (atEnd && ordered.length) return ordered[ordered.length - 1];
  for (let index = ordered.length - 1; index >= 0; index--) {
    if (intersecting.has(ordered[index])) return ordered[index];
  }
  return null;
};

export const scrollTop = (top: number, scrollY: number, offset: number) => Math.max(0, Math.round(top + scrollY - offset));

export const readOffset = (value: string | null | undefined, fallback = 88) => {
  if (value === null || value === undefined || value.trim() === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
};
