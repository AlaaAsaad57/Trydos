"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cubicBezier, spring, type Transition } from "framer-motion";
import { SAFE_TOP } from "../demo1Layout";

/**
 * The timing of the product page's buy sheet, and the debug menu that lets the
 * client try other timing on their own phone. The menu's button sits with the
 * demo's other switches (`demo-controls` in Demo1Shell), and only while a product
 * page is on show.
 *
 * The state lives in this module and in the browser's storage, so a choice stays
 * through a reload. `Copy values` gives the choice as text, to send back to us.
 *
 * Why only sliders and chips: the demo's keyboard opens for a text field, and a
 * native select zooms the page on the iPhone.
 *
 * About the iOS names. Apple publishes no numbers for its sheet in iOS 26. The
 * "Current" curve is the one of Ionic's iOS modal and of Vaul, made to look like
 * the iOS sheet. The three iOS springs use the idea of SwiftUI's presets (a
 * duration and a bounce). Their numbers come from a third-party table, and Apple
 * does not confirm them.
 */

export type Ease = readonly [number, number, number, number];

export type BuyMotion = {
  kind: "curve" | "spring";
  /** The sheet, the card, the button and the bag, in seconds. */
  duration: number;
  ease: Ease;
  /** For a spring: 0 is no bounce. */
  bounce: number;
  /** One block inside the sheet, in seconds. */
  blockDuration: number;
  /** The wait between two blocks, in seconds. */
  gap: number;
  /** The flight to the bag, in seconds. */
  flight: number;
  /** The flight's curve. Null: slow at both ends. */
  flightEase: Ease | null;
  /** How strong the card's hit on the glass is: 0 is no hit. */
  hit: number;
};

const CURRENT_EASE: Ease = [0.32, 0.72, 0, 1];
const FASTER_EASE: Ease = [0.16, 1, 0.3, 1];
const SOFTER_EASE: Ease = [0.4, 0, 0.2, 1];

export const CURRENT_MOTION: BuyMotion = {
  kind: "curve",
  duration: 0.5,
  ease: CURRENT_EASE,
  bounce: 0,
  blockDuration: 0.42,
  gap: 0.04,
  flight: 0.86,
  flightEase: null,
  hit: 1,
};

const STYLES = [
  { key: "Current", motion: CURRENT_MOTION },
  { key: "iOS smooth", motion: { ...CURRENT_MOTION, kind: "spring", duration: 0.5, bounce: 0 } },
  { key: "iOS snappy", motion: { ...CURRENT_MOTION, kind: "spring", duration: 0.3, bounce: 0.15, blockDuration: 0.3, gap: 0.03 } },
  { key: "iOS bouncy", motion: { ...CURRENT_MOTION, kind: "spring", duration: 0.5, bounce: 0.3 } },
] as const satisfies readonly { key: string; motion: BuyMotion }[];

const EASES = [
  { key: "Current", ease: CURRENT_EASE },
  { key: "Faster start", ease: FASTER_EASE },
  { key: "Softer", ease: SOFTER_EASE },
] as const;

export type BuyMotionKey =
  | (typeof STYLES)[number]["key"]
  | (typeof EASES)[number]["key"]
  | "Animation timing"
  | "Style"
  | "Custom"
  | "Sheet and card"
  | "Curve"
  | "Spring"
  | "Duration"
  | "Bounce"
  | "Easing"
  | "Content items"
  | "Gap"
  | "Flight to bag"
  | "Smooth both ends"
  | "Hit strength"
  | "Play opening"
  | "Play add to bag"
  | "Copy values"
  | "Copied"
  | "Reset"
  | "Close";

const STORAGE_KEY = "demo-buy-motion";

function saved(): BuyMotion {
  if (typeof window === "undefined") return CURRENT_MOTION;
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    return text ? { ...CURRENT_MOTION, ...JSON.parse(text) } : CURRENT_MOTION;
  } catch {
    return CURRENT_MOTION;
  }
}

let state: BuyMotion = saved();
const listeners = new Set<() => void>();
const tell = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setMotion(next: BuyMotion) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode can refuse storage. The choice still lasts until a reload.
  }
  tell();
}

/** The timing as it is now, for code that runs when an animation starts (a variant, a tap). */
export const buyMotion = () => state;

/**
 * The timing for a component to draw with. Not `buyMotion()` in render: it takes
 * no input, so React Compiler keeps its first answer and a change never arrives.
 */
