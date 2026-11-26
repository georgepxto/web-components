import { activeIndex, pad, readMode, readStepHeight, resolveLayout, scrollProgress } from './steps.js';
import { styles } from './styles.js';
const TAG = 'step-timeline';
const ITEM_TAG = 'step-item';
const NARROW = '(max-width: 767.98px)';
const REVEAL_THRESHOLD = 0.35;
const FADE_OUT = 140;
const FADE_IN = 260;
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
const element = (tag, className, part) => {
    const node = document.createElement(tag);
    node.className = className;
    if (part)
        node.setAttribute('part', part);
    return node;
};
export class StepItem extends Base {
}
export class StepTimeline extends Base {
    static observedAttributes = ['mode', 'step-height'];
    #root;
    #steps = [];
    #layout = null;
    #controller;
    #mutation;
    #intersection;
    #narrow;
    #reducedMotion;
    #frame = 0;
    #near = false;
    #index = -1;
    #token = 0;
    #fade = [];
    #stage = null;
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        adoptStyles(shadow);
        this.#root = element('div', 'root');
        shadow.append(this.#root);
    }
    get layout() {
        return this.#layout;
    }
    get index() {
        return this.#index;
    }
    connectedCallback() {
        this.#controller?.abort();
        this.#controller = new AbortController();
        const { signal } = this.#controller;
        this.#narrow = matchMedia(NARROW);
        this.#reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
        this.#narrow.addEventListener('change', () => this.#render(), { signal });
        this.#reducedMotion.addEventListener('change', () => this.#render(), { signal });
        window.addEventListener('scroll', () => this.#schedule(), { passive: true, signal });
        window.addEventListener('resize', () => this.#schedule(), { passive: true, signal });
        this.#mutation = new MutationObserver(() => this.#render());
        this.#mutation.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title'] });
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.#render(), { once: true, signal });
        }
        this.#render();
    }
    disconnectedCallback() {
        this.#controller?.abort();
        this.#controller = undefined;
        this.#mutation?.disconnect();
        this.#mutation = undefined;
        this.#intersection?.disconnect();
        this.#intersection = undefined;
        cancelAnimationFrame(this.#frame);
        this.#frame = 0;
        this.#stopFade();
    }
    attributeChangedCallback(_name, previous, value) {
        if (previous !== value && this.isConnected)
            this.#render();
    }
    #readSteps() {
        return Array.from(this.children)
            .filter((child) => child.localName === ITEM_TAG)
            .map((item) => ({
            title: item.getAttribute('title')?.trim() ?? '',
            content: Array.from(item.childNodes),
        }));
    }
    #render() {
        this.#intersection?.disconnect();
        this.#intersection = undefined;
        cancelAnimationFrame(this.#frame);
        this.#frame = 0;
        this.#stopFade();
        this.#stage = null;
        this.#index = -1;
        this.#near = false;
        this.#steps = this.#readSteps();
        const layout = resolveLayout(readMode(this.getAttribute('mode')), this.#narrow?.matches ?? false, this.#reducedMotion?.matches ?? false);
        this.#layout = layout;
        if (this.getAttribute('layout') !== layout)
            this.setAttribute('layout', layout);
        this.#root.replaceChildren();
        this.#root.style.setProperty('--count', String(Math.max(1, this.#steps.length)));
        if (!this.#steps.length)
            return;
        if (layout === 'pinned')
            this.#renderPinned();
        else
            this.#renderList(layout);
    }
    #stepList(className, part) {
        const list = element('ol', className, part);
        list.setAttribute('role', 'list');
        this.#steps.forEach((step, index) => {
            const item = element('li', 'step', 'step');
            item.style.setProperty('--i', String(index));
            const number = element('span', 'number', 'number');
            number.textContent = pad(index + 1);
            number.setAttribute('aria-hidden', 'true');
            const title = element('p', 'title', 'title');
            title.textContent = step.title;
            const text = element('div', 'text', 'text');
            text.append(...step.content.map((node) => node.cloneNode(true)));
            item.append(number, title, text);
            list.append(item);
        });
        return list;
    }
    #renderList(layout) {
        const list = this.#stepList(layout === 'list' ? 'steps list revealed' : 'steps', 'steps');
        this.#root.append(list);
        if (layout === 'list')
            return;
        if (this.#reducedMotion?.matches || !('IntersectionObserver' in window)) {
            list.classList.add('revealed');
            return;
        }
        this.#intersection = new IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting))
                return;
            list.classList.add('revealed');
            this.#intersection?.disconnect();
            this.#intersection = undefined;
        }, { threshold: REVEAL_THRESHOLD });
        this.#intersection.observe(list);
    }
    #renderPinned() {
        const pinned = element('div', 'pinned', 'pinned');
        pinned.style.setProperty('--step-height', readStepHeight(this.getAttribute('step-height')));
        const stage = element('div', 'stage', 'stage');
        const meter = element('div', 'meter', 'meter');
        meter.setAttribute('aria-hidden', 'true');
        const counter = element('p', 'counter', 'counter');
        const current = element('span', 'current');
        current.textContent = pad(1);
        const total = element('span', 'total');
        total.textContent = ` / ${pad(this.#steps.length)}`;
        counter.append(current, total);
        const bar = element('div', 'bar', 'bar');
        const fill = element('span', 'bar-fill');
        bar.append(fill);
        meter.append(counter, bar);
        const active = element('div', 'active', 'active');
        active.setAttribute('aria-live', 'polite');
        stage.append(meter, active);
        pinned.append(stage, this.#stepList('visually-hidden'));
        this.#root.append(pinned);
        this.#stage = { pinned, current, fill, active };
        if ('IntersectionObserver' in window) {
            this.#intersection = new IntersectionObserver((entries) => {
                this.#near = entries.some((entry) => entry.isIntersecting);
                if (this.#near)
                    this.#schedule();
            });
            this.#intersection.observe(pinned);
        }
        else {
            this.#near = true;
        }
        this.#update();
    }
    #schedule() {
        if (this.#frame || !this.#stage || !this.#near)
            return;
        this.#frame = requestAnimationFrame(() => {
            this.#frame = 0;
            this.#update();
        });
    }
    #update() {
        const stage = this.#stage;
        if (!stage)
            return;
        const rect = stage.pinned.getBoundingClientRect();
        const stageHeight = stage.pinned.firstElementChild?.offsetHeight ?? window.innerHeight;
        const progress = scrollProgress(rect.top, rect.height, stageHeight);
        stage.fill.style.transform = `scaleX(${progress})`;
        this.#show(activeIndex(progress, this.#steps.length));
    }
    #fill(target, index) {
        const step = this.#steps[index];
        const title = element('p', 'title', 'title');
        title.textContent = step.title;
        const text = element('div', 'text', 'text');
        text.append(...step.content.map((node) => node.cloneNode(true)));
        target.replaceChildren(title, text);
    }
    #stopFade() {
        this.#token++;
        this.#fade.forEach((animation) => animation.cancel());
        this.#fade = [];
    }
    #show(index) {
        const stage = this.#stage;
        if (!stage || index === this.#index || index < 0)
            return;
        const first = this.#index === -1;
        this.#index = index;
        stage.current.textContent = pad(index + 1);
        this.dispatchEvent(new CustomEvent('stepchange', {
            bubbles: true,
            detail: { index, title: this.#steps[index].title },
        }));
        this.#stopFade();
        if (first || typeof stage.active.animate !== 'function') {
            this.#fill(stage.active, index);
            return;
        }
        const token = this.#token;
        const out = stage.active.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_OUT, easing: 'ease-in', fill: 'forwards' });
        this.#fade = [out];
        out.finished
            .then(() => {
            if (token !== this.#token)
                return;
            this.#fill(stage.active, index);
            out.cancel();
            const fadeIn = stage.active.animate([
                { opacity: 0, transform: 'translateY(8px)' },
                { opacity: 1, transform: 'none' },
            ], { duration: FADE_IN, easing: 'cubic-bezier(.2, .7, .2, 1)' });
            this.#fade = [fadeIn];
        })
            .catch(() => {
            if (token === this.#token)
                this.#fill(stage.active, index);
        });
    }
}
if (typeof customElements !== 'undefined') {
    if (!customElements.get(ITEM_TAG))
        customElements.define(ITEM_TAG, StepItem);
    if (!customElements.get(TAG))
        customElements.define(TAG, StepTimeline);
}
