export type Mode = 'reveal' | 'pinned';

export type Layout = Mode | 'list';

const LENGTH = /^\d+(\.\d+)?(px|vh|svh|lvh|dvh|rem|em)$/;

export const pad = (value: number) => String(value).padStart(2, '0');

export const readMode = (value: string | null | undefined): Mode => (value === 'pinned' ? 'pinned' : 'reveal');

export const readStepHeight = (value: string | null | undefined, fallback = '70vh') => {
  const trimmed = value?.trim().toLowerCase();
  return trimmed && LENGTH.test(trimmed) ? trimmed : fallback;
};

export const resolveLayout = (mode: Mode, narrow: boolean, reducedMotion: boolean): Layout =>
  mode === 'pinned' && (narrow || reducedMotion) ? 'list' : mode;

export const scrollProgress = (top: number, height: number, viewport: number) => {
  const distance = height - viewport;
  if (distance <= 0) return top <= 0 ? 1 : 0;
  return Math.min(1, Math.max(0, -top / distance));
};

export const activeIndex = (progress: number, count: number) => {
  if (count <= 0) return -1;
  return Math.min(count - 1, Math.max(0, Math.floor(progress * count)));
};
