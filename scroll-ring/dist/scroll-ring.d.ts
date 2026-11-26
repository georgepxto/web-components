declare const Base: typeof HTMLElement;
export declare class ScrollRing extends Base {
    #private;
    static observedAttributes: string[];
    constructor();
    get progress(): number;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, previous: string | null, value: string | null): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'scroll-ring': ScrollRing;
    }
}
export {};
