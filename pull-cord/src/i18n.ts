export interface Labels {
  label: string;
  hintOn: string;
  hintOff: string;
}

const en: Labels = {
  label: 'Light mode',
  hintOn: 'pull to turn on',
  hintOff: 'pull to turn off',
};

const pt: Labels = {
  label: 'Modo claro',
  hintOn: 'puxe para acender',
  hintOff: 'puxe para apagar',
};

const es: Labels = {
  label: 'Modo claro',
  hintOn: 'tira para encender',
  hintOff: 'tira para apagar',
};

export const dictionaries: Record<string, Labels> = { en, pt, es };

export const labelsFor = (locale: string, overrides?: Partial<Labels>): Labels => {
  const language = locale.toLowerCase().split('-')[0];
  return { ...(dictionaries[language] ?? en), ...overrides };
};
