export type Track = 'host' | 'parent';
declare const Base: typeof HTMLElement;
export declare class DotField extends Base {
    #private;
    static observedAttributes: string[];
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, previous: string | null, value: string | null): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'dot-field': DotField;
    }
}
export {};
