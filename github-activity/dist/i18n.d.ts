export interface Plural {
    one: string;
    other: string;
}
export interface Labels {
    total: string;
    streak: string;
    busiest: string;
    less: string;
    more: string;
    source: string;
    contributions: Plural;
    days: Plural;
    noneOn: string;
    countOn: string;
    summary: string;
    range: string;
}
export declare const dictionaries: Record<string, Labels>;
export declare const labelsFor: (locale: string, overrides?: Partial<Labels>) => Labels;
export declare const fill: (template: string, values: Record<string, string>) => string;
