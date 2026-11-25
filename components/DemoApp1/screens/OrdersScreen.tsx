"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import {
  DEMO_ORDERS,
  type DemoOrder,
  type OrderFilter,
} from "../../DemoApp/demoOrders";
import type { DemoKey } from "../../DemoApp/demoKeys";
import { useDemoNav } from "../Demo1Shell";
import {
  C,
  HEADER,
  fill,
  lineBox,
  textTop,
} from "../demo1Layout";
import { Box, ScreenPage, Stroke, Txt } from "../ui";

/**
 * Shared header for Orders (`Home Page – 53`) and Orders Details
 * (`Home Page – 60`..`– 66`): white 50 px bar, back arrow at (23.5, 64.5),
 * centred "Profile | Orders" or "Profile | Orders Details" on baseline 80
 * with the 15.85 x 19 clipboard icon at y 66, and the three vertical dots
 * (6 x 20) at (405, 65).
 */
export function OrderHeader({
  crumbRight,
  nudge = 0,
  onBack,
  onMore,
  t,
}: {
  crumbRight: DemoKey;
  nudge?: number;
  onBack: () => void;
  onMore?: () => void;
  t: (key: DemoKey) => string;
}) {
  return (
    <header
      className="relative w-full font-quicksand grid items-center shrink-0"
      style={{
        height: HEADER.height,
        gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
        background: C.white,
      }}
    >
      <button
        type="button"
        data-pw="demo-back"
        aria-label={t("Back")}
        onClick={onBack}
        className="flex items-center justify-center justify-self-start cursor-pointer active:opacity-60 transition-opacity [-webkit-tap-highlight-color:transparent]"
        style={{
          gridColumn: 1,
          gridRow: 1,
          marginLeft: 7.5,
          width: 44,
          height: HEADER.height,
        }}
      >
        <XdIcon name="back" />
      </button>

      <h1
        className="flex items-start whitespace-nowrap pointer-events-none"
        style={{
          gridColumn: 2,
          gridRow: 1,
          fontSize: 14,
          lineHeight: `${lineBox(14)}px`,
          color: C.ink,
          paddingLeft: nudge > 0 ? nudge * 2 : undefined,
          paddingRight: nudge < 0 ? -nudge * 2 : undefined,
        }}
      >
        <span className="font-normal whitespace-pre">{`${t("Profile")} | `}</span>
        <span className="font-medium">{t(crumbRight)}</span>
        <XdIcon
          name="orderTitleIcon"
          className="shrink-0"
          style={{
            marginLeft: 5.32,
            marginRight: -(5.32 + 15.85),
            marginBottom: -1,
          }}
        />
      </h1>

      <button
        type="button"
        data-pw="demo-orders-more"
        aria-label={t("More options")}
        onClick={onMore}
        className="flex items-center justify-center justify-self-end cursor-pointer active:opacity-60 transition-opacity [-webkit-tap-highlight-color:transparent]"
        style={{
          gridColumn: 3,
          gridRow: 1,
          marginRight: 4,
          width: 36,
          height: HEADER.height,
        }}
      >
        <XdIcon name="orderMore" />
      </button>
    </header>
  );
}

const FILTERS: {
  id: OrderFilter;
  label: DemoKey;
  count?: number;
  width: number;
  gapAfter: number;
}[] = [
  { id: "all", label: "All", count: 1, width: 47, gapAfter: 12 },
  { id: "in_progress", label: "In Progress", count: 1, width: 100, gapAfter: 4 },
  { id: "delivered", label: "Delivered", width: 81, gapAfter: 4 },
  { id: "returned", label: "Returned", width: 80, gapAfter: 4 },
  { id: "cancelled", label: "Cancelled", width: 83, gapAfter: 0 },
];

