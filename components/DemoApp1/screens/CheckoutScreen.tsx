"use client";

import React, { useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoData, type DemoAddress } from "../../DemoApp/DemoData";
import { bagLook, inBag } from "../../DemoApp/demoBag";
import { countryOf } from "../../DemoApp/demoPlaces";
import { WALLET_RECIPIENT } from "../../DemoApp/demoWallet";
import { useDemoCase } from "../demoCase";
import { C, fill, textBottom, textTop } from "../demo1Layout";
import { Box, ScreenPage, Txt } from "../ui";
import CartAddressSheet from "./CartAddressSheet";
import DeliveryMethodSheet, { BRAND, CENTRES } from "./DeliveryMethodSheet";
import PaymentMethodSheet from "./PaymentMethodSheet";
import { BagHeader, BagPanel, BagSum, LINE_13 } from "./CartParts";
import { Rich, type T } from "./ListingParts";

/**
 * The checkout, XD `Home Page – 56`: opened by "Confirm & continue" on the bag.
 *
 *  - The same header as the bag.
 *  - A card (12, 112), 406 x 80: the small bag, "Shopping bag" and the count
 *    with the sum on the left; the items' photos, 43 x 64, at the right.
 *  - The shipping section: the rocket and the map, the title with its help
 *    mark, a purple line asking for the address, and a dashed purple box
 *    holding the dark "Choose delivery Address" button.
 *  - The bottom panel with the sum and "Checkout / Complete", grey until the
 *    whole checkout is done (delivery and payment are boards `– 72` on).
 *
 * "Choose delivery Address" opens the address sheet (`– 70`, CartAddressSheet).
 * With an address chosen the screen is `– 76`: the purple line turns into
 * "We will send your Package to below address" in black, the address card
 * (406 x 76 at y 284) comes under it, and the dashed box moves 8 under the
 * card with "Choose Delivery Method", which opens the delivery method sheet
 * (`– 72` and `– 77`, DeliveryMethodSheet).
 *
 * With a pickup centre chosen there, the screen is `– 75`: the address card
 * becomes the pickup card (406 x 96: the centre, and who collects), and the
 * payment section comes under it with "Choose Payment Method", which opens
 * the payment method sheet (`– 73`, PaymentMethodSheet).
 */
