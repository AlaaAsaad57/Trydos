"use client";
// The logic of the question the bag asks when the core backend refuses an
// increase (see NotifyWhenAvailableModal). The old prompt and the new bag's
// sheet (Stage 7d, S7d-11) both draw it.
//
// `/cart/update` can answer `success: true` with `data.status: 0` — the core
// backend saying no, almost always because the stock ran out since the page
// loaded. The offer is the product page's own: `auth.NotifyForProducts`
// (services/auth.ts) subscribes to the topic `product_availability_<id>`, the
// same topic "Notify Me When Variant Is Available" uses. So a shopper who asked
// on one screen counts as asked on the other, and the check below reads the
// list the backend confirmed rather than a flag this screen keeps for itself.
import { useEffect, useState } from "react";

import auth from "services/auth";
import home from "services/home";
import { useAppStore } from "store";
import { showErrorNotification } from "@/store/notifications/reducer";

export function useNotifyWhenAvailable(product: any, translate: (key: string) => string) {
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
      firebaseSettings?.subscribed_topics?.some((s: any) => {
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
    } catch (error: any) {
      showErrorNotification(
        error?.message ??
          translate(
            "Notification Is Not Enabled! please Allow Notification Access",
          ),
      );
    }
    setLoading(false);
  };

  return { alreadySubscribed, loading, readingSettings, subscribe };
}
