import { getMonthLabels, getStats, normalize } from './data.js';
import { fill, labelsFor } from './i18n.js';
import { styles } from './styles.js';
const TAG = 'github-activity';
const WAVE = 1100;
const COUNT = 1300;
const EASE = 'cubic-bezier(.2, .7, .2, 1)';
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const Base = (typeof HTMLElement === 'undefined' ? class {
} : HTMLElement);
const escape = (value) => value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
const toDate = (value) => new Date(`${value}T00:00:00Z`);
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
const resolveLocale = (value) => {
    if (!value)
        return null;
    try {
        return Intl.getCanonicalLocales(value)[0] ?? null;
    }
    catch {
        return null;
    }
};
const halves = (weeks) => {
    const split = Math.ceil(weeks.length / 2);
    return { split, parts: [weeks.slice(0, split), weeks.slice(split)].filter((part) => part.length > 0) };
};
export class GitHubActivity extends Base {
    static observedAttributes = ['src', 'locale', 'username', 'hide', 'animation'];
    #data = null;
    #labels;
    #root;
    #controller;
    #observer;
    #animated = false;
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        adoptStyles(shadow);
        this.#root = document.createElement('div');
        this.#root.className = 'root';
        this.#root.setAttribute('part', 'root');
        shadow.append(this.#root);
    }
    get data() {
        return this.#data;
    }
    set data(value) {
        this.#controller?.abort();
        if (value === null || value === undefined) {
            this.#data = null;
            this.removeAttribute('state');
            this.#render();
            return;
        }
        try {
            this.#accept(normalize(value));
        }
        catch (error) {
            this.#fail(error);
        }
    }
    get labels() {
        return this.#labels;
    }
    set labels(value) {
        this.#labels = value;
        this.#render();
    }
    connectedCallback() {
        this.#upgrade('data');
        this.#upgrade('labels');
        if (this.#data) {
            this.#render();
            return;
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.#initialize(), { once: true });
            return;
        }
        this.#initialize();
    }
    disconnectedCallback() {
        this.#controller?.abort();
        this.#observer?.disconnect();
        this.#observer = undefined;
    }
    attributeChangedCallback(name, previous, value) {
        if (previous === value)
            return;
        if (name === 'src') {
            if (value && this.isConnected)
                void this.#load(value);
            return;
        }
        if (this.#data)
            this.#render();
    }
    reload() {
        const src = this.getAttribute('src');
        return src ? this.#load(src) : Promise.resolve();
    }
    #upgrade(property) {
        if (!Object.prototype.hasOwnProperty.call(this, property))
            return;
        const self = this;
        const value = self[property];
        delete self[property];
        self[property] = value;
    }
    #initialize() {
        if (this.#data || !this.isConnected)
            return;
        const inline = this.querySelector(':scope > script[type="application/json"]');
        if (inline?.textContent?.trim()) {
            try {
                this.data = JSON.parse(inline.textContent);
            }
            catch (error) {
                this.#fail(error);
            }
            return;
        }
        const src = this.getAttribute('src');
        if (src)
            void this.#load(src);
    }
    async #load(src) {
        this.#controller?.abort();
        const controller = new AbortController();
        this.#controller = controller;
        this.setAttribute('state', 'loading');
        try {
            const response = await fetch(new URL(src, document.baseURI), {
                signal: controller.signal,
                headers: { Accept: 'application/json' },
            });
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const json = await response.json();
            if (controller.signal.aborted)
                return;
            this.#accept(normalize(json));
            this.dispatchEvent(new CustomEvent('load', { detail: this.#data }));
        }
        catch (error) {
            if (controller.signal.aborted)
                return;
            this.#fail(error);
        }
    }
    #accept(data) {
        this.#data = data;
        this.#animated = false;
        this.setAttribute('state', 'ready');
        this.#render();
    }
    #fail(error) {
        this.#data = null;
        this.setAttribute('state', 'error');
        this.#render();
        this.dispatchEvent(new CustomEvent('error', { detail: error }));
    }
    #locale() {
        return (resolveLocale(this.getAttribute('locale')) ??
            resolveLocale(this.closest('[lang]')?.getAttribute('lang')) ??
            resolveLocale(navigator.language) ??
            'en');
    }
    #render() {
        this.#observer?.disconnect();
        this.#observer = undefined;
        const data = this.#data;
        if (!data) {
            this.#root.innerHTML = '';
            return;
        }
        const locale = this.#locale();
        const labels = labelsFor(locale, this.#labels);
        const hidden = new Set((this.getAttribute('hide') ?? '').toLowerCase().split(/\s+/));
        const number = new Intl.NumberFormat(locale);
        const plurals = new Intl.PluralRules(locale);
        const longDate = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' });
        const mediumDate = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
        const monthFormat = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
        const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
        const monthNames = Array.from({ length: 12 }, (_, month) => monthFormat.format(Date.UTC(2000, month, 1)).replace(/\.$/, ''));
        const counted = (value, forms) => `${number.format(value)} ${plurals.select(value) === 'one' ? forms.one : forms.other}`;
        const { weeks } = data;
        const stats = getStats(weeks);
        const { split, parts } = halves(weeks);
        const firstDay = weeks[0].days[0];
        const lastWeek = weeks[weeks.length - 1];
        const lastDay = lastWeek.days[lastWeek.days.length - 1];
        const username = this.getAttribute('username');
        const profile = username && USERNAME.test(username) ? `https://github.com/${username}` : 'https://github.com';
        const summary = fill(labels.summary, {
            count: counted(stats.total, labels.contributions),
            from: longDate.format(toDate(firstDay.date)),
            to: longDate.format(toDate(lastDay.date)),
        });
        const describe = (count, date) => {
            const when = longDate.format(toDate(date));
            return count === 0
                ? fill(labels.noneOn, { date: when })
                : fill(labels.countOn, { count: counted(count, labels.contributions), date: when });
        };
        const months = (range, className) => hidden.has('months')
            ? ''
            : `<div class="months ${className}" part="months" aria-hidden="true">${getMonthLabels(range)
                .map((label) => `<span style="grid-column: ${label.column + 1}">${escape(monthNames[label.month])}</span>`)
                .join('')}</div>`;
        const cells = (range, first) => range
            .flatMap((week, column) => week.days.map((day, index) => {
            const offset = first && column === 0 && index === 0 && day.weekday > 0 ? ` style="grid-row-start: ${day.weekday + 1}"` : '';
            return `<span class="cell" part="cell" data-level="${day.level}" title="${escape(describe(day.count, day.date))}"${offset}></span>`;
        }))
            .join('');
        const statItems = [
            { label: labels.total, value: number.format(stats.total), count: stats.total },
            {
                label: labels.streak,
                value: counted(stats.longestStreak, labels.days),
                count: stats.longestStreak,
                forms: labels.days,
            },
            {
                label: labels.busiest,
                value: stats.busiestWeekday === null ? '—' : weekdayFormat.format(Date.UTC(2023, 0, 1 + stats.busiestWeekday)),
            },
        ];
        const statsHtml = hidden.has('stats')
            ? ''
            : `<dl class="stats" part="stats">${statItems
                .map((item) => {
                const countAttrs = item.count === undefined
                    ? ''
                    : ` data-count="${item.count}"${item.forms ? ` data-one="${escape(item.forms.one)}" data-other="${escape(item.forms.other)}"` : ''}`;
                return `<div class="stat" part="stat"><dt>${escape(item.label)}</dt><dd${countAttrs}>${escape(item.value)}</dd></div>`;
            })
                .join('')}</dl>`;
        const range = fill(labels.range, {
            from: mediumDate.format(toDate(firstDay.date)),
            to: mediumDate.format(toDate(lastDay.date)),
        });
        const caption = hidden.has('caption')
            ? ''
            : `<p class="caption" part="caption">${escape(range)} · <span class="source">${escape(labels.source)}: <a href="${escape(profile)}" target="_blank" rel="noopener noreferrer">GitHub</a></span></p>`;
        const legend = hidden.has('legend')
            ? ''
            : `<div class="legend" part="legend" aria-hidden="true"><span>${escape(labels.less)}</span><span class="swatches">${[0, 1, 2, 3, 4]
                .map((level) => `<span class="cell" data-level="${level}"></span>`)
                .join('')}</span><span>${escape(labels.more)}</span></div>`;
        const meta = caption || legend ? `<div class="meta">${caption}${legend}</div>` : '';
        this.#root.innerHTML = `${statsHtml}<div class="activity" style="--weeks: ${weeks.length}; --split: ${split}">
      <div class="canvas" part="graph" role="img" aria-label="${escape(summary)}">
        ${months(weeks, 'months-full')}
        ${parts
            .map((part, index) => `<div class="half" style="--span: ${part.length}">${months(part, 'months-half')}<div class="grid">${cells(part, index === 0)}</div></div>`)
            .join('')}
      </div>
      ${meta}
    </div>`;
        this.#prepareAnimation(locale);
    }
    #prepareAnimation(locale) {
        if (this.#animated ||
            this.getAttribute('animation') === 'none' ||
            matchMedia('(prefers-reduced-motion: reduce)').matches ||
            typeof Element.prototype.animate !== 'function') {
            this.#animated = true;
            return;
        }
        const canvas = this.#root.querySelector('.canvas');
        if (!canvas)
            return;
        canvas.classList.add('pending');
        const run = () => {
            this.#animated = true;
            this.#wave(canvas);
            this.#countUp(locale);
            canvas.classList.remove('pending');
        };
        if (!('IntersectionObserver' in window)) {
            run();
            return;
        }
        this.#observer = new IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting))
                return;
            this.#observer?.disconnect();
            this.#observer = undefined;
            run();
        }, { rootMargin: '0px 0px -10% 0px' });
        this.#observer.observe(this);
    }
    #wave(canvas) {
        const box = canvas.getBoundingClientRect();
        if (!box.width)
            return;
        canvas.querySelectorAll('.grid .cell').forEach((cell) => {
            const rect = cell.getBoundingClientRect();
            if (!rect.width)
                return;
            const animation = cell.animate([
                { opacity: 0, transform: 'scale(.3)' },
                { opacity: 1, transform: 'none' },
            ], { duration: 420, delay: ((rect.left - box.left) / box.width) * WAVE, easing: EASE, fill: 'backwards' });
            animation.finished.then(() => animation.cancel()).catch(() => { });
        });
    }
    #countUp(locale) {
        const number = new Intl.NumberFormat(locale);
        const plurals = new Intl.PluralRules(locale);
        this.#root.querySelectorAll('dd[data-count]').forEach((element) => {
            const target = Number(element.dataset.count);
            if (!Number.isFinite(target) || target <= 0)
                return;
            const { one, other } = element.dataset;
            const render = (value) => {
                const unit = one && other ? ` ${plurals.select(value) === 'one' ? one : other}` : '';
                element.textContent = `${number.format(value)}${unit}`;
            };
            const start = performance.now();
            const tick = () => {
                const progress = Math.min(1, Math.max(0, (performance.now() - start) / COUNT));
                render(Math.round(target * (1 - (1 - progress) ** 3)));
                if (progress < 1 && element.isConnected)
                    requestAnimationFrame(tick);
            };
            render(0);
            requestAnimationFrame(tick);
        });
    }
}
if (typeof customElements !== 'undefined' && !customElements.get(TAG)) {
    customElements.define(TAG, GitHubActivity);
}
