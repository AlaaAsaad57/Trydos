// Talking to the seller dashboard from a browser test.
//
// **This module is the seam for seller-dashboard e2e work.** The QA seed was
// the first thing to need it; the tests that add, edit and activate through the
// dashboard tabs are the next, and they should build on these rather than
// writing their own proxy calls. Everything below was learned from the backend
// one refusal at a time, and each rule is recorded where it is applied.
//
// What is here:
//
//   `sellerCall`          one JSON call, with the 401 -> refresh -> retry the
//                         app itself performs
//   `sellerCallMultipart` the same for a `FormData` body, which the product
//                         create and update endpoints require
//   `uploadShopImage`     the ticket + media-store upload, returning the BARE
//                         FILENAME the backend expects
//   `rowsOf`              the list inside an answer, whatever key it uses
//   `SELLER_SERVICE`      the proxy's wire tokens, and the names the refresh
//                         route allow-lists
//
// **Why a browser and not Node.** A Node-side caller cannot import
// `services/sellerDashboard` -- that module reaches `utils/fetchData`, which
// pulls in the store and issues a **relative** `/api/proxy` request that only
// means something inside a page. So the page makes the call, the same way
// `actions/wishlist.ts` already does.
//
// **Nothing here logs a header or a body.** The record each call appends
// carries the method and the URL only: one header is the session, and
// `NEXT_PUBLIC_MEDIA_API_KEY` is deliberately left unmasked by `redact()`.

import { envValue } from "./env";

/** One write a test made, for the case that checks it stayed inside its own
 *  data. Method and URL only -- never a header, never a body. */
export type CallRecord = { method: string; url: string; note?: string };

/** The answer shape every call here returns. */
export type CallResult = {
  ok: boolean;
  status: number;
  data: any;
  message: string;
};

/** The opaque wire token for the seller-dashboard service.
 *
 *  From `utils/serviceTokens.ts`. Written out rather than imported because this
 *  file runs in Node and that module is part of the app's own graph. The unit
 *  suite is what keeps the two in step — a token that drifted would make every
 *  seed call come back "unknown service", which is a loud failure, not a quiet
 *  one. */
export const SELLER_SERVICE = {
  market: "vv7qsd",
  dashboard: "k2muhz",
} as const;

/** The other direction. `/api/auth/refresh` allow-lists the service NAME and
 *  refuses anything else, so the wire token has to be mapped back before the
 *  exchange is asked for. */
const SERVICE_NAMES: Record<string, string> = {
  [SELLER_SERVICE.market]: "market",
  [SELLER_SERVICE.dashboard]: "market-dashboard",
};

/** Call the app's own proxy from inside the page.
 *
 *  **The only write path in this file.** A Node-side seed cannot import
 *  `services/sellerDashboard` — that module reaches `utils/fetchData`, which
 *  pulls in the store and issues a **relative** `/api/proxy` request that only
 *  means something inside a browser. So the browser makes the call, exactly the
 *  way `actions/wishlist.ts` already does.
 *
 *  **It refreshes once on a 401 and retries, because the app does.** Measured
 *  on 2026-09-19: straight after a real sign-in, `/customer/info` and
 *  `/cart/cart_shipping` answered 200 on core while every `/shop/*` call
 *  answered `401 auth-001`. Nothing was wrong with the session — the app's own
 *  `fetchData` treats a market 401 as "exchange the credential and try again"
 *  (`utils/fetchData.ts`, the 401 handler → `/api/auth/refresh`), and this
 *  helper was the only caller in the repository that did not. Without the
 *  retry the seed reports "the core backend refused the vendor request", which
 *  blames a backend that was about to say yes.
 *
 *  Records the method and the URL. Never the headers — one of them carries the
 *  session — and never the body. */
