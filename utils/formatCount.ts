/**
 * A count (buyers, views, likes, comments, shares) in short form:
 * 999 -> "999", 1250 -> "1.2K", 2500000 -> "2.5M", 3700000000 -> "3.7B".
 *
 * - One decimal at most, and a ".0" is dropped: 1000 -> "1K", not "1.0K".
 * - The number is rounded down, so a count never looks bigger than it is:
 *   1999 -> "1.9K", 999999 -> "999.9K".
 * - Arabic uses the same letters as the prices in utils/server/helpers.ts
 *   ("أ" / "م"), plus "مليار" for billions. The other languages use K / M / B.
 * - A missing or broken count shows "0", never "NaN".
 *
 * Only for showing a count. Analytics and data-* attributes keep the raw number.
 */
const STEPS = [
  { size: 1e9, en: "B", ar: "مليار" },
  { size: 1e6, en: "M", ar: "م" },
  { size: 1e3, en: "K", ar: "أ" },
];

export function formatCount(value: unknown, language: string = "en"): string {
  const count = Number(value);
  if (value === null || !Number.isFinite(count)) return "0";

  const step = STEPS.find((s) => Math.abs(count) >= s.size);
  if (!step) return String(count);

  // Count in tenths of the step, rounded down, then back to one decimal.
  const short = Math.floor(count / (step.size / 10)) / 10;
  return `${short}${language === "ar" ? step.ar : step.en}`;
}
