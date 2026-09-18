// Did the client ever start?
//
// Three of this suite's standing failures are the same fact seen from three
// sides: the store has no user. The menu then offers no sign-out, `getCart`
// re-reads the bag without calling anything, and the address form asks for a
// name the shopper never typed. All three look like a backend that went quiet,
// and none of them is.
//
// One thing fills that store, and it is `getClientData` (`services/home.ts`):
// `GET /web/home/startingSettings`, and then — **inside the same `try`, after it
// and awaiting it** — `getCustomerInfo` -> `GET /customer/info`. So a settings
// read that fails takes the profile read down with it.
//
// `CartProvider` calls that chain once per document load, and **skips it
// entirely** while the address carries `changed-country` or `no-country`,
// because the region picker is expected to reload the page. Measured on
// 2026-09-19 against a local build: `/sy-en/about` sent all four start-up calls
// within five seconds, and `/sy-en/about?changed-country=sy` sent **none at
// all**, ever. A page left standing on such an address therefore never starts,
// and nothing on screen says so.
//
// So every live context records those two calls for its whole life. Recorded
// from the context rather than from a page, so it survives every navigation,
// and attached at creation, so it is never installed after the moment it exists
// to describe.
//
// **Statuses and addresses only.** These answers carry the shopper's name and
// phone, and this repository's job logs are public.
//
// It lives in its own file rather than in `harness/liveSession.ts` for one
// reason: `liveSession.ts` imports `actions/auth.ts`, and `actions/auth.ts` is
// what reads this. Putting it there would close that loop into a cycle.

import type { BrowserContext, Page } from "@playwright/test";

/** The two calls that fill the store's user, by the path each one carries. */
const CLIENT_START_CALLS = ["/web/home/startingSettings", "/customer/info"];

/** The same-origin routes that say the session was *recovered* rather than
 *  merely read.
 *
 *  These are the other half of the story and they do not go through
 *  `/api/proxy`, so the match above cannot see them. They matter because the
 *  recovery path does not only swap a credential — `ExpiredUser` ends in
 *  `cancelAuth()`, and `cancelAuth` with no argument sets `userProfile: null`
 *  (`store/auth/reducer.tsx`). A recovery that lands *after* the profile has
 *  arrived therefore empties the store again, and `getClientData` runs once per
 *  document load, so nothing refills it.
 *
 *  That produces the exact state AUTH-03 and PROF-08 report: the cookie still
 *  names a phone-verified shopper, `/customer/info` answered 200 naming that
 *  same shopper, and the menu still offers no sign-out. Without these lines the
 *  order of the two is invisible. */
const SESSION_RECOVERY_CALLS = [
  "/api/auth/refresh",
  "/api/auth/expire",
  "/api/auth/register-device",
  "/auth/register-guest",
];

const clientStart = new WeakMap<BrowserContext, string[]>();