export default function CheckoutScreen() {
  const { bag, profile, update } = useDemoData();
  const { t } = useDemoCase();
  const [choosing, setChoosing] = useState(false);
  const [choosingMethod, setChoosingMethod] = useState(false);
  const [choosingPayment, setChoosingPayment] = useState(false);
  const items = inBag(bag);
  // An address deleted on the profile is no longer the bag's.
  const address = profile.addresses.find((a) => a.id === profile.shippingAddress) ?? null;
  const centre = address ? (CENTRES.find((c) => c.id === profile.pickupCentre) ?? null) : null;
  return (
    <ScreenPage testId="demo-checkout" header={<BagHeader bag={bag} t={t} />}>
      {/* The card: `#FCFCFC`, a grey 0.5 px line, round 15. */}
      <Box
        mt={112 - 100}
        ml={12}
        w={fill(12)}
        h={80}
        radius={15}
        fill={C.card}
        stroke={C.line}
        className="flex flex-col"
        data-pw="demo-checkout-bag-card"
      >
        <XdIcon name="cartCardBag" className="shrink-0" style={{ marginLeft: 24 - 12, marginTop: 120 - 112 }} />
        <Txt size={11} color={C.grey} ml={24 - 12} mt={textTop(159, 11) - 140}>
          <Rich text={t("Shopping <b>bag</b>")} />
        </Txt>
        <Txt size={13} ml={24 - 12} mt={textTop(181, 13) - (textTop(159, 11) + 14)} data-pw="demo-checkout-bag-sum">
          <BagSum bag={bag} t={t} />
        </Txt>
        {/* The photos, 43 x 64, round 6, 2 apart, 8 px from the card's top and right; the first item at the far right. */}
        <ul className="absolute flex flex-row-reverse p-0 m-0 list-none" style={{ right: 418 - 410, top: 120 - 112, gap: 367 - 365 }}>
          {items.map((item) => {
            const { product, photo } = bagLook(item);
            return (
              <li key={item.id} className="shrink-0 overflow-hidden" style={{ width: 43, height: 64, borderRadius: 6 }}>
                <img src={photo} alt={product.name.join(" ")} draggable={false} decoding="async" className="block w-full h-full object-cover" />
              </li>
            );
          })}
        </ul>
      </Box>

      <Shipping
        t={t}
        address={address}
        centre={centre}
        // The file shows a client with a name; a new demo client has none yet (as Wallet Info).
        receiver={`${profile.name || WALLET_RECIPIENT.name} . ${profile.phone}`}
        onChoose={() => setChoosing(true)}
        onChooseMethod={() => setChoosingMethod(true)}
      />
      {centre && <Payment t={t} onChoose={() => setChoosingPayment(true)} />}
      {address && (
        <DeliveryMethodSheet
          open={choosingMethod}
          address={address}
          onClose={() => setChoosingMethod(false)}
          onDone={(id) => {
            update({ pickupCentre: id });
            setChoosingMethod(false);
          }}
        />
      )}
      <CartAddressSheet
        open={choosing}
        onClose={() => setChoosing(false)}
        onChosen={(id) => {
          // The centres belong to the old address's town, so that choice goes.
          update({ shippingAddress: id, pickupCentre: null });
          setChoosing(false);
        }}
      />
      <PaymentMethodSheet open={choosingPayment} onClose={() => setChoosingPayment(false)} />

      {/* Room for the panel, so the box above it is never under it. */}
      <div aria-hidden="true" className="shrink-0" style={{ height: 931 - 818 + 12 }} />
      <BagPanel
        bag={bag}
        tabBar={false}
        testId="demo-checkout-panel"
        button={{ label: t("Checkout / Complete"), fill: C.hint, disabled: true, testId: "demo-checkout-complete" }}
        t={t}
      />
    </ScreenPage>
  );
}

/**
 * The shipping section: the marks at y 212, the title on baseline 253, the
 * line on 273, then the dashed box at y 284 (`– 56`); or the address card at
 * y 284 and the dashed box at y 368 (`– 76`); or the pickup card at y 284
 * and no box (`– 75`).
 */
function Shipping({
  t,
  address,
  centre,
  receiver,
  onChoose,
  onChooseMethod,
}: {
  t: T;
  address: DemoAddress | null;
  centre: Centre | null;
  /** Who collects the bag: "name . phone". */
  receiver: string;
  onChoose: () => void;
  onChooseMethod: () => void;
}) {
  return (
    <section aria-label={t("Shipping & delivery Address")} className="flex flex-col shrink-0">
      <SectionHead
        marks={
          <>
            <XdIcon name="cartRocket" className="shrink-0" />
            <XdIcon name="cartMap" className="shrink-0" style={{ marginLeft: 50 - (24.16 + 19.68), marginTop: 212.15 - 212.44 }} />
          </>
        }
        marksMt={212.44 - 192}
        marksX={24.16}
        marksEnd={212.44 + 20}
        title={t("Shipping & delivery Address")}
        titleBaseline={253}
        helpX={201}
        helpLabel={t("Help")}
        line={
          address
            ? t("We will send your Package to below address")
            : t("Please Select your shipping address to receive Your Package")
        }
        lineColor={address ? C.ink : C.purple}
        lineTestId="demo-checkout-address-line"
      />
      {address && centre && <PickupCard address={address} centre={centre} receiver={receiver} t={t} />}
      {address && !centre && <AddressCard address={address} t={t} />}
      {!centre && (
        <ChooseBox
          mt={address ? 368 - 360 : 284 - textBottom(273, 11)}
          boxTestId="demo-checkout-address-box"
          testId={address ? "demo-checkout-choose-method" : "demo-checkout-choose-address"}
          onClick={address ? onChooseMethod : onChoose}
          label={address ? t("Choose Delivery Method") : t("Choose delivery Address")}
        />
      )}
    </section>
  );
}

