// Named sets of faked backend answers.
//
// A scripted spec should read as intent — `mockBackend(page, scenarios.x.y)` —
// with the response bodies out of the way in here. Scenarios are added when a
// spec needs one, not written up front against endpoints nobody is testing yet.
//
// ---------------------------------------------------------------------------
// Read this before writing an auth scenario
//
// Two parts of the login flow behave differently, and it decides what you can
// fake:
//
//   * **Verifying a code goes through `/api/proxy`.** `services/auth.ts` calls
//     `fetchData({ url: "/auth/login", ... })`, so `mockBackend` sees it and can
//     answer however you like. This is where wrong-OTP, rate-limit and
//     new-account branches are reachable.
//
//   * **Sending a code does not.** `/api/proxy` deliberately blocks
//     `/auth/phone/send_otp` (abuse protection), so the app sends it through
//     `serverActions/sendOtp.ts`, which is a `"use server"` action calling the
//     backend from Node. `page.route()` cannot see that call, and faking the
//     action's own response means hand-building an RSC payload — not worth it.
//
// So a scripted auth spec lets the real send happen and fakes what comes back
// from the verify. That is also the honest reason a scripted spec still needs
// staging up.
// ---------------------------------------------------------------------------

import type { CartItemInterface } from "utils/types/cart";

import { buildCart, buildCartItem } from "../../fixtures/cart";

import type { MockMap } from "../actions/mock";

/** Backend paths worth naming once, so a typo is a compile error and not a
 *  scenario that silently never matches. */
export const ENDPOINTS = {
  login: "/auth/login",
  registerGuest: "/auth/register-guest",
  sendOtp: "/auth/phone/send_otp",

  /** The three backends a profile save fans out to, in the order it writes
   *  them. Stories and chat share `/api/v1/users/`, so the stories key carries
   *  its `/update` and the chat key its own path — a key that is a substring of
   *  another silently claims the other's traffic, which is how the matcher
   *  works. */
  saveStories: "/api/v1/users/update",
  saveChat: "/api/v1/users/",
  saveCore: "/customer/update-profile",

  /** The phone-change confirmation. A **GET** that spends a real code, which is
   *  why closed mode blocks it rather than treating it as a read. */
  verifyPhone: "/auth/phone/verify_otp",

  /** The app's own routes. Same-origin, so they never carry `x-proxy-url` — the
   *  faking layer matches these against the pathname instead. */
  refresh: "/api/auth/refresh",
  expire: "/api/auth/expire",
  updateUser: "/api/auth/update-user",
  authMe: "/api/auth/me",

  /** The browser's own guest registration.
   *
   *  **A real write, and one that is easy to miss.** The name says "device" but
   *  the route POSTs `/auth/register-guest` to the gateway
   *  (`app/api/auth/register-device/route.ts`), so every unfaked call mints a
   *  guest on staging. The app makes it from the browser on boot, so closed mode
   *  blocks it — correctly — and a case that does not name it never gets past
   *  its own guard assertion. */
  registerDevice: "/api/auth/register-device",

  /** The picture upload, and the ticket minted just before it. */
  uploadTicket: "/api/ticket",
  mediaUpload: "/gated/upload",

  /** Who the app thinks the shopper is.
   *
   *  `userProfile` is filled from this answer and from nowhere else
   *  (`services/home.ts`), and two gates on the money path read it:
   *  `is_phone_verified` decides whether the cart lets anyone into checkout, and
   *  it is read **again** at the review step from a second call to this same
   *  endpoint. That second read is why some checkout scenarios are a sequence
   *  rather than a map. */
  customerInfo: "/customer/info",

  /** The bag. Everything the checkout screen shows about money comes from this
   *  one answer — the lines, the totals, the delivery charge, and which payment
   *  methods the shop offers for this country. */
  cart: "/cart/cart_shipping",
  cartOverview: "/cart/cart_overview",

  /** The bag the shopper left behind on an earlier visit.
   *
   *  Read on boot beside the real bag. Staging answers it **401** for the guest
   *  these cases run as, and that one refusal is enough to derail a whole case:
   *  the app renews the credential, retries, is refused again, and then runs its
   *  session-expired path — which closed mode blocks, correctly, because it
   *  clears cookies. Named here so the branch under test is the one that runs. */
  oldCart: "/old-cart/get_old_cart",

  /** The saved addresses. The checkout goes on only when one of them answers
   *  `is_default: 1` — `OrderButtons.isValid()` looks at nothing else. */
  addressList: "/customer/address/list",

  /** Placing a cash-on-delivery order. The path carries the method, so this
   *  never matches a card or a crypto checkout. */
  checkoutCashOnDelivery: "/customer/order/checkout/cash_on_delivery",

  /** The order screens. `ordersByGroup` is what the order's own page reads, and
   *  it is the only place a **pack** id appears — the cancel call takes that,
   *  not the group id every screen shows. */
  orderList: "/customer/order/list",
  ordersByGroup: "/customer/order/getOrdersByOrderGroupID",
  orderCancel: "/customer/order/cancel",

  /** Ticking the terms row posts this before it sets the flag. */
  approvePolicies: "/customer/approve-policies",
} as const;

