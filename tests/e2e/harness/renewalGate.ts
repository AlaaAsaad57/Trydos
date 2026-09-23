// Do not leave a page while it is renewing its own credential.
//
// ---------------------------------------------------------------------------
// What goes wrong without this
//
// Access tokens on staging live 60 seconds; refresh tokens live two days and
// are **single-use**. So a signed-in page that is more than a minute old meets
// a 401 on its next call, and the app recovers it on its own: `fetchData` posts
// `/api/auth/refresh`, the backend rotates the pair, and the answer's
// `Set-Cookie` puts the new pair in the jar.
//
// The backend spends the old refresh token **before** the browser has the new
// one. If the page navigates in that gap, the browser cancels the fetch, the
// `Set-Cookie` never lands, and the jar keeps a refresh token the backend has
// already spent. The next page load gets a 401, its exchange is refused, and the
// app registers a guest — which deletes every sub-service cookie.
//
// CI run 35795729846 did exactly that. `CMT-07` passed at 23:16:43.99 while its
// page was still inside an exchange (the backend answered it at 44.27), and
// `CMT-08` sent the same page to the product address straight away. From then
// on the shopper was a guest, and `CMT-08` reported the comments delete going
// out "with no comments token".
//
// A shopper does not click a link within milliseconds of a page settling, so
// the suite waits for what a person waits for without thinking about it: the
// page's own renewal to finish. The app is not changed and nothing is hidden —
// a renewal that never finishes still fails, and names itself.
//
// This file depends only on `@playwright/test`, like the rest of `harness/`.

import type { BrowserContext, Page, Request } from "@playwright/test";

/** The same-origin routes that rotate or replace the credential. */
const RENEWAL_ROUTES = new Set(["/api/auth/refresh", "/api/auth/expire"]);

/** How long the page must stay quiet after a renewal ends or a call is refused.
 *
 *  A refused call starts its renewal a few milliseconds later, after
 *  `fetchData` has read the answer. One second covers that gap on a loaded CI
 *  runner many times over. */
const QUIET_MS = 1_000;

/** How long a renewal may run before the wait gives up and says so. */
const RENEWAL_MS = 20_000;

type RenewalState = {
  open: Set<Request>;
  /** When the last renewal ended, or a proxied call answered 401. */
  lastActivityAt: number;
};

const renewals = new WeakMap<BrowserContext, RenewalState>();

const pathOf = (request: Request): string => {
  try {
    return new URL(request.url()).pathname;
  } catch {
    return "";
  }
};

/** Start watching. Called once, by `newLiveContext`, before any page exists. */
export const watchRenewals = (context: BrowserContext): void => {
  const state: RenewalState = { open: new Set(), lastActivityAt: 0 };
  renewals.set(context, state);

  context.on("request", (request) => {
    if (RENEWAL_ROUTES.has(pathOf(request))) state.open.add(request);
  });

  const ended = (request: Request): void => {
    if (!state.open.delete(request)) return;
    state.lastActivityAt = Date.now();
  };
  context.on("requestfinished", ended);
  context.on("requestfailed", ended);

  // A refused proxied call is where a renewal begins. It is noted so the quiet
  // window starts from the refusal, not from before it.
  context.on("response", (response) => {
    if (response.status() !== 401) return;
    if (pathOf(response.request()) !== "/api/proxy") return;
    state.lastActivityAt = Date.now();
  });
};

/** Wait until the page is not renewing its credential, then return.
 *
 *  Call it before a `page.goto` on a page that has already been signed in and
 *  has been showing the app. Throws — naming the route — if a renewal is still
 *  running after `RENEWAL_MS`, because leaving then would spend the session. */
export const waitForRenewalSettled = async (page: Page): Promise<void> => {
  const state = renewals.get(page.context());
  // A context not built by `newLiveContext` has nothing recorded, so there is
  // nothing to wait for.
  if (!state) return;

  const deadline = Date.now() + RENEWAL_MS;
  while (Date.now() < deadline) {
    const quietFor = Date.now() - state.lastActivityAt;
    if (state.open.size === 0 && quietFor >= QUIET_MS) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (state.open.size > 0) {
    const routes = [...state.open].map(pathOf).join(", ");
    throw new Error(
      `the page was still renewing its credential (${routes}) ` +
        `${RENEWAL_MS / 1000} s later. Leaving now would cancel the answer ` +
        "that carries the new token pair, after the backend has already spent " +
        "the old refresh token, so the session would end as a guest. The " +
        "renewal itself is what hangs — look at /api/auth/refresh on the " +
        "market backend",
    );
  }
  // Only the quiet window was never reached: calls kept being refused for the
  // whole wait. Nothing is in flight to lose, so the case goes on and reports
  // whatever those refusals break.
};
