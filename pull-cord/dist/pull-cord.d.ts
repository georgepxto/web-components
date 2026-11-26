import { type Labels } from './i18n.js';
import { type Theme } from './theme.js';
export type ThemeSource = 'pull' | 'property' | 'system' | 'storage';
export interface PullDetail {
    theme: Theme;
    previous: Theme;
}
export interface ThemeChangeDetail {
    theme: Theme;
    previous: Theme | null;
    source: ThemeSource;
}
declare const Base: typeof HTMLElement;
export declare class PullCord extends Base {
    #private;
    static observedAttributes: string[];
    constructor();
    get theme(): Theme | null;
    set theme(value: Theme | null);
    get labels(): Partial<Labels> | undefined;
    set labels(value: Partial<Labels> | undefined);
    toggle(): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, previous: string | null, value: string | null): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'pull-cord': PullCord;
    }
}
export {};
