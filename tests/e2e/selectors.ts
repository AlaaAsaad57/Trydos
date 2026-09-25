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
  /** The backdrop, which is up for the whole time the popup is.
   *
   *  Not the same thing as `popup` below, and the difference matters. This
   *  component draws the backdrop first and spends a moment on a "Preparing your
   *  experience" screen while it fetches the country list; `Change-Url-Container`
   *  only exists once that list has arrived. A helper that waits for the list
   *  alone and gives up therefore leaves a full-screen backdrop over the page,
   *  and every later click in the case is swallowed by it with a confusing
   *  "intercepts pointer events". */
  backdrop: (page: Page): Locator => page.getByTestId("country-popup"),
  popup: (page: Page): Locator => page.getByTestId("Change-Url-Container"),
  /** One country row. `iso` is lower case: `iq`, `lb`, `sy`, `tr`.
   *
   *  Matched without regard to letter case. The hook carries the backend's own
   *  `iso`, and the backend is not consistent: the settings screen was measured
   *  drawing `LB` beside `sy` in the same list. */
  country: (page: Page, iso: string): Locator =>
    page.locator(`[data-pw="personal-info-countries-${iso}" i]`),
  anyCountry: (page: Page): Locator =>
    page.locator('[data-pw^="personal-info-countries-"]'),
};

/** The two settings screens that change the locale
 *  (`components/settings/LanguageSetting.tsx`,
 *  `components/settings/PersonalInfoCountries.tsx`). */
export const localeSettings = {
  /** The entries on the main settings page that open each screen. */
  countryEntry: (page: Page): Locator => page.getByTestId("country-button"),
  languageEntry: (page: Page): Locator => page.getByTestId("language-button"),
  /** One language row. `code` is `en`, `ar`, `tr` or `ku`. */
  language: (page: Page, code: string): Locator =>
    page.getByTestId(`language-${code}`),
  /** The back bar's Save. Drawn only once a different language is picked. */
  saveLanguage: (page: Page): Locator => page.getByTestId("language-setting"),
  /** The "Confirm" in the country-change window. */
  confirmCountry: (page: Page): Locator =>
    page.getByTestId("country-change-confirm"),
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
  /** A real product card's link — an `<a>` that actually points at a product.
   *
   *  The `href` is part of the hook on purpose. A loading placeholder can carry
   *  the same `data-pw` while the real row is still streaming, and the first
   *  match on the page is then a grey box, not a card. Requiring a
   *  `/products/` address means only a link that can open a product is ever
   *  clicked, whatever a future skeleton copies. */
  cardLink: (page: Page): Locator =>
    page.locator('a[data-pw="product_link"][href*="/products/"]'),
  cardName: (page: Page): Locator => page.getByTestId("product-name"),
  /** Every entry in the home page's category bar
   *  (`components/Home/CategoryNavMobile.tsx`). Each carries its slug in
   *  `data-id`.
   *
   *  **Visible entries only.** After a move between the home page and a
   *  category page the app keeps the previous page in the document, hidden, so
   *  the same entry exists twice. Measured: the hidden copy of the home page's
   *  bar was matched first and read as "not open" for a category that was open
   *  on screen. */
  categoryLinks: (page: Page): Locator =>
    page.locator('[data-pw="category-Link"]:visible'),
  /** One entry in the category bar, by slug. Visible only — see above. */
  categoryLink: (page: Page, slug: string): Locator =>
    page.locator(`[data-pw="category-Link"][data-id="${slug}"]:visible`),
  /** The mark drawn inside the category entry that is open now. */
  activeCategoryMark: (scope: Locator): Locator =>
    scope.getByTestId("activeCategoryIcon"),
  // There is deliberately no "any link containing /products/" locator here —
  // the address above is an extra condition on the card hook, never a hook of
  // its own.
  // Category tiles use that same path shape (`/products/Bodysuits-253`), so such
  // a locator clicks a category, the app answers `?message=product_not_found`,
  // and the failure looks like a broken product page. Use the card hook.
};

export const product = {
  name: (page: Page): Locator => page.getByTestId("productName_productPage"),
  price: (page: Page): Locator => page.getByTestId("product-price"),
  addToCart: (page: Page): Locator => page.getByTestId("addToCartButton"),
  /** The arrow in the product's own top bar (`ProductBackButton`).
   *
   *  Not the browser's Back. The two are the same thing only when the product
   *  was opened as an overlay; opened as a full page this control pushes the
   *  page it came from instead. A journey about coming back has to use the one
   *  a shopper actually presses. */
  backButton: (page: Page): Locator => page.getByTestId("backIcon_productPage"),
};

/** The home page's own rows.
 *
 *  Its boutique list is the only long scroll in the app that a guest reaches
 *  without typing anything, which is why the scroll journeys use it. */
export const home = {
  /** One boutique card. `BoutiqueWrapper` gives each an `id` of
   *  `boutique-<slug>`, which is language-independent and already there. */
  boutiqueCard: (page: Page): Locator => page.locator('[id^="boutique-"]'),
  /** The banner, which opens that boutique's own listing as an overlay. */
  boutiqueLink: (page: Page): Locator => page.getByTestId("boutique_link"),
  /** A product tile in a boutique's strip.
   *
   *  Its sibling `boutique_category_link` opens a listing, and both are drawn by
   *  the same loop from the same `/products/…`-shaped address — see the note in
   *  `BoutiqueWrapper`. Only this one reaches a product page. */
  boutiqueProductLink: (page: Page): Locator =>
    page.getByTestId("boutique_product_link"),
};

/** Shared static "trust" pages (About, Contact, Privacy, Terms). */
export const staticPage = {
  container: (page: Page): Locator => page.getByTestId("static-page"),
  title: (page: Page): Locator => page.getByTestId("static-page-title"),
  backButton: (page: Page): Locator =>
    page.getByTestId("static-page-back-back-button"),
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
  /** Method selection screen: the number the code is about to go to.
   *
   *  Use this, not `screenTitle`, to tell whether the method screen is up. It
   *  is the one element the screen draws in **both** cases — `screenTitle` is
   *  the **Edit** button, which `SelectMethodScreen` omits whenever the account
   *  already owns the number, so on that locked screen it finds nothing. */
  methodPhone: (page: Page): Locator => page.getByTestId("method-phone"),
  /** The **Edit** control beside that number, present only when the number can
   *  be swapped. Its absence is what "locked" means — see `methodPhone`. */
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
  AlreadyRegistered:(page:Page):Locator =>page.getByTestId("registered"),
  /** The nav control that opens the account menu.
   *
   *  `components/Home/UserAvatar.tsx` puts this marker on **both** of its
   *  branches — with a picture and without — so a signed-in shopper always has
   *  it. `components/Home/UserNavTopSection.tsx` puts the same marker on the
   *  branch it renders for a visitor who is **not** signed in. The two are
   *  mutually exclusive, so exactly one is ever in the page, but the marker on
   *  its own says nothing about whether anybody is signed in. Never read it as
   *  a sign-in signal. */
  accountMenuTrigger: (page: Page): Locator =>
    page.getByTestId("avatar-options"),
  /** The sign-out item inside the account menu (`components/Home/Menu.tsx`).
   *
   *  Only offered to an account that has a usable phone on it, so it is absent
   *  for a plain guest — which is why a case that clicks it has proved it was
   *  signed in first. */
  signOutItem: (page: Page): Locator => page.getByTestId("logout"),
  /** Any item that is in the account menu whoever is looking.
   *
   *  "Is the menu open?" and "is this visitor signed in?" are two questions, and
   *  `signOutItem` above can only answer the second. Settings is rendered
   *  unconditionally (`components/Home/Menu.tsx`), so it answers the first
   *  without claiming anything about the account.
   *
   *  Needed because an open menu lays a full-screen click-catcher over the page
   *  — the `setMenuOpen(false)` div in the same file — so a helper that cannot
   *  tell "open" from "shut" will press the trigger again into that catcher and
   *  fail as a click timeout naming nothing. */
  accountMenuAnyItem: (page: Page): Locator =>
    page.getByTestId("Settings-Icon"),
};