/** A believable user object for a faked verify response.
 *
 *  The app reads `user.id`, `user.name`, `user.phone` and `user.mobilePhone`.
 *  The phone is intentionally not a real one; it is never printed by a helper. */
const fakeUser = (name: string) => ({
  id: 123_456,
  name,
  phone: "+963700000000",
  mobilePhone: "+963700000000",
});

/** The satellite service identities the login route is expected to return.
 *
 *  `AuthService.VerifyOtp` maps these to `ChatUser`, `StoriesUser` and
 *  `WalletUser`; leaving them empty means the app treats the services as
 *  unreachable, which is fine for widget-level specs. */
const fakeSatellites = {
  ChatUser: null,
  StoriesUser: null,
  WalletUser: null,
};

export const auth = {
  /** A never-seen number signs up: `already_exists` is false and the user has
   *  no name, so the widget moves to the name screen. */
  signupNewPhone: {
    [ENDPOINTS.login]: {
      status: 200,
      body: {
        isSuccessful: true,
        success: true,
        data: {
          user: fakeUser(""),
          already_exists: false,
        },
        ...fakeSatellites,
      },
    },
  } satisfies MockMap,

  /** A known shopper logs in: `already_exists` is true and the user has a real
   *  name, so the widget shows the welcome screen. */
  existingUser: {
    [ENDPOINTS.login]: {
      status: 200,
      body: {
        isSuccessful: true,
        success: true,
        data: {
          user: fakeUser("Shopper A"),
          already_exists: true,
        },
        ...fakeSatellites,
      },
    },
  } satisfies MockMap,

  /** Logging in with a number that exists on the device but is not registered
   *  yet. The widget shows the "not registered" screen. */
  userNotFound: {
    [ENDPOINTS.login]: {
    status: 200,
      body: {
        isSuccessful: true,
        success: true,
        data: {
          user: fakeUser("Shopper A"),
          already_exists: false,
        },
        ...fakeSatellites,
      }
    },
  } satisfies MockMap,

  /** The backend refuses the code. */
  wrongOtp: {
    [ENDPOINTS.login]: {
      status: 401,
      body: { message: "Invalid verification code" },
    },
  } satisfies MockMap,

  /** Too many attempts. The real limiter is Redis-backed and shared, so this is
   *  the only safe way to see this screen without locking the test identity out
   *  of every other spec in the run. */
  rateLimited: {
    [ENDPOINTS.login]: {
      status: 429,
      body: { message: "Too many attempts. Try again later." },
    },
  } satisfies MockMap,

  /** The backend is broken. Proves the UI says so rather than hanging. */
  serverError: {
    [ENDPOINTS.login]: {
      status: 500,
      body: { message: "Internal server error" },
    },
  } satisfies MockMap,
} as const;

// ---------------------------------------------------------------------------
// The profile save, and the branches a healthy backend will not perform
//
// Every one of these fakes **all three** legs, not just the one under test.
// Faking one leg and letting the other two run would put real writes on the
// shared account with no undo but the app's own rollback — which is the thing
// several of these cases exist to test. Faking all three writes nothing real and
// still lets the recorder see a fulfilled answer per leg.
//
// `/api/auth/refresh` is faked wherever a `401` is induced. Renewal is
// server-side and single-use, so one real exchange burns the credential in the
// saved session file and every later case opens a dead one.

