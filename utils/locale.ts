// The `[lang]` URL segment: `<country>-<language>`, for example `sy-en`.
//
// proxy.ts validates this pair, but its matcher's `missing:` clause skips RSC,
// prefetch and Server Action requests — so those reach app/(client)/[lang]
// unchecked. This is the check for that path.

/** The four languages the app has translation files for. Mirrors proxy.ts. */
export const SUPPORTED_LANGUAGES = ["en", "ar", "tr", "ku"] as const;

/**
 * Is this a `[lang]` segment the app serves?
 *
 * The language is checked against the list, because a language outside it has
 * no translation file and could only ever render English.
 *
 * The country is checked by shape — two lowercase ASCII letters — and not
 * against a list. proxy.ts reads the real country list from the backend at
 * runtime, so a list here would 404 a country on the day the backend adds one.
 * The shape check still bounds the segment to 26 x 26 x 4 values instead of
 * every string a stranger can type, which is what matters once the segment is
 * part of a cache key.
 */
export function isSupportedLocaleSegment(segment: unknown): boolean {
  if (typeof segment !== "string") return false;

  const parts = segment.split("-");
  if (parts.length !== 2) return false;

  const [country, language] = parts;
  if (!/^[a-z]{2}$/.test(country)) return false;

  return (SUPPORTED_LANGUAGES as readonly string[]).includes(language);
}
