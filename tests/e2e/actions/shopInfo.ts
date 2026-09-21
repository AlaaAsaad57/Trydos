// The Shop Info section of the seller dashboard.
//
// ---------------------------------------------------------------------------
// A refused save here is INVISIBLE to a browser test unless it is caught
//
// `ShopInfo.handleSubmit` reports a failure with the browser's own
// `alert(...)`. Playwright dismisses a dialog automatically and lets the page
// carry on, so a save the core backend refused leaves **nothing** on screen for
// a test to find: no banner, no inline error, no changed field. A case that
// only looked at the screen would call that refusal a pass.
//
// So `saveShopInfo` does two things no other section here needs:
//
//   * it listens for the dialog, keeps its text and accepts it, and
//   * it watches the `PUT /shop/info` call itself and judges the **status the
//     backend answered**, which is the same fact `utils/fetchData.ts` judges on.
//
// The proxy passes the backend's status straight through
// (`app/api/proxy/route.ts`), and stamps `x-market-backend` on its own answer,
// so a failure can name which of the two backends refused instead of guessing.
//
// ---------------------------------------------------------------------------
// This file never touches the logo or the banner
//
// Both upload to the media store, and an upload cannot be undone by putting a
// string back. A case that changes the shop's media could not restore what it
// found, so this suite leaves them alone. The text fields can be, and are, put
// back.
//
// ---------------------------------------------------------------------------
// It does not change the shop's NAME either
//
// The QA seed finds its shop by name (`Trydos QA`, and the backend caps that
// field at 10 characters). A case that renamed it and then died would leave the
// next seed unable to find its own shop, and it would build a second one. So
// only `contact` and `address` are ever written, and both are restored.

import { expect, type Dialog, type Page } from "@playwright/test";

import { sellerDashboard, shopInfo } from "../selectors";
import {
  SELLER_SERVICE,
  sellerCall,
  type CallResult,
} from "../harness/sellerDashboard";
import {
  dashboardLocale,
  gotoSellerDashboard,
  openTab,
  refuseIfSessionExpired,
} from "./sellerDashboard";

/** The shop's own record, as `/shop/info` returns it. */
export type BackendShopInfo = {
  name: string;
  contact: string | null;
  address: string | null;
  image: string | null;
  banner: string | null;
};

/** What the form holds right now. */
export type ShopInfoForm = {
  name: string;
  contact: string;
  address: string;
};

/** One call against the shop-info endpoint, through the app's own proxy.
 *
 *  `x-country` comes from the address the run is on: these endpoints read the
 *  country from the **header**, not the query string. */
const call = async (
  page: Page,
  options: {
    sellerId: string | number;
    url: string;
    method: string;
    body?: unknown;
    note?: string;
  },
): Promise<CallResult> =>
  sellerCall(page, {
    service: SELLER_SERVICE.dashboard,
    url: options.url,
    method: options.method,
    body: options.body,
    sellerId: String(options.sellerId),
    country: dashboardLocale(page).country,
    note: options.note,
  });

/** What the backend holds for this shop.
 *
 *  This is the only thing that proves a save landed. A reload proves the app's
 *  own copy changed, which is a different claim and a weaker one. */
export const readShopInfo = async (
  page: Page,
  options: { sellerId: string | number; what: string },
): Promise<BackendShopInfo> => {
  const result = await call(page, {
    sellerId: options.sellerId,
    url: "/shop/info",
    method: "GET",
    note: "read the shop's own record",
  });

  expect(
    result.ok,
    `${options.what}: the core backend refused to return the shop's record (GET /shop/info answered ${result.status}${result.message ? `: ${result.message}` : ""})`,
  ).toBe(true);

  const data = result.data ?? {};
  expect(
    typeof data?.name === "string" && data.name !== "",
    `${options.what}: the core backend answered GET /shop/info with no shop name, so the record it returned is not usable`,
  ).toBe(true);

  return data as BackendShopInfo;
};

/** Open the Shop Info section and wait until the form is filled.
 *
 *  The component draws skeletons in place of the inputs while `GET /shop/info`
 *  is in the air, so the inputs existing at all is the signal that the read
 *  came back. */
