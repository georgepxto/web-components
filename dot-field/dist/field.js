export const defaults = {
    gap: 24,
    radius: 140,
    dotSize: 1,
    grow: 3.5,
};
export const readNumber = (value, fallback, min, max) => {
    if (value === null || value === undefined || value.trim() === '')
        return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};
export const grid = (width, height, gap) => {
    if (width <= 0 || height <= 0 || gap <= 0)
        return { columns: 0, rows: 0, x: 0, y: 0 };
    const columns = Math.floor(width / gap) + 1;
    const rows = Math.floor(height / gap) + 1;
    return {
        columns,
        rows,
        x: (width - (columns - 1) * gap) / 2,
        y: (height - (rows - 1) * gap) / 2,
    };
};
export const influence = (distance, radius) => {
    if (radius <= 0 || distance >= radius)
        return 0;
    const t = 1 - Math.max(0, distance) / radius;
    return t * t * (3 - 2 * t);
};
export const dotRadius = (size, grow, strength) => size * (1 + (grow - 1) * strength);
export const activeAlpha = (strength) => 0.3 + 0.7 * Math.min(1, Math.max(0, strength));
