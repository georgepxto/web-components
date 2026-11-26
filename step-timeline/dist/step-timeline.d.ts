import { type Layout } from './steps.js';
export interface StepChangeDetail {
    index: number;
    title: string;
}
declare const Base: typeof HTMLElement;
export declare class StepItem extends Base {
}
export declare class StepTimeline extends Base {
    #private;
    static observedAttributes: string[];
    constructor();
    get layout(): Layout | null;
    get index(): number;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(_name: string, previous: string | null, value: string | null): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'step-timeline': StepTimeline;
        'step-item': StepItem;
    }
}
export {};
