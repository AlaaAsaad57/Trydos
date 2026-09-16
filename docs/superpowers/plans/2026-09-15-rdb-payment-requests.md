# RDB Payment Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move RDB payment off the browser — the storefront asks the Trydos core backend to create a payment request, shows a QR code and a short code, polls one endpoint until the payment lands, and handles the cart lock that comes with a pending request.

**Architecture:** One new service module (`services/rdbPayment.ts`) owns the three new core-backend calls. One new screen (`RdbPaymentModal`) replaces `WalletPaymentModal` and drives the whole payment from start to end state. One small change in `utils/fetchData.ts` recognises the cart-lock 409 so it never becomes a toast or a Sentry event, and one new store field (`rdbLock`) carries it to a small sheet with two buttons. The signed merchant call, its HMAC and its keys are deleted.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand 5, TailwindCSS 4, Vitest + @testing-library/react, `qrcode` (already a dependency).

**Spec:** `docs/superpowers/specs/2026-09-15-rdb-payment-requests-design.md`

## Global Constraints

- **Package manager is pnpm.** Unit tests: `pnpm test:run`. Lint: `pnpm lint`. Translation parity: `pnpm lint:i18n-parity`.
- **Every user-visible string is translated.** Add the English key to all three of `public/translations/translations.{ar,tr,ku}.js` **before** any code uses it. `pnpm lint` errors on a key that is missing from a file.
- **Every assertion carries a message** (second argument to `expect`). The message names the step that failed, and names the backend when the step crossed one.
- **See a test red before the fix.** For every change to application behaviour, run the new test against the old code and record that it failed.
- **Amount and currency are strings.** `amount` and `currency` from the backend are rendered exactly as they arrived. Never pass them through `RoundPrice` or `parseFloat`.
- **Open local URLs as `/sy-en/...`**, never `gb-en` — `gb` is not in the region list and the region picker opens over the page.
- **Do not touch protected runtime paths** (`proxy.ts`, `next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts`, `.github/workflows/**`). No task here needs them.
- **The RDB wallet login stays.** `app/api/auth/login/route.ts:38` sends `X-merchant-api-key` for wallet **login**, not merchant checkout. Do not remove it.
- **All three new endpoints go to the core backend with the `MARKET-TOKEN` cookie.** That is exactly what `fetchData({ server: "market" })` does, so every call in this plan uses it and nothing else. `utils/server/tokenManager.ts:180-190` sends a `market` URL to `BACKEND_URL` unless the path is in `GATEWAY_APIS`; none of the three new paths is, so they reach the core backend for verified users and guests alike. `getTokenForServer` (`utils/server/tokenManager.ts:224-229`) attaches `MARKET_TOKEN` for `market`. **Do not add these paths to `GATEWAY_APIS`** — that would send them to the gateway, which does not serve them.
- **Two assumptions, both stated by the backend owner on 2026-09-15:**
  1. `available_payment_method` now contains `"rdb"`. The old string `"trydos_wallet"` is gone.
  2. After `paid`, the orders are loaded with `GET /customer/order/getOrdersByCartGroupID?cart_group_id=<id>` — the same lookup the old wallet screen used.

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `services/rdbPayment.ts` | The three core-backend calls, the request type, and the one reader that recognises a cart-lock answer. No React, no store writes. |
| `components/Cart/RdbPaymentModal.tsx` | The payment screen: start, QR, short code, deep link, countdown, poll, cancel, end states. |
| `components/Cart/RdbPaymentLockedSheet.tsx` | The "you have a payment in progress" sheet with its two buttons. Reads `rdbLock` from the store. |
| `tests/services/rdbPayment.test.ts` | Unit tests for the service. |
| `tests/components/Cart/RdbPaymentModal.test.tsx` | Unit tests for the payment screen. |
| `tests/components/Cart/RdbPaymentLockedSheet.test.tsx` | Unit tests for the lock sheet. |

**Modified**

| File | Change |
|---|---|
| `public/translations/translations.{ar,tr,ku}.js` | 17 new keys, the same in all three. |
| `utils/Requests.ts` | Three new `REQUESTS_DATA` entries. |
| `utils/fetchData.ts` | Recognise the cart-lock 409 and return it without a toast and without a Sentry report. |
| `store/Cart/reducer.ts` | New `rdbLock` field and `setRdbLock` setter. |
| `services/cart.ts` | Four cart writes set `rdbLock` when the cart is locked. |
| `services/home.ts` | `hideOldCart` sets `rdbLock` when the cart is locked. |
| `services/order.ts` | `PlaceOrder` sets `rdbLock` when locked; stops sending `pay_by_wallet`. |
| `components/Cart/PaymentMethod.tsx` | RDB becomes a normal selectable row; the balance gate goes; the method key becomes `"rdb"`. |
| `components/Cart/PlaceOrderButtons.tsx` | Mounts `RdbPaymentModal` instead of `WalletPaymentModal`. |
| `components/Cart/index.tsx` | Mounts `RdbPaymentLockedSheet` once. |
| `utils/orderFunnel.ts` | New RDB events; dead wallet events removed. |
| `docs/posthog-events.md` | The new events written down. |
| `docs/features/B-cart-checkout-orders/CO-13-pay-with-wallet.md` | Rewritten for the new flow. |
| `docs/features/C-payments-wallet-banking/PW-04-pay-order-with-wallet.md` | Rewritten for the new flow. |

**Deleted**

| File / symbol | Why |
|---|---|
| `components/Cart/WalletPaymentModal.tsx` | Replaced by `RdbPaymentModal`. |
| `CheckoutOrder` in `services/wallet/index.ts` (lines 412–487) | The signed merchant call the spec forbids. |
| `CheckoutOrderApi` in `services/wallet/types.ts` (line 239 onward) | Only that call used it. |
| `WALLET_SECRET_KEY` env var | Only that call used it. |

---

## Task 1: Translation keys

Every later task uses these keys. They go in first, in all three files, so `pnpm lint` never sees a key that is missing from a file.

**Files:**
- Modify: `public/translations/translations.ar.js` (end of the object, line 2601)
- Modify: `public/translations/translations.tr.js` (end of the object, line 2633)
- Modify: `public/translations/translations.ku.js` (end of the object, line 2650)

**Interfaces:**
- Consumes: nothing.
- Produces: 17 English keys usable through `translateFunction(key)` — listed below, spelled exactly as written.

- [ ] **Step 1: Add the keys to the Arabic file**

The last entry in each file has **no trailing comma**. Add a comma to it first, then append. In `public/translations/translations.ar.js`, change the last line before `};` from

```js
  "Do You Want Us To Notify You When It Is Available?": "هل تريد أن نعلمك عندما يتوفر؟"
```

to

```js
  "Do You Want Us To Notify You When It Is Available?": "هل تريد أن نعلمك عندما يتوفر؟",
  "Scan this code in the RDB app": "امسح هذا الرمز في تطبيق RDB",
  "Payment code": "رمز الدفع",
  "Open the RDB app": "افتح تطبيق RDB",
  "Cancel payment": "إلغاء الدفع",
  "Waiting for your payment": "بانتظار الدفع",
  "Payment expired": "انتهت مهلة الدفع",
  "Payment cancelled": "تم إلغاء الدفع",
  "Payment failed": "فشل الدفع",
  "Payment received": "تم استلام الدفع",
  "Time left": "الوقت المتبقي",
  "Amount to pay": "المبلغ المطلوب",
  "You have a payment in progress": "لديك عملية دفع جارية",
  "Continue payment": "متابعة الدفع",
  "Your cart is locked until you finish or cancel the payment": "سلتك مقفلة حتى تكمل الدفع أو تلغيه",
  "Could not start the payment. Please try again": "تعذر بدء الدفع. حاول مرة أخرى",
  "Could not cancel the payment. Please try again": "تعذر إلغاء الدفع. حاول مرة أخرى",
  "This payment is already paid": "تم دفع هذه العملية بالفعل"
```

- [ ] **Step 2: Add the same keys to the Turkish file**

In `public/translations/translations.tr.js`, same place, same shape:

```js
  "Do You Want Us To Notify You When It Is Available?": "Ürün tekrar stoklara girdiğinde sizi bilgilendirelim mi?",
  "Scan this code in the RDB app": "Bu kodu RDB uygulamasında taratın",
  "Payment code": "Ödeme kodu",
  "Open the RDB app": "RDB uygulamasını aç",
  "Cancel payment": "Ödemeyi iptal et",
  "Waiting for your payment": "Ödemeniz bekleniyor",
  "Payment expired": "Ödeme süresi doldu",
  "Payment cancelled": "Ödeme iptal edildi",
  "Payment failed": "Ödeme başarısız",
  "Payment received": "Ödeme alındı",
  "Time left": "Kalan süre",
  "Amount to pay": "Ödenecek tutar",
  "You have a payment in progress": "Devam eden bir ödemeniz var",
  "Continue payment": "Ödemeye devam et",
  "Your cart is locked until you finish or cancel the payment": "Ödemeyi tamamlayana veya iptal edene kadar sepetiniz kilitli",
  "Could not start the payment. Please try again": "Ödeme başlatılamadı. Lütfen tekrar deneyin",
  "Could not cancel the payment. Please try again": "Ödeme iptal edilemedi. Lütfen tekrar deneyin",
  "This payment is already paid": "Bu ödeme zaten yapıldı"
```

