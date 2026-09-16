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
  const {
    addressLists,
    cart,
    language,
    setOrderData,
    setRdbLock,
    setRdbPaymentScreenOpen,
  } = useAppStore();
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
    if (stoppedRef.current) return;
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

  // Rule 1 of the ownership fix (see the design doc): exactly one payment
  // screen may be on screen at a time. This flag tells `RdbPaymentLockedSheet`
  // — wherever it is mounted — to stay out of the way while this screen is
  // up, whether this screen was opened directly from checkout or by the sheet
  // itself for "Continue payment".
  useEffect(() => {
    setRdbPaymentScreenOpen(true);
    return () => setRdbPaymentScreenOpen(false);
  }, [setRdbPaymentScreenOpen]);

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
      // A 409 without a pending reference is not one of the documented cases
      // (design doc §3.3) — show the generic, translated message rather than
      // whatever raw sentence the core backend sent for a case the screen was
      // never told to expect. Every other refusal keeps the backend's own
      // reason, which is a real, useful explanation (e.g. "Cart is not
      // available").
      const backendReason =
        result.kind === "refused" && result.httpStatus !== 409
          ? result.message
          : "";
      setStartError(
        backendReason ||
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
            <React.Fragment>
              <span className="regular text-[12px] text-[#f85555]" data-pw="rdb-start-error">
                {startError}
              </span>
              <div
                className="flex items-center justify-center h-[40px] w-full rounded-[15px] bg-[#F8F8F8] text-[#1D1D1D] regular text-[12px] cursor-pointer mt-[8px]"
                data-pw="rdb-start-error-close"
                onClick={onClose}
              >
                {translateFunction("Close")}
              </div>
            </React.Fragment>
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
                    <CustomQRCode
                      value={request.qr_payload}
                      size={200}
                      errorCorrectionLevel="Q"
                    />
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
