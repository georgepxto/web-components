const light = `
  --_bg: var(--glass-bg, #f6f8f6);
  --_fg: var(--glass-fg, #0d1310);
  --_active: var(--glass-active, #1d8049);
  --_highlight: var(--glass-highlight, rgba(255, 255, 255, 0.55));
`;

const dark = `
  --_bg: var(--glass-bg, #0b0e0c);
  --_fg: var(--glass-fg, #e9eeea);
  --_active: var(--glass-active, #43c97e);
  --_highlight: var(--glass-highlight, rgba(255, 255, 255, 0.06));
`;

export const styles = `
  :host {
    ${light}
    position: sticky;
    top: 0;
    z-index: var(--glass-z, 50);
    display: block;
    height: 0;
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

  .pill {
    position: relative;
    top: var(--glass-top, 14px);
    display: flex;
    align-items: center;
    gap: 8px;
    width: min(var(--glass-max-width, 1148px), calc(100% - 24px));
    min-height: 58px;
    margin-inline: auto;
    padding: 8px 8px 8px 20px;
    border: 1px solid color-mix(in oklab, var(--_fg) 12%, transparent);
    border-radius: 29px;
    background: color-mix(in oklab, var(--_bg) 58%, transparent);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    backdrop-filter: blur(18px) saturate(160%);
    box-shadow:
      0 12px 32px -8px rgba(0, 0, 0, 0.28),
      inset 0 1px 0 var(--_highlight);
    color: var(--_fg);
  }

  .logo,
  .cta {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
  }

  .logo {
    min-width: 0;
  }

  .links {
    position: relative;
    isolation: isolate;
    display: flex;
    flex: 0 1 auto;
    align-items: center;
    gap: 2px;
    min-width: 0;
    margin-left: auto;
    overflow: hidden;
  }

  .indicator {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    width: 0;
    height: 0;
    border-radius: 999px;
    background: var(--glass-indicator, color-mix(in oklab, var(--_active) 12%, transparent));
    opacity: 0;
    pointer-events: none;
    transition:
      transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1),
      width 0.55s cubic-bezier(0.2, 0.8, 0.2, 1),
      height 0.55s cubic-bezier(0.2, 0.8, 0.2, 1),
      opacity 0.3s ease;
  }

  .indicator.visible {
    opacity: 1;
  }

  ::slotted(a) {
    display: inline-flex;
    flex: none;
    align-items: center;
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    color: color-mix(in oklab, var(--_fg) 72%, transparent);
    font-size: 14px;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.15s ease, background-color 0.15s ease;
  }

  ::slotted(a:hover) {
    color: var(--_fg);
  }

  ::slotted(a[aria-current='true']) {
    color: var(--_active);
    transition: color 0.3s ease;
  }

  ::slotted(a:focus-visible) {
    outline: 2px solid var(--_active);
    outline-offset: 2px;
  }

  :host([wrapped]) .pill {
    flex-wrap: wrap;
    row-gap: 4px;
    padding: 8px 8px 6px 16px;
    border-radius: var(--glass-wrapped-radius, 20px);
  }

  :host([wrapped]) .cta {
    margin-left: auto;
  }

  :host([wrapped]) .links {
    order: 3;
    flex: 1 1 100%;
    margin: 0 -2px 0 -10px;
    padding-top: 4px;
    border-top: 1px solid color-mix(in oklab, var(--_fg) 8%, transparent);
    overflow-x: auto;
    scrollbar-width: none;
  }

  :host([wrapped]) .links::-webkit-scrollbar {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .indicator {
      transition: opacity 0.3s ease;
    }
  }

  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .pill {
      background: color-mix(in oklab, var(--_bg) 94%, transparent);
    }
  }
`;
