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
