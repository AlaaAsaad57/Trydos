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

// ---------------------------------------------------------------------------
// The rest of the personal-info form: gender, e-mail, alternative phone
//
// All three ride the same Save as the name, so there is no second save path to
// cover — only three more fields to set and read back. `buildChangedFields`
// sends **only** what changed, so a case that touches one field does not
// silently resend the others.

/** Which gender is chosen, as a position: 0 Man, 1 Woman, 2 Other.
 *
 *  `-1` when none is — which is worth knowing, because the form refuses every
 *  save until one is set. A position and not a label: the labels are
 *  translated, the order is not. */
export const readGender = async (page: Page): Promise<number> => {
  const choices = profile.genderChoices(page);
  const count = await choices.count();

  for (let index = 0; index < count; index += 1) {
    const marker = await choices.nth(index).getAttribute("data-pw");
    if (marker === "active-gender-input") return index;
  }
  return -1;
};

/** Choose a gender by position. Does not save. */
export const chooseGender = async (
  page: Page,
  options: { index: number },
): Promise<void> => {
  await profile.genderChoices(page).nth(options.index).click();

  await expect
    .poll(() => readGender(page), {
      message: `the form did not take gender ${options.index}`,
    })
    .toBe(options.index);
};

/** Whichever gender is **not** the one on the account, so a case can change it
 *  to something and change it back. Never Man-to-Man. */
export const otherGenderThan = (index: number): number =>
  index === 0 ? 1 : 0;

export const readEmail = async (page: Page): Promise<string> =>
  (await profile.emailField(page).inputValue()).trim();

export const typeEmail = async (
  page: Page,
  options: { email: string },
): Promise<void> => {
  const field = profile.emailField(page);
  await expect(field, "the e-mail field is not editable").toBeEditable();
  await field.fill(options.email);
  await expect(
    field,
    "the e-mail field did not take what was typed into it",
  ).toHaveValue(options.email);
};

/** The alternative phone, digits only.
 *
 *  Digits because the field strips and reformats what is typed — comparing the
 *  raw strings would report a difference the shopper never made. */
export const readAlternativePhone = async (page: Page): Promise<string> =>
  (await profile.alternativePhoneField(page).inputValue()).replace(/\D/g, "");

export const typeAlternativePhone = async (
  page: Page,
  options: { phone: string },
): Promise<void> => {
  const field = profile.alternativePhoneField(page);
  await expect(field, "the alternative phone field is not editable").toBeEditable();
  await field.fill(options.phone);
};

/** Put a number in the main phone field, the way a shopper would.
 *
 *  **Not `fill()`.** That field is controlled by `usePhoneInput`, whose setter
 *  constrains what it accepts by the country's own length rules — so a value
 *  pasted in one go can be rejected outright, leaving the field on its previous
 *  number and the form correctly concluding nothing was edited. Typing it
 *  character by character is what a shopper does and what the hook expects.
 *
 *  Answers whether the field ended up holding what was asked for, so a caller
 *  can tell "the field would not take it" from "the app ignored the change". */
export const typePhone = async (
  page: Page,
  options: { phone: string },
): Promise<boolean> => {
  const field = profile.phoneField(page);
  await expect(field, "the phone field is not editable").toBeEditable();

  await field.click();
  await field.press("ControlOrMeta+a");
  await field.press("Backspace");
  await field.pressSequentially(options.phone.replace(/^\+/, ""), { delay: 30 });
  await field.blur();

  const digits = (value: string) => value.replace(/\D/g, "");
  return digits(await field.inputValue()).endsWith(
    digits(options.phone).slice(-6),
  );
};

/** Is the alternative phone this exact number? Digits on both sides. */
export const alternativePhoneIs = async (
  page: Page,
  options: { phone: string },
): Promise<boolean> =>
  (await readAlternativePhone(page)) === options.phone.replace(/\D/g, "");

// ---------------------------------------------------------------------------
// The size screen
//
// Its own page and its own Save, but the same fan-out underneath: it calls
// `auth.UpdateProfile` too, so a height change writes to stories and chat as
// well as to the core backend — with the name and phone unchanged.

