type Scalar = string | number | boolean | null;

const aliases: Record<string, Record<string, string>> = {
  communication_language: {francais: 'French', anglais: 'English'},
  production_style: {
    'artisanale en petite serie': 'handmade, small-batch',
    'petite serie': 'small-batch',
    artisanale: 'handmade',
    artisanal: 'handmade',
  },
  base_finish: {
    'base mate sable': 'matte sand',
    'mate sable': 'matte sand',
    'sable mat': 'matte sand',
    'blanc casse': 'off-white',
  },
  accent_color: {'vert fonce': 'dark green', 'bleu encre': 'ink-blue'},
  moroccan_production_centre: {maroc: 'Morocco'},
};

// Canonicalize explicit units and known bilingual terms; no fuzzy matching,
// negation removal, or invented values. Raw extracted claims remain intact.
export function normalizeRequirementValue(key: string, value: Scalar): Scalar {
  if (typeof value !== 'string') return value;
  const text = value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .trim();
  if (key === 'capacity') {
    const match = /^(\d+(?:[.,]\d+)?)\s*(?:oz|onces?|ounces?)$/u.exec(text);
    return match ? Number(match[1]!.replace(',', '.')) : value;
  }
  if (key === 'production_time' || key === 'production_time_preferred') {
    const range =
      /^(\d+)\s*(?:a|–|-|to)\s*(\d+)\s*(?:jours|days)(?: apres validation de l'echantillon)?$/u.exec(
        text,
      );
    if (range && Number(range[1]) <= Number(range[2])) return Number(range[2]);
    const single = /^(\d+)\s*(?:jours|days|calendar days)$/u.exec(text);
    return single ? Number(single[1]) : value;
  }
  const dictionary = aliases[key];
  if (!dictionary) return value;
  // Negation may govern the whole list, including later alternatives.
  if (/\b(?:pas|non|ni|sans|not|no|neither|without|never|aucun|aucune)\b/u.test(text)) return null;
  return text
    .split(/[,|/]|\s+(?:and|or|et|ou)\s+/u)
    .map((part) => dictionary[part.trim()] ?? part.trim())
    .join(', ');
}
