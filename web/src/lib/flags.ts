// Country flags. New scans store an ISO 3166-1 alpha-2 `countryCode` (from the label reader); for wines
// saved before that, or countries typed by hand, the code is looked up from the country name.

/** "IL" -> 🇮🇱 (regional indicator symbols; iOS and macOS draw them as flags). */
export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

// Wine-producing countries, by the names (and common variants) a label or a person would use.
const BY_NAME: Record<string, string> = {
  argentina: 'AR', armenia: 'AM', australia: 'AU', austria: 'AT', brazil: 'BR', bulgaria: 'BG', canada: 'CA',
  chile: 'CL', china: 'CN', croatia: 'HR', cyprus: 'CY', 'czech republic': 'CZ', czechia: 'CZ', england: 'GB',
  france: 'FR', georgia: 'GE', germany: 'DE', greece: 'GR', hungary: 'HU', india: 'IN', israel: 'IL', italy: 'IT',
  japan: 'JP', lebanon: 'LB', luxembourg: 'LU', mexico: 'MX', moldova: 'MD', morocco: 'MA', 'new zealand': 'NZ',
  'north macedonia': 'MK', macedonia: 'MK', portugal: 'PT', romania: 'RO', russia: 'RU', serbia: 'RS',
  slovakia: 'SK', slovenia: 'SI', 'south africa': 'ZA', spain: 'ES', switzerland: 'CH', turkey: 'TR', türkiye: 'TR',
  ukraine: 'UA', 'united kingdom': 'GB', uk: 'GB', 'great britain': 'GB', wales: 'GB', scotland: 'GB',
  'united states': 'US', usa: 'US', 'united states of america': 'US', uruguay: 'UY', armenia_: 'AM',
  // A few names as printed on labels
  'república argentina': 'AR', españa: 'ES', italia: 'IT', deutschland: 'DE', österreich: 'AT', 'sakartvelo': 'GE',
  'ישראל': 'IL', 'צרפת': 'FR', 'איטליה': 'IT', 'ספרד': 'ES', 'גאורגיה': 'GE',
};

export function countryCodeFor(name: string): string {
  return BY_NAME[name.trim().toLowerCase()] ?? '';
}

/** The flag for a wine: its stored code first, otherwise looked up from the country name. */
export function wineFlag(w: { countryCode?: string; country: string }): string {
  return flagEmoji(w.countryCode || countryCodeFor(w.country));
}
