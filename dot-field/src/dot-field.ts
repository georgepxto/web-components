import { activeAlpha, defaults, dotRadius, grid, influence, readNumber, type FieldOptions } from './field.js';
import { styles } from './styles.js';

export type Track = 'host' | 'parent';

interface Point {
  x: number;
  y: number;
}

const TAG = 'dot-field';
const TAU = Math.PI * 2;
const WAVE_AMPLITUDE = 0.4;
const WAVE_SPEED = 0.0016;
const FOLLOW = 0.2;
const MAX_RATIO = 2;

const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

let sharedSheet: CSSStyleSheet | undefined;

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

const inside = (point: Point, rect: DOMRect) =>
  point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;

export class DotField extends Base {
  static observedAttributes = ['gap', 'radius', 'dot-size', 'grow', 'track', 'theme'];

  #canvas: HTMLCanvasElement;
  #context: CanvasRenderingContext2D | null;
  #dotProbe: HTMLSpanElement;
  #activeProbe: HTMLSpanElement;
  #options: FieldOptions = { ...defaults };
  #controller: AbortController | undefined;
  #resizeObserver: ResizeObserver | undefined;
  #themeObserver: MutationObserver | undefined;
  #intersectionObserver: IntersectionObserver | undefined;
  #reducedMotion: MediaQueryList | undefined;
  #width = 0;
  #height = 0;
  #ratio = 1;
  #visible = false;
  #frame = 0;
  #pending = 0;
  #pointer: Point | null = null;
  #focus: Point | null = null;
  #strength = 0;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    adoptStyles(shadow);

    this.#canvas = document.createElement('canvas');
    this.#canvas.setAttribute('part', 'canvas');
    this.#canvas.setAttribute('aria-hidden', 'true');
    this.#context = this.#canvas.getContext('2d');

    this.#dotProbe = document.createElement('span');
    this.#dotProbe.className = 'probe probe-dot';
    this.#activeProbe = document.createElement('span');
    this.#activeProbe.className = 'probe probe-active';

    const content = document.createElement('div');
    content.className = 'content';
    content.setAttribute('part', 'content');
    content.append(document.createElement('slot'));

    shadow.append(this.#canvas, content, this.#dotProbe, this.#activeProbe);
  }

  connectedCallback() {
    this.#readOptions();
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.#reducedMotion.addEventListener('change', () => this.#refresh(), { signal });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.#wake(), { signal });

    this.#themeObserver = new MutationObserver(() => this.#wake());
    this.#themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });

    const track = (event: PointerEvent) => {
      this.#pointer = { x: event.clientX, y: event.clientY };
      this.#wake();
    };
    const release = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      this.#pointer = null;
      this.#wake();
    };
    const clear = () => {
      this.#pointer = null;
      this.#wake();
    };

    document.addEventListener('pointermove', track, { passive: true, signal });
    document.addEventListener('pointerdown', track, { passive: true, signal });
    document.addEventListener('pointerup', release, { passive: true, signal });
    document.addEventListener('pointercancel', clear, { passive: true, signal });
    document.documentElement.addEventListener('pointerleave', clear, { passive: true, signal });
    window.addEventListener('blur', clear, { signal });
    window.addEventListener('scroll', () => this.#wake(), { passive: true, signal });
    document.addEventListener('visibilitychange', () => this.#refresh(), { signal });

    this.#resizeObserver = new ResizeObserver(() => {
      this.#resize();
      this.#refresh();
    });
    this.#resizeObserver.observe(this);

