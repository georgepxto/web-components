import { type Contributions } from './data.js';
export interface FetchContributionsOptions {
    username: string;
    token: string;
    from?: string | Date;
    to?: string | Date;
    signal?: AbortSignal;
    fetch?: typeof fetch;
}
export declare function fetchContributions(options: FetchContributionsOptions): Promise<Contributions>;
