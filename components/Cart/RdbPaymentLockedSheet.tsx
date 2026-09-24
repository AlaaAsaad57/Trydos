"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import { showErrorNotification } from "@/store/notifications/reducer";
import { CancelRdbRequest, GetRdbRequest } from "services/rdbPayment";
import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";
import RdbPaymentModal from "./RdbPaymentModal";

/** Same cadence as `RdbPaymentModal`'s own poll (design doc §4). Only one of
 *  the two ever runs at once — see the effect below. */
const POLL_INTERVAL_MS = 4000;

/**
 * Shown when the core backend refuses a cart write because an RDB payment
 * request is still open (design doc §6). It offers the only two ways out:
 * go back to the payment screen, or cancel the request.
 *
 * The sheet owns the lock's lifetime. While its own view is on screen (not
 * delegating to an embedded payment screen, and no other payment screen is
 * open — see `rdbPaymentScreenOpen`), it polls the core backend itself and
 * clears the lock the moment the request leaves `awaiting_payment` — expired,
 * cancelled from inside the RDB app, or failed. Without this, a request that
 * ends while this sheet (not the payment screen) is the thing on screen would
 * never unlock the cart.
 */
export default function RdbPaymentLockedSheet() {
  const { rdbLock, setRdbLock, language, rdbPaymentScreenOpen } =
    useAppStore();
  const [showPayment, setShowPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isRtl = language === "ar" || language === "ku";

  // Every refused cart write stores a new lock object, even for the same
  // pending reference. Show the sheet again each time: a dismiss hides it only
  // until the shopper's next refused action, otherwise that action fails
  // without a word.
  useEffect(() => {
    setAlreadyPaid(false);
    setDismissed(false);
  }, [rdbLock]);

  // Rule 2 of the ownership fix (see the design doc): while this sheet's own
  // view is what is on screen, it is the only thing watching the request, so
  // it polls for an end state and clears the lock itself. `showPayment` and
  // `rdbPaymentScreenOpen` both mean a payment screen is polling instead —
  // this component's own screen is not shown then, and only one poll for the
  // same reference may run at a time.
  useEffect(() => {
    if (!rdbLock || showPayment || rdbPaymentScreenOpen) return;

    const reference = rdbLock.reference;
    let stopped = false;

    const poll = async () => {
      const latest = await GetRdbRequest(reference);
      if (stopped || !latest) return;
      if (latest.status !== "awaiting_payment") {
        trackOrder(ORDER_EVENTS.RDB_CART_LOCK_CLEARED, { by: "poll" });
        setRdbLock(null);
      }
    };

    void poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [rdbLock?.reference, showPayment, rdbPaymentScreenOpen, setRdbLock]);

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

  // Rule 1 of the ownership fix: never paint over a payment screen that is
  // already open elsewhere (e.g. the checkout flow's own `RdbPaymentModal`).
  if (rdbPaymentScreenOpen) return null;

  // The shopper closed the sheet without finishing or cancelling. The lock
  // stays — the payment is still pending on the core backend — but nothing
  // forces the sheet itself on screen everywhere the shopper goes. The next
  // refused cart write shows it again (see the reset effect above). The poll
  // effect above keeps running regardless, so the lock still clears on its
  // own the moment the request ends.
  if (dismissed) return null;

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

    // The reference no longer exists on the core backend — there is nothing
    // left to cancel, so unlock the cart rather than leave the shopper stuck
    // on a request that is already gone.
    if (result.gone) {
      trackOrder(ORDER_EVENTS.RDB_CART_LOCK_CLEARED, { by: "gone" });
      setRdbLock(null);
      return;
    }

    // A paid request cannot be cancelled. Say that, and leave the lock alone —
    // the payment screen is where the shopper sees their new orders.
    if (result.alreadyPaid) {
      setAlreadyPaid(true);
      return;
    }

    showErrorNotification(
      translateFunction("Could not cancel the payment. Please try again"),
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999999998] flex items-center justify-center bg-black/60 px-[16px]"
      data-pw="rdb-cart-locked"
      onClick={() => setDismissed(true)}
    >
      <div
        className={`flex-col relative w-full max-w-[400px] bg-white rounded-[20px] px-[20px] py-[24px] gap-[12px] ${
          isRtl ? "items-end" : "items-start"
        }`}
        style={{ boxShadow: "0px 4px 30px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src="/icons/CloseIcon.svg"
          alt={translateFunction("Close")}
          data-pw="rdb-lock-close"
          className={`absolute top-[16px] w-3 h-3 cursor-pointer ${
            isRtl ? "left-[16px]" : "right-[16px]"
          }`}
          onClick={() => setDismissed(true)}
        />
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