- [ ] **Step 3: Add the same keys to the Kurdish file**

In `public/translations/translations.ku.js`, same place, same shape:

```js
  "Do You Want Us To Notify You When It Is Available?": "دەتەوێت ئاگادارت بکەینەوە کاتێک بەردەست بوو؟",
  "Scan this code in the RDB app": "ئەم کۆدە لە ئەپی RDB سکان بکە",
  "Payment code": "کۆدی پارەدان",
  "Open the RDB app": "ئەپی RDB بکەرەوە",
  "Cancel payment": "هەڵوەشاندنەوەی پارەدان",
  "Waiting for your payment": "چاوەڕێی پارەدانەکەت دەکەین",
  "Payment expired": "کاتی پارەدان تەواو بوو",
  "Payment cancelled": "پارەدان هەڵوەشێنرایەوە",
  "Payment failed": "پارەدان سەرکەوتوو نەبوو",
  "Payment received": "پارەدان وەرگیرا",
  "Time left": "کاتی ماوە",
  "Amount to pay": "بڕی پارەی پێویست",
  "You have a payment in progress": "پارەدانێکی چالاکت هەیە",
  "Continue payment": "بەردەوامبوون لە پارەدان",
  "Your cart is locked until you finish or cancel the payment": "سەبەتەکەت داخراوە تا پارەدانەکە تەواو یان هەڵدەوەشێنیتەوە",
  "Could not start the payment. Please try again": "نەتوانرا پارەدان دەست پێ بکات. تکایە دووبارە هەوڵ بدەرەوە",
  "Could not cancel the payment. Please try again": "نەتوانرا پارەدان هەڵبوەشێنرێتەوە. تکایە دووبارە هەوڵ بدەرەوە",
  "This payment is already paid": "ئەم پارەدانە پێشتر دراوە"
```

- [ ] **Step 4: Prove the three files are in step**

Run: `pnpm lint:i18n-parity`
Expected: PASS, with no key reported as missing from any of the three files.

- [ ] **Step 5: Commit**

```bash
git add public/translations/translations.ar.js public/translations/translations.tr.js public/translations/translations.ku.js
git commit -m "i18n: add the RDB payment request keys to ar, tr and ku"
```

---

## Task 2: The RDB payment service

**Files:**
- Create: `services/rdbPayment.ts`
- Modify: `utils/Requests.ts` (add three entries; the highest code in use today is 212)
- Test: `tests/services/rdbPayment.test.ts`

**Interfaces:**
- Consumes: `fetchData` from `utils/fetchData`, `REQUESTS_DATA` from `utils/Requests`.
- Produces:
  - `interface RdbPaymentRequest` — 14 fields, `amount` and `currency` are `string`.
  - `type RdbPaymentStatus = "awaiting_payment" | "paid" | "expired" | "cancelled" | "failed"`
  - `type StartRdbPaymentResult` — `{ kind: "created"; request: RdbPaymentRequest } | { kind: "already_pending"; reference: string } | { kind: "refused"; message: string; httpStatus: number }`
  - `type RdbCartLock = { reference: string; expires_at: string | null }`
  - `StartRdbPayment({ addressId, orderNote }: { addressId: number | string; orderNote?: string }): Promise<StartRdbPaymentResult>`
  - `GetRdbRequest(reference: string): Promise<RdbPaymentRequest | null>`
  - `CancelRdbRequest(reference: string): Promise<{ ok: boolean; alreadyPaid: boolean }>`
  - `readRdbLock(response: any): RdbCartLock | null`

- [ ] **Step 1: Add the three request titles**

In `utils/Requests.ts`, next to `PAY_ORDER` (line 70), add:

```ts
  RDB_PAYMENT_START: { reqTitle: "start RDB payment", code: 213 },
  RDB_PAYMENT_STATUS: { reqTitle: "read RDB payment", code: 214 },
  RDB_PAYMENT_CANCEL: { reqTitle: "cancel RDB payment", code: 215 },
```

- [ ] **Step 2: Write the failing test**

Create `tests/services/rdbPayment.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchData } from "utils/fetchData";
import {
  StartRdbPayment,
  GetRdbRequest,
  CancelRdbRequest,
  readRdbLock,
} from "services/rdbPayment";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

const requestBody = {
  request_reference: "ref-1",
  status: "awaiting_payment",
  rdb_request_id: "rdb-1",
  request_code: "REQ8F3K2M1Q",
  short_code: "12345678",
  deep_link: "rdb://pay/REQ8F3K2M1Q",
  qr_payload: "https://pay.rdb.example/r/v1/REQ8F3K2M1Q",
  amount: "100.00",
  currency: "USD",
  expires_at: "2026-09-15T14:30:00+00:00",
  paid_at: null,
  receipt_number: null,
  failure_reason: null,
  order_ids: [],
};

describe("StartRdbPayment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("posts the default address to the core backend and returns the created request", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      httpStatus: 200,
      data: requestBody,
    } as any);

    const result = await StartRdbPayment({ addressId: 77, orderNote: "leave at door" });

    expect(fetchData, "the core backend checkout/rdb call was not made").toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/customer/order/checkout/rdb",
        method: "POST",
        server: "market",
        body: JSON.stringify({ address_id: 77, order_note: "leave at door" }),
      }),
    );
    expect(result.kind, "a 200 from the core backend must read as created").toBe("created");
    expect(
      result.kind === "created" && result.request.short_code,
      "the short code the shopper types into the RDB app was dropped",
    ).toBe("12345678");
  });

  it("never sends pay_by_wallet", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      httpStatus: 200,
      data: requestBody,
    } as any);

    await StartRdbPayment({ addressId: 77 });

    const sentBody = vi.mocked(fetchData).mock.calls[0][0].body as string;
    expect(sentBody, "pay_by_wallet must not be sent with rdb").not.toContain("pay_by_wallet");
  });

  it("reads a 409 as an existing pending request instead of an error", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      httpStatus: 409,
      message: "You already have a pending RDB payment. Complete or cancel it first.",
      data: { rdb_request_reference: "ref-9" },
    } as any);

    const result = await StartRdbPayment({ addressId: 77 });

    expect(result.kind, "a 409 from the core backend means a request is already open").toBe(
      "already_pending",
    );
    expect(
      result.kind === "already_pending" && result.reference,
      "the pending reference must be carried out of the 409",
    ).toBe("ref-9");
  });

  it("reports a 403 from the core backend with the backend's own words", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      httpStatus: 403,
      message: "Cart is not available",
    } as any);

    const result = await StartRdbPayment({ addressId: 77 });

    expect(result.kind, "a 403 from the core backend is a refusal").toBe("refused");
    expect(
      result.kind === "refused" && result.message,
      "the core backend's reason must reach the screen",
    ).toBe("Cart is not available");
  });
});

describe("GetRdbRequest", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the request by reference from the core backend", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      httpStatus: 200,
      data: { ...requestBody, status: "paid", order_ids: [501] },
    } as any);

    const result = await GetRdbRequest("ref-1");

    expect(fetchData, "the status poll did not address the reference").toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/customer/order/rdb-request/ref-1",
        method: "GET",
        server: "market",
      }),
    );
    expect(result?.status, "a paid request must read as paid").toBe("paid");
  });

  it("answers null when the core backend does not know the reference", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      httpStatus: 404,
      message: "Not found",
    } as any);

    const result = await GetRdbRequest("ref-gone");

    expect(result, "an unknown reference must not look like a payment").toBeNull();
  });
});

describe("CancelRdbRequest", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cancels through the core backend", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      httpStatus: 200,
      data: { ...requestBody, status: "cancelled" },
    } as any);

    const result = await CancelRdbRequest("ref-1");

    expect(fetchData, "the cancel call did not address the reference").toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/customer/order/rdb-request/ref-1/cancel",
        method: "POST",
        server: "market",
      }),
    );
    expect(result.ok, "a 200 from the core backend means the request was cancelled").toBe(true);
  });

  it("says the request was already paid when the core backend answers 409", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      httpStatus: 409,
      message: "Already paid",
    } as any);

    const result = await CancelRdbRequest("ref-1");

    expect(result.ok, "a paid request cannot be cancelled").toBe(false);
    expect(
      result.alreadyPaid,
      "the screen must be told the money already landed, not that cancel failed",
    ).toBe(true);
  });
});

describe("readRdbLock", () => {
  it("recognises the cart lock answer", () => {
    const lock = readRdbLock({
      success: false,
      httpStatus: 409,
      data: { rdb_request_reference: "ref-1", expires_at: "2026-09-15T14:30:00+00:00" },
    });

    expect(lock?.reference, "the locked cart must name the pending request").toBe("ref-1");
    expect(lock?.expires_at, "the lock must carry when it lifts").toBe(
      "2026-09-15T14:30:00+00:00",
    );
  });

  it("ignores a 409 that is not a cart lock", () => {
    const lock = readRdbLock({ success: false, httpStatus: 409, message: "Already paid" });

    expect(lock, "only a 409 carrying a pending reference is a cart lock").toBeNull();
  });

  it("ignores an ordinary failure", () => {
    const lock = readRdbLock({ success: false, httpStatus: 500, message: "boom" });

    expect(lock, "a 500 is not a cart lock").toBeNull();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run tests/services/rdbPayment.test.ts`
Expected: FAIL — `Failed to resolve import "services/rdbPayment"`.

