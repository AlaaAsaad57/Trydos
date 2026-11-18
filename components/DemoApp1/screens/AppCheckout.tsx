"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import order from "services/order";
import { loginHref } from "utils/loginPath";
import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";
import { agreeToTerms, placeWalletOrder, retryBag } from "components/Cart/bagActions";
import { useAppStore } from "store";
import { useDemoNav } from "../screenNav";
import { useDemoCase } from "../demoCase";
import { C, SHEET } from "../demo1Layout";
import { Sheet, useCanvasEnd } from "../ui";
import { useBagData } from "../useBagData";
import { useProfileData } from "../useProfileData";
import { checkoutAddress, deliveryPlace, photosOf } from "../checkoutData";
import { BagSkeleton } from "../ScreenSkeleton";
import CartAddressSheet from "./CartAddressSheet";
import DeliveryMethodSheet, { SHEET_Z } from "./DeliveryMethodSheet";
import PaymentMethodSheet from "./PaymentMethodSheet";
import { CheckoutPage, type CheckoutPayment } from "./CheckoutPage";
import { RULES_TOP, Safe } from "./WalletCashInSheet";

/**
 * The checkout on the real app: `/[lang]/cart/checkout` (Stage 7d). The page
 * sends a guest to the login first (A-27), so the shopper here is signed in.
 *
 * The design is CheckoutPage (XD `Home Page – 56` to `– 86`), with real data:
 *  - the bag card: the real sum and photos (useBagData);
 *  - the address: the shopper's default address, the one the order goes to
 *    (as the old checkout). The address sheet lists the real addresses and
 *    adds one with the real form; a chosen one becomes the default;
 *  - the delivery: "Delivery to address" (S7d-2; pickup is "Soon available");
 *  - the payment: the Trydos wallet only (S7d-3). Its balance is "Soon
 *    available", so the card is `– 80`; the core backend checks the balance;
 *  - the terms under the wallet card (S7d-6), with the old agreement call;
 *  - "Checkout / Complete": purple once the terms are agreed. It runs the
 *    old checks and places the order (bagActions.placeWalletOrder), then
 *    opens the purchase done.
 *
 * Cash on delivery and the coupon are not shown (S7d-7, their code is kept).
 */
export default function AppCheckout() {
  const { t, body } = useDemoCase();
  const { navigate, locale } = useDemoNav();
  const router = useRouter();
  const pathname = usePathname();
  const bag = useBagData();
  const profile = useProfileData();
  const agreed = useAppStore((s) => s.orderData?.agree === true);
  const placing = useAppStore((s) => s.orderData?.loading === true);
  const [choosing, setChoosing] = useState(false);
  const [choosingMethod, setChoosingMethod] = useState(false);
  const [choosingPayment, setChoosingPayment] = useState(false);
  const [reading, setReading] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [payment, setPayment] = useState<CheckoutPayment | null>(null);
  const end = useCanvasEnd(reading);
  const language = locale.split("-")[1] ?? "en";

  useEffect(() => {
    // A reload on this path: the store has no cart yet, so it is read again.
    if (useAppStore.getState().cart.length === 0) void retryBag();
    trackOrder(ORDER_EVENTS.CHECKOUT_ADDRESS_SCREEN_VIEWED, {
      has_saved_address: profile.defaultAddress !== null,
    });
    // The agreement is for this checkout only.
    useAppStore.getState().setOrderData({ agree: false });
  }, []);

  const address = profile.defaultAddress;
  // A new address: the delivery, the payment and the terms are chosen again.
  const [addressId, setAddressId] = useState<number | null>(address?.id ?? null);
  if ((address?.id ?? null) !== addressId) {
    setAddressId(address?.id ?? null);
    setDelivered(false);
    setPayment(null);
  }

  const empty = bag.view.items.length === 0;
  if (empty && (bag.loading || !profile.addressesLoaded)) return <BagSkeleton />;

  const ready = address !== null && delivered && payment === "wallet" && agreed && !placing && !empty;

  const complete = async () => {
    if (!ready) return;
    const outcome = await placeWalletOrder();
    if (outcome === "done") navigate("cart/done");
    else if (outcome === "verify") router.push(loginHref(locale, pathname));
    else if (outcome === "bag") navigate("cart");
  };

  return (
    <CheckoutPage
      sums={bag.view.sums}
      photos={photosOf(bag.view)}
      address={address ? checkoutAddress(address, language) : null}
      pickup={null}
      delivered={delivered}
      payment={payment}
      wallet={{ balance: null, currency: bag.view.sums.currency, covered: true }}
      showTerms
      agreed={agreed}
      ready={ready}
      onChooseAddress={() => setChoosing(true)}
      onChooseMethod={() => setChoosingMethod(true)}
      onChoosePayment={() => setChoosingPayment(true)}
      onTopUp={() => navigate("settings/wallet")}
      onReadTerms={() => setReading(true)}
      onComplete={() => void complete()}
      t={t}
      body={body}
      sheets={
        <>
          <Sheet
            open={reading}
            onClose={() => setReading(false)}
            y={RULES_TOP}
            radius={SHEET.radiusWallet}
            fit
            outline={C.sheetEdge}
            z={SHEET_Z}
            testId="demo-checkout-policies-sheet"
          >
            <Safe
              policies
              end={end}
              testId="demo-checkout-policies"
              onAgree={() => {
                setReading(false);
                void agreeToTerms(true);
              }}
              onCancel={() => {
                setReading(false);
                void agreeToTerms(false);
              }}
            />
          </Sheet>
          {address && (
            <DeliveryMethodSheet
              open={choosingMethod}
              place={deliveryPlace(address, language)}
              real
              onClose={() => setChoosingMethod(false)}
              onDone={(choice) => {
                if (choice.kind === "address") setDelivered(true);
                setChoosingMethod(false);
              }}
            />
          )}
          <CartAddressSheet
            open={choosing}
            onClose={() => setChoosing(false)}
            onChosen={(id) => {
              setChoosing(false);
              void chooseAddress(id);
            }}
          />
          <PaymentMethodSheet
            open={choosingPayment}
            balance={null}
            real
            onClose={() => setChoosingPayment(false)}
            onDone={(chosen) => {
              setPayment(chosen);
              // The terms are agreed to for one way to pay.
              void agreeToTerms(false);
              setChoosingPayment(false);
            }}
          />
        </>
      }
    />
  );
}

/**
 * An address was chosen (or added) in the sheet: it becomes the default, the
 * address the order goes to (`order.SetDefault`, as the old address list),
 * and the list is read again. An added address with no id in the answer is
 * already in the list the form read again.
 */
async function chooseAddress(id: number | undefined) {
  if (id !== undefined) await order.SetDefault({ id });
  await order.GetAddressList();
}
