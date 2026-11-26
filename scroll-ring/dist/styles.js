const light = `
  --_color: var(--ring-color, #1d8049);
  --_track: var(--ring-track, #dbe2dd);
  --_bg: var(--ring-bg, #ffffff);
  --_fg: var(--ring-fg, #0d1310);
`;
const dark = `
  --_color: var(--ring-color, #43c97e);
  --_track: var(--ring-track, #1f2622);
  --_bg: var(--ring-bg, #101411);
  --_fg: var(--ring-fg, #e9eeea);
`;
export const styles = `
  :host {
    ${light}
    position: fixed;
    right: calc(var(--ring-inset, 20px) + env(safe-area-inset-right, 0px));
    bottom: calc(var(--ring-inset, 20px) + env(safe-area-inset-bottom, 0px));
    z-index: var(--ring-z, 40);
    display: block;
    width: 48px;
    height: 48px;
    pointer-events: none;
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

  .button {
    position: relative;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--_bg);
    box-shadow: 0 6px 18px -6px rgba(0, 0, 0, 0.3);
    color: var(--_fg);
    font: inherit;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transform: translateY(12px);
    transition:
      opacity 0.25s ease,
      transform 0.25s ease,
      visibility 0s linear 0.25s;
    -webkit-tap-highlight-color: transparent;
  }

  :host([visible]) .button {
    opacity: 1;
    visibility: visible;
    transform: none;
    pointer-events: auto;
    transition:
      opacity 0.25s ease,
      transform 0.25s ease,
      visibility 0s;
  }

  .button:focus-visible {
    outline: 2px solid var(--_color);
    outline-offset: 3px;
  }

  .ring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
    fill: none;
    stroke-width: 2;
  }

  .track {
    stroke: var(--_track);
  }

  .bar {
    stroke: var(--_color);
    stroke-linecap: round;
    stroke-dasharray: 100;
  }

  .arrow {
    position: relative;
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 0.2s ease;
  }

  .button:hover .arrow {
    transform: translateY(-2px);
  }

  @media (prefers-reduced-motion: reduce) {
    .button,
    :host([visible]) .button {
      transform: none;
    }

    .arrow,
    .button:hover .arrow {
      transform: none;
      transition: none;
    }
  }
`;
