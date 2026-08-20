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
      status: 422,
      body: { message: "User not found", data: null },
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

export const scenarios = { auth } as const;
