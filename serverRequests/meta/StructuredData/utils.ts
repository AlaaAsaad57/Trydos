const localeMap: Record<string, string> = {
  "sy-ar": "ar-SY",
  "sy-en": "en-SY",
  "sy-tr": "tr-SY",
  "sy-ku": "ku-SY",

  "tr-ar": "ar-TR",
  "tr-en": "en-TR",
  "tr-tr": "tr-TR",
  "tr-ku": "ku-TR",

  "iq-ar": "ar-IQ",
  "iq-en": "en-IQ",
  "iq-tr": "tr-IQ",
  "iq-ku": "ku-IQ",

  "lb-ar": "ar-LB",
  "lb-en": "en-LB",
  "lb-tr": "tr-LB",
  "lb-ku": "ku-LB",
};

export function mapLocaleToBCP47(locale: string): string {
  console.log(locale, locale.toLowerCase());
  const mapped = localeMap[locale.toLowerCase()];
  if (!mapped) {
    console.warn(`Locale "${locale}" not mapped. Defaulting to en-US.`);
    return "en-US";
  }
  return mapped;
}
