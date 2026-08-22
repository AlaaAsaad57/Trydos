// What a shopper does with their own details.
//
// Follows the rules in `nav.ts`: `page` first then one options object, an
// action asserts its own success, an action returns what the spec needs, and no
// spec ever sees a raw selector.
//
// ---------------------------------------------------------------------------
// Nothing here returns the account's name, phone or e-mail
//
// They are not credentials, but this repository is public and a failure message
// is published, so a helper that hands a name back to a spec is one careless
// `expect(name).toBe(other)` away from printing it. Every comparison therefore
// happens **inside** this module (or inside the browser) and comes back as a
// boolean. The one exception is `readName`, which a spec needs so it can put the
// original back afterwards — it is held in a variable and never asserted on.

import { expect, type Page } from "@playwright/test";

import { profile } from "../selectors";
import { chooseRegionIfAsked } from "./nav";

/** The country-and-language prefix the app chose for this run.
 *
 *  Never hard-coded: reached over loopback there is no geo header, so which
 *  country a run lands on is the backend's answer and not ours. Read it off the
 *  address after any navigation. */
const localePrefix = (page: Page): string => {
  const first = new URL(page.url()).pathname.split("/")[1] ?? "";
  // "iq-en" — country first, then language.
  return /^[a-z]{2}-[a-z]{2}$/.test(first) ? first : "";
};

const gotoUnderLocale = async (page: Page, path: string): Promise<void> => {
  const prefix = localePrefix(page);
  expect(
    prefix,
    "no country-and-language prefix in the address yet — open a storefront page first",
  ).not.toBe("");

  await page.goto(`/${prefix}${path}`, { waitUntil: "domcontentloaded" });
  await chooseRegionIfAsked(page);
};

/** Open the settings page, where the shopper's card sits.
 *
 *  Waits for the country control, which the page renders whoever is looking, so
 *  a card read straight after this is reading a settled page rather than one
 *  still streaming. Without the wait an absent card cannot be told apart from a
 *  card that has not arrived yet. */
export const gotoSettings = async (page: Page): Promise<void> => {
  await gotoUnderLocale(page, "/settings");
  await expect(
    page.getByTestId("country-button"),
    "the settings page did not render",
  ).toBeVisible();
};

/** Open the personal-info form. */
export const gotoPersonalInfo = async (page: Page): Promise<void> => {
  await gotoUnderLocale(page, "/settings/profile/info");
  await expect(
    profile.nameField(page),
    "the personal-info form did not render",
  ).toBeVisible();
};

/** What the settings card says about the visitor.
 *
 *  Booleans only. `shown` is the whole signal for "the app thinks somebody is
 *  signed in": the card's link is rendered only for a visitor with a usable
 *  phone on record. */
export const readProfileCard = async (
  page: Page,
): Promise<{ shown: boolean; verified: boolean; unverified: boolean }> => ({
  shown: await profile.card(page).isVisible(),
  verified: await profile.verifiedMark(page).isVisible(),
  unverified: await profile.unverifiedMark(page).isVisible(),
});

/** Does the card show the name the app itself holds for this account?
 *
 *  Both values are read and compared **in the browser**, so neither reaches
 *  Node and neither can be printed. An empty stored name answers `false` rather
 *  than matching an empty card, because "both are blank" is not a match worth
 *  passing on. */