export const openShopInfo = async (
  page: Page,
  options: { sellerId: string | number; direct?: boolean },
): Promise<void> => {
  if (options.direct) {
    await gotoSellerDashboard(page, {
      sellerId: options.sellerId,
      tab: "shopInfo",
    });
  } else {
    await openTab(page, "shopInfo");
  }

  // The form and the refusal are waited for together. `ShopInfo` is only
  // mounted at all when the account holds READ_SHOP_INFO, so without this the
  // missing permission looks like a form that never rendered.
  const form = shopInfo.form(page);
  const denied = sellerDashboard.accessDenied(page);

  await expect(
    form.or(denied),
    "the Shop Info section drew neither its form nor a refusal, so nothing rendered in the panel at all",
  ).toBeVisible({ timeout: 45_000 });

  await refuseIfSessionExpired(page, "opening the Shop Info section");

  await expect(
    denied,
    "the Shop Info section refused to draw: this account does not hold READ_SHOP_INFO for this shop",
  ).toBeHidden();

  await expect(
    shopInfo.nameInput(page),
    "the Shop Info form stayed on its loading skeletons, so GET /shop/info never answered",
  ).toBeVisible({ timeout: 45_000 });
};

/** What the three text fields hold right now. */
export const readShopInfoForm = async (page: Page): Promise<ShopInfoForm> => ({
  name: await shopInfo.nameInput(page).inputValue(),
  contact: await shopInfo.contactInput(page).inputValue(),
  address: await shopInfo.addressInput(page).inputValue(),
});

/** Type into the form. An absent field is left exactly as it was. */
export const fillShopInfo = async (
  page: Page,
  values: { name?: string; contact?: string; address?: string },
): Promise<void> => {
  if (values.name !== undefined) {
    await shopInfo.nameInput(page).fill(values.name);
  }
  if (values.contact !== undefined) {
    await shopInfo.contactInput(page).fill(values.contact);
  }
  if (values.address !== undefined) {
    await shopInfo.addressInput(page).fill(values.address);
  }
};

/** What one Save attempt did. */
export type ShopInfoSaveOutcome = {
  /** Did a `PUT /shop/info` leave the browser at all? `false` means the form's
   *  own validation stopped it. */
  requested: boolean;
  /** The status the backend answered the write with, or 0 when none was made. */
  status: number;
  /** Which backend the proxy said answered — `core`, `gateway`, or "" when the
   *  header was absent. */
  backend: string;
  /** The text of the browser dialog the component raises on failure, or "". */
  alerted: string;
  /** The backend's own message for a refusal, or "".
   *
   *  **The alert alone is useless.** `ShopInfo` raises `alert("Failed to
   *  update")` whatever went wrong, so a failure quoting the dialog names no
   *  cause at all. The real sentence is in the answer the proxy passed
   *  through, and it is worth every line it costs: the first run of SD-12
   *  reported "Failed to update" where the backend had said "The image field
   *  must be a string." */
  said: string;
  /** The field names the backend refused, e.g. `image, banner`. Taken from
   *  `detailed_error[].code`. The codes only — never the values beside them,
   *  which carry the shop's own contact number. */
  refusedFields: string;
};

/** Press Save and report what actually happened, without asserting.
 *
 *  Returned rather than asserted so the caller can describe its own step — a
 *  case proving validation blocks a save wants `requested: false`, and a case
 *  proving a save lands wants a 2xx. One helper, two opposite expectations.
 *
 *  `graceMs` is how long it waits for a request that may never come. A
 *  validation case spends that whole time on purpose: the only honest way to
 *  say "nothing was sent" is to wait and see nothing. */
export const attemptShopInfoSave = async (
  page: Page,
  options: { graceMs?: number } = {},
): Promise<ShopInfoSaveOutcome> => {
  const graceMs = options.graceMs ?? 30_000;

  // The failure dialog. Registered BEFORE the click, because Playwright
  // dismisses an unhandled dialog by itself and the text would be gone.
  let alerted = "";
  const onDialog = (dialog: Dialog): void => {
    alerted = dialog.message();
    void dialog.accept();
  };
  page.on("dialog", onDialog);

  const settled = page
    .waitForResponse(
      (response) =>
        response.url().includes("/api/proxy") &&
        response.request().method() === "POST" &&
        (response.request().headers()["x-proxy-url"] ?? "").includes(
          "/shop/info",
        ) &&
        (response.request().headers()["x-proxy-method"] ?? "").toUpperCase() ===
          "PUT",
      { timeout: graceMs },
    )
    .catch(() => null);

  try {
    await shopInfo.saveButton(page).click();
    const response = await settled;

    // Let the dialog arrive. It is raised in the same catch block that follows
    // the refused write, so it lands just after the response does.
    if (response && !response.ok()) {
      await page.waitForTimeout(500);
    }

    // The backend's own sentence, and the fields it named. **Only those two.**
    // The rest of this body echoes the shop's name, contact number and address
    // back, and a failure message is published.
    let said = "";
    let refusedFields = "";
    if (response && !response.ok()) {
      const body = await response.json().catch(() => null);
      said = String(body?.message ?? "").slice(0, 200);
      refusedFields = Array.isArray(body?.detailed_error)
        ? body.detailed_error
            .map((entry: { code?: string }) => entry?.code ?? "")
            .filter((code: string) => code !== "")
            .join(", ")
        : "";
    }

    return {
      requested: response !== null,
      status: response?.status() ?? 0,
      backend: response?.headers()["x-market-backend"] ?? "",
      alerted,
      said,
      refusedFields,
    };
  } finally {
    page.off("dialog", onDialog);
  }
};

