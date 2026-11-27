export const styles = `
  :host {
    --_length: var(--pull-cord-length, 56px);
    --_accent: var(--pull-cord-accent, #43c97e);
    --_line: var(--pull-cord-line, #7d8a82);
    --_mount: var(--pull-cord-mount, #2c352f);
    --_pill: var(--pull-cord-pill, #101411);
    --_pill-border: var(--pull-cord-pill-border, #2c352f);
    --_pill-hover: var(--pull-cord-pill-hover, #7d8a82);
    --_dot: var(--pull-cord-dot, var(--_accent));
    --_hint: var(--pull-cord-hint, #7d8a82);
    --_hint-font: var(--pull-cord-hint-font, ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace);
    --_glow-1: 0 0 2px var(--_dot);
    --_glow-2: 0 0 7px color-mix(in oklab, var(--_dot) 70%, transparent);
    --_glow-armed-1: 0 0 3px var(--_dot);
    --_glow-armed-2: 0 0 10px color-mix(in oklab, var(--_dot) 85%, transparent);
    position: relative;
    display: inline-block;
    vertical-align: top;
    width: 44px;
    height: calc(var(--_length) + 64px);
    pointer-events: none;
  }

  :host([theme='light']) {
    --_accent: var(--pull-cord-accent, #1d8049);
    --_line: var(--pull-cord-line, #65716a);
    --_mount: var(--pull-cord-mount, #c3ccc6);
    --_pill: var(--pull-cord-pill, #edf1ee);
    --_pill-border: var(--pull-cord-pill-border, #c3ccc6);
    --_pill-hover: var(--pull-cord-pill-hover, #65716a);
    --_dot: var(--pull-cord-dot, #65716a);
    --_hint: var(--pull-cord-hint, #65716a);
    --_glow-1: 0 0 0 transparent;
    --_glow-2: 0 0 0 transparent;
    --_glow-armed-1: 0 0 0 transparent;
    --_glow-armed-2: 0 0 0 transparent;
  }

  :host([hidden]) {
    display: none;
  }

  .root,
  .sway,
  .swing {
    position: absolute;
    inset: 0;
  }

  .sway,
  .swing {
    transform-origin: 50% 4px;
  }

  .sway {
    animation: sway 5s ease-in-out infinite;
  }

  .root.active .sway {
    animation-play-state: paused;
  }

  @keyframes sway {
    0%,
    100% {
      transform: rotate(-1.2deg);
    }
    50% {
      transform: rotate(1.2deg);
    }
  }

  .mount {
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 1;
    width: 12px;
    height: 5px;
    margin-left: -6px;
    border-radius: 0 0 3px 3px;
    background: var(--_mount);
  }

  .line {
    position: absolute;
    top: 4px;
    left: 50%;
    width: 1.5px;
    height: var(--_length);
    margin-left: -0.75px;
    background: var(--_line);
    background: color-mix(in oklab, var(--_line), var(--_accent) calc(var(--strain, 0) * 85%));
  }

  .tail {
    position: absolute;
    bottom: calc(50% + 13px);
    left: 50%;
    display: none;
    width: 1.5px;
    height: var(--tail, 0px);
    margin-left: -0.75px;
    background: var(--_line);
  }

  .root.broken .tail {
    display: block;
  }

  .root.broken .handle {
    pointer-events: none;
  }

  .handle {
    position: absolute;
    top: calc(var(--_length) - 5px);
    left: 0;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    pointer-events: auto;
  }

  .root.active .handle {
    cursor: grabbing;
  }

  .handle:focus-visible {
    outline: none;
  }

  .pill {
    position: relative;
    width: 16px;
    height: 26px;
    box-sizing: border-box;
    border: 1px solid var(--_pill-border);
    border-radius: 8px;
    background: var(--_pill);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
    transition: border-color 0.15s ease;
  }

  .handle:hover .pill,
  .handle.armed .pill {
    border-color: var(--_pill-hover);
  }

  .handle:focus-visible .pill {
    outline: 2px solid var(--_accent);
    outline-offset: 2px;
  }

  .dot {
    position: absolute;
    bottom: 5px;
    left: 50%;
    width: 6px;
    height: 6px;
    margin-left: -3px;
    border-radius: 50%;
    background: var(--_dot);
    box-shadow: var(--_glow-1), var(--_glow-2);
  }

  .handle.armed .dot {
    box-shadow: var(--_glow-armed-1), var(--_glow-armed-2);
  }

  .hint {
    position: absolute;
    top: 50%;
    right: calc(100% - 6px);
    font-family: var(--_hint-font);
    font-size: 11px;
    line-height: 1;
    color: var(--_hint);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transform: translate(4px, -50%);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  :host([hint-side='right']) .hint {
    right: auto;
    left: calc(100% - 6px);
    transform: translate(-4px, -50%);
  }

  .root.hinting .hint,
  .handle:hover .hint,
  .handle:focus-visible .hint {
    opacity: 1;
    transform: translate(0, -50%);
  }

  .root.active .hint,
  .root.broken .hint {
    opacity: 0;
  }

  :host([hint='none']) .hint {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .sway {
      animation: none;
    }

    .handle {
      transition: opacity 0.2s ease;
    }

    .root.broken .handle {
      opacity: 0;
    }

    .hint {
      transition: opacity 0.3s ease;
    }
  }
`;
export const documentStyles = `
  html[data-pull-cord-vt]::view-transition-old(root),
  html[data-pull-cord-vt]::view-transition-new(root) {
    animation: none;
    mix-blend-mode: normal;
  }

  html[data-pull-cord-vt='dark']::view-transition-old(root) {
    z-index: 2;
  }

  html[data-pull-cord-vt]::view-transition-group(pull-cord),
  html[data-pull-cord-vt]::view-transition-new(pull-cord) {
    animation: none;
  }

  html[data-pull-cord-vt]::view-transition-group(pull-cord) {
    z-index: 3;
  }

  html[data-pull-cord-vt]::view-transition-old(pull-cord) {
    display: none;
  }
`;