const ok = { status: 200, body: { isSuccessful: true, success: true, data: {} } };

/** All three legs accept. The baseline the branches below vary from. */
const allLegsAccept = {
  [ENDPOINTS.saveStories]: ok,
  [ENDPOINTS.saveChat]: ok,
  [ENDPOINTS.saveCore]: ok,
  [ENDPOINTS.refresh]: ok,
  [ENDPOINTS.updateUser]: ok,
};

export const save = {
  /** `AC-1` — the core leg refuses, and the app must put the other two back and
   *  say so once.
   *
   *  **500, not 401.** A `401` starts credential recovery instead: the app would
   *  exchange the credential and retry, which is a different branch entirely and
   *  the one `AC-5` covers. */
  coreRefuses: {
    ...allLegsAccept,
    [ENDPOINTS.saveCore]: {
      status: 500,
      body: { isSuccessful: false, success: false, message: "core refused" },
    },
  } satisfies MockMap,

  /** `AC-2` — the account has no chat record, so the chat leg is skipped.
   *
   *  The `/api/auth/me` answer carries **the account's own values** with only
   *  the chat identity nulled. A synthetic user would be copied into the app's
   *  store and then written to the real account by the save; an empty one makes
   *  the app register a fresh guest and replace the credential. The case reads
   *  the real body first and hands it back with one field removed. */
  noChatRecord: (realMe: unknown) =>
    ({
      ...allLegsAccept,
      [ENDPOINTS.authMe]: { status: 200, body: realMe },
    }) satisfies MockMap,

  /** `AC-3` — the upload is refused.
   *
   *  The ticket **succeeds**: it is minted before the upload, so a refusal there
   *  would mean the upload was never attempted and the case would pass without
   *  reaching the thing it names. */
  uploadRefused: {
    ...allLegsAccept,
    [ENDPOINTS.uploadTicket]: {
      status: 200,
      body: { success: true, ticket: "e2e-probe-ticket" },
    },
    [ENDPOINTS.mediaUpload]: {
      status: 500,
      body: { message: "media refused" },
    },
  } satisfies MockMap,

  /** `AC-6` — the save is refused and renewing the credential fails too.
   *
   *  `expired: true` with no `renewed` — an answer carrying `renewed` short
   *  circuits before the app ever asks the shopper to sign in again, and the
   *  case would assert nothing while still reporting its fake was used. */
  renewalAlsoFails: {
    ...allLegsAccept,
    [ENDPOINTS.saveCore]: {
      status: 401,
      body: { isSuccessful: false, success: false },
    },
    [ENDPOINTS.refresh]: {
      status: 401,
      body: { refreshed: false, eligible: true },
    },
    [ENDPOINTS.expire]: {
      status: 200,
      body: { expired: true, wasVerified: true },
    },
  } satisfies MockMap,

  /** `AC-4` — the phone change. Everything after the real send is faked,
   *  including the app's own cookie mirror, so the shared identity cannot move. */
  phoneChangeAccepted: (idToken: string) =>
    ({
      ...allLegsAccept,
      [ENDPOINTS.verifyPhone]: {
        status: 200,
        body: { isSuccessful: true, success: true, data: { id_token: idToken } },
      },
    }) satisfies MockMap,
} as const;

/** `AC-5` — the core leg refuses once with a `401`, then accepts.
 *
 *  A sequence rather than a map: the same endpoint has to answer differently on
 *  the second call, which is the whole shape of "the credential was exchanged
 *  mid-save". Install the map first and this second, so this is tried first and
 *  falls back to the map for everything else.
 *
 *  A third core write would fall past the exhausted sequence into the map, which
 *  is why the map's core answer is a `200` rather than absent. */
export const credentialRefusedMidSave = [
  { status: 401, body: { isSuccessful: false, success: false } },
  ok,
];