/**
 * The payment section, `– 75`: the 20 px phone at (24, 400), 20 under the
 * pickup card; then, as in the shipping section, the title on baseline 441
 * with the help mark at x 135, the purple line on 461, and the dashed box at
 * y 472 with "Choose Payment Method".
 */
function Payment({ t, onChoose }: { t: T; onChoose: () => void }) {
  return (
    <section aria-label={t("Payment Method")} className="flex flex-col shrink-0">
      <SectionHead
        marks={<XdIcon name="payPhoneSmall" className="shrink-0" />}
        marksMt={400 - (284 + 96)}
        marksX={24.06}
        marksEnd={400 + 20}
        title={t("Payment Method")}
        titleBaseline={441}
        helpX={135}
        helpLabel={t("Help")}
        line={t("Please choose your payment method about your bag")}
        lineColor={C.purple}
        lineTestId="demo-checkout-payment-line"
      />
      <ChooseBox
        mt={472 - textBottom(461, 11)}
        boxTestId="demo-checkout-payment-box"
        testId="demo-checkout-choose-payment"
        onClick={onChoose}
        label={t("Choose Payment Method")}
      />
    </section>
  );
}

/**
 * A section's head: its marks (20 px tall), the title (13) with the grey help
 * mark 6 px after it, and the 11 px line on the baseline 20 px under the
 * title's.
 */
function SectionHead({
  marks,
  marksMt,
  marksX,
  marksEnd,
  title,
  titleBaseline,
  helpX,
  helpLabel,
  line,
  lineColor,
  lineTestId,
}: {
  marks: React.ReactNode;
  /** From the block above to the marks' top. */
  marksMt: number;
  marksX: number;
  /** Design y of the marks' bottom edge. */
  marksEnd: number;
  title: string;
  titleBaseline: number;
  /** The help mark's x in the file. */
  helpX: number;
  helpLabel: string;
  line: string;
  lineColor: string;
  lineTestId: string;
}) {
  return (
    <>
      <div className="flex items-start" style={{ marginTop: marksMt, marginLeft: marksX }}>
        {marks}
      </div>
      <div className="flex items-start" style={{ marginTop: textTop(titleBaseline, 13) - marksEnd, marginLeft: 24 }}>
        {/* The help mark sits at the file's x: the title keeps that room, whatever width the browser gives the words. */}
        <h2 className="m-0 font-normal whitespace-nowrap" style={{ minWidth: helpX - 6 - 24, color: C.ink, ...LINE_13 }}>
          {title}
        </h2>
        <span role="img" aria-label={helpLabel} className="block shrink-0" style={{ marginLeft: 6 }}>
          <XdIcon name="cartHelpGrey" />
        </span>
      </div>
      <Txt
        size={11}
        color={lineColor}
        ml={24}
        mt={textTop(titleBaseline + 20, 11) - (textTop(titleBaseline, 13) + 16)}
        className="overflow-hidden text-ellipsis"
        data-pw={lineTestId}
      >
        {line}
      </Txt>
    </>
  );
}

/** The dashed box: `#FCFCFC`, a purple 0.5 px line dashed 3 3, round 15; the dark button 20 px in and 15 down. */
function ChooseBox({
  mt,
  boxTestId,
  testId,
  onClick,
  label,
}: {
  mt: number;
  boxTestId: string;
  testId: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <Box
      mt={mt}
      ml={12}
      w={fill(12)}
      h={70}
      radius={15}
      fill={C.card}
      stroke={C.purple}
      strokeDash="3 3"
      strokeDashCap="round"
      className="flex flex-col"
      data-pw={boxTestId}
    >
      <button
        type="button"
        data-pw={testId}
        onClick={onClick}
        className="flex items-center justify-center shrink-0 cursor-pointer active:opacity-80 [-webkit-tap-highlight-color:transparent] font-medium whitespace-nowrap"
        style={{
          marginTop: 299 - 284,
          marginLeft: 32 - 12,
          width: `calc(100% - ${2 * (32 - 12)}px)`,
          height: 40,
          borderRadius: 15,
          background: C.ink,
          color: C.white,
          ...LINE_13,
        }}
      >
        {label}
      </button>
    </Box>
  );
}

