const light = `
  --_level-0: var(--gha-level-0, #eff2f5);
  --_accent: var(--gha-accent, #1f883d);
  --_text: var(--gha-text, #1f2328);
  --_muted: var(--gha-muted, #59636e);
  --_border: var(--gha-border, #d1d9e0);
`;
const dark = `
  --_level-0: var(--gha-level-0, #151b23);
  --_accent: var(--gha-accent, #39d353);
  --_text: var(--gha-text, #f0f6fc);
  --_muted: var(--gha-muted, #9198a1);
  --_border: var(--gha-border, #3d444d);
`;
export const styles = `
  :host {
    ${light}
    --_level-1: var(--gha-level-1, color-mix(in oklab, var(--_accent) 30%, var(--_level-0)));
    --_level-2: var(--gha-level-2, color-mix(in oklab, var(--_accent) 55%, var(--_level-0)));
    --_level-3: var(--gha-level-3, color-mix(in oklab, var(--_accent) 80%, var(--_level-0)));
    --_level-4: var(--gha-level-4, var(--_accent));
    --_gap: var(--gha-cell-gap, 3px);
    --_radius: var(--gha-cell-radius, 2px);
    --_cell-max: var(--gha-cell-max, 24px);
    display: block;
    container-type: inline-size;
    color: var(--_text);
    font: inherit;
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

  .root {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 0;
  }

  .stat {
    min-width: 0;
    padding: 0 16px;
  }

  .stat:first-child {
    padding-left: 0;
  }

  .stat + .stat {
    border-left: 1px solid var(--_border);
  }

  dt {
    font-size: 12px;
    color: var(--_muted);
  }

  dd {
    margin: 4px 0 0;
    font-size: 24px;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.01em;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }

  .activity {
    --columns: repeat(var(--weeks), minmax(0, var(--_cell-max)));
    width: fit-content;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .canvas {
    display: grid;
    grid-template-columns: var(--columns);
    column-gap: var(--_gap);
    row-gap: 8px;
  }

  .months {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
    font-size: 12px;
    line-height: 1;
    color: var(--_muted);
  }

  .months span {
    grid-row: 1;
    white-space: nowrap;
  }

  .months-half {
    display: none;
  }

  .half {
    grid-column: span var(--span);
    display: grid;
    grid-template-columns: subgrid;
    row-gap: 8px;
  }

  .grid {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
    grid-template-rows: repeat(7, auto);
    grid-auto-flow: column;
    row-gap: var(--_gap);
  }

  .cell {
    display: block;
    aspect-ratio: 1;
    border-radius: var(--_radius);
    background: var(--_level-0);
  }

  .cell[data-level='1'] {
    background: var(--_level-1);
  }

  .cell[data-level='2'] {
    background: var(--_level-2);
  }

  .cell[data-level='3'] {
    background: var(--_level-3);
  }

  .cell[data-level='4'] {
    background: var(--_level-4);
  }

  .pending .grid .cell {
    opacity: 0;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 32px;
  }

  .caption {
    margin: 0;
    font-size: 13px;
    color: var(--_muted);
  }

  .source {
    white-space: nowrap;
  }

  .caption a {
    color: var(--_text);
    text-decoration: underline;
    text-decoration-color: var(--_border);
    text-underline-offset: 4px;
  }

  .caption a:hover {
    text-decoration-color: currentColor;
  }

  .caption a:focus-visible {
    outline: 2px solid var(--_accent);
    outline-offset: 2px;
    border-radius: 2px;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    font-size: 12px;
    color: var(--_muted);
  }

  .swatches {
    display: flex;
    gap: var(--_gap);
  }

  .swatches .cell {
    width: 11px;
  }

  @container (max-width: 639px) {
    .canvas {
      grid-template-columns: repeat(var(--split), minmax(0, var(--_cell-max)));
      row-gap: 16px;
    }

    .months-full {
      display: none;
    }

    .months-half {
      display: grid;
    }

    .half {
      grid-column: 1 / -1;
    }
  }

  @container (max-width: 479px) {
    .stats {
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }

    .stat,
    .stat:first-child {
      padding: 0;
    }

    .stat + .stat {
      border-left: 0;
      border-top: 1px solid var(--_border);
      padding-top: 12px;
    }
  }
`;
