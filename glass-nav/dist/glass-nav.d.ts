export interface ActiveChangeDetail {
    id: string | null;
}
declare const Base: typeof HTMLElement;
export declare class GlassNav extends Base {
    #private;
    static observedAttributes: string[];
    constructor();
    get active(): string | null;
    get offset(): number;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, previous: string | null, value: string | null): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'glass-nav': GlassNav;
    }
}
export {};
