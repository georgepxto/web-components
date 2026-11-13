export type ContributionLevel = 0 | 1 | 2 | 3 | 4;
export interface ContributionDay {
    date: string;
    count: number;
    level: ContributionLevel;
    weekday: number;
}
export interface ContributionWeek {
    days: ContributionDay[];
}
export interface Contributions {
    total: number;
    weeks: ContributionWeek[];
    from: string;
    to: string;
}
export interface ContributionStats {
    total: number;
    longestStreak: number;
    busiestWeekday: number | null;
}
export interface MonthLabel {
    column: number;
    month: number;
}
export declare function normalize(input: unknown): Contributions;
export declare function getStats(weeks: ContributionWeek[]): ContributionStats;
export declare function getMonthLabels(weeks: ContributionWeek[], minGap?: number): MonthLabel[];
