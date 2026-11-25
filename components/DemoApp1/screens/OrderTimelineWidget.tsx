"use client";

import React from "react";
import XdIcon from "../../DemoApp/XdIcon";
import type { DemoKey } from "../../DemoApp/demoKeys";
import {
  ORDER_PHOTO_PAJAMA,
  ORDER_PHOTO_SHIRT,
  type OrderStage,
} from "../../DemoApp/demoOrders";
import { C, fill, lineBox, textTop } from "../demo1Layout";
import { Box, Stroke, Txt } from "../ui";

const CARD_W = 406;
const pct = (x: number) => `${(x / CARD_W) * 100}%`;

const GREEN_BAR = "#31E770";
const CYAN_BAR = "#38E0FF";
const DOT_HINT = "#C3C3C3";
const PILL_INACTIVE_BG = "#F4F4F4";

/** Mini 10 x 14 product thumbnail sitting above the timeline track. */
function MiniThumb({
  src,
  left,
  border = false,
}: {
  src: string;
  left: number;
  border?: boolean;
}) {
  return (
    <div
      className="absolute overflow-hidden pointer-events-none"
      style={{
        left: pct(left),
        top: 8,
        width: 10,
        height: 14,
        borderRadius: 2,
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="block w-full h-full object-cover"
      />
      {border && <Stroke color={C.line} width={0.5} radius={2} />}
    </div>
  );
}

/**
 * Instant static Order Timeline Widget — XD `Home Page – 60`, `– 62`, `– 61`,
 * `– 64`, `– 66`, and `– 63` (406 x 98, `#FCFCFC`, 0.5 px `#C4C2C2` inside
 * stroke, radius 15).
 *
 * Displays the order's current status immediately with zero animation.
 * (The animated dual-product physics version is preserved in
 * `components/orderTimeline/animatedDemo` for reuse elsewhere.)
 */
export default function OrderTimelineWidget({
  stage,
  mt,
  onSelectStage,
  t,
}: {
  stage: OrderStage;
  mt: number;
  onSelectStage?: (next: OrderStage) => void;
  t: (key: DemoKey) => string;
}) {
  const isDelivered = stage === "delivered";

  const mainFillWidth =
    stage === "preparing" || stage === "showcase"
      ? 84
      : stage === "split"
        ? 224
        : 240;

  const dot0Fill = isDelivered ? C.ink : C.purple;
  const dot1Fill = isDelivered
    ? C.ink
    : stage === "preparing" || stage === "showcase"
      ? DOT_HINT
      : C.purple;
  const dot2Fill = isDelivered ? C.purple : C.line;

  // Bottom pill appearances (exact XD: y +56, w 90, h 18, r 6)
  const pill1Active =
    stage === "preparing" || stage === "split" || stage === "showcase";
  const pill1Outlined = stage === "shipped" || stage === "pickup";
  const pill1Text =
    stage === "preparing" || stage === "split" || stage === "showcase"
      ? `1 ${t("Preparing")}`
      : t("Preparing");

  const pill2Active =
    stage === "split" ||
    stage === "shipped" ||
    stage === "pickup" ||
    stage === "showcase";
  const pill2Stroke = stage === "split" ? "#513AAF" : undefined;
  const pill2Text =
    stage === "split" || stage === "showcase"
      ? `1 ${t("Shipped")}`
      : t("Shipped");

  const pill3Active = isDelivered;

  return (
    <Box
      mt={mt}
      ml={12}
      w={fill(12)}
      h={98}
      radius={15}
      fill={C.card}
      stroke="#C4C2C2"
      strokeWidth={0.5}
      data-pw="demo-order-timeline"
    >
      {/* Top row above the track: exact XD thumbnails + status badges */}
      {stage === "preparing" && (
        <>
          <MiniThumb src={ORDER_PHOTO_SHIRT} left={59 - 12} />
          <MiniThumb src={ORDER_PHOTO_PAJAMA} left={70 - 12} border />
          <div
            className="absolute flex items-start pointer-events-none"
            style={{
              left: pct(82 - 12),
              top: 8,
              width: 45,
              height: 14,
              paddingLeft: 8,
              borderRadius: 6,
              background: C.purple,
            }}
          >
            <Txt size={8} color={C.card} mt={textTop(572, 8) - 562}>
              {t("Packing")}
            </Txt>
          </div>
        </>
      )}

      {stage === "split" && (
        <>
          <MiniThumb src={ORDER_PHOTO_SHIRT} left={70 - 12} />
          <div
            className="absolute flex items-start pointer-events-none"
            style={{
              left: pct(82 - 12),
              top: 8,
              width: 45,
              height: 14,
              paddingLeft: 8,
              borderRadius: 6,
              background: C.purple,
            }}
          >
            <Txt size={8} color={C.card} mt={textTop(572, 8) - 562}>
              {t("Packing")}
            </Txt>
          </div>
          <MiniThumb src={ORDER_PHOTO_PAJAMA} left={194 - 12} border />
          <div
            className="absolute flex items-start pointer-events-none"
            style={{
              left: pct(206 - 12),
              top: 8,
              width: 91,
              height: 14,
              paddingLeft: 8,
              borderRadius: 6,
              background: C.purple,
            }}
          >
            <Txt size={8} color={C.card} mt={textTop(572, 8) - 562}>
              {t("Shipping Operations")}
            </Txt>
          </div>
        </>
      )}

      {stage === "shipped" && (
        <>
          <MiniThumb src={ORDER_PHOTO_SHIRT} left={218 - 12} />
          <MiniThumb src={ORDER_PHOTO_PAJAMA} left={229 - 12} border />
          <div
            className="absolute flex items-start pointer-events-none"
            style={{
              left: pct(241 - 12),
              top: 8,
              width: 75,
              height: 14,
              paddingLeft: 6,
              borderRadius: 6,
              background: "#BEF4CD",
            }}
          >
            <Txt
              size={8}
              weight="medium"
              color={C.ink}
              mt={textTop(572, 8) - 562}
            >
              {t("Remaining 1 Day")}
            </Txt>
          </div>
        </>
      )}

      {stage === "pickup" && (
        <>
          <MiniThumb src={ORDER_PHOTO_SHIRT} left={294 - 12} />
          <MiniThumb src={ORDER_PHOTO_PAJAMA} left={305 - 12} border />
          <div
            className="absolute flex items-start pointer-events-none"
            style={{
              left: pct(317 - 12),
              top: 8,
              width: 89,
              height: 14,
              paddingLeft: 6,
              borderRadius: 6,
              background: "#FCF991",
            }}
          >
            <Txt
              size={8}
              weight="medium"
              color={C.ink}
              mt={textTop(572, 8) - 562}
            >
              {`${t("Waiting Pickup 30")} `}
              <span className="font-normal">m</span>
            </Txt>
          </div>
        </>
      )}

      {stage === "delivered" && (
        <>
          <MiniThumb src={ORDER_PHOTO_SHIRT} left={351 - 12} />
          <MiniThumb src={ORDER_PHOTO_PAJAMA} left={362 - 12} border />
        </>
      )}

      {stage === "showcase" && (
        <>
          <MiniThumb src={ORDER_PHOTO_SHIRT} left={60 - 12} />
          <div
            className="absolute flex items-start pointer-events-none"
            style={{
              left: pct(74 - 12),
              top: 8,
              width: 45,
              height: 14,
              paddingLeft: 8,
              borderRadius: 6,
              background: C.purple,
            }}
          >
            <Txt size={8} color={C.card} mt={textTop(556, 8) - 546}>
              {t("Packing")}
            </Txt>
          </div>
          <MiniThumb src={ORDER_PHOTO_PAJAMA} left={214 - 12} border />
        </>
      )}

      {/* Track bar & milestone dots (exact XD 406 x 54 upper geometry) */}
      <svg
        viewBox="0 0 406 54"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
        className="absolute left-0 top-0 w-full h-[54px] pointer-events-none"
      >
        {/* Base rail: x 19..394, y 35, h 4, rx 2 */}
        <rect
          x="19"
          y="35"
          width="375"
          height="4"
          rx="2"
          fill={isDelivered ? C.ink : C.line}
        />

        {/* Primary progress bar: x 12.., y 35, h 4, rx 2 */}
        <rect
          x="12"
          y="35"
          width={mainFillWidth}
          height="4"
          rx="2"
          fill={isDelivered ? C.ink : C.purple}
        />
        {isDelivered && (
          <rect
            x="12.25"
            y="35.25"
            width="239.5"
            height="3.5"
            rx="1.75"
            fill="none"
            stroke={C.purple}
            strokeWidth="0.5"
          />
        )}

        {/* Secondary progress bar (green on HP 61, cyan on HP 64) */}
        {(stage === "shipped" || stage === "pickup") && (
          <>
            <rect
              x="247"
              y="35"
              width={stage === "shipped" ? 19 : 89}
              height="4"
              rx="2"
              fill={stage === "shipped" ? GREEN_BAR : CYAN_BAR}
            />
            <rect
              x="247.25"
              y="35.25"
              width={stage === "shipped" ? 18.5 : 88.5}
              height="3.5"
              rx="1.75"
              fill="none"
              stroke={C.purple}
              strokeWidth="0.5"
            />
          </>
        )}

        {/* Three XD milestone dots: r 7 at cx 57, 207, 349, cy 37 */}
        <circle cx="57" cy="37" r="7" fill={dot0Fill} />
        <circle cx="207" cy="37" r="7" fill={dot1Fill} />
        {(stage === "shipped" || stage === "pickup" || isDelivered) && (
          <circle
            cx="207"
            cy="37"
            r="6.75"
            fill="none"
            stroke={C.ink}
            strokeWidth="0.5"
          />
        )}
        <circle cx="349" cy="37" r="7" fill={dot2Fill} />
      </svg>

      {/* Instant XD track icons */}
      {(stage === "preparing" || stage === "split") && (
        <XdIcon
          name="orderWorkTrack"
          className="absolute pointer-events-none"
          style={{ left: pct(94 - 12), top: 578 - 554 }}
        />
      )}

      {stage === "split" && (
        <XdIcon
          name="orderRocketUpPurple"
          className="absolute pointer-events-none"
          style={{ left: pct(238.15 - 12), top: 578.44 - 554 }}
        />
      )}

      {stage === "shipped" && (
        <XdIcon
          name="orderTruckTrack"
          className="absolute pointer-events-none"
          style={{ left: pct(269.05 - 12), top: 582.36 - 554 }}
        />
      )}

      {stage === "showcase" && (
        <div className="pointer-events-none">
          <XdIcon
            name="orderCartPurple"
            className="absolute"
            style={{ left: pct(87.99 - 12), top: 562.12 - 538 }}
          />
          <XdIcon
            name="orderWorkGrey"
            className="absolute"
            style={{ left: pct(134 - 12), top: 562 - 538 }}
          />
          <XdIcon
            name="orderCarryGrey"
            className="absolute"
            style={{ left: pct(182.5 - 12), top: 562 - 538 }}
          />
          <XdIcon
            name="orderRocketUpGrey"
            className="absolute"
            style={{ left: pct(246.15 - 12), top: 562.44 - 538 }}
          />
          <XdIcon
            name="orderRocketDownGrey"
            className="absolute"
            style={{ left: pct(286.15 - 12), top: 562.44 - 538 }}
          />
          <XdIcon
            name="orderTruckTrack"
            className="absolute"
            style={{ left: pct(322.05 - 12), top: 566.36 - 538 }}
          />
        </div>
      )}

      {/* Three stage pills (top 56, h 18, w 90, r 6) — instant status switch */}
      <StagePill
        left={12}
        active={pill1Active}
        outlined={pill1Outlined}
        label={pill1Text}
        nudge={pill1Active ? -0.25 : 0}
        onClick={() =>
          onSelectStage?.(stage === "preparing" ? "split" : "preparing")
        }
        testId="demo-order-stage-preparing"
      />
      <StagePill
        left={162}
        active={pill2Active}
        stroke={pill2Stroke}
        label={pill2Text}
        nudge={
          stage === "preparing"
            ? 0.5
            : stage === "split" || stage === "showcase"
              ? 0.41
              : stage === "delivered"
                ? -0.5
                : -0.19
        }
        onClick={() =>
          onSelectStage?.(stage === "shipped" ? "pickup" : "shipped")
        }
        testId="demo-order-stage-shipped"
      />
      <StagePill
        left={304}
        active={pill3Active}
        label={t("Delivered")}
        nudge={pill3Active ? 0.41 : 0}
        onClick={() => onSelectStage?.("delivered")}
        testId="demo-order-stage-delivered"
      />

      {/* Three timestamp / ETA sub-labels under each pill (baseline +86 -> top 78) */}
      <div
        className="absolute flex justify-center pointer-events-none"
        style={{
          left: pct(12),
          width: pct(90),
          top: 86 - 8,
          paddingLeft: stage === "preparing" ? 0.28 : 1.22,
        }}
      >
        <Txt size={8} color={C.ink}>
          {stage === "preparing" ? (
            <>
              {"14:58 | "}
              <span className="font-medium" style={{ color: C.blue }}>
                10:12
              </span>
            </>
          ) : (
            "14:58 | 16:20"
          )}
        </Txt>
      </div>

      <div
        className="absolute flex justify-center pointer-events-none"
        style={{
          left: pct(162),
          width: pct(90),
          top: 86 - 8,
          paddingLeft:
            stage === "preparing"
              ? 2.46
              : stage === "pickup" || stage === "delivered"
                ? 0.74
                : 0.28,
        }}
      >
        <Txt size={8} color={C.ink}>
          {stage === "preparing"
            ? t("EST Today In 6 Hours")
            : stage === "pickup" || stage === "delivered"
              ? "17:10 | 19:00"
              : `17:10 | ${t("On Way")}`}
        </Txt>
      </div>

      <div
        className="absolute flex justify-center pointer-events-none"
        style={{
          left: pct(304),
          width: pct(90),
          top: 86 - 8,
          paddingLeft: isDelivered ? 0.6 : 4,
        }}
      >
        <Txt size={8} color={C.ink}>
          {stage === "delivered"
            ? `${t("Picked")} 19:21`
            : t("EST Tomorrow 14:00")}
        </Txt>
      </div>
    </Box>
  );
}

function StagePill({
  left,
  active,
  outlined = false,
  stroke,
  label,
  nudge = 0,
  onClick,
  testId,
}: {
  left: number;
  active: boolean;
  outlined?: boolean;
  stroke?: string;
  label: string;
  nudge?: number;
  onClick: () => void;
  testId: string;
}) {
  const bg = active ? C.purple : PILL_INACTIVE_BG;
  const fg = active ? C.card : C.ink;
  const strokeColor = stroke ?? (outlined ? C.purple : undefined);

  return (
    <button
      type="button"
      data-pw={testId}
      onClick={onClick}
      className="absolute flex items-center justify-center cursor-pointer active:opacity-80 [-webkit-tap-highlight-color:transparent]"
      style={{
        left: pct(left),
        top: 56,
        width: pct(90),
        height: 18,
        borderRadius: 6,
        background: bg,
        paddingLeft: nudge > 0 ? nudge * 2 : undefined,
        paddingRight: nudge < 0 ? -nudge * 2 : undefined,
      }}
    >
      <span
        className={`font-quicksand ${active ? "font-medium" : "font-normal"} whitespace-nowrap`}
        style={{
          fontSize: 11,
          lineHeight: `${lineBox(11)}px`,
          color: fg,
        }}
      >
        {label}
      </span>
      {strokeColor && <Stroke color={strokeColor} width={0.5} radius={6} />}
    </button>
  );
}
