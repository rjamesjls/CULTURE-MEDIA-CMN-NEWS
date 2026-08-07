
const dictionaries = {
  fr: () => import('./fr.json').then((module) => module.default),
  bsh: () => import('./bsh.json').then((module) => module.default),
};

export const getDictionary = async (locale) => {
  // Fallback to 'fr' if the locale is not supported
  const dict = dictionaries[locale] || dictionaries.fr;
  return dict();
};
