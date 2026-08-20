// Every locator, written exactly once.
//
// A spec never names an element and an action never takes a raw selector. When
// the markup changes you fix one line here, not thirty specs. That is the whole
// job of this file.
//
// **Why `data-pw` and not text.** Every visible string in this app goes through
// `translateFunction`, so `getByRole("button", { name: "Add to cart" })` passes
// in English and fails in Arabic. The app already carries about 800 `data-pw`
// attributes from an earlier Cypress setup, and they happen to cover the paths
// we care about — so `getByTestId()` is pointed at `data-pw` in
// `playwright.config.ts` and we reuse them rather than adding a second set.
//
// **Add a hook rather than a clever selector.** If something here needs a chain
// of `:nth-child` or a text match to find its element, the right fix is a
// `data-pw` on the component, not a cleverer line in this file.

import type { Locator, Page } from "@playwright/test";

// There is deliberately no `LOCALE_PATH` constant here.
//
// Every storefront path carries a country-and-language prefix — country first,
// then language, `/gb-en/…` — but the suite must not hard-code one. Reached over
// loopback there is no geo header, so the app cannot detect a country and asks
// the visitor to pick from whatever the backend currently offers. Which country
// a run ends up on is therefore not ours to decide. Navigate to `/` and let the
// app choose; read the prefix off `page.url()` if a later action needs it.

export const nav = {
  logo: (page: Page): Locator => page.getByTestId("NavLogo"),
  cartButton: (page: Page): Locator => page.getByTestId("cart_icon_button"),
  cartCount: (page: Page): Locator => page.getByTestId("cart-item-counts"),
};

/** The "Select Your Region" popup (`utils/PopupCountry.tsx`).
 *
 *  It appears whenever the app could not work out the country — which is always
 *  true here, because the server is reached over loopback and there is no geo
 *  header to read, so the app redirects to `?no-country=true`. It is a real
 *  modal: `fixed inset-0` with a backdrop, and it swallows every click until a
 *  country is chosen. Any journey that does not deal with it fails on its first
 *  click, whatever that click was. */
export const region = {
  popup: (page: Page): Locator => page.getByTestId("Change-Url-Container"),
  /** One country row. `iso` is lower case: `iq`, `lb`, `sy`, `tr`. */
  country: (page: Page, iso: string): Locator =>
    page.getByTestId(`personal-info-countries-${iso}`),
  anyCountry: (page: Page): Locator =>
    page.locator('[data-pw^="personal-info-countries-"]'),
};

export const search = {
  /** Opens the search. The input exists in the DOM before this is clicked, but
   *  renders `disabled` — so a spec that goes straight for the input waits
   *  forever on "element is not enabled". */
  icon: (page: Page): Locator => page.getByTestId("searchIcon_mainPage"),
  // An id, not a `data-pw`: this input already had a stable one, and an id is
  // just as language-independent.
  input: (page: Page): Locator => page.locator("#search-element"),
  resultLink: (page: Page): Locator => page.getByTestId("product-result-link"),
};

export const listing = {
  card: (page: Page): Locator => page.getByTestId("product-card"),
  cardLink: (page: Page): Locator => page.getByTestId("product_link"),
  cardName: (page: Page): Locator => page.getByTestId("product-name"),
  // There is deliberately no "any link containing /products/" locator here.
  // Category tiles use that same path shape (`/products/Bodysuits-253`), so such
  // a locator clicks a category, the app answers `?message=product_not_found`,
  // and the failure looks like a broken product page. Use the card hook.
};

export const product = {
  name: (page: Page): Locator => page.getByTestId("productName_productPage"),
  price: (page: Page): Locator => page.getByTestId("product-price"),
  addToCart: (page: Page): Locator => page.getByTestId("addToCartButton"),
};

/** The two ways the app can ask someone to sign in again.
 *
 *  **A guest must never see either.** The recovery that replaces a dead session
 *  is shared: it prompts a seller and a phone-verified shopper on purpose, and
 *  recovers a guest silently. A guest has no account to sign in to, so a prompt
 *  in front of one is a dead end — and it is exactly the kind of change that
 *  would ship unnoticed, because nothing about it looks broken from the inside.
 *
 *  Two locators rather than one because they are two different components: the
 *  session-expired screen offers a choice, and the phone entry is where signing
 *  in actually starts. A case that checked only the first would pass while the
 *  second was on screen. */
export const prompt = {
  sessionExpired: (page: Page): Locator =>
    page.getByTestId("session-expired-login"),
  sessionExpiredGuestOption: (page: Page): Locator =>
    page.getByTestId("session-expired-guest"),
  phoneEntry: (page: Page): Locator =>
    page.getByTestId("input-phone-number-field"),
};

/** The phone-verification widget (`components/Login/Enhanced`). */
export const auth = {
  /** Button that opens the widget from the nav bar. */
  loginButton: (page: Page): Locator => page.getByTestId("login-icon"),
  /** The initial screen: "Sign Up!" or "Login!". */
  getStartedTitle: (page: Page): Locator => page.getByTestId("join-statement"),
  signUpButton: (page: Page): Locator => page.getByTestId("create-account"),
  loginButtonOnScreen: (page: Page): Locator =>
    page.getByTestId("have-account-button"),
  /** Phone entry screen. */
  phoneInput: (page: Page): Locator =>
    page.getByTestId("input-phone-number-field"),
  submitPhoneButton: (page: Page): Locator =>
    page.getByTestId("send-phone-number"),
  /** Method selection screen. */
  screenTitle: (page: Page): Locator => page.getByTestId("edit-phone-number"),
  smsMethod: (page: Page): Locator => page.getByTestId("sms-receive-otp"),
  whatsappMethod: (page: Page): Locator =>
    page.getByTestId("whatsapp-receive-otp"),
  otpCooldown: (page: Page): Locator => page.getByTestId("otp-cooldown"),
  sendOtpError: (page: Page): Locator => page.getByTestId("send-otp-error"),
  /** PIN entry screen. */
  otpInput: (page: Page): Locator => page.getByTestId("input-otp-field"),
  verifyOtpError: (page: Page): Locator => page.getByTestId("verify-otp-error"),
  /** Post-login screens. */
  welcomeTitle: (page: Page): Locator => page.getByTestId("welcome"),
  nameInput: (page: Page): Locator => page.getByTestId("input-user-name-field"),
  notRegisteredMessage: (page: Page): Locator =>
    page.getByTestId("not registered"),
  Terms: (page: Page): Locator => page.getByTestId("agree-continue"),
  AlreadyRegistered:(page:Page):Locator =>page.getByTestId("registered")
};

export const cart = {
  /** The cart itself, opened by the nav cart icon. Not `bag-viewer` — that one
   *  lives in `ShippingAddressContainer` and only exists once you are far enough
   *  into checkout to be choosing an address. */
  drawer: (page: Page): Locator => page.getByTestId("cartPage-container"),
  header: (page: Page): Locator =>
    page.getByTestId("cartPage-header-container"),
  items: (page: Page): Locator => page.getByTestId("bag-product-viewer"),
  total: (page: Page): Locator => page.getByTestId("cart-total-price"),
  // Ticket 2 uses these. Listed now because they are already in the app and
  // finding them again later is wasted work.
  confirmOrder: (page: Page): Locator =>
    page.getByTestId("Confirm-Order-Button"),
  cashOnDelivery: (page: Page): Locator =>
    page.getByTestId("cachondelivry-cartpage"),
};