/** The shopper's own details: the card on the settings page, and the form
 *  behind it (`components/setting/profile/`).
 *
 *  Two of these are not `data-pw`, and both on purpose:
 *
 *  * **`card`** is found by its `aria-label`, which is a plain English literal
 *    in the app rather than a translated string, so it does not move with the
 *    language. It is also the signal itself: the whole link is only rendered
 *    for a visitor the app considers signed in, so finding it *is* the proof,
 *    and a `data-pw` would have to be added to the app to say the same thing.
 *  * **`verifiedMark`** is found by the icon's `src`. The label beside it
 *    ("Verified" / "Verify Now") goes through `translateFunction`, so matching
 *    the text would pass in English and fail in Arabic — and the two states are
 *    two different files, so the icon path is the language-independent fact.
 */
export const profile = {
  /** The card on the settings page. Present only when signed in.
   *
   *  By its address, not by its accessible name, and that is a workaround for a
   *  real defect rather than a preference: the card's link is written with
   *  `aria-label="View Profile"`, but `components/global/NextLink.tsx` renders
   *  no `aria-label` at all, so the attribute never reaches the page. The link
   *  wraps no text either, which leaves it with no accessible name whatsoever.
   *  Matching the name therefore finds nothing — and "no card" is exactly what
   *  a signed-out visitor looks like, so the miss reads as a real failure.
   *
   *  Its `href` is the next most stable thing about it and needs no language.
   *  `$=` and not `*=`: the same card also links to `/settings/profile/picture`
   *  and `/settings/profile/size`, which a looser match would pick up.
   *
   *  **Point this back at the accessible name once `NextLink` renders one.** */
  card: (page: Page): Locator =>
    page.locator('a[href$="/settings/profile"]'),
  /** Shown when the account has a usable phone on record. */
  verifiedMark: (page: Page): Locator =>
    page.locator('img[src="/icons/settings/VerifiedUserIcon.svg"]'),
  /** Shown when it does not — the shopper is invited to verify. */
  unverifiedMark: (page: Page): Locator =>
    page.locator('img[src="/icons/settings/verifyUserIcon.svg"]'),

  /** The personal-info form. */
  nameField: (page: Page): Locator =>
    page.getByTestId("personal-info-recipient-name-input"),
  phoneField: (page: Page): Locator =>
    page.getByTestId("personal-info-phone-number-input"),
  alternativePhoneField: (page: Page): Locator =>
    page.getByTestId("personal-info-alternative-phone-number-input"),
  emailField: (page: Page): Locator =>
    page.getByTestId("personal-info-Contact-email-input"),
  saveButton: (page: Page): Locator =>
    page.getByTestId("personal-info-save-button"),
  /** The gender the account already has. Absent when none is set — and the
   *  form refuses to save at all until one is, so this is worth asking about
   *  before blaming a backend for a save that never went out. */
  chosenGender: (page: Page): Locator =>
    page.getByTestId("active-gender-input"),
  /** All three gender choices, in the order they are drawn: Man, Woman, Other.
   *
   *  Two markers rather than one because the app swaps the marker on the chosen
   *  one — `active-gender-input` when picked, `gender-input` when not — so
   *  neither on its own finds all three, and their position is the only
   *  language-independent way to say which is which. */
  genderChoices: (page: Page): Locator =>
    page.locator('[data-pw="gender-input"], [data-pw="active-gender-input"]'),

  /** The size screen (`components/settings/ProfileSizeInfo.tsx`). */
  heightField: (page: Page): Locator =>
    page.getByTestId("personal-size-tall-input"),
  weightField: (page: Page): Locator =>
    page.getByTestId("personal-size-weight-input"),
  sizeSaveButton: (page: Page): Locator =>
    page.getByTestId("personal-size-save-button"),

  /** The picture screen (`components/settings/UploadProfilePhoto.tsx`).
   *
   *  The file input is hidden and carries an `id` rather than a marker, so it is
   *  reached by that id — a hidden input is set with `setInputFiles`, which does
   *  not need it to be visible or clicked. */
  pictureFilePicker: (page: Page): Locator =>
    page.locator("#profile-file-picker"),
  /** Always on the screen, so this is what "the screen rendered" is read from —
   *  unlike Save, which the back bar only fills when there is a change. */
  changePhotoMenu: (page: Page): Locator =>
    page.getByTestId("change-photo-menu"),
  /** Save on this screen is the back bar's own control, which takes its marker
   *  straight from `DataCy` — hence no `-save-button` suffix here. */
  pictureSaveButton: (page: Page): Locator => page.getByTestId("save-image"),
  /** Remove the picture.
   *
   *  **Also the answer to "does this account have a picture".** The screen
   *  initialises its state from the account's stored image and renders this
   *  control only when there is one, so on a freshly loaded screen its presence
   *  *is* the account having a picture. That is why nothing here needs a new
   *  marker in application markup to read the picture back. */
  removePictureButton: (page: Page): Locator =>
    page.getByTestId("remove-photo-button"),

  /** The address screen (`components/settings/PersonalInfoAddress.tsx`, whose
   *  form is the cart's `AddAddressForm`).
   *
   *  Three of these markers are misspelled in the markup — `AddAddres`,
   *  `Edit-Addres-Icon`. They are matched as they are: renaming them is an
   *  application change with no test value, and this comment is cheaper than
   *  the confusion of a silent mismatch. */
  addressCards: (page: Page): Locator => page.getByTestId("Address"),
  addAddressButton: (page: Page): Locator => page.getByTestId("AddAddres"),
  deleteAddressIcon: (page: Page): Locator =>
    page.getByTestId("Delete-Address-Icon"),
  addressTitleField: (page: Page): Locator =>
    page.getByTestId("add-address-input"),
  addressDetailField: (page: Page): Locator =>
    page.getByTestId("Detailed-Address-field").locator("textarea, input"),
  addressForm: (page: Page): Locator => page.getByTestId("add-address-form"),
  /** The confirmation the delete icon opens. Deleting is two steps, and missing
   *  the second leaves the address on a shared account. */
  confirmDeleteAddress: (page: Page): Locator =>
    page.getByTestId("Yes-Delete-Address"),
  /** Save on the address form. The bar around it is
   *  `add-address-buttons-container`. */
  saveAddressButton: (page: Page): Locator =>
    page.getByTestId("AddSaveButton"),
  /** Opens the region picker. The form will not save without a region. */
  selectRegionButton: (page: Page): Locator =>
    page.getByTestId("Change-From-List"),
  /** A province row: clicking it drills one level deeper and leaves the picker
   *  open. It never finishes the choice. */
  provinceChoices: (page: Page): Locator =>
    page.getByTestId("province-search-result"),
  /** A leaf row: clicking it sets the region and closes the picker.
   *
   *  The two rows used to share one marker, so a caller could not tell "this
   *  click goes deeper" from "this click finishes" and had to keep clicking
   *  until the panel happened to close. They are separate markers now. */
  regionChoices: (page: Page): Locator =>
    page.getByTestId("region-search-result"),
  /** The picker panel itself. While it is open it covers the form's Save. */
  regionPicker: (page: Page): Locator =>
    page.getByTestId("Extended-Choose-Area"),
  addressRecipientField: (page: Page): Locator =>
    page.getByTestId("recipient-name-input"),
  addressPhoneField: (page: Page): Locator =>
    page.getByTestId("Contact-Phone-input"),
};

/** The sheet the product page's "Buy" control opens
 *  (`components/cart/AddToCart/`).
 *
 *  **"Buy" on the product page adds nothing.** It only calls
 *  `setSelectedProductForCart`, which mounts this sheet. The call that reaches
 *  the cart backend is the sheet's own "Add To Bag" button, so a journey that
 *  clicks the product page control and stops has added nothing at all.
 *
 *  `addToBag` is found by its `id` rather than a `data-pw`, and that id is
 *  already on the element carrying the click handler
 *  (`components/cart/AddToCart/Button.tsx`). An id is as language-independent as
 *  a marker, so a second hook beside it would buy nothing. The sheet has no
 *  container marker of its own, so this control being visible is also how "the
 *  sheet is open" is read. */
