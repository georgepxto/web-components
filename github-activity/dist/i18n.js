const en = {
    total: 'Contributions',
    streak: 'Longest streak',
    busiest: 'Most active day',
    less: 'Less',
    more: 'More',
    source: 'Source',
    contributions: { one: 'contribution', other: 'contributions' },
    days: { one: 'day', other: 'days' },
    noneOn: 'No contributions on {date}',
    countOn: '{count} on {date}',
    summary: '{count} on GitHub from {from} to {to}',
    range: '{from} – {to}',
};
const pt = {
    total: 'Contribuições',
    streak: 'Maior sequência',
    busiest: 'Dia mais ativo',
    less: 'Menos',
    more: 'Mais',
    source: 'Fonte',
    contributions: { one: 'contribuição', other: 'contribuições' },
    days: { one: 'dia', other: 'dias' },
    noneOn: 'Nenhuma contribuição em {date}',
    countOn: '{count} em {date}',
    summary: '{count} no GitHub de {from} a {to}',
    range: '{from} a {to}',
};
const es = {
    total: 'Contribuciones',
    streak: 'Racha más larga',
    busiest: 'Día más activo',
    less: 'Menos',
    more: 'Más',
    source: 'Fuente',
    contributions: { one: 'contribución', other: 'contribuciones' },
    days: { one: 'día', other: 'días' },
    noneOn: 'Ninguna contribución el {date}',
    countOn: '{count} el {date}',
    summary: '{count} en GitHub del {from} al {to}',
    range: '{from} – {to}',
};
export const dictionaries = { en, pt, es };
export const labelsFor = (locale, overrides) => {
    const language = locale.toLowerCase().split('-')[0];
    return { ...(dictionaries[language] ?? en), ...overrides };
};
export const fill = (template, values) => template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
