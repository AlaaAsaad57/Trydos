"use client";

import React from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { useDemoData } from "../../DemoApp/DemoData";
import { bagTotal, inBag } from "../../DemoApp/demoBag";
import { WALLET_RECIPIENT } from "../../DemoApp/demoWallet";
import { useDemoNav } from "../Demo1Shell";
import { useDemoCase } from "../demoCase";
import { C, DESIGN_W, STATUS_BAR, fill, gapTo, lineBox, paraTop, textBottom, textTop } from "../demo1Layout";
import type { XdIconName } from "../../DemoApp/xdIcons";
import { Box, ScreenPage, Txt, fromCentre } from "../ui";
import { CENTRES } from "./DeliveryMethodSheet";
import { BagPhotos, InvoiceCard, PickupCard } from "./CheckoutScreen";
import { BagSum } from "./CartParts";
import { Rich } from "./ListingParts";

/**
 * The purchase done, XD `Home Page – 103`: opened by "Checkout / Complete"
 * once the policies and terms of the rdb invoice are agreed to (`– 86`). No
 * header, no tab bar.
 *
 *  - The 50 px green mark at (190, 148), and "The Purchase Was Completed
 *    Successfully" (15 Medium) on baseline 225, centred.
 *  - Three tiles, 80 tall at y 309, `#FCFCFC`, round 15, 4 apart (133, 132
 *    and 133 wide on a 430 px screen): a 20 px mark 8 under the tile's top,
 *    the name (11, grey) on baseline 356, the value (13) on 378. "Order
 *    Number" (# TTISA10012, Medium), "Order Date" (Today | the time of the
 *    purchase) and "Order Invoice" (the amount Bold).
 *  - The bag (y 393: "Shopping Bag" on 430, the count and the sum on 462, the
 *    photos), the pickup card (y 477) and the invoice card (y 577), 4 apart,
 *    as on the checkout but with no line.
 *  - The 18 px mark at (206, 748) and "You can track the status of your order
 *    through" (13) over "My Account / My Orders" (13 Medium), centred, on
 *    baselines 787 and 807.
 *  - "Done": 188 x 45 at (121, 830), `#1D1D1D`, round 30 at the top and 15
 *    at the bottom, its 13 px words on baseline +28. It goes to Home.
 *
 * The file's order number and invoice are a sample. The demo keeps the
 * number, and the invoice is half of the bag's sum, as in the file (160 USD
 * for a 320 USD bag).
 */