export const addToCartSheet = {
  /** The product card at the top of the sheet.
   *
   *  **This, not `addToBag`, is how "the sheet is open" is read.** The sheet
   *  swaps its button for "Notify Me When Variant Is Available" whenever the
   *  chosen variant is sold out (`shouldShowNotifyButton` in
   *  `AddToCartComponent`), so on a sold-out product `addToBag` does not exist
   *  and a wait on it times out on a sheet that is plainly open. The card is
   *  drawn either way. */
  card: (page: Page): Locator => page.getByTestId("product-name-label"),
  /** The sheet itself, and the only place its loading state is readable.
   *
   *  `data-loading` is the sheet's own `loading` flag. It goes true while the
   *  sheet re-reads the product (`getAllProductData`), and while it is true the
   *  button's click handler returns without calling anything —
   *  `if (!loading && !initialLoading)` in `AddToCart/Button.tsx`. A press in
   *  that window is swallowed in silence: no request, no message, no change. The
   *  same read also resets the chosen colour and size when it lands, so a choice
   *  made too early is thrown away. Wait for `"false"` before touching the
   *  sheet. */
  sheet: (page: Page): Locator => page.getByTestId("add-to-cart-sheet"),
  /** The real "Add To Bag" button, and only it.
   *
   *  **Never `#add-to-cart-button-container`.** Two different components put
   *  that same id on their button — `AddToCart/Button.tsx` and
   *  `AddToCart/NotifyButton.tsx` — and only one of them is on screen at a time.
   *  So a wait on the id is answered by the sold-out "Notify Me When Variant Is
   *  Available" button as happily as by the buy one. A live run pressed it, the
   *  press was accepted, nothing went in the bag, and the failure blamed the cart
   *  backend. `data-pw="add-to-bag"` is on the buy button alone. */
  addToBag: (page: Page): Locator => page.getByTestId("add-to-bag"),
  /** The sold-out button that takes the buy button's place.
   *
   *  Its presence is the app's own answer to "this variant cannot be bought"
   *  (`shouldShowNotifyButton` in `AddToCartComponent`). */
  notifyMe: (page: Page): Locator => page.getByTestId("notify_container_2"),
  /** One size choice. Absent for a product that has no sizes — which is not an
   *  error, and is why the action asks rather than waits. */
  size: (page: Page): Locator => page.getByTestId("add-to-cart-size"),
  /** One colour choice. Same rule as `size`. */
  colour: (page: Page): Locator => page.getByTestId("add-to-cart-color"),
};

export const cart = {
  /** The cart itself, opened by the nav cart icon. Not `bag-viewer` — that one
   *  lives in `ShippingAddressContainer` and only exists once you are far enough
   *  into checkout to be choosing an address. */
  drawer: (page: Page): Locator => page.getByTestId("cartPage-container"),
  header: (page: Page): Locator =>
    page.getByTestId("cartPage-header-container"),
  /** One line in the cart drawer (`components/cart/index.tsx`).
   *
   *  Not `bag-product-viewer`: that is the summary strip on the **checkout**
   *  screen, so counting it while the drawer is open finds nothing and reads as
   *  an empty cart. */
  lines: (page: Page): Locator => page.getByTestId("one-product"),
  /** The drawer header's own count. Drawn only when the cart is not empty. */
  lineCount: (page: Page): Locator => page.getByTestId("length-ofItems"),
  /** The summary strip on the checkout screen. */
  items: (page: Page): Locator => page.getByTestId("bag-product-viewer"),
  /** The payable total — what the shop will charge
   *  (`components/Cart/OrderButton.tsx:572`). It sits **outside** the collapsed
   *  block, so reading it needs no click.
   *
   *  Replaces the old `total`, which pointed at `cart-total-price`. That name
   *  was a trap: the element it matched is the figure *before* discount and
   *  shipping, so anything reading "the total" from it read the wrong number.
   *  It had no caller, so deleting it broke nothing. */
  payableTotal: (page: Page): Locator => page.getByTestId("offer-total-price"),
  /** The "Normal Price" — the figure before discount and shipping
   *  (`components/Cart/OrderButton.tsx:377`). Inside the collapsed block, so
   *  `totalsToggle` must be pressed once before it can be read. */
  normalPrice: (page: Page): Locator => page.getByTestId("cart-total-price"),
  /** Opens the totals breakdown (`components/Cart/OrderButton.tsx:520`).
   *
   *  A **toggle**: `expanded` starts `false` (`:41`), so press it once. Press it
   *  twice and the breakdown is hidden again. */
  totalsToggle: (page: Page): Locator => page.getByTestId("total-expanded"),
  /** The shipping figure (`components/Cart/OrderButton.tsx:501`). Inside the
   *  collapsed block, same rule as `normalPrice`. */
  shipping: (page: Page): Locator => page.getByTestId("Shipping-RoundPrice"),
  /** One cart line, found by the product name it shows.
   *
   *  Every line carries the same `one-product` marker, so the three controls
   *  below must be read **inside** one of these, never on the page. */
  lineNamed: (page: Page, name: string): Locator =>
    page.getByTestId("one-product").filter({ hasText: name }),
  /** The product name as the **bag** draws it
   *  (`components/Cart/CartItem.tsx:77`).
   *
   *  Not the same string as `product.name`, which is the product page's own
   *  heading. The bag draws the cart row's `name` field and cuts it at 50
   *  characters (`:79-80`), so a line can never be found by the title the
   *  product page showed. Read this, then match on it. */
  lineName: (line: Locator): Locator => line.getByTestId("productNameInCart"),
  /** Asks for one more of this line (`components/Cart/index.tsx:710`). */
  plus: (line: Locator): Locator => line.getByTestId("PlusIcon_CartPage"),
  /** Asks for one fewer (`components/Cart/index.tsx:736`).
   *
   *  **Absent at quantity 1** — the delete control takes its place there, which
   *  is the behaviour `AC-13` covers. */
  minus: (line: Locator): Locator => line.getByTestId("MinusIcon_CartPage"),
  /** Removes the line (`components/Cart/index.tsx:758`). */
  deleteLine: (line: Locator): Locator =>
    line.getByTestId("DeleteIcon_CartPage"),
  /** The line's confirmed quantity (`components/Cart/index.tsx:804`).
   *
   *  Read it only **after** the bag has been re-read, or the optimistic value
   *  the app draws before the backend answers will satisfy the check. */
  quantity: (line: Locator): Locator => line.getByTestId("QuantityInCart"),
  /** The order bar at the foot of the drawer
   *  (`components/Cart/OrderButton.tsx:258`).
   *
   *  The drawer draws it only once `cart_loading` is false
   *  (`components/Cart/index.tsx:448`), and `cart_loading` starts true on every
   *  page load (`store/Cart/reducer.ts:109`) — so on screen means **the drawer's
   *  own read has finished**, on an empty bag too.
   *
   *  It does **not** mean the read succeeded. A failed read ends in
   *  `initCart({ cart: [] })`, which clears the error again
   *  (`store/Cart/reducer.ts:391-394`), so the drawer shows an empty bag with
   *  this bar and no error panel. Pair it with the read's own answer. */
  orderBar: (page: Page): Locator => page.getByTestId("order-bottom-button"),
  /** Leaves the drawer for the checkout screen — it does **not** place
   *  anything. For a visitor with no verified phone it opens the verify panel
   *  in place instead, which is why a journey that presses it has to check
   *  where it landed. */
  confirmOrder: (page: Page): Locator =>
    page.getByTestId("Confirm-Order-Button"),
  /** The verify panel that opens **inside** that button for a visitor with no
   *  verified phone (`components/Login/Enhanced/InlineVerifyPanel.tsx`).
   *
   *  Its close control, because that is the one part every screen of the panel
   *  draws — the rest changes with which step the visitor is on. Finding it is
   *  how "the phone gate held" is told apart from "the button did nothing",
   *  which look identical from the outside.
   *
   *  Showing the panel costs no one-time code: it opens on the phone entry, and
   *  a code is only sent once a number is submitted. */
  verifyPanel: (page: Page): Locator => page.getByTestId("inline-close"),
};

/** The checkout screen: address, payment method, terms, and placing the order.
 *
 *  One screen in the code (`components/cart/OrdersPage.tsx`) but two steps on
 *  screen, and the order of the two controls matters.
 *  `confirmShippingAndPayment` re-reads the cart and moves to the review step;
 *  `placeOrder` is the one that posts the checkout. Pressing the second without
 *  the first finds nothing. */
