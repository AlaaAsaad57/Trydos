"use client";

import { useEffect, useRef, useState } from "react";
import { JOURNEY_SVG } from "./journeyMarkup";
import {
  END_MS,
  REST_MS,
  collectParts,
  renderScene,
  statusAt,
  type JourneyStatus,
} from "./journeyMotion";

/*
  The animated order timeline: Buy → Preparing → Shipped → Delivered.

  React draws the card once. After that, one requestAnimationFrame loop calls
  renderScene(), which writes SVG attributes straight onto the stage. React only
  re-renders when a label or the title has to change (a few times per story),
  never once per frame.

  Words come in through `words`, already translated on the server.
*/

export type JourneyWords = {
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
  slow: string;
  statusGroup: string;
};

type Shown = { reached: boolean[]; cur: number; delivered: boolean };

const STATUSES: JourneyStatus[] = ["buy", "preparing", "shipped", "out", "delivered"];

export default function OrderJourney({
  words,
  rtl = false,
  restOn = null,
}: {
  words: JourneyWords;
  rtl?: boolean;
  /* Rest on this status instead of playing the whole story (for a real order). */
  restOn?: JourneyStatus | null;
}) {
  const stageRef = useRef<SVGSVGElement>(null);
  const control = useRef({ ms: 0, mode: "play" as "play" | "seek" | "idle", target: END_MS, idle: null as JourneyStatus | null, chosen: null as JourneyStatus | null, speed: 1 });
  const [shown, setShown] = useState<Shown>({ reached: [false, false, false, false], cur: -1, delivered: false });
  const [active, setActive] = useState<JourneyStatus | null>(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const svg = stageRef.current;
    if (!svg) return;
    const S = collectParts(svg);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = control.current;
    if (restOn) { c.chosen = restOn; c.target = REST_MS[restOn]; c.mode = "seek"; }
    if (reduce) { c.ms = c.target; c.mode = "idle"; }

    let last = performance.now(), raf = 0, lastKey = "", lastStatus: JourneyStatus | null = null;
    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      if (c.mode === "play") {
        c.ms = Math.min(END_MS, c.ms + dt * c.speed);
        if (c.ms >= END_MS) c.mode = "idle";
      } else if (c.mode === "seek") {
        c.ms = Math.min(c.target, c.ms + dt * 1.8 * c.speed);
        if (c.ms >= c.target) { c.mode = "idle"; c.idle = c.chosen === "delivered" ? null : c.chosen; }
      }
      const st = renderScene(S, c.ms, now, c.mode === "idle" ? c.idle : null, reduce);
      const key = `${st.delivered}${st.cur}${st.reached.join()}`;
      if (key !== lastKey) { lastKey = key; setShown(st); }
      const now_s = c.mode === "idle" && c.chosen ? c.chosen : statusAt(c.ms);
      if (now_s !== lastStatus) { lastStatus = now_s; setActive(now_s); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [restOn]);

  const reduceNow = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const playAgain = () => {
    const c = control.current;
    c.chosen = null; c.idle = null; c.target = END_MS;
    if (reduceNow()) { c.ms = END_MS; c.mode = "idle"; return; }
    c.ms = 0; c.mode = "play";
  };
  const choose = (s: JourneyStatus) => {
    const c = control.current;
    c.chosen = s; c.idle = null; c.target = REST_MS[s];
    if (reduceNow()) { c.ms = c.target; c.mode = "idle"; return; }
    if (c.target < c.ms) c.ms = 0;
    c.mode = "seek";
  };
  const toggleSlow = () => {
    const c = control.current;
    c.speed = c.speed === 1 ? 0.4 : 1;
    setSlow(c.speed !== 1);
  };

  const labels: [string, string][] = [
    [words.buy, words.today],
    [words.preparing, words.inHour],
    [words.shipped, words.inHours],
    [words.delivered, shown.delivered ? words.inHands : words.inDays],
  ];
  const chipName: Record<JourneyStatus, string> = { buy: words.buy, preparing: words.preparing, shipped: words.shipped, out: words.out, delivered: words.delivered };

  return (
    <div className="flex w-full flex-col items-center gap-[18px] font-sans">
      <div dir={rtl ? "rtl" : "ltr"} className="flex w-full max-w-[780px] flex-col rounded-[15px] bg-white px-[4px] pb-[16px] pt-[14px]">
        <div className="flex flex-col gap-[4px] px-[16px]">
          <svg viewBox="0 0 30 30" aria-hidden="true" className="mb-[4px] h-[26px] w-[26px]">
            <use href="#oj-ic-truck-body" />
            <use href="#oj-ic-truck-lines" />
          </svg>
          <div key={String(shown.delivered)} className="oj-swap min-h-[1.45em] text-[19px] text-[#1D1D1D] md:text-[16px]">
            {shown.delivered ? (
              <><b className="font-bold">{words.delivered}</b> | {words.inHands}</>
            ) : (
              <>{words.expected} | <b className="font-bold">{words.inDays}</b></>
            )}
          </div>
        </div>

        <svg
          ref={stageRef}
          viewBox="0 -62 880 196"
          role="img"
          aria-label={words.label}
          className="mt-[2px] block h-auto w-full"
          style={rtl ? { transform: "scaleX(-1)" } : undefined}
          dangerouslySetInnerHTML={{ __html: JOURNEY_SVG }}
        />

        <div className="mt-[-4px] grid grid-cols-4 text-center" style={{ width: "calc(100% * 800 / 880)" }}>
          {labels.map(([name, when], i) => {
            const green = i === 3 && shown.reached[3];
            const weight = green || i === shown.cur ? "font-bold" : shown.reached[i] ? "font-semibold" : "font-normal";
            return (
              <div key={i} className="flex min-w-0 flex-col gap-[1px] px-[2px]">
                <strong className={`text-[15px] md:text-[13px] ${weight} ${green ? "text-[#26C13F]" : "text-[#1D1D1D]"} transition-colors duration-[400ms]`}>{name}</strong>
                <span className="text-[11px] text-[#404040] md:text-[9.5px]">{when}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex w-full max-w-[780px] flex-col gap-[10px] px-[4px]">
        <div className="flex flex-wrap gap-[8px]">
          <button type="button" onClick={playAgain} className="rounded-full border border-[#1D1D1D] bg-[#1D1D1D] px-[14px] py-[7px] text-[13px] font-semibold text-white">
            ▶ {words.playAgain}
          </button>
          <button
            type="button"
            aria-pressed={slow}
            onClick={toggleSlow}
            className={`rounded-full border px-[14px] py-[7px] text-[13px] font-semibold ${slow ? "border-[#1D1D1D] bg-[#1D1D1D] text-white" : "border-[#E8E8E8] bg-white text-[#1D1D1D]"}`}
          >
            {words.slow} ×0.4
          </button>
        </div>
        <div className="flex flex-wrap gap-[8px]" role="group" aria-label={words.statusGroup}>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={active === s}
              onClick={() => choose(s)}
              className={`rounded-[12px] border px-[14px] py-[7px] text-[13px] font-semibold transition-colors ${active === s ? "border-[#402CDD] bg-[#ECE9FF] text-[#402CDD]" : "border-[#E8E8E8] bg-white text-[#1D1D1D]"}`}
            >
              {chipName[s]}
            </button>
          ))}
        </div>
      </div>

      <style>{`.oj-swap{animation:oj-swap .4s cubic-bezier(.32,.72,0,1)}@keyframes oj-swap{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){.oj-swap{animation:none}}`}</style>
    </div>
  );
}
