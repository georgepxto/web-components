# `<github-activity>`

A dependency-free web component that renders a GitHub contribution calendar, with stats, month labels, a legend and a wave entrance animation. Works in any stack: plain HTML, React, Vue, Svelte, Astro, Rails templates.

- No runtime dependencies, Shadow DOM, under 8 kB gzipped
- Light and dark themes out of the box, fully themable with CSS custom properties and `::part()`
- English, Portuguese and Spanish built in, any other language through `labels`; dates and month names come from `Intl`
- Responsive through container queries: splits into two rows in narrow containers
- Accessible: the graph is a labelled image, every day has a tooltip, motion respects `prefers-reduced-motion`
- Ships a build-time fetcher and a CLI, so your GitHub token never reaches the browser

## Why the data is fetched separately

GitHub only exposes the contribution calendar through its GraphQL API, which requires a token. A token must never be shipped to the browser, so the work is split in two:

1. **On your server or at build time**, fetch the calendar with the included CLI or `fetchContributions()` and save it as JSON.
2. **In the browser**, `<github-activity>` renders that JSON.

## Install

```sh
npm install @georgepxto/github-activity
```

```js
import '@georgepxto/github-activity';
```

Or load it from a CDN with no build step:

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/georgepxto/web-components@main/github-activity/dist/index.js"></script>
```

## 1. Get the data

Create a token at [github.com/settings/tokens](https://github.com/settings/tokens). A token without extra scopes is enough for public contributions. Keep it in an environment variable or a secret, never in client code.

### With the CLI

```sh
GITHUB_TOKEN=ghp_xxx npx @georgepxto/github-activity octocat --out public/github-activity.json
```

| Option | Description |
| --- | --- |
| `-o, --out <file>` | Write to a file instead of stdout |
| `--from <date>` | Start of the range (at most one year before `--to`) |
| `--to <date>` | End of the range, defaults to today |

### Refresh it every day with GitHub Actions

Save the token as a repository secret named `ACTIVITY_TOKEN`, then add `.github/workflows/github-activity.yml`:

```yaml
name: Update GitHub activity

on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npx --yes @georgepxto/github-activity octocat --out public/github-activity.json
        env:
          GITHUB_TOKEN: ${{ secrets.ACTIVITY_TOKEN }}
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add public/github-activity.json
          git diff --cached --quiet || git commit -m "chore: update github activity"
          git push
```

### From your own server or build script

```js
import { fetchContributions } from '@georgepxto/github-activity/server';

const data = await fetchContributions({
  username: 'octocat',
  token: process.env.GITHUB_TOKEN,
});
```

A minimal cached endpoint with the standard `Request`/`Response` API (Node 18+, Deno, Bun, edge runtimes):

```js
import { fetchContributions } from '@georgepxto/github-activity/server';

let cache = { data: null, at: 0 };

export async function GET() {
  if (!cache.data || Date.now() - cache.at > 6 * 60 * 60 * 1000) {
    cache = { data: await fetchContributions({ username: 'octocat', token: process.env.GITHUB_TOKEN }), at: Date.now() };
  }
  return Response.json(cache.data, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
```

`fetchContributions(options)` accepts `username`, `token`, and optionally `from`, `to` (ISO string or `Date`), `signal` and a custom `fetch`.

## 2. Render it

From a URL:

```html
<github-activity src="/github-activity.json" username="octocat"></github-activity>
```

Inline, with no extra request (handy for server-rendered pages):

```html
<github-activity username="octocat">
  <script type="application/json">{ "weeks": [ ... ] }</script>
</github-activity>
```

As a property:

```js
const element = document.querySelector('github-activity');
element.data = await fetch('/github-activity.json').then((response) => response.json());
```

### Accepted data

Any of these shapes works, so you can also plot activity from GitLab, Codeberg or your own source:

- The output of the CLI or `fetchContributions()`
- The raw GitHub GraphQL response, or its `contributionCalendar` object
- A flat list of days: `[{ "date": "2026-01-31", "count": 4 }, ...]`. Missing days are filled with zero and levels are computed from the counts. You can pass your own `level` (0 to 4) per day.

Invalid dates are dropped and every value is escaped before rendering.

## API

### Attributes

| Attribute | Description |
| --- | --- |
| `src` | URL of the JSON to load |
| `username` | GitHub username, links the caption to the profile |
| `locale` | Language and formatting, for example `pt-BR`. Defaults to the nearest `lang` attribute, then the browser language |
| `theme` | `light`, `dark` or `auto` (default, follows `prefers-color-scheme`) |
| `hide` | Space-separated parts to hide: `stats`, `months`, `caption`, `legend` |
| `animation` | Set to `none` to disable the entrance animation |
| `state` | Set by the component: `loading`, `ready` or `error`. Useful for styling |

### Properties and methods

| Name | Description |
| --- | --- |
| `data` | Get the normalized data, or set any accepted shape |
| `labels` | Partial object that overrides any text (see below) |
| `reload()` | Fetches `src` again |

### Events

| Event | `detail` |
| --- | --- |
| `load` | The normalized data, after `src` loads |
| `error` | The error, when loading or parsing fails |

## Theming

Set these custom properties on the element or any ancestor:

| Property | Default (light / dark) |
| --- | --- |
| `--gha-accent` | `#1f883d` / `#39d353`. Levels 1 to 3 are mixed from it |
| `--gha-level-0` | `#eff2f5` / `#151b23`. Empty day |
| `--gha-level-1` … `--gha-level-4` | Mixes of the accent, override any of them |
| `--gha-text` | `#1f2328` / `#f0f6fc` |
| `--gha-muted` | `#59636e` / `#9198a1` |
| `--gha-border` | `#d1d9e0` / `#3d444d` |
| `--gha-cell-gap` | `3px` |
| `--gha-cell-radius` | `2px` |
| `--gha-cell-max` | `24px`. Largest size a day can grow to |

```css
github-activity {
  --gha-accent: #7c3aed;
  --gha-level-0: #f3f0ff;
  --gha-cell-radius: 50%;
}
```

Style the internals with `::part()`: `root`, `stats`, `stat`, `graph`, `months`, `cell`, `caption`, `legend`.

```css
github-activity::part(stat) {
  font-family: 'JetBrains Mono', monospace;
}
```

The component inherits the page font.

## Languages

English (`en`), Portuguese (`pt`) and Spanish (`es`) are built in. Month names, weekdays, dates and numbers follow the locale automatically. For other languages, or to change any text, set `labels`:

```js
document.querySelector('github-activity').labels = {
  total: 'Beiträge',
  streak: 'Längste Serie',
  busiest: 'Aktivster Tag',
  less: 'Weniger',
  more: 'Mehr',
  source: 'Quelle',
  contributions: { one: 'Beitrag', other: 'Beiträge' },
  days: { one: 'Tag', other: 'Tage' },
  noneOn: 'Keine Beiträge am {date}',
  countOn: '{count} am {date}',
  summary: '{count} auf GitHub vom {from} bis {to}',
  range: '{from} – {to}',
};
```

## Browser support

Chrome and Edge 117+, Safari 16.2+, Firefox 113+. The component uses custom elements, Shadow DOM, CSS subgrid, container queries and `color-mix()`.

## Development

```sh
npm install
npm test
```

`npm test` builds `dist/` and runs the unit tests. To try the demo, serve the package folder over HTTP and open `/demo/`.

## License

MIT