export const checkout = {
  /** The cash-on-delivery choice (`components/cart/PaymentMethod.tsx`).
   *
   *  Drawn only when the shop offers it for this country — the list comes from
   *  the cart answer's `available_payment_method`. Absent is a real answer, not
   *  a slow render, so an action asks rather than waits. Not
   *  `cachondelivry-cartpage`, which is the read-only line on the review step. */
  cashOnDelivery: (page: Page): Locator => page.getByTestId("Cash-on-delivery"),
  /** The same choice on the review step, which shows what was chosen and takes
   *  no click. */
  chosenCashOnDelivery: (page: Page): Locator =>
    page.getByTestId("cachondelivry-cartpage"),
  confirmShippingAndPayment: (page: Page): Locator =>
    page.getByTestId("Confirm-shipping-and-payment"),
  /** The line inside that button: how many items, and **the price the checkout
   *  is about to charge** (`components/Cart/OrdersPage.tsx:925-931`).
   *
   *  Worth reading, because that price is one side of the gate the button
   *  applies. `isValid()` refuses unless the chosen payment's stored balance is
   *  at least `getTotalPrice()` (`:790-806`, `:832-838`), and this label draws
   *  `getTotalPrice()` itself. A `0` here with a bag that has lines means the
   *  cart money never arrived. */
  confirmTotal: (page: Page): Locator =>
    page.getByTestId("Number-Of-Products-Required"),
  /** The coupon box on the checkout screen (`components/Cart/couponElement.tsx`).
   *  Pressing the box (not its Apply) opens the field. */
  couponBox: (page: Page): Locator => page.getByTestId("coupon-box"),
  couponInput: (page: Page): Locator => page.getByTestId("coupon-input"),
  /** Apply. Once a coupon is accepted it turns into the discount itself, and
   *  carries `data-applied="true"`. */
  couponApply: (page: Page): Locator => page.getByTestId("coupon-apply"),
  /** The refusal, drawn under the field. Absent while nothing was refused. */
  couponError: (page: Page): Locator => page.getByTestId("coupon-error"),
  /** The address already on the order. Absent when the account has none saved,
   *  and the checkout refuses to go on until one is. */
  chosenAddress: (page: Page): Locator => page.getByTestId("Address-Added-Last"),
  /** Opens the add-address form from inside checkout. The form itself is the
   *  same one the settings screen uses, so its fields are in `profile`. */
  addAddress: (page: Page): Locator => page.getByTestId("AddAddres"),
  /** Opens the saved-address list on the checkout
   *  (`components/Cart/ShippingAddressContainer.tsx:469`). */
  addressesViewer: (page: Page): Locator =>
    page.getByTestId("addresses-viewer"),
  /** The chosen address's **title** as the checkout draws it
   *  (`components/Cart/ShippingAddressContainer.tsx:688`).
   *
   *  The title, not `chosenAddress` — that one is the region string, which two
   *  addresses in the same city share, so it cannot tell them apart. */
  addressTitle: (page: Page): Locator => page.getByTestId("regular-addresses"),
  /** The address sheet itself (`components/Cart/AddressListContainer.tsx:63`).
   *
   *  Every locator below is scoped **inside** it on purpose. The rows carry the
   *  marker `Address`, and the settings address screen uses that same marker
   *  (`profile.addressCards`). Without the scope the two collide. */
  addressSheet: (page: Page): Locator =>
    page.getByTestId("AddressListContainer"),
  /** One row in that sheet, found by the address title it shows.
   *
   *  The title sits in an unmarked span (`AddressListContainer.tsx:125`), so it
   *  is matched with `hasText` rather than by a marker of its own. */
  addressSheetRow: (page: Page, title: string): Locator =>
    page
      .getByTestId("AddressListContainer")
      .getByTestId("Address")
      .filter({ hasText: title }),
  /** The edit control on one sheet row (`AddressListContainer.tsx:275`).
   *
   *  The marker is misspelled in the markup (`Addres`, one `s`). It is matched
   *  as it is — renaming it is an application change with no test value. */
  editAddressOnRow: (row: Locator): Locator =>
    row.getByTestId("Edit-Addres-Icon"),
  /** Returns from the checkout to the bag
   *  (`components/Cart/OrdersPage.tsx:242`).
   *
   *  `AC-8`, `AC-9` and `AC-10` all read their figures in the **bag**, because
   *  `OrderButton` is mounted only in the drawer
   *  (`components/Cart/index.tsx:447`). Without this control there is no way
   *  back, so those three cannot be carried out at all. */
  backToBag: (page: Page): Locator => page.getByTestId("swiperSlide-backIcon"),
  /** The terms row on the review step. Placing the order is refused until it is
   *  ticked. */
  agreeToTerms: (page: Page): Locator => page.getByTestId("read-and-agree"),
  placeOrder: (page: Page): Locator => page.getByTestId("Place-Order-Buttons"),
  /** The success panel, and the order number on it.
   *
   *  `orderNumber` carries the **group** id — the one the orders list and the
   *  order's own address use. It is not the `order_id` the cancel call takes;
   *  that one is a pack id this screen never shows. */
  successPanel: (page: Page): Locator => page.getByTestId("The-Purchas"),
  orderNumber: (page: Page): Locator => page.getByTestId("order-group-id"),
  /** Leaves the success panel for the home page. */
  done: (page: Page): Locator => page.getByTestId("back-to-home-page"),
};

/** The shopper's own orders: the list, one order, and cancelling it.
 *
 *  **`status` is read from `data-status`, never from what it says.** The label
 *  beside it comes from the backend already translated, so matching the words
 *  would tie a case to one language and to the backend's current wording. The
 *  attribute carries the machine value (`pending`, `cancelled`, …), which is
 *  what the app itself branches on. */
export const orders = {
  /** The Orders card on the settings page. */
  settingsCard: (page: Page): Locator => page.getByTestId("orders-page-button"),
  /** One order's group id, on a list row. The same marker names the number on
   *  the checkout success panel, so read it on the screen you are on. */
  groupId: (page: Page): Locator => page.getByTestId("order-group-id"),
  status: (page: Page): Locator => page.getByTestId("order-status"),
  /** The empty state a group id nobody owns lands on. */
  notFound: (page: Page): Locator => page.getByTestId("order-not-found"),
  /** The three-dot control in the screen's own top bar (`setting/BackBar`).
   *
   *  Shared by every settings screen that offers a menu, so it means "this
   *  screen's options" rather than "the order options" — which screen it belongs
   *  to is decided by the page it is pressed on. */
  optionsButton: (page: Page): Locator =>
    page.getByTestId("screen-options-button"),
  /** "Cancel This Pack" in that menu.
   *
   *  Rendered only when the order answers `can_cancele_order`, so its absence is
   *  the backend saying this order may not be cancelled — a real answer, and one
   *  an action has to report rather than wait out. */
  cancelOption: (page: Page): Locator => page.getByTestId("cancel-order-option"),
  /** One "why" chip. At least one has to be picked or the submit refuses. */
  cancelReason: (page: Page): Locator => page.getByTestId("cancel-order-reason"),
  cancelSubmit: (page: Page): Locator => page.getByTestId("cancel-order-submit"),
  /** The terms row on the confirmation, and the button it unlocks. Cancelling is
   *  two screens, and stopping after the first cancels nothing. */
  cancelAgree: (page: Page): Locator => page.getByTestId("cancel-order-agree"),
  cancelConfirm: (page: Page): Locator =>
    page.getByTestId("cancel-order-confirm"),
};

/** The shopper's saved products — the "checklist" screen under settings.
 *
 *  **The app calls it a checklist, the code calls it a wishlist.** The screen,
 *  its hooks and its copy all say checklist (`components/setting/checklist/`);
 *  the service behind it is `services/wishlist.ts`. Both names are kept here
 *  rather than picking one, because a reader arriving from either side has to
 *  find this group.
 *
 *  `empty` and `list` are two different screens, not one screen with nothing in
 *  it — `ChecklistView` renders one or the other. So "the list is not there"
 *  and "the empty state is there" are separate facts, and a case that means the
 *  second must ask for the second. */
