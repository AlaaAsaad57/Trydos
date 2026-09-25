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
 *  category list to arrive. */
export const openExcelSection = async (
  page: Page,
  options: { sellerId: string | number },
): Promise<void> => {
  await gotoSellerDashboard(page, { sellerId: options.sellerId, tab: "excel" });
  await expect(
    sellerExcel.category(page),
    "the Excel section never drew its category list — the core backend's /shop/excel/categories did not answer, or refused",
  ).toBeVisible({ timeout: 45_000 });
};

/** The categories offered, as their ids. The empty "Select a category" row is
 *  left out. */
export const excelCategoryIds = async (page: Page): Promise<string[]> =>
  (
    await sellerExcel
      .category(page)
      .locator("option")
      .evaluateAll((options) =>
        options.map((option) => (option as HTMLOptionElement).value),
      )
  ).filter(Boolean);

/** Is Download Template pressable right now? */
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
};

/** Choose one category and press Download Template. */
export const downloadTemplate = async (
  page: Page,
  options: { categoryId: string },
): Promise<TemplateDownload> => {
  await sellerExcel.category(page).selectOption(options.categoryId);
  await expect(
    sellerExcel.download(page),
    "a category was chosen, but Download Template stayed disabled",
  ).toBeEnabled();

  const download = page
    .waitForEvent("download", { timeout: 60_000 })
    .catch(() => null);
  await sellerExcel.download(page).click();

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
  };
};
