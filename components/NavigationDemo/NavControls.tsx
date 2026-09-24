"use client";

import React, { useState } from "react";
import { buildSkin, DEFAULT_NAV_THEME, type NavTheme } from "./BottomNav";

/*
  The panel that lets somebody set the glass by hand.

  It owns no values of its own. The page holds the NavTheme and passes it down
  with an onChange, so the bar and the panel can never drift apart, and one
  "Reset" puts the measured look back.

  The copy line is the point of the whole thing: whoever picks the numbers can
  hand the CSS straight to whoever builds the real bar.

  This route sits outside app/(client)/[lang], so there is no locale and no
  translateFunction here. The labels are English, the same as the rest of the
  demo page.
*/

/** One labelled slider with its value shown on the right. */
function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block select-none">
      <span className="flex items-baseline justify-between pb-1.5">
        <span className="text-[11px] font-medium tracking-wide text-white/60">
          {label}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-white">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white outline-none"
      />
    </label>
  );
}

export default function NavControls({
  theme,
  onChange,
}: {
  theme: NavTheme;
  onChange: (next: NavTheme) => void;
}) {
  // Closed to start with. At phone width an open panel covers the very thing
  // it is there to style, so the bar gets the first look and the chip in the
  // corner opens the panel.
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof NavTheme>(key: K, value: NavTheme[K]) =>
    onChange({ ...theme, [key]: value });

  const skin = buildSkin(theme);
  const css = `backdrop-filter: ${skin.filter};\nbackground: ${skin.bar};`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard needs a secure origin and a permission. If it is refused,
      // the CSS is still on screen to read, so there is nothing to report.
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-3 top-3 z-[80] rounded-full border border-white/15 bg-black/70 px-3.5 py-2 text-[12px] font-semibold text-white backdrop-blur-md"
      >
        Style
      </button>
    );
  }

  return (
    <div
      className="fixed right-3 top-3 z-[80] w-[268px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-2xl border border-white/12 bg-black/72 p-3.5 text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      style={{ maxHeight: "calc(100vh - 24px)" }}
    >
      <div className="flex items-center justify-between pb-3">
        <p className="text-[12px] font-semibold">Bar style</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Hide the style panel"
          className="rounded-full px-2 py-0.5 text-[16px] leading-none text-white/50"
        >
          &times;
        </button>
      </div>

      <div className="flex flex-col gap-3.5">
        <Slider
          label="Blur"
          value={theme.blur}
          min={0}
          max={40}
          step={0.5}
          unit="px"
          onChange={(n) => set("blur", n)}
        />
        <Slider
          label="Saturation"
          value={theme.saturation}
          min={0}
          max={300}
          step={5}
          unit="%"
          onChange={(n) => set("saturation", n)}
        />
        <Slider
          label="Opacity"
          value={theme.opacity}
          min={0}
          max={1}
          step={0.01}
          onChange={(n) => set("opacity", n)}
        />

        <label className="block select-none">
          <span className="block pb-1.5 text-[11px] font-medium tracking-wide text-white/60">
            Colour
          </span>
          <span className="flex items-center gap-2">
            <input
              type="color"
              value={theme.color}
              onChange={(e) => set("color", e.target.value)}
              aria-label="Bar colour"
              className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-white/15 bg-transparent p-0.5"
            />
            <input
              type="text"
              value={theme.color}
              onChange={(e) => set("color", e.target.value)}
              aria-label="Bar colour as a hex value"
              spellCheck={false}
              className="w-full rounded-md border border-white/12 bg-white/8 px-2 py-1.5 font-mono text-[12px] uppercase text-white outline-none focus:border-white/35"
            />
          </span>
        </label>

        <div className="h-px bg-white/10" />

        <p className="text-[11px] font-semibold tracking-wide text-white/40">
          MOTION
        </p>

        <Slider
          label="Smallest size"
          value={theme.minScale}
          min={0.5}
          max={1}
          step={0.01}
          onChange={(n) => set("minScale", n)}
        />
        <Slider
          label="Scroll for full change"
          value={theme.distance}
          min={60}
          max={700}
          step={10}
          unit="px"
          onChange={(n) => set("distance", n)}
        />
        <p className="-mt-1 text-[10.5px] leading-snug text-white/35">
          Scroll this far, at an unhurried pace, and the bar covers the whole
          way between full size and the smallest size.
        </p>

        <Slider
          label="Speed effect"
          value={theme.speedEffect}
          min={0}
          max={2}
          step={0.05}
          unit="×"
          onChange={(n) => set("speedEffect", n)}
        />
        <p className="-mt-1 text-[10.5px] leading-snug text-white/35">
          How much a fast scroll counts for over a slow one. Set it to 0 and
          only the distance matters.
        </p>

        <div className="h-px bg-white/10" />

        <pre className="whitespace-pre-wrap break-all rounded-lg bg-white/6 p-2 font-mono text-[10.5px] leading-relaxed text-white/70">
          {css}
        </pre>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="flex-1 rounded-lg bg-white/12 py-1.5 text-[11.5px] font-semibold text-white"
          >
            {copied ? "Copied" : "Copy CSS"}
          </button>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_NAV_THEME)}
            className="flex-1 rounded-lg bg-white/12 py-1.5 text-[11.5px] font-semibold text-white"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