export const checklist = {
  /** The back arrow in the screen's own top bar, which is how a case knows it
   *  arrived.
   *
   *  **The hook is `checklist-screen-back-button`, not `checklist-screen`.**
   *  `BackBar` takes a `DataCy` name and spends it twice: `${DataCy}-back-button`
   *  on the arrow, and the bare name on the options control beside it. That
   *  second element is rendered even on a screen with no options, where it is
   *  empty — and an element with no text has no size, so it is "hidden". A case
   *  pointed at the bare name therefore waits out its whole timeout on a screen
   *  that loaded perfectly, and reports that the page did not load. */
  screen: (page: Page): Locator =>
    page.getByTestId("checklist-screen-back-button"),
  /** The skeleton rows, shown while the first page is being fetched. */
  loading: (page: Page): Locator => page.getByTestId("checklist-loading"),
  /** The list, rendered only when the shopper has at least one saved product. */
  list: (page: Page): Locator => page.getByTestId("checklist-list"),
  /** The "your checklist is empty" panel, rendered instead of the list. */
  empty: (page: Page): Locator => page.getByTestId("checklist-empty"),
  /** One saved product. */
  items: (page: Page): Locator => page.getByTestId("checklist-item"),
  /** The name on a row. Scoped to a row, so it is passed the row. */
  itemName: (row: Locator): Locator => row.getByTestId("checklist-item-name"),
  /** A row carrying one particular product, matched on the **slug** in the
   *  link it wraps.
   *
   *  Not on the name, and the difference is not cosmetic. The name a product
   *  page shows is `getProductText`, which joins the product's name with its
   *  category names — so "Polished Checked Dress | Dresses" on the product page
   *  is "Polished Checked Dress" here, and a case comparing the two fails on a
   *  screen that is completely right. The slug is one value, it is unique, and
   *  it is the same string on both screens. */
  itemForSlug: (page: Page, slug: string): Locator =>
    page
      .getByTestId("checklist-item")
      .filter({ has: page.locator(`a[href$="/products/${slug}"]`) }),
  /** The X on a row. Stops propagation, so pressing it never navigates. */
  itemDelete: (row: Locator): Locator =>
    row.getByTestId("checklist-item-delete"),
  /** "Load more", rendered only when the app believes a next page exists.
   *
   *  It is never rendered today — `ChecklistView.tsx:41` reads `has_next`, and
   *  neither backend sends that key. See
   *  `tests/components/setting/checklist/ChecklistView.loadMore.test.tsx`. */
  loadMore: (page: Page): Locator => page.getByTestId("checklist-load-more"),
};

/** The three-dot "More Options" panel on a product page.
 *
 *  One panel, two features: it is where a product is saved to the checklist and
 *  where it is added to compare. So it is one group rather than two — a case
 *  about either has to open the same panel first.
 *
 *  **The two toggles report their state differently, and that is the app's
 *  doing, not an inconsistency here.** The checklist toggle asks the backend
 *  (`isInWishlist`) and paints itself green from the answer. The compare toggle
 *  reads the `f_p` / `s_p` cookies and never asks anybody. A case must judge
 *  each by what actually decides it. */
export const moreOptions = {
  /** The three dots in the product page's footer, which opens the panel. */
  trigger: (page: Page): Locator => page.getByTestId("ThreePointsIcon"),
  /** The panel itself. Mounted only while it is open. */
  panel: (page: Page): Locator =>
    page.getByTestId("ExtendThreePointsSection"),
  /** "Add To My Checklist" — a toggle, not an add. Pressing it on a saved
   *  product removes it. */
  checklistToggle: (page: Page): Locator => page.getByTestId("add-checkList"),
  /** The spinner that replaces the icon while the toggle is waiting. Its
   *  absence is how a case knows the backend has answered. */
  checklistBusy: (page: Page): Locator =>
    page.getByTestId("add-checkList-spinner"),
  /** "Add To Compare" / "Added To Compare" — also a toggle. */
  compareToggle: (page: Page): Locator => page.getByTestId("add-compare"),
};

/** The compare page (`components/global/compare.tsx`).
 *
 *  **Two slots, never a list.** The page compares exactly two products, held in
 *  the `f_p` and `s_p` cookies and mirrored into the query string. A third
 *  product replaces the first. So the locators are numbered rather than
 *  indexed: slot 1 and slot 2 are different places, not positions in a row.
 *
 *  **An empty slot renders `"-"`, not nothing.** Every row is always drawn for
 *  both slots. A case asking "is the slot empty" has to read the cell's text,
 *  which is what `actions/compare.ts` does — never `toBeHidden`, which would
 *  pass on a cell that is on screen and says `-`. */
export const compare = {
  page: (page: Page): Locator => page.getByTestId("compare-page"),
  table: (page: Page): Locator => page.getByTestId("compare-table"),
  /** One row of the table, by the field it shows (`name`, `price`, `image`, …).
   *
   *  Named by field rather than by position, so adding a row to the table
   *  cannot silently move what a case is reading. */
  row: (page: Page, field: string): Locator =>
    page.getByTestId(`compare-row-${field}`),
  /** A slot's cell inside a row. `slot` is 1 or 2. */
  cell: (row: Locator, slot: 1 | 2): Locator =>
    row.getByTestId(`compare-cell-${slot}`),
  /** The product link in a slot's cell on the name row.
   *
   *  Which product a slot is showing is read from this link's address, not from
   *  the words in the cell. The product page's own title is `getProductText`,
   *  which joins the name with the category names, so the two are different
   *  strings for the same product and comparing them fails on a correct page.
   *  The slug in the address is the same on both. */
  nameLink: (page: Page, slot: 1 | 2): Locator =>
    page
      .getByTestId("compare-row-name")
      .getByTestId(`compare-cell-${slot}`)
      .locator('a[href*="/products/"]')
      .first(),
  /** The skeleton a cell shows while its product is being fetched. */
  cellLoading: (page: Page): Locator =>
    page.getByTestId("compare-cell-loading"),
  /** A slot's search box. `slot` is 1 or 2. */
  searchInput: (page: Page, slot: 1 | 2): Locator =>
    page.getByTestId(`compare-search-${slot}-input`),
  /** The dropdown under a slot's search box. */
  searchOptions: (page: Page, slot: 1 | 2): Locator =>
    page.getByTestId(`compare-search-${slot}-options`),
  /** One result in that dropdown. */
  searchOption: (page: Page, slot: 1 | 2): Locator =>
    page.getByTestId(`compare-search-${slot}-option`),
  /** The "no options found" line, which is also what a still-loading dropdown
   *  shows. The component draws one element for both, so a case must not read
   *  it as "the catalogue has nothing". */
  searchNoOptions: (page: Page, slot: 1 | 2): Locator =>
    page.getByTestId(`compare-search-${slot}-no-options`),
  /** The X that empties a slot's search box. Rendered only when the box has
   *  text in it. */
  searchClear: (page: Page, slot: 1 | 2): Locator =>
    page.getByTestId(`compare-search-${slot}-clear`),
};

/** The stories journey — the bar, the upload sheet, the viewer, the report sheet.
 *
 *  Every hook here is `data-pw`, so none of it depends on the display language.
 *  The report sheet's reasons are keyed by the backend's own stable value
 *  (`inappropriate_content`, `spam`, …), never by the translated label. */
export const stories = {
  /** The tile that opens the upload sheet. **Drawn only when the account's
   *  profile allows uploading** — its absence is a fault, not a slow render. */
  addButton: (page: Page): Locator => page.getByTestId("Add-Story-Button"),
  /** "Upload Photo/Video" inside the sheet. Opens the hidden file input. */
  galleryOption: (page: Page): Locator =>
    page.getByTestId("Gallery-Photo-Option"),
  /** The hidden file input the sheet drives. Addressed by id because it has no
   *  `data-pw` and is `className="hidden"` — `setInputFiles` does not need it
   *  visible. */
  fileInput: (page: Page): Locator => page.locator("#stories-input-holder"),
  /** The link box. This is where the QA mark goes: the host decides whether the
   *  story is test data. */
  linkInput: (page: Page): Locator => page.getByTestId("link-story-input"),
  /** Save, inside the image crop editor that opens after a photo is chosen. A
   *  photo upload does not reach the share button without it. */
  cropSave: (page: Page): Locator =>
    page.getByTestId("image-crop-save-button"),
  /** "Share Story". **Only exists once media is chosen** — there is no
   *  link-only story. */
  shareButton: (page: Page): Locator => page.getByTestId("share-story-button"),

  /** One author's tile in the bar. `data-id` is the author's stories id. */
  tile: (page: Page, groupId: string | number): Locator =>
    page.locator(`[data-pw="story-element"][data-id="${groupId}"]`),
  /** Every tile currently rendered, for counting as the bar loads more. */
  anyTile: (page: Page): Locator => page.locator('[data-pw="story-element"]'),

  /** The **active** holder, and the id of the item the app would act on.
   *
   *  Only the active pane carries the attribute: the cube carousel mounts
   *  several holders at once, and the others are the neighbouring authors. */
  activeHolder: (page: Page): Locator => page.locator("[data-story-id]"),
  deleteIcon: (page: Page): Locator => page.getByTestId("delete-story-icon"),
  deleteConfirm: (page: Page): Locator =>
    page.getByTestId("delete-story-confirm-modal-button"),
  reportIcon: (page: Page): Locator => page.getByTestId("report-story-icon"),
  closeViewer: (page: Page): Locator => page.getByTestId("close_stories_icon"),

  /** The report sheet. */
  reportReason: (page: Page, value: string): Locator =>
    page.getByTestId(`report-reason-${value}`),
  reportDetails: (page: Page): Locator =>
    page.getByTestId("report-details-input"),
  reportSubmit: (page: Page): Locator =>
    page.getByTestId("report-submit-button"),
};

