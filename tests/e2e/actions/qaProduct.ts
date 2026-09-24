// Reaching the QA product — the two ways that matter, and they are not the same.
//
// This is the whole point of the design, so it is worth saying once here:
//
//   **By address** — `gotoQaProduct()`. A product page is a direct lookup by
//   slug, and this feature never filters a direct lookup. So the page opens for
//   anybody, including a guest, with no QA mode and no header. That is what
//   lets the guest cases add a QA product to a bag instead of a real seller's.
//
//   **By search** — `findQaProductInSearch()`. Searching is *discovery*, and
//   discovery is filtered. The QA product comes back only for a request that
//   proved it is in QA mode. Without the header the same search must find
//   nothing, and that is a test in its own right, not an accident.
//
// Getting these two the wrong way round is the mistake this feature exists to
// prevent, so each function says which one it is.

import { expect, type Page } from "@playwright/test";

import { readQaSeedState } from "../harness/qaSeedState";
import { product, search } from "../selectors";
import { chooseRegionIfAsked, seedLocale } from "./nav";

/** The mark a QA shop's slug starts with. Kept in step with
 *  `services/elastic/qaFilter.ts`; the unit suite owns the app-side copy. */
export const QA_SHOP_SLUG_PREFIX = "trydos-qa-";

/** Open the QA product **by address**.
 *
 *  Works with no QA mode and for a guest, on purpose — see the note at the top.
 *  A failure here means the product is genuinely not there, not that it was
 *  filtered.
 *
 *  Returns the name the page showed, so a caller can assert the bag line is
 *  this product by name as well as by address. */