export const sellerCall = async (
  page: import("@playwright/test").Page,
  options: {
    service: string;
    url: string;
    method: string;
    body?: unknown;
    sellerId?: string;
    note?: string;
    /** Shopping country for the `x-country` header. */
    country?: string;
    /** Where to record this call. Method and URL only. */
    record?: CallRecord[];
  },
): Promise<{ ok: boolean; status: number; data: any; message: string }> => {
  options.record?.push({
    method: options.method,
    url: options.url,
    note: options.note,
  });

  const first = await sendThroughProxy(page, options);
  if (first.status !== 401) return first;


  // **One exchange, one retry — never a second sign-in.**
  //
  // A 401 here means the access token is stale, and the refresh token exists
  // to replace it. The app does exactly this (`utils/fetchData.ts`), and so
  // does every other caller in the repository.
  //
  // The earlier version of this call sent `server: "vv7qsd"` -- the proxy's
  // opaque WIRE TOKEN -- where `/api/auth/refresh` expects the SERVICE NAME.
  // The route allow-lists `market | market-dashboard | chat | stories |
  // comments` and answers `{ eligible: false }` to anything else, so every
  // exchange was refused before it began. That is why the 401s looked
  // unrecoverable and why a second sign-in appeared to be the only way out.
  // It never was.
  const refreshed = await page.evaluate(
    async ({ url, server }) => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url, server }),
        });
        const body = await response.json().catch(() => null);
        return Boolean(body?.refreshed);
      } catch {
        return false;
      }
    },
    // The service NAME, mapped back from the wire token.
    { url: options.url, server: SERVICE_NAMES[options.service] ?? "market" },
  );

  if (!refreshed) return first;

  options.record?.push({
    method: options.method,
    url: options.url,
    note: `${options.note ?? ""} (retried after a credential exchange)`.trim(),
  });

  return await sendThroughProxy(page, options);
};

/** The proxy call itself, with no retry. */
const sendThroughProxy = async (
  page: import("@playwright/test").Page,
  options: {
    service: string;
    url: string;
    method: string;
    body?: unknown;
    sellerId?: string;
    note?: string;
    /** Shopping country for the `x-country` header. */
    country?: string;
    /** Where to record this call. Method and URL only. */
    record?: CallRecord[];
  },
): Promise<{ ok: boolean; status: number; data: any; message: string }> => {
  return await page.evaluate(
    async ({ service, url, method, body, sellerId, country }) => {
      const headers: Record<string, string> = {
        "x-proxy-server": service,
        "x-proxy-url": url,
        "x-proxy-method": method,
        "x-country": country,
        "x-language": "en",
        // The app sends this on every proxy call. It only decodes the target
        // URL, but matching the app exactly removes one difference from the
        // list of things a failure could be.
        "x-need-decode": "true",
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
          // **Falls back to the whole body**, because not every endpoint here
          // wraps its answer. `/shop/uploads/presigned-url` returns
          // `{ upload_url, key, expires_in_seconds }` at the top level, and
          // reading `data` alone gave `null` -- which the seed reported as
          // "the backend answered without an address to upload to" when the
          // backend had in fact answered perfectly.
          data: parsed?.data ?? parsed ?? null,
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
      country: options.country ?? "sy",
    },
  );
};

/** Put one image on the media store and return the name the backend wants.
 *
 *  The chain, copied from `SellerDashboardService.uploadShopImage`:
 *
 *    POST /api/ticket            { folder, story, count }  -> a ticket
 *    POST <media>/gated/upload   multipart, x-api-key + X-Upload-Ticket
 *                                                          -> { url }
 *
 *  **The backend is then sent the bare filename, not the URL and not the
 *  folder.** It resolves the folder itself, and sending it produced a doubled
 *  `folder/folder/file` path -- the comment beside `ICON_FOLDER` records that
 *  as something already paid for once.
 *
 *  The API key never reaches the call record: `call()` is not used here, and
 *  the entry pushed below names the folder only. `redact()` deliberately does
 *  NOT mask `NEXT_PUBLIC_MEDIA_API_KEY` -- anything `NEXT_PUBLIC_` is in the
 *  browser bundle already -- so it must not be put anywhere by hand. */
export const uploadShopImage = async (
  page: import("@playwright/test").Page,
  folder: string,
  record?: CallRecord[],
): Promise<string> => {
  // **Read in Node and passed in.** `process.env` does not exist inside a page:
  // Next inlines `NEXT_PUBLIC_*` into the modules it bundles, and this callback
  // is none of them. Reading it there throws "process is not defined", which
  // the catch below would have reported as "the media store refused the
  // upload" -- a message about a request that was never made.
  const uploaded = await page.evaluate(async ({ folderName, base, key }) => {
    const fail = (why: string) => ({ ok: false as const, why, name: "" });

    try {
      const ticketResponse = await fetch("/api/ticket", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ folder: folderName, story: false, count: 1 }),
      });
      const ticketBody = await ticketResponse.json().catch(() => null);
      if (!ticketBody?.success || !ticketBody?.ticket) {
        return fail(
          `the app would not issue an upload ticket (${ticketResponse.status})`,
        );
      }

      const bytes = Uint8Array.from(
        atob(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        ),
        (c) => c.charCodeAt(0),
      );
      const form = new FormData();
      form.append(
        "file",
        new File([bytes], "trydos-qa.png", { type: "image/png" }),
      );
      form.append("folder", folderName);

      const response = await fetch(`${base}/gated/upload`, {
        method: "POST",
        headers: { "x-api-key": key, "X-Upload-Ticket": ticketBody.ticket },
        body: form,
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.url) {
        return fail(`the media store refused the upload (${response.status})`);
      }

      // The bare stored filename -- what the backend expects for `icon` and
      // for a banner's `file_path`.
      const name = String(body.url).split("?")[0].split("/").filter(Boolean).pop() ?? "";
      return { ok: true as const, why: "", name };
    } catch (error) {
      return fail(String((error as Error)?.message ?? "").slice(0, 200));
    }
  }, {
    folderName: folder,
    base: envValue("NEXT_PUBLIC_MEDIA_SERVER_BASE_URL").replace(/\/$/, ""),
    key: envValue("NEXT_PUBLIC_MEDIA_API_KEY"),
  });

  if (!uploaded.ok || !uploaded.name) {
    // Thrown, not returned. Every row this module creates needs an image, and
    // a caller that carried on without one would fail three steps later with a
    // message about the row instead of about the upload.
    throw new Error(
      `${uploaded.why}. The backend requires an icon on a boutique and images on a product, and activation later requires images that have finished syncing`,
    );
  }

  record?.push({
    method: "POST",
    url: `<media store>/gated/upload (${folder})`,
    note: "uploaded a QA image",
  });

  return uploaded.name;
};

