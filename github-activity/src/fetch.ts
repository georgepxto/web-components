import { normalize, type Contributions } from './data.js';

export interface FetchContributionsOptions {
  username: string;
  token: string;
  from?: string | Date;
  to?: string | Date;
  signal?: AbortSignal;
  fetch?: typeof fetch;
}

const ENDPOINT = 'https://api.github.com/graphql';
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

const QUERY = `
  query($login: String!, $from: DateTime, $to: DateTime) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel weekday } }
        }
      }
    }
  }
`;

const toIso = (value: string | Date | undefined) => {
  if (value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError(`github-activity: invalid date "${String(value)}"`);
  return date.toISOString();
};

export async function fetchContributions(options: FetchContributionsOptions): Promise<Contributions> {
  const { username, token, signal } = options;
  const request = options.fetch ?? globalThis.fetch;

  if (!USERNAME.test(username)) throw new TypeError(`github-activity: invalid GitHub username "${username}"`);
  if (!token) throw new TypeError('github-activity: a GitHub token is required');

  const response = await request(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'github-activity',
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { login: username, from: toIso(options.from), to: toIso(options.to) },
    }),
    signal: signal ?? AbortSignal.timeout(15_000),
  });

  if (!response.ok) throw new Error(`github-activity: GitHub API responded with HTTP ${response.status}`);

  const json = (await response.json()) as {
    data?: { user: unknown };
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    throw new Error(`github-activity: ${json.errors.map((error) => error.message).join('; ')}`);
  }
  if (!json.data?.user) throw new Error(`github-activity: user "${username}" not found`);

  return normalize(json);
}
