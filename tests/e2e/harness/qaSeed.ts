// The QA seed — build this environment's QA shop, or confirm the one it has.
//
// This is a Playwright **setup project**, not `globalSetup`, and the reason is
// not style. `globalSetup` has no browser, no page and no fixtures, and every
// sign-in helper in this suite takes a `Page`. A seed placed there could not
// sign in at all. A setup project also names itself when it fails; the same
// failure inside `globalSetup` reports every case in the lane as never-run.
//
// ---------------------------------------------------------------------------
// What it builds, and in what order
//
//   sign in as Shopper B
//   -> read the seller permissions            (is this account a seller yet?)
//   -> become a seller                        (vendor request)
//   -> APPROVE THE SELLER in the admin dashboard
//   -> create the boutique                    (slug starts `trydos-qa-`)
//   -> create the location
//   -> create the product
//   -> APPROVE THE BOUTIQUE in the admin dashboard
//   -> activate the product
//   -> activate the boutique
//   -> wait for the search index to catch up
//
// Two admin legs, not one. The order is the owner's, and product-before-
// boutique activation is deliberate.
//
// ---------------------------------------------------------------------------
// Two paths, and only one of them is slow
//
// **Every CI run** takes the short path: the QA shop already exists, so the
// seed signs in, finds it, checks the product is usable, and stops. About 100
// seconds.
//
// **A brand-new environment** takes the long path once: the whole list above,
// including a search index sync the owner measures at 5 to 10 minutes. That run
// is a person running `pnpm test:e2e:live` by hand, not a lane job.
//
// ---------------------------------------------------------------------------
// The rules it works under
//
//  1. **Every write is bound to the mark by slug**, re-read from the backend. A
//     numeric id carries no prefix, so an id alone can never prove the row this
//     seed is about to change is its own.
//  2. **`call()` is the only write path**, and it records the method, the URL
//     and the slug. Never a header and never a body: `NEXT_PUBLIC_MEDIA_API_KEY`
//     is deliberately left unmasked by `redact()`, and this repository is
//     public.
//  3. **It never deletes anything.** Not the shop, not the location, not the
//     product. A run that dies half-way leaves a half-built QA shop, which is
//     recoverable; a run that deletes leaves nothing to look at.
//  4. **A hard deadline**, throwing with the name of the step it was on. Killed
//     by the job timeout instead, the failure names nothing.

import { expect, test } from "@playwright/test";

import { attemptAuth } from "../actions/auth";
import { gotoAbout } from "../actions/nav";
import { approveQaBoutique, approveQaSeller } from "./adminApprove";
import {
  envValue,
  hasQaMode,
  hasQaSeed,
  loadLiveEnv,
  LIVE_ORIGIN,
} from "./env";
import { LANE_ENV_VAR, PROD_SAFE_TAG } from "../laneConfig";
import {
  failQaProduct,
  qaDeadlineMessage,
  qaIndexSyncMessage,
} from "./qaMessages";
import {
  CALL_RECORD_PATH,
  QA_SEED_STATE_PATH,
  type CallRecord,
  type QaSeedState,
} from "./qaSeedState";
import {
  attachQaViewHeader,
  findQaProductInSearch,
} from "../actions/qaProduct";

/** The mark. Kept in step with `services/elastic/qaFilter.ts` by
 *  `tests/harness/qaHarness.test.ts`, which reads both. */
const QA_PREFIX = "trydos-qa-";

/** The names this seed gives the rows it creates. All marked, so anybody
 *  looking at the shop in the admin dashboard can see what they are. */
const QA_SHOP_SLUG = `${QA_PREFIX}e2e`;
const QA_SHOP_NAME = "Trydos QA (automated tests)";
const QA_LOCATION_NAME = "Trydos QA location";
const QA_PRODUCT_NAME = "Trydos QA product";

/** The country every BUY case shops in.
 *
 *  Cash on delivery exists in Syria only, and every other payment method takes
 *  real money or a real card. So the QA product must carry a Syrian price or
 *  the money path cannot run at all. */
const QA_COUNTRY = "sy";

/** A price and a stock the BUY cases can live on.
 *
 *  The stock is high on purpose: `BUY-01` places a real order every run, so a
 *  small number runs out and the whole money path starts failing for a reason
 *  that has nothing to do with the app. */
