"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import type { DemoKey } from "../../DemoApp/demoKeys";
import {
  DEMO_ORDERS,
  orderById,
  parseOrderStage,
  type OrderStage,
} from "../../DemoApp/demoOrders";
import { storeBySlug } from "../../DemoApp/demoStores";
import type { XdIconName } from "../../DemoApp/xdIcons";
import { useDemoNav } from "../Demo1Shell";
import {
  C,
  CTA,
  SAFE_BOTTOM,
  fill,
  lineBox,
  paraTop,
  textBottom,
  textTop,
} from "../demo1Layout";
import { Box, ScreenPage, Stroke, Txt } from "../ui";
import { StoreMark } from "./ListingParts";
import { OrderHeader } from "./OrdersScreen";
import OrderTimelineWidget from "./OrderTimelineWidget";
import OrderPickupSheet from "./OrderPickupSheet";

const MANGO = storeBySlug("mango")!;

/**
 * Profile | Orders Details — XD `Home Page – 60`, `– 62`, `– 61`, `– 64`,
 * `– 65` (Pickup Order QR sheet), `– 66` (Delivered + Rate & Get Money), and
 * `– 63` (all-icons timeline showcase).
 *
 * Interactive controls:
 *  - Tap the timeline pills (`Preparing`, `Shipped`, `Delivered`) to step
 *    through every stage.
 *  - Tap `Pickup Now` (`– 64`) or the shipment QR mark (`– 61`/`– 64`/`– 66`)
 *    to open the Pickup Order QR sheet (`– 65`).
 *  - Tap the `⋯` menu in the header to jump directly to any stage or play the
 *    full 6-icon animated timeline journey.
 *  - Also reads `?stage=` and `?sheet=pickup` for direct deep-linking.
 */
