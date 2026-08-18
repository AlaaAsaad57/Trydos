// Becoming a guest.
//
// Every visitor to the storefront holds a token, whether or not they have ever
// entered a phone number: `MARKET-TOKEN` is the single auth cookie for guests and
// verified shoppers alike. So the first thing any live test needs is a guest
// session, and this is the one approved write against staging — a throwaway guest
// row, which `tests/live/README.md` has allowed from the start.
//
// The real route is used, not the backend endpoint behind it. `/auth/register-guest`
// returns the token in its body; only `POST /api/auth/register-device` turns that
// into the HttpOnly cookie pair the rest of the app reads, and clears the previous
// identity's sub-service cookies while doing it. Calling the backend directly
// would produce a token no later request could use.
//
// Phase 3 builds `withSession()` on top of this — one login per identity per run,
// surviving a 401. This is the guest half, and it is all phase 1 needs.

import { CookieJar, jarFetch } from "./cookieJar";

export type GuestRegistration = {
  status: number;
  /** The response body, which must never contain a token. */
  body: unknown;
  /** Every cookie name the jar holds afterwards. Names only — never values. */
  cookies: string[];
};

/** Register a brand-new guest into this jar. */
export const registerGuest = async (
  jar: CookieJar,
  locale: { country?: string; language?: string } = {},
): Promise<GuestRegistration> => {
  const { country = "gb", language = "en" } = locale;

  // Bodyless, per the contract the route documents: register-guest only ever
  // creates a new guest, so there is nothing to send.
  const response = await jarFetch(jar)("/api/auth/register-device", {
    method: "POST",
    headers: { "x-country": country, "x-language": language },
  });

  // The jar has already taken the cookies — jarFetch ingests every same-origin
  // response — so read the names back off it rather than re-parsing headers.
  const cookies = jar.names();

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // A body that is not JSON is itself worth asserting on; the caller decides.
  }

  return { status: response.status, body, cookies };
};