- [ ] **Step 4: Write the service**

Create `services/rdbPayment.ts`:

```ts
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";

/** The five states a payment request can be in (design doc §4). */
export type RdbPaymentStatus =
  | "awaiting_payment"
  | "paid"
  | "expired"
  | "cancelled"
  | "failed";

/** One RDB payment request, exactly as `data` arrives from the core backend.
 *  `amount` and `currency` are strings on purpose: the screen shows them as
 *  they arrived and never parses them into a float (design doc §3.1). */
export interface RdbPaymentRequest {
  request_reference: string;
  status: RdbPaymentStatus;
  rdb_request_id: string | null;
  request_code: string | null;
  short_code: string | null;
  deep_link: string | null;
  qr_payload: string | null;
  amount: string;
  currency: string;
  expires_at: string | null;
  paid_at: string | null;
  receipt_number: string | null;
  failure_reason: string | null;
  order_ids: Array<string | number>;
}

/** What a start attempt can answer. `already_pending` is not an error: the
 *  shopper has an open request and the screen should show that one. */
export type StartRdbPaymentResult =
  | { kind: "created"; request: RdbPaymentRequest }
  | { kind: "already_pending"; reference: string }
  | { kind: "refused"; message: string; httpStatus: number };

/** The cart lock the core backend reports while a request is pending. */
export type RdbCartLock = { reference: string; expires_at: string | null };

/**
 * Ask the core backend to create an RDB payment request.
 *
 * `pay_by_wallet` is deliberately not sent. The core backend ignores it and
 * always collects the full amount through RDB (design doc §3).
 */
export async function StartRdbPayment({
  addressId,
  orderNote = "",
}: {
  addressId: number | string;
  orderNote?: string;
}): Promise<StartRdbPaymentResult> {
  const response: any = await fetchData({
    url: "/customer/order/checkout/rdb",
    method: "POST",
    server: "market",
    reqTitle: REQUESTS_DATA.RDB_PAYMENT_START,
    body: JSON.stringify({ address_id: addressId, order_note: orderNote }),
    noMessage: true,
  });

  if (response?.success && response?.data?.request_reference) {
    return { kind: "created", request: response.data as RdbPaymentRequest };
  }

  const pending = response?.data?.rdb_request_reference;
  if (response?.httpStatus === 409 && pending) {
    return { kind: "already_pending", reference: String(pending) };
  }

  return {
    kind: "refused",
    message: response?.message ?? "",
    httpStatus: response?.httpStatus ?? 0,
  };
}

/**
 * Read the current state of one payment request.
 *
 * Answers `null` for anything that is not a readable request — a 404, a 500,
 * a dropped connection. The caller must treat `null` as "ask again", never as
 * an end state, or one lost answer would look like a failed payment.
 */
export async function GetRdbRequest(
  reference: string,
): Promise<RdbPaymentRequest | null> {
  const response: any = await fetchData({
    url: `/customer/order/rdb-request/${encodeURIComponent(reference)}`,
    method: "GET",
    server: "market",
    reqTitle: REQUESTS_DATA.RDB_PAYMENT_STATUS,
    noMessage: true,
  });

  if (response?.success && response?.data?.status) {
    return response.data as RdbPaymentRequest;
  }
  return null;
}

/**
 * Cancel a pending request.
 *
 * `alreadyPaid` separates the one refusal the screen must act on — the core
 * backend answers 409 when the money already landed — from every other
 * failure, where retrying is the right answer (design doc §5).
 */
export async function CancelRdbRequest(
  reference: string,
): Promise<{ ok: boolean; alreadyPaid: boolean }> {
  const response: any = await fetchData({
    url: `/customer/order/rdb-request/${encodeURIComponent(reference)}/cancel`,
    method: "POST",
    server: "market",
    reqTitle: REQUESTS_DATA.RDB_PAYMENT_CANCEL,
    body: "",
    noMessage: true,
  });

  if (response?.success) return { ok: true, alreadyPaid: false };
  return { ok: false, alreadyPaid: response?.httpStatus === 409 };
}

/**
 * Recognise the cart lock in any `fetchData` answer.
 *
 * While a request is pending, every cart write and every checkout answers 409
 * carrying the pending reference (design doc §6). One reader, so every call
 * site agrees on the shape.
 */
export function readRdbLock(response: any): RdbCartLock | null {
  const reference = response?.data?.rdb_request_reference;
  if (response?.httpStatus !== 409 || !reference) return null;
  return {
    reference: String(reference),
    expires_at: response?.data?.expires_at ?? null,
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run tests/services/rdbPayment.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 6: Commit**

```bash
git add services/rdbPayment.ts tests/services/rdbPayment.test.ts utils/Requests.ts
git commit -m "feat(payment): add the RDB payment request service"
```

---

## Task 3: fetchData hands the cart lock back quietly

Today any non-2xx answer throws inside `fetchData`, which shows a toast and files a Sentry event before returning the body (`utils/fetchData.ts:707-712`, then `:775-782` and `:806-826`). A locked cart is normal product behaviour, not a fault. Left alone it would show the backend's raw English sentence to every shopper and fill Sentry with noise.

**Files:**
- Modify: `utils/fetchData.ts` (insert before `if (!res.ok) {` at line 707)
- Test: `tests/utils/fetchData.test.ts` (append a new `describe`)

**Interfaces:**
- Consumes: nothing new.
- Produces: a 409 whose body carries `data.rdb_request_reference` now returns `{ ...body, success: false, httpStatus: 409 }` with **no** toast and **no** `LogError` call. Every other 409 keeps the old behaviour.

- [ ] **Step 1: Write the failing test**

Append to `tests/utils/fetchData.test.ts`:

```ts
describe("the RDB cart lock", () => {
  const lockBody = {
    isSuccessful: false,
    code: 409,
    message:
      "Your cart is locked until the pending RDB payment is completed or cancelled.",
    detailed_error: [{ message: "pending payment" }],
    data: {
      rdb_request_reference: "ref-1",
      expires_at: "2026-09-15T14:30:00+00:00",
    },
  };

  it("hands a locked cart back without a toast and without a Sentry report", async () => {
    const { notifications, toasts, functions } = await setup();
    const net = makeMockFetch([jsonReply(lockBody, 409)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result: any = await fetchData({
      ...baseParams,
      server: "market",
      method: "POST",
      url: "/cart/add",
      body: JSON.stringify({ product_id: 1 }),
      reqTitle: { code: 2, reqTitle: "Add to cart widget" },
    });

    expect(result.httpStatus, "a locked cart must reach the caller as a 409").toBe(409);
    expect(
      result.data.rdb_request_reference,
      "the pending request reference must survive the answer",
    ).toBe("ref-1");
    expect(
      toasts.showErrorMessage,
      "a locked cart must not raise the add-to-cart toast",
    ).not.toHaveBeenCalled();
    expect(
      notifications.showErrorNotification,
      "a locked cart must not raise an error notification",
    ).not.toHaveBeenCalled();
    expect(
      functions.LogError,
      "a locked cart is normal behaviour and must not be reported to Sentry",
    ).not.toHaveBeenCalled();
  });

  it("still reports a 409 that is not a cart lock", async () => {
    const { notifications } = await setup();
    const net = makeMockFetch([
      jsonReply({ isSuccessful: false, code: 409, message: "Already paid" }, 409),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result: any = await fetchData({
      ...baseParams,
      server: "market",
      method: "POST",
      url: "/customer/order/rdb-request/ref-1/cancel",
      body: "",
      reqTitle: { code: 3, reqTitle: "cancel RDB payment" },
    });

    expect(result.httpStatus, "an ordinary 409 must still answer 409").toBe(409);
    expect(
      notifications.showErrorNotification,
      "an ordinary 409 must still tell the shopper something went wrong",
    ).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/utils/fetchData.test.ts -t "the RDB cart lock"`
Expected: FAIL on the first test — `showErrorMessage` and `LogError` were both called, because the current code treats the 409 as an ordinary failure. Record that you saw it red.

- [ ] **Step 3: Write the minimal implementation**

In `utils/fetchData.ts`, insert this block immediately **before** `if (!res.ok) {` (line 707):

```ts
      // The core backend locks the cart while an RDB payment request is
      // pending: every cart write and every checkout answers 409 carrying the
      // pending reference. That is normal product behaviour, not a fault — the
      // cart screen shows its own "you have a payment in progress" sheet with
      // two buttons. So hand the body straight back: no toast, no Sentry event.
      // Any other 409 keeps the ordinary error path below.
      if (status === 409 && responseData?.data?.rdb_request_reference) {
        return { ...responseData, success: false, httpStatus: 409 };
      }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/utils/fetchData.test.ts`
Expected: PASS, the whole file — the two new tests and every test that was already there.

- [ ] **Step 5: Commit**

```bash
git add utils/fetchData.ts tests/utils/fetchData.test.ts
git commit -m "fix(fetch): pass the RDB cart lock through without a toast or a Sentry report"
```

---

## Task 4: The store carries the lock, and the services set it

**Files:**
- Modify: `store/Cart/reducer.ts` (next to `wallet: null`, line 113)
- Modify: `services/cart.ts` (the four writes at lines 34, 102, 148, 174)
- Modify: `services/home.ts` (`hideOldCart`, line 611)
- Modify: `services/order.ts` (`PlaceOrder`, lines 77–86)
- Modify: `utils/orderFunnel.ts` (the two cart-lock events)
- Test: `tests/services/cart.test.ts` (append), `tests/services/orderClass.test.ts` (append)

**Interfaces:**
- Consumes: `readRdbLock` and `RdbCartLock` from `services/rdbPayment` (Task 2).
- Produces:
  - store field `rdbLock: RdbCartLock | null`
  - store setter `setRdbLock(lock: RdbCartLock | null): void`
  - `cartService.AddToCart`, `UpdateCart`, `RemoveFromCart`, `ConvertToOldCart` return `false` and set `rdbLock` when the cart is locked.

- [ ] **Step 1: Write the failing test**

Append to `tests/services/cart.test.ts`, inside the top-level `describe("CartService")`:

```ts
  describe("when an RDB payment request holds the cart", () => {
    const lockAnswer = {
      success: false,
      httpStatus: 409,
      message: "Your cart is locked until the pending RDB payment is completed or cancelled.",
      data: {
        rdb_request_reference: "ref-1",
        expires_at: "2026-09-15T14:30:00+00:00",
      },
    };

    beforeEach(() => {
      useAppStore.setState({ rdbLock: null });
    });

    it("AddToCart records the lock and changes nothing in the cart", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce(lockAnswer as any);

      const success = await cartService.AddToCart({
        product_id: 101,
        color: "Red",
        choice_1: "M",
        qty: 1,
        image: "https://example.com/image.jpg",
        type: "variant-1",
        offer_price: 50,
      });

      expect(success, "a locked cart must refuse the add").toBe(false);
      expect(
        useAppStore.getState().rdbLock?.reference,
        "the core backend's locked-cart answer did not reach the store",
      ).toBe("ref-1");
      expect(
        useAppStore.getState().localCart,
        "a locked cart must not gain a row",
      ).toHaveLength(0);
      expect(
        LogServerError,
        "a locked cart is normal behaviour and must not be logged as an error",
      ).not.toHaveBeenCalled();
    });

    it("UpdateCart records the lock", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce(lockAnswer as any);

      const success = await cartService.UpdateCart({ cart_id: "row-1", qty: 3 });

      expect(success, "a locked cart must refuse the quantity change").toBe(false);
      expect(
        useAppStore.getState().rdbLock?.reference,
        "the core backend's locked-cart answer did not reach the store",
      ).toBe("ref-1");
    });

    it("RemoveFromCart records the lock and keeps the row", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce(lockAnswer as any);

      const success = await cartService.RemoveFromCart({
        cart_item: { item_id: "row-1" },
      });

      expect(success, "a locked cart must refuse the remove").toBe(false);
      expect(
        useAppStore.getState().rdbLock?.reference,
        "the core backend's locked-cart answer did not reach the store",
      ).toBe("ref-1");
    });

    it("ConvertToOldCart records the lock", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce(lockAnswer as any);

      const success = await cartService.ConvertToOldCart({ cart_item: "row-1" });

      expect(success, "a locked cart must refuse the move to the old cart").toBe(false);
      expect(
        useAppStore.getState().rdbLock?.reference,
        "the core backend's locked-cart answer did not reach the store",
      ).toBe("ref-1");
    });
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/services/cart.test.ts -t "when an RDB payment request holds the cart"`
Expected: FAIL — `rdbLock` is `undefined` on the store, and `LogServerError` was called, because today the lock looks like an ordinary failure.

- [ ] **Step 3: Add the two cart-lock events**

In `utils/orderFunnel.ts`, next to the wallet events (line 85 onward), add:

```ts
  RDB_CART_LOCK_HIT: "rdb_cart_lock_hit",
  RDB_CART_LOCK_CLEARED: "rdb_cart_lock_cleared",
```

- [ ] **Step 4: Add the store field**

In `store/Cart/reducer.ts`, next to `wallet: null,` (line 113) add:

```ts
  // Set while an RDB payment request holds the cart. Every cart write answers
  // 409 with the pending reference until the payment finishes or is cancelled.
  // `RdbPaymentLockedSheet` reads it and offers the two ways out.
  rdbLock: null,
```

and next to `setWalletUser` (line 190) add the setter:

```ts
  setRdbLock: (lock) => set({ rdbLock: lock }),
```

- [ ] **Step 5: Make the four cart writes record the lock**

In `services/cart.ts`, add the imports at the top:

```ts
import { readRdbLock } from "./rdbPayment";
import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";
```

Then, in **each** of the four methods, put this block immediately after the `fetchData` call and **before** the existing `if (!response.success)` check:

```ts
      // The core backend refuses every cart write while an RDB payment request
      // is pending. That is not a fault: the shopper has to finish or cancel
      // the payment first, and the lock sheet says so.
      const lock = readRdbLock(response);
      if (lock) {
        useAppStore.getState().setRdbLock(lock);
        trackOrder(ORDER_EVENTS.RDB_CART_LOCK_HIT, { at: "cart" });
        return false;
      }
```

The four places are `AddToCart` (after line 41), `UpdateCart` (after line 109), `RemoveFromCart` (after line 155) and `ConvertToOldCart` (after line 180).

- [ ] **Step 6: Make `hideOldCart` record the lock**

In `services/home.ts`, add `import { readRdbLock } from "./rdbPayment";` at the top (`ORDER_EVENTS` and `trackOrder` are already imported there), then in `hideOldCart` (line 611) put the same block after the `fetchData` call and before `if (!response.success)`:

```ts
      const lock = readRdbLock(response);
      if (lock) {
        useAppStore.getState().setRdbLock(lock);
        trackOrder(ORDER_EVENTS.RDB_CART_LOCK_HIT, { at: "old_cart" });
        return;
      }
```

If `services/home.ts` does not already import `ORDER_EVENTS` and `trackOrder`, add `import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";` too.

- [ ] **Step 7: Make `PlaceOrder` record the lock and stop sending `pay_by_wallet`**

In `services/order.ts`, add `import { readRdbLock } from "./rdbPayment";` at the top. Replace lines 77–90 (from `const checkoutPath` to the `throw new Error(response.message);` that follows the success check) with:

```ts
      const checkoutPath = payment_method
        ? `/customer/order/checkout/${payment_method}`
        : `/customer/order/checkout`;
      // `pay_by_wallet` is gone. No payment method takes a share from the
      // Trydos wallet any more, and the core backend ignores the field.
      let response: any = await fetchData({
        url: `${checkoutPath}?order_note=order note&address_id=${addressId}`,
        reqTitle: REQUESTS_DATA.PAY_ORDER,
        body: "",
        method: "POST",
        server: "market",
      });
      const lock = readRdbLock(response);
      if (lock) {
        useAppStore.getState().setRdbLock(lock);
        trackOrder(ORDER_EVENTS.RDB_CART_LOCK_HIT, { at: "checkout" });
        setOrderLoading(false);
        return;
      }
      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
```

`services/order.ts` already imports `ORDER_EVENTS` and `trackOrder` (line 12). Leave the `pay_by_wallet` parameter on the `PlaceOrder` signature for now — `OrdersPage.tsx:163` still passes it and Task 7 removes both together.

- [ ] **Step 8: Run the tests to verify they pass**

Run: `pnpm vitest run tests/services/cart.test.ts tests/services/orderClass.test.ts`
Expected: PASS — the four new tests, and every test that was already in both files.

- [ ] **Step 9: Commit**

```bash
git add store/Cart/reducer.ts services/cart.ts services/home.ts services/order.ts utils/orderFunnel.ts tests/services/cart.test.ts tests/services/orderClass.test.ts
git commit -m "feat(cart): record the RDB cart lock in the store on every locked write"
```

---

## Task 5: The "payment in progress" sheet

**Files:**
- Create: `components/Cart/RdbPaymentLockedSheet.tsx`
- Modify: `components/Cart/index.tsx` (mount it at the root of `CartContainer`, line 152)
- Test: `tests/components/Cart/RdbPaymentLockedSheet.test.tsx`

**Interfaces:**
- Consumes: `rdbLock` / `setRdbLock` from the store (Task 4), `CancelRdbRequest` from `services/rdbPayment` (Task 2), `RdbPaymentModal` from Task 6.
- Produces: a component with no props. It draws nothing when `rdbLock` is `null`.

> **Order note:** this task imports `RdbPaymentModal`, which Task 6 creates. Do Task 6 first if you are working strictly one task at a time; the two are listed in this order because the sheet is the smaller piece to read.

`RDB_CART_LOCK_HIT` and `RDB_CART_LOCK_CLEARED` already exist — Task 4 step 3 added them.

- [ ] **Step 1: Write the failing test**

Create `tests/components/Cart/RdbPaymentLockedSheet.test.tsx`:

```tsx
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import RdbPaymentLockedSheet from "components/Cart/RdbPaymentLockedSheet";
import { renderWithProviders } from "../../render";
import { CancelRdbRequest } from "services/rdbPayment";
import { useAppStore } from "store";

vi.mock("services/rdbPayment", () => ({
  CancelRdbRequest: vi.fn(),
}));

vi.mock("components/Cart/RdbPaymentModal", () => ({
  default: () => <div data-pw="rdb-payment-modal" />,
}));

describe("RdbPaymentLockedSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("draws nothing while no payment request holds the cart", async () => {
    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: null },
    });

    expect(
      screen.queryByText("You have a payment in progress"),
      "with no lock the sheet must stay out of the way",
    ).toBeNull();
  });

  it("tells the shopper the cart is locked and offers both ways out", async () => {
    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    expect(
      screen.getByText("You have a payment in progress"),
      "a locked cart must say so in words",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Continue payment"),
      "the shopper must be able to go back to the payment screen",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cancel payment"),
      "the shopper must be able to cancel and edit the cart again",
    ).toBeInTheDocument();
  });

  it("opens the payment screen on the pending reference", async () => {
    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    fireEvent.click(screen.getByText("Continue payment"));

    await waitFor(() => {
      expect(
        document.querySelector('[data-pw="rdb-payment-modal"]'),
        "the payment screen must open on the pending request",
      ).not.toBeNull();
    });
  });

  it("clears the lock after the core backend cancels the request", async () => {
    vi.mocked(CancelRdbRequest).mockResolvedValueOnce({ ok: true, alreadyPaid: false });

    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    fireEvent.click(screen.getByText("Cancel payment"));

    await waitFor(() => {
      expect(
        useAppStore.getState().rdbLock,
        "a cancelled request must unlock the cart",
      ).toBeNull();
    });
    expect(
      CancelRdbRequest,
      "the cancel must be sent to the core backend for the pending reference",
    ).toHaveBeenCalledWith("ref-1");
  });

  it("keeps the lock and says so when the payment already landed", async () => {
    vi.mocked(CancelRdbRequest).mockResolvedValueOnce({ ok: false, alreadyPaid: true });

    await renderWithProviders(<RdbPaymentLockedSheet />, {
      store: { rdbLock: { reference: "ref-1", expires_at: null } },
    });

    fireEvent.click(screen.getByText("Cancel payment"));

    await waitFor(() => {
      expect(
        screen.getByText("This payment is already paid"),
        "a paid request cannot be cancelled and the shopper must be told why",
      ).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/components/Cart/RdbPaymentLockedSheet.test.tsx`
Expected: FAIL — `Failed to resolve import "components/Cart/RdbPaymentLockedSheet"`.

- [ ] **Step 3: Write the component**

Create `components/Cart/RdbPaymentLockedSheet.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import { CancelRdbRequest } from "services/rdbPayment";
import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";
import RdbPaymentModal from "./RdbPaymentModal";

/**
 * Shown when the core backend refuses a cart write because an RDB payment
 * request is still open (design doc §6). It offers the only two ways out:
 * go back to the payment screen, or cancel the request.
 */
export default function RdbPaymentLockedSheet() {
  const { rdbLock, setRdbLock, language } = useAppStore();
  const [showPayment, setShowPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const isRtl = language === "ar" || language === "ku";

  if (!rdbLock) return null;

  if (showPayment) {
    return (
      <RdbPaymentModal
        reference={rdbLock.reference}
        onSuccess={() => setShowPayment(false)}
        onClose={() => setShowPayment(false)}
      />
    );
  }

  const cancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    const result = await CancelRdbRequest(rdbLock.reference);
    setCancelling(false);
    if (result.ok) {
      trackOrder(ORDER_EVENTS.RDB_CART_LOCK_CLEARED, { by: "cancel" });
      setRdbLock(null);
      return;
    }
    // A paid request cannot be cancelled. Say that, and leave the lock alone —
    // the payment screen is where the shopper sees their new orders.
    setAlreadyPaid(result.alreadyPaid);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999999998] flex items-center justify-center bg-black/60 px-[16px]"
      data-pw="rdb-cart-locked"
    >
      <div
        className={`flex-col w-full max-w-[400px] bg-white rounded-[20px] px-[20px] py-[24px] gap-[12px] ${
          isRtl ? "items-end" : "items-start"
        }`}
        style={{ boxShadow: "0px 4px 30px rgba(0,0,0,0.15)" }}
      >
        <span className="semibold text-[14px] text-[#1D1D1D]">
          {translateFunction("You have a payment in progress")}
        </span>
        <span className="regular text-[12px] text-[#8D8D8D]">
          {translateFunction(
            "Your cart is locked until you finish or cancel the payment",
          )}
        </span>
        {alreadyPaid && (
          <span className="regular text-[12px] text-[#388CFF]">
            {translateFunction("This payment is already paid")}
          </span>
        )}
        <div className="flex-row w-full gap-[8px] mt-[8px]">
          <div
            className="flex items-center justify-center h-[40px] flex-1 rounded-[15px] bg-[#388CFF] text-white regular text-[12px] cursor-pointer"
            data-pw="rdb-lock-continue"
            onClick={() => setShowPayment(true)}
          >
            {translateFunction("Continue payment")}
          </div>
          <div
            className="flex items-center justify-center h-[40px] flex-1 rounded-[15px] bg-[#F8F8F8] text-[#f85555] regular text-[12px] cursor-pointer"
            data-pw="rdb-lock-cancel"
            onClick={cancel}
          >
            {cancelling ? <Spinner /> : translateFunction("Cancel payment")}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 4: Mount it in the cart**

In `components/Cart/index.tsx`, add the import next to the other cart imports:

```tsx
import RdbPaymentLockedSheet from "./RdbPaymentLockedSheet";
```

and make it the first child of the element `CartContainer` returns at line 152:

```tsx
  return (
    <>
      <RdbPaymentLockedSheet />
      {/* the existing root element stays exactly as it is, here */}
    </>
  );
```

Keep the existing root element unchanged inside the fragment. The sheet renders through a portal, so it does not affect the cart layout.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run tests/components/Cart/RdbPaymentLockedSheet.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add components/Cart/RdbPaymentLockedSheet.tsx components/Cart/index.tsx tests/components/Cart/RdbPaymentLockedSheet.test.tsx
git commit -m "feat(cart): show a sheet when an RDB payment request holds the cart"
```

---

## Task 6: The RDB payment screen

**Files:**
- Create: `components/Cart/RdbPaymentModal.tsx`
- Modify: `utils/orderFunnel.ts` (five new events)
- Test: `tests/components/Cart/RdbPaymentModal.test.tsx`

**Interfaces:**
- Consumes: `StartRdbPayment`, `GetRdbRequest`, `CancelRdbRequest`, `RdbPaymentRequest` from `services/rdbPayment` (Task 2); `CustomQRCode` from `components/Login/Enhanced/ui/CustomQRCode`; `setRdbLock` from the store (Task 4).
- Produces: `RdbPaymentModal({ reference?, onSuccess, onClose })`, where `reference` is a pending request to reopen instead of starting a new one.

- [ ] **Step 1: Add the five events**

In `utils/orderFunnel.ts`, add next to the events from Task 5:

```ts
  RDB_REQUEST_CREATED: "rdb_request_created",
  RDB_REQUEST_START_FAILED: "rdb_request_start_failed",
  RDB_PAYMENT_PAID: "rdb_payment_paid",
  RDB_PAYMENT_EXPIRED: "rdb_payment_expired",
  RDB_PAYMENT_ENDED: "rdb_payment_ended",
```

- [ ] **Step 2: Write the failing test**

Create `tests/components/Cart/RdbPaymentModal.test.tsx`:

```tsx
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import RdbPaymentModal from "components/Cart/RdbPaymentModal";
import { renderWithProviders } from "../../render";
import {
  StartRdbPayment,
  GetRdbRequest,
  CancelRdbRequest,
} from "services/rdbPayment";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";

vi.mock("services/rdbPayment", () => ({
  StartRdbPayment: vi.fn(),
  GetRdbRequest: vi.fn(),
  CancelRdbRequest: vi.fn(),
}));

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("components/Login/Enhanced/ui/CustomQRCode", () => ({
  default: ({ value }: { value: string }) => (
    <div data-pw="rdb-qr" data-value={value} />
  ),
}));

const pending = {
  request_reference: "ref-1",
  status: "awaiting_payment" as const,
  rdb_request_id: "rdb-1",
  request_code: "REQ8F3K2M1Q",
  short_code: "12345678",
  deep_link: "rdb://pay/REQ8F3K2M1Q",
  qr_payload: "https://pay.rdb.example/r/v1/REQ8F3K2M1Q",
  amount: "100.50",
  currency: "USD",
  expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  paid_at: null,
  receipt_number: null,
  failure_reason: null,
  order_ids: [] as number[],
};

const storeState = {
  addressLists: [{ id: 77, is_default: 1 }],
  cart: [{ cart_group_id: "cg-1" }],
};

describe("RdbPaymentModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ rdbLock: null });
  });

  it("shows the QR payload, the short code and the amount exactly as they arrived", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-pw="rdb-qr"]')?.getAttribute("data-value"),
        "the QR must carry the payload the core backend sent",
      ).toBe("https://pay.rdb.example/r/v1/REQ8F3K2M1Q");
    });
    expect(
      screen.getByText("12345678"),
      "the short code for manual entry in the RDB app is missing",
    ).toBeInTheDocument();
    expect(
      screen.getByText("100.50 USD"),
      "the amount must be shown as the string the core backend sent, not a rounded number",
    ).toBeInTheDocument();
  });

  it("sends the default address to the core backend when it starts a payment", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        StartRdbPayment,
        "the payment must start against the shopper's default address",
      ).toHaveBeenCalledWith(expect.objectContaining({ addressId: 77 }));
    });
  });

  it("reopens an existing request instead of starting a second one", async () => {
    vi.mocked(GetRdbRequest).mockResolvedValueOnce(pending);

    await renderWithProviders(
      <RdbPaymentModal reference="ref-9" onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        GetRdbRequest,
        "reopening must read the pending request, not create a new one",
      ).toHaveBeenCalledWith("ref-9");
    });
    expect(
      StartRdbPayment,
      "reopening a pending request must not start a second one",
    ).not.toHaveBeenCalled();
  });

  it("adopts the pending request when the core backend answers 409", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "already_pending",
      reference: "ref-9",
    });
    vi.mocked(GetRdbRequest).mockResolvedValueOnce({ ...pending, request_reference: "ref-9" });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        GetRdbRequest,
        "a 409 at start must send the shopper to the request they already have",
      ).toHaveBeenCalledWith("ref-9");
    });
  });

  it("loads the orders and reports success once the core backend says paid", async () => {
    const onSuccess = vi.fn();
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });
    vi.mocked(GetRdbRequest).mockResolvedValue({
      ...pending,
      status: "paid",
      order_ids: [501],
    });
    vi.mocked(fetchData).mockResolvedValue({
      success: true,
      data: [{ id: 501, order_group_id: "og-1" }],
    } as any);

    await renderWithProviders(
      <RdbPaymentModal onSuccess={onSuccess} onClose={vi.fn()} />,
      { store: storeState },
    );

    // Fake timers go on only after the component is mounted: renderWithProviders
    // waits for the language file, and that wait needs a real clock.
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(5000);

    expect(
      fetchData,
      "a paid request must load the orders through the cart-to-order lookup",
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/customer/order/getOrdersByCartGroupID?cart_group_id=cg-1",
      }),
    );
    expect(onSuccess, "a paid request must move the shopper to the order screen").toHaveBeenCalled();
    expect(
      useAppStore.getState().rdbLock,
      "a paid request must release the cart lock",
    ).toBeNull();
    vi.useRealTimers();
  });

  it("stops and says the payment expired", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });
    vi.mocked(GetRdbRequest).mockResolvedValue({ ...pending, status: "expired" });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    // Fake timers go on only after the component is mounted: renderWithProviders
    // waits for the language file, and that wait needs a real clock.
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(5000);
    const callsAfterFirstPoll = vi.mocked(GetRdbRequest).mock.calls.length;
    await vi.advanceTimersByTimeAsync(20000);

    expect(
      screen.getByText("Payment expired"),
      "an expired request must say so instead of spinning",
    ).toBeInTheDocument();
    expect(
      vi.mocked(GetRdbRequest).mock.calls.length,
      "polling must stop once the core backend reports an end state",
    ).toBe(callsAfterFirstPoll);
    vi.useRealTimers();
  });

  it("shows the core backend's own reason when the request failed", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });
    vi.mocked(GetRdbRequest).mockResolvedValue({
      ...pending,
      status: "failed",
      failure_reason: "cart changed after payment",
    });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    // Fake timers go on only after the component is mounted: renderWithProviders
    // waits for the language file, and that wait needs a real clock.
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(5000);

    expect(
      screen.getByText("cart changed after payment"),
      "a failed request must quote the core backend's reason, not a generic message",
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("cancels the request through the core backend and closes", async () => {
    const onClose = vi.fn();
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "created",
      request: pending,
    });
    vi.mocked(CancelRdbRequest).mockResolvedValueOnce({ ok: true, alreadyPaid: false });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={onClose} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(screen.getByText("Cancel payment"), "the cancel button is missing").toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Cancel payment"));

    await waitFor(() => {
      expect(
        CancelRdbRequest,
        "the cancel must be sent to the core backend for this reference",
      ).toHaveBeenCalledWith("ref-1");
    });
    expect(onClose, "a cancelled payment must close the screen").toHaveBeenCalled();
  });

  it("says it could not start when the core backend refuses", async () => {
    vi.mocked(StartRdbPayment).mockResolvedValueOnce({
      kind: "refused",
      message: "Cart is not available",
      httpStatus: 403,
    });

    await renderWithProviders(
      <RdbPaymentModal onSuccess={vi.fn()} onClose={vi.fn()} />,
      { store: storeState },
    );

    await waitFor(() => {
      expect(
        screen.getByText("Cart is not available"),
        "a refused start must quote the core backend's reason",
      ).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run tests/components/Cart/RdbPaymentModal.test.tsx`
Expected: FAIL — `Failed to resolve import "components/Cart/RdbPaymentModal"`.

- [ ] **Step 4: Write the component**

Create `components/Cart/RdbPaymentModal.tsx`:

```tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import CustomQRCode from "components/Login/Enhanced/ui/CustomQRCode";
import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";
import {
  StartRdbPayment,
  GetRdbRequest,
  CancelRdbRequest,
  type RdbPaymentRequest,
} from "services/rdbPayment";

/** How often the screen asks the core backend whether the payment landed.
 *  The backend asks for 3 to 5 seconds (design doc §4). */
const POLL_INTERVAL_MS = 4000;

/** True on a phone or tablet browser, where an `rdb://` link can actually open
 *  the RDB app. On a desktop browser the link does nothing, so the button is
 *  not drawn there. The QR is always drawn and is the fallback. */
const isMobileBrowser = () =>
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** mm:ss from a number of seconds. */
const formatLeft = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

/**
 * The RDB payment screen.
 *
 * The browser never talks to RDB. It asks the Trydos core backend to create a
 * payment request, shows the QR payload and the short code, then polls one
 * core-backend endpoint until the request reaches an end state.
 *
 * `reference` reopens a request that already exists — that is how the cart lock
 * sheet sends the shopper back to a payment they left.
 */
export default function RdbPaymentModal({
  reference = null,
  onSuccess,
  onClose,
}: {
  reference?: string | null;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { addressLists, cart, language, setOrderData, setRdbLock } = useAppStore();
  const [request, setRequest] = useState<RdbPaymentRequest | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const stoppedRef = useRef(false);
  const startedRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRtl = language === "ar" || language === "ku";

  /** Load the orders the payment created. The poll answer carries `order_ids`,
   *  but the success screen needs the order rows and their group id, and the
   *  cart-to-order lookup returns both. */
  const loadOrders = async () => {
    const cartGroupId = cart?.[0]?.cart_group_id;
    if (!cartGroupId) return;
    const response: any = await fetchData({
      url: `/customer/order/getOrdersByCartGroupID?cart_group_id=${cartGroupId}`,
      method: "GET",
      server: "market",
      reqTitle: REQUESTS_DATA.GETORDERSBYCARTGROUPID,
      noMessage: true,
    });
    if (response?.success && response?.data?.length > 0) {
      setOrderData({ data: response.data, success: true });
    }
  };

  /** Handle an end state: stop polling, release the lock, and either move on to
   *  the orders or leave the reason on the screen. */
  const settle = async (req: RdbPaymentRequest) => {
    stoppedRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    setRequest(req);
    setRdbLock(null);

    if (req.status === "paid") {
      trackOrder(ORDER_EVENTS.RDB_PAYMENT_PAID, {
        reference: req.request_reference,
      });
      await loadOrders();
      onSuccess();
      onClose();
      return;
    }

    trackOrder(
      req.status === "expired"
        ? ORDER_EVENTS.RDB_PAYMENT_EXPIRED
        : ORDER_EVENTS.RDB_PAYMENT_ENDED,
      {
        reference: req.request_reference,
        status: req.status,
        failure_reason: req.failure_reason ?? "",
      },
    );
  };

  const schedulePoll = (ref: string) => {
    if (stoppedRef.current) return;
    pollTimerRef.current = setTimeout(async () => {
      if (stoppedRef.current) return;
      const next = await GetRdbRequest(ref);
      if (stoppedRef.current) return;
      // A lost answer is not an end state. Ask again rather than tell the
      // shopper the payment failed.
      if (!next) {
        schedulePoll(ref);
        return;
      }
      setRequest(next);
      if (next.status === "awaiting_payment") {
        schedulePoll(ref);
        return;
      }
      void settle(next);
    }, POLL_INTERVAL_MS);
  };

  const adopt = (req: RdbPaymentRequest) => {
    setRequest(req);
    if (req.status === "awaiting_payment") {
      setRdbLock({
        reference: req.request_reference,
        expires_at: req.expires_at,
      });
      schedulePoll(req.request_reference);
      return;
    }
    void settle(req);
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const begin = async () => {
      if (reference) {
        const existing = await GetRdbRequest(reference);
        setStarting(false);
        if (!existing) {
          setStartError(translateFunction("Could not start the payment. Please try again"));
          return;
        }
        adopt(existing);
        return;
      }

      const addressId = addressLists?.find((a: any) => a.is_default === 1)?.id;
      const result = await StartRdbPayment({ addressId });
      setStarting(false);

      if (result.kind === "created") {
        trackOrder(ORDER_EVENTS.RDB_REQUEST_CREATED, {
          reference: result.request.request_reference,
        });
        adopt(result.request);
        return;
      }

      if (result.kind === "already_pending") {
        const existing = await GetRdbRequest(result.reference);
        if (existing) {
          adopt(existing);
          return;
        }
      }

      trackOrder(ORDER_EVENTS.RDB_REQUEST_START_FAILED, {
        http_status: result.kind === "refused" ? result.httpStatus : 409,
      });
      setStartError(
        (result.kind === "refused" && result.message) ||
          translateFunction("Could not start the payment. Please try again"),
      );
    };

    void begin();

    return () => {
      stoppedRef.current = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // The countdown. When it reaches zero the request is over whatever the last
  // poll said, so stop asking and show the end state (design doc §3.1).
  useEffect(() => {
    const expiresAt = request?.expires_at;
    if (!expiresAt || request?.status !== "awaiting_payment") return;

    const tick = () => {
      const left = Math.floor(
        (new Date(expiresAt).getTime() - Date.now()) / 1000,
      );
      setSecondsLeft(left > 0 ? left : 0);
      if (left <= 0 && request) {
        void settle({ ...request, status: "expired" });
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [request?.expires_at, request?.status]);

  const cancel = async () => {
    if (!request || cancelling) return;
    setCancelling(true);
    const result = await CancelRdbRequest(request.request_reference);
    setCancelling(false);

    if (result.ok) {
      stoppedRef.current = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      setRdbLock(null);
      trackOrder(ORDER_EVENTS.RDB_PAYMENT_ENDED, {
        reference: request.request_reference,
        status: "cancelled",
        by: "shopper",
      });
      onClose();
      return;
    }

    if (result.alreadyPaid) {
      const latest = await GetRdbRequest(request.request_reference);
      if (latest) {
        void settle(latest);
        return;
      }
    }

    showErrorNotification(
      translateFunction("Could not cancel the payment. Please try again"),
    );
  };

  const statusLabel = () => {
    switch (request?.status) {
      case "paid":
        return translateFunction("Payment received");
      case "expired":
        return translateFunction("Payment expired");
      case "cancelled":
        return translateFunction("Payment cancelled");
      case "failed":
        return translateFunction("Payment failed");
      default:
        return translateFunction("Waiting for your payment");
    }
  };

  const isOpen = request?.status === "awaiting_payment";

  return createPortal(
    <React.Fragment>
      <div
        className="fixed inset-0 z-[9999999998] bg-black/60"
        onClick={() => {
          if (!cancelling) onClose();
        }}
      />
      <div className="fixed inset-0 z-[9999999999] flex items-center justify-center px-[16px]">
        <div
          className={`flex-col w-full max-w-[400px] bg-white rounded-[20px] px-[20px] py-[24px] gap-[12px] ${
            isRtl ? "items-end" : "items-start"
          }`}
          style={{ boxShadow: "0px 4px 30px rgba(0,0,0,0.15)" }}
          data-pw="rdb-payment-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {starting && <Spinner />}

          {startError && (
            <span className="regular text-[12px] text-[#f85555]" data-pw="rdb-start-error">
              {startError}
            </span>
          )}

          {request && (
            <React.Fragment>
              <span className="semibold text-[14px] text-[#1D1D1D]" data-pw="rdb-status">
                {statusLabel()}
              </span>

              <span className="regular text-[12px] text-[#8D8D8D]">
                {translateFunction("Amount to pay")}
              </span>
              <span className="semibold text-[16px] text-[#1D1D1D]" data-pw="rdb-amount">
                {`${request.amount} ${request.currency}`}
              </span>

              {isOpen && request.qr_payload && (
                <React.Fragment>
                  <span className="regular text-[12px] text-[#8D8D8D]">
                    {translateFunction("Scan this code in the RDB app")}
                  </span>
                  <div className="w-full flex items-center justify-center">
                    <CustomQRCode value={request.qr_payload} size={200} />
                  </div>
                </React.Fragment>
              )}

              {isOpen && request.short_code && (
                <React.Fragment>
                  <span className="regular text-[12px] text-[#8D8D8D]">
                    {translateFunction("Payment code")}
                  </span>
                  <span className="semibold text-[18px] tracking-[4px] text-[#1D1D1D]" data-pw="rdb-short-code">
                    {request.short_code}
                  </span>
                </React.Fragment>
              )}

              {isOpen && secondsLeft !== null && (
                <span className="regular text-[12px] text-[#8D8D8D]" data-pw="rdb-time-left">
                  {`${translateFunction("Time left")} ${formatLeft(secondsLeft)}`}
                </span>
              )}

              {request.status === "failed" && request.failure_reason && (
                <span className="regular text-[12px] text-[#f85555]" data-pw="rdb-failure-reason">
                  {request.failure_reason}
                </span>
              )}

              <div className="flex-row w-full gap-[8px] mt-[8px]">
                {isOpen && request.deep_link && isMobileBrowser() && (
                  <a
                    className="flex items-center justify-center h-[40px] flex-1 rounded-[15px] bg-[#388CFF] text-white regular text-[12px]"
                    href={request.deep_link}
                    data-pw="rdb-deep-link"
                  >
                    {translateFunction("Open the RDB app")}
                  </a>
                )}
                {isOpen && (
                  <div
                    className="flex items-center justify-center h-[40px] flex-1 rounded-[15px] bg-[#F8F8F8] text-[#f85555] regular text-[12px] cursor-pointer"
                    data-pw="rdb-cancel"
                    onClick={cancel}
                  >
                    {cancelling ? <Spinner /> : translateFunction("Cancel payment")}
                  </div>
                )}
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
    </React.Fragment>,
    document.body,
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run tests/components/Cart/RdbPaymentModal.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 6: Commit**

```bash
git add components/Cart/RdbPaymentModal.tsx utils/orderFunnel.ts tests/components/Cart/RdbPaymentModal.test.tsx
git commit -m "feat(payment): add the RDB payment screen with QR, short code and polling"
```

---

## Task 7: Wire the new screen in and delete the signed merchant call

**Files:**
- Modify: `components/Cart/PaymentMethod.tsx` (lines 32–38, 40–72, 74, 100–102, 107, 137, 288–378, 457–522)
- Modify: `components/Cart/PlaceOrderButtons.tsx` (lines 13, 82–84, 122–128, 160–170)
- Modify: `components/Cart/OrdersPage.tsx` (lines 148–165)
- Modify: `services/order.ts` (the `PlaceOrder` signature)
- Modify: `services/wallet/index.ts` (delete `CheckoutOrder`, lines 412–487)
- Modify: `services/wallet/types.ts` (delete `CheckoutOrderApi`, line 239 onward)
- Modify: `utils/orderFunnel.ts` (delete the dead wallet events)
- Delete: `components/Cart/WalletPaymentModal.tsx`
- Test: `tests/components/Cart/OrdersPage.test.tsx` (update the wallet test)

**Interfaces:**
- Consumes: `RdbPaymentModal` from Task 6.
- Produces: `orderData.payment` entry `{ id: 1, balance: total }` now means "the shopper chose RDB", with no balance condition attached.

- [ ] **Step 1: Make the RDB row a normal choice in `PaymentMethod.tsx`**

Delete `getWalletInUSD`, `walletCoversTotal` and `walletInsufficient` (lines 32–38). Delete the whole auto-select `useEffect` (lines 40–72). Replace the empty `handleWalletPayment` (lines 100–102) with a real toggle that matches the other three:

```tsx
  const handleWalletPayment = () => {
    if (orderData?.payment?.find((s) => s.id === 1)) {
      setOrderData({ payment: [] });
    } else {
      setWalletBalance();
      GAevent({
        action: GA_EVENT_NAMES.ADD_PAYMENT,
        params: {
          payment_type: GA_PAYMENTS.WALLET,
          items: cart.map((item) => ({
            item_id: item.product_id,
            item_name: item.name,
            quantity: item.quantity,
          })),
        },
      });
      trackOrder(ORDER_EVENTS.PAYMENT_METHOD_SELECTED, {
        payment_type: GA_PAYMENTS.WALLET,
      });
      setOrderData({ payment: [{ id: 1, balance: total }] });
    }
  };
```

Delete the three `if (walletCoversTotal) return;` guards at the top of `handleCODPayment` (line 74), `handleCryptoPayment` (line 107) and `handleCardPayment` (line 137).

In the row list (lines 288–378): change the method key from `"trydos_wallet"` to `"rdb"`, delete `disabled={walletCoversTotal}` from `CODInput`, `CryptoInput` and `CreditInput`, and delete `disabled={walletInsufficient}` from `TryDosWalletInput`:

```tsx
              if (item?.toLowerCase() === "rdb".toLowerCase()) {
```

In `TryDosWalletInput` (line 457), delete the `disabled` prop and the two places it is read, so the row is never dimmed and never ignores a tap:

```tsx
const TryDosWalletInput = ({ active, setActive, balance }) => {
  const { orderLoading, currency, settings, language } = useAppStore();
  const points = settings["starting_setting"]?.decimal_point_settings || 0;
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      data-pw="second-bay-way"
      onClick={() => setActive()}
      className={`${
        isRtl
          ? "flex-row-reverse pr-[23px] pl-[26px]"
          : "flex-row pr-[26px] pl-[23px]"
      } w-full cursor-pointer mt-[10px] items-center justify-between flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative`}
      style={{
        border: active && "1px solid rgb(56 144 255 / 51%)",
      }}
    >
```

The rest of `TryDosWalletInput` stays as it is. The balance stays on the row as information; it no longer decides anything.

- [ ] **Step 2: Mount the new screen in `PlaceOrderButtons.tsx`**

Replace the import at line 13:

```tsx
import RdbPaymentModal from "./RdbPaymentModal";
```

Rename the two reads at lines 82–84 and drop the balance, which the core backend now decides:

```tsx
  const hasRdbPayment = orderData.payment?.some((s) => s.id === 1);
```

At lines 122–128 use the new name:

```tsx
        if (hasRdbPayment) {
          trackOrder(ORDER_EVENTS.WALLET_MODAL_OPENED);
          setShowWalletModal(true);
        } else {
          successOrder();
        }
```

And at lines 160–170 mount the new screen without `walletAmount`:

```tsx
      {showWalletModal && !orderData.success && (
        <RdbPaymentModal
          onSuccess={() => {
            setShowWalletModal(false);
            successOrder();
          }}
          onClose={() => {
            setShowWalletModal(false);
          }}
        />
      )}
```

Also update the one other read of `hasWalletPayment` at line 89 (`trackOrder(ORDER_EVENTS.PLACE_ORDER_CLICKED, { has_wallet_payment: hasWalletPayment })`) to `has_rdb_payment: hasRdbPayment`.

- [ ] **Step 3: Drop `pay_by_wallet` from the call site**

In `components/Cart/OrdersPage.tsx`, change lines 148–165 so the comment names the new screen and the call drops the parameter:

```tsx
        // RDB checkout is handled entirely by RdbPaymentModal — skip PlaceOrder
        if (selectedPayment?.id === 1) return;

        let payment_method =
          selectedPayment?.id === 0
            ? "cash_on_delivery"
            : selectedPayment?.id === 2
              ? "card"
              : "crypto";
        setLoading(true);
        trackOrder(ORDER_EVENTS.ORDER_SUBMIT_ATTEMPT, { payment_method });
        await order.PlaceOrder({ payment_method });
        setLoading(false);
```

In `services/order.ts`, drop `pay_by_wallet` from the `PlaceOrder` signature so the two match:

```ts
  async PlaceOrder({ payment_method }: { payment_method?: string }) {
```

- [ ] **Step 4: Delete the signed merchant call**

- Delete `components/Cart/WalletPaymentModal.tsx`.
- In `services/wallet/index.ts`, delete `CheckoutOrder` (lines 412–487) and remove `CheckoutOrderApi` from the import list at line 9. The `crypto` require, `WALLET_SECRET_KEY` and `WALLET_PUBLIC_API_KEY` disappear with it.
- In `services/wallet/types.ts`, delete `CheckoutOrderApi` (line 239 onward).
- In `utils/orderFunnel.ts`, delete the four events nothing emits any more: `WALLET_PAYMENT_ATTEMPT`, `WALLET_PAYMENT_BLOCKED_INSUFFICIENT`, `WALLET_PAYMENT_TIMEOUT`, `WALLET_CURRENCY_CHANGED`, `WALLET_DATA_LOAD_FAILED`, `WALLET_PAYMENT_PROCESSING`, `WALLET_PAYMENT_SUCCEEDED` and `WALLET_PAYMENT_FAILED`. Keep `WALLET_MODAL_OPENED` and `WALLET_BALANCE_REFRESHED` — both are still emitted.

- [ ] **Step 5: Prove nothing still points at the deleted code**

Run: `pnpm knip`
Expected: no new unused export or unresolved import for `services/wallet`, `WalletPaymentModal` or `CheckoutOrderApi`.

Run: `npx next typegen && npx tsc --noEmit`
Expected: PASS with no error. (`tsc` needs `next typegen` first; `next-env.d.ts` is gitignored.)

- [ ] **Step 6: Update the OrdersPage test**

In `tests/components/Cart/OrdersPage.test.tsx`, the test at line 650 is named "skips PlaceOrder when payment method is wallet (id: 1)". Rename it and fix the two `PlaceOrder` assertions at lines 595–600 and 640–650 that still expect `pay_by_wallet`:

```ts
    it("skips PlaceOrder when the shopper chose RDB (id: 1)", async () => {
```

```ts
      expect(
        mockPlaceOrder,
        "should call order.PlaceOrder with cash_on_delivery",
      ).toHaveBeenCalledWith({ payment_method: "cash_on_delivery" });
```

- [ ] **Step 7: Run the whole unit suite**

Run: `pnpm test:run`
Expected: PASS, the whole suite.

Run: `pnpm lint`
Expected: PASS — no missing translation key, no hardcoded JSX text in the new files.

- [ ] **Step 8: Commit**

```bash
git add -A components/Cart services/order.ts services/wallet utils/orderFunnel.ts tests/components/Cart/OrdersPage.test.tsx
git commit -m "feat(payment): pay through the core backend and delete the signed RDB merchant call"
```

---

## Task 8: Documentation and environment cleanup

**Files:**
- Modify: `docs/posthog-events.md`
- Modify: `docs/features/B-cart-checkout-orders/CO-13-pay-with-wallet.md`
- Modify: `docs/features/C-payments-wallet-banking/PW-04-pay-order-with-wallet.md`

**Interfaces:**
- Consumes: the event names from Tasks 5 and 6.
- Produces: no code.

- [ ] **Step 1: Write down the new events**

In `docs/posthog-events.md`, add a row for each of the seven new events, with when it fires and its properties:

| Event | Fires when | Properties |
|---|---|---|
| `rdb_request_created` | the core backend created a payment request | `reference` |
| `rdb_request_start_failed` | the core backend refused to create one | `http_status` |
| `rdb_payment_paid` | a poll answered `paid` | `reference` |
| `rdb_payment_expired` | a poll answered `expired`, or the countdown reached zero | `reference` |
| `rdb_payment_ended` | a poll answered `cancelled` or `failed`, or the shopper cancelled | `reference`, `status`, `failure_reason`, `by` |
| `rdb_cart_lock_hit` | a cart write was refused because a request is pending | — |
| `rdb_cart_lock_cleared` | the lock was released by a cancel | `by` |

Remove the rows for the eight deleted wallet events.

- [ ] **Step 2: Rewrite the two feature docs**

`CO-13-pay-with-wallet.md` and `PW-04-pay-order-with-wallet.md` both describe the old signed merchant call and the cart-group polling. Rewrite the "How it works" and "Backend" sections of each to describe the three core-backend endpoints, the QR and short code, the cart lock, and the fact that the browser never talks to RDB.

- [ ] **Step 3: Remove the dead environment variable**

`WALLET_SECRET_KEY` has no reader left. Remove it from the Vercel project for every environment:

```bash
vercel env rm WALLET_SECRET_KEY production
vercel env rm WALLET_SECRET_KEY preview
vercel env rm WALLET_SECRET_KEY development
```

Keep `WALLET_PUBLIC_API_KEY` — `app/api/auth/login/route.ts:38` still uses it for wallet login.

- [ ] **Step 4: Commit**

```bash
git add docs/posthog-events.md docs/features/B-cart-checkout-orders/CO-13-pay-with-wallet.md docs/features/C-payments-wallet-banking/PW-04-pay-order-with-wallet.md
git commit -m "docs: describe the RDB payment request flow and its events"
```

---

## Manual check list

Run these by hand against staging after Task 8, in a browser opened at
`http://localhost:3000/sy-en/...`. They mirror §9 of the design doc.

1. Choose RDB at checkout. The QR, the short code and the amount appear, and the amount is the string the backend sent.
2. Pay in the RDB test environment. The poll turns to `paid` and the orders appear.
3. Leave the request until it expires. The screen says "Payment expired" and the cart can be edited again.
4. Cancel from the payment screen. The screen closes and the cart can be edited.
5. Try to add to the cart while a request is pending. The lock sheet appears with its two buttons.
6. Try to check out again while a request is pending. The same sheet appears.
7. Confirm no request to `WALLET_BACKEND_URL/merchant/checkout` leaves the browser or the server, in the network tab and in the server log.

## Self-review

**Spec coverage**

| Spec section | Task |
|---|---|
| §2 delete the merchant call, keys and HMAC | Task 7 step 4 |
| §3 start a payment, ignore `pay_by_wallet` | Task 2, Task 4 step 6, Task 6 |
| §3.1 QR, short code, deep link, amount as a string, keep the reference, stop at `expires_at` | Task 6 |
| §3.2 no "the wallet covered it all" case | Task 7 step 1 (the auto-select gate is deleted) |
| §3.3 errors 400 / 403 / 409 / 500 | Task 2 (`refused` / `already_pending`), Task 6 (the start error line) |
| §4 poll, all five statuses | Task 2, Task 6 |
| §5 cancel, 200 / 409 | Task 2, Task 6, Task 5 |
| §6 cart lock on six endpoints, two buttons | Task 3, Task 4, Task 5 |
| §7 nothing else changes | no task — nothing to do |
| §8 website uses `/api/v1` | already true; `fetchData` calls `/api/proxy` |
| §9.1 method key is `"rdb"` | Task 7 step 1 |
| §9.2 orders load through the cart-to-order lookup | Task 6 `loadOrders` |
| §10 RDB is a normal row; QR always, button on mobile | Task 7 step 1; Task 6 `isMobileBrowser` |

**Known gap:** §6 lists `/cart/remove-all` and `/old-cart/convert_to_cart` as locked endpoints. Neither is called anywhere in this repository, so no task wires them. If either is added later, it needs the same `readRdbLock` block.

**Types:** `RdbPaymentRequest`, `RdbPaymentStatus`, `StartRdbPaymentResult` and `RdbCartLock` are defined in Task 2 and used under those exact names in Tasks 4, 5 and 6. The store field is `rdbLock` and the setter is `setRdbLock` in every task that touches it.
