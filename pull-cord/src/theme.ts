export type Theme = 'light' | 'dark';

export interface ThemeTarget {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  classList: { contains(token: string): boolean; add(token: string): void; remove(token: string): void };
}

const ATTRIBUTE = /^[a-z_][\w.-]*$/i;

export const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

export const opposite = (theme: Theme): Theme => (theme === 'light' ? 'dark' : 'light');

export const attributeName = (value: string | null | undefined) =>
  value && ATTRIBUTE.test(value) ? value : 'data-theme';

export const readTheme = (target: ThemeTarget, attribute: string): Theme | null => {
  if (attribute === 'class') {
    if (target.classList.contains('dark')) return 'dark';
    if (target.classList.contains('light')) return 'light';
    return null;
  }
  const value = target.getAttribute(attribute);
  return isTheme(value) ? value : null;
};

export const writeTheme = (target: ThemeTarget, attribute: string, theme: Theme) => {
  if (attribute === 'class') {
    target.classList.remove(opposite(theme));
    target.classList.add(theme);
    return;
  }
  target.setAttribute(attribute, theme);
};

export const loadTheme = (key: string): Theme | null => {
  try {
    const value = localStorage.getItem(key);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
};

export const saveTheme = (key: string, theme: Theme) => {
  try {
    localStorage.setItem(key, theme);
  } catch {}
};
