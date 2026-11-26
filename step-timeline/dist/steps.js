const LENGTH = /^\d+(\.\d+)?(px|vh|svh|lvh|dvh|rem|em)$/;
export const pad = (value) => String(value).padStart(2, '0');
export const readMode = (value) => (value === 'pinned' ? 'pinned' : 'reveal');
export const readStepHeight = (value, fallback = '70vh') => {
    const trimmed = value?.trim().toLowerCase();
    return trimmed && LENGTH.test(trimmed) ? trimmed : fallback;
};
export const resolveLayout = (mode, narrow, reducedMotion) => mode === 'pinned' && (narrow || reducedMotion) ? 'list' : mode;
export const scrollProgress = (top, height, viewport) => {
    const distance = height - viewport;
    if (distance <= 0)
        return top <= 0 ? 1 : 0;
    return Math.min(1, Math.max(0, -top / distance));
};
export const activeIndex = (progress, count) => {
    if (count <= 0)
        return -1;
    return Math.min(count - 1, Math.max(0, Math.floor(progress * count)));
};
