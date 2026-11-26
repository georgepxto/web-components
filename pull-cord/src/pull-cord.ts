import { labelsFor, type Labels } from './i18n.js';
import { documentStyles, styles } from './styles.js';
import { attributeName, isTheme, loadTheme, opposite, readTheme, saveTheme, writeTheme, type Theme } from './theme.js';

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

interface Drag {
  id: number;
  x: number;
  y: number;
  moved: boolean;
  armed: boolean;
  stretch: number;
  offset: number;
  radius: number;
  samples: { angle: number; time: number }[];
}

const TAG = 'pull-cord';
const STYLE_ID = 'pull-cord-document-styles';
const MAX_STRETCH = 46;
const ARM = 18;
const TAP = 4;
const SPRING_EASE = 'cubic-bezier(.37, 0, .63, 1)';
const MAX_ANGLE = 38;
const STIFFNESS = 103;
const DAMPING = 2.4;
const KICK = 72;
const MAX_SPEED = 420;
const HINT_DURATION = 5000;

const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

let sharedSheet: CSSStyleSheet | undefined;
let audio: AudioContext | undefined;

const adoptStyles = (shadow: ShadowRoot) => {
  try {
    if (!sharedSheet) {
      sharedSheet = new CSSStyleSheet();
      sharedSheet.replaceSync(styles);
    }
    shadow.adoptedStyleSheets = [sharedSheet];
  } catch {
    const style = document.createElement('style');
    style.textContent = styles;
    shadow.append(style);
  }
};

const installDocumentStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = documentStyles;
  document.head.append(style);
};

const resolveLocale = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    return Intl.getCanonicalLocales(value)[0] ?? null;
  } catch {
    return null;
  }
};

const element = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, part?: string) => {
  const node = document.createElement(tag);
  node.className = className;
  if (part) node.setAttribute('part', part);
  return node;
};

export class PullCord extends Base {
  static observedAttributes = ['locale', 'target', 'attribute', 'storage-key', 'no-persist'];

  #root: HTMLDivElement;
  #swing: HTMLDivElement;
  #line: HTMLSpanElement;
  #handle: HTMLButtonElement;
  #pill: HTMLSpanElement;
  #hint: HTMLSpanElement;

  #theme: Theme | null = null;
  #pending: Theme | null = null;
  #labels: Partial<Labels> | undefined;
  #controller: AbortController | undefined;
  #observer: MutationObserver | undefined;
  #reducedMotion: MediaQueryList | undefined;
  #systemLight: MediaQueryList | undefined;
  #transition: ViewTransition | undefined;
  #motion: Animation[] = [];
  #drag: Drag | null = null;
  #suppressClick = false;
  #angle = 0;
  #velocity = 0;
  #frame = 0;
  #last = 0;
  #rest = 56;
  #hintTimer = 0;
  #clickTimer = 0;
  #ownsName = false;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    adoptStyles(shadow);

    this.#root = element('div', 'root');
    const sway = element('div', 'sway');
    this.#swing = element('div', 'swing');
    this.#line = element('span', 'line', 'line');
    this.#handle = element('button', 'handle', 'handle');
    this.#pill = element('span', 'pill', 'pill');
    this.#hint = element('span', 'hint', 'hint');
    const mount = element('span', 'mount', 'mount');

    this.#line.setAttribute('aria-hidden', 'true');
    this.#hint.setAttribute('aria-hidden', 'true');
    mount.setAttribute('aria-hidden', 'true');
    this.#handle.type = 'button';
    this.#handle.setAttribute('role', 'switch');
    this.#handle.setAttribute('aria-checked', 'false');