// ---------------------------------------------------------------------------
// The seller dashboard
//
// Three blocks, and the split is deliberate. `sellerDashboard` is the **shell**
// — the door in, the section tiles, the side menu, the panel. It knows nothing
// about any one section, so a products or comments spec written later reuses it
// unchanged. `shopLocations` and `shopInfo` are the two sections covered today;
// the next section adds a block beside them and touches neither of these.
// ---------------------------------------------------------------------------

/** Every section of the dashboard, exactly as the app writes it into `?tab=`.
 *
 *  Taken from `VALID_TABS` in the dashboard page. The home screen is not in
 *  this list: the app deletes the query parameter for it rather than writing a
 *  word, and `data-tab` then reads `"none"`. */
export type DashboardTab =
  | "products"
  | "boutiques"
  | "locations"
  | "permissions"
  | "users"
  | "orders"
  | "gallery"
  | "stories"
  | "comments"
  | "excel"
  | "shopInfo";

/** The dashboard shell: how a seller gets in, and how they move between
 *  sections.
 *
 *  **The active section lives in the URL, not in component state.** The page
 *  writes `?tab=locations` and reads it back on every render, so a test can ask
 *  the address which section is open and never has to guess from the content.
 *  `panel` carries the same value in `data-tab`, which is what lets a
 *  navigation case prove the right section mounted **without** judging whether
 *  that section's own backend answered. Those are two separate claims and this
 *  suite keeps them separate. */
export const sellerDashboard = {
  /** In the settings screen: the black "Sales" card.
   *
   *  Only drawn for an account that already owns at least one shop
   *  (`GoToSellerDashBoard.tsx`). An account with none is shown
   *  `become-seller-btn` instead, so the absence of this card is a real finding
   *  about the account, not a slow render. */
  salesCard: (page: Page): Locator => page.getByTestId("seller-sales"),
  /** The same component's failure box, drawn when the permissions call did not
   *  answer. Present means the shop list never loaded — a different fault from
   *  "this account owns no shop". */
  permissionsError: (page: Page): Locator =>
    page.getByTestId("seller-permissions-error"),

  /** One shop's card on `/sellerProfile`. */
  shopCard: (page: Page, sellerId: string | number): Locator =>
    page.locator('[data-pw="seller-shop-card"][data-seller-id="' + sellerId + '"]'),
  anyShopCard: (page: Page): Locator =>
    page.locator('[data-pw="seller-shop-card"]'),
  shopCardName: (card: Locator): Locator =>
    card.locator('[data-pw="seller-shop-card-name"]'),
  /** "Enter Dashboard", inside one shop's card. Scoped to the card on purpose:
   *  an account with several shops draws one control per shop. */
  enterDashboard: (card: Locator): Locator =>
    card.locator('[data-pw="enter-dashboard-btn"]'),

  /** The seller id the dashboard says it is showing. */
  sellerId: (page: Page): Locator =>
    page.getByTestId("seller-dashboard-seller-id"),
  /** One section tile on the dashboard home. */
  tile: (page: Page, tab: DashboardTab): Locator =>
    page.getByTestId("seller-dashboard-tab-" + tab),
  /** Every tile the app decided this seller may see. The list is permission
   *  filtered, so what is in it is a fact about the account. */
  anyTile: (page: Page): Locator =>
    page.locator('[data-pw^="seller-dashboard-tab-"]'),
  /** The hamburger, and one entry inside the slide-out menu. The menu is the
   *  **second** door to every section; the tiles are the first. */
  menuButton: (page: Page): Locator =>
    page.getByTestId("seller-dashboard-menu-btn"),
  menuItem: (page: Page, tab: DashboardTab): Locator =>
    page.getByTestId("seller-dashboard-menu-" + tab),

  /** The content area. `data-tab` is the section it is drawing right now, and
   *  it reads `"none"` on the home screen. */
  panel: (page: Page): Locator => page.getByTestId("seller-dashboard-panel"),
  /** The back arrow in the dashboard's own bar. It does two different things:
   *  with a section open it returns to the home screen, and on the home screen
   *  it leaves for `/sellerProfile`. */
  back: (page: Page): Locator =>
    page.getByTestId("seller-dashboard-screen-back-button"),

  /** A section refusing to draw because this account lacks the permission.
   *
   *  Every section uses the same `AccessDenied` block, so one hook covers all
   *  of them. Watched for beside a section's own content: without it, a missing
   *  permission looks exactly like a screen that never loaded, and the failure
   *  sends the reader to the wrong place. */
  accessDenied: (page: Page): Locator =>
    page.getByTestId("dashboard-access-denied"),

  /** The app's own "your session has expired" screen.
   *
   *  **The single most useful hook in this block.** A saved cookie jar is a
   *  snapshot: the moment one case does authenticated work the app can exchange
   *  the credential, and a later case opening the old pair is recovered as a
   *  guest. The app then draws this. Watched for everywhere a dashboard screen
   *  is awaited, so that situation is reported as what it is rather than as
   *  "the section never loaded". */
  sessionExpired: (page: Page): Locator =>
    page.getByTestId("session-expired-login"),
};

/** The Locations section — the list, the status filter, and the create/edit
 *  modal.
 *
 *  **There is no delete.** The API exposes none, so a location can only ever be
 *  deactivated. Anything this suite creates stays on the environment. */
export const shopLocations = {
  addButton: (page: Page): Locator => page.getByTestId("locations-add-btn"),
  statusFilter: (page: Page): Locator =>
    page.getByTestId("locations-status-filter"),
  list: (page: Page): Locator => page.getByTestId("locations-list"),
  empty: (page: Page): Locator => page.getByTestId("locations-empty"),
  /** The list itself failed to load. Different from `actionError`, which is one
   *  row's status change being refused while the list is fine. */
  loadError: (page: Page): Locator => page.getByTestId("locations-error"),
  actionError: (page: Page): Locator =>
    page.getByTestId("locations-action-error"),

  /** One row, by the id the backend gave it. */
  card: (page: Page, locationId: string | number): Locator =>
    page.locator('[data-pw="location-card"][data-location-id="' + locationId + '"]'),
  anyCard: (page: Page): Locator => page.locator('[data-pw="location-card"]'),
  cardName: (card: Locator): Locator =>
    card.locator('[data-pw="location-name"]'),
  cardAddress: (card: Locator): Locator =>
    card.locator('[data-pw="location-address"]'),
  /** The status pill. Read `data-active` (`"1"` or `"0"`), never the word
   *  inside it — the word is translated and this suite must not depend on the
   *  display language. */
  cardStatus: (card: Locator): Locator =>
    card.locator('[data-pw="location-status"]'),
  editButton: (card: Locator): Locator =>
    card.locator('[data-pw="location-edit-btn"]'),
  /** Deactivate or Activate, whichever the row's current status makes it. One
   *  control with two meanings — read `cardStatus` first when the test cares
   *  which one it is about to press. */
  toggleButton: (card: Locator): Locator =>
    card.locator('[data-pw="location-toggle-btn"]'),

  /** The create/edit modal. `data-mode` says which of the two it is. */
  form: (page: Page): Locator => page.getByTestId("location-form"),
  nameInput: (page: Page): Locator => page.getByTestId("location-name-input"),
  countrySelect: (page: Page): Locator =>
    page.getByTestId("location-country-select"),
  addressInput: (page: Page): Locator =>
    page.getByTestId("location-address-input"),
  latitudeInput: (page: Page): Locator =>
    page.getByTestId("location-latitude-input"),
  longitudeInput: (page: Page): Locator =>
    page.getByTestId("location-longitude-input"),
  saveButton: (page: Page): Locator => page.getByTestId("location-save-btn"),
  cancelButton: (page: Page): Locator =>
    page.getByTestId("location-cancel-btn"),
  closeButton: (page: Page): Locator => page.getByTestId("location-close-btn"),
  /** The validation line under one field. `field` is `name`, `country`,
   *  `address`, `latitude` or `longitude`. */
  fieldError: (page: Page, field: string): Locator =>
    page.getByTestId("location-" + field + "-field-error"),
  /** The banner at the top of the form — the backend's own refusal, quoted. */
  formError: (page: Page): Locator => page.getByTestId("location-form-error"),

};

