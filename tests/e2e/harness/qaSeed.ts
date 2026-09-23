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

import { attemptAuth, signedInSession } from "../actions/auth";
import { gotoAbout, gotoHome } from "../actions/nav";
import { recordSignInOutcome } from "./session";
import {
  rowsOf,
  SELLER_SERVICE,
  sellerCall,
  sellerCallMultipart,
  uploadShopImage,
  type CallRecord,
} from "./sellerDashboard";
import { approveQaBoutique, approveQaSeller } from "./adminApprove";
import {
  envValue,
  hasAdmin,
  hasMedia,
  hasQaMode,
  hasQaSeed,
  hasShopperB,
  hasShopperBCode,
  loadLiveEnv,
  shopperBOtp,
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
  QA_SELLER_SESSION_PATH,
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
// **Ten characters, not more.** The core backend answered
// `422 The shop name field must not be greater than 10 characters.` on
// "Trydos QA (automated tests)". Still marked, and still the value the admin
// boutique screen is matched on -- that screen draws the NAME, never the slug.
const QA_SHOP_NAME = "Trydos QA";

/** The boutique's name — and, indirectly, **the mark itself**.
 *
 *  The create payload carries **no slug**: the backend derives it from the
 *  name (`components/SellerDashboard/boutiqueEdit/helpers.ts` sends
 *  `boutique_custom_data` with a name and no slug at all). So the mark cannot
 *  be set directly, and the name has to be one that slugifies into it.
 *
 *  "Trydos QA 1" -> "trydos-qa-1", which starts with `trydos-qa-`.
 *  "Trydos QA" would give "trydos-qa" — no trailing hyphen, and the prefix
 *  match would miss it.
 *
 *  Nothing is trusted about that: the seed reads the slug back and refuses to
 *  go on unless it really carries the mark. */
const QA_BOUTIQUE_NAME = "Trydos QA 1";
const QA_LOCATION_NAME = "Trydos QA";
const QA_PRODUCT_NAME = "Trydos QA product";

/** The phone the vendor request carries.
 *
 *  **A dummy number, not Shopper B's own.** The become-a-seller form's phone
 *  field starts empty and is never prefilled from the profile
 *  (`BecomeSellerModal.tsx`), and the backend refuses a number that already
 *  belongs to an account:
 *
 *    POST /shop/vendor-requests -> 422  code:"phone"
 *    "This phone number is already in use."
 *
 *  So this field is the seller record's own contact number, not the identity of
 *  the shopper applying. It is obviously fake on purpose, so anybody reading
 *  the admin list can see the row is test data.
 *
 *  Overridable with `QA_SELLER_PHONE`, because "which number is free" is a fact
 *  about an environment, not about this suite. */
const qaSellerPhone = (): string =>
  envValue("QA_SELLER_PHONE") || "9639111111111";

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

/** The QA seller account's password.
 *
 *  Only ever used once, at create time: the backend requires it, and the
 *  account signs in by one-time code afterwards. Taken from the environment
 *  when somebody wants a known value, and otherwise generated per run so no
 *  password is written into a public repository.
 *
 *  `redact()` masks `QA_SELLER_PASSWORD`, and `call()` never records a body,
 *  so neither form of it can reach a log. */
let generatedPassword = "";

const qaSellerPassword = (): string => {
  const configured = envValue("QA_SELLER_PASSWORD");
  if (configured) return configured;

  if (!generatedPassword) {
    // Long, mixed, and thrown away with the process.
    generatedPassword = `Qa!${Math.random().toString(36).slice(2)}${Date.now().toString(36)}Aa1`;
  }
  return generatedPassword;
};

/** How long the whole seed may take. Throws with the step name when it passes.
 *
 *  1500 s covers the long path: ~1080 s of work, of which up to 600 s is the
 *  index sync, plus room for a slow admin screen. */
const SEED_DEADLINE_MS = 1500 * 1000;

/** The index sync poll. 10 s apart, up to 600 s — the owner measures the sync
 *  at 5 to 10 minutes. */
const SYNC_POLL_MS = 10_000;
const SYNC_CEILING_MS = 600_000;



/** Everything this run did, for the case that asserts the seed touched only its
 *  own data. The paths and the shape live in `qaSeedState.ts`, because
 *  Playwright refuses to let the live spec import a test file -- and this file
 *  IS one. */
const calls: CallRecord[] = [];



/** Upload the one document a vendor request must carry.
 *
 *  `documents: []` is refused -- the backend answered
 *  `422 The documents field is required.` The real form uploads through a
 *  presigned URL and then attaches `{ type, path }`, so that is what this does,
 *  through the browser, exactly as `BecomeSellerModal` does:
 *
 *    POST /shop/uploads/presigned-url  { mime_type }   -> { upload_url, path }
 *    PUT  <upload_url>                 <the bytes>
 *
 *  The file is a 1x1 PNG built here rather than kept as a fixture, and its name
 *  is marked, so a document left on the store by a dead run can be recognised.
 *
 *  The PUT goes **straight to the storage host**, not through `/api/proxy` --
 *  a presigned URL is already the credential and the proxy would strip the
 *  signature. That is one external host this suite talks to that the target
 *  guard does not cover, because the guard checks configured addresses and this
 *  one arrives in a response. */
const uploadQaDocument = async (
  page: import("@playwright/test").Page,
): Promise<{ type: string; path: string }> => {
  const presigned = await sellerCall(page, {
    service: SELLER_SERVICE.market,
    url: "/shop/uploads/presigned-url",
    method: "POST",
    body: { mime_type: "image/png" },
    note: "ask for a place to put the QA document",
                        country: QA_COUNTRY,
                      record: calls,
                    });

  if (!presigned.ok) {
    refuse(
      "become a seller",
      `the backend would not hand out a place to upload the vendor document (${presigned.status}: ${presigned.message}), and the request is refused without one`,
    );
  }

  const uploadUrl =
    presigned.data?.upload_url ?? presigned.data?.url ?? "";
  const path =
    presigned.data?.path ??
    presigned.data?.file_path ??
    presigned.data?.key ??
    String(uploadUrl).split("?")[0];

  if (!uploadUrl) {
    refuse(
      "become a seller",
      "the backend answered the upload request without an address to upload to",
    );
  }

  const uploaded = await page.evaluate(async ({ url }) => {
    // A 1x1 PNG, built in the page so no file has to travel.
    const bytes = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      ),
      (c) => c.charCodeAt(0),
    );
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: new Blob([bytes], { type: "image/png" }),
      });
      return { ok: response.ok, status: response.status };
    } catch (error) {
      return { ok: false, status: 0 };
    }
  }, { url: String(uploadUrl) });

  if (!uploaded.ok) {
    refuse(
      "become a seller",
      `the vendor document could not be uploaded to the storage host (${uploaded.status}). The address is never printed here -- a presigned URL is itself a credential`,
    );
  }

  calls.push({
    method: "PUT",
    url: "<presigned storage address>",
    note: "uploaded the QA vendor document",
  });

  return { type: "passport", path: String(path) };
};