/** The list inside a seller-dashboard answer, whatever it is called.
 *
 *  These endpoints do not agree on a key. `/shop/boutiques` answers
 *  `{ boutiques: [...], meta }`, others answer `{ data: [...] }`, and some
 *  answer a bare array. Reading only `data` found nothing in a response that
 *  was perfectly good, and the seed reported "no shop whose slug carries the QA
 *  mark" about a shop it had just created.
 *
 *  So: a bare array wins, then `data`, then the first array-valued key there
 *  is. `meta` can never be mistaken for it -- it is an object. */
export const rowsOf = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.data)) return payload.data;

  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) return value as any[];
  }
  return [];
};

/** Send a multipart form through the proxy.
 *
 *  **The product create endpoint takes `FormData`, not JSON**
 *  (`SellerDashboardService.addProduct` -- "same multipart body as update").
 *  Sending JSON gets `422 Product name is required` no matter what the body
 *  says, because none of the fields are read.
 *
 *  `fetchData` lets the browser set the multipart boundary itself and never
 *  sets `content-type` for a `FormData` body; this does the same. The fields
 *  are built in the page because a `FormData` cannot cross the Node/browser
 *  boundary. */
export const sellerCallMultipart = async (
  page: import("@playwright/test").Page,
  options: {
    service: string;
    url: string;
    sellerId?: string;
    fields: [string, string][];
    note?: string;
    /** Shopping country for the `x-country` header. */
    country?: string;
    /** Where to record this call. Method and URL only. */
    record?: CallRecord[];
  },
): Promise<{ ok: boolean; status: number; data: any; message: string }> => {
  options.record?.push({
    method: "POST",
    url: options.url,
    note: options.note,
  });

  return await page.evaluate(
    async ({ service, url, sellerId, fields, country }) => {
      const form = new FormData();
      for (const [key, value] of fields) form.append(key, value);

      const headers: Record<string, string> = {
        "x-proxy-server": service,
        "x-proxy-url": url,
        "x-proxy-method": "POST",
        "x-country": country,
        "x-language": "en",
        "x-need-decode": "true",
      };
      if (sellerId) headers["x-seller-id"] = sellerId;

      try {
        const response = await fetch("/api/proxy", {
          method: "POST",
          credentials: "include",
          headers,
          body: form,
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
          data: parsed?.data ?? parsed ?? null,
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
      sellerId: options.sellerId,
      fields: options.fields,
      country: options.country ?? "sy",
    },
  );
};