export const useBuyMotion = () => useSyncExternalStore(subscribe, buyMotion, () => CURRENT_MOTION);

const timing = (duration: number, m: BuyMotion): Transition =>
  m.kind === "spring"
    ? { type: "spring", visualDuration: duration, bounce: m.bounce }
    : { duration, ease: [...m.ease] as [number, number, number, number] };

/** How the sheet, the card, the button and the bag move. */
export const sheetTransition = (m: BuyMotion) => timing(m.duration, m);
/** How one block inside the sheet moves. */
export const blockTransition = (m: BuyMotion) => timing(m.blockDuration, m);
/** The same as CSS, for a CSS transition. CSS has no spring here, so a spring uses the current curve. */
export const sheetCss = (m: BuyMotion) =>
  `${m.duration}s cubic-bezier(${(m.kind === "spring" ? CURRENT_EASE : m.ease).join(", ")})`;

/**
 * When the sheet has gone 90 % of its way, in ms. The eye takes the sheet as
 * landed there: the rest of the way is the slow end of the curve.
 */
export function arrivalMs(m: BuyMotion) {
  const total = m.duration * 1000;
  if (m.kind === "spring") {
    const path = spring(m.duration, m.bounce);
    for (let ms = 0; ms <= 4000; ms += 4) if (path.next(ms).value >= 0.9) return ms;
    return total;
  }
  const curve = cubicBezier(m.ease[0], m.ease[1], m.ease[2], m.ease[3]);
  for (let i = 0; i <= 200; i++) if (curve(i / 200) >= 0.9) return (i / 200) * total;
  return total;
}

/** What the menu's two play buttons do, given by the product page while it is on show. */
export type BuyActions = { playOpening: () => void; playAdd: () => void };
let actions: BuyActions | null = null;

export function registerBuyActions(next: BuyActions) {
  actions = next;
  tell();
  return () => {
    actions = null;
    tell();
  };
}

const sameEase = (a: Ease | null, b: Ease | null) => JSON.stringify(a) === JSON.stringify(b);
const sameMotion = (a: BuyMotion, b: BuyMotion) =>
  (Object.keys(a) as (keyof BuyMotion)[]).every((key) => JSON.stringify(a[key]) === JSON.stringify(b[key]));

const PURPLE = "#402CDD";

function Chip({ on, onPress, testId, children }: { on: boolean; onPress: () => void; testId?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      data-pw={testId}
      onClick={onPress}
      className="cursor-pointer whitespace-nowrap font-semibold [-webkit-tap-highlight-color:transparent]"
      style={{
        fontSize: 11,
        lineHeight: "14px",
        padding: "5px 8px",
        borderRadius: 8,
        color: on ? "#fff" : "#333",
        background: on ? PURPLE : "#F1F1F4",
      }}
    >
      {children}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  testId,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  testId?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block" style={{ marginTop: 6 }}>
      <span className="flex justify-between font-medium" style={{ fontSize: 11, lineHeight: "14px", color: "#333" }}>
        <span>{label}</span>
        <span dir="ltr">
          {Number(value.toFixed(3))}
          {unit}
        </span>
      </span>
      <input
        type="range"
        data-pw={testId}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="block w-full cursor-pointer"
        style={{ height: 24, margin: 0, accentColor: PURPLE, touchAction: "none" }}
      />
    </label>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-bold" style={{ margin: "12px 0 4px", fontSize: 12, lineHeight: "16px", color: "#111" }}>
      {children}
    </p>
  );
}

/** A curve's four numbers, for the tester who wants a curve of their own. */
function EaseSliders({ ease, onChange }: { ease: Ease; onChange: (ease: Ease) => void }) {
  const names = ["X1", "Y1", "X2", "Y2"];
  return (
    <>
      {ease.map((value, i) => (
        <Slider
          key={names[i]}
          label={names[i]}
          value={value}
          min={i % 2 === 0 ? 0 : -0.5}
          max={i % 2 === 0 ? 1 : 1.5}
          step={0.01}
          testId={`demo-motion-ease-${i}`}
          onChange={(next) => onChange(ease.map((old, j) => (j === i ? next : old)) as unknown as Ease)}
        />
      ))}
    </>
  );
}