/**
 * Profile | Orders — XD `Home Page – 53`.
 *
 *  - Header (`y 50..100`): back arrow, "Profile | Orders" + clipboard icon,
 *    three vertical dots.
 *  - Filter pills at `y 112` (`h 32`, `r 12`): "All 1" (`#F8F8F8`),
 *    "In Progress 1", "Delivered", "Returned", "Cancelled" (`0.3 px #D3D3D3`).
 *  - Order cards from `y 164`, 8 px apart, each with its 4 px full-bleed
 *    left status bar (`#4A31E7` for In Progress, `#2BAF0B` for Delivered).
 */
export default function OrdersScreen() {
  const { t, back, navigate } = useDemoNav();
  const [filter, setFilter] = useState<OrderFilter>("all");

  const visibleOrders = DEMO_ORDERS.filter((order) => {
    if (filter === "all") return true;
    if (filter === "in_progress") return order.status === "in_progress";
    if (filter === "delivered") return order.status === "delivered";
    return false;
  });

  return (
    <ScreenPage
      testId="demo-orders"
      header={
        <OrderHeader
          crumbRight="Orders"
          nudge={0.16}
          onBack={back}
          t={t}
        />
      }
    >
      {/* Filter pills row: y 112 .. 144 */}
      <div
        data-pw="demo-orders-filters"
        className="flex items-center shrink-0 overflow-x-auto"
        style={{
          marginTop: 112 - 100,
          paddingLeft: 12,
          paddingRight: 12,
          scrollbarWidth: "none",
        }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              data-pw={`demo-orders-filter-${f.id}`}
              onClick={() => setFilter(f.id)}
              className="relative flex items-start shrink-0 cursor-pointer active:opacity-75 [-webkit-tap-highlight-color:transparent]"
              style={{
                minWidth: f.width,
                height: 32,
                marginRight: f.gapAfter,
                paddingLeft: 12,
                paddingRight: 11,
                borderRadius: 12,
                background: active ? C.field : "transparent",
              }}
            >
              <Txt
                size={13}
                weight={active ? "medium" : "regular"}
                color={C.inkSoft}
                mt={textTop(133, 13) - 112}
              >
                {t(f.label)}
                {f.count !== undefined && (
                  <>
                    {" "}
                    <span className="font-bold">{f.count}</span>
                  </>
                )}
              </Txt>
              {!active && <Stroke color={C.line} width={0.3} radius={12} />}
            </button>
          );
        })}
      </div>

      {/* Order cards from y 164 (20 px under the filter row) */}
      <div
        className="flex flex-col shrink-0"
        style={{ marginTop: 164 - (112 + 32), gap: 8, paddingBottom: 24 }}
      >
        {visibleOrders.map((order) => (
          <OrderListCard
            key={order.id}
            order={order}
            t={t}
            onOpen={() => navigate(`settings/orders/${order.id}`)}
          />
        ))}
      </div>
    </ScreenPage>
  );
}

