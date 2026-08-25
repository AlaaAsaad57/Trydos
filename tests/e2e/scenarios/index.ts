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

  /** The picture upload, and the ticket minted just before it. */
  uploadTicket: "/api/ticket",
  mediaUpload: "/gated/upload",
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

export const scenarios = { auth, save } as const;