const QA_PRICE = 1000;
const QA_STOCK = 500;

/** How long the whole seed may take. Throws with the step name when it passes.
 *
 *  1500 s covers the long path: ~1080 s of work, of which up to 600 s is the
 *  index sync, plus room for a slow admin screen. */
const SEED_DEADLINE_MS = 1500 * 1000;

/** The index sync poll. 10 s apart, up to 600 s — the owner measures the sync
 *  at 5 to 10 minutes. */
const SYNC_POLL_MS = 10_000;
const SYNC_CEILING_MS = 600_000;

/** The opaque wire token for the seller-dashboard service.
 *
 *  From `utils/serviceTokens.ts`. Written out rather than imported because this
 *  file runs in Node and that module is part of the app's own graph. The unit
 *  suite is what keeps the two in step — a token that drifted would make every
 *  seed call come back "unknown service", which is a loud failure, not a quiet
 *  one. */
const SERVICE = {
  market: "vv7qsd",
  dashboard: "k2muhz",
} as const;

/** Everything this run did, for the case that asserts the seed touched only its
 *  own data. The paths and the shape live in `qaSeedState.ts`, because
 *  Playwright refuses to let the live spec import a test file -- and this file
 *  IS one. */
const calls: CallRecord[] = [];

/** Call the app's own proxy from inside the page.
 *
 *  **The only write path in this file.** A Node-side seed cannot import
 *  `services/sellerDashboard` — that module reaches `utils/fetchData`, which
 *  pulls in the store and issues a **relative** `/api/proxy` request that only
 *  means something inside a browser. So the browser makes the call, exactly the
 *  way `actions/wishlist.ts` already does.
 *
 *  Records the method and the URL. Never the headers — one of them carries the
 *  session — and never the body. */
