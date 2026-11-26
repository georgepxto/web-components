const light = `
  --_accent: var(--step-accent, #1d8049);
  --_text: var(--step-text, #0d1310);
  --_muted: var(--step-muted, #4a5650);
  --_border: var(--step-border, #c3ccc6);
  --_bg: var(--step-bg, #f6f8f6);
`;
const dark = `
  --_accent: var(--step-accent, #43c97e);
  --_text: var(--step-text, #e9eeea);
  --_muted: var(--step-muted, #a3ada6);
  --_border: var(--step-border, #2c352f);
  --_bg: var(--step-bg, #0b0e0c);
`;
export const styles = `
  :host {
    ${light}
    --_font: var(--step-font, inherit);
    --_mono: var(--step-mono-font, ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace);
    --_gap: var(--step-gap, 32px);
    --_circle: var(--step-circle-size, 40px);
    --_stagger: var(--step-stagger, 0.45s);
    --_title-size: var(--step-title-size, 18px);
    --_text-size: var(--step-text-size, 15px);
    --_counter-size: var(--step-counter-size, clamp(3rem, 8vw, 6rem));
    --_sticky-top: var(--step-sticky-top, 0px);
    display: block;
    container-type: inline-size;
    color: var(--_text);
    font-family: var(--_font);
    line-height: 1.5;
  }

  :host([theme='dark']) {
    ${dark}
  }

  @media (prefers-color-scheme: dark) {
    :host(:not([theme='light'])) {
      ${dark}
    }
  }

  :host([hidden]) {
    display: none;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .steps {
    display: grid;
    grid-template-columns: repeat(var(--count), minmax(0, 1fr));
    gap: var(--_gap);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .step {
    position: relative;
    min-width: 0;
  }

  .number {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    width: var(--_circle);
    height: var(--_circle);
    margin-bottom: 20px;
    border: 1px solid var(--_border);
    border-radius: 50%;
    background: var(--_bg);
    color: var(--_muted);
    font-family: var(--_mono);
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
    transition:
      color 0.3s ease,
      border-color 0.3s ease;
    transition-delay: calc(var(--i) * var(--_stagger));
  }

  .step:not(:last-child)::before,
  .step:not(:last-child)::after {
    content: '';
    position: absolute;
    top: calc(var(--_circle) / 2 - 1px);
    left: var(--_circle);
    right: calc(-1 * var(--_gap));
    height: 2px;
  }

  .step:not(:last-child)::before {
    background: var(--_border);
  }

  .step:not(:last-child)::after {
    background: var(--_accent);
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform calc(var(--_stagger) - 0.1s) ease-in-out;
    transition-delay: calc(var(--i) * var(--_stagger) + 0.1s);
  }

  .revealed .number {
    border-color: var(--_accent);
    color: var(--_accent);
  }

  .title {
    margin: 0 0 6px;
    color: var(--_text);
    font-size: var(--_title-size);
    font-weight: 600;
    line-height: 1.3;
  }

  .text {
    color: var(--_muted);
    font-size: var(--_text-size);
  }

  .text > :first-child {
    margin-top: 0;
  }

  .text > :last-child {
    margin-bottom: 0;
  }

  @container (max-width: 639px) {
    .steps {
      grid-template-columns: minmax(0, 1fr);
    }

    .step {
      padding-left: calc(var(--_circle) + 20px);
      min-height: var(--_circle);
    }

    .number {
      position: absolute;
      top: 0;
      left: 0;
      margin: 0;
    }

    .title {
      padding-top: calc((var(--_circle) - var(--_title-size) * 1.3) / 2);
    }

    .step:not(:last-child)::before,
    .step:not(:last-child)::after {
      top: var(--_circle);
      right: auto;
      bottom: calc(-1 * var(--_gap));
      left: calc(var(--_circle) / 2 - 1px);
      width: 2px;
      height: auto;
    }

    .step:not(:last-child)::after {
      transform: scaleY(0);
      transform-origin: center top;
    }
  }

  .steps.list {
    grid-template-columns: minmax(0, 1fr);
  }

  .list .step {
    padding-left: calc(var(--_circle) + 20px);
    min-height: var(--_circle);
  }

  .list .number {
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
  }

  .list .title {
    padding-top: calc((var(--_circle) - var(--_title-size) * 1.3) / 2);
  }

  .list .step:not(:last-child)::before,
  .list .step:not(:last-child)::after {
    top: var(--_circle);
    right: auto;
    bottom: calc(-1 * var(--_gap));
    left: calc(var(--_circle) / 2 - 1px);
    width: 2px;
    height: auto;
  }

  .list .step:not(:last-child)::after {
    transform: scaleY(0);
    transform-origin: center top;
  }

  .list .step::after,
  .list .number {
    transition: none;
  }

  .revealed .step:not(:last-child)::after {
    transform: none;
  }

  .pinned {
    position: relative;
    height: calc(var(--count) * var(--step-height));
  }

  .stage {
    position: sticky;
    top: var(--_sticky-top);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
    align-items: center;
    gap: calc(var(--_gap) * 1.5);
    height: calc(100svh - var(--_sticky-top));
  }

  .counter {
    margin: 0;
    font-family: var(--_mono);
    font-size: var(--_counter-size);
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.04em;
    word-spacing: -0.4em;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .total {
    color: var(--_muted);
    opacity: 0.6;
  }

  .bar {
    position: relative;
    height: 2px;
    max-width: 280px;
    margin-top: 28px;
    background: var(--_border);
    overflow: hidden;
  }

  .bar-fill {
    position: absolute;
    inset: 0;
    background: var(--_accent);
    transform: scaleX(0);
    transform-origin: left center;
  }

  .active .title {
    margin-bottom: 12px;
    font-size: var(--step-active-title-size, clamp(1.5rem, 2.6vw, 2.25rem));
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .active .text {
    max-width: 46ch;
    font-size: var(--step-active-text-size, 18px);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .number,
    .step::after {
      transition: none !important;
    }
  }
`;
