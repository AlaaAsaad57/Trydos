// Auth branches that staging cannot produce on demand.
//
// The OTP *send* still runs through a real server action against staging, so
// these specs use the configured allow-listed test number. The *verify* call
// (`/api/auth/login`) is faked so we can walk the widget through branches that
// would otherwise need a real phone, a real wrong code, or a real rate limit.
//
// See `tests/e2e/scenarios/index.ts` for the exact responses.

import { expect, test } from "./fixtures";
import { gotoAbout } from "./actions/nav";
import {
  attemptAuth,
  chooseAuthIntent,
  currentAuthScreen,
  enterPhone,
  openLoginWidget,
  selectOtpMethod,
  sendOtpWithRetry,
  submitOtp,
  visibleVerifyError,
} from "./actions/auth";
import { mockBackend, mockBackendSequence } from "./actions/mock";
import { ENDPOINTS, scenarios } from "./scenarios";
import { hasTestAccountPhones } from "./harness/env";

const TEST_PHONE_A = () => process.env.TEST_ACCOUNT_PHONE ?? "";
const TEST_PHONE_B = () => process.env.TEST_ACCOUNT_PHONE_2 ?? "";

/** Spreads sends across both configured test phones so a backend-side
 *  per-number throttle does not starve the suite after the first test. */
const pickPhone = (index: number): string =>
  index % 2 === 0 ? TEST_PHONE_A() : TEST_PHONE_B();

test.describe("scripted authentication", () => {
  test.beforeEach(() => {
    test.skip(
      !hasTestAccountPhones(),
      "TEST_ACCOUNT_PHONE or TEST_ACCOUNT_PHONE_2 is not configured — see tests/e2e/README.md.",
    );
  });

  test("a new phone is taken through signup to the name screen", async ({
    page,
  }) => {
    await gotoAbout(page);
    await mockBackend(page, scenarios.auth.signupNewPhone);

    await attemptAuth(page, {
      intent: "signup",
      phone: pickPhone(0),
      method: "whatsapp",
      otp: "000000",
    });
    const screen = (await currentAuthScreen(page)) ?? "closed";
    expect(screen).toBe("input-name");
  });

  test("an existing account logs in and reaches the success screen", async ({
    page,
  }) => {
    await gotoAbout(page);
    await mockBackend(page, scenarios.auth.existingUser);

    const outcome = await attemptAuth(page, {
      intent: "login",
      phone: pickPhone(1),
      method: "whatsapp",
      otp: "000000",
    });

    expect(outcome.screen).toBe("welcome");
  });

  test("logging in with an unregistered number shows the not-registered screen", async ({
    page,
  }) => {
    await gotoAbout(page);
    await mockBackend(page, scenarios.auth.userNotFound);

    const outcome = await attemptAuth(page, {
      intent: "login",
      phone: pickPhone(2),
      method: "whatsapp",
      otp: "000000",
    });

    expect(outcome.screen).toBe("not-registered");
  });
  test("Signing up with a registered number shows the registered screen", async ({
    page,
  }) => {
    await gotoAbout(page);
    await mockBackend(page, scenarios.auth.existingUser);
     await attemptAuth(page, {
      intent: "signup",
      phone: pickPhone(2),
      method: "whatsapp",
      otp: "000000",
    });
    let screen=(await currentAuthScreen(page))??'closed'
    expect(screen).toBe("registered");
  });
  test("verify errors are surfaced on the PIN screen", async ({ page }) => {
    await gotoAbout(page);
    await mockBackendSequence(page, ENDPOINTS.login, [
      scenarios.auth.wrongOtp[ENDPOINTS.login],
      scenarios.auth.rateLimited[ENDPOINTS.login],
      scenarios.auth.serverError[ENDPOINTS.login],
    ]);

    const phone = pickPhone(3);
    await openLoginWidget(page);
    await chooseAuthIntent(page, { intent: "login" });
    await enterPhone(page, { phone });
    await sendOtpWithRetry(page, { method: "whatsapp", phone });

    // Wrong code.
    await submitOtp(page, { otp: "000000", phone });
    await expect
      .poll(async () => await visibleVerifyError(page), {
        timeout: 10_000,
        message: "wrong-code error did not appear",
      })
      .not.toBeNull();

    // Rate-limited verify.
    await submitOtp(page, { otp: "000000", phone });
    await expect
      .poll(async () => await visibleVerifyError(page), {
        timeout: 10_000,
        message: "rate-limit error did not appear",
      })
      .not.toBeNull();

    // Server error during verify.
    await submitOtp(page, { otp: "000000", phone });
    await expect
      .poll(async () => await visibleVerifyError(page), {
        timeout: 10_000,
        message: "server-error message did not appear",
      })
      .not.toBeNull();
  });
});