/** The Shop Info section — the shop's own name, contact and address.
 *
 *  The logo and banner controls are deliberately absent. Changing either one
 *  uploads to the media store, and that cannot be undone by putting a string
 *  back, so this suite does not touch them. */
export const shopInfo = {
  form: (page: Page): Locator => page.getByTestId("shop-info-form"),
  nameInput: (page: Page): Locator => page.getByTestId("shop-info-name-input"),
  contactInput: (page: Page): Locator =>
    page.getByTestId("shop-info-contact-input"),
  addressInput: (page: Page): Locator =>
    page.getByTestId("shop-info-address-input"),
  saveButton: (page: Page): Locator => page.getByTestId("shop-info-save-btn"),
  /** The validation line under one field. `field` is `name`, `contact` or
   *  `address`. */
  fieldError: (page: Page, field: string): Locator =>
    page.getByTestId("shop-info-" + field + "-field-error"),
};

// ---------------------------------------------------------------------------
// Product questions, shop answers, and the hearts on both
//
// **Every lookup here is scoped to a container, and that is not tidiness.** The
// same question is drawn by up to three widgets — the in-page FAQ strip, the
// bottom sheet, and the extended area the footer opens — and the strip and the
// extended area are **both in the DOM** while the extended area is open. A
// page-wide comment-id lookup therefore matches twice and Playwright stops with
// a strict-mode violation. So every function below takes the container it is
// reading, and the caller's message names which widget it looked in.
// ---------------------------------------------------------------------------

/** The storefront side: asking, editing, reacting, deleting. */
export const productComments = {
  /** The in-page FAQ strip. Its `id` is shared with the buyers-review strip on
   *  the same page, which is why it carries a hook of its own. */
  faqSection: (page: Page): Locator => page.getByTestId("faq-section"),
  /** The footer control that opens the extended comment area. */
  openExtendedArea: (page: Page): Locator => page.getByTestId("CommentIcon"),
  /** The extended area, and the scrolling list inside it. */
  extendedArea: (page: Page): Locator =>
    page.getByTestId("ExtendCoomentSection"),
  extendedList: (page: Page): Locator => page.getByTestId("CommentArea"),
  /** The backdrop that shuts the extended area — what a shopper taps.
   *
   *  **Leaving the area open breaks the page underneath.** The footer it belongs
   *  to is `z-999999999` and fixed to the bottom, so a heart in the in-page
   *  strip scrolls underneath it and every click is intercepted. */
  closeExtendedArea: (page: Page): Locator =>
    page.getByTestId("close_extended_area"),

  /** The product's own heart, in the footer. Read `productHeartFilled` to learn
   *  whether it is on: the filled icon is only drawn when it is. */
  productHeart: (page: Page): Locator => page.getByTestId("LoveSymbol"),
  productHeartFilled: (page: Page): Locator =>
    page.getByTestId("LoveClickOnLast"),
  productHeartCount: (page: Page): Locator => page.getByTestId("CountOfLoves"),

  /** Asking, from the in-page FAQ section.
   *
   *  **Page-level, and that is not laziness.** `FaqQuestionsList` renders the
   *  scrolling strip and this box as **siblings** in one fragment, so the box is
   *  not inside `faq-section` and a lookup scoped to that container can never
   *  match it. The page carries exactly one of these — the FAQ bottom sheet
   *  lists and edits but cannot ask, and the extended area uses `CommentBar`
   *  instead — so a page-level lookup is unambiguous. */
  askInput: (page: Page): Locator => page.getByTestId("faq-ask-input"),
  askSend: (page: Page): Locator => page.getByTestId("faq-ask-send"),
  /** Asking, from the extended area. A different component with a different
   *  control, which is the whole reason both places are covered. */
  barInput: (container: Locator): Locator =>
    container.locator('[data-pw="CommentField"]'),
  barSend: (container: Locator): Locator =>
    container.locator('[data-pw="SubmitComment"]'),

  /** One question, inside one widget. `data-has-reply` says whether the shop
   *  has answered it — which is also what decides if Edit is offered at all. */
  item: (container: Locator, commentId: string | number): Locator =>
    container.locator(
      '[data-pw="faq-item"][data-comment-id="' + commentId + '"]',
    ),
  anyItem: (container: Locator): Locator =>
    container.locator('[data-pw="faq-item"]'),
  itemText: (item: Locator): Locator =>
    item.locator('[data-pw="faq-item-text"]'),

  /** The shop's answer under one question, and its text. */
  reply: (container: Locator, commentId: string | number): Locator =>
    container.locator(
      '[data-pw="faq-reply"][data-comment-id="' + commentId + '"]',
    ),
  replyText: (reply: Locator): Locator =>
    reply.locator('[data-pw="faq-reply-text"]'),

  /** The three-dot control on a question. Its hook differs by widget: the
   *  extended area says `comment-options`, the strip and the bottom sheet both
   *  say `success-comment-options`. Both are matched, because the caller has
   *  already scoped the container and the distinction carries no meaning. */
  menuButton: (item: Locator): Locator =>
    item.locator(
      '[data-pw="comment-options"], [data-pw="success-comment-options"]',
    ),
  /** The menu items, scoped to the card that owns them so a failure names the
   *  right question. */
  translateItem: (item: Locator): Locator =>
    item.locator('[data-pw="comment-translate"]'),
  editItem: (item: Locator): Locator =>
    item.locator('[data-pw="comment-edit"]'),
  deleteItem: (item: Locator): Locator =>
    item.locator('[data-pw="comment-delete"]'),

  /** The edit dialog and the delete confirmation. Both are page-level: the app
   *  renders one at a time, from the in-page list, whichever widget opened it. */
  editInput: (page: Page): Locator => page.getByTestId("faq-edit-input"),
  editSubmit: (page: Page): Locator => page.getByTestId("faq-edit-submit"),
  deleteConfirm: (page: Page): Locator =>
    page.getByTestId("faq-delete-confirm"),

  /** The heart on a question (`comment`) or on the shop's answer
   *  (`seller_reply`).
   *
   *  **`data-comment-id` carries the question's own id for both.** The app
   *  hands the answer's heart `<id>-seller_reply` and the component strips that
   *  suffix back off, so the two are told apart by `data-target-type`, never by
   *  the id. Read `data-liked` for the state and `data-likes` for the number —
   *  the visible count is locale-formatted and would have to be parsed back. */
  heart: (
    container: Locator,
    commentId: string | number,
    targetType: "comment" | "seller_reply",
  ): Locator =>
    container.locator(
      '[data-pw="comment-like"][data-comment-id="' +
        commentId +
        '"][data-target-type="' +
        targetType +
        '"]',
    ),
};

/** The dashboard's product grid — the card, its four counts, and the paging.
 *
 *  The counts are permission gated (`READ_COMMENTS`). Until they arrive the
 *  card draws a dash and `data-value` is empty, which is a different thing from
 *  a count of zero. */
