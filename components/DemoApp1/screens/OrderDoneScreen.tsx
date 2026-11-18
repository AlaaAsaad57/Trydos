"use client";

import React from "react";
import { useDemoData } from "../../DemoApp/DemoData";
import { bagTotal, inBag } from "../../DemoApp/demoBag";
import { WALLET_RECIPIENT } from "../../DemoApp/demoWallet";
import { useDemoNav } from "../screenNav";
import { useDemoCase } from "../demoCase";
import { clockTime } from "../checkoutData";
import { CENTRES } from "./DeliveryMethodSheet";
import { demoBagView } from "./CartScreen";
import { demoCheckoutAddress, demoPhotos, demoPickup } from "./CheckoutScreen";
import { OrderDonePage } from "./OrderDonePage";

/** The file's order number: a sample, kept as the demo's. */
const ORDER_NUMBER = "TTISA10012";

/**
 * The purchase done on /demo (XD `Home Page – 103`), drawn by the design
 * (OrderDonePage). The file's order number and invoice are a sample: the demo
 * keeps the number, and the invoice is half of the bag's sum, as in the file
 * (160 USD for a 320 USD bag). "Done" goes to Home.
 */
export default function OrderDoneScreen() {
  const { bag, profile } = useDemoData();
  const { t, body } = useDemoCase();
  const { navigate } = useDemoNav();
  const address = profile.addresses.find((a) => a.id === profile.shippingAddress) ?? null;
  const centre = address ? (CENTRES.find((c) => c.id === profile.pickupCentre) ?? null) : null;
  const receiver = `${profile.name || WALLET_RECIPIENT.name} . ${profile.phone}`;
  return (
    <OrderDonePage
      number={ORDER_NUMBER}
      time={clockTime(new Date(profile.orderedAt ?? Date.now()))}
      invoice={{ amount: String(bagTotal(bag) / 2), currency: t("USD") }}
      sums={demoBagView(bag, t).sums}
      photos={demoPhotos(inBag(bag))}
      address={address ? demoCheckoutAddress(address, t) : null}
      pickup={address && centre ? demoPickup(address, centre.place, receiver, t) : null}
      payment={profile.paymentMethod}
      wallet={{ balance: String(profile.walletUsd), currency: t("USD"), covered: true }}
      onDone={() => navigate("home")}
      t={t}
      body={body}
    />
  );
}