export const gotoSize = async (page: Page): Promise<void> => {
  await gotoUnderLocale(page, "/settings/profile/size");
  await expect(
    profile.heightField(page),
    "the size form did not render",
  ).toBeVisible();
};

/** Height and weight as the form holds them, digits only.
 *
 *  Digits because the form renders Arabic numerals in Arabic, and a run that
 *  reads them raw would compare "١٧٥" with "175". */
export const readSize = async (
  page: Page,
): Promise<{ height: string; weight: string }> => ({
  height: (await profile.heightField(page).inputValue()).replace(/\D/g, ""),
  weight: (await profile.weightField(page).inputValue()).replace(/\D/g, ""),
});

export const typeSize = async (
  page: Page,
  options: { height: string; weight: string },
): Promise<void> => {
  await profile.heightField(page).fill(options.height);
  await profile.weightField(page).fill(options.weight);
};

export const sizeIs = async (
  page: Page,
  options: { height: string; weight: string },
): Promise<boolean> => {
  const current = await readSize(page);
  return current.height === options.height && current.weight === options.weight;
};

/** The size screen's own validation messages, for the same reason as the
 *  personal-info ones above: they are what is being reported and carry no
 *  marker. */
const SIZE_VALIDATION_MESSAGES = [
  "Height is required",
  "Height must be between 110 and 250 cm",
  "Weight is required",
  "Weight must be between 40 and 180 kg",
] as const;

export const visibleSizeValidationMessage = async (
  page: Page,
): Promise<string | null> => {
  for (const message of SIZE_VALIDATION_MESSAGES) {
    if (await page.getByText(message, { exact: true }).first().isVisible()) {
      return message;
    }
  }
  return null;
};

/** Press Save on the size screen and wait for its own signal.
 *
 *  Same signal as the personal-info form: on success it sends the browser to
 *  the profile card page. */
export const attemptSizeSave = async (
  page: Page,
  options: { timeoutMs?: number } = {},
): Promise<SaveOutcome> => {
  const button = profile.sizeSaveButton(page);
  await expect(button, "there is no Save control on the size form").toBeVisible();
  await button.click();

  const saved = await page
    .waitForURL(/\/settings\/profile\/?(\?.*)?$/, {
      timeout: options.timeoutMs ?? 45_000,
      waitUntil: "domcontentloaded",
    })
    .then(() => true)
    .catch(() => false);

  return {
    saved,
    refusedWith: saved ? null : await visibleSizeValidationMessage(page),
  };
};

// ---------------------------------------------------------------------------
// The picture screen
//
// The account's picture is read back by whether the screen offers to remove
// one. That is not a trick: the screen initialises its state from the stored
// image and renders the remove control only when there is one, so on a freshly
// loaded screen the two say the same thing. Reading it this way needs no new
// marker in application markup, which this ticket does not change.

/** Open the picture screen. */
export const gotoPicture = async (page: Page): Promise<void> => {
  await gotoUnderLocale(page, "/settings/profile/picture");
  // The photo menu, not the Save control: Save is a span the back bar fills only
  // once there is a change to save, so it is hidden on arrival and waiting for it
  // reports "the screen did not render" about a screen that rendered perfectly.
  await expect(
    profile.changePhotoMenu(page),
    "the picture screen did not render",
  ).toBeVisible();
};

/** Does the account have a picture, as this screen understands it? */
export const hasPicture = async (page: Page): Promise<boolean> =>
  profile.removePictureButton(page).isVisible();

/** Choose a picture from the device.
 *
 *  The input is hidden on purpose — the screen drives it from its own menu — so
 *  this sets it directly rather than clicking through the menu. What is under
 *  test is the upload, not the menu. */
