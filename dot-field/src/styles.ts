const light = `
  --_dot: var(--dot-color, rgba(13, 19, 16, 0.18));
  --_active: var(--dot-active-color, #1d8049);
`;

const dark = `
  --_dot: var(--dot-color, rgba(233, 238, 234, 0.16));
  --_active: var(--dot-active-color, #43c97e);
`;

export const styles = `
  :host {
    ${light}
    position: relative;
    display: block;
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

  canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .content {
    position: relative;
  }

  .probe {
    display: none;
  }

  .probe-dot {
    color: var(--_dot);
  }

  .probe-active {
    color: var(--_active);
  }
`;