export const gotoQaProduct = async (
  page: Page,
  options: { country?: string; language?: string; slug?: string } = {},
): Promise<{ name: string; url: string }> => {
  const country = options.country ?? "sy";
  const language = options.language ?? "en";
  // **The slug the seed saw the storefront use** — read from the seed's own
  // record, never guessed.
  //
  // It used to fall back to `trydos-qa-e2e-product`, a slug built from the
  // prefix. That slug exists on no environment: the backend appends the
  // product's id, so the real one is `Trydos-QA-product-289`. On CI run
  // 35496319099 the seed skipped for a missing setting, all four BUY cases
  // opened the guess, and every one of them failed with `ERR_ABORTED` on a
  // product address — which reads as "the QA product is broken" about a product
  // that was never asked for. `readQaSeedState` names the seed instead.
  const slug = options.slug || readQaSeedState().productSlug;

  // Save the country before navigating. The address carries the locale, so the
  // region picker is not drawn -- but the **cart** reads the country cookie,
  // and a bag filled in the wrong country is offered no cash on delivery.
  await seedLocale(page, country);

  await page.goto(`/${country}-${language}/products/${slug}`, {
    waitUntil: "domcontentloaded",
  });

  await chooseRegionIfAsked(page);

  await expect(
    page,
    `opening the QA product by address did not land on a product page. The address asked for was /${country}-${language}/products/${slug}`,
  ).toHaveURL(/\/products\//, { timeout: 45_000 });

  const nameLocator = product.name(page);
  await expect(
    nameLocator,
    `the QA product page opened but showed no product name, so the product "${slug}" is missing from this environment or the shop sent it with no ${language} translation`,
  ).toBeVisible({ timeout: 45_000 });

  return {
    name: (await nameLocator.textContent())?.trim() ?? "",
    url: page.url(),
  };
};

/** Look for the QA product **in search**, and report what came back.
 *
 *  Returns the shop slug of every result row, so a caller can assert two
 *  different things with one call:
 *
 *    * in QA mode  — at least one row belongs to the QA shop;
 *    * without it  — no row does.
 *
 *  Asserting the **row's shop slug** rather than the presence of a name is
 *  deliberate: a suggestion string that merely spells the product name would
 *  satisfy a name check while proving nothing about which shop was searched. */
export const findQaProductInSearch = async (
  page: Page,
  options: { term: string },
): Promise<{ rows: number; qaRows: number; addresses: string[] }> => {
  // There is no `/search` page in this app. Search is the overlay the nav icon
  // opens, and the input renders `disabled` until that icon is clicked — going
  // straight for the input waits for ever on "element is not enabled". This is
  // the same sequence `searchFor` in `actions/nav.ts` uses, and it is here
  // rather than reused because this function reads the result **addresses**,
  // which that one does not return.
  // **Open it only if it is shut.** The overlay covers the icon it was opened
  // from, so pressing that icon a second time lands on the overlay instead and
  // the input never reports enabled. A caller that searches in a loop -- the
  // index poll does, sixty times -- hits that on its second pass, and the
  // failure reads "the search never ran" about a search that ran perfectly the
  // first time.
  const input = search.input(page);

  const alreadyOpen = await input
    .isEnabled()
    .catch(() => false);

  if (!alreadyOpen) {
    const icon = search.icon(page);
    await expect(
      icon,
      "the storefront drew no search control, so nothing here can search",
    ).toBeVisible();
    await icon.click();

    await expect(input).toBeVisible();
    await expect(input).toBeEnabled({ timeout: 30_000 });
  }

  // Cleared first: `fill` replaces, but a term left from the previous pass
  // would otherwise be what the debounce is still working on when the rows are
  // counted.
  await input.fill("");
  await input.fill(options.term);

  // The list is debounced and fetched. A term with nothing behind it never
  // produces a first link, so the wait is tolerated rather than asserted —
  // "no results" is a legitimate answer here and is exactly what one of the
  // callers is checking for.
  const links = search.resultLink(page);
  await links
    .first()
    .waitFor({ state: "visible", timeout: 20_000 })
    .catch(() => undefined);

  const rows = await links.count();

  const addresses: string[] = [];
  for (let index = 0; index < rows; index += 1) {
    addresses.push((await links.nth(index).getAttribute("href")) ?? "");
  }

  // Counted from the product slug, which carries the mark. A suggestion string
  // spelling the product's name would not appear here at all, which is the
  // point: this reads the rows the search actually returned.
  //
  // **Lowercased first.** The backend builds a slug from the name and keeps the
  // capitals -- the real product is `Trydos-QA-product-289` -- and
  // `String.includes` is case-sensitive. Matching the raw address found no QA
  // row in a result list that was carrying one, and the seed then waited out
  // the whole index poll and blamed Elasticsearch.
  const qaRows = addresses.filter((href) =>
    href.toLowerCase().includes(QA_SHOP_SLUG_PREFIX),
  ).length;

  return { rows, qaRows, addresses };
};

// ---------------------------------------------------------------------------
// QA mode — attaching the header, narrowly
// ---------------------------------------------------------------------------

/** The header the app reads. Written out rather than imported from
 *  `utils/server/qaMode.ts`, which calls `next/headers` and cannot be loaded in
 *  a Node test process. */
export const QA_VIEW_HEADER = "x-qa-view";

/** Put the QA-mode header on the requests that need it — and on nothing else.
 *
 *  **Narrow on purpose, twice over.**
 *
 *  First, the pattern. `GetSearchData` is a **Server Action**, so its request is
 *  a POST to the current page address carrying a `next-action` header, not a
 *  call to any API path. Document and RSC navigations need it too. Everything
 *  else — images, fonts, the media store — does not, and a secret has no
 *  business on a request that does not need it. `extraHTTPHeaders` and
 *  `"**\/*"` are both far too wide.
 *
 *  Second, `route.fallback()` rather than `route.continue()`. `continue()` ends
 *  the chain: any other `page.route` a spec registered would stop working, with
 *  no error anywhere. `fallback()` passes the request on.
 *
 *  **Only the `live` and `setup` projects may call this.** The `scripted`
 *  project records traces, and a trace archives every request header — which
 *  would write the secret into a downloadable artifact.
 *
 *  Returns how many requests it actually stamped, so a case can prove the
 *  header was really sent rather than assume it. */
export const attachQaViewHeader = async (
  page: Page,
  options: { secret: string },
): Promise<{ stamped: () => number }> => {
  let stamped = 0;

  await page.route(
    (url) => url.origin === new URL(page.url() || "http://127.0.0.1:3100").origin,
    async (route) => {
      const request = route.request();
      const headers = request.headers();

      const isServerAction =
        request.method() === "POST" && headers["next-action"] !== undefined;
      const isDocumentOrRsc =
        request.resourceType() === "document" ||
        headers["rsc"] !== undefined ||
        headers["next-router-state-tree"] !== undefined;

      if (!isServerAction && !isDocumentOrRsc) {
        await route.fallback();
        return;
      }

      stamped += 1;
      await route.fallback({
        headers: { ...headers, [QA_VIEW_HEADER]: options.secret },
      });
    },
  );

  return { stamped: () => stamped };
};
