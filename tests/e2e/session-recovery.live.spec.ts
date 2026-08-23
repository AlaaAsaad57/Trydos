// RECOV-01 — a signed-in shopper survives a credential refused mid-action.
//
// `session.live.spec.ts` proves this for a **guest**. This is the signed-in
// half, and it is a different thing: a guest whose credentials are both refused
// is quietly re-registered as somebody new and carries on shopping, which is
// correct for a guest and would be a disaster for an account. A signed-in
// shopper must come back as the **same** shopper.
//
// ---------------------------------------------------------------------------
// Only the access credential is spoiled, and that is the whole design
//
// `spoilCredentials` takes a name list. Spoiling **both** cannot produce a
// recovery for a verified shopper: the server returns the refusal untouched and
// the app asks them to sign in again (`serverRequests/HandleAuthedFetch.ts`).
// A case written that way would burn a real sign-in and a real one-time code on
// a guaranteed red, every night, while looking like a product failure. The
// means to renew is left intact — that is what makes this a recovery rather
// than a logout.
//
// ---------------------------------------------------------------------------
// The order of the checks is load-bearing
//
//   spoil → the cart is answered (AC-1) → the credentials rotated (AC-4/AC-5)
//        → the same shopper (AC-2) → no prompt (AC-3)
//
// The rotation poll sits **between** AC-1 and AC-2 on purpose. AC-5 exists to
// stop the identity being read before the exchange has finished; move the poll
// after AC-2 and AC-2 can pass for the wrong reason, which is the silent pass
// this suite keeps having to design against.
//
// The poll compares against the **spoiled** snapshot, never the original. The
// test spoiled the access credential itself, so comparing against the original
// is trivially true — `session.live.spec.ts` records that mistake as having made
// one guest case intermittently red, and, in the other direction, as something
// that would have made an "identity unchanged" case quietly green.
//
// ---------------------------------------------------------------------------
// Nothing is saved, and nothing is handed on
//
// This case signs in for itself and writes **no** `storageState` file. It
// deliberately leaves the account's credentials rotated, and a saved session is
// a snapshot — handing that on is how `profile.live.spec.ts` once had a case
// silently drop to a guest and report the account's own details as missing.
//
// It costs a **third** real one-time code per run. That cannot be avoided by
// reusing another case's session: `AUTH-03` signs the shared session out and
// forgets the saved state, and file order is not something this file can rely
// on.
//
// ---------------------------------------------------------------------------
// Nothing here prints a credential
//
// The credentials are read through `harness/session.ts`, which returns booleans
// and never values. `httpOnly` is asserted as a **boolean** off the cookie jar,
// copying `auth.live.spec.ts` — a cookie record passed to `expect` prints its
// value into a public job log. The sign-in leg is rethrown as a **fresh** error
// carrying only redacted text, because Playwright's reporter prints
// `error.stack`, whose first line is the message the error was built with.

import { expect, test } from "./fixtures";
import {
  attemptAuth,
  currentAuthScreen,
  openCartAndProveBackendAnswered,
  signedInSession,
  whoAmI,
} from "./actions/auth";
import { gotoHome } from "./actions/nav";
import {
  ACCESS_COOKIE,
  credentialsChangedSince,
  snapshotCredentials,
  spoilCredentials,
} from "./harness/session";
import { envValue, hasShopperA } from "./harness/env";
import { redact } from "./harness/redact";
import { nav, prompt } from "./selectors";

/** Every wait this case owns, named so the budget below can be checked. */
const HOME_READY_MS = 45_000;
const ROTATION_MS = 15_000;
const PROMPT_ABSENT_MS = 3_000;

/** How long the whole case may take.
 *
 *  **Anchored on observed wall clock, not on a sum of caps.** `AUTH-01` performs
 *  the same full real sign-in today with no `test.setTimeout()` at all — inside
 *  the 120s project default. Summing the timeout *ceilings* instead gives ~310s
 *  for the sign-in alone (and ~650s if a cooldown fires), because those are what
 *  the app is **allowed** to take, not what it takes. Sizing off them would
 *  reserve a third of the whole 30-minute run budget for one case.
 *
 *  **Measured: 1.2 minutes (~72s) on staging, 2026-08-23** — the whole case, from
 *  the sign-in through the recovery. The first estimate was 240s; this cap is the
 *  observed number roughly doubled, which leaves room for a slow-but-alive
 *  staging without reserving a chunk of the shared run budget for one case.
 *
 *  Write the new number here whenever it is measured again. The CI log expires
 *  and the results file is gitignored, so if it is not in this comment nobody can
 *  redo the check — they would be back to guessing from timeout ceilings.
 *
 *  **Worst case, for reference only:** a one-time-code cooldown makes the send
 *  retry up to five times with a parsed sleep between each, which overruns this
 *  cap deterministically; the worker is then torn down and restarted. Budget
 *  about five minutes for a cooldown night. This is the third real send of a
 *  run, so it is the most likely to draw one — and that is why the cap is not
 *  stretched to cover it: paying for a rare cooldown on every ordinary run costs
 *  more than the restart does. */
const CASE_BUDGET_MS = 150_000;

test.beforeEach(() => {
  test.skip(
    !hasShopperA(),
    "TEST_ACCOUNT_PHONE or TEST_ACCOUNT_OTP is not configured — see tests/e2e/README.md.",
  );
});

