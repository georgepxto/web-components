import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMonthLabels, getStats, normalize } from '../dist/data.js';
import { fetchContributions } from '../dist/server.js';

const day = (date, count, extra = {}) => ({ date, count, ...extra });

const apiCalendar = {
  totalContributions: 6,
  weeks: [
    {
      contributionDays: [
        { date: '2025-01-03', contributionCount: 1, contributionLevel: 'FIRST_QUARTILE', weekday: 5 },
        { date: '2025-01-04', contributionCount: 0, contributionLevel: 'NONE', weekday: 6 },
      ],
    },
    {
      contributionDays: [
        { date: '2025-01-05', contributionCount: 5, contributionLevel: 'FOURTH_QUARTILE', weekday: 0 },
      ],
    },
  ],
};

test('normalizes a raw GraphQL response', () => {
  const data = normalize({ data: { user: { contributionsCollection: { contributionCalendar: apiCalendar } } } });
  assert.equal(data.total, 6);
  assert.equal(data.from, '2025-01-03');
  assert.equal(data.to, '2025-01-05');
  assert.equal(data.weeks.length, 2);
  assert.deepEqual(
    data.weeks.flatMap((week) => week.days.map((d) => d.level)),
    [1, 0, 4],
  );
});

test('normalizes the contributionCalendar object and its own output', () => {
  const once = normalize(apiCalendar);
  assert.deepEqual(normalize(once), once);
});

test('normalizes a flat list of days, computing weeks, weekdays and levels', () => {
  const data = normalize([day('2025-03-04', 8), day('2025-03-01', 0), day('2025-03-02', 2), day('2025-03-03', 4)]);
  assert.deepEqual(
    data.weeks.map((week) => week.days.map((d) => d.date)),
    [['2025-03-01'], ['2025-03-02', '2025-03-03', '2025-03-04']],
  );
  assert.deepEqual(
    data.weeks.flatMap((week) => week.days.map((d) => [d.weekday, d.level])),
    [
      [6, 0],
      [0, 1],
      [1, 2],
      [2, 4],
    ],
  );
  assert.equal(data.total, 14);
});

test('fills missing days with zero so streaks and the grid stay aligned', () => {
  const data = normalize([day('2025-03-03', 2), day('2025-03-06', 1)]);
  assert.deepEqual(
    data.weeks.flatMap((week) => week.days.map((d) => [d.date, d.count])),
    [
      ['2025-03-03', 2],
      ['2025-03-04', 0],
      ['2025-03-05', 0],
      ['2025-03-06', 1],
    ],
  );
});

test('drops invalid days and sanitizes counts and levels', () => {
  const data = normalize([
    day('2025-02-30', 3),
    day('not-a-date', 3),
    day('2025-02-10', -4, { level: 9 }),
    day('2025-02-11', 2.7, { level: 2 }),
    { date: '<script>', count: 1 },
    null,
  ]);
  const days = data.weeks.flatMap((week) => week.days);
  assert.deepEqual(
    days.map((d) => [d.date, d.count, d.level]),
    [
      ['2025-02-10', 0, 0],
      ['2025-02-11', 2, 2],
    ],
  );
});

test('rejects unknown shapes and empty data', () => {
  assert.throws(() => normalize({ foo: 1 }), TypeError);
  assert.throws(() => normalize([]), TypeError);
  assert.throws(() => normalize('nope'), TypeError);
});

test('computes stats', () => {
  const data = normalize([
    day('2025-03-02', 1),
    day('2025-03-03', 2),
    day('2025-03-04', 0),
    day('2025-03-05', 3),
    day('2025-03-06', 3),
    day('2025-03-07', 3),
    day('2025-03-10', 9),
  ]);
  assert.deepEqual(getStats(data.weeks), { total: 21, longestStreak: 3, busiestWeekday: 1 });
  assert.deepEqual(getStats(normalize([day('2025-03-02', 0)]).weeks), {
    total: 0,
    longestStreak: 0,
    busiestWeekday: null,
  });
});

test('places month labels without crowding', () => {
  const days = [];
  for (let time = Date.UTC(2025, 0, 26); time <= Date.UTC(2025, 3, 30); time += 86_400_000) {
    days.push(day(new Date(time).toISOString().slice(0, 10), 1));
  }
  const labels = getMonthLabels(normalize(days).weeks);
  assert.deepEqual(
    labels.map((label) => label.month),
    [1, 2, 3],
  );
  assert.deepEqual(
    labels.map((label) => label.column),
    [0, 4, 9],
  );
});

test('fetchContributions sends the token only to the GitHub API and normalizes the answer', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ data: { user: { contributionsCollection: { contributionCalendar: apiCalendar } } } }), {
      status: 200,
    });
  };
  const data = await fetchContributions({ username: 'octocat', token: 't0k3n', fetch: fakeFetch, from: '2025-01-01' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.github.com/graphql');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer t0k3n');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.variables.login, 'octocat');
  assert.equal(body.variables.from, '2025-01-01T00:00:00.000Z');
  assert.equal(body.variables.to, null);
  assert.equal(data.weeks.length, 2);
});

test('fetchContributions validates input and surfaces API errors', async () => {
  const ok = async () => new Response(JSON.stringify({ errors: [{ message: 'Bad credentials' }] }), { status: 200 });
  await assert.rejects(fetchContributions({ username: 'bad name', token: 'x', fetch: ok }), TypeError);
  await assert.rejects(fetchContributions({ username: 'octocat', token: '', fetch: ok }), TypeError);
  await assert.rejects(fetchContributions({ username: 'octocat', token: 'x', fetch: ok }), /Bad credentials/);
  const missing = async () => new Response(JSON.stringify({ data: { user: null } }), { status: 200 });
  await assert.rejects(fetchContributions({ username: 'octocat', token: 'x', fetch: missing }), /not found/);
  const down = async () => new Response('', { status: 502 });
  await assert.rejects(fetchContributions({ username: 'octocat', token: 'x', fetch: down }), /HTTP 502/);
});

test('the browser entry can be imported on the server without a DOM', async () => {
  const module = await import('../dist/index.js');
  assert.equal(typeof module.GitHubActivity, 'function');
  assert.equal(typeof module.normalize, 'function');
});
