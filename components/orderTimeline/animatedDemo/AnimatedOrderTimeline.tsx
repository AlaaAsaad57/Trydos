"use client";

import React, { useEffect, useRef, useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import type { DemoKey } from "../../DemoApp/demoKeys";
import {
  ORDER_PHOTO_PAJAMA,
  ORDER_PHOTO_SHIRT,
  type OrderStage,
} from "../../DemoApp/demoOrders";
import { C, fill, lineBox, textTop } from "../../DemoApp1/demo1Layout";
import { Box, Stroke, Txt } from "../../DemoApp1/ui";
import { ORDER_TIMELINE_SVG } from "./animatedOrderTimelineMarkup";
import {
  END_MS,
  REST_MS,
  collectTimelineParts,
  renderTimelineScene,
  type FloatingBadgeKind,
  type LiveTimelineHud,
} from "./animatedOrderTimelineMotion";

const CARD_W = 406;
const pct = (x: number) => `${(x / CARD_W) * 100}%`;

const MOVING_BADGE_STYLE: Record<
  FloatingBadgeKind,
  { bg: string; color: string; medium: boolean }
> = {
  Packing: { bg: C.purple, color: C.card, medium: false },
  "Shipping Operations": { bg: C.purple, color: C.card, medium: false },
  "Remaining 1 Day": { bg: "#BEF4CD", color: C.ink, medium: true },
  "Waiting Pickup 30": { bg: "#FCF991", color: C.ink, medium: true },
};

/** Mini 10 x 14 product thumbnail sitting above the timeline track at static rest. */
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

type ControlState = {
  ms: number;
  mode: "play" | "seek" | "hold" | "idle";
  target: number;
  idleStage: OrderStage;
  holdRemaining: number;
  loopAuto: boolean;
};

/**
 * The Order Timeline Widget — XD `Home Page – 60`, `– 62`, `– 61`, `– 64`,
 * `– 66`, and `– 63` (406 x 98, `#FCFCFC`, 0.5 px `#C4C2C2` inside stroke,
 * radius 15).
 *
 * Uses the exact physics engine of `/timeline`'s first example (`OrderJourney` /
 * `journeyMotion.ts` — iOS cubic-beziers, analytical springs & kicks,
 * spring-damper ODE suspension & swing, 2-bone IK foot-planted walking,
 * cubic-bezier gravity-turn rocket with gimballed flame & smoke trail, and
 * split-wheel truck suspension) mapped 1:1 onto the 6 new XD icons and styles:
 *
 *   • Each order product runs its own staggered independent journey.
 *   • Each product photo IS the physical delivered box (carried individually by
 *     the cart, packing desk, worker, rocket porthole, and truck roof), keeping
 *     the top status-label strip 100% unobstructed.
 *   • Runs automatically on mount without requiring a click, and switches cleanly
 *     to step-by-step seeking whenever the order / item stage changes.
 */
export default function AnimatedOrderTimeline({
  stage,
  mt,
  playKey = 0,
  scrubMs = null,
  autoPlay = true,
  onSelectStage,
  t,
}: {
  stage: OrderStage;
  mt: number;
  /** Increment to play the full dual-product physics story end-to-end. */
  playKey?: number;
  /** Optional deterministic timestamp (ms) for frame capture / inspection. */
  scrubMs?: number | null;
  /**
   * When true (default for demo showcase), automatically plays the full
   * dual-product 6-icon physics journey on mount without requiring a click,
   * looping cleanly. Passing `false` (or tapping a stage pill / updating `stage`)
   * runs step-by-step physics seeking between order statuses.
   */
  autoPlay?: boolean;
  onSelectStage?: (next: OrderStage) => void;
  t: (key: DemoKey) => string;
}) {
  const stageRef = useRef<SVGSVGElement>(null);
  const badgeLeftRef = useRef<HTMLDivElement>(null);
  const badgeRightRef = useRef<HTMLDivElement>(null);
  const partsRef = useRef<ReturnType<typeof collectTimelineParts> | null>(null);
  const controlRef = useRef<ControlState>({
    ms: stage === "showcase" ? 0 : REST_MS[stage],
    mode: "idle",
    target: stage === "showcase" ? 0 : REST_MS[stage],
    idleStage: stage,
    holdRemaining: 0,
    loopAuto: autoPlay && stage !== "showcase",
  });
  const stagePropRef = useRef<OrderStage>(stage);
  const lastPlayKeyRef = useRef(playKey);
  const mountedRef = useRef(false);

  const [hud, setHud] = useState<LiveTimelineHud>({
    visualStage: stage,
    isMoving: false,
    prepCount: stage === "preparing" ? 2 : stage === "split" || stage === "showcase" ? 1 : 0,
    shipCount:
      stage === "split" || stage === "showcase"
        ? 1
        : stage === "shipped" || stage === "pickup"
          ? 2
          : 0,
    delivCount: stage === "delivered" ? 2 : 0,
    badgeLeft: null,
    badgeLeftX: 69,
    badgeLeftY: 3,
    badgeRight: null,
    badgeRightX: 258,
    badgeRightY: 3,
  });

  const syncBadgePositions = (st: LiveTimelineHud) => {
    const leftEl = badgeLeftRef.current;
    if (leftEl) {
      leftEl.style.left = pct(st.badgeLeftX);
      leftEl.style.top = `${st.badgeLeftY.toFixed(2)}px`;
    }
    const rightEl = badgeRightRef.current;
    if (rightEl) {
      rightEl.style.left = pct(st.badgeRightX);
      rightEl.style.top = `${st.badgeRightY.toFixed(2)}px`;
    }
  };

  // 1. Mount single rAF loop & collect SVG DOM references once
  useEffect(() => {
    const svg = stageRef.current;
    if (!svg) return;
    const S = collectTimelineParts(svg);
    partsRef.current = S;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (scrubMs !== null) {
      const st = renderTimelineScene(S, scrubMs, scrubMs, null, false);
      syncBadgePositions(st);
      setHud(st);
      return;
    }

    const c = controlRef.current;
    const initialStage = stagePropRef.current;
    c.idleStage = initialStage;
    if (reduce || initialStage === "showcase") {
      c.ms = initialStage === "showcase" ? 0 : REST_MS[initialStage];
      c.target = c.ms;
      c.mode = "idle";
      c.loopAuto = false;
    } else if (autoPlay) {
      // Auto-play the full dual-product physics journey immediately without requiring a click
      c.ms = 0;
      c.target = END_MS;
      c.mode = "play";
      c.loopAuto = true;
    } else {
      // Step-by-step mode: seek smoothly into the order's current stage and settle
      c.ms = 0;
      c.target = REST_MS[initialStage];
      c.mode = "seek";
      c.loopAuto = false;
    }
    mountedRef.current = true;

    let last = performance.now();
    let raf = 0;
    let lastKey = "";

    const tick = (now: number) => {
      const dt = Math.min(50, Math.max(0, now - last));
      last = now;

      if (c.mode === "play") {
        c.ms = Math.min(END_MS, c.ms + dt);
        if (c.ms >= END_MS) {
          c.mode = "hold";
          c.holdRemaining = 1400;
        }
      } else if (c.mode === "hold") {
        c.holdRemaining -= dt;
        if (c.holdRemaining <= 0) {
          if (c.loopAuto) {
            c.ms = 0;
            c.target = END_MS;
            c.mode = "play";
          } else {
            const rest = stagePropRef.current;
            c.idleStage = rest;
            c.ms = rest === "showcase" ? 0 : REST_MS[rest];
            c.target = c.ms;
            c.mode = "idle";
          }
        }
      } else if (c.mode === "seek") {
        c.ms = Math.min(c.target, c.ms + dt * 1.55);
        if (c.ms >= c.target) {
          c.mode = "idle";
          c.idleStage = stagePropRef.current;
        }
      }

      const st = renderTimelineScene(
        S,
        c.ms,
        now,
        c.mode === "idle" ? c.idleStage : null,
        reduce,
      );
      syncBadgePositions(st);
      const key = `${st.visualStage}|${st.isMoving}|${st.prepCount}|${st.shipCount}|${st.delivCount}|${st.badgeLeft ?? ""}|${st.badgeRight ?? ""}`;
      if (key !== lastKey) {
        lastKey = key;
        setHud(st);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const onScrub = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail !== "number") return;
      cancelAnimationFrame(raf);
      const st = renderTimelineScene(S, detail, detail, null, false);
      syncBadgePositions(st);
      setHud(st);
    };
    window.addEventListener("demo-timeline-scrub", onScrub);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("demo-timeline-scrub", onScrub);
    };
  }, [scrubMs, autoPlay]);

  // 2. Step-by-step physics seek whenever the order stage changes
  useEffect(() => {
    stagePropRef.current = stage;
    if (!mountedRef.current || scrubMs !== null) return;
    const c = controlRef.current;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (stage === "showcase" || reduce) {
      c.loopAuto = false;
      c.idleStage = stage;
      c.ms = stage === "showcase" ? 0 : REST_MS[stage];
      c.target = c.ms;
      c.mode = "idle";
      return;
    }

    const nextTarget = REST_MS[stage];
    c.loopAuto = false;
    c.idleStage = stage;
    c.target = nextTarget;
    if (c.mode === "hold" || nextTarget < c.ms) {
      c.ms = 0;
    }
    c.mode = "seek";
  }, [stage, scrubMs]);

  // 3. Replay full dual-product physics story when track is tapped or playKey increments
  const triggerPlay = () => {
    if (scrubMs !== null) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const c = controlRef.current;
    c.ms = 0;
    c.target = END_MS;
    c.loopAuto = autoPlay && stagePropRef.current !== "showcase";
    c.mode = "play";
  };

  useEffect(() => {
    if (playKey === lastPlayKeyRef.current) return;
    lastPlayKeyRef.current = playKey;
    triggerPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey]);

  const moving = hud.isMoving;

  // Bottom pill appearances (exact XD: y +56, w 90, h 18, r 6)
  const pill1Active = moving
    ? hud.prepCount > 0
    : stage === "preparing" || stage === "split" || stage === "showcase";
  const pill1Outlined = moving
    ? hud.prepCount === 0 && hud.shipCount > 0
    : stage === "shipped" || stage === "pickup";
  const pill1Text = moving
    ? hud.prepCount > 0
      ? `${hud.prepCount} ${t("Preparing")}`
      : t("Preparing")
    : stage === "preparing" || stage === "split" || stage === "showcase"
      ? `1 ${t("Preparing")}`
      : t("Preparing");

  const pill2Active = moving
    ? hud.shipCount > 0
    : stage === "split" ||
      stage === "shipped" ||
      stage === "pickup" ||
      stage === "showcase";
  const pill2Stroke = moving
    ? hud.prepCount > 0 && hud.shipCount > 0
      ? "#513AAF"
      : undefined
    : stage === "split"
      ? "#513AAF"
      : undefined;
  const pill2Text = moving
    ? hud.prepCount > 0 && hud.shipCount > 0
      ? `${hud.shipCount} ${t("Shipped")}`
      : t("Shipped")
    : stage === "split" || stage === "showcase"
      ? `1 ${t("Shipped")}`
      : t("Shipped");

  const pill3Active = moving ? hud.delivCount === 2 : stage === "delivered";

  const renderFloatingBadge = (
    kind: FloatingBadgeKind,
    ref: React.RefObject<HTMLDivElement | null>,
    x: number,
    y: number,
  ) => {
    const meta = MOVING_BADGE_STYLE[kind];
    return (
      <div
        ref={ref}
        key={kind}
        className="absolute flex items-center pointer-events-none z-[3] ot-badge-pop"
        style={{
          left: pct(x),
          top: y,
          height: 14,
          paddingLeft: 7,
          paddingRight: 7,
          borderRadius: 6,
          background: meta.bg,
        }}
      >
        <Txt
          size={8}
          weight={meta.medium ? "medium" : "regular"}
          color={meta.color}
        >
          {kind === "Waiting Pickup 30" ? (
            <>
              {`${t("Waiting Pickup 30")} `}
              <span className="font-normal">m</span>
            </>
          ) : (
            t(kind)
          )}
        </Txt>
      </div>
    );
  };

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
      className="overflow-visible"
      data-pw="demo-order-timeline"
    >
      {/* Tap upper track area anytime to replay the full dual-product physics story */}
      <button
        type="button"
        aria-label={t("Order Details & Status")}
        data-pw="demo-order-timeline-play"
        onClick={triggerPlay}
        className="absolute left-0 top-0 w-full h-[54px] cursor-pointer bg-transparent border-0 p-0 z-[1] [-webkit-tap-highlight-color:transparent]"
      />

      {/* Top row above the track: exact XD thumbnails + status badges at rest,
          or dual non-overlapping live status labels while product photo-boxes travel below */}
      {moving ? (
        <>
          {hud.badgeLeft &&
            renderFloatingBadge(
              hud.badgeLeft,
              badgeLeftRef,
              hud.badgeLeftX,
              hud.badgeLeftY,
            )}
          {hud.badgeRight &&
            renderFloatingBadge(
              hud.badgeRight,
              badgeRightRef,
              hud.badgeRightX,
              hud.badgeRightY,
            )}
        </>
      ) : (
        <>
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
        </>
      )}

      {/* Physics SVG stage: exact 406 x 54 upper canvas (overflow visible for rocket flight arc) */}
      <svg
        ref={stageRef}
        viewBox="0 0 406 54"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
        className="absolute left-0 top-0 w-full h-[54px] overflow-visible pointer-events-none z-[2]"
        dangerouslySetInnerHTML={{ __html: ORDER_TIMELINE_SVG }}
      />

      {/* Home Page – 63 static all-6-icons showcase row (hidden while full journey plays) */}
      {stage === "showcase" && !moving && (
        <div className="pointer-events-none z-[3]">
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

      {/* Three stage pills (top 56, h 18, w 90, r 6) — tappable to seek with physics */}
      <StagePill
        left={12}
        active={pill1Active}
        outlined={pill1Outlined}
        label={pill1Text}
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
        onClick={() =>
          onSelectStage?.(stage === "shipped" ? "pickup" : "shipped")
        }
        testId="demo-order-stage-shipped"
      />
      <StagePill
        left={304}
        active={pill3Active}
        label={t("Delivered")}
        onClick={() => onSelectStage?.("delivered")}
        testId="demo-order-stage-delivered"
      />

      {/* Three timestamp / ETA sub-labels centered under each pill */}
      <div
        className="absolute flex justify-center pointer-events-none"
        style={{ left: pct(12), width: pct(90), top: textTop(640, 8) - 554 - 1 }}
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
        style={{ left: pct(162), width: pct(90), top: textTop(640, 8) - 554 - 1 }}
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
        style={{ left: pct(304), width: pct(90), top: textTop(640, 8) - 554 - 1 }}
      >
        <Txt size={8} color={C.ink}>
          {stage === "delivered"
            ? `${t("Picked")} 19:21`
            : t("EST Tomorrow 14:00")}
        </Txt>
      </div>

      <style>{`.ot-badge-pop{animation:ot-badge-pop .32s cubic-bezier(.22,1.12,.36,1)}@keyframes ot-badge-pop{from{opacity:0;transform:translateY(3px) scale(.94)}to{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){.ot-badge-pop{animation:none}}`}</style>
    </Box>
  );
}

function StagePill({
  left,
  active,
  outlined = false,
  stroke,
  label,
  onClick,
  testId,
}: {
  left: number;
  active: boolean;
  outlined?: boolean;
  stroke?: string;
  label: string;
  onClick: () => void;
  testId: string;
}) {
  const bg = active ? C.purple : outlined ? C.card : C.field;
  const fg = active ? C.card : C.ink;
  const strokeColor = stroke ?? (outlined ? C.purple : undefined);

  return (
    <button
      type="button"
      data-pw={testId}
      onClick={onClick}
      className="absolute flex items-center justify-center cursor-pointer active:opacity-80 transition-colors duration-300 [-webkit-tap-highlight-color:transparent]"
      style={{
        left: pct(left),
        top: 56,
        width: pct(90),
        height: 18,
        borderRadius: 6,
        background: bg,
      }}
    >
      <span
        className="font-quicksand font-normal whitespace-nowrap transition-colors duration-300"
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
