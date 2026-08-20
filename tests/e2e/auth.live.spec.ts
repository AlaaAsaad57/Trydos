import { expect, test } from "./fixtures";
import { attemptAuth, currentAuthScreen, verifyCookiesSet } from "./actions/auth";
import { gotoAbout } from "./actions/nav";
import { envValue } from "./harness/env";

test("an existing account logs in and reaches the welcome screen", async ({ page }) => {
  await gotoAbout(page);

   await attemptAuth(page, {
    intent: "login",
    phone: envValue("TEST_ACCOUNT_PHONE"),
    method: "whatsapp",
    otp: envValue("TEST_ACCOUNT_OTP"),
  });
  const screen = (await currentAuthScreen(page)) ?? "closed";
  expect(screen).toMatch(/^(welcome|closed)$/);
  await verifyCookiesSet(page);

});