function Menu({ t, onClose }: { t: (key: BuyMotionKey) => string; onClose: () => void }) {
  const motion = useBuyMotion();
  const [customSheet, setCustomSheet] = useState(() => !EASES.some((e) => sameEase(e.ease, motion.ease)));
  const [customFlight, setCustomFlight] = useState(
    () => motion.flightEase !== null && !EASES.some((e) => sameEase(e.ease, motion.flightEase)),
  );
  const [copied, setCopied] = useState(false);
  const values = JSON.stringify(motion);
  const patch = (change: Partial<BuyMotion>) => setMotion({ ...motion, ...change });

  useEffect(() => {
    if (!copied) return;
    const wait = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(wait);
  }, [copied]);

  // The menu steps aside, so the whole animation can be seen.
  const play = (run: "playOpening" | "playAdd") => {
    onClose();
    actions?.[run]();
  };

  return (
    <section
      role="dialog"
      aria-label={t("Animation timing")}
      data-pw="demo-motion-menu"
      // The open sheet holds the page's scroll and touch (holdPage in ui.tsx). This
      // box keeps them, or the sliders could not be dragged on a phone.
      data-keep-touch=""
      className="font-quicksand select-none"
      style={{
        position: "fixed",
        top: `calc(${SAFE_TOP} + 58px)`,
        left: 8,
        width: "min(290px, calc(100vw - 60px))",
        maxHeight: "calc(100dvh - 190px)",
        overflowY: "auto",
        overscrollBehavior: "contain",
        padding: 12,
        borderRadius: 16,
        background: "rgba(255, 255, 255, 0.97)",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.28)",
        zIndex: 2147483647,
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold" style={{ margin: 0, fontSize: 14, lineHeight: "18px", color: "#111" }}>
          {t("Animation timing")}
        </h2>
        <button
          type="button"
          aria-label={t("Close")}
          data-pw="demo-motion-close"
          onClick={onClose}
          className="cursor-pointer font-bold"
          style={{ width: 26, height: 26, borderRadius: 13, background: "#F1F1F4", color: "#333", fontSize: 14 }}
        >
          ×
        </button>
      </div>

      <div className="flex flex-wrap" style={{ gap: 6, marginTop: 10 }}>
        <Chip on={false} testId="demo-motion-play-open" onPress={() => play("playOpening")}>
          ▶ {t("Play opening")}
        </Chip>
        <Chip on={false} testId="demo-motion-play-add" onPress={() => play("playAdd")}>
          ▶ {t("Play add to bag")}
        </Chip>
      </div>

      <Heading>{t("Style")}</Heading>
      <div className="flex flex-wrap" style={{ gap: 6 }}>
        {STYLES.map((style) => (
          <Chip key={style.key} on={sameMotion(style.motion, motion)} testId={`demo-motion-style-${style.key}`} onPress={() => setMotion(style.motion)}>
            {t(style.key)}
          </Chip>
        ))}
      </div>

      <Heading>{t("Sheet and card")}</Heading>
      <div className="flex flex-wrap" style={{ gap: 6 }}>
        <Chip on={motion.kind === "curve"} testId="demo-motion-kind-curve" onPress={() => patch({ kind: "curve" })}>
          {t("Curve")}
        </Chip>
        <Chip on={motion.kind === "spring"} testId="demo-motion-kind-spring" onPress={() => patch({ kind: "spring" })}>
          {t("Spring")}
        </Chip>
      </div>
      <Slider label={t("Duration")} unit=" s" value={motion.duration} min={0.15} max={1.2} step={0.01} testId="demo-motion-duration" onChange={(duration) => patch({ duration })} />
      {motion.kind === "spring" ? (
        <Slider label={t("Bounce")} value={motion.bounce} min={0} max={0.6} step={0.01} testId="demo-motion-bounce" onChange={(bounce) => patch({ bounce })} />
      ) : (
        <>
          <Heading>{t("Easing")}</Heading>
          <div className="flex flex-wrap" style={{ gap: 6 }}>
            {EASES.map((item) => (
              <Chip
                key={item.key}
                on={!customSheet && sameEase(item.ease, motion.ease)}
                testId={`demo-motion-ease-${item.key}`}
                onPress={() => {
                  setCustomSheet(false);
                  patch({ ease: item.ease });
                }}
              >
                {t(item.key)}
              </Chip>
            ))}
            <Chip on={customSheet} testId="demo-motion-ease-custom" onPress={() => setCustomSheet(true)}>
              {t("Custom")}
            </Chip>
          </div>
          {customSheet && <EaseSliders ease={motion.ease} onChange={(ease) => patch({ ease })} />}
        </>
      )}
      <Slider label={t("Hit strength")} value={motion.hit} min={0} max={2} step={0.1} testId="demo-motion-hit" onChange={(hit) => patch({ hit })} />

      <Heading>{t("Content items")}</Heading>
      <Slider label={t("Duration")} unit=" s" value={motion.blockDuration} min={0.1} max={1} step={0.01} testId="demo-motion-block" onChange={(blockDuration) => patch({ blockDuration })} />
      <Slider label={t("Gap")} unit=" s" value={motion.gap} min={0} max={0.12} step={0.005} testId="demo-motion-gap" onChange={(gap) => patch({ gap })} />

      <Heading>{t("Flight to bag")}</Heading>
      <Slider label={t("Duration")} unit=" s" value={motion.flight} min={0.3} max={1.8} step={0.01} testId="demo-motion-flight" onChange={(flight) => patch({ flight })} />
      <Heading>{t("Easing")}</Heading>
      <div className="flex flex-wrap" style={{ gap: 6 }}>
        <Chip
          on={!customFlight && motion.flightEase === null}
          testId="demo-motion-flight-smooth"
          onPress={() => {
            setCustomFlight(false);
            patch({ flightEase: null });
          }}
        >
          {t("Smooth both ends")}
        </Chip>
        {EASES.map((item) => (
          <Chip
            key={item.key}
            on={!customFlight && sameEase(item.ease, motion.flightEase)}
            testId={`demo-motion-flight-${item.key}`}
            onPress={() => {
              setCustomFlight(false);
              patch({ flightEase: item.ease });
            }}
          >
            {t(item.key)}
          </Chip>
        ))}
        <Chip
          on={customFlight}
          testId="demo-motion-flight-custom"
          onPress={() => {
            setCustomFlight(true);
            patch({ flightEase: motion.flightEase ?? CURRENT_EASE });
          }}
        >
          {t("Custom")}
        </Chip>
      </div>
      {customFlight && motion.flightEase && <EaseSliders ease={motion.flightEase} onChange={(flightEase) => patch({ flightEase })} />}

      <p
        data-pw="demo-motion-values"
        dir="ltr"
        className="select-text"
        style={{ margin: "12px 0 8px", fontSize: 9, lineHeight: "12px", color: "#666", wordBreak: "break-all", fontFamily: "monospace" }}
      >
        {values}
      </p>
      <div className="flex flex-wrap" style={{ gap: 6 }}>
        <Chip
          on={copied}
          testId="demo-motion-copy"
          onPress={() => {
            void navigator.clipboard?.writeText(values).then(() => setCopied(true));
          }}
        >
          {t(copied ? "Copied" : "Copy values")}
        </Chip>
        <Chip
          on={false}
          testId="demo-motion-reset"
          onPress={() => {
            setCustomSheet(false);
            setCustomFlight(false);
            setMotion(CURRENT_MOTION);
          }}
        >
          {t("Reset")}
        </Chip>
      </div>
    </section>
  );
}

/** The round button with the demo's switches. It shows only while a product page is on show. */
export function BuyMotionButton({ t }: { t: (key: BuyMotionKey) => string }) {
  const available = useSyncExternalStore(subscribe, () => actions !== null, () => false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!available) setOpen(false);
  }, [available]);
  if (!available) return null;
  return (
    <>
      <button
        type="button"
        aria-label={t("Animation timing")}
        aria-expanded={open}
        data-pw="demo-motion-button"
        onClick={() => setOpen((now) => !now)}
        className="relative w-7 h-7 rounded-full shadow border border-gray-200 cursor-pointer flex items-center justify-center bg-white/90"
      >
        {/* A curve that starts fast and slows down. */}
        <svg aria-hidden="true" width={16} height={16} viewBox="0 0 16 16" fill="none">
          <path d="M2 14C4 6 7 3 14 2" stroke={PURPLE} strokeWidth={1.8} strokeLinecap="round" />
          <circle cx={2} cy={14} r={1.4} fill={PURPLE} />
          <circle cx={14} cy={2} r={1.4} fill={PURPLE} />
        </svg>
      </button>
      {open && createPortal(<Menu t={t} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