/** Press Save and require that the backend took it.
 *
 *  Three separate checks, because three different things can go wrong: the form
 *  never sent the write, the backend refused it, or the component raised its
 *  failure dialog. Each has its own sentence. */
export const saveShopInfo = async (
  page: Page,
  options: { what: string },
): Promise<void> => {
  const outcome = await attemptShopInfoSave(page);

  expect(
    outcome.requested,
    `${options.what}: pressing Save sent no PUT /shop/info at all, so the form's own validation refused it before any backend was asked`,
  ).toBe(true);

  // The backend's status is judged BEFORE the dialog, and the order matters.
  // The dialog says "Failed to update" whatever happened; the status and the
  // backend's own sentence say which thing happened. Reporting the dialog
  // first buries the only useful fact under a generic one.
  expect(
    outcome.status,
    `${options.what}: the ${outcome.backend || "core"} backend refused the shop-info save. ` +
      `PUT /shop/info answered ${outcome.status}` +
      (outcome.said ? `, saying: ${outcome.said}` : "") +
      (outcome.refusedFields
        ? ` — the fields it named were: ${outcome.refusedFields}`
        : ""),
  ).toBeLessThan(300);

  expect(
    outcome.alerted,
    `${options.what}: the backend took the write but the form still raised its failure dialog, so the seller was told the save did not work when it did`,
  ).toBe("");
};

/** The bare filename the backend wants back for a media field.
 *
 *  `PUT /shop/info` rewrites **every** field it is given, media included, so a
 *  restore that sent `image: null` would wipe the shop's logo while putting its
 *  address back. The component sends the last path segment of the stored value
 *  (`normializeImage` in `ShopInfo.tsx`) and this does the same, so a restore
 *  hands the shop exactly the media it already had. */
export const bareMediaName = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const parts = String(value).split("/");
  return parts[parts.length - 1] || null;
};

/** Put the shop's record back to the snapshot the case took before it wrote.
 *
 *  Takes the whole snapshot, not two strings, because the write replaces every
 *  field — see `bareMediaName`. Never throws: a case reporting its own failure
 *  must not have that failure replaced by a tidy-up that also went wrong, so
 *  what happened comes back as a sentence and the spec puts it in the report. */
export const restoreShopInfoQuietly = async (
  page: Page,
  options: { sellerId: string | number; snapshot: BackendShopInfo },
): Promise<string> => {
  try {
    // Is there anything to put back at all? A refused save leaves the record
    // exactly as it was, and reporting "NOT put back" then reads like data
    // loss that never happened. Asked first, so the sentence is true.
    const now = await call(page, {
      sellerId: options.sellerId,
      url: "/shop/info",
      method: "GET",
      note: "tidy up: is the shop's record already as it was?",
    });
    if (
      now.ok &&
      (now.data?.contact ?? "") === (options.snapshot.contact ?? "") &&
      (now.data?.address ?? "") === (options.snapshot.address ?? "")
    ) {
      return "the shop's record was already as this case found it — nothing was written, so nothing needed putting back";
    }

    // The media fields are left out when the shop has none, exactly as
    // `SellerDashboardService.updateShopInfo` does. The backend validates them
    // as strings and refuses the **whole** call with
    // `422 The image field must be a string` for a null, so a restore that sent
    // one would put nothing back and report the wrong reason for it.
    const image = bareMediaName(options.snapshot.image);
    const banner = bareMediaName(options.snapshot.banner);

    const result = await call(page, {
      sellerId: options.sellerId,
      url: "/shop/info",
      method: "PUT",
      body: {
        name: options.snapshot.name,
        contact: options.snapshot.contact ?? "",
        address: options.snapshot.address ?? "",
        ...(image ? { image } : {}),
        ...(banner ? { banner } : {}),
      },
      note: "tidy up: put the shop's own record back",
    });
    return result.ok
      ? "the shop's contact and address were put back"
      : `the shop's contact and address were NOT put back — the restore call answered ${result.status}`;
  } catch (error) {
    return `the shop's contact and address were NOT put back — the restore call threw: ${String((error as Error)?.message ?? "").slice(0, 120)}`;
  }
};
