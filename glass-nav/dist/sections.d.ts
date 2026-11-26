export declare const sectionId: (href: string, base: string) => string | null;
export declare const pickActive: (ordered: string[], intersecting: ReadonlySet<string>, atEnd: boolean) => string | null;
export declare const scrollTop: (top: number, scrollY: number, offset: number) => number;
export declare const readOffset: (value: string | null | undefined, fallback?: number) => number;
