"use client";

import React, { useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoData, type DemoAddress } from "../../DemoApp/DemoData";
import { bagLook, inBag } from "../../DemoApp/demoBag";
import { countryOf } from "../../DemoApp/demoPlaces";
import { useDemoCase } from "../demoCase";
import { C, fill, textBottom, textTop } from "../demo1Layout";
import { Box, ScreenPage, Txt } from "../ui";
import CartAddressSheet from "./CartAddressSheet";
import DeliveryMethodSheet from "./DeliveryMethodSheet";
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
 */
export default function CheckoutScreen() {
  const { bag, profile, update } = useDemoData();
  const { t } = useDemoCase();
  const [choosing, setChoosing] = useState(false);
  const [choosingMethod, setChoosingMethod] = useState(false);
  const items = inBag(bag);
  // An address deleted on the profile is no longer the bag's.
  const address = profile.addresses.find((a) => a.id === profile.shippingAddress) ?? null;
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
        onChoose={() => setChoosing(true)}
        onChooseMethod={() => setChoosingMethod(true)}
      />
      {address && (
        <DeliveryMethodSheet
          open={choosingMethod}
          address={address}
          onClose={() => setChoosingMethod(false)}
          // The checkout with the chosen centre is `– 75`, not built yet: "Done" closes the sheet.
          onDone={() => setChoosingMethod(false)}
        />
      )}
      <CartAddressSheet
        open={choosing}
        onClose={() => setChoosing(false)}
        onChosen={(id) => {
          update({ shippingAddress: id });
          setChoosing(false);
        }}
      />

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
 * line on 273, then the dashed box at y 284 (`– 56`), or the address card at
 * y 284 and the dashed box at y 368 (`– 76`).
 */
function Shipping({
  t,
  address,
  onChoose,
  onChooseMethod,
}: {
  t: T;
  address: DemoAddress | null;
  onChoose: () => void;
  onChooseMethod: () => void;
}) {
  return (
    <section aria-label={t("Shipping & delivery Address")} className="flex flex-col shrink-0">
      <div className="flex items-start" style={{ marginTop: 212.44 - 192, marginLeft: 24.16 }}>
        <XdIcon name="cartRocket" className="shrink-0" />
        <XdIcon name="cartMap" className="shrink-0" style={{ marginLeft: 50 - (24.16 + 19.68), marginTop: 212.15 - 212.44 }} />
      </div>
      <div className="flex items-start" style={{ marginTop: textTop(253, 13) - (212.44 + 20), marginLeft: 24 }}>
        {/* The help mark sits at x 201 in the file: the title keeps that room, whatever width the browser gives the words. */}
        <h2 className="m-0 font-normal whitespace-nowrap" style={{ minWidth: 201 - 6 - 24, color: C.ink, ...LINE_13 }}>
          {t("Shipping & delivery Address")}
        </h2>
        <span role="img" aria-label={t("Help")} className="block shrink-0" style={{ marginLeft: 6 }}>
          <XdIcon name="cartHelpGrey" />
        </span>
      </div>
      <Txt
        size={11}
        color={address ? C.ink : C.purple}
        ml={24}
        mt={textTop(273, 11) - (textTop(253, 13) + 16)}
        className="overflow-hidden text-ellipsis"
        data-pw="demo-checkout-address-line"
      >
        {address
          ? t("We will send your Package to below address")
          : t("Please Select your shipping address to receive Your Package")}
      </Txt>
      {address && <AddressCard address={address} t={t} />}
      {/* The dashed box: `#FCFCFC`, a purple 0.5 px line dashed 3 3, round 15; the button 20 px in and 15 down. */}
      <Box
        mt={address ? 368 - 360 : 284 - textBottom(273, 11)}
        ml={12}
        w={fill(12)}
        h={70}
        radius={15}
        fill={C.card}
        stroke={C.purple}
        strokeDash="3 3"
        strokeDashCap="round"
        className="flex flex-col"
        data-pw="demo-checkout-address-box"
      >
        <button
          type="button"
          data-pw={address ? "demo-checkout-choose-method" : "demo-checkout-choose-address"}
          onClick={address ? onChooseMethod : onChoose}
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
          {address ? t("Choose Delivery Method") : t("Choose delivery Address")}
        </button>
      </Box>
    </section>
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
