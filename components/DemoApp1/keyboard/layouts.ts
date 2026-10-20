/**
 * The key maps of the demo's own keyboard (`DemoKeyboard`), as on the iPhone.
 *
 * A layout is rows of keys. A plain string is a key that types itself. The
 * other keys are named actions (`shift`, `back`, …) the keyboard draws and
 * handles itself.
 */

/** What the field asks for: its `data-kb` mark. */
export type FieldKind = "text" | "email" | "search" | "decimal" | "tel" | "numeric";

/** The letter maps the globe key walks through. */
export type Language = "en" | "ar";

/** The page of the letter keyboard on show. */
export type Page = "letters" | "numbers" | "symbols";

export type Action =
  | "shift"
  | "back"
  | "numbers"
  | "symbols"
  | "letters"
  | "space"
  | "return";

export type Key =
  | { type: "char"; char: string; /** Its share of the row; 1 is one letter key. */ grow?: number }
  | { type: "action"; action: Action; grow: number }
  | { type: "gap"; grow: number };

const chars = (row: string): Key[] =>
  [...row].map((char) => ({ type: "char", char }));
const act = (action: Action, grow: number): Key => ({ type: "action", action, grow });
const gap = (grow: number): Key => ({ type: "gap", grow });

/** The last row of every page: 123, space, (@ and . for an email), return. */
const bottom = (toggle: "numbers" | "letters", kind: FieldKind): Key[] => [
  act(toggle, 2.5),
  ...(kind === "email"
    ? [act("space", 3), ...chars("@."), act("return", 2.5)]
    : [act("space", 5), act("return", 2.5)]),
];

const LETTERS: Record<Language, (kind: FieldKind) => Key[][]> = {
  en: (kind) => [
    chars("qwertyuiop"),
    [gap(0.5), ...chars("asdfghjkl"), gap(0.5)],
    [act("shift", 1.3), gap(0.2), ...chars("zxcvbnm"), gap(0.2), act("back", 1.3)],
    bottom("numbers", kind),
  ],
  // The iPhone's Arabic map: eleven keys a row, and no shift.
  ar: (kind) => [
    chars("ضصثقفغعهخحج"),
    chars("شسيبلاتنمكط"),
    [...chars("ذءؤرىةوزظد"), act("back", 1)],
    bottom("numbers", kind),
  ],
};

/** The marks that differ on the Arabic number pages. */
const arabicMarks = (row: string) =>
  row.replace(";", "؛").replace(",", "،").replace("?", "؟");

const marks = (language: Language, row: string) =>
  language === "ar" ? arabicMarks(row) : row;

/** The rows of the letter keyboard for one page. */
export function letterRows(
  language: Language,
  page: Page,
  kind: FieldKind,
): Key[][] {
  if (page === "letters") return LETTERS[language](kind);
  const last = (toggle: "symbols" | "numbers"): Key[] => [
    act(toggle, 1.3),
    gap(0.2),
    ...chars(marks(language, ".,?!'")).map((key) => ({ ...key, grow: 1.4 })),
    gap(0.2),
    act("back", 1.3),
  ];
  return page === "numbers"
    ? [
        chars("1234567890"),
        chars(marks(language, '-/:;()$&@"')),
        last("symbols"),
        bottom("letters", kind),
      ]
    : [
        chars("[]{}#%^*+="),
        chars("_\\|~<>€£¥•"),
        last("numbers"),
        bottom("letters", kind),
      ];
}

/** A key of the number pad: the digit only, with no letters under it. */
export type PadKey =
  | { type: "char"; char: string }
  | { type: "action"; action: "back" }
  | { type: "empty" };

/**
 * The number pad, three keys a row. The key left of 0 is the decimal mark for
 * an amount, "+" for a phone number, and no key for a code.
 */
export function padRows(kind: FieldKind): PadKey[][] {
  const digit = (char: string): PadKey => ({ type: "char", char });
  const corner: PadKey =
    kind === "decimal"
      ? digit(".")
      : kind === "tel"
        ? digit("+")
        : { type: "empty" };
  return [
    [digit("1"), digit("2"), digit("3")],
    [digit("4"), digit("5"), digit("6")],
    [digit("7"), digit("8"), digit("9")],
    [corner, digit("0"), { type: "action", action: "back" }],
  ];
}

/** True for the fields the number pad types. */
export const isPad = (kind: FieldKind) =>
  kind === "decimal" || kind === "tel" || kind === "numeric";

/** The kind of keyboard a field asks for, from the marks the page gave it. */
export function kindOf(type: string, inputMode: string | null): FieldKind {
  if (inputMode === "decimal") return "decimal";
  if (inputMode === "tel" || type === "tel") return "tel";
  if (inputMode === "numeric" || type === "number") return "numeric";
  if (inputMode === "email" || type === "email") return "email";
  if (inputMode === "search" || type === "search") return "search";
  return "text";
}

/**
 * Whether the next letter is a capital on its own: at the start of a field
 * and after the end of a sentence. Not in an email or a search.
 */
export function startsSentence(before: string, kind: FieldKind) {
  if (kind !== "text") return false;
  return before === "" || /[.!?]\s+$/.test(before) || before.endsWith("\n");
}