type Centre = (typeof CENTRES)[number];

/**
 * The chosen pickup centre, `– 75`: a 406 x 96 card at y 284, `#FCFCFC` with
 * a grey 0.5 px line, round 15, the 16 px map at its top right (390, 292).
 * From x 24: "Pickup | Collect Point" (13, "Pickup" Medium, baseline 305),
 * the centre's place (13, baseline 329: "trydos Center | Jamiliya | Aleppo |
 * Syria", "try" Medium), who collects it (11, baseline 349), and "You will
 * collect your shipment yourself from center" (11 Medium, baseline 369).
 */
function PickupCard({ address, centre, receiver, t }: { address: DemoAddress; centre: Centre; receiver: string; t: T }) {
  // The address stores street, neighbourhood, district, province.
  const province = address.area[3];
  // "Pickup | Collect Point": the method's name is Medium, the rest Regular.
  const [method, ...rest] = t("pickup | Collect Point").split(" | ");
  return (
    <Box
      mt={284 - textBottom(273, 11)}
      ml={12}
      w={fill(12)}
      h={96}
      radius={15}
      fill={C.card}
      stroke={C.line}
      className="flex flex-col"
      data-pw="demo-checkout-pickup"
    >
      <XdIcon name="payCardMap" className="absolute" style={{ right: 418 - (390 + 16), top: 292.12 - 284 }} />
      <Txt size={13} ml={12} mt={textTop(305, 13) - 284} className="truncate" style={{ width: fill(12) }}>
        <span className="font-medium">{method}</span>
        {rest.length > 0 && ` | ${rest.join(" | ")}`}
      </Txt>
      <Txt size={13} ml={12} mt={textTop(329, 13) - textBottom(305, 13)} className="truncate" style={{ width: fill(12) }}>
        {/* The brand's mark, as the file draws it: not a word to translate. */}
        <span className="font-medium">{BRAND[0]}</span>
        {`${BRAND[1]} ${t("Center")} | ${centre.place} | ${province} | ${t(countryOf(address.country).name)}`}
      </Txt>
      <Txt size={11} ml={12} mt={textTop(349, 11) - textBottom(329, 13)} className="truncate" style={{ width: fill(12) }}>
        {receiver}
      </Txt>
      <Txt size={11} weight="medium" ml={12} mt={textTop(369, 11) - textBottom(349, 11)} className="truncate" style={{ width: fill(12) }}>
        {t("You will Collect your shipment yourself from center")}
      </Txt>
    </Box>
  );
}

/**
 * The chosen address, `– 76`: a 406 x 76 card at y 284, `#FCFCFC` with a grey
 * 0.5 px line, round 15. From x 24: the title (13 Medium, baseline 305), the
 * place (13, baseline 329: the neighbourhood Regular, "province | country"
 * Medium, as "El Jamiliya | Aleppo | Syria") and the detail (11, baseline 349).
 */
function AddressCard({ address, t }: { address: DemoAddress; t: T }) {
  // The address stores street, neighbourhood, district, province.
  const [, town, , province] = address.area;
  return (
    <Box
      mt={284 - textBottom(273, 11)}
      ml={12}
      w={fill(12)}
      h={76}
      radius={15}
      fill={C.card}
      stroke={C.line}
      className="flex flex-col"
      data-pw="demo-checkout-address"
    >
      <Txt size={13} weight="medium" ml={12} mt={textTop(305, 13) - 284} className="truncate" style={{ width: fill(12) }}>
        {address.title}
      </Txt>
      <Txt size={13} ml={12} mt={textTop(329, 13) - textBottom(305, 13)} className="truncate" style={{ width: fill(12) }}>
        {`${town} |`}
        <span className="font-medium">{` ${province} | ${t(countryOf(address.country).name)}`}</span>
      </Txt>
      <Txt size={11} ml={12} mt={textTop(349, 11) - textBottom(329, 13)} className="truncate" style={{ width: fill(12) }}>
        {address.detail}
      </Txt>
    </Box>
  );
}
