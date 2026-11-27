import { pickActive, readOffset, scrollTop, sectionId } from './sections.js';
import { styles } from './styles.js';
const TAG = 'glass-nav';
const BAND = '-55%';
const SCROLL_LOCK = 1200;
const CLEARANCE = 12;
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
const region = (className, name) => {
    const element = document.createElement('div');
    element.className = className;
    element.setAttribute('part', className);
    const slot = document.createElement('slot');
    if (name)
        slot.name = name;
    element.append(slot);
    return element;
};
const focusable = (element) => element.matches('a[href], button, input, select, textarea, [tabindex]');
export class GlassNav extends Base {
    static observedAttributes = ['offset', 'label'];
    #nav;
    #clearance = 0;
    #links;
    #indicator;
    #controller;
    #intersection;
    #mutation;
    #resize;
    #reducedMotion;
    #sections = [];
    #intersecting = new Set();
    #active = null;
    #locked = null;
    #lockTimer = 0;
    #frame = 0;
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        adoptStyles(shadow);
        this.#nav = document.createElement('nav');
        this.#nav.className = 'pill';
        this.#nav.setAttribute('part', 'nav');
        this.#links = region('links');
        this.#indicator = document.createElement('span');
        this.#indicator.className = 'indicator';
        this.#indicator.setAttribute('part', 'indicator');
        this.#indicator.setAttribute('aria-hidden', 'true');
        this.#links.prepend(this.#indicator);
        this.#nav.append(region('logo', 'logo'), this.#links, region('cta', 'cta'));
        shadow.append(this.#nav);
    }
    get active() {
        return this.#active;
    }
    get offset() {
        return readOffset(this.getAttribute('offset'));
    }
    connectedCallback() {
        this.#controller?.abort();
        this.#controller = new AbortController();
        const { signal } = this.#controller;
        this.#reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
        this.#renderLabel();
        this.addEventListener('click', (event) => this.#onClick(event), { signal });
        this.#links.querySelector('slot')?.addEventListener('slotchange', () => this.#refresh(), { signal });
        this.shadowRoot?.querySelectorAll('slot').forEach((slot) => slot.addEventListener('slotchange', () => this.#measure(), { signal }));
        window.addEventListener('scroll', () => this.#onScroll(), { passive: true, signal });
        window.addEventListener('scrollend', () => this.#unlock(), { passive: true, signal });
        window.addEventListener('hashchange', () => this.#recompute(), { signal });
        this.#mutation = new MutationObserver(() => this.#refresh());
        this.#mutation.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
        this.#resize = new ResizeObserver(() => this.#measure());
        this.#resize.observe(this);
        void document.fonts?.ready.then(() => this.#measure());
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.#refresh(), { once: true, signal });
        }
        this.#refresh();
        this.#measure();
    }
    disconnectedCallback() {
        this.#controller?.abort();
        this.#controller = undefined;
        this.#intersection?.disconnect();
        this.#intersection = undefined;
        this.#mutation?.disconnect();
        this.#mutation = undefined;
        this.#resize?.disconnect();
        this.#resize = undefined;
        cancelAnimationFrame(this.#frame);
        this.#frame = 0;
        window.clearTimeout(this.#lockTimer);
        this.#locked = null;
    }
    #scrollOffset() {
        return Math.max(this.offset, this.#clearance);
    }
    attributeChangedCallback(name, previous, value) {
        if (previous === value || !this.isConnected)
            return;
        if (name === 'label')
            this.#renderLabel();
        else
            this.#observe();
    }
    #renderLabel() {
        const label = this.getAttribute('label');
        if (label)
            this.#nav.setAttribute('aria-label', label);
        else
            this.#nav.removeAttribute('aria-label');
    }
    #navLinks() {
        return Array.from(this.querySelectorAll(':scope > a[href]:not([slot])'));
    }
    #refresh() {
        const byId = new Map();
        for (const link of this.#navLinks()) {
            const id = sectionId(link.getAttribute('href') ?? '', location.href);
            const element = id ? document.getElementById(id) : null;
            if (!id || !element) {
                link.removeAttribute('aria-current');
                continue;
            }
            const section = byId.get(id) ?? { id, element, links: [] };
            section.links.push(link);
            byId.set(id, section);
        }
        this.#sections = Array.from(byId.values()).sort((a, b) => a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
        this.#observe();
        this.#placeIndicator(true);
    }
    #observe() {
        this.#intersection?.disconnect();
        this.#intersecting.clear();
        if (!this.#sections.length || !('IntersectionObserver' in window)) {
            this.#recompute();
            return;
        }
        this.#intersection = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                const id = entry.target.id;
                if (entry.isIntersecting)
                    this.#intersecting.add(id);
                else
                    this.#intersecting.delete(id);
            }
            this.#recompute();
        }, { rootMargin: `-${this.#scrollOffset()}px 0px ${BAND} 0px` });
        this.#sections.forEach((section) => this.#intersection?.observe(section.element));
    }
    #onScroll() {
        if (this.#frame)
            return;
        this.#frame = requestAnimationFrame(() => {
            this.#frame = 0;
            this.#recompute();
        });
    }
    #recompute() {
        const ordered = this.#sections.map((section) => section.id);
        const root = document.documentElement;
        const scrollable = root.scrollHeight > innerHeight + 2;
        const atEnd = scrollable && innerHeight + scrollY >= root.scrollHeight - 2;
        const next = this.#locked ?? pickActive(ordered, this.#intersecting, atEnd);
        this.#setActive(next);
    }
    #setActive(id) {
        for (const section of this.#sections) {
            for (const link of section.links) {
                if (section.id === id)
                    link.setAttribute('aria-current', 'true');
                else
                    link.removeAttribute('aria-current');
            }
        }
        if (id === this.#active)
            return;
        this.#active = id;
        this.#placeIndicator();
        this.dispatchEvent(new CustomEvent('activechange', { bubbles: true, detail: { id } }));
    }
    #unlock() {
        if (!this.#locked)
            return;
        window.clearTimeout(this.#lockTimer);
        this.#locked = null;
        this.#recompute();
    }
    #onClick(event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }
        const link = event.target?.closest?.('a[href]');
        if (!link || !this.contains(link) || link.hasAttribute('download'))
            return;
        if (link.target && link.target !== '_self')
            return;
        const id = sectionId(link.getAttribute('href') ?? '', location.href);
        const element = id ? document.getElementById(id) : null;
        if (!id || !element)
            return;
        event.preventDefault();
        const reduced = this.#reducedMotion?.matches ?? false;
        window.scrollTo({
            top: scrollTop(element.getBoundingClientRect().top, scrollY, this.#scrollOffset()),
            behavior: reduced ? 'auto' : 'smooth',
        });
        if (location.hash !== `#${encodeURIComponent(id)}` && location.hash !== `#${id}`) {
            history.pushState(history.state, '', `#${encodeURIComponent(id)}`);
        }
        if (!focusable(element))
            element.setAttribute('tabindex', '-1');
        element.focus({ preventScroll: true });
        if (this.#sections.some((section) => section.id === id)) {
            this.#locked = id;
            window.clearTimeout(this.#lockTimer);
            this.#lockTimer = window.setTimeout(() => this.#unlock(), reduced ? 0 : SCROLL_LOCK);
            this.#recompute();
        }
    }
    #measure() {
        if (!this.isConnected)
            return;
        const wrapped = this.hasAttribute('wrapped');
        if (wrapped)
            this.removeAttribute('wrapped');
        const overflowing = this.#links.scrollWidth > this.#links.clientWidth + 1;
        if (overflowing)
            this.setAttribute('wrapped', '');
        this.#placeIndicator(true);
        const clearance = Math.ceil((parseFloat(getComputedStyle(this.#nav).top) || 0) + this.#nav.offsetHeight + CLEARANCE);
        if (clearance === this.#clearance)
            return;
        this.#clearance = clearance;
        if (this.#sections.length)
            this.#observe();
    }
    #placeIndicator(snap = false) {
        const indicator = this.#indicator;
        const link = this.#sections
            .find((section) => section.id === this.#active)
            ?.links.find((candidate) => candidate.getClientRects().length > 0);
        if (!link || !this.#links.clientWidth) {
            indicator.classList.remove('visible');
            return;
        }
        const box = this.#links.getBoundingClientRect();
        const rect = link.getBoundingClientRect();
        const x = rect.left - box.left - this.#links.clientLeft + this.#links.scrollLeft;
        const y = rect.top - box.top - this.#links.clientTop + this.#links.scrollTop;
        const instant = snap || !indicator.classList.contains('visible');
        if (instant)
            indicator.style.transitionProperty = 'opacity';
        indicator.style.transform = `translate(${x}px, ${y}px)`;
        indicator.style.width = `${rect.width}px`;
        indicator.style.height = `${rect.height}px`;
        if (instant)
            void indicator.offsetWidth;
        indicator.classList.add('visible');
        if (instant)
            indicator.style.transitionProperty = '';
    }
}
if (typeof customElements !== 'undefined' && !customElements.get(TAG)) {
    customElements.define(TAG, GlassNav);
}
