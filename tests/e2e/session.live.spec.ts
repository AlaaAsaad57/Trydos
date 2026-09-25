// A guest's credential, from issued to replaced.
//
// Every visitor who has not signed in browses on a credential the app issued
// for them, and that credential stops being accepted about a minute after it is
// issued. Two things keep the storefront usable for them: quietly exchanging a
// refused credential, and quietly issuing a whole new guest when that exchange
// cannot happen. Both run for every anonymous visitor, many times a session,
// and neither was tested in a browser before these cases.
//
// ---------------------------------------------------------------------------
// How each case is shaped, and why
//
// **Boot, then measure.** Getting to a usable page costs a request and a
// navigation. That work happens before the measured window opens, because a
// guest session lasts about sixty seconds and a window that included boot would
// be measuring the network more than the app.
//
// **The window is thirty seconds**, from the registration that starts it to the
// last assertion. Every wait inside it carries its own short timeout rather
// than inheriting the suite's longer defaults, and they sum well under the
// budget — see `_specs/e2e-guest-token-lifecycle/implement.md` for the
// arithmetic. Elapsed time is asserted before the behavioural assertions as
// well as after, so an overrun is reported as an overrun rather than as a
// behaviour failure against a state the case did not cause.
//
// **A budget failure means re-run, not "the app changed".** If one of these
// goes red on elapsed time, staging was slow. Re-run it locally with tracing
// before reading anything into it.
//
// **What separates a renewal from a new guest.** The outcome, never the absence
// of a request:
//
//   * a renewal — the identity survives and both credentials rotate;
//   * a new guest — the identity differs, both credentials rotate, and an
//     expiry was requested. That expiry request *is* the re-registration: the
//     route mints the guest server to server, so the browser never sees a
//     registration request in this path.
//
// The absence of an expiry request is deliberately not a signal. When two
// refused requests race, the loser can legitimately reach that route, whose own
// last-chance renewal returns a live session with the identity intact — so
// requiring its absence would fail a correct app.
//
// **No credential value appears anywhere here.** Presence is asserted on cookie
// names, change on booleans, identity on a number. See `harness/session.ts`.

import { expect, test } from "./fixtures";
import { bootAsNewGuest, whoAmI, whoAmIWhenReady } from "./actions/auth";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  credentialsChangedSince,
  credentialsHeld,
  recordAuthCalls,
  snapshotCredentials,
  spoilCredentials,
} from "./harness/session";
import { nav, prompt } from "./selectors";
import { toServiceToken } from "utils/serviceTokens";

// Every wait inside the measured window, named so the sum can be checked.
const CART_OPEN_MS = 10_000;
const RECOVERY_MS = 12_000;
const PROMPT_ABSENT_MS = 2_000;
/** The window itself. Under the roughly sixty seconds a guest session lasts,
 *  with room for the app to be slow without being broken. */
const WINDOW_MS = 30_000;

const REGISTRATION = "/api/auth/register-device";
const RENEWAL = "/api/auth/refresh";
const EXPIRY = "/api/auth/expire";

/** Open the cart and wait for the request it makes to settle.
 *
 *  The waiting belongs here rather than in the shared `openCart` step, which
 *  only clicks and returns — an existing browsing case depends on it staying
 *  that way. Opening the cart is what provokes the refusal, so a case that did
 *  not wait would read the credentials before the app had finished replacing
 *  them. */
const openCartAndSettle = async (
  page: any,
  recorder: any,
  spoiled: any,
) => {
  const button = nav.cartButton(page);
  await expect(button).toBeVisible({ timeout: CART_OPEN_MS });
  await button.click({ timeout: CART_OPEN_MS });
  await recorder.waitFor(RENEWAL, RECOVERY_MS);

  // Wait for the credentials to have actually rotated, not for a request to
  // have been sent. The recorder reports a request the moment it leaves the
  // browser, and the replacement arrives on the answer — so anything keyed on
  // the request reads the old state.
  //
  // The stored identity is rewritten on that same answer, which is why this is
  // the right thing to wait for. Waiting for a follow-up request was tried and
  // is wrong: the profile write fires during boot, not after a recovery.
  //
  // **Compared against the spoiled state, not the original.** Comparing against
  // the original made this true the instant the credential was overwritten —
  // the spoiled value differs from the original too — so the wait returned
  // before the app had done anything at all.
  //
  // This matters in both directions. Case 3 went intermittently red because the
  // outgoing guest was still readable; case 2 — which asserts the identity is
  // *unchanged* — would have gone quietly green for the same reason. A test
  // that passes because it looked too early is worse than one that fails.
  await expect
    .poll(
      async () => {
        const changed = await credentialsChangedSince(page, spoiled);
        return changed.access && changed.refresh;
      },
      {
        timeout: RECOVERY_MS,
        message: `the credentials never rotated after the cart was opened. Auth calls seen: ${recorder.paths().join(", ")}`,
      },
    )
    .toBe(true);
};

