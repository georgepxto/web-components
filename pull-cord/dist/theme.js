const ATTRIBUTE = /^[a-z_][\w.-]*$/i;
export const isTheme = (value) => value === 'light' || value === 'dark';
export const opposite = (theme) => (theme === 'light' ? 'dark' : 'light');
export const attributeName = (value) => value && ATTRIBUTE.test(value) ? value : 'data-theme';
export const readTheme = (target, attribute) => {
    if (attribute === 'class') {
        if (target.classList.contains('dark'))
            return 'dark';
        if (target.classList.contains('light'))
            return 'light';
        return null;
    }
    const value = target.getAttribute(attribute);
    return isTheme(value) ? value : null;
};
export const writeTheme = (target, attribute, theme) => {
    if (attribute === 'class') {
        target.classList.remove(opposite(theme));
        target.classList.add(theme);
        return;
    }
    target.setAttribute(attribute, theme);
};
export const loadTheme = (key) => {
    try {
        const value = localStorage.getItem(key);
        return isTheme(value) ? value : null;
    }
    catch {
        return null;
    }
};
export const saveTheme = (key, theme) => {
    try {
        localStorage.setItem(key, theme);
    }
    catch { }
};
