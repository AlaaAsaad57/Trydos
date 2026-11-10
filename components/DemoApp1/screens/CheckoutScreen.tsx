"use client";

import React from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoData } from "../../DemoApp/DemoData";
import { bagLook, inBag } from "../../DemoApp/demoBag";
import { useDemoCase } from "../demoCase";
import { C, fill, textTop } from "../demo1Layout";
import { Box, ScreenPage, Txt } from "../ui";
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
 *  - The bottom panel with the sum and "Checkout / Complete", grey until an
 *    address is chosen. The address screens are the next boards of the file
 *    (`– 70` on); the button opens nothing yet.
 */
export default function CheckoutScreen() {
  const { bag } = useDemoData();
  const { t } = useDemoCase();
  const items = inBag(bag);
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

      <Shipping t={t} />

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

/** The shipping section: the marks at y 212, the title on baseline 253, the purple line on 273, the dashed box at y 284. */
function Shipping({ t }: { t: T }) {
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
      <Txt size={11} color={C.purple} ml={24} mt={textTop(273, 11) - (textTop(253, 13) + 16)} className="overflow-hidden text-ellipsis">
        {t("Please Select your shipping address to receive Your Package")}
      </Txt>
      {/* The dashed box: `#FCFCFC`, a purple 0.5 px line dashed 3 3, round 15; the button 20 px in and 15 down. */}
      <Box
        mt={284 - (textTop(273, 11) + 14)}
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
          data-pw="demo-checkout-choose-address"
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
          {t("Choose delivery Address")}
        </button>
      </Box>
    </section>
  );
}