test("RECOV-01 a signed-in shopper survives a credential refused mid-action", async ({
  page,
}) => {
  test.setTimeout(CASE_BUDGET_MS);

  await test.step("the shopper signs in for real", async () => {
    await gotoHome(page);

    // Rethrown as a **fresh** error. Mutating this one and rethrowing it would
    // republish the original text through `error.stack`, whose first line is
    // the message the error was built with — and the reporter prints the stack.
    //
    // `redact()` masks the configured phone as an **exact literal**, so a
    // number the widget reformats (spaces, no "+", a local 0-prefix) can still
    // slip through. That is why the fixed sentence comes first and carries the
    // meaning: the mask is a second line of defence, not the proof.
    try {
      await attemptAuth(page, {
        intent: "login",
        phone: envValue("TEST_ACCOUNT_PHONE"),
        method: "whatsapp",
        otp: envValue("TEST_ACCOUNT_OTP"),
      });
    } catch (error) {
      throw new Error(
        `the sign-in leg failed before the recovery could be tested, against the core backend. ${redact(error)}`,
      );
    }

    const screen = (await currentAuthScreen(page)) ?? "closed";
    expect(
      screen,
      `the sign-in ended on the "${screen}" screen, so there is no signed-in session to spoil`,
    ).toMatch(/^(welcome|closed)$/);

    // Leave the widget shut: its phone field and the "sign in again" prompt
    // share one marker, so a widget left open makes AC-3 ambiguous.
    await page.keyboard.press("Escape").catch(() => {});
    await expect(
      prompt.phoneEntry(page),
      "the sign-in widget stayed open, which would make the prompt check below ambiguous",
    ).toBeHidden();
  });

  const before = await signedInSession(page);
  expect(
    before.phoneVerified,
    "the app does not treat this visitor as a signed-in shopper, so this case would be testing a guest",
  ).toBe(true);

  const whoBefore = before.accountId;
  expect(
    whoBefore,
    "the app could not name the signed-in shopper before the credential was spoiled",
  ).not.toBeNull();

  await test.step("the working credential is refused, the means to renew is not", async () => {
    // The home page, because the cart control is not clickable on the static
    // one. That puts this case behind the search backend: if search is down the
    // document comes back blank and nothing below can run. `pnpm e2e:health` is
    // what tells "search is down" apart from "the recovery is broken".
    await gotoHome(page);
    await expect(
      nav.cartButton(page),
      "the home page never rendered its cart control — the SEARCH backend is the usual cause, not the recovery under test. Run `pnpm e2e:health` before reading this as a failure",
    ).toBeVisible({ timeout: HOME_READY_MS });

    // Only the access credential. See the note at the top of this file.
    await spoilCredentials(page, [ACCESS_COOKIE]);
  });

  const spoiled = await snapshotCredentials(page);

  await test.step("AC-1 the action the shopper started still completes", async () => {
    // Reads the backend's own answer. The guest spec's helper proves the
    // credentials rotated, which is AC-4 — using it here would leave AC-1
    // unproven while looking covered.
    await openCartAndProveBackendAnswered(page);
  });

  await test.step("AC-4/AC-5 the credentials really were exchanged", async () => {
    // Booleans only — no cookie value is read in this file.
    await expect
      .poll(
        async () => {
          const changed = await credentialsChangedSince(page, spoiled);
          return changed.access && changed.refresh;
        },
        {
          timeout: ROTATION_MS,
          message:
            "the stored credentials never rotated after the refused request, so the CORE backend's exchange did not complete. Nothing below can be trusted until this passes",
        },
      )
      .toBe(true);
  });

  await test.step("AC-2 it is the same shopper, not a new guest", async () => {
    // Read only after the poll above. A cart answer alone can be produced for a
    // freshly registered guest, so AC-1 without this can go green as somebody
    // else entirely.
    expect(
      await whoAmI(page),
      "the shopper was replaced instead of recovered — the CORE backend answered, but for a different identity",
    ).toBe(whoBefore);

    const after = await signedInSession(page);
    expect(
      after.phoneVerified,
      "the recovery left the visitor as a guest rather than the signed-in shopper they were",
    ).toBe(true);
  });

  await test.step("AC-3 the shopper was never asked to sign in again", async () => {
    // Asserted after a positive anchor — the recovery has already finished — so
    // this is not passing merely because the app has not got there yet.
    await expect(
      prompt.sessionExpired(page),
      "a signed-in shopper was shown the session-expired prompt during a recovery that succeeded",
    ).toBeHidden({ timeout: PROMPT_ABSENT_MS });
    await expect(
      prompt.phoneEntry(page),
      "a signed-in shopper was sent back to the phone-entry screen during a recovery that succeeded",
    ).toBeHidden({ timeout: PROMPT_ABSENT_MS });
  });

  await test.step("AC-4 the replacement credential is still kept from page scripts", async () => {
    // The boolean, never the cookie record — a record passed to `expect` prints
    // its value into a public job log. Copied from `auth.live.spec.ts`.
    const jar = await page.context().cookies();
    const storefront = jar.find((cookie) => cookie.name === ACCESS_COOKIE);
    expect(
      storefront?.httpOnly,
      "the credential the CORE backend issued during the recovery is readable by page scripts",
    ).toBe(true);
  });
});