const call = async (
  page: import("@playwright/test").Page,
  options: {
    service: string;
    url: string;
    method: string;
    body?: unknown;
    sellerId?: string;
    note?: string;
  },
): Promise<{ ok: boolean; status: number; data: any; message: string }> => {
  calls.push({ method: options.method, url: options.url, note: options.note });

  return await page.evaluate(
    async ({ service, url, method, body, sellerId, country }) => {
      const headers: Record<string, string> = {
        "x-proxy-server": service,
        "x-proxy-url": url,
        "x-proxy-method": method,
        "x-country": country,
        "x-language": "en",
      };
      if (sellerId) headers["x-seller-id"] = sellerId;
      if (body !== undefined) headers["content-type"] = "application/json";

      try {
        const response = await fetch("/api/proxy", {
          method: "POST",
          credentials: "include",
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const text = await response.text();
        let parsed: any = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = null;
        }
        return {
          ok: response.ok && parsed?.success !== false,
          status: response.status,
          data: parsed?.data ?? null,
          message: String(parsed?.message ?? "").slice(0, 300),
        };
      } catch (error) {
        return {
          ok: false,
          status: 0,
          data: null,
          message: String((error as Error)?.message ?? "").slice(0, 300),
        };
      }
    },
    {
      service: options.service,
      url: options.url,
      method: options.method,
      body: options.body,
      sellerId: options.sellerId,
      country: QA_COUNTRY,
    },
  );
};

/** Fail with the step name attached, so the message names where it stopped. */
const refuse = (step: string, said: string): never => {
  throw new Error(`The QA seed failed at "${step}": ${said}`);
};

// ---------------------------------------------------------------------------

test.describe(`QA seed ${PROD_SAFE_TAG}`, () => {
  test(`builds or confirms this environment's QA shop ${PROD_SAFE_TAG}`, async ({
    browser,
  }) => {
    // **The seed sets its own timeout.** A setup test inherits the project's
    // per-case cap -- measured -- which is 120 s here, far below what the long
    // path needs.
    test.setTimeout(SEED_DEADLINE_MS + 60_000);

    loadLiveEnv();

    // **Do nothing unless this is the account lane.**
    //
    // Both lane jobs load this config, and a setup project cannot be excluded
    // by a positional file filter or by `--project` -- `dependencies` pulls it
    // back in. Without this gate the seed would run in both jobs at once and
    // two copies would race to create the same shop.
    //
    // An unset value means "do not seed", so running `playwright test` by hand
    // never writes to a real environment by accident.
    const lane = (process.env[LANE_ENV_VAR] ?? "").trim();
    test.skip(
      lane !== "account",
      `the QA seed runs in the account lane only; this job's lane is "${lane || "unset"}".`,
    );

    test.skip(
      !hasQaSeed(),
      "the QA seed needs Shopper B, the admin login, the media store and QA_VIEW_SECRET — see tests/e2e/README.md.",
    );

    const deadline = Date.now() + SEED_DEADLINE_MS;
    const checkDeadline = (step: string): void => {
      if (Date.now() >= deadline) {
        throw new Error(qaDeadlineMessage(step, SEED_DEADLINE_MS / 1000));
      }
    };

    const context = await browser.newContext({ baseURL: LIVE_ORIGIN });
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);

    let approvedByThisRun = false;

    try {
      // ---------------------------------------------------------------- 1
      await test.step("sign in as Shopper B", async () => {
        await gotoAbout(page, { country: QA_COUNTRY });

        const outcome = await attemptAuth(page, {
          intent: "login",
          phone: envValue("TEST_ACCOUNT_PHONE_2"),
          method: "whatsapp",
          otp: envValue("TEST_ACCOUNT_OTP"),
        });

        // A refused one-time code is a NAMED failure, never a wait inside the
        // deadline. The suite has a code budget; hanging here would spend the
        // whole seed window finding out the backend said no.
        expect(
          outcome.screen,
          `the QA seed could not sign in as Shopper B. The widget ended on the "${outcome.screen}" screen${outcome.error ? `, saying: ${outcome.error}` : ""}. The number and the code are never printed here`,
        ).toMatch(/^(welcome|closed)$/);

        await page.keyboard.press("Escape").catch(() => undefined);
      });
      checkDeadline("sign in as Shopper B");

      // ---------------------------------------------------------------- 2
      let sellerId = "";

      const readSellerId = async (): Promise<string> => {
        const answer = await call(page, {
          service: SERVICE.market,
          url: "/shop/auth/permissions",
          method: "GET",
          note: "is this account a seller yet",
        });
        if (!answer.ok) return "";
        const shops = Array.isArray(answer.data)
          ? answer.data
          : (answer.data?.shops ?? answer.data?.data ?? []);
        const first = Array.isArray(shops) ? shops[0] : null;
        return String(first?.seller_id ?? first?.id ?? "");
      };

      await test.step("is this account already a seller?", async () => {
        sellerId = await readSellerId();
      });
      checkDeadline("is this account already a seller?");

      // ---------------------------------------------------------------- 3
      if (!sellerId) {
        await test.step("become a seller, and have the admin approve it", async () => {
          const requested = await call(page, {
            service: SERVICE.market,
            url: "/shop/vendor-requests",
            method: "POST",
            body: {
              f_name: "Trydos",
              l_name: "QA",
              email: `qa-${Date.now()}@example.com`,
              phone: envValue("TEST_ACCOUNT_PHONE_2"),
              currency_code: "USD",
              country_iso: QA_COUNTRY,
              language_code: "en",
              shop_name: QA_SHOP_NAME,
              shop_address: "Trydos QA, automated tests only",
              location_country_iso: QA_COUNTRY,
              location_name: QA_LOCATION_NAME,
              location_address: "Trydos QA, automated tests only",
              latitude: 33.5138,
              longitude: 36.2765,
              documents: [],
            },
            note: "become a seller",
          });

          // "User already exists" is not a failure here: a run that died after
          // the request but before the approval leaves exactly that.
          if (!requested.ok && !/already exists/i.test(requested.message)) {
            refuse(
              "become a seller",
              `the core backend refused the vendor request with ${requested.status}: ${requested.message}`,
            );
          }

          await approveQaSeller(browser, {
            phone: envValue("TEST_ACCOUNT_PHONE_2"),
            shopName: QA_SHOP_NAME,
            record: calls,
          });
          approvedByThisRun = true;

          sellerId = await readSellerId();
          if (!sellerId) {
            refuse(
              "become a seller",
              "the account still has no seller id after the admin approved the vendor request, so nothing below can be created",
            );
          }
        });
      }
      checkDeadline("become a seller");

      // ---------------------------------------------------------------- 4
      let boutiqueId: string | number = "";
      let shopSlug = "";

      const findQaBoutique = async (): Promise<{
        id: string | number;
        slug: string;
        status: number;
      } | null> => {
        const answer = await call(page, {
          service: SERVICE.dashboard,
          url: "/shop/boutiques",
          method: "GET",
          sellerId,
          note: "find the QA boutique by slug",
        });
        if (!answer.ok) return null;

        const rows = Array.isArray(answer.data)
          ? answer.data
          : (answer.data?.data ?? []);

        // **Bound by slug, not by id.** A numeric id carries no mark, so an id
        // alone could never prove the row belongs to this suite.
        for (const row of rows ?? []) {
          const slug = String(row?.slug ?? row?.custom_data?.[0]?.slug ?? "");
          if (slug.toLowerCase().startsWith(QA_PREFIX)) {
            return {
              id: row?.id ?? row?.boutique_id,
              slug,
              status: Number(row?.status ?? 0),
            };
          }
        }
        return null;
      };

      await test.step("find or create the QA boutique", async () => {
        const existing = await findQaBoutique();

        if (existing) {
          boutiqueId = existing.id;
          shopSlug = existing.slug;
          return;
        }

        const created = await call(page, {
          service: SERVICE.dashboard,
          url: "/shop/boutiques",
          method: "POST",
          sellerId,
          body: {
            boutique_global_data: {
              country_iso: QA_COUNTRY,
              status: 0,
            },
            // `boutique_custom_data` on CREATE, not `custom_data` -- sending
            // the update key here silently drops every translation.
            boutique_custom_data: [
              {
                language_code: "en",
                name: QA_SHOP_NAME,
                slug: QA_SHOP_SLUG,
                description: "Automated test data. Never shown to customers.",
              },
            ],
          },
          note: "create the QA boutique",
        });

        if (!created.ok) {
          refuse(
            "find or create the QA boutique",
            `the seller-dashboard backend refused the boutique with ${created.status}: ${created.message}`,
          );
        }

        const confirmed = await findQaBoutique();
        if (!confirmed) {
          refuse(
            "find or create the QA boutique",
            "the boutique was created but reading it back found no shop whose slug carries the QA mark, so nothing below could be bound to it safely",
          );
        }
        boutiqueId = confirmed!.id;
        shopSlug = confirmed!.slug;
      });
      checkDeadline("find or create the QA boutique");

      // ---------------------------------------------------------------- 5
      let locationId: string | number = "";

      await test.step("find or create the QA location", async () => {
        const list = await call(page, {
          service: SERVICE.dashboard,
          url: "/shop/locations",
          method: "GET",
          sellerId,
          note: "find the QA location",
        });

        const rows = Array.isArray(list.data)
          ? list.data
          : (list.data?.data ?? []);
        const found = (rows ?? []).find(
          (row: any) => String(row?.name ?? "") === QA_LOCATION_NAME,
        );

        if (found) {
          locationId = found.id;
          return;
        }

        const created = await call(page, {
          service: SERVICE.dashboard,
          url: "/shop/locations",
          method: "POST",
          sellerId,
          body: {
            name: QA_LOCATION_NAME,
            address: "Trydos QA, automated tests only",
            country_iso: QA_COUNTRY,
            latitude: 33.5138,
            longitude: 36.2765,
          },
          note: "create the QA location",
        });

        if (!created.ok) {
          refuse(
            "find or create the QA location",
            `the seller-dashboard backend refused the location with ${created.status}: ${created.message}. A location can never be deleted, so this is worth reading before retrying`,
          );
        }
        locationId = created.data?.id ?? created.data?.location_id ?? "";
      });
      checkDeadline("find or create the QA location");

      // ---------------------------------------------------------------- 6
      let productId: string | number = "";
      let productSlug = "";
      let productStatus = 0;
      let productStock = 0;

      const findQaProduct = async (): Promise<{
        id: string | number;
        slug: string;
        status: number;
        stock: number;
      } | null> => {
        const answer = await call(page, {
          service: SERVICE.dashboard,
          url: "/shop/products",
          method: "GET",
          sellerId,
          note: "find the QA product",
        });
        if (!answer.ok) return null;

        const rows = Array.isArray(answer.data)
          ? answer.data
          : (answer.data?.data ?? []);

        for (const row of rows ?? []) {
          const slug = String(row?.slug ?? row?.custom_data?.[0]?.slug ?? "");
          if (slug.toLowerCase().startsWith(QA_PREFIX)) {
            return {
              id: row?.id ?? row?.product_id,
              slug,
              status: Number(row?.status ?? 0),
              stock: Number(row?.quantity ?? row?.stock ?? 0),
            };
          }
        }
        return null;
      };

      await test.step("find or create the QA product", async () => {
        const existing = await findQaProduct();

        if (existing) {
          productId = existing.id;
          productSlug = existing.slug;
          productStatus = existing.status;
          productStock = existing.stock;
          return;
        }

        // The save-time requirements, read from the create form's own lookups
        // rather than guessed. These four are required on BOTH create and
        // update, and they are separate from the ACTIVATION checks further
        // down — approval, an `en` translation, stock, a boutique and synced
        // colour images.
        const lookups = await call(page, {
          service: SERVICE.dashboard,
          url: "/shop/products/lookups",
          method: "GET",
          sellerId,
          note: "read the product form's own lookups",
        });

        if (!lookups.ok) {
          refuse(
            "find or create the QA product",
            `the product form's lookups could not be read (${lookups.status}: ${lookups.message}), so the required fields cannot be filled with values this backend accepts`,
          );
        }

        const firstOption = (key: string): any => {
          const list = lookups.data?.[key];
          return Array.isArray(list) && list.length > 0 ? list[0] : null;
        };

        const brand = firstOption("brands");
        const origin = firstOption("countries");

        if (!brand || !origin) {
          refuse(
            "find or create the QA product",
            `the product form offers no ${!brand ? "brand" : "origin country"}, and the backend requires it on create. This is a fact about the environment, not about the suite`,
          );
        }

        const created = await call(page, {
          service: SERVICE.dashboard,
          url: "/shop/products",
          method: "POST",
          sellerId,
          body: {
            boutique_id: boutiqueId,
            brand_id: brand?.id,
            origin_country_iso: origin?.iso ?? origin?.id,
            count_of_pieces: 1,
            seller_product_id: `qa-${Date.now()}`,
            quantity: QA_STOCK,
            custom_data: [
              {
                language_code: "en",
                name: QA_PRODUCT_NAME,
                slug: `${QA_SHOP_SLUG}-product`,
                details: "Automated test data. Never shown to customers.",
              },
            ],
            country_offer_prices: [
              { country_iso: QA_COUNTRY, offered_price: QA_PRICE },
            ],
            offered_price: QA_PRICE,
          },
          note: "create the QA product",
        });

        if (!created.ok) {
          refuse(
            "find or create the QA product",
            `the seller-dashboard backend refused the product with ${created.status}: ${created.message}`,
          );
        }

        const confirmed = await findQaProduct();
        if (!confirmed) {
          refuse(
            "find or create the QA product",
            "the product was created but reading it back found nothing whose slug carries the QA mark",
          );
        }
        productId = confirmed!.id;
        productSlug = confirmed!.slug;
        productStatus = confirmed!.status;
        productStock = confirmed!.stock;
      });
      checkDeadline("find or create the QA product");

      // ---------------------------------------------------------------- 7
      // The three ways the product can be there and still be no use. Each one
      // fails with its own message, and none of them skips.
      if (!productId) failQaProduct("missing", shopSlug);
      if (productStock <= 0 && productStatus === 1) {
        failQaProduct("out-of-stock", shopSlug);
      }

      // ---------------------------------------------------------------- 8
      const boutiqueIsActive = async (): Promise<boolean> => {
        const found = await findQaBoutique();
        return found?.status === 1;
      };

      if (!(await boutiqueIsActive()) || productStatus !== 1) {
        await test.step("approve the boutique, then activate product and boutique", async () => {
          if (!(await boutiqueIsActive())) {
            await approveQaBoutique(browser, {
              shopSlug,
              shopName: QA_SHOP_NAME,
              record: calls,
            });
            approvedByThisRun = true;
          }

          // **Product first, then the boutique.** The owner's order, and it is
          // the right way round: activating a boutique whose only product is
          // still inactive publishes an empty shop.
          const productOn = await call(page, {
            service: SERVICE.dashboard,
            url: `/shop/products/${productId}/change-status`,
            method: "POST",
            sellerId,
            body: { status: 1 },
            note: "activate the QA product",
          });

          if (!productOn.ok) {
            // A 422 here lists the activation checks the product fails, and
            // that list is the single most useful thing this seed can print.
            refuse(
              "activate the QA product",
              `the backend refused to activate it (${productOn.status}): ${productOn.message}. Activation needs an approved seller, an "en" translation, stock, a boutique, and colour images that have finished syncing`,
            );
          }

          const boutiqueOn = await call(page, {
            service: SERVICE.dashboard,
            url: `/shop/boutiques/${boutiqueId}/change-status`,
            method: "POST",
            sellerId,
            body: { status: 1 },
            note: "activate the QA boutique",
          });

          if (!boutiqueOn.ok) {
            refuse(
              "activate the QA boutique",
              `the backend refused to activate it (${boutiqueOn.status}): ${boutiqueOn.message}`,
            );
          }
        });
      }
      checkDeadline("activate product and boutique");

      // ---------------------------------------------------------------- 9
      await test.step("wait for the search index to catch up", async () => {
        // **Asks for the PRODUCT through search, not for the boutique.**
        //
        // The boutique list is filtered unconditionally -- there is no QA-mode
        // switch on that path -- so a QA boutique can never come back from it,
        // by design. The product search is the path that CAN be switched on,
        // and asking it proves more at once: the catalogue query requires
        // `boutique.status: 1` through a nested join and `seller_status:
        // "approved"`, so the product appearing proves the boutique is indexed
        // AND active AND the seller approved.
        //
        // The QA header goes on the request, or the clause this whole ticket
        // adds would hide the very row the seed is waiting for.
        if (!hasQaMode()) {
          refuse(
            "wait for the search index to catch up",
            "QA_VIEW_SECRET is not set or is under 32 characters, so the app treats QA mode as OFF and would hide the QA product from this poll. That reads as a slow index and is not one",
          );
        }

        // **Not the product page.** Opening the product by address is a direct
        // lookup, which this feature never filters, so it answers 200 from the
        // moment the product exists and proves nothing about the index. The
        // proof has to come from a query that reads the index -- the search.
        const header = await attachQaViewHeader(page, {
          secret: envValue("QA_VIEW_SECRET"),
        });

        const started = Date.now();
        let seen = false;

        while (Date.now() - started < SYNC_CEILING_MS) {
          const found = await findQaProductInSearch(page, {
            term: QA_PRODUCT_NAME,
          }).catch(() => ({ rows: 0, qaRows: 0, addresses: [] as string[] }));

          if (found.qaRows > 0) {
            seen = true;
            break;
          }

          await page.waitForTimeout(SYNC_POLL_MS);
          checkDeadline("wait for the search index to catch up");
        }

        // The header really went out. Without this, a run where the route
        // pattern stopped matching would report "the index never caught up"
        // and send somebody to look at Elasticsearch.
        expect(
          header.stamped(),
          "the QA-mode header was never attached to a single request, so the poll below was asking as an ordinary shopper and could never have seen the QA product whatever the index did",
        ).toBeGreaterThan(0);

        expect(
          seen,
          qaIndexSyncMessage(shopSlug, SYNC_CEILING_MS / 1000),
        ).toBe(true);
      });

      // ---------------------------------------------------------------- 10
      const state: QaSeedState = {
        ranAt: new Date().toISOString(),
        outcome: approvedByThisRun ? "built" : "found",
        sellerId,
        shopSlug,
        boutiqueId,
        locationId,
        productId,
        productSlug,
        approvedByThisRun,
      };

      const { mkdir, writeFile } = await import("node:fs/promises");
      const { dirname } = await import("node:path");
      await mkdir(dirname(QA_SEED_STATE_PATH), { recursive: true });
      await writeFile(QA_SEED_STATE_PATH, JSON.stringify(state, null, 2));
      await writeFile(CALL_RECORD_PATH, JSON.stringify(calls, null, 2));
    } finally {
      await context.close();
    }
  });
});
