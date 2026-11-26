export interface FieldOptions {
    gap: number;
    radius: number;
    dotSize: number;
    grow: number;
}
export interface Grid {
    columns: number;
    rows: number;
    x: number;
    y: number;
}
export declare const defaults: FieldOptions;
export declare const readNumber: (value: string | null | undefined, fallback: number, min: number, max: number) => number;
export declare const grid: (width: number, height: number, gap: number) => Grid;
export declare const influence: (distance: number, radius: number) => number;
export declare const dotRadius: (size: number, grow: number, strength: number) => number;
export declare const activeAlpha: (strength: number) => number;
