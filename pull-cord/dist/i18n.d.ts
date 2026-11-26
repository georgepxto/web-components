export interface Labels {
    label: string;
    hintOn: string;
    hintOff: string;
}
export declare const dictionaries: Record<string, Labels>;
export declare const labelsFor: (locale: string, overrides?: Partial<Labels>) => Labels;