    this.#pill.append(element('span', 'dot', 'dot'));
    this.#handle.append(this.#pill, this.#hint);
    this.#swing.append(this.#line, this.#handle);
    sway.append(this.#swing);
    this.#root.append(sway, mount);
    shadow.append(this.#root);
  }

  get theme(): Theme | null {
    return this.#theme;
  }

  set theme(value: Theme | null) {
    if (!isTheme(value)) return;
    if (!this.isConnected) {
      this.#pending = value;
      return;
    }
    this.#apply(value, this.#persists(), 'property');
  }

  get labels(): Partial<Labels> | undefined {
    return this.#labels;
  }

  set labels(value: Partial<Labels> | undefined) {
    this.#labels = value;
    this.#renderLabels();
  }

  toggle() {
    if (this.isConnected) this.#switch();
  }

  connectedCallback() {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.#systemLight = matchMedia('(prefers-color-scheme: light)');
    this.#upgrade('labels');
    this.#upgrade('theme');

    this.#handle.addEventListener('pointerdown', (event) => this.#onPointerDown(event), { signal });
    this.#handle.addEventListener('pointermove', (event) => this.#onPointerMove(event), { signal });
    this.#handle.addEventListener('pointerup', (event) => this.#endDrag(event, true), { signal });
    this.#handle.addEventListener('pointercancel', (event) => this.#endDrag(event, false), { signal });
    this.#handle.addEventListener('lostpointercapture', (event) => this.#endDrag(event, false), { signal });
    this.#handle.addEventListener('click', () => this.#onClick(), { signal });

    this.#systemLight.addEventListener(
      'change',
      (event) => {
        if (!this.#saved()) this.#apply(event.matches ? 'light' : 'dark', false, 'system');
      },
      { signal },
    );

    window.addEventListener(
      'storage',
      (event) => {
        if (!this.#persists() || event.key !== this.#storageKey()) return;
        if (isTheme(event.newValue)) this.#apply(event.newValue, false, 'storage');
        else if (event.newValue === null) this.#apply(this.#system(), false, 'storage');
      },
      { signal },
    );

    this.#initialize();
    this.#renderLabels();

    if (this.getAttribute('hint') !== 'hover' && this.getAttribute('hint') !== 'none') {
      this.#root.classList.add('hinting');
      this.#hintTimer = window.setTimeout(() => this.#root.classList.remove('hinting'), HINT_DURATION);
    }
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = undefined;
    this.#observer?.disconnect();
    this.#observer = undefined;
    window.clearTimeout(this.#hintTimer);
    window.clearTimeout(this.#clickTimer);
    this.#holdSwing();
    this.#stopMotion();
    this.#setPull(0);
    this.#drag = null;
    this.#angle = 0;
    this.#velocity = 0;
    this.#render();
    this.#root.classList.remove('active', 'hinting');
  }

  attributeChangedCallback(name: string, previous: string | null, value: string | null) {
    if (previous === value || !this.isConnected) return;
    if (name === 'locale') this.#renderLabels();
    else this.#initialize();
  }

  #upgrade(property: 'labels' | 'theme') {
    if (!Object.prototype.hasOwnProperty.call(this, property)) return;
    const self = this as unknown as Record<string, unknown>;
    const value = self[property];
    delete self[property];
    self[property] = value;
  }

  #target(): Element {
    const selector = this.getAttribute('target');
    if (selector) {
      try {
        const found = document.querySelector(selector);
        if (found) return found;
      } catch {}
    }
    return document.documentElement;
  }

  #attribute() {
    return attributeName(this.getAttribute('attribute'));
  }

  #storageKey() {
    return this.getAttribute('storage-key') || 'theme';
  }