/** Fail on the budget, and say what was seen while doing it.
 *
 *  Nothing is recorded for these cases — no trace, no video, no screenshot,
 *  because the repository is public — so one red run has to be enough to
 *  diagnose. The path list and the elapsed split are the whole diagnostic. */
const withinWindow = (
  startedAt: number,
  recorder: { paths(): string[] },
  where: string,
) => {
  const elapsed = Date.now() - startedAt;
  expect(
    elapsed,
    `the measured window ran ${elapsed}ms at ${where}, over the ${WINDOW_MS}ms budget. ` +
      `Staging was slow — re-run before reading anything into it. ` +
      `Auth calls seen: ${recorder.paths().join(", ") || "none"}`,
  ).toBeLessThan(WINDOW_MS);
};

test.describe("a guest's credential", () => {
  test("a first visit registers the guest and leaves them able to act", async ({
    page,
  }) => {
    const recorder = recordAuthCalls(page);
    const guest = await bootAsNewGuest(page, { recorder });

    withinWindow(guest.registeredAt, recorder, "before asserting");

    // Both credentials, by name. The values are never read.
    expect(await credentialsHeld(page)).toEqual(
      [ACCESS_COOKIE, REFRESH_COOKIE].sort(),
    );

    // And the app can say who they are.
    expect(
      await whoAmIWhenReady(page),
      "the app cannot name the guest it just registered",
    ).not.toBeNull();

    // The registration happened. Other requests in the same visit are fine —
    // pinning the exact set would turn an ordinary change to the boot sequence
    // into a break.
    expect(recorder.sawSince(guest.mark, REGISTRATION)).toBe(true);

    withinWindow(guest.registeredAt, recorder, "after asserting");
  });

  test("a refused credential is exchanged, and the guest stays the same guest", async ({
    page,
  }) => {
    const recorder = recordAuthCalls(page);
    const guest = await bootAsNewGuest(page, { recorder });

    const before = await snapshotCredentials(page);
    const whoBefore = await whoAmIWhenReady(page);

    // Only the working credential. The means to renew is left intact, which is
    // what makes this a renewal rather than a re-registration.
    await spoilCredentials(page, [ACCESS_COOKIE]);
    const spoiled = await snapshotCredentials(page);
    const afterSpoil = recorder.mark();

    withinWindow(guest.registeredAt, recorder, "before opening the cart");
    await openCartAndSettle(page, recorder, spoiled);
    withinWindow(guest.registeredAt, recorder, "after the recovery");

    const changed = await credentialsChangedSince(page, before);
    expect(changed.access, "the refused credential was not replaced").toBe(true);
    expect(changed.refresh, "the means to renew was not rotated with it").toBe(
      true,
    );

    expect(await whoAmI(page), "the guest was replaced instead of renewed").toBe(
      whoBefore,
    );

    expect(
      recorder.sawSince(afterSpoil, RENEWAL),
      `no renewal was requested. Auth calls seen: ${recorder.paths().join(", ")}`,
    ).toBe(true);
    expect(
      recorder.sawSince(afterSpoil, REGISTRATION),
      "a new guest was registered when the session should have been renewed",
    ).toBe(false);

    // Deliberately nothing about the expiry request. Two refused requests
    // racing can legitimately produce one, and its own last-chance renewal
    // returns a live session with the identity intact.

    withinWindow(guest.registeredAt, recorder, "after asserting");
  });

  test("a refused pair issues a new guest, and never asks anyone to sign in", async ({
    page,
  }) => {
    const recorder = recordAuthCalls(page);
    const guest = await bootAsNewGuest(page, { recorder });

    const before = await snapshotCredentials(page);
    const whoBefore = await whoAmIWhenReady(page);

    // Both, so the exchange itself cannot succeed.
    await spoilCredentials(page, [ACCESS_COOKIE, REFRESH_COOKIE]);
    const spoiled = await snapshotCredentials(page);
    const afterSpoil = recorder.mark();

    withinWindow(guest.registeredAt, recorder, "before opening the cart");
    await openCartAndSettle(page, recorder, spoiled);
    await recorder.waitFor(EXPIRY, RECOVERY_MS);
    withinWindow(guest.registeredAt, recorder, "after the recovery");

    const changed = await credentialsChangedSince(page, before);
    expect(changed.access, "the refused credential was not replaced").toBe(true);
    expect(changed.refresh, "the refused means to renew was not replaced").toBe(
      true,
    );

    expect(
      await whoAmI(page),
      "the same guest came back out of a recovery that cannot renew",
    ).not.toBe(whoBefore);

    expect(
      recorder.sawSince(afterSpoil, RENEWAL),
      `no renewal was even attempted. Auth calls seen: ${recorder.paths().join(", ")}`,
    ).toBe(true);
    expect(
      recorder.sawSince(afterSpoil, EXPIRY),
      `the new guest was not issued through the expiry route. Auth calls seen: ${recorder.paths().join(", ")}`,
    ).toBe(true);

    // A guest has no account to sign in to, so either prompt in front of one is
    // a dead end. Asserted after a positive anchor — the recovery has already
    // finished — with a short explicit timeout, because waiting the default
    // period for something that should never appear would eat the budget.
    await expect(
      prompt.sessionExpired(page),
      "a guest was asked to sign in",
    ).toBeHidden({ timeout: PROMPT_ABSENT_MS });
    await expect(
      prompt.phoneEntry(page),
      "a guest was shown the phone entry",
    ).toBeHidden({ timeout: PROMPT_ABSENT_MS });

    withinWindow(guest.registeredAt, recorder, "after asserting");
  });
});

