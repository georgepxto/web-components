import { type Contributions } from './data.js';
import { type Labels } from './i18n.js';
export type ActivityState = 'loading' | 'ready' | 'error';
declare const Base: typeof HTMLElement;
export declare class GitHubActivity extends Base {
    #private;
    static observedAttributes: string[];
    constructor();
    get data(): Contributions | null;
    set data(value: unknown);
    get labels(): Partial<Labels> | undefined;
    set labels(value: Partial<Labels> | undefined);
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, previous: string | null, value: string | null): void;
    reload(): Promise<void>;
}
declare global {
    interface HTMLElementTagNameMap {
        'github-activity': GitHubActivity;
    }
}
export {};
