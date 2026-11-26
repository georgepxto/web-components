import { dashOffset, isShown, readShowAfter, readingProgress } from './progress.js';
import { styles } from './styles.js';
const TAG = 'scroll-ring';
const SVG = 'http://www.w3.org/2000/svg';
const DEFAULT_LABEL = 'Voltar ao topo';
const Base = (typeof HTMLElement === 'undefined' ? class {
} : HTMLElement);
let sharedSheet;
const adoptStyles = (shadow) => {
    try {
        if (!sharedSheet) {
            sharedSheet = new CSSStyleSheet();
            sharedSheet.replaceSync(styles);
        }
        shadow.adoptedStyleSheets = [sharedSheet];
    }
    catch {
        const style = document.createElement('style');
        style.textContent = styles;
        shadow.append(style);
    }
};
const svg = (tag, attributes) => {
    const node = document.createElementNS(SVG, tag);
    for (const [name, value] of Object.entries(attributes))
        node.setAttribute(name, value);
    return node;
};
const focusable = (element) => element.matches('a[href], button, input, select, textarea, summary, [tabindex]');
export class ScrollRing extends Base {
    static observedAttributes = ['label', 'show-after'];
    #button;
    #bar;
    #controller;
    #resize;
    #reducedMotion;
    #frame = 0;
    #progress = 0;
    #shown = false;
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        adoptStyles(shadow);
        this.#button = document.createElement('button');
        this.#button.type = 'button';
        this.#button.className = 'button';
        this.#button.setAttribute('part', 'button');
        const ring = svg('svg', { class: 'ring', viewBox: '0 0 48 48', 'aria-hidden': 'true', part: 'ring' });
        ring.append(svg('circle', { class: 'track', cx: '24', cy: '24', r: '23', pathLength: '100' }));
        this.#bar = svg('circle', { class: 'bar', cx: '24', cy: '24', r: '23', pathLength: '100' });
        this.#bar.style.strokeDashoffset = '100';
        ring.append(this.#bar);
        const arrow = svg('svg', { class: 'arrow', viewBox: '0 0 24 24', 'aria-hidden': 'true', part: 'arrow' });
        arrow.append(svg('path', { d: 'm5 12 7-7 7 7' }), svg('path', { d: 'M12 19V5' }));
        this.#button.append(ring, arrow);
        shadow.append(this.#button);
        this.#button.tabIndex = -1;
        this.#button.setAttribute('aria-hidden', 'true');
        this.#renderLabel();
    }
    get progress() {
        return this.#progress;
    }
    connectedCallback() {
        this.#controller?.abort();
        this.#controller = new AbortController();
        const { signal } = this.#controller;
        this.#reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
        this.#button.addEventListener('click', () => this.#toTop(), { signal });
        window.addEventListener('scroll', () => this.#schedule(), { passive: true, signal });
        window.addEventListener('resize', () => this.#schedule(), { passive: true, signal });
        if (typeof ResizeObserver !== 'undefined' && document.body) {
            this.#resize = new ResizeObserver(() => this.#schedule());
            this.#resize.observe(document.body);
        }
        this.#update();
    }
    disconnectedCallback() {
        this.#controller?.abort();
        this.#controller = undefined;
        this.#resize?.disconnect();
        this.#resize = undefined;
        cancelAnimationFrame(this.#frame);
        this.#frame = 0;
    }
    attributeChangedCallback(name, previous, value) {
        if (previous === value)
            return;
        if (name === 'label')
            this.#renderLabel();
        else if (this.isConnected)
            this.#update();
    }
    #renderLabel() {
        const label = this.getAttribute('label') || DEFAULT_LABEL;
        this.#button.setAttribute('aria-label', label);
        this.#button.title = label;
    }
    #schedule() {
        if (this.#frame)
            return;
        this.#frame = requestAnimationFrame(() => {
            this.#frame = 0;
            this.#update();
        });
    }
    #update() {
        const root = document.documentElement;
        const viewport = window.innerHeight;
        const y = window.scrollY;
        this.#progress = readingProgress(y, root.scrollHeight, viewport);
        this.#bar.style.strokeDashoffset = String(dashOffset(this.#progress));
        this.#setShown(isShown(y, viewport, readShowAfter(this.getAttribute('show-after'))));
    }
    #setShown(shown) {
        if (shown === this.#shown)
            return;
        this.#shown = shown;
        this.toggleAttribute('visible', shown);
        this.#button.tabIndex = shown ? 0 : -1;
        if (shown)
            this.#button.removeAttribute('aria-hidden');
        else
            this.#button.setAttribute('aria-hidden', 'true');
    }
    #toTop() {
        const reduced = this.#reducedMotion?.matches ?? false;
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        const selector = this.getAttribute('focus-target');
        let target = null;
        if (selector) {
            try {
                target = document.querySelector(selector);
            }
            catch {
                target = null;
            }
        }
        if (target) {
            if (!focusable(target))
                target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        }
        else {
            this.#button.blur();
        }
    }
}
if (typeof customElements !== 'undefined' && !customElements.get(TAG)) {
    customElements.define(TAG, ScrollRing);
}