    if ('IntersectionObserver' in window) {
      this.#intersectionObserver = new IntersectionObserver((entries) => {
        this.#visible = entries.some((entry) => entry.isIntersecting);
        this.#refresh();
      });
      this.#intersectionObserver.observe(this);
    } else {
      this.#visible = true;
    }

    this.#resize();
    this.#refresh();
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = undefined;
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;
    this.#themeObserver?.disconnect();
    this.#themeObserver = undefined;
    this.#intersectionObserver?.disconnect();
    this.#intersectionObserver = undefined;
    cancelAnimationFrame(this.#frame);
    cancelAnimationFrame(this.#pending);
    this.#frame = 0;
    this.#pending = 0;
    this.#visible = false;
    this.#pointer = null;
    this.#focus = null;
    this.#strength = 0;
  }

  attributeChangedCallback(name: string, previous: string | null, value: string | null) {
    if (previous === value) return;
    if (name !== 'theme' && name !== 'track') this.#readOptions();
    if (this.isConnected) this.#refresh();
  }

  #readOptions() {
    this.#options = {
      gap: readNumber(this.getAttribute('gap'), defaults.gap, 4, 400),
      radius: readNumber(this.getAttribute('radius'), defaults.radius, 0, 4000),
      dotSize: readNumber(this.getAttribute('dot-size'), defaults.dotSize, 0.1, 100),
      grow: readNumber(this.getAttribute('grow'), defaults.grow, 0, 100),
    };
  }

  #reduced() {
    return this.#reducedMotion?.matches ?? false;
  }

  #animating() {
    return this.isConnected && this.#visible && document.visibilityState !== 'hidden' && !this.#reduced();
  }

  #area(): Element {
    if (this.getAttribute('track') !== 'parent') return this;
    const parent = this.parentElement ?? (this.parentNode instanceof ShadowRoot ? this.parentNode.host : null);
    return parent ?? this;
  }

  #resize() {
    const width = this.clientWidth;
    const height = this.clientHeight;
    const ratio = Math.min(MAX_RATIO, Math.max(1, window.devicePixelRatio || 1));
    if (width === this.#width && height === this.#height && ratio === this.#ratio) return;
    this.#width = width;
    this.#height = height;
    this.#ratio = ratio;
    this.#canvas.width = Math.round(width * ratio);
    this.#canvas.height = Math.round(height * ratio);
  }

  #refresh() {
    if (this.#animating()) {
      if (!this.#frame) this.#frame = requestAnimationFrame(this.#loop);
      return;
    }
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#drawOnce();
  }

  #wake() {
    if (!this.#animating()) this.#drawOnce();
  }

  #drawOnce() {
    if (this.#pending || !this.isConnected || !this.#visible || document.visibilityState === 'hidden') return;
    this.#pending = requestAnimationFrame((time) => {
      this.#pending = 0;
      this.#draw(time, true);
    });
  }

  #loop = (time: number) => {
    this.#frame = 0;
    if (!this.#animating()) return;
    this.#draw(time, false);
    this.#frame = requestAnimationFrame(this.#loop);
  };

  #draw(time: number, still: boolean) {
    const context = this.#context;
    const width = this.#width;
    const height = this.#height;
    if (!context || !width || !height) return;

    const rect = this.getBoundingClientRect();
    const area = this.#area();
    const pointer = this.#pointer;
    const hovering = pointer !== null && inside(pointer, area === this ? rect : area.getBoundingClientRect());

    if (hovering) this.#focus = { x: pointer.x - rect.left, y: pointer.y - rect.top };
    const target = hovering ? 1 : 0;
    this.#strength = still ? target : this.#strength + (target - this.#strength) * FOLLOW;
    if (this.#strength < 0.002 && !hovering) {
      this.#strength = 0;
      this.#focus = null;
    }

    const { gap, radius, dotSize, grow } = this.#options;
    const strength = this.#strength;
    const focus = this.#focus;
    const layout = grid(width, height, gap);
    const wave = still ? 0 : WAVE_AMPLITUDE * (1 - strength);
    const phase = time * WAVE_SPEED;
    const active: { x: number; y: number; radius: number; strength: number }[] = [];

    context.setTransform(this.#ratio, 0, 0, this.#ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.beginPath();

    for (let row = 0; row < layout.rows; row++) {
      const baseY = layout.y + row * gap;
      for (let column = 0; column < layout.columns; column++) {
        const x = layout.x + column * gap;
        const y = wave ? baseY + wave * Math.sin(phase + x * 0.045 + baseY * 0.03) : baseY;
        let power = 0;
        if (focus && strength > 0) power = influence(Math.hypot(x - focus.x, y - focus.y), radius) * strength;
        const size = dotRadius(dotSize, grow, power);
        context.moveTo(x + size, y);
        context.arc(x, y, size, 0, TAU);
        if (power > 0.002) active.push({ x, y, radius: size, strength: power });
      }
    }

    context.fillStyle = getComputedStyle(this.#dotProbe).color;
    context.fill();

    if (active.length) {
      context.fillStyle = getComputedStyle(this.#activeProbe).color;
      for (const dot of active) {
        context.globalAlpha = activeAlpha(dot.strength);
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, TAU);
        context.fill();
      }
      context.globalAlpha = 1;
    }

    if (still && strength === 0) this.#focus = null;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dot-field': DotField;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(TAG)) {
  customElements.define(TAG, DotField);
}