  #persists() {
    return !this.hasAttribute('no-persist');
  }

  #saved() {
    return this.#persists() ? loadTheme(this.#storageKey()) : null;
  }

  #system(): Theme {
    return this.#systemLight?.matches ? 'light' : 'dark';
  }

  #current(): Theme {
    return readTheme(this.#target(), this.#attribute()) ?? this.#theme ?? this.#system();
  }

  #initialize() {
    const target = this.#target();
    const attribute = this.#attribute();
    const pending = this.#pending;
    this.#pending = null;
    const theme = pending ?? this.#saved() ?? readTheme(target, attribute) ?? this.#system();
    writeTheme(target, attribute, theme);
    if (pending && this.#persists()) saveTheme(this.#storageKey(), pending);
    this.#reflect(theme);

    this.#observer?.disconnect();
    this.#observer = new MutationObserver(() => {
      const current = readTheme(this.#target(), this.#attribute());
      if (current && current !== this.#theme) this.#reflect(current);
    });
    this.#observer.observe(target, { attributes: true, attributeFilter: [attribute] });
  }

  #apply(theme: Theme, persist: boolean, source: ThemeSource) {
    const previous = this.#theme;
    writeTheme(this.#target(), this.#attribute(), theme);
    if (persist) saveTheme(this.#storageKey(), theme);
    this.#reflect(theme);
    if (previous === theme) return;
    this.dispatchEvent(
      new CustomEvent<ThemeChangeDetail>('themechange', {
        bubbles: true,
        composed: true,
        detail: { theme, previous, source },
      }),
    );
  }

  #reflect(theme: Theme) {
    this.#theme = theme;
    if (this.getAttribute('theme') !== theme) this.setAttribute('theme', theme);
    this.#handle.setAttribute('aria-checked', String(theme === 'light'));
    this.#renderHint();
  }

  #locale() {
    return (
      resolveLocale(this.getAttribute('locale')) ??
      resolveLocale(this.closest('[lang]')?.getAttribute('lang')) ??
      resolveLocale(typeof navigator === 'undefined' ? null : navigator.language) ??
      'en'
    );
  }

  #renderLabels() {
    const labels = labelsFor(this.#locale(), this.#labels);
    this.#handle.setAttribute('aria-label', labels.label);
    this.#renderHint(labels);
  }

  #renderHint(labels = labelsFor(this.#locale(), this.#labels)) {
    this.#hint.textContent = this.#theme === 'light' ? labels.hintOff : labels.hintOn;
  }

  #tone(from: number, to: number, gain = 0.05, duration = 0.05) {
    if (this.hasAttribute('muted')) return;
    try {
      audio ??= new AudioContext();
      if (audio.state === 'suspended') void audio.resume();
      const start = audio.currentTime;
      const oscillator = audio.createOscillator();
      const volume = audio.createGain();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(from, start);
      oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
      volume.gain.setValueAtTime(gain, start);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(volume).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
    } catch {}
  }

  #origin() {
    const rect = this.#pill.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  #switch() {
    const previous = this.#current();
    const next = opposite(previous);
    const pull = new CustomEvent<PullDetail>('pull', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { theme: next, previous },
    });
    if (!this.dispatchEvent(pull)) return;

    if (next === 'light') this.#tone(2400, 700);
    else this.#tone(1500, 300);

    if (
      typeof document.startViewTransition !== 'function' ||
      this.#reducedMotion?.matches ||
      this.getAttribute('transition') === 'none'
    ) {
      this.#apply(next, this.#persists(), 'pull');
      return;
    }

    installDocumentStyles();
    const html = document.documentElement;
    const { x, y } = this.#origin();
    if (!this.style.viewTransitionName) {
      this.style.viewTransitionName = TAG;
      this.#ownsName = true;
    }
    html.dataset.pullCordVt = next;

    const transition = document.startViewTransition(() => this.#apply(next, this.#persists(), 'pull'));
    this.#transition = transition;

    transition.ready
      .then(() => {
        const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        const closed = `circle(0px at ${x}px ${y}px)`;
        const open = `circle(${radius}px at ${x}px ${y}px)`;
        const lighting = next === 'light';
        html.animate(
          { clipPath: lighting ? [closed, open] : [open, closed] },
          {
            duration: lighting ? 800 : 560,
            easing: lighting ? 'cubic-bezier(.55, 0, .2, 1)' : 'cubic-bezier(.6, 0, .85, .35)',
            fill: 'forwards',
            pseudoElement: lighting ? '::view-transition-new(root)' : '::view-transition-old(root)',
          },
        );
      })
      .catch(() => {});

    transition.finished.finally(() => {
      if (this.#transition !== transition) return;
      this.#transition = undefined;
      delete html.dataset.pullCordVt;
      if (this.#ownsName) {
        this.style.viewTransitionName = '';
        this.#ownsName = false;
      }
    });
  }

  #setPull(offset: number) {
    this.#line.style.height = offset ? `${this.#rest + offset}px` : '';
    this.#handle.style.transform = offset ? `translateY(${offset}px)` : '';
  }

  #measureRest() {
    this.#rest = this.#line.offsetHeight || this.#rest;
  }

  #stopMotion() {
    this.#motion.forEach((animation) => animation.cancel());
    this.#motion = [];
  }

  #render() {
    this.#swing.style.transform = this.#angle ? `rotate(${this.#angle}deg)` : '';
  }

  #step = (time: number) => {
    const delta = Math.min(0.032, Math.max(0, time - this.#last) / 1000);
    this.#last = time;
    this.#velocity += (-STIFFNESS * this.#angle - DAMPING * this.#velocity) * delta;
    this.#angle += this.#velocity * delta;

    if (Math.abs(this.#angle) < 0.02 && Math.abs(this.#velocity) < 0.5) {
      this.#angle = 0;
      this.#velocity = 0;
      this.#frame = 0;
      this.#render();
      return;
    }

    this.#render();
    this.#frame = requestAnimationFrame(this.#step);
  };

  #swingFree() {
    if (this.#frame || this.#drag) return;
    this.#last = performance.now();
    this.#frame = requestAnimationFrame(this.#step);
  }

  #holdSwing() {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  #kick = () => {
    if (this.#reducedMotion?.matches || this.#drag || !this.isConnected) return;
    this.#velocity += KICK * (Math.random() < 0.5 ? -1 : 1);
    this.#swingFree();
  };

  #polar(event: PointerEvent) {
    const rect = this.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = Math.max(event.clientY - rect.top - 4, 1);
    return { angle: (-Math.atan2(x, y) * 180) / Math.PI, radius: Math.hypot(x, y) };
  }

  #releaseSpeed(samples: Drag['samples'], now: number) {
    const recent = samples.filter((sample) => now - sample.time <= 100);
    if (recent.length < 2) return 0;
    const first = recent[0];
    const latest = recent[recent.length - 1];
    const elapsed = (latest.time - first.time) / 1000;
    return elapsed > 0 ? clamp((latest.angle - first.angle) / elapsed, MAX_SPEED) : 0;
  }

  #spring(values: number[], duration: number, after?: () => void) {
    this.#stopMotion();
    this.#setPull(0);
    this.#measureRest();
    const rest = this.#rest;
    this.#motion = [
      this.#line.animate(
        values.map((value) => ({ height: `${rest + value}px`, easing: SPRING_EASE })),
        duration,
      ),
      this.#handle.animate(
        values.map((value) => ({ transform: `translateY(${value}px)`, easing: SPRING_EASE })),
        duration,
      ),
    ];
    if (after) this.#motion[1].finished.then(after).catch(() => {});
  }

  #setArmed(armed: boolean) {
    if (!this.#drag || this.#drag.armed === armed) return;
    this.#drag.armed = armed;
    this.#handle.classList.toggle('armed', armed);
    if (armed) this.#tone(900, 220, 0.03, 0.03);
  }

  #onPointerDown(event: PointerEvent) {
    if (event.button !== 0 || this.#drag) return;
    this.#suppressClick = false;
    this.#stopMotion();
    this.#setPull(0);
    this.#measureRest();
    this.#holdSwing();
    this.#velocity = 0;
    const start = this.#polar(event);
    this.#drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      armed: false,
      stretch: 0,
      offset: this.#angle - start.angle,
      radius: start.radius,
      samples: [{ angle: this.#angle, time: event.timeStamp }],
    };
    this.#handle.setPointerCapture(event.pointerId);
    this.#root.classList.add('active');
    this.#root.classList.remove('hinting');
  }

  #onPointerMove(event: PointerEvent) {
    const drag = this.#drag;
    if (!drag) {
      if (event.pointerType === 'mouse' && !event.buttons && !this.#reducedMotion?.matches) {
        this.#velocity = clamp(this.#velocity - event.movementX * 4, 260);
        this.#swingFree();
      }
      return;
    }

    if (event.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < TAP) return;
    drag.moved = true;

    const point = this.#polar(event);
    this.#angle = MAX_ANGLE * Math.tanh((point.angle + drag.offset) / MAX_ANGLE);
    this.#render();
    drag.samples.push({ angle: this.#angle, time: event.timeStamp });
    if (drag.samples.length > 12) drag.samples.shift();

    const stretch = point.radius - drag.radius;
    drag.stretch = stretch > 0 ? MAX_STRETCH * (1 - Math.exp(-stretch / MAX_STRETCH)) : 0;
    this.#setPull(drag.stretch);
    if (drag.stretch > ARM) this.#setArmed(true);
    else if (drag.stretch < ARM - 4) this.#setArmed(false);
  }

  #endDrag(event: PointerEvent, commit: boolean) {
    const ended = this.#drag;
    if (!ended || event.pointerId !== ended.id) return;
    this.#drag = null;
    this.#root.classList.remove('active');
    this.#handle.classList.remove('armed');
    if (this.#handle.hasPointerCapture(event.pointerId)) this.#handle.releasePointerCapture(event.pointerId);
    if (!ended.moved) {
      if (this.#angle) this.#swingFree();
      return;
    }

    this.#suppressClick = true;
    if (commit && ended.armed) this.#switch();

    if (this.#reducedMotion?.matches) {
      this.#setPull(0);
      this.#angle = 0;
      this.#velocity = 0;
      this.#render();
      return;
    }

    this.#velocity = this.#releaseSpeed(ended.samples, event.timeStamp);
    const swinging = Math.abs(this.#angle) > 1 || Math.abs(this.#velocity) > 20;

    if (ended.stretch > 1) this.#spring([ended.stretch, -8, 3.5, -1.2, 0], 560, swinging ? undefined : this.#kick);
    else this.#setPull(0);

    if (swinging) this.#swingFree();
  }

  #onClick() {
    if (this.#suppressClick) {
      this.#suppressClick = false;
      return;
    }

    this.#root.classList.remove('hinting');

    if (this.#reducedMotion?.matches) {
      this.#switch();
      return;
    }

    this.#spring([0, 26, -7, 3, -1, 0], 720, this.#kick);
    window.clearTimeout(this.#clickTimer);
    this.#clickTimer = window.setTimeout(() => this.#switch(), 170);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pull-cord': PullCord;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(TAG)) {
  customElements.define(TAG, PullCord);
}
