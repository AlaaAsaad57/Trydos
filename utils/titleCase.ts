/**
 * English UI text with a capital letter at the start of every word:
 * "Your cart is empty" -> "Your Cart Is Empty".
 *
 * The English key IS the English text, so both translateFunction's (client
 * utils/functions, server utils/server) pass their English through this.
 * The keys themselves stay as they are: 109 pairs of keys ("Try again" /
 * "Try Again") would become one key, and the backend values used as keys
 * ("pending", "ready_to_shipping") would stop matching.
 *
 * A word starts at the start of the text, after a space, or after an opening
 * bracket or quote. These words are left as they are:
 *   - a word with a capital inside ("iPhone", "WhatsApp");
 *   - a word with "_" or "@", or with a dot before a letter ("ready_to_shipping",
 *     "example@mail.com", "example.com", "e.g.");
 *   - the units in UNITS ("250 cm", "180 kg");
 *   - a one-letter text: the "k" / "m" suffixes after a number ("1.2k").
 * A {placeholder} starts with "{", so it is never a word here.
 */
const UNITS = new Set(["cm", "kg"]);

export function titleCaseWords(text: string): string {
  if (text.length <= 1) return text;
  return text.replace(
    /(^|[\s(\["“‘«])([a-z]\S*)/g,
    (whole, lead: string, word: string) => {
      // The word starts with a small letter, so any capital in it is inside.
      if (/[A-Z_@]|\.[a-z]/.test(word)) return whole;
      if (UNITS.has(word.replace(/[.,;:!?)]+$/, ""))) return whole;
      return lead + word[0].toUpperCase() + word.slice(1);
    },
  );
}
