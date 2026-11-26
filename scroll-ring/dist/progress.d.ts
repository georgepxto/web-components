export declare const readingProgress: (scrollY: number, scrollHeight: number, viewportHeight: number) => number;
export declare const dashOffset: (progress: number) => number;
export declare const isShown: (scrollY: number, viewportHeight: number, showAfter: number) => boolean;
export declare const readShowAfter: (value: string | null | undefined, fallback?: number) => number;