/** Start recording. Called once, by whoever creates a live context. */
export const watchTheClientStarting = (context: BrowserContext): void => {
  const log: string[] = [];
  clientStart.set(context, log);

  const pathIn = (request: {
    url(): string;
    headers(): Record<string, string>;
  }): string | undefined => {
    const url = request.url();

    // The recovery routes are same-origin and carry no `x-proxy-url`, so they
    // are matched on the address itself.
    if (!url.includes("/api/proxy")) {
      return SESSION_RECOVERY_CALLS.find((known) => url.includes(known));
    }

    const target = request.headers()["x-proxy-url"] ?? "";
    return (
      CLIENT_START_CALLS.find((known) => target.includes(known)) ??
      SESSION_RECOVERY_CALLS.find((known) => target.includes(known))
    );
  };

  // **Anything the page threw.** A React render that throws takes its subtree
  // with it, and what is left on screen is a page that looks merely out of
  // date — the menu without its sign-out item, a form with empty fields, a
  // header reading "Hello ,". `AddAddressForm` was exactly that and cost weeks
  // of blaming the address list, so the question is now asked of every live
  // page rather than of one helper.
  //
  // Names the error and nothing else: a stack from a minified bundle is noise,
  // and the page's own text can carry the shopper's details.
  context.on("weberror", (webError) => {
    const first = String(webError.error()?.message ?? webError.error()).split(
      "\n",
    )[0];
    const line = `the page threw: ${first}`;
    if (!log.includes(line)) log.push(line);
  });

  // **Every document load, in the same order as the calls.** The chain that
  // fills the store runs once per load and never again, so "which load was
  // this?" is half of every reading here. A page that loads a second time while
  // a case is waiting has thrown away the store the case was waiting for, and
  // without this line the two loads' calls read as one confusing list.
  context.on("page", (page) => {
    page.on("framenavigated", (frame) => {
      if (frame !== page.mainFrame()) return;
      log.push(`--- the page loaded ${frame.url()} ---`);
    });
  });

  context.on("request", (request) => {
    const path = pathIn(request);
    if (path) log.push(`sent ${path}`);
  });

  context.on("response", (response) => {
    const path = pathIn(response.request());
    if (path === undefined) return;

    const status = response.status();
    if (path !== "/customer/info" || status !== 200) {
      log.push(`${path} answered ${status}`);
      return;
    }

    // **Who the profile read named.** A `200` is not the end of the question:
    // the app recovers a refused credential by registering a fresh guest, and
    // the retried read then answers `200` with the *guest*. `updateUserInfo`
    // (`store/auth/reducer.tsx`) assigns rather than merges, so the shopper's
    // phone is gone from the store — and `shouldShowLogout`
    // (`components/Home/Menu.tsx`) hides sign-out for exactly that.
    //
    // From outside, "the shop answered 200 and the menu is still wrong" and
    // "the shop handed back a guest, and the menu is right" are the same line.
    // They are opposite findings: one is this app, the other is the session.
    //
    // Judged by the same rule the menu applies — a phone that is neither empty
    // nor `"0"` — and recorded as that rule's answer, never as the number.
    const at = log.length;
    log.push(`${path} answered ${status} (still reading who it named)`);

    void response
      .text()
      .then((body) => {
        let who = "an answer that is not JSON";
        try {
          const info = (
            JSON.parse(body) as {
              data?: { customer_info?: { phone?: unknown; id?: unknown } };
            }
          )?.data?.customer_info;

          if (!info) {
            who = "no customer_info at all";
          } else {
            const phone = String(info.phone ?? "");
            who =
              phone !== "" && phone !== "0"
                ? `account ${String(info.id ?? "with no id")}, which has a usable phone`
                : `account ${String(info.id ?? "with no id")}, which has NO usable phone — a guest, so the menu is right to hide sign-out`;
          }
        } catch {
          /* keep the fallback */
        }
        log[at] = `${path} answered ${status} naming ${who}`;
      })
      .catch(() => {
        log[at] = `${path} answered ${status}, and its body could not be read`;
      });
  });
};

/** What this context's pages have asked for, and where the page is standing.
 *
 *  Written for a failure message, so it never throws and never comes back with
 *  nothing: "neither call was ever sent" is the most important reading it can
 *  give, and an empty string would hide it. */
export const howTheClientStarted = (page: Page): string => {
  const log = clientStart.get(page.context());
  const where = `the page is on ${page.url()}`;

  if (log === undefined) {
    return (
      `${where}, and this context was not built by newLiveContext, so its ` +
      `start-up calls were not recorded`
    );
  }

  if (log.length === 0) {
    return (
      `${where}, and neither /web/home/startingSettings nor /customer/info has ` +
      `been sent once in the life of this browser context. The store's user ` +
      `cannot arrive without them. CartProvider skips the whole chain while the ` +
      `address carries changed-country or no-country — read the address above ` +
      `before anything else`
    );
  }

  return `${where}, and its start-up calls went: ${log.join("; ")}`;
};
