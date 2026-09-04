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
  addToBag: (page: Page): Locator =>
    page.locator("#add-to-cart-button-container"),
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
  total: (page: Page): Locator => page.getByTestId("cart-total-price"),
  /** Leaves the drawer for the checkout screen — it does **not** place
   *  anything. For a visitor with no verified phone it opens the verify panel
   *  in place instead, which is why a journey that presses it has to check
   *  where it landed. */
  confirmOrder: (page: Page): Locator =>
    page.getByTestId("Confirm-Order-Button"),
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
  /** The address already on the order. Absent when the account has none saved,
   *  and the checkout refuses to go on until one is. */
  chosenAddress: (page: Page): Locator => page.getByTestId("Address-Added-Last"),
  /** Opens the add-address form from inside checkout. The form itself is the
   *  same one the settings screen uses, so its fields are in `profile`. */
  addAddress: (page: Page): Locator => page.getByTestId("AddAddres"),
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
