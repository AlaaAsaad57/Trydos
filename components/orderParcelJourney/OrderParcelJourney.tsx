"use client";

import { useEffect, useRef, useState } from "react";
import { PARCEL_SVG } from "./parcelMarkup";
import {
  END_MS,
  REST_MS,
  collectParcelParts,
  msFromSvgX,
  renderParcelScene,
  statusAt,
  type ParcelStatus,
} from "./parcelMotion";

/*
  Trydos Order Journey v2 — Collaborative Multi-Actor Physics Relay.

  One requestAnimationFrame loop drives renderParcelScene() via pre-integrated
  ODE + wave cable physics directly on SVG attributes, keeping React re-renders
  scoped to milestone label and playback control state transitions.
*/

export type ParcelJourneyWords = {
  title: string;
  label: string;
  buy: string;
  preparing: string;
  shipped: string;
  out: string;
  delivered: string;
  today: string;
  inHour: string;
  inHours: string;
  inDays: string;
  inHands: string;
  expected: string;
  playAgain: string;
  play: string;
  pause: string;
  slow: string;
  normal: string;
  statusGroup: string;
};

type Shown = { reached: boolean[]; cur: number; delivered: boolean };

const STATUSES: ParcelStatus[] = [
  "buy",
  "preparing",
  "shipped",
  "out",
  "delivered",
];

const SPEEDS = [0.4, 1, 1.5] as const;

