"use client";

import type { DemoKey } from "../DemoApp/demoKeys";
import { useDemoNav } from "./screenNav";

/**
 * Capital letters for the English words of Home, a store's page (with its
 * colour sheet) and a product's page, by Apple's rules for iPhone apps.
 *
 * Title style, for titles, labels, buttons, chips, tabs and badges: every
 * word starts with a capital, except these small words in the middle of a
 * phrase: the articles, the joining words "and, but, or, nor", and the
 * prepositions of four letters or fewer. The first and the last word of a
 * phrase always start with a capital ("Made in Turkey", "Sign In").
 *
 * Sentence style, for body text (a description, a promise, a review): only
 * the first word of each sentence starts with a capital.
 *
 * In both, names keep their capital: the months, the days, the countries and
 * the brands in NAMES, and "I". A word that already has a capital inside it
 * ("AI", "FAQ", "USD", "iPhone") is left as it is.
 *
 * A key may hold weight marks (<b>, <m>, <a>, <c>) and {placeholders}. They
 * are never words, and they do not end a phrase. A phrase ends at . ! ? | :
 * or a bracket. Only English is changed: the other languages show their
 * translation as it is written.
 */

/** The small words that stay small in the middle of a title. */
const MINOR = new Set([
  // articles
  "a", "an", "the",
  // joining words
  "and", "but", "or", "nor",
  // prepositions of four letters or fewer
  "as", "at", "by", "for", "from", "in", "into", "like", "near", "of", "off",
  "on", "onto", "out", "over", "past", "per", "than", "to", "up", "upon",
  "via", "with",
]);

/** Names, with their capitals. Keyed by the word in small letters. */
const NAMES: ReadonlyMap<string, string> = new Map(
  [
    "I",
    // months, short and long ("May" is left out: it is also the verb "may")
    "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Sept", "Oct", "Nov", "Dec",
    "January", "February", "March", "April", "June", "July", "August", "September", "October",
    "November", "December",
    // days
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    // countries and nations on these pages
    "Turkey", "Turkish", "Lebanon", "Syria", "Iraq",
    // the brands of the demo
    "Trydos", "Zara", "Mango", "Vakko", "Ebebek", "Gratis", "Stradivarius", "Boyner", "Beymen",
    "Koton", "Bershka", "Sephora", "Rossmann",
  ].map((name) => [name.toLowerCase(), name]),
);

/**
 * A word: letters, with ’ ' or - inside ("don’t", "T-Shirt"). Not the "d"
 * of "1d" or "{n}d", and not the letters of a mark or a placeholder: a word
 * never starts right after a letter, a digit, "}" or "<" / "</".
 */
const WORD = /(?<![\p{L}\p{N}}<\/])\p{L}[\p{L}’'-]*/gu;

/** What ends a phrase or a sentence, between two words. */
const PHRASE_END = /[.!?|:()[\]]/;
const SENTENCE_END = /[.!?]/;

/** The text between two words, without the marks and the placeholders. */
const visible = (gap: string) => gap.replace(/<\/?[bmac]>|\{[^}]*\}/g, "");

const capital = (word: string) =>
  word
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join("-");

/** A word with a capital that is not its first letter: "AI", "iPhone". */
const keepAsIs = (word: string) => /\p{Lu}/u.test(word.slice(1));

/** The words of a text, each with whether it starts or ends its phrase. */
function words(text: string, end: RegExp) {
  const found = [...text.matchAll(WORD)].filter((m) => {
    // Skip the letters inside a {placeholder}.
    const before = text.slice(0, m.index);
    return before.lastIndexOf("{") <= before.lastIndexOf("}");
  });
  return found.map((m, i) => {
    const at = m.index ?? 0;
    const prev = found[i - 1];
    const next = found[i + 1];
    const prevEnd = prev ? (prev.index ?? 0) + prev[0].length : 0;
    const nextAt = next ? (next.index ?? 0) : text.length;
    return {
      at,
      word: m[0],
      starts: !prev || end.test(visible(text.slice(prevEnd, at))),
      ends: !next || end.test(visible(text.slice(at + m[0].length, nextAt))),
    };
  });
}

function rewrite(text: string, end: RegExp, cased: (w: { word: string; starts: boolean; ends: boolean }) => string) {
  let out = "";
  let last = 0;
  for (const w of words(text, end)) {
    out += text.slice(last, w.at) + cased(w);
    last = w.at + w.word.length;
  }
  return out + text.slice(last);
}

/** Title style: "made in turkey" → "Made in Turkey". */
export function titleStyle(text: string): string {
  return rewrite(text, PHRASE_END, ({ word, starts, ends }) => {
    if (keepAsIs(word)) return word;
    const small = word.toLowerCase();
    const name = NAMES.get(small);
    if (name) return name;
    if (MINOR.has(small) && !starts && !ends) return small;
    return capital(word);
  });
}

/** Sentence style: "Get a 25% Cash refund" → "Get a 25% cash refund". */
export function sentenceStyle(text: string): string {
  return rewrite(text, SENTENCE_END, ({ word, starts }) => {
    if (keepAsIs(word)) return word;
    const small = word.toLowerCase();
    const name = NAMES.get(small);
    if (name) return name;
    return starts ? capital(small) : small;
  });
}

/** A brand's or a person's name as data gives it ("boyner") → "Boyner". */
export const nameStyle = (name: string) => name.replace(WORD, (word) => (keepAsIs(word) ? word : capital(word)));

/**
 * The words of the three pages: `t` in title style, `body` in sentence
 * style. Other languages get their translation as it is.
 */
export function useDemoCase() {
  const nav = useDemoNav();
  const english = nav.locale.endsWith("-en");
  return {
    t: (key: DemoKey) => (english ? titleStyle(key) : nav.t(key)),
    body: (key: DemoKey) => (english ? sentenceStyle(key) : nav.t(key)),
  };
}