export default function OrderDetailScreen({ id }: { id: string }) {
  const { t, back } = useDemoNav();
  const searchParams = useSearchParams();
  const order = orderById(id) ?? DEMO_ORDERS[0];

  const paramStage = parseOrderStage(searchParams.get("stage"));
  const paramSheet = searchParams.get("sheet") === "pickup";

  const [stage, setStage] = useState<OrderStage>(
    paramStage ?? order.defaultStage,
  );
  const [pickupOpen, setPickupOpen] = useState(paramSheet);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (paramStage) setStage(paramStage);
  }, [paramStage]);

  useEffect(() => {
    if (paramSheet) setPickupOpen(true);
  }, [paramSheet]);

  // `Home Page – 63`: standalone timeline widget showcase (white page, card at y 538)
  if (stage === "showcase") {
    return (
      <ScreenPage testId="demo-order-showcase" contentHeight={1089} scrollTop={50}>
        <OrderTimelineWidget
          stage="showcase"
          mt={538 - 50}
          onSelectStage={(next) => setStage(next)}
          t={t}
        />
      </ScreenPage>
    );
  }

  const isDelivered = stage === "delivered";
  const isPickup = stage === "pickup";
  const hasShipmentId =
    stage === "shipped" || stage === "pickup" || stage === "delivered";

  const itemStatusFor = (
    idx: number,
  ): { label: DemoKey; icon?: XdIconName } => {
    if (stage === "preparing") {
      return { label: "Preparing", icon: "orderWorkSmall" };
    }
    if (stage === "split") {
      return idx === 0
        ? { label: "Shipped", icon: "orderRocketUpSmall" }
        : { label: "Preparing", icon: "orderWorkSmall" };
    }
    if (stage === "shipped" || stage === "pickup") {
      return { label: "Shipped", icon: "orderRocketDownSmall" };
    }
    return { label: "Delivered" };
  };

  return (
    <ScreenPage
      testId={`demo-order-detail-${stage}`}
      contentHeight={isDelivered ? 1280 : 1089}
      header={
        <OrderHeader
          crumbRight="Orders Details"
          nudge={0}
          onBack={back}
          onMore={() => setMenuOpen((v) => !v)}
          t={t}
        />
      }
      footer={
        <>
          {isPickup && (
            <motion.button
              type="button"
              data-pw="demo-order-pickup-now"
              whileTap={{ scale: 0.985 }}
              onClick={() => setPickupOpen(true)}
              className="absolute flex justify-center cursor-pointer [-webkit-tap-highlight-color:transparent]"
              style={{
                left: CTA.x,
                width: fill(CTA.x),
                height: CTA.height,
                bottom: `calc(${932 - (CTA.y + CTA.height)}px + ${SAFE_BOTTOM})`,
                borderRadius: CTA.radius,
                background: C.purple,
              }}
            >
              <Txt
                size={16}
                weight="medium"
                color={C.white}
                mt={textTop(872, 16) - CTA.y}
              >
                {t("Pickup Now")}
              </Txt>
            </motion.button>
          )}
          <OrderPickupSheet
            open={pickupOpen}
            onClose={() => setPickupOpen(false)}
            order={order}
            t={t}
          />
        </>
      }
    >
      {/* Left-edge 4 px vertical purple accent strip: x 0, y 112..930 (h 818).
          Positioned on ScreenPage (which starts at y 50), so top is 112 - 50 = 62. */}
      <div
        aria-hidden="true"
        className="absolute left-0 pointer-events-none"
        style={{
          top: 112 - 50,
          width: 4,
          height: 818,
          background: C.purple,
        }}
      />

      {/* Optional compact stage-switcher popover opened via header `⋯` */}
      {menuOpen && (
        <div
          data-pw="demo-order-stage-menu"
          className="absolute z-20 flex flex-col bg-white shadow-lg"
          style={{
            right: 12,
            top: 4,
            width: 210,
            borderRadius: 12,
            border: `0.5px solid ${C.line}`,
            padding: 6,
          }}
        >
          {(
            [
              ["preparing", "Preparing (HP 60)"],
              ["split", "1 Preparing · 1 Shipped (HP 62)"],
              ["shipped", "Shipped · Remaining 1 Day (HP 61)"],
              ["pickup", "Waiting Pickup (HP 64)"],
              ["delivered", "Delivered & Rate (HP 66)"],
              ["showcase", "Timeline Icons (HP 63)"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setStage(key);
                setMenuOpen(false);
              }}
              className="text-left px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium cursor-pointer"
              style={{
                background: stage === key ? "#EEEBFF" : "transparent",
                color: stage === key ? C.purple : C.ink,
              }}
            >
              {label}
            </button>
          ))}
          <div className="my-1" style={{ height: 0.5, background: C.line }} />
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setPickupOpen(true);
            }}
            className="text-left px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium cursor-pointer"
            style={{ color: C.ink }}
          >
            Open Pickup QR Sheet (HP 65)
          </button>
        </div>
      )}

      {/* Top 3 summary tiles: y 112..192 (h 80, gap 4) */}
      <ul
        className="flex shrink-0 p-0 list-none"
        style={{ marginTop: 112 - 100, marginLeft: 12, marginRight: 12, gap: 4 }}
      >
        <SummaryTile
          grow={133}
          icon="orderNumber"
          iconX={25.66 - 12}
          labelX={24.17 - 12}
          valueX={23.9 - 12}
          label={t("Order Number")}
          testId="demo-order-detail-number"
        >
          <span className="font-medium">{`# ${order.id}`}</span>
        </SummaryTile>

        <SummaryTile
          grow={132}
          icon="orderDate"
          iconX={161 - 149}
          labelX={161.64 - 149}
          valueX={161.75 - 149}
          label={t("Order Date")}
          testId="demo-order-detail-date"
        >
          {`${t("Today")} | ${order.dateLabel}`}
        </SummaryTile>

        <SummaryTile
          grow={133}
          icon="payInvoice"
          iconX={297.11 - 285}
          labelX={297.06 - 285}
          valueX={297 - 285}
          label={t("Order Invoice")}
          rightIcon="orderWalletSmall"
          testId="demo-order-detail-invoice"
        >
          <span className="font-bold">{order.totalUsd}</span>
          {` ${t("USD")}`}
        </SummaryTile>
      </ul>

      {/* Delivered-only "Rate & Get Money" card (`Home Page – 66`, y 204..359, h 155) */}
      {isDelivered && (
        <Box
          mt={204 - 192}
          ml={12}
          w={fill(12)}
          h={155}
          radius={15}
          fill={C.card}
          stroke="#402CDD"
          strokeWidth={0.5}
          className="flex flex-col"
          data-pw="demo-order-rate-card"
        >
          <XdIcon
            name="orderRateStarsCard"
            className="shrink-0"
            style={{ marginLeft: 12, marginTop: 214.35 - 204 }}
          />
          <Txt
            size={13}
            weight="medium"
            color={C.ink}
            ml={12}
            mt={textTop(258, 13) - (214.35 + 20.1)}
          >
            {t("Rate & Get Money")}
          </Txt>
          <p
            className="shrink-0 font-normal"
            style={{
              margin: 0,
              paddingLeft: 12,
              paddingRight: 28,
              paddingTop: paraTop(278, 11, 16) - textBottom(258, 13) + 1,
              fontSize: 11,
              lineHeight: "16px",
              color: C.ink,
            }}
          >
            {t(
              "Your Accurate Rating Of The Products You Receive Helps Us Improve Quality And Helps Other Customers Purchase.",
            )}
          </p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.985 }}
            data-pw="demo-order-rate-cta"
            className="absolute flex items-center justify-center cursor-pointer [-webkit-tap-highlight-color:transparent]"
            style={{
              left: 12,
              right: 12,
              top: 309 - 204,
              height: 42,
              borderRadius: 12,
              background: "#402CDD",
              gap: 7.5,
            }}
          >
            <XdIcon name="orderRateStarsBtn" />
            <Txt size={13} weight="medium" color={C.card}>
              {t("Rate & Get Money")}
            </Txt>
            <XdIcon name="orderRateStarsBtn" />
          </motion.button>
        </Box>
      )}

      {/* Order Details & Status card (`y 204`, h 338 on 60..64; `y 371`, h 382 on 66) */}
      <Box
        mt={12}
        ml={12}
        w={fill(12)}
        h={isDelivered ? 382 : 338}
        radius={15}
        fill={C.card}
        className="flex flex-col"
        data-pw="demo-order-items-card"
      >
        <Txt
          size={11}
          color={C.grey}
          ml={12}
          mt={textTop(223, 11) - 204}
        >
          {t("Order Details & Status")}
        </Txt>

        {/* Status chips row: y +28 (232), h 18 */}
        <div
          className="flex items-center shrink-0"
          style={{
            marginTop: 232 - textBottom(223, 11),
            marginLeft: 12,
            gap: 4,
          }}
        >
          <StatusChip bg="#F0F0F0" width={44}>
            <span className="font-medium">{order.items.length} </span>
            {t("Item")}
          </StatusChip>

          {stage === "split" ? (
            <>
              <StatusChip bg="#EEEBFF" width={69}>
                <span className="font-medium">1 </span>
                {t("Preparing")}
              </StatusChip>
              <StatusChip bg="#EEEBFF" width={60}>
                <span className="font-medium">1 </span>
                {t("Shipped")}
              </StatusChip>
            </>
          ) : (
            <StatusChip bg="#EEEBFF" width={stage === "preparing" ? 72 : 71}>
              {stage === "preparing" ? (
                <span className="font-medium">{`2 ${t("Preparing")}`}</span>
              ) : (
                <>
                  <span className="font-medium">2 </span>
                  {t("Preparing")}
                </>
              )}
            </StatusChip>
          )}
        </div>

        {/* Hairline 1: y +54 (258) */}
        <div
          className="shrink-0"
          style={{
            marginTop: 258 - (232 + 18),
            marginLeft: 12,
            marginRight: 12,
            height: 0.5,
            background: C.line,
          }}
        />

        {/* Line items */}
        {order.items.map((item, idx) => {
          const st = itemStatusFor(idx);
          const itemRating = ratings[item.id] ?? 0;
          return (
            <React.Fragment key={item.id}>
              {idx > 0 && (
                <div
                  className="shrink-0"
                  style={{
                    marginTop: isDelivered ? 32 - 20 : 12,
                    marginLeft: 12,
                    marginRight: 12,
                    height: 0.5,
                    background: C.line,
                  }}
                />
              )}

              {/* Item main row: 80 x 120 photo + details (11.5 under the 0.5 px hairline = exact 12 px pitch) */}
              <div
                className="flex items-start shrink-0"
                style={{
                  marginTop: 11.5,
                  marginLeft: 12,
                  marginRight: 12,
                  height: 120,
                }}
              >
                <div
                  className="relative shrink-0 overflow-hidden"
                  style={{ width: 80, height: 120, borderRadius: 6 }}
                >
                  <img
                    src={item.photo}
                    alt=""
                    draggable={false}
                    className="block w-full h-full object-cover"
                  />
                  {item.hasBorder && (
                    <Stroke color={C.line} width={0.5} radius={6} />
                  )}
                </div>

                <div className="flex flex-col min-w-0 grow" style={{ marginLeft: 12 }}>
                  <div className="shrink-0" style={{ marginTop: 6, height: 7.72 }}>
                    <StoreMark store={MANGO} h={7.72} maxW={220} />
                  </div>
                  <Txt size={11} color={C.ink} mt={6.28} className="truncate">
                    {t("Women")} <span className="font-medium">.</span>{" "}
                    {t("Pajama")} <span className="font-medium">.</span>{" "}
                    {t("Pantaloon")}
                  </Txt>
                  <Txt size={11} color={C.ink} mt={6} className="truncate">
                    <span style={{ color: C.grey }}>{`${t("Color")} `}</span>
                    <span className="font-medium">.</span>{" "}
                    <span className="font-medium">{t("Denim Blue")}</span>
                  </Txt>
                  <Txt size={11} color={C.ink} mt={6} className="truncate">
                    <span style={{ color: C.grey }}>{`${t("Size")} `}</span>
                    <span className="font-medium">.</span>{" "}
                    <span className="font-medium">{t("Medium 38")}</span>
                  </Txt>
                  <Txt size={11} color={C.ink} mt={6} className="truncate">
                    <span style={{ color: C.grey }}>{`${t("Composed Of")} `}</span>
                    <span className="font-medium">.</span>{" "}
                    <span className="font-medium">{t("1 Piece")}</span>
                  </Txt>

                  {/* Bottom price + Item Status line (baseline +111 -> mt 6) */}
                  <div
                    className="flex items-center justify-between shrink-0"
                    style={{ marginTop: 6 }}
                  >
                    <Txt size={11} color={C.ink}>
                      <span className="font-medium">1</span>{" "}
                      {"item "}
                      <span className="font-medium">.</span>{" "}
                      <span className="font-medium">{item.priceUsd}</span>{" "}
                      {t("usd")}
                    </Txt>

                    <div className="flex items-center shrink-0" style={{ gap: 4 }}>
                      <Txt size={11} color={C.ink}>
                        <span style={{ color: C.grey }}>
                          {`${t("Item Status")} `}
                        </span>
                        <span className="font-medium">.</span>{" "}
                        <span className="font-medium">{t(st.label)}</span>
                      </Txt>
                      {st.icon && (
                        <XdIcon
                          name={st.icon}
                          className="shrink-0"
                          style={{ marginTop: -2 }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivered rating + Add Comment row (`Home Page – 66`) */}
              {isDelivered && (
                <div
                  className="relative shrink-0"
                  style={{ height: 20, width: "100%" }}
                  data-pw={`demo-order-rate-row-${item.id}`}
                >
                  {/* 10 Point with star cluster at (34, 564.32) -> rel (22, 7.32) */}
                  <XdIcon
                    name="orderRateStarsPoint"
                    className="absolute"
                    style={{ left: 34 - 12, top: 564.32 - 557 }}
                  />
                  <Txt
                    size={11}
                    color="#402CDD"
                    className="absolute"
                    style={{
                      left: 54 - 12,
                      top: textTop(574, 11) - 557,
                    }}
                  >
                    <span className="font-bold">10</span>
                    {` ${t("Point")}`}
                  </Txt>

                  {/* 5 interactive rating stars at x 115.69 + i * 20 */}
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Rate ${star} stars`}
                      onClick={() =>
                        setRatings((prev) => ({ ...prev, [item.id]: star }))
                      }
                      className="absolute flex items-center justify-center cursor-pointer active:scale-110 transition-transform [-webkit-tap-highlight-color:transparent]"
                      style={{
                        left: 115.69 - 12 + (star - 1) * 20 - 2,
                        top: 562.7 - 557 - 2,
                        width: 18.61,
                        height: 18.61,
                      }}
                    >
                      <XdIcon
                        name={
                          star <= itemRating
                            ? "orderStarFilled"
                            : "orderStarOutline"
                        }
                      />
                    </button>
                  ))}

                  {/* Vertical hairline at x 218 -> rel 206, y 563..577 */}
                  <div
                    aria-hidden="true"
                    className="absolute"
                    style={{
                      left: 218 - 12,
                      top: 563 - 557,
                      width: 0.5,
                      height: 14,
                      background: C.hint,
                    }}
                  />

                  {/* Comment icon + "Add Comment…" at x 226 / 246 */}
                  <button
                    type="button"
                    className="absolute flex items-center cursor-pointer active:opacity-70 [-webkit-tap-highlight-color:transparent]"
                    style={{
                      left: 226 - 12,
                      top: 563 - 557,
                      gap: 6,
                    }}
                  >
                    <XdIcon name="orderCommentDots" />
                    <Txt size={11} color={C.hint}>
                      {t("Add Comment…")}
                    </Txt>
                  </button>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </Box>

      {/* Order Timeline Widget (`y 554` on 60..64; `y 765` on 66) */}
      <OrderTimelineWidget
        stage={stage}
        mt={12}
        onSelectStage={(next) => setStage(next)}
        t={t}
      />

      {/* Shipping & Delivery card (`y 664` on 60..64; `y 875` on 66; h 388) */}
      <Box
        mt={12}
        ml={12}
        w={fill(12)}
        h={388}
        radius={15}
        fill={C.card}
        className="mb-[37px]"
        data-pw="demo-order-shipping-card"
      >
        {/* Header icons + "Shipping & Delivery" + help mark */}
        <XdIcon
          name="orderTruckSmall"
          className="absolute"
          style={{ left: 23.94 - 12, top: 674.87 - 664 }}
        />
        <XdIcon
          name="orderPinSmall"
          className="absolute"
          style={{ left: 41 - 12, top: 672.1 - 664 }}
        />
        <Txt
          size={11}
          color={C.grey}
          className="absolute"
          style={{ left: 61 - 12, top: textTop(683, 11) - 664 }}
        >
          {t("Shipping & Delivery")}
        </Txt>
        <XdIcon
          name="orderHelpDark"
          className="absolute"
          style={{ left: 166 - 12, top: 672 - 664 }}
        />

        {/* Purple pickup point banner pill (y 692, h 18, r 6) */}
        <div
          className="absolute flex items-start"
          style={{
            left: 12,
            top: 692 - 664,
            minWidth: isDelivered ? 261 : 241,
            height: 18,
            paddingLeft: 6,
            paddingRight: 6,
            borderRadius: 6,
            background: C.purple,
          }}
        >
          <Txt size={11} color={C.card} mt={textTop(705, 11) - 692}>
            <span className="font-medium">{`${t("Pickup Point")} . `}</span>
            {isDelivered
              ? `${t("Picked By")} ${order.recipient} ${order.pickedTime}`
              : t("Pick Up Your Shipment Yourself")}
          </Txt>
        </div>

        {/* Total Packages You Will Pickup (bl 733 & 753) */}
        <Txt
          size={11}
          color={C.grey}
          className="absolute"
          style={{ left: 12, top: textTop(733, 11) - 664 }}
        >
          {t("Total Packages You Will Pickup")}
        </Txt>
        <Txt
          size={11}
          color={C.ink}
          className="absolute"
          style={{ left: 12, top: textTop(753, 11) - 664 }}
        >
          {`1 ${t("Packages")} . ${order.items.length} ${t("Item")}`}
        </Txt>

        {/* Package Shipment Company & ID (bl 779, pill y 788) */}
        <Txt
          size={11}
          color={C.grey}
          className="absolute"
          style={{ left: 12, top: textTop(779, 11) - 664 }}
        >
          {t("Package Shipment Company & ID")}
        </Txt>
        <div
          className="absolute flex items-start"
          style={{
            left: 12,
            top: 788 - 664,
            minWidth: hasShipmentId ? 116 : 200,
            height: 18,
            paddingLeft: 6,
            paddingRight: 6,
            borderRadius: 6,
            background: hasShipmentId ? C.ink : C.grey,
          }}
        >
          <Txt size={11} color={C.card} mt={textTop(801, 11) - 788}>
            <span className="font-bold">try</span>
            {"dos # "}
            {hasShipmentId ? order.id : t("Waiting Shipment Number…")}
          </Txt>
        </div>
        {hasShipmentId && (
          <button
            type="button"
            aria-label={t("Pickup Order")}
            data-pw="demo-order-shipment-qr"
            onClick={() => setPickupOpen(true)}
            className="absolute cursor-pointer active:opacity-70 [-webkit-tap-highlight-color:transparent]"
            style={{
              left: 146.08 - 12,
              top: 788.06 - 664,
            }}
          >
            <XdIcon name="orderQrSmall" />
          </button>
        )}

        {/* Expected Delivery Date (bl 829, pill y 838, note bl 873) */}
        <Txt
          size={11}
          color={C.grey}
          className="absolute"
          style={{ left: 12, top: textTop(829, 11) - 664 }}
        >
          {t("Expected Delivery Date")}
        </Txt>
        <div
          className="absolute flex items-start"
          style={{
            left: 12,
            top: 838 - 664,
            minWidth: 157,
            height: 18,
            paddingLeft: 6,
            paddingRight: 6,
            borderRadius: 6,
            background: C.ink,
          }}
        >
          <Txt size={11} color={C.card} mt={textTop(851, 11) - 838}>
            {"Monday "}
            <span className="font-medium">{order.expectedDate}</span>
            {` | ${order.expectedDays}`}
          </Txt>
        </div>
        <Txt
          size={11}
          color={C.ink}
          className="absolute"
          style={{ left: 12, top: textTop(873, 11) - 664 }}
        >
          {isDelivered
            ? `${t("Picked")} ${order.pickedDate} | ${order.pickedTime} By ${order.recipient}`
            : isPickup
              ? t("You Can Pickup Now")
              : t(
                  "Will Send To You Notification When The Shipment Ready To Collect",
                )}
        </Txt>

        {/* Delivery Pickup Address (bl 899 & 919) */}
        <Txt
          size={11}
          color={C.grey}
          className="absolute"
          style={{ left: 12, top: textTop(899, 11) - 664 }}
        >
          {t("Delivery Pickup Address")}
        </Txt>
        <Txt
          size={11}
          color={C.ink}
          className="absolute"
          style={{ left: 12, top: textTop(919, 11) - 664 }}
        >
          {`${order.pickupCenter} `}
          <span style={{ color: C.blue }}>{t("Show In Map")}</span>
        </Txt>

        {/* Recipient (bl 939 & 959) */}
        <Txt
          size={11}
          color={C.grey}
          className="absolute"
          style={{ left: 12, top: textTop(939, 11) - 664 }}
        >
          {t("Recipient")}
        </Txt>
        <Txt
          size={11}
          color={C.ink}
          className="absolute"
          style={{ left: 12, top: textTop(959, 11) - 664 }}
        >
          {order.recipient}
        </Txt>

        {/* Recipient Contact (bl 979 & 999) */}
        <Txt
          size={11}
          color={C.grey}
          className="absolute"
          style={{ left: 12, top: textTop(979, 11) - 664 }}
        >
          {t("Recipient Contact")}
        </Txt>
        <Txt
          size={11}
          color={C.ink}
          className="absolute"
          style={{ left: 12, top: textTop(999, 11) - 664 }}
        >
          {order.recipientPhone}
        </Txt>

        {/* Bottom button: "+ Add Authorized Recipient The Shipment" (y 1014, h 30) */}
        <button
          type="button"
          data-pw="demo-order-add-recipient"
          className="absolute flex justify-center cursor-pointer active:opacity-75 [-webkit-tap-highlight-color:transparent]"
          style={{
            left: 12,
            right: 12,
            top: 1014 - 664,
            height: 30,
            borderRadius: 12,
            background: "#F4F4F4",
          }}
        >
          <Txt size={11} color={C.ink} mt={textTop(1033, 11) - 1014 - 1}>
            <span className="font-medium">{`${t("+ Add")} `}</span>
            {t("Authorized Recipient")}{" "}
            {t("The Shipment")}
          </Txt>
        </button>
      </Box>
    </ScreenPage>
  );
}

function StatusChip({
  bg,
  width,
  children,
}: {
  bg: string;
  width: number;
  children: React.ReactNode;
}) {
  return (
    <span
      className="flex items-start shrink-0"
      style={{
        minWidth: width,
        height: 18,
        paddingLeft: 6,
        paddingRight: 6,
        borderRadius: 6,
        background: bg,
      }}
    >
      <Txt size={11} color={C.ink} mt={textTop(245, 11) - 232}>
        {children}
      </Txt>
    </span>
  );
}

function SummaryTile({
  grow,
  icon,
  iconX,
  labelX,
  valueX,
  label,
  rightIcon,
  testId,
  children,
}: {
  grow: number;
  icon: XdIconName;
  iconX: number;
  labelX: number;
  valueX: number;
  label: string;
  rightIcon?: XdIconName;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex min-w-0" style={{ flex: `${grow} 1 0px` }} data-pw={testId}>
      <Box
        w="100%"
        h={80}
        radius={15}
        fill={C.card}
        className="flex flex-col overflow-hidden"
      >
        <XdIcon
          name={icon}
          className="shrink-0"
          style={{ marginLeft: iconX, marginTop: 120 - 112 }}
        />
        {rightIcon && (
          <XdIcon
            name={rightIcon}
            className="absolute"
            style={{ right: 418 - (386.03 + 19.93), top: 120 - 112 }}
          />
        )}
        <Txt
          size={11}
          color={C.grey}
          ml={labelX}
          mt={textTop(159, 11) - (120 + 20)}
          className="truncate"
        >
          {label}
        </Txt>
        <Txt
          size={13}
          ml={valueX}
          mt={textTop(181, 13) - textBottom(159, 11)}
          className="truncate"
        >
          {children}
        </Txt>
      </Box>
    </li>
  );
}
