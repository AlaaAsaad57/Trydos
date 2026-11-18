"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "store";
import { getCart, RoundPrice } from "utils/functions";
import { orderDoneEvents } from "components/Cart/bagActions";
import { checkoutAddress, clockTime, photosOf } from "../checkoutData";
import { useDemoNav } from "../screenNav";
import { useDemoCase } from "../demoCase";
import { useBagData } from "../useBagData";
import { useProfileData } from "../useProfileData";
import { OrderDonePage } from "./OrderDonePage";

/**
 * The purchase done on the real app: `/[lang]/cart/done` (Stage 7d, S7d-5).
 *
 * The design is OrderDonePage (XD `Home Page – 103`), with the placed order:
 * its number (`order_group_id`), the time it was placed, and its invoice (the
 * sum of the orders' `order_amount`, by the price rule the bag charges with).
 * Under the bag card: the address the order goes to (the checkout's address
 * card) and the wallet (the checkout's wallet card), with no line.
 *
 * On its first draw it sends the old success screen's events
 * (bagActions.orderDoneEvents), then reads the cart again: the core backend
 * emptied it. "Done" goes to Home.
 *
 * With no placed order in the store (this path opened by hand, or a reload)
 * there is nothing to show, so the screen goes to the bag.
 */
export default function AppOrderDone() {
  const { t, body } = useDemoCase();
  const { navigate, locale } = useDemoNav();
  const language = locale.split("-")[1] ?? "en";
  const orderData = useAppStore((s) => s.orderData) as any;
  const currency = useAppStore((s) => s.currency) as any;
  const bag = useBagData();
  const profile = useProfileData();
  // The bag as it was ordered: kept from the first draw, before the cart is read again.
  const [ordered] = useState(() => ({ view: bag.view, at: new Date() }));
  const placed = orderData?.success === true;

  useEffect(() => {
    if (!placed) {
      navigate("cart");
      return;
    }
    orderDoneEvents();
    void getCart({
      callback: ([data]) => useAppStore.getState().initCart(data ?? { cart: [] }),
    });
  }, []);

  if (!placed) return null;
  const rows: any[] = Array.isArray(orderData.data) ? orderData.data : [];
  const amount = rows.reduce((sum, row) => sum + (Number(row?.order_amount) || 0), 0);
  const address = profile.defaultAddress;

  return (
    <OrderDonePage
      number={String(rows[0]?.order_group_id ?? "")}
      time={clockTime(ordered.at)}
      invoice={{
        amount: String(
          RoundPrice({
            charged: true,
            num: amount,
            rate: currency?.exchange_rate,
            points: currency?.decimal_digits,
            language,
            returnNumber: true,
          }),
        ),
        currency: ordered.view.sums.currency,
      }}
      sums={ordered.view.sums}
      photos={photosOf(ordered.view)}
      address={address ? checkoutAddress(address, language) : null}
      pickup={null}
      payment="wallet"
      wallet={{ balance: null, currency: ordered.view.sums.currency, covered: true }}
      onDone={() => navigate("home")}
      t={t}
      body={body}
    />
  );
}
