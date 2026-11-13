const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;
const MAX_DAYS = 3_700;
const API_LEVELS = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
};
const isObject = (value) => typeof value === 'object' && value !== null;
const pick = (value, ...path) => path.reduce((current, key) => (isObject(current) ? current[key] : undefined), value);
const toDate = (value) => new Date(`${value}T00:00:00Z`);
const isoDay = (time) => new Date(time).toISOString().slice(0, 10);
const unwrap = (input) => {
    const calendar = pick(input, 'data', 'user', 'contributionsCollection', 'contributionCalendar') ??
        pick(input, 'contributionsCollection', 'contributionCalendar') ??
        pick(input, 'contributionCalendar') ??
        input;
    if (Array.isArray(calendar))
        return { days: calendar, total: undefined };
    const weeks = pick(calendar, 'weeks');
    if (Array.isArray(weeks)) {
        return {
            days: weeks.flatMap((week) => {
                const days = pick(week, 'days') ?? pick(week, 'contributionDays');
                return Array.isArray(days) ? days : [];
            }),
            total: pick(calendar, 'total') ?? pick(calendar, 'totalContributions'),
        };
    }
    throw new TypeError('github-activity: unrecognized contributions data');
};
const readDay = (value) => {
    if (!isObject(value))
        return null;
    const date = value.date;
    if (typeof date !== 'string' || !DATE.test(date))
        return null;
    const time = toDate(date).getTime();
    if (Number.isNaN(time) || isoDay(time) !== date)
        return null;
    const rawCount = value.count ?? value.contributionCount;
    const count = typeof rawCount === 'number' && Number.isFinite(rawCount) ? Math.max(0, Math.floor(rawCount)) : 0;
    const rawLevel = value.level ?? (typeof value.contributionLevel === 'string' ? API_LEVELS[value.contributionLevel] : undefined);
    const level = typeof rawLevel === 'number' && Number.isInteger(rawLevel) && rawLevel >= 0 && rawLevel <= 4
        ? rawLevel
        : undefined;
    return { date, count, level, weekday: toDate(date).getUTCDay() };
};
const levelFor = (count, max) => count <= 0 || max <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
export function normalize(input) {
    const { days: rawDays, total: rawTotal } = unwrap(input);
    const byDate = new Map();
    for (const raw of rawDays) {
        const day = readDay(raw);
        if (day)
            byDate.set(day.date, day);
    }
    const sorted = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0)
        throw new TypeError('github-activity: no valid days in contributions data');
    const last = toDate(sorted[sorted.length - 1].date).getTime();
    const start = Math.max(toDate(sorted[0].date).getTime(), last - (MAX_DAYS - 1) * DAY);
    const parsed = [];
    for (let time = start; time <= last; time += DAY) {
        const date = isoDay(time);
        parsed.push(byDate.get(date) ?? { date, count: 0, level: 0, weekday: new Date(time).getUTCDay() });
    }
    const max = Math.max(...parsed.map((day) => day.count));
    const weeks = [];
    for (const day of parsed) {
        const normalized = { ...day, level: day.level ?? levelFor(day.count, max) };
        const current = weeks[weeks.length - 1];
        if (!current || normalized.weekday === 0)
            weeks.push({ days: [normalized] });
        else
            current.days.push(normalized);
    }
    const sum = parsed.reduce((total, day) => total + day.count, 0);
    return {
        total: typeof rawTotal === 'number' && Number.isFinite(rawTotal) ? rawTotal : sum,
        weeks,
        from: parsed[0].date,
        to: parsed[parsed.length - 1].date,
    };
}
export function getStats(weeks) {
    const byWeekday = Array(7).fill(0);
    let total = 0;
    let streak = 0;
    let longestStreak = 0;
    for (const day of weeks.flatMap((week) => week.days)) {
        total += day.count;
        byWeekday[day.weekday] += day.count;
        streak = day.count > 0 ? streak + 1 : 0;
        longestStreak = Math.max(longestStreak, streak);
    }
    const busiest = Math.max(...byWeekday);
    return {
        total,
        longestStreak,
        busiestWeekday: busiest > 0 ? byWeekday.indexOf(busiest) : null,
    };
}
export function getMonthLabels(weeks, minGap = 3) {
    if (weeks.length === 0)
        return [];
    const monthOf = (value) => toDate(value).getUTCMonth();
    const starts = weeks.flatMap((week, column) => {
        const first = week.days.find((day) => day.date.endsWith('-01'));
        return first ? [{ column, month: monthOf(first.date) }] : [];
    });
    if (starts[0]?.column !== 0 && (starts.length === 0 || starts[0].column >= minGap)) {
        starts.unshift({ column: 0, month: monthOf(weeks[0].days[0].date) });
    }
    return starts.reduce((kept, label) => {
        const previous = kept[kept.length - 1];
        if (!previous || label.column - previous.column >= minGap)
            kept.push(label);
        return kept;
    }, []);
}
