export type Theme = 'light' | 'dark';
export interface ThemeTarget {
    getAttribute(name: string): string | null;
    setAttribute(name: string, value: string): void;
    classList: {
        contains(token: string): boolean;
        add(token: string): void;
        remove(token: string): void;
    };
}
export declare const isTheme: (value: unknown) => value is Theme;
export declare const opposite: (theme: Theme) => Theme;
export declare const attributeName: (value: string | null | undefined) => string;
export declare const readTheme: (target: ThemeTarget, attribute: string) => Theme | null;
export declare const writeTheme: (target: ThemeTarget, attribute: string, theme: Theme) => void;
export declare const loadTheme: (key: string) => Theme | null;
export declare const saveTheme: (key: string, theme: Theme) => void;
