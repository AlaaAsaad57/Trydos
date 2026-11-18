"use client";

import React, { useState } from "react";
import { useDemoData, type DemoAddress } from "../../DemoApp/DemoData";
import { bagLook, bagTotal, inBag, type DemoBagItem } from "../../DemoApp/demoBag";
import { countryOf } from "../../DemoApp/demoPlaces";
import { WALLET_RECIPIENT } from "../../DemoApp/demoWallet";
import { useDemoNav } from "../screenNav";
import { useDemoCase } from "../demoCase";
import { C, SHEET } from "../demo1Layout";
import { Sheet, useCanvasEnd } from "../ui";
import CartAddressSheet from "./CartAddressSheet";
import DeliveryMethodSheet, { CENTRES, SHEET_Z, type DeliveryPlace } from "./DeliveryMethodSheet";
import PaymentMethodSheet from "./PaymentMethodSheet";
import { CheckoutPage, type BagPhoto, type CheckoutAddress, type PickupView } from "./CheckoutPage";
import { demoBagView } from "./CartScreen";
import type { T } from "./ListingParts";
import { RULES_TOP, Safe } from "./WalletCashInSheet";

/**
 * The checkout on /demo: the demo's bag and profile, drawn by the design
 * (CheckoutPage, XD `Home Page – 56` to `– 86`). The real app draws the
 * shopper's checkout with the same design (AppCheckout).
 *
 * The file's flow: the address, a pickup centre, then the wallet (`– 80`, or
 * `– 83` when its 120 USD do not cover the bag) or the rdb invoice by QR
 * (`– 85`). The invoice shows the terms; agreed (`– 86`), "Checkout /
 * Complete" opens the purchase done (`– 103`). The file draws the purchase
 * done for the invoice only, so the wallet's button does nothing yet.
 *
 * The address sheet is the real one since the `development` merge (it saves
 * to the backend). Here a chosen address stands for the demo's first one.
 */
export default function CheckoutScreen() {
  const { bag, profile, update } = useDemoData();
  const { t, body } = useDemoCase();
  const { navigate } = useDemoNav();
  const [choosing, setChoosing] = useState(false);
  const [choosingMethod, setChoosingMethod] = useState(false);
  const [choosingPayment, setChoosingPayment] = useState(false);
  const [reading, setReading] = useState(false);
  const end = useCanvasEnd(reading);
  // An address deleted on the profile is no longer the bag's.
  const address = profile.addresses.find((a) => a.id === profile.shippingAddress) ?? null;
  const centre = address ? (CENTRES.find((c) => c.id === profile.pickupCentre) ?? null) : null;
  const method = centre ? profile.paymentMethod : null;
  // `– 80` when the wallet covers the bag, `– 83` when it does not.
  const covered = method === "wallet" && profile.walletUsd >= bagTotal(bag);
  // `– 86`: the invoice, with the policies and terms agreed to.
  const agreed = method === "invoice" && profile.agreedTerms;
  const receiver = `${profile.name || WALLET_RECIPIENT.name} . ${profile.phone}`;
  return (
    <CheckoutPage
      sums={demoBagView(bag, t).sums}
      photos={demoPhotos(inBag(bag))}
      address={address ? demoCheckoutAddress(address, t) : null}
      pickup={address && centre ? demoPickup(address, centre.place, receiver, t) : null}
      delivered={false}
      payment={method}
      wallet={{ balance: String(profile.walletUsd), currency: t("USD"), covered }}
      showTerms={method === "invoice"}
      agreed={agreed}
      ready={covered || agreed}
      onChooseAddress={() => setChoosing(true)}
      onChooseMethod={() => setChoosingMethod(true)}
      onChoosePayment={() => setChoosingPayment(true)}
      onTopUp={() => navigate("settings/wallet")}
      onReadTerms={() => setReading(true)}
      onComplete={() => {
        if (!agreed) return;
        update({ orderedAt: Date.now() });
        navigate("cart/done");
      }}
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
                update({ agreedTerms: true });
                setReading(false);
              }}
              onCancel={() => {
                update({ agreedTerms: false });
                setReading(false);
              }}
            />
          </Sheet>
          {address && (
            <DeliveryMethodSheet
              open={choosingMethod}
              place={demoPlace(address, t)}
              onClose={() => setChoosingMethod(false)}
              onDone={(choice) => {
                if (choice.kind === "centre") update({ pickupCentre: choice.id });
                setChoosingMethod(false);
              }}
            />
          )}
          <CartAddressSheet
            open={choosing}
            onClose={() => setChoosing(false)}
            onChosen={() => {
              // The centres belong to the old address's town, so that choice goes.
              update({
                shippingAddress: profile.addresses[0]?.id ?? null,
                pickupCentre: null,
                paymentMethod: null,
                agreedTerms: false,
              });
              setChoosing(false);
            }}
          />
          <PaymentMethodSheet
            open={choosingPayment}
            balance={profile.walletUsd}
            onClose={() => setChoosingPayment(false)}
            onDone={(chosen) => {
              // The terms are agreed to for one way to pay.
              update({ paymentMethod: chosen, agreedTerms: false });
              setChoosingPayment(false);
            }}
          />
        </>
      }
    />
  );
}

/** The bag card's photos. */
export function demoPhotos(items: readonly DemoBagItem[]): BagPhoto[] {
  return items.map((item) => {
    const { product, photo } = bagLook(item);
    return { id: item.id, src: photo, alt: product.name.join(" ") };
  });
}

/** The demo address as the checkout's card writes it: "El Jamiliya |" and "Aleppo | Syria". */
export function demoCheckoutAddress(address: DemoAddress, t: T): CheckoutAddress {
  // The address stores street, neighbourhood, district, province.
  const [, town, , province] = address.area;
  return {
    title: address.title,
    regular: town,
    medium: `${province} | ${t(countryOf(address.country).name)}`,
    detail: address.detail,
  };
}

/** The pickup card's lines (`– 75`). */
export function demoPickup(address: DemoAddress, centrePlace: string, receiver: string, t: T): PickupView {
  const province = address.area[3];
  return { place: `${centrePlace} | ${province} | ${t(countryOf(address.country).name)}`, receiver };
}

/** The place under the delivery sheet's title: "Syria | Aleppo | El Jamiliya". */
function demoPlace(address: DemoAddress, t: T): DeliveryPlace {
  const [, town, , province] = address.area;
  const country = countryOf(address.country);
  return { flag: country.flag, country: t(country.name), rest: ` | ${province} | ${town}` };
}
