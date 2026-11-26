const en = {
    label: 'Light mode',
    hintOn: 'pull to turn on',
    hintOff: 'pull to turn off',
};
const pt = {
    label: 'Modo claro',
    hintOn: 'puxe para acender',
    hintOff: 'puxe para apagar',
};
const es = {
    label: 'Modo claro',
    hintOn: 'tira para encender',
    hintOff: 'tira para apagar',
};
export const dictionaries = { en, pt, es };
export const labelsFor = (locale, overrides) => {
    const language = locale.toLowerCase().split('-')[0];
    return { ...(dictionaries[language] ?? en), ...overrides };
};
