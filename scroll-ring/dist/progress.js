export const readingProgress = (scrollY, scrollHeight, viewportHeight) => {
    const scrollable = scrollHeight - viewportHeight;
    if (scrollable <= 0)
        return 0;
    return Math.min(1, Math.max(0, scrollY / scrollable));
};
export const dashOffset = (progress) => 100 - 100 * Math.min(1, Math.max(0, progress));
export const isShown = (scrollY, viewportHeight, showAfter) => scrollY > showAfter * viewportHeight;
export const readShowAfter = (value, fallback = 0.6) => {
    if (value === null || value === undefined || value.trim() === '')
        return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : fallback;
};