export const cardShowsAccountName = async (page: Page): Promise<boolean> =>
  page.evaluate(async () => {
    const stored = await fetch("/api/auth/me", {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((body) => String(body?.user?.name ?? "").trim())
      .catch(() => "");

    if (!stored) return false;

    return (document.body.innerText ?? "").includes(stored);
  });

/** The name currently in the form.
 *
 *  Held by a spec so it can be put back. Never assert on it — see the note at
 *  the top of this file. */
export const readName = async (page: Page): Promise<string> =>
  (await profile.nameField(page).inputValue()).trim();

/** Is the form showing this exact name? Compared here so the value stays here. */
export const nameFieldIs = async (
  page: Page,
  options: { name: string },
): Promise<boolean> => (await readName(page)) === options.name;

/** Is the phone field filled with the account's own number?
 *
 *  Compared in the browser against what the app holds, so the number never
 *  reaches Node. Digits only on both sides: the field renders the number
 *  without its "+", and the stored copy carries one. */
export const phoneFieldMatchesAccount = async (
  page: Page,
): Promise<boolean> =>
  page.evaluate(async () => {
    const digits = (value: unknown) => String(value ?? "").replace(/\D/g, "");

    const stored = await fetch("/api/auth/me", {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((body) => digits(body?.user?.phone))
      .catch(() => "");

    if (!stored) return false;

    const field = document.querySelector<HTMLInputElement>(
      '[data-pw="personal-info-phone-number-input"]',
    );
    return digits(field?.value) === stored;
  });

/** The English validation messages the form can put on screen.
 *
 *  Matched by text, which is normally forbidden in this suite — but these four
 *  strings **are** the thing being reported, there is no marker on them, and
 *  every spec that reaches this form has pinned the language to English. If a
 *  marker is ever added to the app, use it instead. */
const VALIDATION_MESSAGES = [
  "Full name is required",
  "Name Should be atleast 8 characters",
  "Phone number is required",
  "Please enter a valid phone number",
  "Please enter a valid email address",
  "Please select your gender",
] as const;

/** Whichever validation message the form is showing, or `null`.
 *
 *  A save that never reaches a backend is nearly always one of these, and
 *  saying which one turns "nothing was sent" into a finished answer. */
export const visibleValidationMessage = async (
  page: Page,
): Promise<string | null> => {
  for (const message of VALIDATION_MESSAGES) {
    // `.first()`: `isVisible()` is strict and throws when a locator matches
    // more than one node, which would turn "say which message" into a crash.
    if (await page.getByText(message, { exact: true }).first().isVisible()) {
      return message;
    }
  }
  return null;
};

/** Put a name in the form. Does not save. */
export const typeName = async (
  page: Page,
  options: { name: string },
): Promise<void> => {
  const field = profile.nameField(page);
  await expect(field, "the name field is not editable").toBeEditable();
  await field.fill(options.name);
  await expect(
    field,
    "the name field did not take what was typed into it",
  ).toHaveValue(options.name);
};

/** Press Save and wait for the form's own signal that it went through.
 *
 *  On success `PersonalInfoForm` sends the browser to the profile card page, so
 *  landing there is the app saying it saved — not a guess, and not a timer.
 *
 *  Returns an outcome rather than asserting, because "the form refused it" is a
 *  real answer a spec may want to make its own judgement about (rule 5 in
 *  `nav.ts`). */
export type SaveOutcome = {
  saved: boolean;
  /** The validation message that stopped it, when one did. */
  refusedWith: string | null;
};

export const attemptSave = async (
  page: Page,
  options: { timeoutMs?: number } = {},
): Promise<SaveOutcome> => {
  const button = profile.saveButton(page);
  await expect(button, "there is no Save control on the form").toBeVisible();
  await button.click();

  const saved = await page
    // Anchored, and it must NOT match "/settings/profile/info" — the form's
    // own address. A looser pattern would report every refused save as saved.
    .waitForURL(/\/settings\/profile\/?(\?.*)?$/, {
      timeout: options.timeoutMs ?? 45_000,
      waitUntil: "domcontentloaded",
    })
    .then(() => true)
    .catch(() => false);

  return {
    saved,
    refusedWith: saved ? null : await visibleValidationMessage(page),
  };
};

/** Is a gender set on the account?
 *
 *  Worth its own question: the form refuses **every** save until one is, so an
 *  account without one makes a name change impossible and no backend is ever
 *  asked. A spec that does not check this first reports a missing write and
 *  blames a backend that was never called. */
export const hasGenderSet = async (page: Page): Promise<boolean> =>
  profile.chosenGender(page).isVisible();
