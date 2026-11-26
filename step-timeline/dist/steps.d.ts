export type Mode = 'reveal' | 'pinned';
export type Layout = Mode | 'list';
export declare const pad: (value: number) => string;
export declare const readMode: (value: string | null | undefined) => Mode;
export declare const readStepHeight: (value: string | null | undefined, fallback?: string) => string;
export declare const resolveLayout: (mode: Mode, narrow: boolean, reducedMotion: boolean) => Layout;
export declare const scrollProgress: (top: number, height: number, viewport: number) => number;
export declare const activeIndex: (progress: number, count: number) => number;