export default function OrderParcelJourney({
  words,
  rtl = false,
  restOn = null,
}: {
  words: ParcelJourneyWords;
  rtl?: boolean;
  restOn?: ParcelStatus | null;
}) {
  const stageRef = useRef<SVGSVGElement>(null);
  const control = useRef({
    ms: 0,
    mode: "play" as "play" | "seek" | "idle" | "paused" | "scrub",
    target: END_MS,
    idle: null as ParcelStatus | null,
    chosen: null as ParcelStatus | null,
    speed: 1,
    scrubbing: false,
  });

  const [shown, setShown] = useState<Shown>({
    reached: [false, false, false, false],
    cur: -1,
    delivered: false,
  });
  const [active, setActive] = useState<ParcelStatus | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    const svg = stageRef.current;
    if (!svg) return;
    const P = collectParcelParts(svg);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = control.current;

    if (restOn) {
      c.chosen = restOn;
      c.target = REST_MS[restOn];
      c.mode = "seek";
    }
    if (reduce) {
      c.ms = c.target;
      c.mode = "idle";
      setPlaying(false);
    }

    let last = performance.now();
    let raf = 0;
    let lastKey = "";
    let lastStatus: ParcelStatus | null = null;

    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;

      if (c.mode === "play") {
        c.ms = Math.min(END_MS, c.ms + dt * c.speed);
        if (c.ms >= END_MS) {
          c.mode = "idle";
          c.idle = "delivered";
          setPlaying(false);
        }
      } else if (c.mode === "seek") {
        c.ms = Math.min(c.target, c.ms + dt * 1.9 * c.speed);
        if (c.ms >= c.target) {
          c.mode = "idle";
          c.idle = c.chosen;
          setPlaying(false);
        }
      }

      const st = renderParcelScene(
        P,
        c.ms,
        now,
        c.mode === "idle" ? c.idle : null,
        reduce,
        c.scrubbing,
      );

      const key = `${st.delivered}${st.cur}${st.reached.join()}`;
      if (key !== lastKey) {
        lastKey = key;
        setShown(st);
      }

      const nowS = c.mode === "idle" && c.chosen ? c.chosen : statusAt(c.ms);
      if (nowS !== lastStatus) {
        lastStatus = nowS;
        setActive(nowS);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [restOn]);

  const reduceNow = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const togglePlay = () => {
    const c = control.current;
    if (reduceNow()) {
      c.ms = END_MS;
      c.mode = "idle";
      setPlaying(false);
      return;
    }
    if (c.mode === "play" || c.mode === "seek") {
      c.mode = "paused";
      c.idle = null;
      setPlaying(false);
    } else {
      if (c.ms >= END_MS - 10) c.ms = 0;
      c.chosen = null;
      c.idle = null;
      c.target = END_MS;
      c.mode = "play";
      setPlaying(true);
    }
  };

  const playAgain = () => {
    const c = control.current;
    c.chosen = null;
    c.idle = null;
    c.target = END_MS;
    if (reduceNow()) {
      c.ms = END_MS;
      c.mode = "idle";
      setPlaying(false);
      return;
    }
    c.ms = 0;
    c.mode = "play";
    setPlaying(true);
  };

  const choose = (s: ParcelStatus) => {
    const c = control.current;
    c.chosen = s;
    c.idle = null;
    c.target = REST_MS[s];
    if (reduceNow()) {
      c.ms = c.target;
      c.mode = "idle";
      setPlaying(false);
      return;
    }
    if (c.target < c.ms) c.ms = 0;
    c.mode = "seek";
    setPlaying(true);
  };

  const changeSpeed = (nextSpeed: number) => {
    control.current.speed = nextSpeed;
    setSpeed(nextSpeed);
  };

  const svgXFromClient = (clientX: number) => {
    const svg = stageRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const raw = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return (rtl ? 1 - raw : raw) * 880;
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element | null;
    if (!target?.classList?.contains("p-scrubHit")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const c = control.current;
    c.scrubbing = true;
    c.chosen = null;
    c.idle = null;
    c.mode = "scrub";
    c.ms = msFromSvgX(svgXFromClient(e.clientX));
    setPlaying(false);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const c = control.current;
    if (!c.scrubbing) return;
    c.ms = msFromSvgX(svgXFromClient(e.clientX));
  };

  const endScrub = (e: React.PointerEvent<SVGSVGElement>) => {
    const c = control.current;
    if (!c.scrubbing) return;
    c.scrubbing = false;
    c.mode = "paused";
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const labels: [string, string, ParcelStatus][] = [
    [words.buy, words.today, "buy"],
    [words.preparing, words.inHour, "preparing"],
    [words.shipped, words.inHours, "shipped"],
    [
      words.delivered,
      shown.delivered ? words.inHands : words.inDays,
      "delivered",
    ],
  ];

  const chipName: Record<ParcelStatus, string> = {
    buy: words.buy,
    preparing: words.preparing,
    shipped: words.shipped,
    out: words.out,
    delivered: words.delivered,
  };

  return (
    <div className="flex w-full flex-col items-center gap-[18px] font-sans">
      <div
        dir={rtl ? "rtl" : "ltr"}
        className="flex w-full max-w-[780px] flex-col rounded-[15px] bg-white px-[4px] pb-[16px] pt-[14px]"
      >
        <div className="flex flex-col gap-[4px] px-[16px]">
          <svg
            viewBox="0 0 30 30"
            aria-hidden="true"
            className="mb-[4px] h-[26px] w-[26px]"
          >
            <use href="#opj-ic-truck-body" />
            <use href="#opj-ic-truck-lines" />
          </svg>
          <div
            key={String(shown.delivered)}
            className="opj-swap min-h-[1.45em] text-[19px] text-[#1D1D1D] md:text-[16px]"
          >
            {shown.delivered ? (
              <>
                <b className="font-bold">{words.delivered}</b> | {words.inHands}
              </>
            ) : (
              <>
                {words.expected} | <b className="font-bold">{words.inDays}</b>
              </>
            )}
          </div>
        </div>

        <svg
          ref={stageRef}
          viewBox="0 -82 880 226"
          role="img"
          aria-label={words.label}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
          className="mt-[2px] block h-auto w-full touch-pan-y select-none"
          style={rtl ? { transform: "scaleX(-1)" } : undefined}
          dangerouslySetInnerHTML={{ __html: PARCEL_SVG }}
        />

        <div
          className="mt-[-4px] grid grid-cols-4 text-center"
          style={{ width: "calc(100% * 800 / 880)" }}
        >
          {labels.map(([name, when, status], i) => {
            const green = i === 3 && shown.reached[3];
            const weight =
              green || i === shown.cur
                ? "font-bold"
                : shown.reached[i]
                  ? "font-semibold"
                  : "font-normal";
            return (
              <button
                key={status}
                type="button"
                onClick={() => choose(status)}
                className="flex min-w-0 cursor-pointer flex-col gap-[1px] bg-transparent px-[2px] text-center transition-opacity hover:opacity-80"
              >
                <strong
                  className={`text-[15px] md:text-[13px] ${weight} ${
                    green ? "text-[#26C13F]" : "text-[#1D1D1D]"
                  } transition-colors duration-[400ms]`}
                >
                  {name}
                </strong>
                <span className="text-[11px] text-[#404040] md:text-[9.5px]">
                  {when}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex w-full max-w-[780px] flex-col gap-[10px] px-[4px]">
        <div className="flex flex-wrap items-center gap-[8px]">
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-full border border-[#1D1D1D] bg-[#1D1D1D] px-[14px] py-[7px] text-[13px] font-semibold text-white transition-transform active:scale-95"
          >
            {playing ? `⏸ ${words.pause}` : `▶ ${words.play}`}
          </button>

          <button
            type="button"
            onClick={playAgain}
            className="rounded-full border border-[#E8E8E8] bg-white px-[14px] py-[7px] text-[13px] font-semibold text-[#1D1D1D] transition-colors hover:border-[#CFCFCF]"
          >
            ↻ {words.playAgain}
          </button>

          <div className="flex items-center rounded-full border border-[#E8E8E8] bg-white p-[3px]">
            {SPEEDS.map((spVal) => {
              const selected = speed === spVal;
              return (
                <button
                  key={spVal}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => changeSpeed(spVal)}
                  className={`rounded-full px-[10px] py-[4px] text-[12px] font-semibold transition-colors ${
                    selected
                      ? "bg-[#1D1D1D] text-white"
                      : "text-[#404040] hover:text-[#1D1D1D]"
                  }`}
                >
                  {`×${spVal}`}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="flex flex-wrap gap-[8px]"
          role="group"
          aria-label={words.statusGroup}
        >
          {STATUSES.map((s) => {
            const isActive = active === s;
            const isGreen = isActive && s === "delivered";
            return (
              <button
                key={s}
                type="button"
                aria-pressed={isActive}
                onClick={() => choose(s)}
                className={`rounded-[12px] border px-[14px] py-[7px] text-[13px] font-semibold transition-colors ${
                  isGreen
                    ? "border-[#26C13F] bg-[#E8FFED] text-[#26C13F]"
                    : isActive
                      ? "border-[#402CDD] bg-[#ECE9FF] text-[#402CDD]"
                      : "border-[#E8E8E8] bg-white text-[#1D1D1D]"
                }`}
              >
                {chipName[s]}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`.opj-swap{animation:opj-swap .4s cubic-bezier(.32,.72,0,1)}@keyframes opj-swap{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){.opj-swap{animation:none}}`}</style>
    </div>
  );
}