export default function OrderDoneScreen() {
  const { bag, profile } = useDemoData();
  const { t } = useDemoCase();
  const { navigate } = useDemoNav();
  const items = inBag(bag);
  const address = profile.addresses.find((a) => a.id === profile.shippingAddress) ?? null;
  const centre = address ? (CENTRES.find((c) => c.id === profile.pickupCentre) ?? null) : null;
  const when = new Date(profile.orderedAt ?? Date.now());
  const time = [when.getHours(), when.getMinutes(), when.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
  const trackTop = paraTop(TRACK.baseline, 13, TRACK.lineHeight);
  return (
    <ScreenPage testId="demo-order-done" scrollTop={STATUS_BAR}>
      <XdIcon name="orderDone" className="shrink-0" style={{ marginTop: DONE_MARK.y - STATUS_BAR, marginLeft: fromCentre(DONE_MARK.x, DESIGN_W) }} />
      <Txt center size={15} weight="medium" mt={gapTo(DONE_MARK.y + 50, 225, 15)} data-pw="demo-order-done-title">
        {t("The Purchase Was Completed Successfully")}
      </Txt>

      <ul className="flex shrink-0 p-0 list-none" style={{ marginTop: TILES_Y - textBottom(225, 15), marginLeft: 12, marginRight: 12, gap: 149 - 145 }}>
        <Tile grow={133} icon="orderNumber" iconX={25.66 - 12} labelX={24.17 - 12} valueX={23.9 - 12} label={t("Order Number")} testId="demo-order-number">
          <span className="font-medium">{`# ${ORDER_NUMBER}`}</span>
        </Tile>
        <Tile grow={132} icon="orderDate" iconX={161 - 149} labelX={161.64 - 149} valueX={161.75 - 149} label={t("Order Date")} testId="demo-order-date">
          {`${t("Today")} | ${time}`}
        </Tile>
        <Tile grow={133} icon="payInvoice" iconX={297.11 - 285} labelX={297.06 - 285} valueX={297 - 285} label={t("Order Invoice")} testId="demo-order-invoice">
          <span className="font-bold">{bagTotal(bag) / 2}</span>
          {` ${t("USD")}`}
        </Tile>
      </ul>

      {/* The bag: as the checkout's card, with no mark and no line. */}
      <Box mt={393 - (TILES_Y + 80)} ml={12} w={fill(12)} h={80} radius={15} fill={C.card} className="flex flex-col" data-pw="demo-order-bag">
        <Txt size={11} color={C.grey} ml={24 - 12} mt={textTop(430, 11) - 393}>
          <Rich text={t("Shopping <b>bag</b>")} />
        </Txt>
        <Txt size={13} ml={24 - 12} mt={textTop(462, 13) - textBottom(430, 11)}>
          <BagSum bag={bag} t={t} />
        </Txt>
        <BagPhotos items={items} />
      </Box>
      {address && centre && (
        <PickupCard
          mt={477 - (393 + 80)}
          line={false}
          address={address}
          centre={centre}
          receiver={`${profile.name || WALLET_RECIPIENT.name} . ${profile.phone}`}
          t={t}
        />
      )}
      {profile.paymentMethod === "invoice" && <InvoiceCard mt={577 - (477 + 96)} line={false} t={t} />}

      <XdIcon name="orderTrack" className="shrink-0" style={{ marginTop: TRACK.markY - (577 + 80), marginLeft: fromCentre(TRACK.markX, DESIGN_W) }} />
      <p
        className="shrink-0 text-center font-normal"
        style={{ marginTop: trackTop - (TRACK.markY + 18), marginLeft: 12, marginRight: 12, fontSize: 13, lineHeight: `${TRACK.lineHeight}px`, color: C.ink }}
      >
        <span className="block">{t("You Can Track The Status Of Your Order Through ")}</span>
        <span className="block font-medium">{t("My Account / My Orders")}</span>
      </p>

      {/* "Done" ends the page: at the file's place on a 932 px screen, under the words on a shorter one. */}
      <div className="grow shrink-0" style={{ minHeight: DONE.y - (trackTop + 2 * TRACK.lineHeight) }} />
      <button
        type="button"
        data-pw="demo-order-done-button"
        onClick={() => navigate("home")}
        className="flex justify-center shrink-0 self-center cursor-pointer active:opacity-80 [-webkit-tap-highlight-color:transparent] font-normal whitespace-nowrap"
        style={{
          width: DONE.w,
          height: DONE.h,
          marginBottom: 932 - (DONE.y + DONE.h),
          paddingTop: textTop(DONE.y + 28, 13) - DONE.y,
          borderRadius: "30px 30px 15px 15px",
          background: C.ink,
          color: C.white,
          fontSize: 13,
          lineHeight: `${lineBox(13)}px`,
        }}
      >
        {t("Done")}
      </button>
    </ScreenPage>
  );
}

/** The file's order number: a sample, kept as the demo's. */
const ORDER_NUMBER = "TTISA10012";

/** The green mark's box. */
const DONE_MARK = { x: 190, y: 148 } as const;

/** The tiles' top. */
const TILES_Y = 309;

/** The mark over the note, and the note's two lines. */
const TRACK = { markX: 206, markY: 748, baseline: 787, lineHeight: 807 - 787 } as const;

/** "Done". */
const DONE = { y: 830, w: 188, h: 45 } as const;

/**
 * A tile of the order: 80 tall, `#FCFCFC`, round 15, as wide as its share of
 * the row (`grow`, the file's width). Its mark 8 under its top, the name on
 * baseline 356 and the value on 378, each at the file's x in the tile.
 */
function Tile({
  grow,
  icon,
  iconX,
  labelX,
  valueX,
  label,
  testId,
  children,
}: {
  grow: number;
  icon: XdIconName;
  iconX: number;
  labelX: number;
  valueX: number;
  label: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex min-w-0" style={{ flex: `${grow} 1 0px` }} data-pw={testId}>
      <Box w="100%" h={80} radius={15} fill={C.card} className="flex flex-col overflow-hidden">
        <XdIcon name={icon} className="shrink-0" style={{ marginLeft: iconX, marginTop: 317 - TILES_Y }} />
        <Txt size={11} color={C.grey} ml={labelX} mt={textTop(356, 11) - (317 + 20)} className="truncate">
          {label}
        </Txt>
        <Txt size={13} ml={valueX} mt={textTop(378, 13) - textBottom(356, 11)} className="truncate">
          {children}
        </Txt>
      </Box>
    </li>
  );
}
