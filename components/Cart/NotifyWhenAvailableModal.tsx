"use client";
// The question the cart row asks when the core backend refuses an increase.
//
// `/cart/update` can answer `success: true` with `data.status: 0` — the core
// backend saying no, almost always because the stock ran out since the page
// loaded. There is no error to show, so before this the number just rolled back
// and the shopper was told nothing.
//
// The offer here is the product page's own: `auth.NotifyForProducts`
// (services/auth.ts) subscribes to the topic `product_availability_<id>`, the
// same topic "Notify Me When Variant Is Available" uses. So a shopper who asked
// on one screen counts as asked on the other, and the check below reads the
// list the backend confirmed rather than a flag this screen keeps for itself.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import Spinner from "components/global/Spinner";
import auth from "services/auth";
import home from "services/home";
import { useAppStore } from "store";
import { showErrorNotification } from "@/store/notifications/reducer";

/** The notify purple the product page uses for the same offer. */
const NOTIFY_COLOR = "#513AAF";

function NotifyWhenAvailableModal({ product, translate, isRtl, onClose }) {
  const { firebaseSettings } = useAppStore();
  const [loading, setLoading] = useState(false);
  // True while the shopper's notification settings are being read. Notify stays
  // out of reach until then, so nobody can subscribe to something they have.
  const [readingSettings, setReadingSettings] = useState(true);
  // Set once the backend confirms the subscription, so the shopper sees the
  // answer without waiting for the next read of the settings.
  const [justSubscribed, setJustSubscribed] = useState(false);

  const productId = product?.product_id ?? product?.id;
  const variantId = product?.product_variation_id ?? null;

  // The backend subscribes per variant (services/home.ts:538-556), so a stored
  // entry that names a different variant does not cover this row. An entry that
  // names no variant covers the whole product, which is what
  // `NotifyForProducts` sends when the row has no variant at all.
  const alreadySubscribed =
    justSubscribed ||
    Boolean(
      firebaseSettings?.subscribed_topics?.some((s) => {
        if (s?.topic !== `product_availability_${productId}`) return false;
        if (s?.variant === undefined || s?.variant === null) return true;
        return String(s.variant) === String(variantId);
      }),
    );

  // Read the shopper's notification settings when the prompt opens. The cart
  // page never loads them for itself, so the store can hold an empty list for a
  // shopper who is already subscribed — and they would be offered Notify again,
  // every time. The product page reads them on mount for the same reason
  // (components/products/MoreOptionsSection.tsx:131-136).
  useEffect(() => {
    let stillOpen = true;
    (async () => {
      try {
        await home.GetFireBaseSettings();
      } finally {
        if (stillOpen) setReadingSettings(false);
      }
    })();
    return () => {
      stillOpen = false;
    };
  }, []);

  // Escape closes it. The document's own scroll lock is left alone on purpose:
  // `DisableScroll()` also sends the page to the top, which would lose the
  // shopper's place in the bag, and `EnableScroll()` on close would undo a lock
  // the cart page itself put there.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const subscribe = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // The browser prompt has to be asked for inside the click, before any
      // other await — see the note in services/home.ts > AllowNotifications.
      const fbtoken = await home.AllowNotifications();
      // No token means the backend has no device to send to. Painting "we will
      // tell you" here is a promise nothing can keep.
      if (!fbtoken) {
        throw new Error(
          translate(
            "Notification Is Not Enabled! please Allow Notification Access",
          ),
        );
      }
      const res = await auth.NotifyForProducts({
        id: productId,
        variant: product?.product_variation_id,
      });
      if (res?.success === false) {
        throw new Error(res?.message);
      }
      setJustSubscribed(true);
      await home.GetFireBaseSettings();
    } catch (error) {
      showErrorNotification(
        error?.message ??
          translate(
            "Notification Is Not Enabled! please Allow Notification Access",
          ),
      );
    }
    setLoading(false);
  };

  // Drawn on <body>, not inside the cart row. The row sits under stacked,
  // positioned controls (the plus, minus and delete icons, the price block),
  // and inside it the prompt joins that contest and loses however high its
  // z-index is — the winner is decided inside the row's own stacking context. A
  // portal takes it out of that contest entirely.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-999999999999 flex items-center justify-center bg-black/40 px-[24px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={translate("We Could Not Add More Of This Product")}
      data-pw="notify-when-available-modal"
    >
      <div
        className="bg-white w-full max-w-[340px] flex-col rounded-[20px] shadow-xl overflow-hidden p-[24px] items-center"
        style={{ direction: isRtl ? "rtl" : "ltr" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="w-[56px] h-[56px] rounded-[20px] flex items-center justify-center mb-[16px]"
          style={{ backgroundColor: "#F4F2FD" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 25 25"
            aria-hidden="true"
          >
            <path
              d="M23.438,10.938a.521.521,0,0,1-.521-.521,11.381,11.381,0,0,0-3.356-8.1.521.521,0,1,1,.736-.736,12.414,12.414,0,0,1,3.661,8.839A.521.521,0,0,1,23.438,10.938Z"
              fill={NOTIFY_COLOR}
            />
            <path
              d="M1.563,10.938a.521.521,0,0,1-.521-.521A12.414,12.414,0,0,1,4.7,1.578a.521.521,0,1,1,.736.736,11.381,11.381,0,0,0-3.356,8.1.521.521,0,0,1-.521.521Z"
              fill={NOTIFY_COLOR}
            />
            <path
              d="M14.062,4.354a.521.521,0,0,1-.521-.521V2.083a1.042,1.042,0,1,0-2.083,0v1.75a.521.521,0,1,1-1.042,0V2.083a2.083,2.083,0,0,1,4.167,0v1.75A.52.52,0,0,1,14.062,4.354Z"
              fill={NOTIFY_COLOR}
            />
            <path
              d="M12.5,25a3.65,3.65,0,0,1-3.646-3.646.521.521,0,1,1,1.042,0,2.6,2.6,0,0,0,5.208,0,.521.521,0,1,1,1.042,0A3.65,3.65,0,0,1,12.5,25Z"
              fill={NOTIFY_COLOR}
            />
            <path
              d="M21.354,21.875H3.646a1.563,1.563,0,0,1-1.016-2.75,7.242,7.242,0,0,0,2.578-5.544V10.417a7.292,7.292,0,0,1,14.583,0v3.165a7.234,7.234,0,0,0,2.57,5.536,1.563,1.563,0,0,1-1.007,2.757ZM12.5,4.167a6.256,6.256,0,0,0-6.25,6.25v3.165a8.276,8.276,0,0,1-2.939,6.332.521.521,0,0,0,.334.92H21.354a.521.521,0,0,0,.339-.917,8.282,8.282,0,0,1-2.943-6.335V10.417a6.256,6.256,0,0,0-6.25-6.25Z"
              fill={NOTIFY_COLOR}
            />
          </svg>
        </div>

        <h3
          className="text-[16px] medium text-[#1D1D1D] text-center"
          data-pw="notify-modal-title"
        >
          {translate("We Could Not Add More Of This Product")}
        </h3>

        <p
          className="text-[13px] regular text-[#8D8D8D] text-center mt-[8px] mb-[20px]"
          data-pw="notify-modal-message"
        >
          {alreadySubscribed
            ? translate("You will be notified for this product already")
            : translate("Do You Want Us To Notify You When It Is Available?")}
        </p>

        <div className="flex-row w-full gap-[10px] justify-center min-h-[44px] items-center">
          {loading || readingSettings ? (
            <Spinner />
          ) : alreadySubscribed ? (
            <button
              type="button"
              className="w-full h-[44px] rounded-[14px] text-[14px] medium text-white"
              style={{ backgroundColor: NOTIFY_COLOR }}
              onClick={onClose}
              data-pw="notify-modal-close"
            >
              {translate("Close")}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="flex-1 h-[44px] rounded-[14px] text-[14px] regular text-[#8D8D8D] bg-[#F8F8F8]"
                onClick={onClose}
                data-pw="notify-modal-cancel"
              >
                {translate("Cancel")}
              </button>
              <button
                type="button"
                className="flex-1 h-[44px] rounded-[14px] text-[14px] medium text-white"
                style={{ backgroundColor: NOTIFY_COLOR }}
                onClick={subscribe}
                data-pw="notify-modal-notify"
              >
                {translate("Notify Me")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default NotifyWhenAvailableModal;
