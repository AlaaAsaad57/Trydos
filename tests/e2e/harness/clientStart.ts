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

const clientStart = new WeakMap<BrowserContext, string[]>();

/** Start recording. Called once, by whoever creates a live context. */
export const watchTheClientStarting = (context: BrowserContext): void => {
  const log: string[] = [];
  clientStart.set(context, log);

  const pathIn = (request: {
    url(): string;
    headers(): Record<string, string>;
  }): string | undefined => {
    if (!request.url().includes("/api/proxy")) return undefined;
    const target = request.headers()["x-proxy-url"] ?? "";
    return CLIENT_START_CALLS.find((known) => target.includes(known));
  };

  context.on("request", (request) => {
    const path = pathIn(request);
    if (path) log.push(`sent ${path}`);
  });

  context.on("response", (response) => {
    const path = pathIn(response.request());
    if (path) log.push(`${path} answered ${response.status()}`);
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