/** Every language the storefront serves.
 *
 *  A boutique cannot be activated until each one carries a name, a description,
 *  a bio, an icon and at least one banner -- the backend answers
 *  `422 Missing Translations` otherwise, and `boutiqueEdit/helpers.ts >
 *  validate()` says why: the storefront renders each translation on its own, so
 *  a half-filled language shows a shopper blanks. */
const QA_LANGUAGES = ["en", "ar", "tr", "ku"] as const;

/** The per-language rows a boutique needs, in every language. */
const qaBoutiqueTranslations = (
  icon: string,
  banner: string,
  existingIds: Record<string, string | number> = {},
): Record<string, unknown>[] =>
  QA_LANGUAGES.map((code) => ({
    ...(existingIds[code] ? { id: existingIds[code] } : {}),
    language_code: code,
    name: QA_BOUTIQUE_NAME,
    description: "Automated test data. Never shown to customers.",
    bio: "Automated test data.",
    icon,
    banners: [{ file_path: banner, sequence: 1 }],
  }));

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

    // **Each missing setting says which one it is.** A single "the QA seed is
    // not configured" sends whoever reads it to check five variables.
    //
    // These are skips, not failures, and that matters twice over: a fresh
    // checkout with no secrets must run green, and the `live` project depends
    // on this one -- a *failing* setup stops every live case in the lane, while
    // a *skipped* one lets the rest of the suite run.
    test.skip(
      !hasShopperB(),
      "TEST_ACCOUNT_PHONE_2 or TEST_ACCOUNT_OTP is not set, so there is no Shopper B to make a seller.",
    );
    test.skip(
      !hasShopperBCode(),
      "TEST_ACCOUNT_OTP_2 is not set. Shopper B needs a one-time code of its " +
        "own: measured against staging on 2026-09-19, the core backend refuses " +
        "TEST_ACCOUNT_OTP for Shopper B with 422 invalid_code on " +
        "/auth/phone/verify_otp_from_guest. Either set TEST_ACCOUNT_OTP_2 to " +
        "the code that account accepts, or have that number allow-listed with " +
        "the shared one. Until then nothing can sign in as Shopper B.",
    );
    test.skip(
      !hasAdmin(),
      "ADMIN_DASHBOARD_BASE_URL, _EMAIL or _PASSWORD is not set, so the seller and the boutique cannot be approved.",
    );
    test.skip(
      !hasMedia(),
      "the media store is not configured, so the product image the activation checks need cannot be uploaded.",
    );
    test.skip(
      !hasQaMode(),
      "QA_VIEW_SECRET is not set or is under 32 characters, so the app treats QA mode as OFF and the seed could never see its own product in the index.",
    );
    test.skip(
      !hasQaSeed(),
      "the QA seed is not fully configured — see tests/e2e/README.md.",
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

        // Attach BEFORE the sign-in starts. This reads the app's own answer --
        // the sign-in route collects each backend's failure under an
        // `endpoint` label and returns them as `is_failed` -- so a failure here
        // can quote what the app said instead of guessing from the screen.
        const signIn = recordSignInOutcome(page);

        const outcome = await attemptAuth(page, {
          intent: "login",
          phone: envValue("TEST_ACCOUNT_PHONE_2"),
          method: "whatsapp",
          // Shopper B's OWN code. `TEST_ACCOUNT_OTP` is Shopper A's, and the
          // core backend refuses it here -- see `shopperBOtp`.
          otp: shopperBOtp(),
        });

        await signIn.waitForOutcome(30_000);

        // **Ask the app whether it is signed in, rather than reading the
        // widget.**
        //
        // Measured on 2026-09-19: the one-time code was ACCEPTED -- the core
        // backend answered 200 on /auth/phone/verify_otp_from_guest -- and the
        // widget still sat on the PIN screen, because the WALLET backend
        // answered a Cloudflare 502 on /auth/phone/login-with-id-token. An
        // earlier version of this step read the screen alone and reported "the
        // core backend refused the code", which was simply untrue and sent the
        // reader to look at the wrong account.
        //
        // A dead wallet must not stop a shopper browsing, and it must not stop
        // this seed either: the seed needs a CORE session to write seller data,
        // and nothing it does touches the wallet. `auth.live.spec.ts` is the
        // case that must stay red for a wallet outage; this one names it and
        // carries on.
        const session = await signedInSession(page);

        if (!session.phoneVerified) {
          const said = signIn.outcome();
          const named =
            said.observed && said.failed.length > 0
              ? `The app named these backends as failed: ${said.failed.join(", ")}.`
              : said.observed
                ? "The app named no failed backend, so the sign-in itself did not complete."
                : "The sign-in answer was never seen, so nothing can be said about which backend refused.";

          throw new Error(
            [
              "the QA seed could not sign in as Shopper B.",
              `The widget ended on the "${outcome.screen}" screen${outcome.error ? `, saying: ${outcome.error}` : ""}.`,
              named,
              "Neither the number nor the code is printed here.",
            ].join(" "),
          );
        }

        // Signed in. Say plainly if a leg did not land -- it is not this seed's
        // problem, but it belongs in the report of the run that saw it.
        const said = signIn.outcome();
        if (said.observed && said.failed.length > 0) {
          test.info().annotations.push({
            type: "warning",
            description: `Shopper B signed in, but these backends did not take the session: ${said.failed.join(", ")}. The seed only needs the core session and carries on. auth.live.spec.ts is the case that judges this.`,
          });
        }

        await page.keyboard.press("Escape").catch(() => undefined);
      });

      checkDeadline("sign in as Shopper B");


      // ---------------------------------------------------------------- 2
      let sellerId = "";

      /** The account's seller id, or "" when this account is genuinely not a
       *  seller yet.
       *
       *  **A call that did not answer is not the same as "not a seller", and
       *  the difference is destructive.** This used to `return ""` on any
       *  refusal, so one lost request sent the seed down the become-a-seller
       *  path for an account that already **is** one. It then applied again,
       *  and the admin screen showed nothing pending to approve — because the
       *  real request had been approved long ago. The seed failed naming the
       *  admin dashboard, which was working perfectly.
       *
       *  Seen twice on 2026-09-21 while the gateway was flapping
       *  (`UND_ERR_CONNECT_TIMEOUT`, then `ENOTFOUND`, then 200 for the same
       *  host). So the question is asked up to three times, and if it is never
       *  answered the seed stops and says so rather than guessing.
       */
      const readSellerId = async (): Promise<string> => {
        let said = "";

        for (let attempt = 1; attempt <= 3; attempt += 1) {
          const answer = await sellerCall(page, {
            service: SELLER_SERVICE.market,
            url: "/shop/auth/permissions",
            method: "GET",
            note: "is this account a seller yet",
            country: QA_COUNTRY,
            record: calls,
          });

          if (answer.ok) {
            const shops = Array.isArray(answer.data)
              ? answer.data
              : (answer.data?.shops ?? answer.data?.data ?? []);
            const first = Array.isArray(shops) ? shops[0] : null;
            return String(first?.seller_id ?? first?.id ?? "");
          }

          said = `the last answer was ${answer.status}`;
          if (attempt < 3) await page.waitForTimeout(2_000);
        }

        throw new Error(
          "the seed could not find out whether this account is already a " +
            "seller: GET /shop/auth/permissions was asked three times and " +
            `never answered (${said}). It refuses to guess, because guessing ` +
            "that the account is not a seller makes it apply a second time " +
            "for an account that already applied, and then blame the admin " +
            "dashboard for having nothing pending to approve.",
        );
      };

      await test.step("is this account already a seller?", async () => {
        sellerId = await readSellerId();
      });
      checkDeadline("is this account already a seller?");

      // ---------------------------------------------------------------- 3
      if (!sellerId) {
        await test.step("become a seller, and have the admin approve it", async () => {
          // Kept, because the admin screen's own filter form takes an e-mail.
          // Filtering the pending list down to this one address is what makes
          // "the first row" already the right row, before any comparison runs.
          // `example.com` is reserved for exactly this and reaches nobody.
          const qaEmail = `trydos-qa-${Date.now()}@example.com`;

          // **Ask before creating.** The real form reads the existing request
          // on mount; only a shopper who has never applied sees the form.
          //
          // Without this the seed posts a second request and the backend
          // answers `422 This phone number is already in use.` -- which reads
          // like a fault and is simply "you already applied". A seed that
          // cannot be run twice is not a seed.
          const existing = await sellerCall(page, {
            service: SELLER_SERVICE.market,
            url: "/shop/vendor-requests",
            method: "GET",
            note: "has this account already applied to be a seller",
                                       country: QA_COUNTRY,
                             record: calls,
                           });

          const alreadyApplied =
            existing.ok &&
            Boolean(existing.data?.id ?? existing.data?.status ?? existing.data?.phone);

          // **The identity the admin screen is filtered by has to be the one on
          // the row that is actually there.** A request made by an earlier run
          // -- or by a person -- carries its own e-mail, and filtering the
          // pending list by a freshly generated one would find nothing.
          const identityEmail = String(existing.data?.email ?? "") || qaEmail;

          // 1 is approved on this screen (`0 Pending / 1 Approved / 2
          // Rejected`). An already-approved request has nothing to approve, and
          // driving the admin screen for it would look for a row that is no
          // longer pending.
          const alreadyApproved = Number(existing.data?.status ?? 0) === 1;

          if (!alreadyApplied) {
            const document = await uploadQaDocument(page);

            const requested = await sellerCall(page, {
              service: SELLER_SERVICE.market,
              url: "/shop/vendor-requests",
              method: "POST",
              body: {
                f_name: "Trydos",
                l_name: "QA",
                email: qaEmail,
                // The seller record's own contact number -- deliberately NOT
                // Shopper B's, which the backend refuses as already in use.
                phone: qaSellerPhone(),
                currency_code: "USD",
                country_iso: QA_COUNTRY,
                language_code: "en",
                // Required on create -- the backend answered
                // `422 The password field is required.` without them. The seller
                // account signs in by one-time code from then on, so this value
                // is never used again by the suite; it is set from
                // QA_SELLER_PASSWORD when an environment wants a known one.
                password: qaSellerPassword(),
                repeat_password: qaSellerPassword(),
                shop_name: QA_SHOP_NAME,
                // **Everything here is 10 characters or fewer.** The backend caps
                // `f_name`, `l_name`, `shop_name` AND `location_name` at 10, and
                // refuses the whole request one field at a time. The addresses
                // are kept short for the same reason rather than because a limit
                // on them is known.
                shop_address: "Trydos QA",
                location_country_iso: QA_COUNTRY,
                location_name: QA_LOCATION_NAME,
                location_address: "Trydos QA",
                latitude: 33.5138,
                longitude: 36.2765,
                documents: [document],
              },
              note: "become a seller",
                                            country: QA_COUNTRY,
                                record: calls,
                              });

            // "User already exists" is not a failure here: a run that died after
            // the request but before the approval leaves exactly that.
            // "already in use" is the same thing said differently, and it is
            // what this backend answers for a phone that has applied before.
            if (
              !requested.ok &&
              !/already exists|already in use/i.test(requested.message)
            ) {
              refuse(
                "become a seller",
                `the core backend refused the vendor request with ${requested.status}: ${requested.message}`,
              );
            }

          }

          if (!alreadyApproved) {
            await approveQaSeller(browser, {
              email: identityEmail,
              phone: qaSellerPhone(),
              shopName: QA_SHOP_NAME,
              record: calls,
            });
            approvedByThisRun = true;
          }

          // **Approval happens on another system, so read it back and wait.**
          //
          // The admin dashboard is a separate product with its own database
          // write. Reading the seller permissions once, immediately, asks the
          // core backend a question the admin side may not have finished
          // answering -- and a single 204 then reads as "the approval did
          // nothing", which is a much worse message than "it has not landed
          // yet".
          //
          // Two reads, in order, because they fail differently:
          //   1. the vendor request's own status -- did the approval take?
          //   2. the seller permissions -- did it reach this account?
          const deadlineAt = Date.now() + 90_000;
          let lastStatus: unknown = null;

          while (Date.now() < deadlineAt) {
            const seen = await sellerCall(page, {
              service: SELLER_SERVICE.market,
              url: "/shop/vendor-requests",
              method: "GET",
              note: "read the vendor request back after approval",
                                       country: QA_COUNTRY,
                           record: calls,
                         });
            lastStatus = seen.data?.status ?? null;

            sellerId = await readSellerId();
            if (sellerId) break;

            await page.waitForTimeout(5_000);
          }

          if (!sellerId) {
            refuse(
              "become a seller",
              [
                "the admin approved the vendor request, but this account still has no seller id after 90 seconds.",
                `The request's own status now reads "${String(lastStatus ?? "unreadable")}" (0 pending, 1 approved, 2 rejected).`,
                "If that says approved, the shop was created against a DIFFERENT account than the one that applied --",
                "the vendor request carries its own e-mail, password and phone, so the seller it makes may not be this shopper.",
                "If it still says pending, the approval did not take on the admin screen.",
              ].join(" "),
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
        /** The seller's own switch: is the shop live? */
        status: number;
        /** The admin's decision: 0 new, 1 approved, 2 denied. A different
         *  thing from `status`, and confusing the two made the seed drive the
         *  admin screen for a shop that was already approved -- where it found
         *  a real seller's row waiting and, correctly, refused it. */
        requestStatus: number;
      } | null> => {
        const answer = await sellerCall(page, {
          service: SELLER_SERVICE.dashboard,
          url: "/shop/boutiques",
          method: "GET",
          sellerId,
          note: "find the QA boutique by slug",
                                 country: QA_COUNTRY,
                         record: calls,
                       });
        if (!answer.ok) return null;

        const rows = rowsOf(answer.data);

        // **Bound by slug, not by id.** A numeric id carries no mark, so an id
        // alone could never prove the row belongs to this suite.
        for (const row of rows ?? []) {
          const slug = String(row?.slug ?? row?.custom_data?.[0]?.slug ?? "");
          if (slug.toLowerCase().startsWith(QA_PREFIX)) {
            return {
              id: row?.id ?? row?.boutique_id,
              slug,
              status: Number(row?.status ?? 0),
              requestStatus: Number(row?.request_status ?? 0),
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

        // The backend requires an icon, and the app's own validation requires at
        // least one banner per language -- a partly filled translation would
        // show a shopper blanks.
        const boutiqueIcon = await uploadShopImage(page, "boutiques/boutiques/icon", calls);
        const boutiqueBanner = await uploadShopImage(page, "boutiques/boutiques", calls);

        const created = await sellerCall(page, {
          service: SELLER_SERVICE.dashboard,
          url: "/shop/boutiques",
          method: "POST",
          sellerId,
          // The shape the seller dashboard sends, from
          // `boutiqueEdit/helpers.ts > buildPayload`. Two traps are in there:
          // the per-language key is `boutique_custom_data` on CREATE (sending
          // `custom_data`, the update key, silently drops every translation),
          // and `boutique_global_data.name` is required although the form
          // derives it from the default language rather than asking for it.
          body: {
            boutique_global_data: {
              name: QA_BOUTIQUE_NAME,
              icon: boutiqueIcon,
              availability: 3, // web and mobile
              description: "Automated test data. Never shown to customers.",
              bio: "Automated test data.",
              // The RESTRICTED list -- see the product note below. Empty.
              countries_iso: [],
              product_resources: [],
            },
            boutique_custom_data: qaBoutiqueTranslations(
              boutiqueIcon,
              boutiqueBanner,
            ),
          },
          note: "create the QA boutique",
                                  country: QA_COUNTRY,
                          record: calls,
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
        // **Takes a location the shop already has. Never hunts for one by name.**
        //
        // This used to look for a row called "Trydos QA". That worked only while
        // the shop had few locations: `SD-06` creates one on every run, a
        // location can never be deleted, and the list is paginated eleven at a
        // time — so the seed's own row drifts onto page two, then page three,
        // and in a year page ten. A seed that has to find one row in that is a
        // seed that breaks again later.
        //
        // Any location does: the whole shop is this suite's own, marked
        // `trydos-qa-`. So the question is just "is there one to use".
        //
        // **Active ones only**, and that is not a detail. Every leaked row from
        // `SD-06` is left inactive (`status 0`), so the newest rows are all
        // dead ones; asking the backend to filter is what keeps this to a
        // single call on a single page instead of paging in search of a live
        // one. The product hangs off this location, and `QA-06` buys it.
        const active = await sellerCall(page, {
          service: SELLER_SERVICE.dashboard,
          url: "/shop/locations?status=1",
          method: "GET",
          sellerId,
          note: "find an active location to hang the QA product on",
          country: QA_COUNTRY,
          record: calls,
        });

        // A refused read is not "there is no location". Guessing would make the
        // seed create another undeletable row -- the same mistake
        // `readSellerId` used to make, with a permanent consequence.
        if (!active.ok) {
          refuse(
            "find or create the QA location",
            `the seller-dashboard backend would not list the shop's active locations (${active.status}: ${active.message}). The seed will not guess that there is none: guessing means creating another, and a location can never be deleted`,
          );
        }

        const first = rowsOf(active.data)[0];
        if (first) {
          locationId = first.id;
          return;
        }

        // **`country_id`, not `country_iso`.** The backend refuses the iso with
        // `422 The country id field is required`, and the ids are its own --
        // the dashboard form reads them from this same lookup before it offers
        // a country at all.
        const lookups = await sellerCall(page, {
          service: SELLER_SERVICE.dashboard,
          url: "/shop/locations/lookups",
          method: "GET",
          sellerId,
          note: "read the country ids a location can be created in",
          country: QA_COUNTRY,
          record: calls,
        });

        const countries = Array.isArray(lookups.data?.countries)
          ? lookups.data.countries
          : [];
        const country = countries.find(
          (row: any) =>
            String(row?.iso ?? "").toLowerCase() === QA_COUNTRY.toLowerCase(),
        );

        if (!lookups.ok || !country) {
          refuse(
            "find or create the QA location",
            `the seller-dashboard backend does not offer "${QA_COUNTRY}" as a country a location can be created in (the lookup answered ${lookups.status}, and listed ${countries.length} countries). The create needs that country's own id, not its iso`,
          );
        }

        const created = await sellerCall(page, {
          service: SELLER_SERVICE.dashboard,
          url: "/shop/locations",
          method: "POST",
          sellerId,
          body: {
            name: QA_LOCATION_NAME,
            address: "Trydos QA, automated tests only",
            country_id: country.id,
            latitude: 33.5138,
            longitude: 36.2765,
          },
          note: "create the QA location",
          country: QA_COUNTRY,
          record: calls,
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
      /** Set when the product was already there. A product an earlier run left
       *  in the wrong state is repaired rather than left broken -- see the
       *  repair step below. */
      let repairExistingProduct = false;
      let productSlug = "";
      let productStatus = 0;
      let productStock = 0;

      const findQaProduct = async (): Promise<{
        id: string | number;
        slug: string;
        status: number;
        stock: number;
      } | null> => {
        const answer = await sellerCall(page, {
          service: SELLER_SERVICE.dashboard,
          url: "/shop/products",
          method: "GET",
          sellerId,
          note: "find the QA product",
                                 country: QA_COUNTRY,
                         record: calls,
                       });
        if (!answer.ok) return null;

        const rows = rowsOf(answer.data);

        for (const row of rows) {
          const slug = String(row?.slug ?? row?.custom_data?.[0]?.slug ?? "");
          if (slug.toLowerCase().startsWith(QA_PREFIX)) {
            return {
              id: row?.id ?? row?.product_id,
              slug,
              status: Number(row?.status ?? 0),
              // `current_stock` is the name the product carries everywhere in
              // this app (`productEdit/helpers.ts` reads
              // `product.current_stock`). The other two are kept as fallbacks
              // because the list endpoint and the edit endpoint do not always
              // agree, and reading the wrong one reported a stocked product as
              // "active but has no stock" -- a message about a fault that did
              // not exist.
              stock: Number(
                row?.current_stock ?? row?.quantity ?? row?.stock ?? 0,
              ),
            };
          }
        }
        return null;
      };

      /** The product body, built once and used twice.
       *
       *  Create and repair send the SAME fields: an environment where an
       *  earlier run left the product wrong is put right by re-sending this,
       *  and two copies of a hundred keys would drift apart on the first
       *  change. It reads the lookups and uploads the image itself, so either
       *  caller can use it without arranging anything first. */
      const buildQaProductFields = async (): Promise<[string, string][]> => {
      const lookups = await sellerCall(page, {
        service: SELLER_SERVICE.dashboard,
        url: "/shop/products/lookups",
        method: "GET",
        sellerId,
        note: "read the product form's own lookups",
                              country: QA_COUNTRY,
                        record: calls,
                      });

      if (!lookups.ok) {
        refuse(
          "find or create the QA product",
          `the core backend did not give the product form's lookups (GET /shop/products/lookups answered ${lookups.status}: ${lookups.message}), so the required fields cannot be filled with values this backend accepts`,
        );
      }

      const firstOption = (key: string): any => {
        const list = lookups.data?.[key];
        return Array.isArray(list) && list.length > 0 ? list[0] : null;
      };

      // The lookup keys are the ones the answer really carries:
      // `brands` and `parent_categories`. There is no `countries` list --
      // `origin_country_iso` is a plain ISO code, not a chosen option.
      const brand = firstOption("brands");
      const category = firstOption("parent_categories");

      if (!brand) {
        refuse(
          "find or create the QA product",
          "the product form offers no brand, and the backend requires one on create. That is a fact about this environment, not about the suite",
        );
      }
      if (!category) {
        refuse(
          "find or create the QA product",
          "the product form offers no category, and the backend refuses a product without at least one. That is a fact about this environment, not about the suite",
        );
      }

      // The image the product carries. Activation later requires colour
      // images that have finished syncing, so it is uploaded before create
      // rather than bolted on after.
      const productImage = await uploadShopImage(page, "product", calls);

      return [
            ["name", QA_PRODUCT_NAME],
            ["default_language_code", "en"],
            ["unit", "pc"],
        // **Key presence is load-bearing on UPDATE.** The update DTO reads
        // this one without a fallback, so leaving it out answers
        // `422 Undefined array key "barcode"` -- a raw PHP message with no
        // field code, which is exactly what `buildUpdateFormData` warns about
        // for its neighbours. Empty string is the multipart stand-in for null.
        ["barcode", ""],
            ["description", "Automated test data. Never shown to customers."],
            ["brand_id", String(brand?.id ?? "")],
            ["boutique_id", String(boutiqueId)],
            ["seller_product_id", `qa-${Date.now()}`],
            ["label", ""],
            ["model_number", ""],
            ["report_ref_number", ""],
            ["location_id", String(locationId)],
            ["unit_price", String(QA_PRICE)],
            ["discount_price", "0"],
            ["purchase_price", "0"],
            ["luck_price", "0"],
            ["current_stock", String(QA_STOCK)],
            ["max_allowed_qty", "0"],
            ["count_of_pieces", "1"],
            ["shipping_cost", "0"],
            ["shipping_days", "0"],
            ["tax", "0"],
            ["tax_type", "percent"],
            // An explicit boolean: the create DTO rejects a missing key with
            // "must be true or false".
            ["multiplyQTY", "0"],
            ["packed_after_ordering", "off"],
            ["meta_title", QA_PRODUCT_NAME],
            ["meta_description", "Automated test data."],
            ["origin_country_iso", QA_COUNTRY.toUpperCase()],
            ["category_id[]", String(category?.id ?? "")],
            // Required when the unit is `pc`, which it is. The backend names
            // the rule itself: "The weight field is required when unit is pc."
            ["weight", "1"],
            // **`countries_iso` is the RESTRICTED list, not "available in".**
            //
            // This one cost the most to find. Sending `SY` here means "never
            // show this product in Syria" -- and Syria is the only country
            // that offers cash on delivery, so it is the only country the
            // money path can shop in. The catalogue query puts these in
            // `must_not` (`helpers.ts`, "Add country restrictions"), so the
            // product was indexed, active, approved, in stock, and correctly
            // excluded from every search.
            //
            // Proved by asking the index directly on 2026-09-19: the doc
            // passed every base condition and matched the restriction clause.
            // Nothing is sent, so the product is restricted nowhere.
            ["extra_price_for_country", JSON.stringify([])],
            ["images[]", productImage],
            // **Not an empty array.** The backend answers "All product images
            // must be ordered by priority." to one. With no colours, the app
            // sends a single group holding every image with its position --
            // `buildSyncColorImages` in `productEdit/helpers.ts` is the whole
            // of that rule.
            [
              "sync_color_images",
              JSON.stringify([
                { images: [{ image: productImage, position: 0 }], position: 0 },
              ]),
            ],
            // On create the translation rows carry no id -- there is no row
            // yet, and inventing one writes over id = null.
            ["custom_data[0][language_code]", "en"],
            ["custom_data[0][name]", QA_PRODUCT_NAME],
            [
              "custom_data[0][description]",
              "Automated test data. Never shown to customers.",
            ],
        ];
      };

      await test.step("find or create the QA product", async () => {
        const existing = await findQaProduct();

        if (existing) {
          productId = existing.id;
          productSlug = existing.slug;
          productStatus = existing.status;
          productStock = existing.stock;
          repairExistingProduct = true;
          return;
        }

        // The save-time requirements, read from the create form's own lookups
        // rather than guessed. These four are required on BOTH create and
        // update, and they are separate from the ACTIVATION checks further
        // down — approval, an `en` translation, stock, a boutique and synced
        // colour images.

        const created = await sellerCallMultipart(page, {
          service: SELLER_SERVICE.dashboard,
          url: "/shop/products",
          sellerId,
          fields: await buildQaProductFields(),
          note: "create the QA product",
                                  country: QA_COUNTRY,
                          record: calls,
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

      // ---------------------------------------------------------------- 7b
      // **Put an existing product back into the state this seed intends.**
      //
      // A seed that only ever creates is not idempotent -- it is idempotent
      // only on an environment nothing has gone wrong on. This one really did
      // go wrong: an earlier version sent `countries_iso: ["SY"]`, which is the
      // RESTRICTED list, so the product was indexed and active and correctly
      // hidden from every search in the one country the money path can use.
      //
      // Re-sending the same body is the whole repair. It costs one call and it
      // means a half-fixed environment heals itself on the next run instead of
      // needing somebody to go and edit a product by hand.
      if (repairExistingProduct) {
        await test.step("put the existing QA product back in shape", async () => {
          const repaired = await sellerCallMultipart(page, {
            service: SELLER_SERVICE.dashboard,
            url: `/shop/products/${productId}/update`,
            sellerId,
            fields: await buildQaProductFields(),
            note: "repair the QA product's own settings",
                                       country: QA_COUNTRY,
                             record: calls,
                           });

          if (!repaired.ok) {
            refuse(
              "put the existing QA product back in shape",
              `the backend refused the repair (${repaired.status}: ${repaired.message}). The product exists but may still carry settings that hide it -- a country restriction is the one that bit before`,
            );
          }
        });
        checkDeadline("put the existing QA product back in shape");
      }

      // ---------------------------------------------------------------- 8
      const boutiqueIsActive = async (): Promise<boolean> => {
        const found = await findQaBoutique();
        return found?.status === 1;
      };

      // **Always, not only when something is off.**
      //
      // This ran behind `if (the boutique is inactive || the product is
      // inactive)`, which reads sensibly and is wrong: a shop that is already
      // approved and already live skips the whole block -- including the part
      // that puts its settings right. An earlier run left this boutique
      // restricted in Syria, and because the shop was live the repair never
      // ran and the restriction survived every later run.
      //
      // A seed is meant to leave an environment in a known state. Checking
      // whether it looks finished before deciding to make it correct is how it
      // stops doing that.
      {
        await test.step("put the QA boutique's own settings right", async () => {
          // Only when the admin has NOT decided yet. `request_status` is the
          // admin's answer; `status` is the seller's own on/off switch.
          // Confusing the two sent this seed to the admin screen for a shop
          // that was already approved, where it found a real seller's row
          // waiting and -- correctly -- refused to touch it.
          const pendingApproval =
            Number((await findQaBoutique())?.requestStatus ?? 0) === 0;

          if (pendingApproval) {
            await approveQaBoutique(browser, {
              shopSlug,
              shopName: QA_BOUTIQUE_NAME,
              record: calls,
            });
            approvedByThisRun = true;
          }

          // **Fill in every language before activating.**
          //
          // A boutique created by an earlier run -- or by an earlier version of
          // this seed -- may carry `en` only, and the backend answers
          // `422 Missing Translations` to an activation then. The existing rows
          // are read first so each language keeps its own id: a row sent
          // without one targets `id = null` and writes a new row rather than
          // the one it meant.
          const edit = await sellerCall(page, {
            service: SELLER_SERVICE.dashboard,
            url: `/shop/boutiques/${boutiqueId}/edit`,
            method: "GET",
            sellerId,
            note: "read the boutique's existing translations",
                                   country: QA_COUNTRY,
                         record: calls,
                       });

          const existingIds: Record<string, string | number> = {};
          for (const row of rowsOf(edit.data?.boutique ?? edit.data)) {
            const code = String(row?.language_code ?? "");
            if (code && row?.id) existingIds[code] = row.id;
          }

          // **The bare filename, never the stored URL.**
          //
          // The edit answer carries the icon as a full address
          // (`https://media_server.../boutiques/boutiques/icon/<uuid>.png`),
          // and handing that straight back answers
          // `422 The boutique global data.icon field must not be greater than
          // 191 characters.` The backend resolves the folder itself -- the same
          // rule the seller dashboard records beside `ICON_FOLDER`, where
          // sending the folder produced a doubled `folder/folder/file` path.
          const storedIcon = String(edit.data?.boutique?.icon ?? "");
          const topUpIcon =
            (storedIcon.split("?")[0].split("/").filter(Boolean).pop() ?? "") ||
            (await uploadShopImage(page, "boutiques/boutiques/icon", calls));
          const topUpBanner = await uploadShopImage(page, "boutiques/boutiques", calls);

          const filled = await sellerCall(page, {
            service: SELLER_SERVICE.dashboard,
            url: `/shop/boutiques/${boutiqueId}/update`,
            method: "POST",
            sellerId,
            body: {
              boutique_global_data: {
                name: QA_BOUTIQUE_NAME,
                icon: topUpIcon,
                availability: 3,
                description: "Automated test data. Never shown to customers.",
                bio: "Automated test data.",
                // **The RESTRICTED list, not "available in".** See the note
                // on the product below -- this is the same trap, and an
                // earlier run left the QA boutique restricted in exactly the
                // country the money path shops in. Empty means "sell
                // everywhere", which is what a test shop wants.
                countries_iso: [],
                product_resources: [],
              },
              // `custom_data` on UPDATE -- `boutique_custom_data` is the create
              // key, and the two are not interchangeable.
              custom_data: qaBoutiqueTranslations(
                topUpIcon,
                topUpBanner,
                existingIds,
              ),
            },
            note: "fill in every language on the QA boutique",
                                     country: QA_COUNTRY,
                           record: calls,
                         });

          if (!filled.ok) {
            refuse(
              "activate the QA boutique",
              `the boutique could not be given its missing translations (${filled.status}: ${filled.message}). Activation needs a name, description, bio, icon and at least one banner in every one of ${QA_LANGUAGES.join(", ")}`,
            );
          }

        });
        checkDeadline("put the QA boutique's own settings right");

        await test.step("approve and activate", async () => {
          // **Product first, then the boutique.** The owner's order, and it is
          // the right way round: activating a boutique whose only product is
          // still inactive publishes an empty shop.
          const productOn = await sellerCall(page, {
            service: SELLER_SERVICE.dashboard,
            url: `/shop/products/${productId}/change-status`,
            method: "POST",
            sellerId,
            body: { status: 1 },
            note: "activate the QA product",
                                        country: QA_COUNTRY,
                              record: calls,
                            });

          if (!productOn.ok) {
            // A 422 here lists the activation checks the product fails, and
            // that list is the single most useful thing this seed can print.
            refuse(
              "activate the QA product",
              `the backend refused to activate it (${productOn.status}): ${productOn.message}. Activation needs an approved seller, an "en" translation, stock, a boutique, and colour images that have finished syncing`,
            );
          }

          const boutiqueOn = await sellerCall(page, {
            service: SELLER_SERVICE.dashboard,
            url: `/shop/boutiques/${boutiqueId}/change-status`,
            method: "POST",
            sellerId,
            body: { status: 1 },
            note: "activate the QA boutique",
                                         country: QA_COUNTRY,
                               record: calls,
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

        // **The search lives on the home page.** The seed has been on `/about`
        // since it signed in -- that page is used precisely because a search
        // outage cannot blank it -- and `searchIcon_mainPage` is not drawn
        // there. Polling from `/about` found the control missing every time.
        await gotoHome(page);

        // **One word, on purpose.** `GetSearchData` sends any multi-word term
        // to the text analyser first, and that service answers 403 on this
        // environment. The app swallows it and carries on, but a single word
        // never takes that path at all -- and "Trydos" is enough to find the
        // QA product, which is the only thing here named after it.
        const searchTerm = "Trydos";
        // Filled from the first row the storefront returns -- see below.
        let storefrontSlug = "";

        const started = Date.now();
        let seen = false;
        let lastTrouble = "";
        let lastRows = -1;
        let lastAddresses: string[] = [];

        while (Date.now() - started < SYNC_CEILING_MS) {
          // **The reason is kept, not swallowed.** An earlier version caught
          // this and returned zeros, so a search that could never run looked
          // exactly like an index that had not caught up -- for ten minutes,
          // then a message about Elasticsearch.
          const found = await findQaProductInSearch(page, {
            term: searchTerm,
          }).catch((error: unknown) => {
            lastTrouble = String((error as Error)?.message ?? "").slice(0, 200);
            return { rows: 0, qaRows: 0, addresses: [] as string[] };
          });

          lastRows = found.rows;
          lastAddresses = found.addresses;

          if (found.qaRows > 0) {
            // **Take the slug from the row the storefront returned.**
            //
            // The seller dashboard and the storefront do NOT agree: the
            // dashboard calls this product `Trydos-QA-product-289` (its own
            // id) and the storefront calls it `Trydos-QA-product-4895` (the
            // translation row's id). Opening the dashboard's slug by address
            // lands on nothing, which is exactly how `QA-06` failed.
            const hit = found.addresses.find((href) =>
              href.toLowerCase().includes(QA_PREFIX),
            );
            const fromSearch = (hit ?? "").split("?")[0].split("/").pop() ?? "";
            if (fromSearch) storefrontSlug = fromSearch;
            seen = true;
            break;
          }

          await page.waitForTimeout(SYNC_POLL_MS);
          checkDeadline("wait for the search index to catch up");
        }

        // **Say whether the search worked at all.** "No QA row" and "no rows"
        // are different faults with the same appearance, and reporting the
        // first when it was the second sent this run to look at Elasticsearch
        // three times.
        if (!seen) {
          const sample = lastAddresses
            .slice(0, 3)
            .map((href) => href.split("/").pop() ?? "")
            .join(", ");
          lastTrouble = lastTrouble
            ? lastTrouble
            : lastRows === 0
              ? `the search ran and returned NO rows at all for "${searchTerm}", so this says nothing about the QA product -- the search itself is not answering`
              : `the search returned ${lastRows} rows and none belongs to the QA shop. The first few were: ${sample || "(none readable)"}`;
        }

        if (!seen && lastTrouble) {
          refuse(
            "wait for the search index to catch up",
            `the search never ran, so nothing can be said about the index. The last thing that went wrong was: ${lastTrouble}`,
          );
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

        expect(
          storefrontSlug,
          "the search found the QA product but its address carried no slug, so nothing downstream can open the product by address",
        ).not.toBe("");

        // What the live cases must use. The dashboard's own slug opens nothing.
        productSlug = storefrontSlug;
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

      // Hand the QA seller's session on, so no spec downstream signs in again.
      //
      // Written **last**, and only on the path that reached here: a run that
      // failed part-way must not leave a jar that looks usable. Saved rather
      // than re-created because a second sign-in sends a second one-time code
      // for the same account, against limits that are not ours. See
      // `QA_SELLER_SESSION_PATH`.
      await context.storageState({ path: QA_SELLER_SESSION_PATH });
    } finally {
      await context.close();
    }
  });
});