// ---------------------------------------------------------------------------
// The money path, and the branches a working shop will not perform
//
// `shopper.live.spec.ts` walks the buy journey that works, on real staging, and
// leaves nothing behind. It cannot walk any of the branches below:
//
//   * A refused checkout. Staging accepts what it is asked.
//   * A bag holding something that has gone out of stock **since** it was added.
//   * A phone that stops being verified between two screens.
//   * A credential refused in the middle of placing an order.
//   * A refused cancel — which would need a real order that is then stranded
//     live, which is exactly what the live journey's safety net exists to
//     prevent.
//
// **Every one of these fakes the whole checkout screen, not one call.** The
// screen is built from four answers — who the shopper is, the bag, the saved
// addresses, and the checkout itself — and letting any of them reach staging
// would put a real read or a real order behind a case that is pretending. So
// each scenario starts from `checkoutWorks` and changes one thing.
//
// **No sign-in, and that is the point.** `userProfile` is filled from
// `/customer/info` and from nowhere else, so a faked answer is how the app
// itself learns who it is talking to. A real sign-in would spend a one-time code
// per case against limits that are not ours, and would prove nothing these cases
// are about. Nothing here is ever written to a real account.

/** A shopper the app will let into checkout. Obviously fake values only. */
const verifiedShopper = (overrides: Record<string, unknown> = {}) => ({
  isSuccessful: true,
  success: true,
  data: {
    customer_info: {
      id: 999_001,
      name: "Trydos E2E Probe",
      phone: "963900000001",
      email: "trydos.e2e.probe@example.com",
      is_phone_verified: 1,
      is_approve_policies: 0,
      ...overrides,
    },
  },
});

/** One saved address, marked default — the only thing the checkout looks at. */
const defaultAddress = {
  isSuccessful: true,
  success: true,
  data: [
    {
      id: 999_101,
      country_iso: "sy",
      country: "Syria",
      province: "Probe Province",
      city: "Probe City",
      town: "Probe Town",
      street: "Probe Street",
      building: "1",
      zip: "123123",
      address: "Trydos E2E Probe",
      address_detail: "Trydos E2E probe address, faked — never stored",
      contact_person_name: "Trydos E2E Probe",
      phone: "963900000001",
      alternative_phone: "",
      is_default: 1,
      is_billing: 0,
      cost: 0,
    },
  ],
};

/** A bag with one line the shop will take cash for.
 *
 *  Built from the unit suite's own cart builder (`tests/fixtures/cart.ts`), so
 *  the shape follows `CartApiInterface` and one file stays the source of it.
 *  Only what the checkout reads is overridden here. */
const bagWith = (item: Partial<CartItemInterface> = {}) => ({
  isSuccessful: true,
  success: true,
  data: buildCart({
    available_payment_method: ["cash_on_delivery"],
    has_cod: true,
    cod_cost: 0,
    cart: [buildCartItem(item)],
  }),
});

/** An empty bag. */
const emptyBag = {
  isSuccessful: true,
  success: true,
  data: buildCart({
    available_payment_method: ["cash_on_delivery"],
    has_cod: true,
    cart: [],
    sub_total: 0,
    total: 0,
    total_cash: 0,
    products_discount: 0,
    total_discount: 0,
  }),
};

/** The order number every faked checkout answers with.
 *
 *  A fixed, obviously-fake value: no order with this number exists anywhere, so
 *  a case that reads it back has proved it read the faked answer and not a real
 *  one that happened to be lying around. */
export const FAKE_ORDER_GROUP_ID = "E2E-PROBE-000000";

/** What a checkout that worked answers with.
 *
 *  **`data` is a list of packs, and each pack must carry its `details`.** The
 *  success screen draws the bag from `data[].details` and sums the money from
 *  `data[].order_amount` (`components/cart/PlaceOrderWidget.tsx`), so an answer
 *  holding only the order number crashes the page with "Cannot read properties
 *  of undefined (reading 'map')" — which is how this shape was found. The lines
 *  mirror the faked bag, so the screen shows what was ordered.
 *
 *  No `url`, so the app treats the order as finished rather than sending the
 *  shopper off to a payment page. */
const checkoutAccepted = {
  status: 200,
  body: {
    isSuccessful: true,
    success: true,
    data: [
      {
        id: 999_201,
        order_group_id: FAKE_ORDER_GROUP_ID,
        order_amount: 80,
        details: [
          {
            id: 999_301,
            quantity: 1,
            image: "/product/test-product-1.jpg",
            variations: { size_options: "M", color_options: "black" },
          },
        ],
      },
    ],
  },
};

/** The four answers the checkout screen is built from, all working. Every
 *  scenario below is this with one thing changed. */