// ---------------------------------------------------------------------------
// The one-time-code relay
//
// `/api/proxy` attaches a real credential to whatever it forwards. The code
// send must never go through it: it runs only through `sendOtpAction`, which
// counts sends in Redis before the backend is asked. If the proxy forwarded
// `send_otp`, anyone could skip that limit and use this app to text any number.
//
// A unit test (`tests/app/api/proxy/route.test.ts`) checks the rule in the
// route file. This case checks the built app that shoppers actually reach.
//
// **The phone number is not a real one on purpose.** If the block were ever
// broken, the call would reach the backend — and it must not text a stranger.
// ---------------------------------------------------------------------------

/** A number no backend can deliver to. */
const UNDELIVERABLE_PHONE = "000";

/** What the proxy answered, read from inside the page.
 *
 *  From the page and not from Node, so the call carries the same origin and
 *  the same `Sec-Fetch-Site` a shopper's browser sends. */
type RelayAnswer = { status: number; error: string | null };

test.describe("the one-time-code relay", () => {
  test("AUTH-04 the proxy refuses to send a one-time code, however the address is written", async ({
    page,
  }) => {
    // Any page served from the app's own origin. `robots.txt` is the cheapest:
    // the locale rules skip it, so nothing is rendered and no guest is made.
    await page.goto("/robots.txt", { waitUntil: "domcontentloaded" });

    const ask = (form: "post" | "post-escaped" | "get") =>
      page.evaluate(
        async ({ form, phone, market }): Promise<RelayAnswer> => {
          const plain = "/auth/phone/send_otp";
          // `%5F` is `_`. A backend router decodes it, so the proxy must too.
          const escaped = "/auth/phone/send%5Fotp";
          const response =
            form === "get"
              ? await fetch(
                  `/api/proxy?${new URLSearchParams({ s: market, u: plain })}`,
                )
              : await fetch("/api/proxy", {
                  method: "POST",
                  headers: {
                    "content-type": "application/json",
                    "x-proxy-server": market,
                    "x-proxy-url": form === "post" ? plain : escaped,
                    "x-proxy-method": "POST",
                  },
                  body: JSON.stringify({ phone }),
                });
          const body = await response.json().catch(() => null);
          return {
            status: response.status,
            error: typeof body?.error === "string" ? body.error : null,
          };
        },
        { form, phone: UNDELIVERABLE_PHONE, market: toServiceToken("market") },
      );

    await test.step("a POST naming send_otp is refused", async () => {
      const answer = await ask("post");
      expect(
        answer.status,
        `the proxy forwarded a code send instead of refusing it (${answer.status}, "${answer.error}")`,
      ).toBe(403);
      expect(
        answer.error,
        "the 403 did not come from the proxy's own block, so something else refused it",
      ).toBe("Forbidden");
    });

    await test.step("a POST with send_otp percent-escaped is refused", async () => {
      const answer = await ask("post-escaped");
      expect(
        answer.status,
        `the proxy forwarded an escaped code send (send%5Fotp) instead of refusing it (${answer.status}, "${answer.error}")`,
      ).toBe(403);
    });

    await test.step("a GET naming send_otp is refused", async () => {
      // The GET form is read-only, so it could never send a code. It is still
      // checked: it must refuse by the same rule, not by luck.
      const answer = await ask("get");
      expect(
        answer.status,
        `the GET form of the proxy did not refuse a send_otp address (${answer.status}, "${answer.error}")`,
      ).toBe(403);
    });
  });
});