export const sellerProducts = {
  card: (page: Page, productId: string | number): Locator =>
    page.locator(
      '[data-pw="seller-product-card"][data-product-id="' + productId + '"]',
    ),
  anyCard: (page: Page): Locator =>
    page.locator('[data-pw="seller-product-card"]'),
  /** One count on a card. `stat` is `heart`, `comments`, `star` or `share`. */
  stat: (card: Locator, stat: string): Locator =>
    card.locator('[data-pw="seller-product-stat"][data-stat="' + stat + '"]'),
  /** The Active / Inactive badge. `data-status` is the product's own status. */
  status: (card: Locator): Locator =>
    card.locator('[data-pw="seller-product-status"]'),
  /** The price as drawn, two decimals and the shop's currency. */
  price: (card: Locator): Locator =>
    card.locator('[data-pw="seller-product-price"]'),
  /** The stock badge. `data-stock` is the number the card was drawn from. */
  stock: (card: Locator): Locator =>
    card.locator('[data-pw="seller-product-stock"]'),

  /** The paging control. **Absent when the grid has one page** — the app draws
   *  it only past the first. Read that as one page, never as a missing
   *  element. */
  paginationStatus: (page: Page): Locator =>
    page.getByTestId("pagination-status"),
  paginationNext: (page: Page): Locator => page.getByTestId("pagination-next"),
};

/** The dashboard's comments section — the shop's own questions and answers. */
/** The dashboard's Excel section — bulk upload by template
 *  (`components/SellerDashboard/ExcelUploadTab.tsx`). */
export const sellerExcel = {
  /** The category list. Its first option is the empty "Select a category". */
  category: (page: Page): Locator => page.getByTestId("seller-excel-category"),
  /** Download Template. Disabled until a category is chosen. */
  download: (page: Page): Locator => page.getByTestId("seller-excel-download"),
  /** The section's message line. `data-type` is `success` or `error`. */
  status: (page: Page): Locator => page.getByTestId("seller-excel-status"),
};

export const sellerComments = {
  card: (page: Page, commentId: string | number): Locator =>
    page.locator(
      '[data-pw="dashboard-comment-card"][data-comment-id="' + commentId + '"]',
    ),
  anyCard: (page: Page): Locator =>
    page.locator('[data-pw="dashboard-comment-card"]'),
  /** The shopper's question, as the dashboard shows it. Read to prove a card is
   *  this run's own; **never quoted into a failure message** — it belongs to a
   *  real customer on every card but ours. */
  cardText: (card: Locator): Locator =>
    card.locator('[data-pw="dashboard-comment-text"]'),
  replyButton: (card: Locator): Locator =>
    card.locator('[data-pw="dashboard-comment-reply-btn"]'),
  replyText: (card: Locator): Locator =>
    card.locator('[data-pw="dashboard-comment-reply-text"]'),
  /** Opens the reply form again, filled with the answer already given. Drawn
   *  only with `EDIT_REPLY`, and only on a card that has an answer. */
  editReplyButton: (card: Locator): Locator =>
    card.locator('[data-pw="dashboard-comment-edit-reply-btn"]'),
  /** Removing the shop's answer. **Behind a browser confirm dialog** — a test
   *  that does not accept the dialog silently does nothing. */
  deleteReplyButton: (card: Locator): Locator =>
    card.locator('[data-pw="dashboard-comment-delete-reply-btn"]'),

  replyModal: (page: Page): Locator => page.getByTestId("dashboard-reply-modal"),
  replyInput: (page: Page): Locator => page.getByTestId("dashboard-reply-input"),
  replySubmit: (page: Page): Locator =>
    page.getByTestId("dashboard-reply-submit"),
  loadMore: (page: Page): Locator =>
    page.getByTestId("dashboard-comments-load-more"),
};

// ---------------------------------------------------------------------------
// The seller dashboard's Stories section.
//
// One group per dashboard section, the same shape `shopLocations` and
// `sellerProducts` use above, so a spec never sees a raw selector.
//
// **The crop dialog is not here.** A photo chosen in this section goes through
// the same `ImageCropWidget` the shopper's upload sheet uses, so the locator is
// `stories.cropSave` and this group does not repeat it. One hook, one name.
// ---------------------------------------------------------------------------

export const sellerStories = {
  /** The section's own root. **Carries the two permissions as attributes**
   *  (`data-can-create`, `data-can-delete`), read straight from the props the
   *  dashboard passes it.
   *
   *  Why they are on the root and not inferred from buttons: the delete control
   *  lives inside a story card, so on an empty grid — the normal state before
   *  this journey uploads anything — its absence means both "this account may
   *  not delete" and "there is nothing to delete". A case must know it can
   *  remove a story **before** it writes one, or a run leaves a row on a shared
   *  environment that nothing in the suite can take back. */
  section: (page: Page): Locator => page.getByTestId("seller-stories"),

  /** The three answers the section can give once its own call returns. A case
   *  waits for whichever arrives: the grid, "no stories yet", or the error.
   *  Treating a refused list as an empty shop is the failure these three names
   *  exist to prevent. */
  grid: (page: Page): Locator => page.getByTestId("seller-stories-grid"),
  empty: (page: Page): Locator => page.getByTestId("seller-stories-empty"),
  loadError: (page: Page): Locator =>
    page.getByTestId("seller-stories-error"),

  /** Opens the upload dialog. Drawn only with `CREATE_STORY`. */
  addButton: (page: Page): Locator => page.getByTestId("seller-stories-add"),

  /** One row, by the id the stories backend gave it — never by position. */
  card: (page: Page, storyId: string | number): Locator =>
    page.locator('[data-pw="seller-story-card"][data-id="' + storyId + '"]'),
  anyCard: (page: Page): Locator =>
    page.locator('[data-pw="seller-story-card"]'),
  /** Drawn only with `DELETE_STORY`, and only inside a card. */
  cardDelete: (card: Locator): Locator =>
    card.locator('[data-pw="seller-story-delete"]'),
  deleteConfirm: (page: Page): Locator =>
    page.getByTestId("seller-story-delete-confirm"),

  /** The upload dialog. */
  uploadDialog: (page: Page): Locator =>
    page.getByTestId("seller-story-upload"),
  /** The hidden file input. `setInputFiles` does not need it visible. */
  fileInput: (page: Page): Locator => page.getByTestId("seller-story-file"),
  /** Where the QA mark goes: the link's **host** is what marks a story as test
   *  data (`utils/qaStoryFilter.ts`), so this field decides whether a real
   *  customer can ever see the story. */
  linkInput: (page: Page): Locator => page.getByTestId("seller-story-link"),
  /** Opens the product picker. The same hook is on "Change", so a product that
   *  is already chosen can be swapped with one locator. */
  productPick: (page: Page): Locator =>
    page.getByTestId("seller-story-product-pick"),
  /** One product in the picker, by its own id. */
  productRow: (page: Page, productId: string | number): Locator =>
    page.locator(
      '[data-pw="seller-story-product-row"][data-id="' + productId + '"]',
    ),
  /** The chosen-product block. Its presence is what proves the picker's choice
   *  reached the form, before anything is sent. */
  productChosen: (page: Page): Locator =>
    page.getByTestId("seller-story-product-chosen"),
  shareButton: (page: Page): Locator => page.getByTestId("seller-story-share"),
  /** The chosen photo or video. Drawn only once a file has been accepted. */
  preview: (page: Page): Locator => page.getByTestId("seller-story-preview"),
  /** The refusal under the link field. Absent while the link is acceptable. */
  linkError: (page: Page): Locator =>
    page.getByTestId("seller-story-link-error"),
  cancelButton: (page: Page): Locator =>
    page.getByTestId("seller-story-cancel"),
};

// ---------------------------------------------------------------------------
// The shopper's story viewer — the two hooks the seller journey needs.
//
// Kept beside `stories` above rather than inside it because they are read by
// the seller journey, which is a different file and a different lane concern.
// ---------------------------------------------------------------------------

export const storyActions = {
  /** The bar at the foot of the open viewer. Drawn whenever the story has a
   *  link **or** a product, and **`data-has-product` says which** — that flag
   *  is the whole point of this locator.
   *
   *  The product button itself is gated on the viewer not being paused, and the
   *  viewer pauses on the very press used to move between stories. So the
   *  button's absence cannot tell "this story has no product" from "the viewer
   *  is paused", and a case that judged by the button alone would report the
   *  first when it meant the second. */
  bar: (page: Page): Locator => page.getByTestId("story-actions"),
  /** "View Product". Its label is translated, so it is never matched by text. */
  productLink: (page: Page): Locator =>
    page.getByTestId("story-product-link"),
};