const checkoutWorks = {
  // A guest registration that registers nobody.
  //
  // The app posts this from the browser while it boots, and the route mints a
  // real guest on the gateway. Answered here with **no `user`**, which is what
  // makes it harmless: `registerForExpire` only calls `loginSuccess` when the
  // answer carries one (`services/home.ts`), so the faked shopper below stays
  // the shopper and nothing is created anywhere.
  [ENDPOINTS.registerDevice]: {
    status: 200,
    body: { isSuccessful: true, success: true, data: {} },
  },
  [ENDPOINTS.customerInfo]: { status: 200, body: verifiedShopper() },
  [ENDPOINTS.cart]: { status: 200, body: bagWith() },
  [ENDPOINTS.cartOverview]: {
    status: 200,
    body: { isSuccessful: true, success: true, data: {} },
  },
  [ENDPOINTS.oldCart]: {
    status: 200,
    body: { isSuccessful: true, success: true, data: { oldCart: [] } },
  },
  [ENDPOINTS.addressList]: { status: 200, body: defaultAddress },
  [ENDPOINTS.approvePolicies]: {
    status: 200,
    body: { isSuccessful: true, success: true, data: {} },
  },
  [ENDPOINTS.refresh]: ok,
  [ENDPOINTS.updateUser]: ok,
  [ENDPOINTS.checkoutCashOnDelivery]: checkoutAccepted,
};

export const checkout = {
  /** The control. Everything works, and the order is placed against a faked
   *  backend — so a case can prove the journey itself still runs here before any
   *  of the branches below claim to have broken it on purpose. */
  works: { ...checkoutWorks } satisfies MockMap,

  /** The shop refuses the order.
   *
   *  A `500`, not a `401`: a `401` starts credential recovery, which is the
   *  branch `credentialRefusedMidCheckout` covers. */
  refused: {
    ...checkoutWorks,
    [ENDPOINTS.checkoutCashOnDelivery]: {
      status: 500,
      body: {
        isSuccessful: false,
        success: false,
        message: "the shop refused this order",
      },
    },
  } satisfies MockMap,

  /** A line in the bag is no longer available.
   *
   *  The check runs on the bag the app **re-reads** when Confirm Shipping &
   *  Payment is pressed, not on what was on screen — which is the whole point:
   *  it catches a product that sold out while the shopper was choosing an
   *  address. */
  bagWentUnavailable: {
    ...checkoutWorks,
    [ENDPOINTS.cart]: {
      status: 200,
      body: bagWith({ check_availability: false }),
    },
  } satisfies MockMap,

  /** A line in the bag cannot be shipped to this country. A different field and
   *  a different cause from the one above, judged by the same guard — so both
   *  are covered rather than one standing in for the other. */
  bagRestrictedByCountry: {
    ...checkoutWorks,
    [ENDPOINTS.cart]: {
      status: 200,
      body: bagWith({ is_country_restricted: true }),
    },
  } satisfies MockMap,
} as const;

/** The bag has emptied.
 *
 *  A **map to install later**, not a sequence, and that difference was measured
 *  rather than chosen. A sequence has to guess how many times the bag is read on
 *  the way in — boot, the drawer opening, the step into checkout — and a wrong
 *  guess made the bag empty while the shopper was still choosing a payment
 *  method, which disabled cash on delivery and failed the case for a reason that
 *  had nothing to do with what it was testing.
 *
 *  Installed over `checkout.works` at the moment the case is ready, it changes
 *  exactly one answer at exactly one point. A route registered later wins in
 *  Playwright, and everything it does not name still falls through to the map
 *  underneath. */
export const bagEmptiedSince = {
  [ENDPOINTS.cart]: { status: 200, body: emptyBag },
} satisfies MockMap;

/** The credential is refused once while the order is being placed, then
 *  accepted.
 *
 *  The same shape as `credentialRefusedMidSave`, and for the same reason: the
 *  one endpoint has to answer differently the second time, which is what "the
 *  credential was exchanged mid-checkout" looks like from the browser. Install
 *  the map first and this second, so this is tried first and everything else
 *  falls back to the map. */
export const credentialRefusedMidCheckout = [
  { status: 401, body: { isSuccessful: false, success: false } },
  checkoutAccepted,
];

export const scenarios = { auth, save, checkout } as const;