export const choosePicture = async (
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<void> => {
  await profile.pictureFilePicker(page).setInputFiles(file);
  await expect(
    profile.removePictureButton(page),
    "the screen did not take the chosen picture",
  ).toBeVisible();
};

/** Ask the screen to remove the picture it is holding. */
export const clearChosenPicture = async (page: Page): Promise<void> => {
  await profile.removePictureButton(page).click();
};

/** Save whatever the picture screen is holding, and say whether it landed.
 *
 *  A saved picture navigates back to the profile screen — the same signal the
 *  other forms use. A refusal leaves the screen where it is and shows a message,
 *  which is what `AC-3` reads. */
export const attemptPictureSave = async (
  page: Page,
  options: { timeoutMs?: number } = {},
): Promise<SaveOutcome> => {
  const button = profile.pictureSaveButton(page);
  await expect(button, "there is no Save control on the picture screen").toBeVisible();

  const timeout = options.timeoutMs ?? 45_000;

  // Watched **while** the save runs, not after it.
  //
  // The refusal is a notification, and the strip dismisses itself after about
  // five seconds. Reading it once the navigation wait had already timed out
  // found nothing every time and reported "the shopper was not told" about a
  // screen that had told them and moved on.
  const refusal = page
    .getByText("File upload failed.", { exact: true })
    .first()
    .waitFor({ state: "visible", timeout })
    .then(() => "File upload failed." as const)
    .catch(() => null);

  const navigation = page
    .waitForURL(/\/settings\/profile\/?(\?.*)?$/, {
      timeout,
      waitUntil: "domcontentloaded",
    })
    .then(() => true)
    .catch(() => false);

  await button.click();

  const [saved, refusedWith] = await Promise.all([navigation, refusal]);

  return {
    saved,
    refusedWith: saved ? null : (refusedWith ?? (await pictureRefusalMessage(page))),
  };
};

/** What the picture screen says when it refuses.
 *
 *  **Not** `visibleValidationMessage`: that reads the personal-info form's own
 *  six strings, and a refused upload is not one of them — the screen reports it
 *  through the app's notification strip instead. Reading the wrong one made this
 *  answer `null` for a screen that had said exactly what happened.
 *
 *  Matched by text for the same reason the form's messages are: the string *is*
 *  the thing being reported, there is no marker on it, and every spec that
 *  reaches here has pinned the language to English. */
const pictureRefusalMessage = async (page: Page): Promise<string | null> => {
  const failed = page.getByText("File upload failed.", { exact: true }).first();
  if (await failed.isVisible().catch(() => false)) return "File upload failed.";

  // Anything else the notification strip is showing, so a refusal nobody
  // anticipated still comes back as words rather than as `null`.
  const strip = page.getByTestId("notification-text").first();
  if (await strip.isVisible().catch(() => false)) {
    return (await strip.textContent())?.trim() || null;
  }
  return visibleValidationMessage(page);
};

// ---------------------------------------------------------------------------
// The address screen
//
// Three markers here are misspelled in the markup and are matched as they are —
// see `selectors.ts`.

/** Open the address screen. */
export const gotoAddresses = async (page: Page): Promise<void> => {
  await gotoUnderLocale(page, "/settings/profile/address");
  await expect(
    profile.addAddressButton(page),
    "the address screen did not render",
  ).toBeVisible();
};

/** How many addresses the account lists. A count, used only to compare a
 *  before with an after — never asserted as a fixed number. */
export const addressCount = async (page: Page): Promise<number> =>
  profile.addressCards(page).count();

/** Is an address carrying this text listed?
 *
 *  A boolean, so the account's real addresses never reach a message. The text
 *  passed in is the case's own probe value. */
export const addressIsListed = async (
  page: Page,
  text: string,
): Promise<boolean> =>
  (await profile.addressCards(page).filter({ hasText: text }).count()) > 0;

/** Start counting how many notifications the app shows at once.
 *
 *  Returns a reader for the **peak** number on screen together — which is what
 *  "the shopper is told once" means: one message for one save, not one per
 *  backend that refused.
 *
 *  Peak rather than "how many are visible now", because the strip dismisses
 *  itself after about five seconds. A count taken after a save has finished
 *  waiting finds nothing and reports that the shopper was never told, about a
 *  screen that told them and moved on. */
export const watchNotifications = async (
  page: Page,
): Promise<() => Promise<number>> => {
  await page.evaluate(() => {
    const w = window as unknown as { __e2ePeakNotices?: number };
    const count = () =>
      document.querySelectorAll('[data-pw="notification-text"]').length;
    w.__e2ePeakNotices = count();
    new MutationObserver(() => {
      const now = count();
      if (now > (w.__e2ePeakNotices ?? 0)) w.__e2ePeakNotices = now;
    }).observe(document.body, { childList: true, subtree: true });
  });

  return () =>
    page.evaluate(
      () => (window as unknown as { __e2ePeakNotices?: number }).__e2ePeakNotices ?? 0,
    );
};

/** Add an address, filling everything the form insists on.
 *
 *  Four things are required before it will save, and three of them are easy to
 *  miss because the form shows no complaint — it simply does nothing:
 *  a **region**, the address line, the detail line, and a contact name and
 *  phone. The region is the one that is not a text field: it comes from a picker,
 *  and without it the save is a no-op that looks exactly like a click that
 *  worked.
 *
 *  Answers whether the form accepted it, so a caller can tell "the form would
 *  not take it" from "the backend refused it". */
export const addAddress = async (
  page: Page,
  options: { address: string; detail: string; recipient: string; phone: string },
): Promise<boolean> => {
  await profile.addAddressButton(page).click();
  await expect(
    profile.addressForm(page),
    "the add-address form did not open",
  ).toBeVisible();

  // Region first: the picker covers the form's Save while it is open.
  //
  // It is a hierarchy — country, province, town, suburb — and every level uses
  // the same marker. Choosing a province drills one level deeper; only a leaf
  // sets the region and closes the panel. So this keeps choosing the first row
  // until the panel goes, rather than assuming one click finishes it.
  await profile.selectRegionButton(page).click();

  for (let level = 0; level < 6; level += 1) {
    const choice = profile.regionChoices(page).first();
    if (!(await choice.isVisible({ timeout: 20_000 }).catch(() => false))) {
      return false;
    }
    await choice.click();

    const closed = await profile
      .regionPicker(page)
      .waitFor({ state: "hidden", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (closed) break;
  }

  if (await profile.regionPicker(page).isVisible().catch(() => false)) {
    // Still open after six levels: say so rather than failing later on a Save
    // the picker is covering.
    return false;
  }

  await expect(
    profile.addressForm(page),
    "the form did not come back after a region was chosen",
  ).toBeVisible({ timeout: 20_000 });

  await profile.addressTitleField(page).fill(options.address);
  await profile.addressDetailField(page).first().fill(options.detail);

  // Contact details are usually seeded from the account; filled only when the
  // form left them empty, so this never overwrites what the account holds.
  const recipient = profile.addressRecipientField(page);
  if ((await recipient.count()) > 0 && (await recipient.inputValue()) === "") {
    await recipient.fill(options.recipient);
  }
  const phone = profile.addressPhoneField(page);
  if ((await phone.count()) > 0 && (await phone.inputValue()) === "") {
    await phone.fill(options.phone);
  }

  await profile.saveAddressButton(page).click();
  return true;
};

/** Remove every address carrying this text. Answers whether none is left.
 *
 *  **Every** copy, not the first: a run that failed to clean up leaves one
 *  behind, and the next run adds another. Removing them all means one green run
 *  also clears whatever earlier runs stranded on the shared account.
 *
 *  Deleting is two steps — the icon opens a confirmation, and missing the second
 *  step leaves the address exactly where it was while looking like a click that
 *  worked. */
export const removeAddress = async (
  page: Page,
  text: string,
): Promise<boolean> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const card = profile.addressCards(page).filter({ hasText: text }).first();
    if ((await card.count()) === 0) return true;

    await card.getByTestId("Delete-Address-Icon").click();

    const confirm = profile.confirmDeleteAddress(page);
    if (!(await confirm.isVisible({ timeout: 10_000 }).catch(() => false))) {
      return false;
    }
    await confirm.click();

    // The list re-renders after the delete; wait for this copy to go before
    // looking for the next one.
    const gone = await page
      .waitForFunction(
        (probe) =>
          document.querySelectorAll('[data-pw="Address"]').length === 0 ||
          !Array.from(document.querySelectorAll('[data-pw="Address"]')).some(
            (node) => node.textContent?.includes(probe),
          ),
        text,
        { timeout: 20_000 },
      )
      .then(() => true)
      .catch(() => false);

    if (gone) return true;
  }
  return false;
};
