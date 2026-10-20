// The seller dashboard's Excel section: pick a category, download its template.
//
// Follows the rules in `nav.ts`: `page` first then one options object, an
// action asserts its own success, an action returns what the spec needs, and no
// spec ever sees a raw selector.
//
// Only the template download is driven here. Uploading a filled file would
// create real products in the QA shop, and a product cannot be taken back as
// cleanly as it was made — so the upload stays out of the live suite.

import { readFile } from "node:fs/promises";

import { expect, type Page } from "@playwright/test";

import { sellerExcel } from "../selectors";
import { gotoSellerDashboard } from "./sellerDashboard";

/** Open the dashboard straight into the Excel section, and wait for its
 *  category list to arrive.
 *
 *  The section remembers the last category, box and choice per seller in
 *  localStorage, and the saved session jar keeps localStorage too. So a jar
 *  from an earlier run would open with a category already picked. The key is
 *  removed before the page's own scripts run, so every run starts clean. */
export const openExcelSection = async (
  page: Page,
  options: { sellerId: string | number },
): Promise<void> => {
  await page.addInitScript((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }, `bulk-import:shop:${options.sellerId}`);
  await gotoSellerDashboard(page, { sellerId: options.sellerId, tab: "excel" });
  await expect(
    sellerExcel.category(page),
    "the Excel section never drew its category list — the core backend's /shop/excel/categories did not answer, or refused",
  ).toBeVisible({ timeout: 45_000 });
};

/** Open the category picker, unless it is open already. */
const openCategoryPicker = async (page: Page): Promise<void> => {
  if ((await sellerExcel.category(page).getAttribute("aria-expanded")) !== "true") {
    await sellerExcel.category(page).click();
  }
};

/** The categories offered, as their ids. Opens the picker to read them, and
 *  closes it again. */
export const excelCategoryIds = async (page: Page): Promise<string[]> => {
  await openCategoryPicker(page);
  const ids = (
    await sellerExcel
      .categoryOptions(page)
      .evaluateAll((options) => options.map((option) => option.getAttribute("data-value") ?? ""))
  ).filter(Boolean);
  await page.keyboard.press("Escape");
  return ids;
};

/** Is the download button pressable right now? */
export const downloadOffered = async (page: Page): Promise<boolean> =>
  await sellerExcel.download(page).isEnabled();

/** What one template download came to. */
export type TemplateDownload = {
  /** A file reached the browser's downloads. */
  downloaded: boolean;
  /** The name the app gave the file. */
  filename: string;
  /** The file starts with `PK`, the mark of a zip — which every `.xlsx` is. A
   *  JSON error saved under a spreadsheet name would not. */
  looksLikeXlsx: boolean;
  /** The section's own message when no file came, e.g. the backend's refusal. */
  refusal: string;
  /** The core backend address the download asked the proxy for (its
   *  `x-proxy-url`), e.g. `/shop/excel/downloadExcel/78?mode=template`. Empty
   *  when no such request was seen. */
  proxyUrl: string;
};

/** Choose one category, choose "Add new products", and press the download
 *  button ("Download empty template"). */
export const downloadTemplate = async (
  page: Page,
  options: { categoryId: string },
): Promise<TemplateDownload> => {
  await openCategoryPicker(page);
  await sellerExcel
    .categoryOptions(page)
    .and(page.locator(`[data-value="${options.categoryId}"]`))
    .click();
  await expect(
    sellerExcel.category(page),
    `category ${options.categoryId} was clicked in the picker, but the picker did not take it`,
  ).toHaveAttribute("data-value", options.categoryId);
  await sellerExcel.modeTemplate(page).check();
  await expect(
    sellerExcel.download(page),
    "a category was chosen, but the download button stayed disabled",
  ).toBeEnabled();

  const asked = page
    .waitForRequest(
      (request) =>
        request.url().endsWith("/api/proxy") &&
        (request.headers()["x-proxy-url"] ?? "").includes("/shop/excel/downloadExcel/"),
      { timeout: 60_000 },
    )
    .then((request) => request.headers()["x-proxy-url"] ?? "")
    .catch(() => "");
  const download = page
    .waitForEvent("download", { timeout: 60_000 })
    .catch(() => null);
  await sellerExcel.download(page).click();
  const proxyUrl = await asked;

  // Either a file comes, or the section says why not. Whichever is first.
  const file = await Promise.race([
    download,
    sellerExcel
      .status(page)
      .waitFor({ state: "visible", timeout: 60_000 })
      .then(() => null)
      .catch(() => null),
  ]);

  if (!file) {
    const status = sellerExcel.status(page);
    return {
      downloaded: false,
      filename: "",
      looksLikeXlsx: false,
      refusal:
        (await status.count()) > 0
          ? ((await status.textContent()) ?? "").trim()
          : "no file arrived and the section said nothing within 60 seconds",
      proxyUrl,
    };
  }

  const path = await file.path();
  const head = path
    ? (await readFile(path)).subarray(0, 2).toString("latin1")
    : "";
  return {
    downloaded: true,
    filename: file.suggestedFilename(),
    looksLikeXlsx: head === "PK",
    refusal: "",
    proxyUrl,
  };
};