function OrderListCard({
  order,
  t,
  onOpen,
}: {
  order: DemoOrder;
  t: (key: DemoKey) => string;
  onOpen: () => void;
}) {
  const inProgress = order.status === "in_progress";
  const cardH = inProgress ? 140 : 98;

  return (
    <div
      className="relative w-full shrink-0"
      style={{ height: cardH }}
      data-pw={`demo-order-card-${order.id}`}
    >
      {/* Full-bleed 4 px status bar on the screen's left edge (x 0) */}
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 pointer-events-none"
        style={{
          width: 4,
          height: order.edgeHeight,
          background: order.edgeColor,
        }}
      />

      <motion.div
        whileTap={{ scale: 0.992 }}
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="cursor-pointer [-webkit-tap-highlight-color:transparent]"
      >
        <Box
          ml={12}
          w={fill(12)}
          h={cardH}
          radius={15}
          fill={C.card}
          stroke={inProgress ? C.purple : undefined}
          strokeWidth={0.3}
          className="overflow-hidden"
        >
          {/* Clipboard icon at (26.44, 175.99) -> relative (14.44, 11.99) */}
          <XdIcon
            name="orderCardIcon"
            className="absolute"
            style={{ left: 26.44 - 12, top: 175.99 - 164 }}
          />

          {/* Product thumbnails at y 176 (rel 12), right-aligned 12 in, 20 x 30, 1 px apart */}
          <div
            className="absolute flex items-center"
            style={{ top: 12, right: 12, gap: 1 }}
          >
            {order.listThumbs.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt=""
                draggable={false}
                className="block shrink-0 object-cover"
                style={{ width: 20, height: 30 }}
              />
            ))}
          </div>

          {/* Row 1: # TTISA10012 (left) | 2 Item . 160 USD (right), baseline 227 -> top 50 */}
          <div
            className="absolute flex items-baseline justify-between"
            style={{
              left: 12,
              right: 12,
              top: textTop(227, 13) - 164,
            }}
          >
            <Txt size={13} weight="medium" color={C.ink}>
              {`# ${order.id}`}
            </Txt>
            <Txt size={13} weight="regular" color={C.ink}>
              <span className="font-medium">{order.itemCount}</span>{" "}
              {`${t("Item")} . `}
              <span className="font-medium">{order.totalUsd}</span>
              {` ${t("USD")}`}
            </Txt>
          </div>

          {/* Row 2: Today | 13:59:00 (left) | In Progress / Delivered | 6 Item (right), baseline 247 -> top 72 */}
          <div
            className="absolute flex items-baseline justify-between"
            style={{
              left: 12,
              right: 12,
              top: textTop(247, 11) - 164,
            }}
          >
            <Txt size={11} weight="regular" color={C.ink}>
              {`${t("Today")} | ${order.dateLabel}`}
            </Txt>
            {inProgress ? (
              <Txt size={11} weight="medium" color={C.ink}>
                {t("In Progress")}
              </Txt>
            ) : (
              <Txt size={11} weight="regular" color={C.ink}>
                <span style={{ color: C.purple }}>{t("Delivered")}</span>
                {" | "}
                <span className="font-medium">
                  {`${order.itemCount} ${t("Item")}`}
                </span>
              </Txt>
            )}
          </div>

          {/* In-progress mini timeline bar + status button */}
          {inProgress && (
            <>
              {/* Track at y 256 -> rel top 92 */}
              <div
                className="absolute"
                style={{ left: 12, right: 12, top: 256 - 164, height: 4 }}
              >
                {/* Grey base track: abs x 31..406 -> rel left 7, right 0 */}
                <div
                  className="absolute top-0"
                  style={{
                    left: 31 - 24,
                    right: 0,
                    height: 4,
                    borderRadius: 6,
                    background: C.line,
                  }}
                />
                {/* Purple fill: abs x 24, w 84 */}
                <div
                  className="absolute left-0 top-0"
                  style={{
                    width: 84,
                    height: 4,
                    borderRadius: 6,
                    background: C.purple,
                  }}
                />
                {/* Worker icon at abs (106.99, 248) -> rel (82.99, -8) */}
                <XdIcon
                  name="orderWorkSmall"
                  className="absolute"
                  style={{ left: 106.99 - 24, top: 248 - 256 }}
                />
              </div>

              {/* Bottom pill: abs (24, 266) 382 x 30, r 10, fill #F8F8F8, stroke #4A31E7 0.3 */}
              <div
                className="absolute flex justify-center"
                style={{
                  left: 12,
                  right: 12,
                  top: 266 - 164,
                  height: 30,
                  borderRadius: 10,
                  background: C.field,
                }}
              >
                <Txt
                  size={11}
                  weight="medium"
                  color={C.ink}
                  mt={textTop(284, 11) - 266}
                >
                  <span className="font-bold">{order.itemCount}</span>{" "}
                  <span className="font-normal">{t("Item")}</span>{" "}
                  {t("Preparing…")}
                </Txt>
                <Stroke color={C.purple} width={0.3} radius={10} />
              </div>
            </>
          )}
        </Box>
      </motion.div>
    </div>
  );
}
