#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fetchContributions } from '../dist/server.js';

const usage = `Usage: github-activity <username> [options]

Fetches a GitHub contribution calendar and prints it as JSON for <github-activity>.
Reads the token from GITHUB_TOKEN (or GH_TOKEN). A token without scopes is enough.

Options:
  -o, --out <file>   Write to a file instead of stdout
      --from <date>  Start of the range (ISO date, max one year before --to)
      --to <date>    End of the range (defaults to today)
  -h, --help         Show this message`;

const fail = (message) => {
  console.error(`github-activity: ${message}`);
  process.exit(1);
};

let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: 'string', short: 'o' },
      from: { type: 'string' },
      to: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
} catch (error) {
  fail(`${error.message}\n\n${usage}`);
}

const { values, positionals } = parsed;

if (values.help) {
  console.log(usage);
  process.exit(0);
}

const username = positionals[0];
if (!username) fail(`missing <username>\n\n${usage}`);

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) fail('set GITHUB_TOKEN (or GH_TOKEN) in the environment');

try {
  const data = await fetchContributions({ username, token, from: values.from, to: values.to });
  const json = `${JSON.stringify(data, null, 2)}\n`;
  if (values.out) {
    const file = resolve(values.out);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, json, 'utf8');
    console.error(`github-activity: wrote ${data.weeks.length} weeks (${data.total} contributions) to ${values.out}`);
  } else {
    process.stdout.write(json);
  }
} catch (error) {
  fail(error.message.replace(/^github-activity: /, ''));
}
